using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Proctor;

public class IdentityVerificationService : IIdentityVerificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<IdentityVerificationService> _logger;

    public IdentityVerificationService(ApplicationDbContext context, ILogger<IdentityVerificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // ─── List ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<PaginatedResponse<IdentityVerificationListDto>>> GetVerificationsAsync(
        IdentityVerificationSearchDto searchDto)
    {
        var query = _context.IdentityVerifications
            .Include(v => v.Candidate)
            .Include(v => v.ProctorSession)
                .ThenInclude(s => s.Exam)
            .AsQueryable();

        // ── Filters ──
        if (searchDto.Status.HasValue)
            query = query.Where(v => v.Status == searchDto.Status.Value);

        if (searchDto.ExamId.HasValue)
            query = query.Where(v => v.ExamId == searchDto.ExamId.Value);

        if (!string.IsNullOrEmpty(searchDto.AssignedProctorId))
            query = query.Where(v => v.AssignedProctorId == searchDto.AssignedProctorId);

        if (searchDto.DateFrom.HasValue)
            query = query.Where(v => v.SubmittedAt >= searchDto.DateFrom.Value);

        if (searchDto.DateTo.HasValue)
            query = query.Where(v => v.SubmittedAt <= searchDto.DateTo.Value);

        if (!string.IsNullOrEmpty(searchDto.RiskLevel))
        {
            query = searchDto.RiskLevel.ToLower() switch
            {
                "low" => query.Where(v => v.RiskScore <= 20),
                "medium" => query.Where(v => v.RiskScore > 20 && v.RiskScore <= 50),
                "high" => query.Where(v => v.RiskScore > 50 && v.RiskScore <= 75),
                "critical" => query.Where(v => v.RiskScore > 75),
                _ => query
            };
        }

        if (!string.IsNullOrEmpty(searchDto.Search))
        {
            var s = searchDto.Search.ToLower();
            query = query.Where(v =>
                (v.Candidate.FullName != null && v.Candidate.FullName.ToLower().Contains(s)) ||
                (v.Candidate.DisplayName != null && v.Candidate.DisplayName.ToLower().Contains(s)));
        }

        query = query.OrderByDescending(v => v.SubmittedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        var dtoItems = items.Select(MapToListDto).ToList();

        // ── Sample fallback ──
        if (totalCount == 0)
        {
            dtoItems = GenerateSampleVerifications();
            totalCount = dtoItems.Count;
        }

        return ApiResponse<PaginatedResponse<IdentityVerificationListDto>>.SuccessResponse(
            new PaginatedResponse<IdentityVerificationListDto>
            {
                Items = dtoItems,
                PageNumber = searchDto.PageNumber,
                PageSize = searchDto.PageSize,
                TotalCount = totalCount
            });
    }

    // ─── Detail ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<IdentityVerificationDetailDto>> GetVerificationDetailAsync(int id)
    {
        // Handle sample IDs
        if (id < 0)
        {
            var sample = GenerateSampleDetail(id);
            return sample != null
                ? ApiResponse<IdentityVerificationDetailDto>.SuccessResponse(sample)
                : ApiResponse<IdentityVerificationDetailDto>.FailureResponse("Not found");
        }

        var entity = await _context.IdentityVerifications
            .Include(v => v.Candidate)
            .Include(v => v.ProctorSession)
                .ThenInclude(s => s.Exam)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (entity == null)
            return ApiResponse<IdentityVerificationDetailDto>.FailureResponse("Verification not found");

        return ApiResponse<IdentityVerificationDetailDto>.SuccessResponse(MapToDetailDto(entity));
    }

    // ─── Single Action ──────────────────────────────────────────────────────

    public async Task<ApiResponse<IdentityVerificationListDto>> ApplyActionAsync(
        IdentityVerificationActionDto dto, string reviewerId)
    {
        var entity = await _context.IdentityVerifications
            .Include(v => v.Candidate)
            .Include(v => v.ProctorSession).ThenInclude(s => s.Exam)
            .FirstOrDefaultAsync(v => v.Id == dto.Id);

        if (entity == null)
            return ApiResponse<IdentityVerificationListDto>.FailureResponse("Verification not found");

        var status = ParseAction(dto.Action);
        if (status == null)
            return ApiResponse<IdentityVerificationListDto>.FailureResponse(
                $"Invalid action '{dto.Action}'. Use Approve, Reject, or Flag.");

        entity.Status = status.Value;
        entity.ReviewedBy = reviewerId;
        entity.ReviewedAt = DateTime.UtcNow;
        entity.ReviewNotes = dto.Reason;
        entity.UpdatedBy = reviewerId;
        entity.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<IdentityVerificationListDto>.SuccessResponse(
            MapToListDto(entity), $"Verification {dto.Action}d successfully");
    }

    // ─── Bulk Action (Transaction-safe) ─────────────────────────────────────

    public async Task<ApiResponse<BulkActionResultDto>> ApplyBulkActionAsync(
        IdentityVerificationBulkActionDto dto, string reviewerId)
    {
        var result = new BulkActionResultDto { TotalRequested = dto.Ids.Count };

        var status = ParseAction(dto.Action);
        if (status == null)
            return ApiResponse<BulkActionResultDto>.FailureResponse(
                $"Invalid action '{dto.Action}'. Use Approve, Reject, or Flag.");

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var entities = await _context.IdentityVerifications
                .Where(v => dto.Ids.Contains(v.Id))
                .ToListAsync();

            foreach (var entity in entities)
            {
                try
                {
                    entity.Status = status.Value;
                    entity.ReviewedBy = reviewerId;
                    entity.ReviewedAt = DateTime.UtcNow;
                    entity.ReviewNotes = dto.Reason;
                    entity.UpdatedBy = reviewerId;
                    entity.UpdatedDate = DateTime.UtcNow;
                    result.Succeeded++;
                }
                catch (Exception ex)
                {
                    result.Failed++;
                    result.Errors.Add($"ID {entity.Id}: {ex.Message}");
                }
            }

            // Track IDs not found
            var foundIds = entities.Select(e => e.Id).ToHashSet();
            foreach (var id in dto.Ids.Where(id => !foundIds.Contains(id)))
            {
                result.Failed++;
                result.Errors.Add($"ID {id}: Not found");
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return ApiResponse<BulkActionResultDto>.SuccessResponse(
                result, $"Bulk {dto.Action} completed: {result.Succeeded} succeeded, {result.Failed} failed");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ApiResponse<BulkActionResultDto>.FailureResponse($"Bulk action failed: {ex.Message}");
        }
    }

    // ─── Private helpers ────────────────────────────────────────────────────

    // ─── Submit Verification (Candidate) ────────────────────────────────────
    public async Task<ApiResponse<CandidateVerificationSubmitResultDto>> SubmitVerificationAsync(
        string candidateId, string? idDocumentType, string? idNumber,
        string selfiePath, string idDocumentPath, string? deviceInfo, string? ipAddress)
    {
        var now = DateTime.UtcNow;

        // Check if candidate already has a pending/approved verification
        var existing = await _context.IdentityVerifications
            .Where(v => v.CandidateId == candidateId && !v.IsDeleted
                && (v.Status == IdentityVerificationStatus.Pending || v.Status == IdentityVerificationStatus.Approved))
            .FirstOrDefaultAsync();

        if (existing != null && existing.Status == IdentityVerificationStatus.Approved)
        {
            return ApiResponse<CandidateVerificationSubmitResultDto>.SuccessResponse(
                new CandidateVerificationSubmitResultDto
                {
                    VerificationId = existing.Id,
                    Status = "Approved",
                    Message = "Identity already verified."
                });
        }

        if (existing != null && existing.Status == IdentityVerificationStatus.Pending)
        {
            // Update existing pending verification
            existing.SelfiePath = selfiePath;
            existing.IdDocumentPath = idDocumentPath;
            existing.IdDocumentType = idDocumentType;
            existing.IdDocumentUploaded = true;
            existing.DeviceInfo = deviceInfo;
            existing.IpAddress = ipAddress;
            existing.SubmittedAt = now;
            existing.UpdatedDate = now;
            existing.UpdatedBy = candidateId;
            // Simulate face match score (random 75-99 for demo)
            existing.FaceMatchScore = new Random().Next(75, 99);
            existing.LivenessResult = LivenessResult.Passed;
            existing.RiskScore = new Random().Next(5, 30);

            await _context.SaveChangesAsync();

            _logger.LogInformation("[Verification] Candidate {CandidateId} re-submitted verification {Id}", candidateId, existing.Id);

            return ApiResponse<CandidateVerificationSubmitResultDto>.SuccessResponse(
                new CandidateVerificationSubmitResultDto
                {
                    VerificationId = existing.Id,
                    Status = "Pending",
                    Message = "Verification re-submitted for review."
                });
        }

        // Create new verification
        var verification = new IdentityVerification
        {
            CandidateId = candidateId,
            ProctorSessionId = null, // No proctoring session - standalone verification
            AttemptId = null,
            ExamId = null,
            SelfiePath = selfiePath,
            IdDocumentPath = idDocumentPath,
            IdDocumentType = idDocumentType ?? "Emirates ID",
            IdDocumentUploaded = true,
            // Simulate face match score for demo
            FaceMatchScore = new Random().Next(75, 99),
            LivenessResult = LivenessResult.Passed,
            RiskScore = new Random().Next(5, 30),
            Status = IdentityVerificationStatus.Pending,
            DeviceInfo = deviceInfo,
            IpAddress = ipAddress,
            SubmittedAt = now,
            CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.IdentityVerifications.Add(verification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("[Verification] Candidate {CandidateId} submitted verification {Id}", candidateId, verification.Id);

        return ApiResponse<CandidateVerificationSubmitResultDto>.SuccessResponse(
            new CandidateVerificationSubmitResultDto
            {
                VerificationId = verification.Id,
                Status = "Pending",
                Message = "Verification submitted successfully. Awaiting review."
            });
    }

    // ─── Get Candidate Status ───────────────────────────────────────────────
    public async Task<ApiResponse<CandidateVerificationStatusDto>> GetCandidateStatusAsync(string candidateId)
    {
        var latest = await _context.IdentityVerifications
            .Where(v => v.CandidateId == candidateId && !v.IsDeleted)
            .OrderByDescending(v => v.SubmittedAt)
            .FirstOrDefaultAsync();

        if (latest == null)
        {
            return ApiResponse<CandidateVerificationStatusDto>.SuccessResponse(
                new CandidateVerificationStatusDto
                {
                    HasSubmitted = false,
                    Status = "None"
                });
        }

        return ApiResponse<CandidateVerificationStatusDto>.SuccessResponse(
            new CandidateVerificationStatusDto
            {
                HasSubmitted = true,
                Status = latest.Status.ToString(),
                ReviewNotes = latest.ReviewNotes,
                SubmittedAt = latest.SubmittedAt,
                ReviewedAt = latest.ReviewedAt
            });
    }

    // ─── Private helpers (original) ─────────────────────────────────────────

    private static IdentityVerificationStatus? ParseAction(string action) =>
        action.ToLower() switch
        {
            "approve" => IdentityVerificationStatus.Approved,
            "reject" => IdentityVerificationStatus.Rejected,
            "flag" => IdentityVerificationStatus.Flagged,
            _ => null
        };

    private IdentityVerificationListDto MapToListDto(IdentityVerification v) => new()
    {
        Id = v.Id,
        ProctorSessionId = v.ProctorSessionId ?? 0,
        AttemptId = v.AttemptId ?? 0,
        ExamId = v.ExamId ?? 0,
        ExamTitleEn = v.ProctorSession?.Exam?.TitleEn ?? "",
        CandidateId = v.CandidateId,
        CandidateName = v.Candidate?.FullName ?? v.Candidate?.DisplayName ?? "",
        IdDocumentUploaded = v.IdDocumentUploaded,
        FaceMatchScore = v.FaceMatchScore,
        LivenessResult = v.LivenessResult,
        RiskScore = v.RiskScore,
        Status = v.Status,
        AssignedProctorId = v.AssignedProctorId,
        AssignedProctorName = null, // populated separately if needed
        SubmittedAt = v.SubmittedAt
    };

    private IdentityVerificationDetailDto MapToDetailDto(IdentityVerification v) => new()
    {
        Id = v.Id,
        ProctorSessionId = v.ProctorSessionId ?? 0,
        AttemptId = v.AttemptId ?? 0,
        ExamId = v.ExamId ?? 0,
        ExamTitleEn = v.ProctorSession?.Exam?.TitleEn ?? "",
        CandidateId = v.CandidateId,
        CandidateName = v.Candidate?.FullName ?? v.Candidate?.DisplayName ?? "",
        IdDocumentUploaded = v.IdDocumentUploaded,
        IdDocumentUrl = !string.IsNullOrWhiteSpace(v.IdDocumentPath)
            ? v.IdDocumentPath.StartsWith("candidateIDs/")
                ? $"/{v.IdDocumentPath}"
                : $"/media/{v.IdDocumentPath.TrimStart('/')}"
            : null,
        IdDocumentType = v.IdDocumentType,
        SelfieUrl = !string.IsNullOrWhiteSpace(v.SelfiePath)
            ? v.SelfiePath.StartsWith("candidateIDs/")
                ? $"/{v.SelfiePath}"
                : $"/media/{v.SelfiePath.TrimStart('/')}"
            : null,
        FaceMatchScore = v.FaceMatchScore,
        LivenessResult = v.LivenessResult,
        RiskScore = v.RiskScore,
        Status = v.Status,
        ReviewedBy = v.ReviewedBy,
        ReviewedAt = v.ReviewedAt,
        ReviewNotes = v.ReviewNotes,
        AssignedProctorId = v.AssignedProctorId,
        DeviceInfo = v.DeviceInfo,
        IpAddress = v.IpAddress,
        SubmittedAt = v.SubmittedAt,
        AuditLogs = new List<IdentityAuditLogDto>
        {
            new() { Timestamp = v.SubmittedAt, Action = "Submitted", Details = "Identity verification submitted" }
        }
    };

    // ─── Sample data (demo fallback) ────────────────────────────────────────

    private static List<IdentityVerificationListDto> GenerateSampleVerifications()
    {
        var now = DateTime.UtcNow;
        return new List<IdentityVerificationListDto>
        {
            new()
            {
                Id = -1, ProctorSessionId = -1, AttemptId = -1, ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-1", CandidateName = "Sarah Ahmed",
                IdDocumentUploaded = true, FaceMatchScore = 94.5m,
                LivenessResult = LivenessResult.Passed, RiskScore = 8m,
                Status = IdentityVerificationStatus.Pending,
                SubmittedAt = now.AddMinutes(-12)
            },
            new()
            {
                Id = -2, ProctorSessionId = -2, AttemptId = -2, ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-2", CandidateName = "Omar Khalid",
                IdDocumentUploaded = true, FaceMatchScore = 67.2m,
                LivenessResult = LivenessResult.Inconclusive, RiskScore = 45m,
                Status = IdentityVerificationStatus.Flagged,
                SubmittedAt = now.AddMinutes(-8)
            },
            new()
            {
                Id = -3, ProctorSessionId = -3, AttemptId = -3, ExamId = -2,
                ExamTitleEn = "Data Structures — Midterm",
                CandidateId = "sample-3", CandidateName = "Layla Hassan",
                IdDocumentUploaded = false, FaceMatchScore = null,
                LivenessResult = LivenessResult.NotChecked, RiskScore = 72m,
                Status = IdentityVerificationStatus.Pending,
                SubmittedAt = now.AddMinutes(-5)
            }
        };
    }

    private static IdentityVerificationDetailDto? GenerateSampleDetail(int id)
    {
        var now = DateTime.UtcNow;
        return id switch
        {
            -1 => new IdentityVerificationDetailDto
            {
                Id = -1,
                ProctorSessionId = -1,
                AttemptId = -1,
                ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-1",
                CandidateName = "Sarah Ahmed",
                IdDocumentUploaded = true,
                IdDocumentType = "National ID",
                FaceMatchScore = 94.5m,
                LivenessResult = LivenessResult.Passed,
                RiskScore = 8m,
                Status = IdentityVerificationStatus.Pending,
                DeviceInfo = "{\"browser\":\"Chrome 120\",\"os\":\"Windows 11\"}",
                IpAddress = "192.168.1.100",
                SubmittedAt = now.AddMinutes(-12),
                AuditLogs = new List<IdentityAuditLogDto>
                {
                    new() { Timestamp = now.AddMinutes(-12), Action = "Submitted", Details = "Identity verification submitted" },
                    new() { Timestamp = now.AddMinutes(-11), Action = "ID Uploaded", Details = "National ID uploaded" },
                    new() { Timestamp = now.AddMinutes(-10), Action = "Selfie Captured", Details = "Face match: 94.5%" },
                    new() { Timestamp = now.AddMinutes(-10), Action = "Liveness Passed", Details = "Liveness check completed" }
                }
            },
            -2 => new IdentityVerificationDetailDto
            {
                Id = -2,
                ProctorSessionId = -2,
                AttemptId = -2,
                ExamId = -1,
                ExamTitleEn = "Introduction to Computer Science — Final",
                CandidateId = "sample-2",
                CandidateName = "Omar Khalid",
                IdDocumentUploaded = true,
                IdDocumentType = "Passport",
                FaceMatchScore = 67.2m,
                LivenessResult = LivenessResult.Inconclusive,
                RiskScore = 45m,
                Status = IdentityVerificationStatus.Flagged,
                DeviceInfo = "{\"browser\":\"Firefox 121\",\"os\":\"macOS 14\"}",
                IpAddress = "10.0.0.55",
                SubmittedAt = now.AddMinutes(-8),
                AuditLogs = new List<IdentityAuditLogDto>
                {
                    new() { Timestamp = now.AddMinutes(-8), Action = "Submitted", Details = "Identity verification submitted" },
                    new() { Timestamp = now.AddMinutes(-7), Action = "ID Uploaded", Details = "Passport uploaded" },
                    new() { Timestamp = now.AddMinutes(-6), Action = "Face Match Low", Details = "Face match: 67.2% — below threshold" },
                    new() { Timestamp = now.AddMinutes(-6), Action = "Flagged", PerformedBy = "System", Details = "Auto-flagged: low face match + inconclusive liveness" }
                }
            },
            -3 => new IdentityVerificationDetailDto
            {
                Id = -3,
                ProctorSessionId = -3,
                AttemptId = -3,
                ExamId = -2,
                ExamTitleEn = "Data Structures — Midterm",
                CandidateId = "sample-3",
                CandidateName = "Layla Hassan",
                IdDocumentUploaded = false,
                LivenessResult = LivenessResult.NotChecked,
                RiskScore = 72m,
                Status = IdentityVerificationStatus.Pending,
                DeviceInfo = "{\"browser\":\"Safari 17\",\"os\":\"iOS 17\"}",
                IpAddress = "172.16.0.22",
                SubmittedAt = now.AddMinutes(-5),
                AuditLogs = new List<IdentityAuditLogDto>
                {
                    new() { Timestamp = now.AddMinutes(-5), Action = "Submitted", Details = "Identity verification submitted" },
                    new() { Timestamp = now.AddMinutes(-4), Action = "ID Missing", Details = "ID document not uploaded" }
                }
            },
            _ => null
        };
    }
}
