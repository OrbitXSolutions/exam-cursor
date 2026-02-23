using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.AttemptControl;
using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.AttemptControl;
using Smart_Core.Application.Interfaces.Audit;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Hubs;

namespace Smart_Core.Infrastructure.Services.AttemptControl;

public class AttemptControlService : IAttemptControlService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<ProctorHub> _proctorHub;
    private readonly IAuditService _auditService;

    public AttemptControlService(ApplicationDbContext db, IHubContext<ProctorHub> proctorHub, IAuditService auditService)
    {
        _db = db;
        _proctorHub = proctorHub;
        _auditService = auditService;
    }

    // ── List active attempts with enriched flags ───────────────
    public async Task<ApiResponse<PaginatedResponse<AttemptControlItemDto>>> GetAttemptsAsync(
        AttemptControlFilterDto filter)
    {
        // Default to active statuses only
        var activeStatuses = new[]
        {
            AttemptStatus.Started,
            AttemptStatus.InProgress,
            AttemptStatus.Paused,
            AttemptStatus.Resumed
        };

        var query = _db.Attempts
            .Include(a => a.Exam)
            .Include(a => a.Candidate)
            .Where(a => !a.IsDeleted);

        // Status filter
        if (!string.IsNullOrWhiteSpace(filter.Status)
            && !filter.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<AttemptStatus>(filter.Status, true, out var parsed))
                query = query.Where(a => a.Status == parsed);
        }
        else
        {
            // Default: active attempts only
            query = query.Where(a => activeStatuses.Contains(a.Status));
        }

        // Exam filter
        if (filter.ExamId.HasValue && filter.ExamId > 0)
            query = query.Where(a => a.ExamId == filter.ExamId.Value);

        // Batch filter — join through BatchCandidates
        if (filter.BatchId.HasValue && filter.BatchId > 0)
        {
            var batchCandidateIds = await _db.BatchCandidates
                .Where(bc => bc.BatchId == filter.BatchId.Value)
                .Select(bc => bc.CandidateId)
                .ToListAsync();
            query = query.Where(a => batchCandidateIds.Contains(a.CandidateId));
        }

        // Search (RollNo / Email / Name)
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(a =>
                (a.Candidate.FullName != null && a.Candidate.FullName.ToLower().Contains(s)) ||
                (a.Candidate.FullNameAr != null && a.Candidate.FullNameAr.ToLower().Contains(s)) ||
                a.Candidate.Email!.ToLower().Contains(s) ||
                (a.Candidate.RollNo != null && a.Candidate.RollNo.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();

        var attempts = await query
            .OrderByDescending(a => a.StartedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new
            {
                a.Id,
                a.CandidateId,
                a.Candidate.RollNo,
                CandidateFullName = a.Candidate.FullName,
                CandidateFullNameAr = a.Candidate.FullNameAr,
                a.ExamId,
                a.Exam.TitleEn,
                a.Exam.TitleAr,
                a.StartedAt,
                a.ExpiresAt,
                a.SubmittedAt,
                a.Status,
                a.LastActivityAt,
                a.ExtraTimeSeconds,
                a.ResumeCount,
                a.IPAddress,
                a.DeviceInfo,
                a.ExpiryReason,
                a.ResumedFromAttemptId,
                ExamEndAt = a.Exam.EndAt,
            })
            .ToListAsync();

        var now = DateTime.UtcNow;

        var items = attempts.Select(a =>
        {
            var remaining = CalculateRemainingSeconds(a.Status, a.ExpiresAt, a.SubmittedAt, now);
            var statusName = a.Status.ToString();

            return new AttemptControlItemDto
            {
                AttemptId = a.Id,
                CandidateId = a.CandidateId,
                RollNo = a.RollNo,
                FullName = a.CandidateFullName,
                FullNameAr = a.CandidateFullNameAr,
                ExamId = a.ExamId,
                ExamTitleEn = a.TitleEn,
                ExamTitleAr = a.TitleAr,
                StartedAt = a.StartedAt,
                RemainingSeconds = remaining,
                Status = statusName,
                LastActivityAt = a.LastActivityAt,
                ExtraTimeSeconds = a.ExtraTimeSeconds,
                ResumeCount = a.ResumeCount,
                IPAddress = a.IPAddress,
                DeviceInfo = a.DeviceInfo,
                ExpiryReason = a.ExpiryReason != Domain.Enums.ExpiryReason.None ? a.ExpiryReason.ToString() : null,
                ResumedFromAttemptId = a.ResumedFromAttemptId,

                // Business rule flags
                CanForceEnd = a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Paused || a.Status == AttemptStatus.Resumed,
                CanResume = a.Status == AttemptStatus.Paused
                            && remaining > 0
                            && (a.ExamEndAt == null || a.ExamEndAt > now),
                CanAddTime = a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed,
            };
        }).ToList();

        return ApiResponse<PaginatedResponse<AttemptControlItemDto>>.SuccessResponse(
            new PaginatedResponse<AttemptControlItemDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    // ── Force End ──────────────────────────────────────────────
    public async Task<ApiResponse<ForceEndResultDto>> ForceEndAsync(ForceEndAttemptDto dto, string adminUserId)
    {
        if (dto.AttemptId <= 0)
            return ApiResponse<ForceEndResultDto>.FailureResponse("AttemptId is required.");

        var attempt = await _db.Attempts.FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<ForceEndResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.InProgress && attempt.Status != AttemptStatus.Paused && attempt.Status != AttemptStatus.Resumed)
            return ApiResponse<ForceEndResultDto>.FailureResponse(
                $"Cannot force-end an attempt with status '{attempt.Status}'. Only InProgress, Paused, or Resumed attempts can be force-ended.");

        var now = DateTime.UtcNow;

        attempt.Status = AttemptStatus.ForceSubmitted;
        attempt.SubmittedAt = now;
        attempt.ForceSubmittedBy = adminUserId;
        attempt.ForceSubmittedAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        // Log event
        _db.AttemptEvents.Add(new Domain.Entities.Attempt.AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.ForceEnded,
            OccurredAt = now,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                adminUserId,
                reason = dto.Reason,
                previousStatus = attempt.Status.ToString(),
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        // Close proctor session as Cancelled on force-end
        var proctorSession = await _db.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.AttemptId == attempt.Id && s.Status == ProctorSessionStatus.Active);
        if (proctorSession != null)
        {
            proctorSession.Status = ProctorSessionStatus.Cancelled;
            proctorSession.EndedAt = now;
            proctorSession.UpdatedDate = now;
            proctorSession.UpdatedBy = adminUserId;
        }

        await _db.SaveChangesAsync();

        // Audit log (fire-and-forget)
        _ = Task.Run(async () =>
        {
            try
            {
                await _auditService.LogSuccessAsync(
                AuditActions.AttemptForceSubmitted, "Attempt", attempt.Id.ToString(),
                actorId: adminUserId,
                metadata: new { attemptId = attempt.Id, reason = dto.Reason });
            }
            catch { }
        });

        return ApiResponse<ForceEndResultDto>.SuccessResponse(
            new ForceEndResultDto
            {
                AttemptId = attempt.Id,
                Status = AttemptStatus.ForceSubmitted.ToString(),
                Timestamp = now
            },
            "Attempt force-ended successfully.");
    }

    // ── Resume ─────────────────────────────────────────────────
    public async Task<ApiResponse<ResumeResultDto>> ResumeAsync(ResumeAttemptControlDto dto, string adminUserId)
    {
        if (dto.AttemptId <= 0)
            return ApiResponse<ResumeResultDto>.FailureResponse("AttemptId is required.");

        var attempt = await _db.Attempts
            .Include(a => a.Exam)
            .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<ResumeResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.Paused)
            return ApiResponse<ResumeResultDto>.FailureResponse(
                $"Cannot resume an attempt with status '{attempt.Status}'. Only Paused attempts can be resumed.");

        var now = DateTime.UtcNow;

        // Check schedule window
        if (attempt.Exam.EndAt.HasValue && attempt.Exam.EndAt.Value < now)
            return ApiResponse<ResumeResultDto>.FailureResponse("Cannot resume — exam schedule has ended.");

        if (attempt.ExpiresAt.HasValue && attempt.ExpiresAt.Value < now)
            return ApiResponse<ResumeResultDto>.FailureResponse("Cannot resume — attempt time has already expired.");

        attempt.Status = AttemptStatus.InProgress;
        attempt.ResumeCount++;
        attempt.LastActivityAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        // Log event
        _db.AttemptEvents.Add(new Domain.Entities.Attempt.AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.AdminResumed,
            OccurredAt = now,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                adminUserId,
                resumeCount = attempt.ResumeCount,
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        await _db.SaveChangesAsync();

        var remaining = CalculateRemainingSeconds(attempt.Status, attempt.ExpiresAt, attempt.SubmittedAt, now);

        return ApiResponse<ResumeResultDto>.SuccessResponse(
            new ResumeResultDto
            {
                AttemptId = attempt.Id,
                Status = AttemptStatus.InProgress.ToString(),
                RemainingSeconds = remaining,
                ResumeCount = attempt.ResumeCount,
            },
            "Attempt resumed successfully.");
    }

    // ── Add Time ───────────────────────────────────────────────
    public async Task<ApiResponse<AddTimeResultDto>> AddTimeAsync(AddTimeDto dto, string adminUserId)
    {
        if (dto.AttemptId <= 0)
            return ApiResponse<AddTimeResultDto>.FailureResponse("AttemptId is required.");
        if (dto.ExtraMinutes <= 0)
            return ApiResponse<AddTimeResultDto>.FailureResponse("ExtraMinutes must be greater than 0.");
        if (dto.ExtraMinutes > 480) // max 8 hours
            return ApiResponse<AddTimeResultDto>.FailureResponse("ExtraMinutes cannot exceed 480 (8 hours).");

        var attempt = await _db.Attempts.FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<AddTimeResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.InProgress && attempt.Status != AttemptStatus.Resumed)
            return ApiResponse<AddTimeResultDto>.FailureResponse(
                $"Cannot add time to an attempt with status '{attempt.Status}'. Only InProgress or Resumed attempts can receive extra time.");

        var now = DateTime.UtcNow;
        var extraSeconds = dto.ExtraMinutes * 60;

        // Extend expiry
        if (attempt.ExpiresAt.HasValue)
            attempt.ExpiresAt = attempt.ExpiresAt.Value.AddSeconds(extraSeconds);

        attempt.ExtraTimeSeconds += extraSeconds;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        // Log event
        _db.AttemptEvents.Add(new Domain.Entities.Attempt.AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.TimeAdded,
            OccurredAt = now,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                adminUserId,
                extraMinutes = dto.ExtraMinutes,
                extraSeconds,
                reason = dto.Reason,
                newExpiresAt = attempt.ExpiresAt,
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        await _db.SaveChangesAsync();

        var remaining = CalculateRemainingSeconds(attempt.Status, attempt.ExpiresAt, attempt.SubmittedAt, now);

        // Audit log (fire-and-forget)
        _ = Task.Run(async () =>
        {
            try
            {
                await _auditService.LogSuccessAsync(
                "AttemptControl.AddTime", "Attempt", attempt.Id.ToString(),
                actorId: adminUserId,
                metadata: new { attemptId = attempt.Id, extraMinutes = dto.ExtraMinutes, reason = dto.Reason });
            }
            catch { }
        });

        // Push time extension to candidate via SignalR (fire-and-forget)
        _ = Task.Run(async () =>
        {
            try
            {
                var group = $"attempt_{attempt.Id}";
                await _proctorHub.Clients.Group(group).SendAsync("TimeExtended", new
                {
                    attemptId = attempt.Id,
                    extraMinutes = dto.ExtraMinutes,
                    newRemainingSeconds = remaining,
                    message = $"Your exam time has been extended by {dto.ExtraMinutes} minute(s)."
                });
            }
            catch { /* fire-and-forget */ }
        });

        return ApiResponse<AddTimeResultDto>.SuccessResponse(
            new AddTimeResultDto
            {
                AttemptId = attempt.Id,
                RemainingSeconds = remaining,
                TotalExtraTimeSeconds = attempt.ExtraTimeSeconds,
            },
            $"{dto.ExtraMinutes} minute(s) added successfully.");
    }

    // ── Helper ─────────────────────────────────────────────────
    private static int CalculateRemainingSeconds(
        AttemptStatus status, DateTime? expiresAt, DateTime? submittedAt, DateTime now)
    {
        if (status == AttemptStatus.Submitted || status == AttemptStatus.ForceSubmitted
            || status == AttemptStatus.Expired || status == AttemptStatus.Cancelled
            || status == AttemptStatus.Terminated)
            return 0;

        if (expiresAt.HasValue)
        {
            var diff = (int)(expiresAt.Value - now).TotalSeconds;
            return diff > 0 ? diff : 0;
        }

        return 0;
    }
}
