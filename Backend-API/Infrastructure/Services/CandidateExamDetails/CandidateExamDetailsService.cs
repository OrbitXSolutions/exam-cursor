using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.CandidateExamDetails;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.CandidateExamDetails;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.CandidateExamDetails;

public class CandidateExamDetailsService : ICandidateExamDetailsService
{
    private readonly ApplicationDbContext _db;

    public CandidateExamDetailsService(ApplicationDbContext db)
    {
        _db = db;
    }

    // ── Main Endpoint: Get Full Exam Details ───────────────────────────────────

    public async Task<ApiResponse<CandidateExamDetailsDto>> GetExamDetailsAsync(
        CandidateExamDetailsQueryDto query)
    {
        // ── 1. Validate & fetch candidate ──
        var candidate = await _db.Users
            .Where(u => u.Id == query.CandidateId)
            .Select(u => new ExamDetailsCandidateDto
            {
                CandidateId = u.Id,
                FullName = u.FullName ?? u.DisplayName ?? u.UserName ?? "",
                FullNameAr = u.FullNameAr,
                RollNo = u.RollNo,
                Email = u.Email ?? "",
                Mobile = u.PhoneNumber,
                IsBlocked = u.IsBlocked,
                Status = u.Status.ToString()
            })
            .FirstOrDefaultAsync();

        if (candidate == null)
            return ApiResponse<CandidateExamDetailsDto>.FailureResponse("Candidate not found.");

        // ── 2. Validate & fetch exam ──
        var exam = await _db.Exams
            .Where(e => e.Id == query.ExamId && !e.IsDeleted)
            .Select(e => new ExamDetailsExamDto
            {
                ExamId = e.Id,
                TitleEn = e.TitleEn,
                TitleAr = e.TitleAr,
                IsPublished = e.IsPublished,
                IsActive = e.IsActive,
                DurationMinutes = e.DurationMinutes,
                PassScore = e.PassScore,
                RequireProctoring = e.RequireProctoring,
                MaxAttempts = e.MaxAttempts
            })
            .FirstOrDefaultAsync();

        if (exam == null)
            return ApiResponse<CandidateExamDetailsDto>.FailureResponse("Exam not found.");

        // ── 3. Fetch all attempts for this candidate + exam ──
        var attempts = await _db.Attempts
            .Where(a => a.CandidateId == query.CandidateId
                     && a.ExamId == query.ExamId
                     && !a.IsDeleted)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();

        // Build the response
        var dto = new CandidateExamDetailsDto
        {
            Candidate = candidate,
            Exam = exam,
            HasAttempts = attempts.Any(),
            AttemptsList = attempts.Select(a => new ExamDetailsAttemptBriefDto
            {
                AttemptId = a.Id,
                AttemptNumber = a.AttemptNumber,
                Status = a.Status,
                StartedAt = a.StartedAt,
                SubmittedAt = a.SubmittedAt,
                TotalScore = a.TotalScore,
                IsPassed = a.IsPassed
            }).ToList()
        };

        if (!attempts.Any())
            return ApiResponse<CandidateExamDetailsDto>.SuccessResponse(dto, "No attempts found for this candidate and exam.");

        // ── 4. Select target attempt ──
        var attempt = query.AttemptId.HasValue
            ? attempts.FirstOrDefault(a => a.Id == query.AttemptId.Value)
            : attempts.First(); // Latest by default

        if (attempt == null)
            return ApiResponse<CandidateExamDetailsDto>.FailureResponse("Attempt not found.");

        // ── 5. Build attempt summary ──
        var totalDuration = attempt.ExpiresAt.HasValue
            ? (int)(attempt.ExpiresAt.Value - attempt.StartedAt).TotalSeconds
            : exam.DurationMinutes * 60;

        // Question counts
        var questionCounts = await _db.AttemptQuestions
            .Where(q => q.AttemptId == attempt.Id && !q.IsDeleted)
            .GroupBy(q => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Answered = g.Count(q => _db.AttemptAnswers
                    .Any(ans => ans.AttemptQuestionId == q.Id && !ans.IsDeleted))
            })
            .FirstOrDefaultAsync();

