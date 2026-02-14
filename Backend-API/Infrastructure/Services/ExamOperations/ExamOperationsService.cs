using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamOperations;
using Smart_Core.Application.Interfaces.ExamOperations;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Audit;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.ExamOperations;

public class ExamOperationsService : IExamOperationsService
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ExamOperationsService> _logger;

    public ExamOperationsService(ApplicationDbContext db, ILogger<ExamOperationsService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── List candidates for exam operations ────────────────────
    public async Task<ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>> GetCandidatesAsync(
        ExamOperationsFilterDto filter)
    {
        // Base: candidates who have been assigned OR have attempts for the exam
        var query = _db.Users
            .Where(u => !u.IsBlocked && !u.IsDeleted);

        if (filter.ExamId.HasValue && filter.ExamId > 0)
        {
            var examId = filter.ExamId.Value;
            // Only candidates who are assigned to this exam OR have attempts
            var assignedCandidateIds = await _db.ExamAssignments
                .Where(a => a.ExamId == examId && !a.IsDeleted)
                .Select(a => a.CandidateId)
                .ToListAsync();

            var attemptCandidateIds = await _db.Attempts
                .Where(a => a.ExamId == examId && !a.IsDeleted)
                .Select(a => a.CandidateId)
                .Distinct()
                .ToListAsync();

            var allCandidateIds = assignedCandidateIds
                .Union(attemptCandidateIds)
                .Distinct()
                .ToList();

            query = query.Where(u => allCandidateIds.Contains(u.Id));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(s)) ||
                (u.FullNameAr != null && u.FullNameAr.ToLower().Contains(s)) ||
                u.Email!.ToLower().Contains(s) ||
                (u.RollNo != null && u.RollNo.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync();

        var candidates = await query
            .OrderBy(u => u.FullName)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(u => new { u.Id, u.FullName, u.FullNameAr, u.Email, u.RollNo })
            .ToListAsync();

        if (!filter.ExamId.HasValue || filter.ExamId <= 0)
        {
            // No exam selected — return empty candidates (exam must be selected)
            return ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>.SuccessResponse(
                new PaginatedResponse<ExamOperationsCandidateDto>
                {
                    Items = new List<ExamOperationsCandidateDto>(),
                    PageNumber = filter.PageNumber,
                    PageSize = filter.PageSize,
                    TotalCount = 0
                });
        }

        var examId2 = filter.ExamId.Value;
        var exam = await _db.Exams.FindAsync(examId2);
        if (exam == null)
            return ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>.FailureResponse("Exam not found.");

        var candidateIds = candidates.Select(c => c.Id).ToList();

        // Get attempt data for these candidates
        var attempts = await _db.Attempts
            .Where(a => a.ExamId == examId2 && candidateIds.Contains(a.CandidateId) && !a.IsDeleted)
            .Select(a => new { a.CandidateId, a.Id, a.Status, a.StartedAt })
            .ToListAsync();

        var attemptsByCandidate = attempts
            .GroupBy(a => a.CandidateId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // Get pending overrides
        var pendingOverrides = await _db.Set<AdminAttemptOverride>()
            .Where(o => o.ExamId == examId2 && candidateIds.Contains(o.CandidateId) && !o.IsUsed && !o.IsDeleted)
            .GroupBy(o => o.CandidateId)
            .Select(g => new { CandidateId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(g => g.CandidateId, g => g.Count);

        var now = DateTime.UtcNow;
        var items = candidates.Select(c =>
        {
            attemptsByCandidate.TryGetValue(c.Id, out var candidateAttempts);
            var totalAttempts = candidateAttempts?.Count ?? 0;
            var latestAttempt = candidateAttempts?.OrderByDescending(a => a.StartedAt).FirstOrDefault();
            var hasActive = candidateAttempts?.Any(a =>
                a.Status == AttemptStatus.Started ||
                a.Status == AttemptStatus.InProgress ||
                a.Status == AttemptStatus.Paused) ?? false;

            pendingOverrides.TryGetValue(c.Id, out var pending);

            return new ExamOperationsCandidateDto
            {
                CandidateId = c.Id,
                FullName = c.FullName,
                FullNameAr = c.FullNameAr,
                Email = c.Email,
                RollNo = c.RollNo,
                ExamId = examId2,
                ExamTitleEn = exam.TitleEn,
                ExamTitleAr = exam.TitleAr,
                TotalAttempts = totalAttempts,
                MaxAttempts = exam.MaxAttempts,
                LatestAttemptStatus = latestAttempt?.Status.ToString(),
                LatestAttemptId = latestAttempt?.Id,
                LatestAttemptStartedAt = latestAttempt?.StartedAt,
                HasActiveAttempt = hasActive,
                PendingOverrides = pending,
                CanAllowNewAttempt = !hasActive,
                CanAddTime = hasActive && latestAttempt?.Status == AttemptStatus.InProgress,
                CanTerminate = hasActive,
            };
        }).ToList();

        return ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>.SuccessResponse(
            new PaginatedResponse<ExamOperationsCandidateDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            });
    }

    // ── Allow New Attempt (Admin Override) ──────────────────────
    public async Task<ApiResponse<AllowNewAttemptResultDto>> AllowNewAttemptAsync(
        AllowNewAttemptDto dto, string adminUserId)
    {
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (string.IsNullOrWhiteSpace(dto.CandidateId))
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse("CandidateId is required.");
        if (dto.ExamId <= 0)
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse("ExamId is required.");
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse("Reason is required.");

        // Validate candidate exists
        var candidate = await _db.Users.FindAsync(dto.CandidateId);
        if (candidate == null)
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse("Candidate not found.");

        // Validate exam exists
        var exam = await _db.Exams.FindAsync(dto.ExamId);
        if (exam == null)
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse("Exam not found.");

        // Check no active attempt
        var hasActive = await _db.Attempts.AnyAsync(a =>
            a.ExamId == dto.ExamId &&
            a.CandidateId == dto.CandidateId &&
            !a.IsDeleted &&
            (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress));

        if (hasActive)
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse(
                "Candidate has an active attempt. Cannot grant override while an attempt is in progress.");

        // Check for existing unused override
        var existingOverride = await _db.Set<AdminAttemptOverride>()
            .AnyAsync(o => o.CandidateId == dto.CandidateId
                        && o.ExamId == dto.ExamId
                        && !o.IsUsed
                        && !o.IsDeleted);

        if (existingOverride)
            return ApiResponse<AllowNewAttemptResultDto>.FailureResponse(
                "An unused override already exists for this candidate and exam.");

        var now = DateTime.UtcNow;

        // Create the override record
        var overrideRecord = new AdminAttemptOverride
        {
            CandidateId = dto.CandidateId,
            ExamId = dto.ExamId,
            GrantedBy = adminUserId,
            Reason = dto.Reason,
            GrantedAt = now,
            IsUsed = false,
            CreatedDate = now,
            CreatedBy = adminUserId
        };

        _db.Set<AdminAttemptOverride>().Add(overrideRecord);

        // Audit log
        _db.AuditLogs.Add(new AuditLog
        {
            ActorId = adminUserId,
            ActorType = ActorType.User,
            Action = "AllowNewAttemptOverride",
            EntityName = "AdminAttemptOverride",
            Source = AuditSource.Api,
            Channel = AuditChannel.AdminPortal,
            CorrelationId = traceId,
            Outcome = AuditOutcome.Success,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                candidateId = dto.CandidateId,
                examId = dto.ExamId,
                reason = dto.Reason,
                adminUserId,
                traceId
            })
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "[ExamOps] AllowNewAttempt: Admin {AdminId} granted override for Candidate {CandidateId} on Exam {ExamId}. OverrideId={OverrideId} TraceId={TraceId}",
            adminUserId, dto.CandidateId, dto.ExamId, overrideRecord.Id, traceId);

        return ApiResponse<AllowNewAttemptResultDto>.SuccessResponse(
            new AllowNewAttemptResultDto
            {
                OverrideId = overrideRecord.Id,
                CandidateId = dto.CandidateId,
                ExamId = dto.ExamId,
                Message = "New attempt override granted successfully."
            }, "Override granted.");
    }

    // ── Add Time ───────────────────────────────────────────────
    public async Task<ApiResponse<OperationAddTimeResultDto>> AddTimeAsync(
        OperationAddTimeDto dto, string adminUserId)
    {
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (dto.AttemptId <= 0)
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse("AttemptId is required.");
        if (dto.ExtraMinutes <= 0)
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse("ExtraMinutes must be > 0.");
        if (dto.ExtraMinutes > 480)
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse("ExtraMinutes cannot exceed 480.");
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse("Reason is required.");

        var attempt = await _db.Attempts.FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.InProgress && attempt.Status != AttemptStatus.Started)
            return ApiResponse<OperationAddTimeResultDto>.FailureResponse(
                $"Cannot add time — attempt status is '{attempt.Status}'.");

        var now = DateTime.UtcNow;
        var extraSeconds = dto.ExtraMinutes * 60;

        if (attempt.ExpiresAt.HasValue)
            attempt.ExpiresAt = attempt.ExpiresAt.Value.AddSeconds(extraSeconds);

        attempt.ExtraTimeSeconds += extraSeconds;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        _db.AttemptEvents.Add(new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.TimeAdded,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                adminUserId,
                extraMinutes = dto.ExtraMinutes,
                extraSeconds,
                reason = dto.Reason,
                newExpiresAt = attempt.ExpiresAt
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        // Audit log
        _db.AuditLogs.Add(new AuditLog
        {
            ActorId = adminUserId,
            ActorType = ActorType.User,
            Action = "AddTime",
            EntityName = "Attempt",
            EntityId = attempt.Id.ToString(),
            Source = AuditSource.Api,
            Channel = AuditChannel.AdminPortal,
            CorrelationId = traceId,
            Outcome = AuditOutcome.Success,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                attemptId = attempt.Id,
                candidateId = attempt.CandidateId,
                examId = attempt.ExamId,
                extraMinutes = dto.ExtraMinutes,
                reason = dto.Reason,
                traceId
            })
        });

        await _db.SaveChangesAsync();

        var remaining = attempt.ExpiresAt.HasValue
            ? Math.Max(0, (int)(attempt.ExpiresAt.Value - now).TotalSeconds)
            : 0;

        _logger.LogInformation(
            "[ExamOps] AddTime: Admin {AdminId} added {Minutes}m to Attempt {AttemptId}. TraceId={TraceId}",
            adminUserId, dto.ExtraMinutes, attempt.Id, traceId);

        return ApiResponse<OperationAddTimeResultDto>.SuccessResponse(
            new OperationAddTimeResultDto
            {
                AttemptId = attempt.Id,
                RemainingSeconds = remaining,
                TotalExtraTimeSeconds = attempt.ExtraTimeSeconds
            }, $"{dto.ExtraMinutes} minute(s) added.");
    }

    // ── Terminate Attempt ──────────────────────────────────────
    public async Task<ApiResponse<TerminateAttemptResultDto>> TerminateAttemptAsync(
        TerminateAttemptDto dto, string adminUserId)
    {
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (dto.AttemptId <= 0)
            return ApiResponse<TerminateAttemptResultDto>.FailureResponse("AttemptId is required.");
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return ApiResponse<TerminateAttemptResultDto>.FailureResponse("Reason is required.");

        var attempt = await _db.Attempts.FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<TerminateAttemptResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.InProgress
            && attempt.Status != AttemptStatus.Started
            && attempt.Status != AttemptStatus.Paused)
            return ApiResponse<TerminateAttemptResultDto>.FailureResponse(
                $"Cannot terminate — attempt status is '{attempt.Status}'.");

        var now = DateTime.UtcNow;
        attempt.Status = AttemptStatus.ForceSubmitted;
        attempt.SubmittedAt = now;
        attempt.ForceSubmittedBy = adminUserId;
        attempt.ForceSubmittedAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        _db.AttemptEvents.Add(new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.ForceEnded,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                adminUserId,
                reason = dto.Reason,
                previousStatus = attempt.Status.ToString()
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        // Close proctor session if active
        var proctorSession = await _db.Set<ProctorSession>()
            .FirstOrDefaultAsync(s => s.AttemptId == attempt.Id && s.Status == ProctorSessionStatus.Active);
        if (proctorSession != null)
        {
            proctorSession.Status = ProctorSessionStatus.Cancelled;
            proctorSession.EndedAt = now;
            proctorSession.UpdatedDate = now;
            proctorSession.UpdatedBy = adminUserId;
        }

        // Audit log
        _db.AuditLogs.Add(new AuditLog
        {
            ActorId = adminUserId,
            ActorType = ActorType.User,
            Action = "TerminateAttempt",
            EntityName = "Attempt",
            EntityId = attempt.Id.ToString(),
            Source = AuditSource.Api,
            Channel = AuditChannel.AdminPortal,
            CorrelationId = traceId,
            Outcome = AuditOutcome.Success,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                attemptId = attempt.Id,
                candidateId = attempt.CandidateId,
                examId = attempt.ExamId,
                reason = dto.Reason,
                traceId
            })
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "[ExamOps] Terminate: Admin {AdminId} terminated Attempt {AttemptId}. TraceId={TraceId}",
            adminUserId, attempt.Id, traceId);

        return ApiResponse<TerminateAttemptResultDto>.SuccessResponse(
            new TerminateAttemptResultDto
            {
                AttemptId = attempt.Id,
                Status = AttemptStatus.ForceSubmitted.ToString(),
                Timestamp = now
            }, "Attempt terminated.");
    }

    // ── Resume Attempt (hidden in UI) ──────────────────────────
    public async Task<ApiResponse<ResumeAttemptOperationResultDto>> ResumeAttemptAsync(
        ResumeAttemptOperationDto dto, string adminUserId)
    {
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (dto.AttemptId <= 0)
            return ApiResponse<ResumeAttemptOperationResultDto>.FailureResponse("AttemptId is required.");

        var attempt = await _db.Attempts
            .Include(a => a.Exam)
            .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && !a.IsDeleted);
        if (attempt == null)
            return ApiResponse<ResumeAttemptOperationResultDto>.FailureResponse("Attempt not found.");

        if (attempt.Status != AttemptStatus.Paused)
            return ApiResponse<ResumeAttemptOperationResultDto>.FailureResponse(
                $"Cannot resume — attempt status is '{attempt.Status}'.");

        var now = DateTime.UtcNow;
        if (attempt.ExpiresAt.HasValue && attempt.ExpiresAt.Value < now)
            return ApiResponse<ResumeAttemptOperationResultDto>.FailureResponse(
                "Cannot resume — attempt time has expired.");

        attempt.Status = AttemptStatus.InProgress;
        attempt.ResumeCount++;
        attempt.LastActivityAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        _db.AttemptEvents.Add(new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.AdminResumed,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new
            {
                adminUserId,
                resumeCount = attempt.ResumeCount,
                reason = dto.Reason
            }),
            CreatedBy = adminUserId,
            CreatedDate = now
        });

        await _db.SaveChangesAsync();

        var remaining = attempt.ExpiresAt.HasValue
            ? Math.Max(0, (int)(attempt.ExpiresAt.Value - now).TotalSeconds)
            : 0;

        return ApiResponse<ResumeAttemptOperationResultDto>.SuccessResponse(
            new ResumeAttemptOperationResultDto
            {
                AttemptId = attempt.Id,
                Status = AttemptStatus.InProgress.ToString(),
                RemainingSeconds = remaining
            }, "Attempt resumed.");
    }

    // ── Get Operation Audit Logs ───────────────────────────────
    public async Task<ApiResponse<List<AdminOperationLogDto>>> GetOperationLogsAsync(
        string candidateId, int examId)
    {
        var logs = await _db.AuditLogs
            .Where(a => a.Action == "AllowNewAttemptOverride"
                     || a.Action == "AddTime"
                     || a.Action == "TerminateAttempt")
            .OrderByDescending(a => a.OccurredAt)
            .Take(100)
            .ToListAsync();

        // Filter by candidateId and examId from metadata
        var result = new List<AdminOperationLogDto>();
        foreach (var log in logs)
        {
            if (string.IsNullOrWhiteSpace(log.MetadataJson)) continue;

            try
            {
                using var doc = JsonDocument.Parse(log.MetadataJson);
                var root = doc.RootElement;

                var logCandidateId = root.TryGetProperty("candidateId", out var cid) ? cid.GetString() : null;
                var logExamId = root.TryGetProperty("examId", out var eid) ? eid.GetInt32() : 0;

                if (logCandidateId == candidateId && logExamId == examId)
                {
                    // Get actor name
                    var actor = await _db.Users
                        .Where(u => u.Id == log.ActorId)
                        .Select(u => u.FullName ?? u.DisplayName ?? u.UserName)
                        .FirstOrDefaultAsync();

                    var candidateName = await _db.Users
                        .Where(u => u.Id == candidateId)
                        .Select(u => u.FullName ?? u.DisplayName ?? u.UserName)
                        .FirstOrDefaultAsync();

                    var examTitle = await _db.Exams
                        .Where(e => e.Id == examId)
                        .Select(e => e.TitleEn)
                        .FirstOrDefaultAsync();

                    var oldAttemptId = root.TryGetProperty("attemptId", out var aid) ? aid.GetInt32() : (int?)null;
                    var reason = root.TryGetProperty("reason", out var r) ? r.GetString() ?? "" : "";
                    var traceId = root.TryGetProperty("traceId", out var tid) ? tid.GetString() : log.CorrelationId;

                    result.Add(new AdminOperationLogDto
                    {
                        Id = (int)log.Id,
                        ActionType = log.Action,
                        ActorUserId = log.ActorId ?? "",
                        ActorName = actor,
                        CandidateId = candidateId,
                        CandidateName = candidateName,
                        ExamId = examId,
                        ExamTitle = examTitle,
                        OldAttemptId = oldAttemptId,
                        Reason = reason,
                        Timestamp = log.OccurredAt,
                        TraceId = traceId
                    });
                }
            }
            catch
            {
                // Skip malformed metadata
            }
        }

        return ApiResponse<List<AdminOperationLogDto>>.SuccessResponse(result);
    }
}
