using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Candidate;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Grading;
using Smart_Core.Application.Interfaces.Candidate;
using Smart_Core.Application.Interfaces.ExamResult;
using Smart_Core.Application.Interfaces.Grading;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Candidate;

public class CandidateService : ICandidateService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IGradingService _gradingService;
    private readonly IExamResultService _examResultService;
    private readonly ILogger<CandidateService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public CandidateService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IGradingService gradingService,
        IExamResultService examResultService,
        ILogger<CandidateService> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _context = context;
        _userManager = userManager;
        _gradingService = gradingService;
        _examResultService = examResultService;
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    #region Exam Discovery & Preview

    public async Task<ApiResponse<List<CandidateExamListDto>>> GetAvailableExamsAsync(string candidateId)
    {
        var now = DateTime.UtcNow;

        // Get user and check role
        var user = await _userManager.FindByIdAsync(candidateId);
        if (user == null)
        {
            return ApiResponse<List<CandidateExamListDto>>.FailureResponse("User not found");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var isCandidate = roles.Contains(AppRoles.Candidate);

        // Build query for published + active exams
        var query = _context.Exams
          .Include(e => e.Department)
 .Include(e => e.Sections.Where(s => !s.IsDeleted))
        .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
            .Where(e => e.IsPublished && e.IsActive && !e.IsDeleted);

        // Department filtering logic:
        // - If user is Candidate role AND has no department => list all exams (no filter)
        // - If user is Candidate role AND has department => still list all exams (candidates can take any exam)
        // - If user is NOT Candidate role => filter by user's department
        if (!isCandidate && user.DepartmentId.HasValue)
        {
            query = query.Where(e => e.DepartmentId == user.DepartmentId.Value);
        }

        var exams = await query.ToListAsync();

        // Get candidate attempts for counts + latest status (single query)
        var candidateAttempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Where(a => a.CandidateId == candidateId && !a.IsDeleted)
            .Select(a => new
            {
                a.Id,
                a.ExamId,
                a.Status,
                a.StartedAt,
                a.SubmittedAt
            })
            .ToListAsync();

        var attemptCounts = candidateAttempts
            .GroupBy(a => a.ExamId)
            .ToDictionary(g => g.Key, g => g.Count());

        var latestAttempts = candidateAttempts
            .GroupBy(a => a.ExamId)
            .Select(g => g.OrderByDescending(a => a.StartedAt).First())
            .ToDictionary(a => a.ExamId, a => a);

        // Get candidate's published results per exam (hide pass/fail until published)
        var publishedResults = await _context.Set<Domain.Entities.ExamResult.Result>()
            .Where(r => r.CandidateId == candidateId && !r.IsDeleted && r.IsPublishedToCandidate)
            .Select(r => new
            {
                r.ExamId,
                r.AttemptId,
                r.IsPassed,
                r.PublishedAt,
                r.FinalizedAt
            })
            .ToListAsync();

        var publishedByExam = publishedResults
            .GroupBy(r => r.ExamId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(r => r.PublishedAt ?? r.FinalizedAt).First());

        var publishedAttemptIds = publishedResults
            .Select(r => r.AttemptId)
            .ToHashSet();

        // Get admin attempt overrides for this candidate (unused)
        var adminOverrideExamIds = await _context.Set<Domain.Entities.Attempt.AdminAttemptOverride>()
            .Where(o => o.CandidateId == candidateId && !o.IsUsed && !o.IsDeleted)
            .Select(o => o.ExamId)
            .ToListAsync();
        var overrideExamIdSet = new HashSet<int>(adminOverrideExamIds);

        var dtos = exams.Select(e =>
               {
                   // Calculate total questions and points including Builder sections
                   int totalQuestions = 0;
                   decimal totalPoints = 0;

                   foreach (var section in e.Sections)
                   {
                       if (section.SourceType.HasValue && section.PickCount > 0)
                       {
                           // Builder section - use PickCount as question count
                           totalQuestions += section.PickCount;
                           // Estimate points: use 1 point per question (actual points determined at attempt time)
                           totalPoints += section.PickCount;
                       }
                       else
                       {
                           // Manual section - use ExamQuestions
                           var sectionQuestions = section.Questions ?? new List<Domain.Entities.Assessment.ExamQuestion>();
                           totalQuestions += sectionQuestions.Count;
                           totalPoints += sectionQuestions.Sum(q => q.Points);
                       }
                   }

                   // Get attempt count for this exam
                   attemptCounts.TryGetValue(e.Id, out var myAttemptCount);

                   // Get latest attempt for this exam
                   latestAttempts.TryGetValue(e.Id, out var latestAttempt);

                   // Get published result for this exam (only published results are visible to candidates)
                   publishedByExam.TryGetValue(e.Id, out var publishedResult);

                   var now = DateTime.UtcNow;
                   var hasAttemptsLeft = e.MaxAttempts == 0 || myAttemptCount < e.MaxAttempts;
                   var inWindow = (!e.StartAt.HasValue || now >= e.StartAt.Value)
                               && (!e.EndAt.HasValue || now <= e.EndAt.Value);
                   var isPassedAndPublished = publishedResult != null && publishedResult.IsPassed;
                   var hasFinishedAttempt = latestAttempt != null
                       && (latestAttempt.Status == AttemptStatus.Submitted
                        || latestAttempt.Status == AttemptStatus.Expired
                        || latestAttempt.Status == AttemptStatus.Cancelled
                        || latestAttempt.Status == AttemptStatus.ForceSubmitted
                        || latestAttempt.Status == AttemptStatus.Terminated);

                   var hasAdminOverride = overrideExamIdSet.Contains(e.Id);

                   return new CandidateExamListDto
                   {
                       Id = e.Id,
                       ExamType = e.ExamType,
                       TitleEn = e.TitleEn,
                       TitleAr = e.TitleAr,
                       DescriptionEn = e.DescriptionEn,
                       DescriptionAr = e.DescriptionAr,
                       StartAt = e.StartAt,
                       EndAt = e.EndAt,
                       DurationMinutes = e.DurationMinutes,
                       MaxAttempts = e.MaxAttempts,
                       PassScore = e.PassScore,
                       TotalQuestions = totalQuestions,
                       TotalPoints = totalPoints,
                       // Set MyAttempts: null if 0 attempts, otherwise the count
                       MyAttempts = myAttemptCount > 0 ? myAttemptCount : null,
                       // Set MyBestIsPassed: null until a published result exists
                       MyBestIsPassed = publishedResult != null ? publishedResult.IsPassed : null,
                       LatestAttemptId = latestAttempt?.Id,
                       LatestAttemptStatus = latestAttempt?.Status,
                       LatestAttemptSubmittedAt = latestAttempt?.SubmittedAt,
                       LatestAttemptIsResultPublished = latestAttempt != null && publishedAttemptIds.Contains(latestAttempt.Id),
                       CanRetake = (hasFinishedAttempt && hasAttemptsLeft && inWindow && !isPassedAndPublished) || hasAdminOverride,
                       HasAdminOverride = hasAdminOverride
                   };
               }).ToList();

        return ApiResponse<List<CandidateExamListDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<List<CandidateExamListDto>>> GetAdminOverrideExamsAsync(string candidateId)
    {
        // Get all unused overrides for this candidate
        var overrides = await _context.Set<Domain.Entities.Attempt.AdminAttemptOverride>()
            .Where(o => o.CandidateId == candidateId && !o.IsUsed && !o.IsDeleted)
            .Select(o => o.ExamId)
            .Distinct()
            .ToListAsync();

        if (!overrides.Any())
            return ApiResponse<List<CandidateExamListDto>>.SuccessResponse(new List<CandidateExamListDto>());

        // Get the full exams list and filter to only override exams
        var allExamsResult = await GetAvailableExamsAsync(candidateId);
        if (!allExamsResult.Success || allExamsResult.Data == null)
            return ApiResponse<List<CandidateExamListDto>>.SuccessResponse(new List<CandidateExamListDto>());

        var overrideExams = allExamsResult.Data
            .Where(e => overrides.Contains(e.Id))
            .ToList();

        return ApiResponse<List<CandidateExamListDto>>.SuccessResponse(overrideExams);
    }

    public async Task<ApiResponse<CandidateExamPreviewDto>> GetExamPreviewAsync(int examId, string candidateId)
    {
        var exam = await _context.Exams
   .Include(e => e.Sections.Where(s => !s.IsDeleted))
          .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
    .Include(e => e.Instructions.Where(i => !i.IsDeleted))
            .Include(e => e.AccessPolicy)
       .FirstOrDefaultAsync(e => e.Id == examId);

        if (exam == null)
        {
            return ApiResponse<CandidateExamPreviewDto>.FailureResponse("Exam not found");
        }

        if (!exam.IsPublished || !exam.IsActive)
        {
            return ApiResponse<CandidateExamPreviewDto>.FailureResponse("Exam is not available");
        }

        // Calculate total questions and points including Builder sections
        int totalQuestions = 0;
        decimal totalPoints = 0;

        foreach (var section in exam.Sections)
        {
            if (section.SourceType.HasValue && section.PickCount > 0)
            {
                // Builder section - use PickCount as question count
                totalQuestions += section.PickCount;
                // Estimate points: use 1 point per question (actual points determined at attempt time)
                totalPoints += section.PickCount;
            }
            else
            {
                // Manual section - use ExamQuestions
                var sectionQuestions = section.Questions ?? new List<Domain.Entities.Assessment.ExamQuestion>();
                totalQuestions += sectionQuestions.Count;
                totalPoints += sectionQuestions.Sum(q => q.Points);
            }
        }

        var instructions = exam.Instructions
      .OrderBy(i => i.Order)
            .Select(i => new CandidateExamInstructionDto
            {
                Order = i.Order,
                ContentEn = i.ContentEn,
                ContentAr = i.ContentAr
            })
            .ToList();

        var accessPolicy = new CandidateAccessPolicyDto
        {
            RequiresAccessCode = !string.IsNullOrEmpty(exam.AccessPolicy?.AccessCode),
            RequireProctoring = exam.RequireProctoring,
            RequireIdVerification = exam.RequireIdVerification,
            RequireWebcam = exam.RequireWebcam,
            PreventCopyPaste = exam.PreventCopyPaste,
            PreventScreenCapture = exam.PreventScreenCapture,
            RequireFullscreen = exam.RequireFullscreen,
            BrowserLockdown = exam.BrowserLockdown
        };

        // Check eligibility
        var eligibility = await CheckEligibilityAsync(exam, candidateId);

        var preview = new CandidateExamPreviewDto
        {
            ExamId = exam.Id,
            ExamType = exam.ExamType,
            TitleEn = exam.TitleEn,
            TitleAr = exam.TitleAr,
            DescriptionEn = exam.DescriptionEn,
            DescriptionAr = exam.DescriptionAr,
            StartAt = exam.StartAt,
            EndAt = exam.EndAt,
            DurationMinutes = exam.DurationMinutes,
            MaxAttempts = exam.MaxAttempts,
            TotalQuestions = totalQuestions,
            TotalPoints = totalPoints,
            PassScore = exam.PassScore,
            Instructions = instructions,
            AccessPolicy = accessPolicy,
            Eligibility = eligibility
        };

        return ApiResponse<CandidateExamPreviewDto>.SuccessResponse(preview);
    }

    #endregion

    #region Exam Attempt

    public async Task<ApiResponse<CandidateAttemptSessionDto>> StartExamAsync(
        int examId, StartExamRequest request, string candidateId)
    {
        // Get exam
        var exam = await _context.Exams
            .Include(e => e.AccessPolicy)
     .Include(e => e.Sections.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
            .ThenInclude(eq => eq.Question)
    .ThenInclude(q => q.QuestionType)
  .Include(e => e.Sections.Where(s => !s.IsDeleted))
      .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
   .ThenInclude(eq => eq.Question)
          .ThenInclude(q => q.Options.Where(o => !o.IsDeleted))
  .Include(e => e.Sections.Where(s => !s.IsDeleted))
          .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
                  .ThenInclude(eq => eq.Question)
 .ThenInclude(q => q.Attachments.Where(a => !a.IsDeleted))
        .Include(e => e.Instructions.Where(i => !i.IsDeleted))
 .FirstOrDefaultAsync(e => e.Id == examId);

        if (exam == null)
        {
            return ApiResponse<CandidateAttemptSessionDto>.FailureResponse("Exam not found");
        }

        // Validate exam is active and published
        if (!exam.IsActive || !exam.IsPublished)
        {
            return ApiResponse<CandidateAttemptSessionDto>.FailureResponse("Exam is not available");
        }

        // Validate schedule (Flexible vs Fixed)
        var now = DateTime.UtcNow;
        var traceId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (!exam.StartAt.HasValue && !exam.EndAt.HasValue)
        {
            // Legacy exams without schedule — allow start (backward compatibility)
            _logger.LogWarning(
                "[StartExam] Exam {ExamId} has no StartAt/EndAt — allowing start for backward compatibility. CandidateId={CandidateId} TraceId={TraceId}",
                examId, candidateId, traceId);
        }
        else if (exam.ExamType == ExamType.Fixed)
        {
            // Fixed: candidate must start within [StartAt, StartAt + grace] AND now <= EndAt
            var graceMinutes = ExamDefaults.FixedStartGraceMinutes;
            var windowEnd = exam.StartAt.HasValue
                ? exam.StartAt.Value.AddMinutes(graceMinutes)
                : (DateTime?)null;

            // Clamp grace window to EndAt
            if (windowEnd.HasValue && exam.EndAt.HasValue && windowEnd.Value > exam.EndAt.Value)
                windowEnd = exam.EndAt.Value;

            if (exam.EndAt.HasValue && now > exam.EndAt.Value)
            {
                _logger.LogWarning(
                    "[StartExam] BLOCKED — Fixed exam expired | ExamId={ExamId} CandidateId={CandidateId} Now={Now} StartAt={StartAt} EndAt={EndAt} ExamType=Fixed TraceId={TraceId} Reason=PastEndAt",
                    examId, candidateId, now, exam.StartAt, exam.EndAt, traceId);
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                    $"Exam has ended. End time: {exam.EndAt.Value:yyyy-MM-dd HH:mm} UTC");
            }

            if (exam.StartAt.HasValue && now < exam.StartAt.Value)
            {
                _logger.LogWarning(
                    "[StartExam] BLOCKED — Fixed exam not started yet | ExamId={ExamId} CandidateId={CandidateId} Now={Now} StartAt={StartAt} EndAt={EndAt} ExamType=Fixed TraceId={TraceId} Reason=BeforeStartAt",
                    examId, candidateId, now, exam.StartAt, exam.EndAt, traceId);
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                    $"Exam has not started yet. Start time: {exam.StartAt.Value:yyyy-MM-dd HH:mm} UTC");
            }

            if (windowEnd.HasValue && now > windowEnd.Value)
            {
                _logger.LogWarning(
                    "[StartExam] BLOCKED — Fixed exam grace window passed | ExamId={ExamId} CandidateId={CandidateId} Now={Now} StartAt={StartAt} GraceEnd={GraceEnd} EndAt={EndAt} ExamType=Fixed GraceMinutes={GraceMinutes} TraceId={TraceId} Reason=PastGraceWindow",
                    examId, candidateId, now, exam.StartAt, windowEnd, exam.EndAt, graceMinutes, traceId);
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                    $"The allowed start window has passed. You must start within {graceMinutes} minutes of the scheduled time ({exam.StartAt!.Value:yyyy-MM-dd HH:mm} UTC).");
            }
        }
        else
        {
            // Flexible: candidate can start anytime within [StartAt, EndAt]
            if (exam.StartAt.HasValue && now < exam.StartAt.Value)
            {
                _logger.LogWarning(
                    "[StartExam] BLOCKED — Flexible exam not available yet | ExamId={ExamId} CandidateId={CandidateId} Now={Now} StartAt={StartAt} EndAt={EndAt} ExamType=Flex TraceId={TraceId} Reason=BeforeStartAt",
                    examId, candidateId, now, exam.StartAt, exam.EndAt, traceId);
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                    $"Exam is not available yet. Available from: {exam.StartAt.Value:yyyy-MM-dd HH:mm} UTC");
            }

            if (exam.EndAt.HasValue && now > exam.EndAt.Value)
            {
                _logger.LogWarning(
                    "[StartExam] BLOCKED — Flexible exam expired | ExamId={ExamId} CandidateId={CandidateId} Now={Now} StartAt={StartAt} EndAt={EndAt} ExamType=Flex TraceId={TraceId} Reason=PastEndAt",
                    examId, candidateId, now, exam.StartAt, exam.EndAt, traceId);
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                    $"Exam has ended. End time: {exam.EndAt.Value:yyyy-MM-dd HH:mm} UTC");
            }
        }

        // Validate access code
        if (!string.IsNullOrEmpty(exam.AccessPolicy?.AccessCode))
        {
            if (string.IsNullOrEmpty(request.AccessCode) ||
                !exam.AccessPolicy.AccessCode.Equals(request.AccessCode, StringComparison.Ordinal))
            {
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse("Invalid or missing access code");
            }
        }

        // Check for existing active attempt
        var existingActive = await _context.Set<Domain.Entities.Attempt.Attempt>()
                 .Include(a => a.Questions.OrderBy(q => q.Order))
        .ThenInclude(aq => aq.Answers)
                 .FirstOrDefaultAsync(a =>
            a.ExamId == examId &&
        a.CandidateId == candidateId &&
        (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed));

        if (existingActive != null)
        {
            // Check if expired
            if (existingActive.ExpiresAt.HasValue && now > existingActive.ExpiresAt.Value)
            {
                existingActive.Status = AttemptStatus.Expired;
                existingActive.ExpiryReason = ExpiryReason.TimerExpiredWhileActive;
                await _context.SaveChangesAsync();
            }
            else
            {
                // Resume existing
                return ApiResponse<CandidateAttemptSessionDto>.SuccessResponse(
                     await BuildCandidateSessionDto(existingActive, exam),
                   "Resuming existing attempt");
            }
        }

        // Check max attempts
        var attemptCount = await _context.Set<Domain.Entities.Attempt.Attempt>()
        .CountAsync(a => a.ExamId == examId && a.CandidateId == candidateId);

        // Check for admin override that bypasses MaxAttempts
        Domain.Entities.Attempt.AdminAttemptOverride? adminOverride = null;
        if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
        {
            // Look for an unused admin override
            adminOverride = await _context.Set<Domain.Entities.Attempt.AdminAttemptOverride>()
                .FirstOrDefaultAsync(o => o.CandidateId == candidateId
                                       && o.ExamId == examId
                                       && !o.IsUsed
                                       && !o.IsDeleted);

            if (adminOverride == null)
            {
                return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
                     $"Maximum attempts ({exam.MaxAttempts}) reached");
            }
        }

        // Create new attempt
        var attempt = new Domain.Entities.Attempt.Attempt
        {
            ExamId = examId,
            CandidateId = candidateId,
            StartedAt = now,
            ExpiresAt = CalculateExpiresAt(now, exam.DurationMinutes, exam.EndAt),
            Status = adminOverride != null ? AttemptStatus.Resumed : AttemptStatus.Started,
            AttemptNumber = attemptCount + 1,
            CreatedDate = now,
            CreatedBy = candidateId
        };

        // If this is a resumed attempt (admin granted override), link to the previous attempt
        if (adminOverride != null)
        {
            var previousAttempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
                .Where(a => a.ExamId == examId && a.CandidateId == candidateId
                    && (a.Status == AttemptStatus.Expired || a.Status == AttemptStatus.Terminated || a.Status == AttemptStatus.ForceSubmitted))
                .OrderByDescending(a => a.CreatedDate)
                .FirstOrDefaultAsync();
            if (previousAttempt != null)
                attempt.ResumedFromAttemptId = previousAttempt.Id;
        }

        _context.Set<Domain.Entities.Attempt.Attempt>().Add(attempt);
        await _context.SaveChangesAsync();

        // Mark admin override as used (if applicable)
        if (adminOverride != null)
        {
            adminOverride.IsUsed = true;
            adminOverride.UsedAttemptId = attempt.Id;
            adminOverride.UsedAt = now;
            adminOverride.UpdatedDate = now;
            adminOverride.UpdatedBy = candidateId;
            await _context.SaveChangesAsync();
        }

        // Generate attempt questions
        // Generate attempt questions from sections
        // For Builder sections (SourceType set), pick random questions from QuestionBank
        // For Manual sections, use pre-defined ExamQuestions
        var attemptQuestionsList = new List<(int QuestionId, decimal Points)>();

        foreach (var section in exam.Sections.OrderBy(s => s.Order))
        {
            if (section.SourceType.HasValue && section.QuestionSubjectId.HasValue && section.PickCount > 0)
            {
                // Builder section - pick random questions from QuestionBank
                var questionsQuery = _context.Questions
                    .Where(q => q.IsActive && !q.IsDeleted && q.SubjectId == section.QuestionSubjectId);

                if (section.QuestionTopicId.HasValue)
                {
                    questionsQuery = questionsQuery.Where(q => q.TopicId == section.QuestionTopicId);
                }

                var pickedQuestions = await questionsQuery
                    .OrderBy(q => Guid.NewGuid()) // Random order
                    .Take(section.PickCount)
                    .Select(q => new { q.Id, q.Points })
                    .ToListAsync();

                foreach (var q in pickedQuestions)
                {
                    attemptQuestionsList.Add((q.Id, q.Points > 0 ? q.Points : 1));
                }
            }
            else
            {
                // Manual section - use ExamQuestions
                foreach (var eq in section.Questions.OrderBy(q => q.Order))
                {
                    attemptQuestionsList.Add((eq.QuestionId, eq.Points));
                }
            }
        }

        if (exam.ShuffleQuestions)
        {
            attemptQuestionsList = attemptQuestionsList.OrderBy(_ => Guid.NewGuid()).ToList();
        }

        var order = 1;
        foreach (var (questionId, points) in attemptQuestionsList)
        {
            var attemptQuestion = new AttemptQuestion
            {
                AttemptId = attempt.Id,
                QuestionId = questionId,
                Order = order++,
                Points = points,
                CreatedDate = now,
                CreatedBy = candidateId
            };
            _context.Set<AttemptQuestion>().Add(attemptQuestion);
        }

        // Log event
        var startEvent = new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.Started,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new { attemptNumber = attempt.AttemptNumber }),
            CreatedDate = now,
            CreatedBy = candidateId
        };
        _context.Set<AttemptEvent>().Add(startEvent);

        await _context.SaveChangesAsync();

        // Reload with questions
        var createdAttempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
    .Include(a => a.Questions.OrderBy(q => q.Order))
              .ThenInclude(aq => aq.Answers)
     .FirstAsync(a => a.Id == attempt.Id);

        return ApiResponse<CandidateAttemptSessionDto>.SuccessResponse(
             await BuildCandidateSessionDto(createdAttempt, exam),
        "Exam started successfully");
    }

    public async Task<ApiResponse<CandidateAttemptSessionDto>> GetAttemptSessionAsync(int attemptId, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
    .Include(a => a.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.Order))
       .ThenInclude(aq => aq.Answers.Where(ans => !ans.IsDeleted))
            .Include(a => a.Exam)
 .ThenInclude(e => e.Sections.Where(s => !s.IsDeleted).OrderBy(s => s.Order))
  .ThenInclude(s => s.Topics.Where(t => !t.IsDeleted).OrderBy(t => t.Order))
            .Include(a => a.Exam)
        .ThenInclude(e => e.Instructions.Where(i => !i.IsDeleted).OrderBy(i => i.Order))
    .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
            return ApiResponse<CandidateAttemptSessionDto>.FailureResponse("Attempt not found");
        }

        if (attempt.CandidateId != candidateId)
        {
            return ApiResponse<CandidateAttemptSessionDto>.FailureResponse("Access denied");
        }

        // Check if expired
        var now = DateTime.UtcNow;
        if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value &&
            (attempt.Status == AttemptStatus.Started || attempt.Status == AttemptStatus.InProgress || attempt.Status == AttemptStatus.Resumed))
        {
            attempt.Status = AttemptStatus.Expired;
            attempt.ExpiryReason = ExpiryReason.TimerExpiredWhileActive;
            await _context.SaveChangesAsync();
        }

        if (attempt.Status == AttemptStatus.Submitted || attempt.Status == AttemptStatus.Expired ||
               attempt.Status == AttemptStatus.Cancelled || attempt.Status == AttemptStatus.Terminated)
        {
            return ApiResponse<CandidateAttemptSessionDto>.FailureResponse(
$"Attempt is {attempt.Status}. Cannot resume.");
        }

        return ApiResponse<CandidateAttemptSessionDto>.SuccessResponse(
            await BuildCandidateSessionDto(attempt, attempt.Exam));
    }

    public async Task<ApiResponse<bool>> SaveAnswersAsync(
     int attemptId, BulkSaveAnswersRequest request, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Questions)
 .ThenInclude(aq => aq.Question)
             .ThenInclude(q => q.QuestionType)
     .Include(a => a.Questions)
       .ThenInclude(aq => aq.Question)
        .ThenInclude(q => q.Options)