        dto.AttemptSummary = new ExamDetailsAttemptDto
        {
            AttemptId = attempt.Id,
            AttemptNumber = attempt.AttemptNumber,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            ExpiresAt = attempt.ExpiresAt,
            TotalDurationSeconds = totalDuration,
            RemainingSeconds = CalculateRemainingSeconds(attempt),
            ExtraTimeSeconds = attempt.ExtraTimeSeconds,
            ResumeCount = attempt.ResumeCount,
            LastActivityAt = attempt.LastActivityAt,
            TotalScore = attempt.TotalScore,
            IsPassed = attempt.IsPassed,
            ForceSubmittedBy = attempt.ForceSubmittedBy,
            ForceSubmittedAt = attempt.ForceSubmittedAt,
            IPAddress = attempt.IPAddress,
            DeviceInfo = attempt.DeviceInfo,
            TotalQuestions = questionCounts?.Total ?? 0,
            AnsweredQuestions = questionCounts?.Answered ?? 0
        };

        // ── Computed flags ──
        dto.CanForceEnd = attempt.Status == AttemptStatus.InProgress
                       || attempt.Status == AttemptStatus.Paused;

        dto.CanResume = attempt.Status == AttemptStatus.Paused
                     && CalculateRemainingSeconds(attempt) > 0;

        dto.CanAddTime = attempt.Status == AttemptStatus.InProgress;

        // ── 6. Fetch assignment (if exists) ──
        var assignment = await _db.ExamAssignments
            .Where(a => a.CandidateId == query.CandidateId
                     && a.ExamId == query.ExamId
                     && !a.IsDeleted)
            .Select(a => new ExamDetailsAssignmentDto
            {
                ScheduleFrom = a.ScheduleFrom,
                ScheduleTo = a.ScheduleTo,
                AssignedAt = a.AssignedAt,
                AssignedBy = a.AssignedBy,
                IsActive = a.IsActive
            })
            .FirstOrDefaultAsync();

        dto.Assignment = assignment;

        // Refine CanResume with schedule window
        if (dto.CanResume && assignment != null)
        {
            var now = DateTime.UtcNow;
            if (assignment.ScheduleFrom.HasValue && now < assignment.ScheduleFrom.Value)
                dto.CanResume = false;
            if (assignment.ScheduleTo.HasValue && now > assignment.ScheduleTo.Value)
                dto.CanResume = false;
        }