.Include(a => a.Questions)
.ThenInclude(aq => aq.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
            return ApiResponse<bool>.FailureResponse("Attempt not found");
        }

        if (attempt.CandidateId != candidateId)
        {
            return ApiResponse<bool>.FailureResponse("Access denied");
        }

        var now = DateTime.UtcNow;

        // Validate attempt status
        if (attempt.Status != AttemptStatus.Started && attempt.Status != AttemptStatus.InProgress && attempt.Status != AttemptStatus.Resumed)
        {
            return ApiResponse<bool>.FailureResponse($"Cannot save answers. Attempt is {attempt.Status}.");
        }

        // Check not expired
        if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value)
        {
            attempt.Status = AttemptStatus.Expired;
            attempt.ExpiryReason = ExpiryReason.TimerExpiredWhileActive;
            await _context.SaveChangesAsync();
            return ApiResponse<bool>.FailureResponse("Attempt has expired. Cannot save answers.");
        }

        // Update status to InProgress if still Started
        if (attempt.Status == AttemptStatus.Started)
        {
            attempt.Status = AttemptStatus.InProgress;
        }

        // Process each answer (idempotent)
        foreach (var answerRequest in request.Answers)
        {
            var attemptQuestion = attempt.Questions.FirstOrDefault(q => q.QuestionId == answerRequest.QuestionId);
            if (attemptQuestion == null) continue;

            var existingAnswer = attemptQuestion.Answers.FirstOrDefault();

            if (existingAnswer != null)
            {
                // Update
                existingAnswer.SelectedOptionIdsJson = answerRequest.SelectedOptionIds != null
           ? JsonSerializer.Serialize(answerRequest.SelectedOptionIds)
                    : null;
                existingAnswer.TextAnswer = answerRequest.TextAnswer;
                existingAnswer.AnsweredAt = now;
                existingAnswer.UpdatedDate = now;
                existingAnswer.UpdatedBy = candidateId;
            }
            else
            {
                // Create
                var newAnswer = new AttemptAnswer
                {
                    AttemptId = attemptId,
                    AttemptQuestionId = attemptQuestion.Id,
                    QuestionId = answerRequest.QuestionId,
                    SelectedOptionIdsJson = answerRequest.SelectedOptionIds != null
            ? JsonSerializer.Serialize(answerRequest.SelectedOptionIds)
             : null,
                    TextAnswer = answerRequest.TextAnswer,
                    AnsweredAt = now,
                    CreatedDate = now,
                    CreatedBy = candidateId
                };
                _context.Set<AttemptAnswer>().Add(newAnswer);
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Answers saved successfully");
    }

    public async Task<ApiResponse<CandidateResultSummaryDto>> SubmitAttemptAsync(int attemptId, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Exam)
            .Include(a => a.Questions)
                .ThenInclude(aq => aq.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
            _logger.LogWarning("Submit failed: Attempt {AttemptId} not found | CandidateId={CandidateId}", attemptId, candidateId);
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse("Attempt not found");
        }

        if (attempt.CandidateId != candidateId)
        {
            _logger.LogWarning("Submit denied: Attempt {AttemptId} belongs to different candidate | RequestedBy={CandidateId}", attemptId, candidateId);
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse("Access denied");
        }

        var now = DateTime.UtcNow;

        // If already submitted, return success (idempotent) — do NOT return 400
        if (attempt.Status == AttemptStatus.Submitted)
        {
            _logger.LogInformation("Submit idempotent: Attempt {AttemptId} already submitted | CandidateId={CandidateId}", attemptId, candidateId);
            var idempotentSummary = new CandidateResultSummaryDto
            {
                ResultId = 0,
                ExamId = attempt.ExamId,
                ExamTitleEn = attempt.Exam.TitleEn,
                ExamTitleAr = attempt.Exam.TitleAr,
                AttemptNumber = attempt.AttemptNumber,
                SubmittedAt = attempt.SubmittedAt ?? now,
                AllowReview = attempt.Exam.AllowReview,
                ShowCorrectAnswers = attempt.Exam.ShowCorrectAnswers
            };
            return ApiResponse<CandidateResultSummaryDto>.SuccessResponse(
                idempotentSummary,
                "Attempt already submitted successfully.");
        }

        if (attempt.Status == AttemptStatus.Expired || attempt.Status == AttemptStatus.Cancelled)
        {
            _logger.LogWarning("Submit failed: Attempt {AttemptId} is {Status} | CandidateId={CandidateId}", attemptId, attempt.Status, candidateId);
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse($"Attempt is {attempt.Status}");
        }

        // Check expiry — but still mark as submitted if expired (save the answers)
        if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value)
        {
            _logger.LogInformation("Submit on expired attempt: Attempt {AttemptId} expired but submitting anyway | CandidateId={CandidateId}", attemptId, candidateId);
            attempt.Status = AttemptStatus.Submitted;
            attempt.SubmittedAt = now;
            attempt.UpdatedDate = now;
            attempt.UpdatedBy = candidateId;
            await _context.SaveChangesAsync();

            // Still trigger background grading for expired-then-submitted
            _ = TriggerBackgroundGradingAsync(attemptId, candidateId, attempt.Exam.ShowResults);

            var expiredSummary = new CandidateResultSummaryDto
            {
                ResultId = 0,
                ExamId = attempt.ExamId,
                ExamTitleEn = attempt.Exam.TitleEn,
                ExamTitleAr = attempt.Exam.TitleAr,
                AttemptNumber = attempt.AttemptNumber,
                SubmittedAt = now,
                AllowReview = attempt.Exam.AllowReview,
                ShowCorrectAnswers = attempt.Exam.ShowCorrectAnswers
            };
            return ApiResponse<CandidateResultSummaryDto>.SuccessResponse(
                expiredSummary,
                "Attempt submitted successfully (time had expired). Results will be available after grading.");
        }

        // ===== PRIMARY SUBMIT PATH =====
        // Step 1: Persist submission state (this is the critical save)
        attempt.Status = AttemptStatus.Submitted;
        attempt.SubmittedAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = candidateId;

        // Log event
        var submitEvent = new AttemptEvent
        {
            AttemptId = attemptId,
            EventType = AttemptEventType.Submitted,
            OccurredAt = now,
            CreatedDate = now,
            CreatedBy = candidateId
        };
        _context.Set<AttemptEvent>().Add(submitEvent);

        // Close any active proctor session (hard-lock snapshots/events)
        var proctorSession = await _context.Set<Domain.Entities.Proctor.ProctorSession>()
            .FirstOrDefaultAsync(s => s.AttemptId == attemptId
                && s.Status == ProctorSessionStatus.Active);
        if (proctorSession != null)
        {
            proctorSession.Status = ProctorSessionStatus.Completed;
            proctorSession.EndedAt = now;
            proctorSession.UpdatedDate = now;
            proctorSession.UpdatedBy = candidateId;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Submit succeeded: Attempt {AttemptId} submitted | CandidateId={CandidateId} | ExamId={ExamId}",
            attemptId, candidateId, attempt.ExamId);

        // Step 2: Build response IMMEDIATELY (before grading)
        var summary = new CandidateResultSummaryDto
        {
            ResultId = 0,
            ExamId = attempt.ExamId,
            ExamTitleEn = attempt.Exam.TitleEn,
            ExamTitleAr = attempt.Exam.TitleAr,
            AttemptNumber = attempt.AttemptNumber,
            SubmittedAt = now,
            AllowReview = attempt.Exam.AllowReview,
            ShowCorrectAnswers = attempt.Exam.ShowCorrectAnswers
        };

        // Step 3: Fire-and-forget background grading (never blocks submit response)
        _ = TriggerBackgroundGradingAsync(attemptId, candidateId, attempt.Exam.ShowResults);

        return ApiResponse<CandidateResultSummaryDto>.SuccessResponse(
            summary,
            "Attempt submitted successfully. Results will be available after grading.");
    }

    /// <summary>
    /// Background grading: runs in a new DI scope so it doesn't affect the submit response.
    /// Safe fire-and-forget with full error logging.
    /// </summary>
    private async Task TriggerBackgroundGradingAsync(int attemptId, string candidateId, bool showResults)
    {
        try
        {
            await using var scope = _serviceScopeFactory.CreateAsyncScope();
            var gradingService = scope.ServiceProvider.GetRequiredService<IGradingService>();
            var examResultService = scope.ServiceProvider.GetRequiredService<IExamResultService>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<CandidateService>>();

            logger.LogInformation("Background grading started: Attempt {AttemptId} | CandidateId={CandidateId}", attemptId, candidateId);

            var gradingResult = await gradingService.InitiateGradingAsync(
                new InitiateGradingDto { AttemptId = attemptId }, candidateId);

            if (!gradingResult.Success)
            {
                logger.LogWarning("Background grading initiation failed: Attempt {AttemptId} | Message={Message}",
                    attemptId, gradingResult.Message);
                return;
            }

            // If fully auto-graded, finalize result and optionally publish
            if (gradingResult.Data != null && gradingResult.Data.Status == GradingStatus.AutoGraded)
            {
                var finalizeResult = await examResultService.FinalizeResultAsync(
                    gradingResult.Data.GradingSessionId, candidateId);

                if (finalizeResult.Success && finalizeResult.Data != null && showResults)
                {
                    await examResultService.PublishResultAsync(finalizeResult.Data.Id, candidateId);
                    logger.LogInformation("Background grading complete + published: Attempt {AttemptId} | ResultId={ResultId} | IsPassed={IsPassed}",
                        attemptId, finalizeResult.Data.Id, finalizeResult.Data.IsPassed);
                }
                else
                {
                    logger.LogInformation("Background grading finalized: Attempt {AttemptId} | Published={Published}",
                        attemptId, finalizeResult.Success && showResults);
                }
            }
            else
            {
                logger.LogInformation("Background grading requires manual review: Attempt {AttemptId}", attemptId);
            }
        }
        catch (Exception ex)
        {
            // CRITICAL: Never let grading failure propagate — it must only be logged
            _logger.LogError(ex,
                "Background grading FAILED: Attempt {AttemptId} | CandidateId={CandidateId} | Error={Error}. Attempt remains submitted; grading can be retried manually.",
                attemptId, candidateId, ex.Message);
        }
    }

    #endregion

    #region Results

    public async Task<ApiResponse<CandidateResultSummaryDto>> GetMyResultAsync(int attemptId, string candidateId)
    {
        var result = await _context.Set<Domain.Entities.ExamResult.Result>()
 .Include(r => r.Exam)
            .Include(r => r.Attempt)
        .FirstOrDefaultAsync(r => r.AttemptId == attemptId);

        if (result == null)
        {
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse("Result not found or not yet graded");
        }

        if (result.CandidateId != candidateId)
        {
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse("Access denied");
        }

        if (!result.IsPublishedToCandidate)
        {
            return ApiResponse<CandidateResultSummaryDto>.FailureResponse("Result is not yet published");
        }

        var percentage = result.MaxPossibleScore > 0
                 ? (result.TotalScore / result.MaxPossibleScore) * 100
           : 0;

        var summary = new CandidateResultSummaryDto
        {
            ResultId = result.Id,
            ExamId = result.ExamId,
            ExamTitleEn = result.Exam.TitleEn,
            ExamTitleAr = result.Exam.TitleAr,
            AttemptNumber = result.Attempt.AttemptNumber,
            SubmittedAt = result.Attempt.SubmittedAt ?? DateTime.UtcNow,
            AllowReview = result.Exam.AllowReview,
            ShowCorrectAnswers = result.Exam.ShowCorrectAnswers
        };

        // Respect exam ShowResults setting
        if (result.Exam.ShowResults)
        {
            summary.TotalScore = result.TotalScore;
            summary.MaxPossibleScore = result.MaxPossibleScore;
            summary.Percentage = percentage;
            summary.IsPassed = result.IsPassed;
            summary.GradeLabel = result.GradeLabel;
        }

        return ApiResponse<CandidateResultSummaryDto>.SuccessResponse(summary);
    }

    public async Task<ApiResponse<CandidateResultReviewDto>> GetMyResultReviewAsync(int attemptId, string candidateId)
    {
        var result = await _context.Set<Domain.Entities.ExamResult.Result>()
        .Include(r => r.Exam)
    .Include(r => r.Attempt)
            .FirstOrDefaultAsync(r => r.AttemptId == attemptId);

        if (result == null)
        {
            return ApiResponse<CandidateResultReviewDto>.FailureResponse("Result not found");
        }

        if (result.CandidateId != candidateId)
        {
            return ApiResponse<CandidateResultReviewDto>.FailureResponse("Access denied");
        }

        if (!result.IsPublishedToCandidate)
        {
            return ApiResponse<CandidateResultReviewDto>.FailureResponse("Result not published");
        }

        // Check AllowReview setting
        if (!result.Exam.AllowReview)
        {
            return ApiResponse<CandidateResultReviewDto>.FailureResponse(
                "Review is not allowed for this exam");
        }

        // Get attempt with answers and grading
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
       .Include(a => a.Questions.OrderBy(q => q.Order))
   .ThenInclude(aq => aq.Question)
            .ThenInclude(q => q.QuestionType)
    .Include(a => a.Questions)
                .ThenInclude(aq => aq.Question)
         .ThenInclude(q => q.Options)
          .Include(a => a.Questions)
         .ThenInclude(aq => aq.Answers)
            .FirstAsync(a => a.Id == attemptId);

        // Get graded answers
        var gradedAnswers = await _context.Set<Domain.Entities.Grading.GradedAnswer>()
       .Include(ga => ga.GradingSession)
          .Where(ga => ga.GradingSession.AttemptId == attemptId &&
 ga.GradingSession.Status == GradingStatus.Completed)
       .ToDictionaryAsync(ga => ga.QuestionId);

        var percentage = result.MaxPossibleScore > 0
      ? (result.TotalScore / result.MaxPossibleScore) * 100
          : 0;

        var review = new CandidateResultReviewDto
        {
            ResultId = result.Id,
            ExamId = result.ExamId,
            ExamTitleEn = result.Exam.TitleEn,
            ExamTitleAr = result.Exam.TitleAr,
            AttemptNumber = attempt.AttemptNumber,
            SubmittedAt = attempt.SubmittedAt ?? DateTime.UtcNow
        };

        // Respect ShowResults
        if (result.Exam.ShowResults)
        {
            review.TotalScore = result.TotalScore;
            review.MaxPossibleScore = result.MaxPossibleScore;
            review.Percentage = percentage;
            review.IsPassed = result.IsPassed;
            review.GradeLabel = result.GradeLabel;
        }

        // Build questions
        var questions = new List<CandidateResultQuestionDto>();
        foreach (var aq in attempt.Questions.OrderBy(q => q.Order))
        {
            var answer = aq.Answers.FirstOrDefault();
            gradedAnswers.TryGetValue(aq.QuestionId, out var gradedAnswer);

            var questionDto = new CandidateResultQuestionDto
            {
                QuestionId = aq.QuestionId,
                Order = aq.Order,
                BodyEn = aq.Question.BodyEn,
                BodyAr = aq.Question.BodyAr,
                QuestionTypeName = aq.Question.QuestionType?.NameEn ?? "",
                Points = aq.Points,
                ScoreEarned = gradedAnswer?.Score,
                SelectedOptionIds = answer != null && !string.IsNullOrEmpty(answer.SelectedOptionIdsJson)
    ? JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson)
          : null,
                TextAnswer = answer?.TextAnswer
            };

            // Options with conditional correctness
            var selectedIds = questionDto.SelectedOptionIds ?? new List<int>();
            questionDto.Options = aq.Question.Options
           .OrderBy(o => o.Order)
               .Select(o => new CandidateResultOptionDto
               {
                   Id = o.Id,
                   TextEn = o.TextEn,
                   TextAr = o.TextAr,
                   WasSelected = selectedIds.Contains(o.Id),
                   // Only show IsCorrect if ShowCorrectAnswers = true
                   IsCorrect = result.Exam.ShowCorrectAnswers ? o.IsCorrect : null
               })
                      .ToList();

            // Only show IsCorrect and Feedback if ShowCorrectAnswers = true
            if (result.Exam.ShowCorrectAnswers && gradedAnswer != null)
            {
                questionDto.IsCorrect = gradedAnswer.IsCorrect;
                questionDto.Feedback = gradedAnswer.GraderComment;
            }

            questions.Add(questionDto);
        }

        review.Questions = questions;

        return ApiResponse<CandidateResultReviewDto>.SuccessResponse(review);
    }

    #endregion

    #region Dashboard

    public async Task<ApiResponse<CandidateDashboardDto>> GetDashboardAsync(string candidateId)
    {
        var now = DateTime.UtcNow;

        // Get user info
        var user = await _userManager.FindByIdAsync(candidateId);
        if (user == null)
        {
            return ApiResponse<CandidateDashboardDto>.FailureResponse("User not found");
        }

        // Get all candidate's attempts
        var allAttempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
                   .Include(a => a.Exam)
                   .Where(a => a.CandidateId == candidateId)
           .ToListAsync();

        // Get all available exams (same logic as GetAvailableExamsAsync)
        var roles = await _userManager.GetRolesAsync(user);
        var isCandidate = roles.Contains(AppRoles.Candidate);

        var examsQuery = _context.Exams
                .Include(e => e.Sections.Where(s => !s.IsDeleted))
         .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
         .Where(e => e.IsPublished && e.IsActive && !e.IsDeleted);

        if (!isCandidate && user.DepartmentId.HasValue)
        {
            examsQuery = examsQuery.Where(e => e.DepartmentId == user.DepartmentId.Value);
        }

        var availableExams = await examsQuery.ToListAsync();

        // Get results
        var results = await _context.Set<Domain.Entities.ExamResult.Result>()
       .Where(r => r.CandidateId == candidateId)
     .ToListAsync();

        // Calculate statistics
        var completedAttempts = allAttempts.Where(a => a.Status == AttemptStatus.Submitted).ToList();
        var passedResults = results.Where(r => r.IsPassed == true).Count();
        var totalResults = results.Count;
        var passRate = totalResults > 0 ? (decimal)passedResults / totalResults * 100 : 0;

        // Pending grading (submitted but no result yet)
        var submittedAttemptIds = allAttempts
     .Where(a => a.Status == AttemptStatus.Submitted)
   .Select(a => a.Id)
       .ToHashSet();
        var gradedAttemptIds = results.Select(r => r.AttemptId).ToHashSet();
        var pendingGrading = submittedAttemptIds.Except(gradedAttemptIds).Count();

        // Statistics changes (mock for now - could compare with previous period)
        var totalExamsChangePercent = 0; // Could calculate based on historical data
        var totalAttemptsChangePercent = 0;

        var stats = new DashboardStatsDto
        {
            TotalExamsAvailable = availableExams.Count,
            TotalExamsAvailableChangePercent = totalExamsChangePercent,
            TotalAttempts = allAttempts.Count,
            TotalAttemptsChangePercent = totalAttemptsChangePercent,
            PassRate = Math.Round(passRate, 1),
            PendingGrading = pendingGrading
        };

        // Exams by status
        var activeAttemptExamIds = allAttempts
            .Where(a => a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed)
            .Select(a => a.ExamId)
  .ToHashSet();

        var completedExamIds = results
            .Select(r => r.ExamId)
        .Distinct()
    .ToHashSet();

        var upcomingExams = availableExams
    .Where(e => !activeAttemptExamIds.Contains(e.Id) && !completedExamIds.Contains(e.Id))
            .Where(e => !e.StartAt.HasValue || e.StartAt.Value > now)
      .ToList();

        var examsByStatus = new ExamsByStatusDto
        {
            UpcomingCount = upcomingExams.Count,
            ActiveCount = activeAttemptExamIds.Count,
            CompletedCount = completedExamIds.Count
        };

        // Quick actions (active attempts to resume)
        var activeAttempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Exam)
      .Where(a => a.CandidateId == candidateId &&
    (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed))
     .ToListAsync();

        var quickActions = activeAttempts.Select(a =>
        {
            var remainingMinutes = a.ExpiresAt.HasValue
                       ? Math.Max(0, (int)(a.ExpiresAt.Value - now).TotalMinutes)
                   : 0;

            return new QuickActionDto
            {
                AttemptId = a.Id,
                ExamId = a.ExamId,
                ExamTitleEn = a.Exam.TitleEn,
                ExamTitleAr = a.Exam.TitleAr,
                ActionType = "Resume",
                ExpiresAt = a.ExpiresAt,
                RemainingMinutes = remainingMinutes
            };
        }).ToList();

        // Upcoming exams (next 5)
        var upcomingExamsList = availableExams
 .Where(e => !activeAttemptExamIds.Contains(e.Id))
            .Where(e => !e.StartAt.HasValue || e.StartAt.Value <= now.AddDays(30))
      .OrderBy(e => e.StartAt ?? DateTime.MaxValue)
   .Take(5)
 .Select(e =>
       {
           var attemptsUsed = allAttempts.Count(a => a.ExamId == e.Id);
           return new UpcomingExamDto
           {
               ExamId = e.Id,
               TitleEn = e.TitleEn,
               TitleAr = e.TitleAr,
               ExamType = e.ExamType,
               StartAt = e.StartAt,
               EndAt = e.EndAt,
               DurationMinutes = e.DurationMinutes,
               TotalQuestions = e.Sections.SelectMany(s => s.Questions).Count(),
               TotalPoints = e.Sections.SelectMany(s => s.Questions).Sum(q => q.Points),
               AttemptsUsed = attemptsUsed,
               MaxAttempts = e.MaxAttempts
           };
       })
            .ToList();

        // Recent activity (last 10)
        var recentActivity = new List<RecentActivityDto>();

        // Add attempt activities
        var recentAttempts = allAttempts
     .OrderByDescending(a => a.CreatedDate)
            .Take(10)
       .ToList();

        foreach (var attempt in recentAttempts)
        {
            if (attempt.Status == AttemptStatus.Started || attempt.Status == AttemptStatus.InProgress)
            {
                recentActivity.Add(new RecentActivityDto
                {
                    ActivityType = "Attempt Started",
                    ExamId = attempt.ExamId,
                    ExamTitleEn = attempt.Exam.TitleEn,
                    ExamTitleAr = attempt.Exam.TitleAr,
                    AttemptId = attempt.Id,
                    ActivityDate = attempt.StartedAt,
                    Description = $"Attempt #{attempt.AttemptNumber} in progress"
                });
            }
            else if (attempt.Status == AttemptStatus.Submitted && attempt.SubmittedAt.HasValue)
            {
                recentActivity.Add(new RecentActivityDto
                {
                    ActivityType = "Attempt Submitted",
                    ExamId = attempt.ExamId,
                    ExamTitleEn = attempt.Exam.TitleEn,
                    ExamTitleAr = attempt.Exam.TitleAr,
                    AttemptId = attempt.Id,
                    ActivityDate = attempt.SubmittedAt.Value,
                    Description = $"Attempt #{attempt.AttemptNumber} submitted"
                });
            }
        }

        // Add result activities
        var recentResults = results
         .Where(r => r.IsPublishedToCandidate && r.PublishedAt.HasValue)
         .OrderByDescending(r => r.PublishedAt)
        .Take(5)
        .ToList();

        foreach (var result in recentResults)
        {
            var exam = availableExams.FirstOrDefault(e => e.Id == result.ExamId);
            recentActivity.Add(new RecentActivityDto
            {
                ActivityType = "Result Published",
                ExamId = result.ExamId,
                ExamTitleEn = exam?.TitleEn ?? "Exam",
                ExamTitleAr = exam?.TitleAr ?? "??????",
                AttemptId = result.AttemptId,
                ActivityDate = result.PublishedAt ?? DateTime.UtcNow,
                Description = result.IsPassed ? "Passed" : "Not Passed",
                Score = result.TotalScore,
                IsPassed = result.IsPassed
            });
        }

        // Sort and limit recent activity
        recentActivity = recentActivity
              .OrderByDescending(a => a.ActivityDate)
            .Take(10)
               .ToList();

        var dashboard = new CandidateDashboardDto
        {
            CandidateName = user.FullName ?? user.DisplayName ?? user.UserName ?? "Candidate",
            CandidateEmail = user.Email ?? "",
            CurrentDateUtc = now,
            Stats = stats,
            ExamsByStatus = examsByStatus,
            QuickActions = quickActions,
            UpcomingExams = upcomingExamsList,
            RecentActivity = recentActivity
        };

        return ApiResponse<CandidateDashboardDto>.SuccessResponse(dashboard);
    }

    #endregion

    #region Private Helpers

    private async Task<CandidateEligibilityDto> CheckEligibilityAsync(
        Domain.Entities.Assessment.Exam exam, string candidateId)
    {
        var eligibility = new CandidateEligibilityDto
        {
            CanStartNow = true,
            Reasons = new List<string>()
        };

        var now = DateTime.UtcNow;

        // Check schedule (Flexible vs Fixed)
        if (exam.ExamType == ExamType.Fixed)
        {
            var graceMinutes = ExamDefaults.FixedStartGraceMinutes;
            var windowEnd = exam.StartAt.HasValue
                ? exam.StartAt.Value.AddMinutes(graceMinutes)
                : (DateTime?)null;

            if (windowEnd.HasValue && exam.EndAt.HasValue && windowEnd.Value > exam.EndAt.Value)
                windowEnd = exam.EndAt.Value;

            if (exam.EndAt.HasValue && now > exam.EndAt.Value)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Exam ended at {exam.EndAt.Value:yyyy-MM-dd HH:mm} UTC");
            }
            else if (exam.StartAt.HasValue && now < exam.StartAt.Value)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Exam starts at {exam.StartAt.Value:yyyy-MM-dd HH:mm} UTC");
            }
            else if (windowEnd.HasValue && now > windowEnd.Value)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Start window has passed. Must start within {graceMinutes} minutes of {exam.StartAt!.Value:yyyy-MM-dd HH:mm} UTC");
            }
        }
        else
        {
            // Flexible
            if (exam.StartAt.HasValue && now < exam.StartAt.Value)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Exam is available from {exam.StartAt.Value:yyyy-MM-dd HH:mm} UTC");
            }

            if (exam.EndAt.HasValue && now > exam.EndAt.Value)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Exam ended at {exam.EndAt.Value:yyyy-MM-dd HH:mm} UTC");
            }
        }

        // Check attempts
        var attemptCount = await _context.Set<Domain.Entities.Attempt.Attempt>()
        .CountAsync(a => a.ExamId == exam.Id && a.CandidateId == candidateId);

        eligibility.AttemptsUsed = attemptCount;
        eligibility.AttemptsRemaining = exam.MaxAttempts > 0
            ? Math.Max(0, exam.MaxAttempts - attemptCount)
  : null;

        if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
        {
            // Check for admin override before blocking
            var hasOverride = await _context.Set<Domain.Entities.Attempt.AdminAttemptOverride>()
                .AnyAsync(o => o.CandidateId == candidateId
                             && o.ExamId == exam.Id
                             && !o.IsUsed
                             && !o.IsDeleted);

            if (!hasOverride)
            {
                eligibility.CanStartNow = false;
                eligibility.Reasons.Add($"Maximum attempts ({exam.MaxAttempts}) reached");
            }
        }

        // Check for existing active attempt
        var hasActive = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .AnyAsync(a => a.ExamId == exam.Id &&
   a.CandidateId == candidateId &&
  (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed));

        if (hasActive)
        {
            eligibility.Reasons.Add("You have an active attempt in progress");
        }

        return eligibility;
    }

    private DateTime CalculateExpiresAt(DateTime startedAt, int durationMinutes, DateTime? examEndAt)
    {
        var durationExpiry = startedAt.AddMinutes(durationMinutes);

        if (examEndAt.HasValue)
        {
            return durationExpiry < examEndAt.Value ? durationExpiry : examEndAt.Value;
        }

        return durationExpiry;
    }

    private int CalculateRemainingSeconds(Domain.Entities.Attempt.Attempt attempt)
    {
        if (!attempt.ExpiresAt.HasValue) return 0;
        if (attempt.Status == AttemptStatus.Submitted || attempt.Status == AttemptStatus.Expired ||
         attempt.Status == AttemptStatus.Cancelled || attempt.Status == AttemptStatus.Terminated)
        {
            return 0;
        }

        var remaining = (int)(attempt.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds;
        return Math.Max(0, remaining);
    }

    private async Task<CandidateAttemptSessionDto> BuildCandidateSessionDto(
        Domain.Entities.Attempt.Attempt attempt,
        Domain.Entities.Assessment.Exam exam)
    {
        var now = DateTime.UtcNow;

        // Get all attempt questions with their answers, including Subject/Topic for Builder sections
        var attemptQuestions = await _context.Set<AttemptQuestion>()
            .Include(aq => aq.Question)
                .ThenInclude(q => q.QuestionType)
            .Include(aq => aq.Question)
                .ThenInclude(q => q.Options.Where(o => !o.IsDeleted))
            .Include(aq => aq.Question)
                .ThenInclude(q => q.Attachments.Where(a => !a.IsDeleted))
            .Include(aq => aq.Question)
                .ThenInclude(q => q.Subject)
            .Include(aq => aq.Question)
                .ThenInclude(q => q.Topic)
            .Include(aq => aq.Answers)
            .Where(aq => aq.AttemptId == attempt.Id)
            .OrderBy(aq => aq.Order)
            .ToListAsync();

        // Get exam questions with section/topic info to map attempt questions (for Manual sections)
        var examQuestions = await _context.Set<Domain.Entities.Assessment.ExamQuestion>()
            .Where(eq => eq.ExamId == exam.Id && !eq.IsDeleted)
            .ToListAsync();

        // Create a lookup for exam questions by QuestionId
        var examQuestionLookup = examQuestions.ToDictionary(eq => eq.QuestionId);

        // Get sections with topics, QuestionSubject, and QuestionTopic for Builder sections
        var sections = await _context.Set<Domain.Entities.Assessment.ExamSection>()
            .Include(s => s.Topics.Where(t => !t.IsDeleted).OrderBy(t => t.Order))
            .Include(s => s.QuestionSubject)
            .Include(s => s.QuestionTopic)
            .Where(s => s.ExamId == exam.Id && !s.IsDeleted)
            .OrderBy(s => s.Order)
            .ToListAsync();

        // Build flat questions list for backward compatibility
        var flatQuestions = new List<CandidateQuestionDto>();

        // Build sections with topics and questions
        var sectionDtos = new List<CandidateSectionDto>();

        // Track which attempt questions have been assigned to sections
        var assignedQuestionIds = new HashSet<int>();

        foreach (var section in sections)
        {
            var topicDtos = new List<CandidateTopicDto>();
            var directSectionQuestionDtos = new List<CandidateQuestionDto>();

            // Check if this is a Builder section
            var isBuilderSection = section.SourceType.HasValue && section.QuestionSubjectId.HasValue;

            if (isBuilderSection)
            {
                // Builder section - match questions by SubjectId/TopicId
                List<AttemptQuestion> sectionAttemptQuestions;

                if (section.SourceType == SectionSourceType.Topic && section.QuestionTopicId.HasValue)
                {
                    // SourceType = Topic: All questions belong to this specific topic
                    sectionAttemptQuestions = attemptQuestions
                        .Where(aq => aq.Question.TopicId == section.QuestionTopicId && !assignedQuestionIds.Contains(aq.Id))
                        .ToList();
                }
                else
                {
                    // SourceType = Subject: All questions from this subject (may have multiple topics)
                    sectionAttemptQuestions = attemptQuestions
                        .Where(aq => aq.Question.SubjectId == section.QuestionSubjectId && !assignedQuestionIds.Contains(aq.Id))
                        .ToList();
                }

                if (!sectionAttemptQuestions.Any())
                    continue; // Skip empty sections

                // Mark questions as assigned
                foreach (var aq in sectionAttemptQuestions)
                    assignedQuestionIds.Add(aq.Id);

                if (section.SourceType == SectionSourceType.Subject)
                {
                    // Group questions by TopicId for Subject mode
                    var groupedByTopic = sectionAttemptQuestions
                        .GroupBy(aq => aq.Question.TopicId)
                        .OrderBy(g => g.Key ?? int.MaxValue)
                        .ToList();

                    int topicOrder = 1;
                    foreach (var topicGroup in groupedByTopic)
                    {
                        var topicQuestions = topicGroup.ToList();
                        var topicQuestionDtos = BuildQuestionDtos(topicQuestions, exam, section.Id, topicGroup.Key);
                        flatQuestions.AddRange(topicQuestionDtos);

                        // Get topic name from Question.Topic navigation (first question's topic)
                        var firstQuestion = topicQuestions.First().Question;
                        var topicName = firstQuestion.Topic;

                        topicDtos.Add(new CandidateTopicDto
                        {
                            TopicId = topicGroup.Key ?? 0,
                            Order = topicOrder++,
                            TitleEn = topicName?.NameEn ?? "General",
                            TitleAr = topicName?.NameAr ?? "عام",
                            DescriptionEn = null,
                            DescriptionAr = null,
                            TotalPoints = topicQuestionDtos.Sum(q => q.Points),
                            TotalQuestions = topicQuestionDtos.Count,
                            AnsweredQuestions = topicQuestionDtos.Count(q => q.CurrentAnswer != null),
                            Questions = topicQuestionDtos
                        });
                    }
                }
                else
                {
                    // SourceType = Topic: All questions go directly into section (single topic)
                    directSectionQuestionDtos = BuildQuestionDtos(sectionAttemptQuestions, exam, section.Id, section.QuestionTopicId);
                    flatQuestions.AddRange(directSectionQuestionDtos);
                }
            }
            else
            {
                // Manual section - use ExamQuestions/ExamTopics as before
                var sectionExamQuestions = examQuestions
                    .Where(eq => eq.ExamSectionId == section.Id)
                    .ToList();

                var sectionAttemptQuestions = attemptQuestions
                    .Where(aq => sectionExamQuestions.Any(eq => eq.QuestionId == aq.QuestionId))
                    .ToList();

                if (!sectionAttemptQuestions.Any())
                    continue; // Skip empty sections

                // Mark questions as assigned
                foreach (var aq in sectionAttemptQuestions)
                    assignedQuestionIds.Add(aq.Id);

                // Build topics for this section
                foreach (var topic in section.Topics.OrderBy(t => t.Order))
                {
                    var topicExamQuestions = sectionExamQuestions
                        .Where(eq => eq.ExamTopicId == topic.Id)
                        .ToList();

                    var topicAttemptQuestions = attemptQuestions
                        .Where(aq => topicExamQuestions.Any(eq => eq.QuestionId == aq.QuestionId))
                        .ToList();

                    if (!topicAttemptQuestions.Any())
                        continue; // Skip empty topics

                    var topicQuestionDtos = BuildQuestionDtos(topicAttemptQuestions, exam, section.Id, topic.Id);
                    flatQuestions.AddRange(topicQuestionDtos);

                    topicDtos.Add(new CandidateTopicDto
                    {
                        TopicId = topic.Id,
                        Order = topic.Order,
                        TitleEn = topic.TitleEn,
                        TitleAr = topic.TitleAr,
                        DescriptionEn = topic.DescriptionEn,
                        DescriptionAr = topic.DescriptionAr,
                        TotalPoints = topicQuestionDtos.Sum(q => q.Points),
                        TotalQuestions = topicQuestionDtos.Count,
                        AnsweredQuestions = topicQuestionDtos.Count(q => q.CurrentAnswer != null),
                        Questions = topicQuestionDtos
                    });
                }

                // Get questions directly under section (not in any topic)
                var directSectionExamQuestions = sectionExamQuestions
                    .Where(eq => eq.ExamTopicId == null)
                    .ToList();

                var directSectionAttemptQuestions = attemptQuestions
                    .Where(aq => directSectionExamQuestions.Any(eq => eq.QuestionId == aq.QuestionId))
                    .ToList();

                directSectionQuestionDtos = BuildQuestionDtos(directSectionAttemptQuestions, exam, section.Id, null);
                flatQuestions.AddRange(directSectionQuestionDtos);
            }

            // Calculate section totals
            var allSectionQuestionDtos = topicDtos.SelectMany(t => t.Questions).Concat(directSectionQuestionDtos).ToList();

            sectionDtos.Add(new CandidateSectionDto
            {
                SectionId = section.Id,
                Order = section.Order,
                TitleEn = section.TitleEn,
                TitleAr = section.TitleAr,
                DescriptionEn = section.DescriptionEn,
                DescriptionAr = section.DescriptionAr,
                // Builder section metadata
                SourceType = section.SourceType.HasValue ? (int)section.SourceType.Value : null,
                SubjectId = section.QuestionSubjectId,
                SubjectTitleEn = section.QuestionSubject?.NameEn,
                SubjectTitleAr = section.QuestionSubject?.NameAr,
                TopicId = section.QuestionTopicId,
                TopicTitleEn = section.QuestionTopic?.NameEn,
                TopicTitleAr = section.QuestionTopic?.NameAr,
                DurationMinutes = section.DurationMinutes,
                // Section timer info
                RemainingSeconds = section.DurationMinutes.HasValue ? section.DurationMinutes.Value * 60 : null,
                SectionStartedAtUtc = null, // Would need to track when candidate entered section
                SectionExpiresAtUtc = null, // Would calculate based on section start + duration
                TotalPoints = allSectionQuestionDtos.Sum(q => q.Points),
                TotalQuestions = allSectionQuestionDtos.Count,
                AnsweredQuestions = allSectionQuestionDtos.Count(q => q.CurrentAnswer != null),
                Topics = topicDtos,
                Questions = directSectionQuestionDtos
            });
        }

        // FALLBACK: If there are attempt questions that weren't assigned to any section
        var unassignedQuestions = attemptQuestions.Where(aq => !assignedQuestionIds.Contains(aq.Id)).ToList();
        if (unassignedQuestions.Any())
        {
            var unassignedQuestionDtos = BuildQuestionDtos(unassignedQuestions, exam, 0, null);
            flatQuestions.AddRange(unassignedQuestionDtos);
        }

        var instructions = exam.Instructions
            .Where(i => !i.IsDeleted)
            .OrderBy(i => i.Order)
            .Select(i => new CandidateExamInstructionDto
            {
                Order = i.Order,
                ContentEn = i.ContentEn,
                ContentAr = i.ContentAr
            })
            .ToList();

        return new CandidateAttemptSessionDto
        {
            AttemptId = attempt.Id,
            ExamId = exam.Id,
            ExamTitleEn = exam.TitleEn,
            ExamTitleAr = exam.TitleAr,
            StartedAtUtc = attempt.StartedAt,
            ExpiresAtUtc = attempt.ExpiresAt ?? now,
            RemainingSeconds = CalculateRemainingSeconds(attempt),
            Status = attempt.Status,
            AttemptNumber = attempt.AttemptNumber,
            MaxAttempts = exam.MaxAttempts,
            TotalQuestions = flatQuestions.Count,
            AnsweredQuestions = flatQuestions.Count(q => q.CurrentAnswer != null),
            ExamSettings = new CandidateExamSettingsDto
            {
                ShuffleQuestions = exam.ShuffleQuestions,
                ShuffleOptions = exam.ShuffleOptions,
                LockPreviousSections = true, // Default behavior
                PreventBackNavigation = false // Default behavior
            },
            Sections = sectionDtos,
            Questions = flatQuestions.OrderBy(q => q.Order).ToList(),
            Instructions = instructions
        };
    }

    private List<CandidateQuestionDto> BuildQuestionDtos(
        List<AttemptQuestion> attemptQuestions,
 Domain.Entities.Assessment.Exam exam,
        int sectionId,
    int? topicId)
    {
        var questionDtos = new List<CandidateQuestionDto>();

        foreach (var aq in attemptQuestions)
        {
            // Get options and shuffle if enabled (NOTE: NO IsCorrect field exposed)
            var optionsList = aq.Question.Options.ToList();
            if (exam.ShuffleOptions)
            {
                optionsList = optionsList.OrderBy(_ => Guid.NewGuid()).ToList();
            }
            else
            {
                optionsList = optionsList.OrderBy(o => o.Order).ToList();
            }

            var options = optionsList.Select(o => new CandidateQuestionOptionDto
            {
                Id = o.Id,
                TextEn = o.TextEn,
                TextAr = o.TextAr,
                Order = o.Order,
                AttachmentPath = o.AttachmentPath
                // NO IsCorrect here!
            }).ToList();

            var currentAnswer = aq.Answers.FirstOrDefault();

            questionDtos.Add(new CandidateQuestionDto
            {
                AttemptQuestionId = aq.Id,
                QuestionId = aq.QuestionId,
                Order = aq.Order,
                Points = aq.Points,
                BodyEn = aq.Question.BodyEn,
                BodyAr = aq.Question.BodyAr,
                QuestionTypeName = aq.Question.QuestionType?.NameEn ?? "",
                QuestionTypeId = aq.Question.QuestionTypeId,
                SectionId = sectionId,
                TopicId = topicId,
                Options = options,
                Attachments = aq.Question.Attachments.Select(a => new CandidateQuestionAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    FileType = a.FileType
                }).ToList(),
                CurrentAnswer = currentAnswer != null ? new CandidateAnswerDto
                {
                    AttemptAnswerId = currentAnswer.Id,
                    QuestionId = currentAnswer.QuestionId,
                    SelectedOptionIds = !string.IsNullOrEmpty(currentAnswer.SelectedOptionIdsJson)
      ? JsonSerializer.Deserialize<List<int>>(currentAnswer.SelectedOptionIdsJson)
          : null,
                    TextAnswer = currentAnswer.TextAnswer,
                    AnsweredAt = currentAnswer.AnsweredAt
                } : null
            });
        }

        return questionDtos;
    }

    #endregion

    #region Exam Journey

    public async Task<ApiResponse<ExamJourneyDto>> GetExamJourneyAsync(string candidateId)
    {
        var now = DateTime.UtcNow;

        // Get user info
        var user = await _userManager.FindByIdAsync(candidateId);
        if (user == null)
        {
            return ApiResponse<ExamJourneyDto>.FailureResponse("User not found");
        }

        // Get all candidate's attempts with results
        var allAttempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Exam)
            .Include(a => a.Questions)
                .ThenInclude(q => q.Answers)
            .Where(a => a.CandidateId == candidateId && !a.IsDeleted)
            .ToListAsync();

        // Get all results for this candidate
        var results = await _context.Set<Domain.Entities.ExamResult.Result>()
            .Where(r => r.CandidateId == candidateId && !r.IsDeleted)
            .ToListAsync();

        // Get all available exams
        var roles = await _userManager.GetRolesAsync(user);
        var isCandidate = roles.Contains(AppRoles.Candidate);

        var examsQuery = _context.Exams
            .Include(e => e.Sections.Where(s => !s.IsDeleted))
                .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
            .Where(e => e.IsPublished && e.IsActive && !e.IsDeleted);

        if (!isCandidate && user.DepartmentId.HasValue)
        {
            examsQuery = examsQuery.Where(e => e.DepartmentId == user.DepartmentId.Value);
        }

        var availableExams = await examsQuery.ToListAsync();

        // Build journey groups
        var inProgress = new List<JourneyExamCardDto>();
        var readyToStart = new List<JourneyExamCardDto>();
        var finished = new List<JourneyExamCardDto>();
        var waitingResult = new List<JourneyExamCardDto>();
        var locked = new List<JourneyExamCardDto>();
        var history = new List<JourneyExamCardDto>();

        foreach (var exam in availableExams)
        {
            var examAttempts = allAttempts.Where(a => a.ExamId == exam.Id).ToList();
            var examResults = results.Where(r => r.ExamId == exam.Id).ToList();
            var attemptsUsed = examAttempts.Count;

            // Check for active (in-progress) attempt
            var activeAttempt = examAttempts
                .Where(a => (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress || a.Status == AttemptStatus.Resumed)
                            && a.ExpiresAt.HasValue && a.ExpiresAt.Value > now)
                .OrderByDescending(a => a.CreatedDate)
                .FirstOrDefault();

            // Latest attempt info
            var latestAttempt = examAttempts.OrderByDescending(a => a.CreatedDate).FirstOrDefault();
            var latestResult = examResults.OrderByDescending(r => r.CreatedDate).FirstOrDefault();

            // Calculate exam totals
            var totalQuestions = exam.Sections.SelectMany(s => s.Questions).Count();
            var totalPoints = exam.Sections.SelectMany(s => s.Questions).Sum(q => q.Points);

            // Build card
            var card = new JourneyExamCardDto
            {
                ExamId = exam.Id,
                TitleEn = exam.TitleEn,
                TitleAr = exam.TitleAr,
                DescriptionEn = exam.DescriptionEn,
                DescriptionAr = exam.DescriptionAr,
                DurationMinutes = exam.DurationMinutes,
                TotalQuestions = totalQuestions,
                TotalPoints = totalPoints,
                PassScore = exam.PassScore,
                AttemptsUsed = attemptsUsed,
                MaxAttempts = exam.MaxAttempts,
                LatestAttemptId = latestAttempt?.Id,
                StartAt = exam.StartAt,
                EndAt = exam.EndAt,
                ExamType = exam.ExamType
            };

            // Determine journey stage
            if (activeAttempt != null)
            {
                // IN_PROGRESS
                var answeredCount = activeAttempt.Questions?.Count(q =>
                    q.Answers.Any(a => !string.IsNullOrEmpty(a.SelectedOptionIdsJson) || !string.IsNullOrEmpty(a.TextAnswer))) ?? 0;
                var remainingSeconds = (int)(activeAttempt.ExpiresAt!.Value - now).TotalSeconds;

                card.Stage = JourneyStage.InProgress;
                card.RemainingSeconds = Math.Max(0, remainingSeconds);
                card.AnsweredQuestions = answeredCount;
                card.CtaType = "resume";
                card.CtaTarget = $"/take-exam/{activeAttempt.Id}";
                card.LatestAttemptId = activeAttempt.Id;
                inProgress.Add(card);
            }
            else if (latestAttempt?.Status == AttemptStatus.Submitted)
            {
                // Check if result exists and is published
                if (latestResult != null && latestResult.IsPublishedToCandidate)
                {
                    // FINISHED - has published result
                    card.Stage = JourneyStage.Finished;
                    card.IsResultPublished = true;
                    card.IsPassed = latestResult.IsPassed;
                    card.Score = latestResult.TotalScore;
                    card.MaxScore = latestResult.MaxPossibleScore;
                    card.Percentage = latestResult.MaxPossibleScore > 0
                        ? Math.Round((latestResult.TotalScore / latestResult.MaxPossibleScore) * 100, 1)
                        : 0;
                    card.CtaType = "view-result";
                    card.CtaTarget = $"/results/my-result/{latestAttempt.Id}";
                    finished.Add(card);
                }
                else
                {
                    // WAITING_RESULT - submitted but not graded/published
                    card.Stage = JourneyStage.WaitingResult;
                    card.IsResultPublished = false;
                    card.CtaType = "waiting";
                    waitingResult.Add(card);
                }
            }
            else if (latestAttempt?.Status == AttemptStatus.Expired || latestAttempt?.Status == AttemptStatus.Cancelled)
            {
                // Check eligibility for restart
                var canRestart = CheckEligibility(exam, attemptsUsed, now);
                if (canRestart.CanStartNow)
                {
                    card.Stage = JourneyStage.ReadyToStart;
                    card.CanStartNow = true;
                    card.CtaType = "start";
                    card.CtaTarget = $"/exams/{exam.Id}/preview";
                    readyToStart.Add(card);
                }
                else
                {
                    // HISTORY - expired attempt, can't restart
                    card.Stage = JourneyStage.History;
                    card.CanStartNow = false;
                    card.LockReasons = canRestart.Reasons;
                    card.CtaType = "locked";
                    history.Add(card);
                }
            }
            else
            {
                // No attempt yet - check eligibility
                var eligibility = CheckEligibility(exam, attemptsUsed, now);
                if (eligibility.CanStartNow)
                {
                    // READY_TO_START
                    card.Stage = JourneyStage.ReadyToStart;
                    card.CanStartNow = true;
                    card.CtaType = "start";
                    card.CtaTarget = $"/exams/{exam.Id}/preview";
                    readyToStart.Add(card);
                }
                else
                {
                    // LOCKED
                    card.Stage = JourneyStage.Locked;
                    card.CanStartNow = false;
                    card.LockReasons = eligibility.Reasons;
                    card.CtaType = "locked";
                    locked.Add(card);
                }
            }
        }

        // Determine primary action
        PrimaryActionDto? primaryAction = null;

        // Priority 1: Resume in-progress
        var topInProgress = inProgress.OrderBy(c => c.RemainingSeconds).FirstOrDefault();
        if (topInProgress != null)
        {
            primaryAction = new PrimaryActionDto
            {
                ActionType = PrimaryActionType.Resume,
                ExamId = topInProgress.ExamId,
                AttemptId = topInProgress.LatestAttemptId,
                TitleEn = topInProgress.TitleEn,
                TitleAr = topInProgress.TitleAr,
                RemainingSeconds = topInProgress.RemainingSeconds,
                AnsweredQuestions = topInProgress.AnsweredQuestions,
                TotalQuestions = topInProgress.TotalQuestions,
                StatusLabel = "In Progress"
            };
        }
        // Priority 2: Start new exam
        else if (readyToStart.Any())
        {
            var topReady = readyToStart.First();
            primaryAction = new PrimaryActionDto
            {
                ActionType = PrimaryActionType.Start,
                ExamId = topReady.ExamId,
                TitleEn = topReady.TitleEn,
                TitleAr = topReady.TitleAr,
                TotalQuestions = topReady.TotalQuestions,
                StatusLabel = "Ready to Start"
            };
        }
        // Priority 3: View result
        else if (finished.Any())
        {
            var topFinished = finished.OrderByDescending(c => c.Score).First();
            primaryAction = new PrimaryActionDto
            {
                ActionType = PrimaryActionType.ViewResult,
                ExamId = topFinished.ExamId,
                AttemptId = topFinished.LatestAttemptId,
                TitleEn = topFinished.TitleEn,
                TitleAr = topFinished.TitleAr,
                Score = topFinished.Score,
                MaxScore = topFinished.MaxScore,
                IsPassed = topFinished.IsPassed,
                StatusLabel = topFinished.IsPassed == true ? "Passed" : "Failed"
            };
        }

        var response = new ExamJourneyDto
        {
            CurrentDateUtc = now,
            CandidateNameEn = user.FullName ?? user.DisplayName ?? "",
            CandidateNameAr = user.FullName ?? user.DisplayName ?? "",
            PrimaryAction = primaryAction,
            Groups = new JourneyGroupsDto
            {
                InProgress = inProgress,
                ReadyToStart = readyToStart,
                Finished = finished,
                WaitingResult = waitingResult,
                Locked = locked,
                History = history
            }
        };

        return ApiResponse<ExamJourneyDto>.SuccessResponse(response, "Exam journey loaded");
    }

    /// <summary>
    /// Check eligibility for starting an exam
    /// </summary>
    private (bool CanStartNow, List<string> Reasons) CheckEligibility(Domain.Entities.Assessment.Exam exam, int attemptsUsed, DateTime now)
    {
        var reasons = new List<string>();

        // Check attempts
        if (exam.MaxAttempts > 0 && attemptsUsed >= exam.MaxAttempts)
        {
            reasons.Add("Maximum attempts reached");
        }

        // Check exam window
        if (exam.StartAt.HasValue && exam.StartAt.Value > now)
        {
            reasons.Add($"Exam not yet available (starts {exam.StartAt.Value:g})");
        }

        if (exam.EndAt.HasValue && exam.EndAt.Value < now)
        {
            reasons.Add("Exam window has ended");
        }

        return (reasons.Count == 0, reasons);
    }

    #endregion
}