        // ── 7. Fetch proctor session with evidence ──
        var proctorSession = await _db.ProctorSessions
            .Where(ps => ps.AttemptId == attempt.Id && !ps.IsDeleted)
            .Select(ps => new
            {
                ps.Id,
                ps.Mode,
                ps.Status,
                ps.TotalEvents,
                ps.TotalViolations,
                ps.RiskScore,
                ps.LastHeartbeatAt,
                Decision = _db.ProctorDecisions
                    .Where(d => d.ProctorSessionId == ps.Id && !d.IsDeleted)
                    .OrderByDescending(d => d.DecidedAt)
                    .Select(d => new { d.Status, d.InternalNotes })
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (proctorSession != null)
        {
            // Fetch evidence separately (for video + screenshots)
            var evidence = await _db.ProctorEvidence
                .Where(e => e.ProctorSessionId == proctorSession.Id
                          && e.IsUploaded
                          && !e.IsDeleted)
                .OrderByDescending(e => e.StartAt ?? e.UploadedAt)
                .ToListAsync();

            var videoTypes = new[] { EvidenceType.Video, EvidenceType.ScreenRecording };
            var screenshotTypes = new[] { EvidenceType.Image, EvidenceType.ScreenCapture };

            var video = evidence.FirstOrDefault(e => videoTypes.Contains(e.Type));
            var screenshots = evidence.Where(e => screenshotTypes.Contains(e.Type)).ToList();
            var totalScreenshots = screenshots.Count;

            dto.Proctor = new ExamDetailsProctorDto
            {
                SessionId = proctorSession.Id,
                ModeName = proctorSession.Mode.ToString(),
                StatusName = proctorSession.Status.ToString(),
                TotalEvents = proctorSession.TotalEvents,
                TotalViolations = proctorSession.TotalViolations,
                RiskScore = proctorSession.RiskScore,
                RiskLevel = GetRiskLevel(proctorSession.RiskScore),
                LastHeartbeatAt = proctorSession.LastHeartbeatAt,
                DecisionStatus = proctorSession.Decision?.Status.ToString(),
                DecisionNotes = proctorSession.Decision?.InternalNotes,
                Video = video != null ? MapEvidence(video) : null,
                Screenshots = screenshots
                    .Take(query.ScreenshotLimit)
                    .Select(MapEvidence)
                    .ToList(),
                TotalScreenshots = totalScreenshots
            };
        }

        // ── 8. Fetch attempt events (enriched) ──
        var events = await _db.AttemptEvents
            .Where(e => e.AttemptId == attempt.Id && !e.IsDeleted)
            .OrderByDescending(e => e.OccurredAt)
            .ToListAsync();

        // Enrich AnswerSaved events with question text
        var answerSavedEvents = events
            .Where(e => e.EventType == AttemptEventType.AnswerSaved)
            .ToList();

        var questionMap = new Dictionary<int, (string BodyEn, string BodyAr)>();

        if (answerSavedEvents.Any())
        {
            var questionIds = answerSavedEvents
                .Select(e => ExtractQuestionIdFromMetadata(e.MetadataJson))
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (questionIds.Any())
            {
                questionMap = await _db.Questions
                    .Where(q => questionIds.Contains(q.Id))
                    .Select(q => new { q.Id, q.BodyEn, q.BodyAr })
                    .ToDictionaryAsync(q => q.Id, q => (q.BodyEn, q.BodyAr));
            }
        }

        dto.EventLogs = events.Select(e =>
        {
            var eventDto = new ExamDetailsEventDto
            {
                Id = e.Id,
                AttemptId = e.AttemptId,
                EventType = (int)e.EventType,
                EventTypeName = e.EventType.ToString(),
                MetadataJson = e.MetadataJson,
                OccurredAt = e.OccurredAt
            };

            // Enrich AnswerSaved events
            if (e.EventType == AttemptEventType.AnswerSaved)
            {
                var qId = ExtractQuestionIdFromMetadata(e.MetadataJson);
                if (qId > 0 && questionMap.TryGetValue(qId, out var q))
                {
                    eventDto.QuestionTextEn = q.BodyEn;
                    eventDto.QuestionTextAr = q.BodyAr;
                }

                eventDto.AnswerSummary = ExtractAnswerSummary(e.MetadataJson);
            }

            return eventDto;
        }).ToList();

        // ── 9. Fetch result info (for navigation links) ──
        var resultInfo = await _db.Results
            .Where(r => r.AttemptId == attempt.Id && !r.IsDeleted)
            .Select(r => new ExamDetailsResultInfoDto
            {
                ResultId = r.Id,
                IsFinalized = r.FinalizedAt != null,
                IsPublished = r.IsPublishedToCandidate
            })
            .FirstOrDefaultAsync();

        if (resultInfo != null)
        {
            // Check for grading session
            var gradingSessionId = await _db.GradingSessions
                .Where(g => g.AttemptId == attempt.Id && !g.IsDeleted)
                .Select(g => (int?)g.Id)
                .FirstOrDefaultAsync();
            resultInfo.GradingSessionId = gradingSessionId;

            // Check for certificate
            var certId = await _db.Certificates
                .Where(c => c.AttemptId == attempt.Id && !c.IsDeleted)
                .Select(c => (int?)c.Id)
                .FirstOrDefaultAsync();
            resultInfo.CertificateId = certId;
        }

        dto.ResultInfo = resultInfo;

        return ApiResponse<CandidateExamDetailsDto>.SuccessResponse(dto);
    }

    // ── Candidate Exams Dropdown ───────────────────────────────────────────────

    public async Task<ApiResponse<List<CandidateExamBriefDto>>> GetCandidateExamsAsync(
        string candidateId)
    {
        // Validate candidate exists
        var exists = await _db.Users.AnyAsync(u => u.Id == candidateId);
        if (!exists)
            return ApiResponse<List<CandidateExamBriefDto>>.FailureResponse("Candidate not found.");

        var exams = await _db.Attempts
            .Where(a => a.CandidateId == candidateId && !a.IsDeleted)
            .GroupBy(a => a.ExamId)
            .Select(g => new
            {
                ExamId = g.Key,
                TotalAttempts = g.Count(),
                LastAttemptAt = g.Max(a => a.StartedAt)
            })
            .ToListAsync();

        if (!exams.Any())
            return ApiResponse<List<CandidateExamBriefDto>>.SuccessResponse(new List<CandidateExamBriefDto>(),
                "No attempts found for this candidate.");

        var examIds = exams.Select(e => e.ExamId).ToList();
        var examDetails = await _db.Exams
            .Where(e => examIds.Contains(e.Id) && !e.IsDeleted)
            .Select(e => new { e.Id, e.TitleEn, e.TitleAr })
            .ToDictionaryAsync(e => e.Id);

        var result = exams
            .Where(e => examDetails.ContainsKey(e.ExamId))
            .Select(e => new CandidateExamBriefDto
            {
                ExamId = e.ExamId,
                TitleEn = examDetails[e.ExamId].TitleEn,
                TitleAr = examDetails[e.ExamId].TitleAr,
                TotalAttempts = e.TotalAttempts,
                LastAttemptAt = e.LastAttemptAt
            })
            .OrderByDescending(e => e.LastAttemptAt)
            .ToList();

        return ApiResponse<List<CandidateExamBriefDto>>.SuccessResponse(result);
    }

    // ── Private Helpers ────────────────────────────────────────────────────────

    private static int CalculateRemainingSeconds(Domain.Entities.Attempt.Attempt attempt)
    {
        var terminalStatuses = new[]
        {
            AttemptStatus.Submitted,
            AttemptStatus.Expired,
            AttemptStatus.Cancelled,
            AttemptStatus.ForceSubmitted,
            AttemptStatus.Terminated
        };

        if (terminalStatuses.Contains(attempt.Status))
            return 0;

        if (attempt.ExpiresAt == null)
            return 0;

        var remaining = (attempt.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds;
        return Math.Max(0, (int)remaining);
    }

    private static string GetRiskLevel(decimal? score) => score switch
    {
        null => "Unknown",
        <= 20 => "Low",
        <= 50 => "Medium",
        <= 75 => "High",
        _ => "Critical"
    };

    private static ExamDetailsEvidenceItemDto MapEvidence(Domain.Entities.Proctor.ProctorEvidence e) => new()
    {
        Id = e.Id,
        TypeName = e.Type.ToString(),
        FileName = e.FileName,
        ContentType = e.ContentType,
        FileSize = e.FileSize,
        CapturedAt = e.StartAt ?? e.UploadedAt,
        DurationSeconds = e.DurationSeconds,
        IsUploaded = e.IsUploaded
    };

    private static int ExtractQuestionIdFromMetadata(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson)) return 0;
        try
        {
            using var doc = JsonDocument.Parse(metadataJson);
            if (doc.RootElement.TryGetProperty("questionId", out var prop))
                return prop.GetInt32();
        }
        catch { /* ignore parse errors */ }
        return 0;
    }

    private static string? ExtractAnswerSummary(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson)) return null;
        try
        {
            using var doc = JsonDocument.Parse(metadataJson);
            if (doc.RootElement.TryGetProperty("answerSummary", out var prop))
                return prop.GetString();
            if (doc.RootElement.TryGetProperty("selectedOptionIds", out var opts))
                return $"Options: {opts}";
            if (doc.RootElement.TryGetProperty("textAnswer", out var text))
            {
                var val = text.GetString();
                return val?.Length > 100 ? val[..100] + "..." : val;
            }
        }
        catch { /* ignore parse errors */ }
        return null;
    }
}
