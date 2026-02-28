using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Grading;
using Smart_Core.Application.Interfaces.ExamResult;
using Smart_Core.Application.Interfaces.Grading;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Entities.Grading;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Grading;

public class GradingService : IGradingService
{
    private readonly ApplicationDbContext _context;
    private readonly IExamResultService _examResultService;
    private readonly ILogger<GradingService> _logger;

    public GradingService(
        ApplicationDbContext context,
        IExamResultService examResultService,
        ILogger<GradingService> logger)
    {
        _context = context;
        _examResultService = examResultService;
        _logger = logger;
    }

    #region Grading Lifecycle

    public async Task<ApiResponse<GradingInitiatedDto>> InitiateGradingAsync(InitiateGradingDto dto, string graderId)
    {
        // 1. Validate attempt exists and is in correct status
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Exam)
.Include(a => a.Questions)
          .ThenInclude(aq => aq.Question)
        .ThenInclude(q => q.QuestionType)
     .Include(a => a.Questions)
                .ThenInclude(aq => aq.Question)
         .ThenInclude(q => q.Options)
            .Include(a => a.Questions)
     .ThenInclude(aq => aq.Question)
    .ThenInclude(q => q.AnswerKey)
     .Include(a => a.Questions)
    .ThenInclude(aq => aq.Answers)
     .FirstOrDefaultAsync(a => a.Id == dto.AttemptId);

        if (attempt == null)
        {
            return ApiResponse<GradingInitiatedDto>.FailureResponse("Attempt not found");
        }

        if (attempt.Status != AttemptStatus.Submitted && attempt.Status != AttemptStatus.Expired)
        {
            return ApiResponse<GradingInitiatedDto>.FailureResponse(
          $"Cannot grade attempt with status '{attempt.Status}'. Attempt must be Submitted or Expired.");
        }

        // 2. Check if grading session already exists
        var existingSession = await _context.Set<GradingSession>()
.FirstOrDefaultAsync(gs => gs.AttemptId == dto.AttemptId);

        if (existingSession != null)
        {
            return ApiResponse<GradingInitiatedDto>.FailureResponse(
               "Grading session already exists for this attempt. Use re-grade functionality if needed.");
        }

        var now = DateTime.UtcNow;

        // 3. Create grading session
        var gradingSession = new GradingSession
        {
            AttemptId = dto.AttemptId,
            GradedBy = graderId,
            Status = GradingStatus.Pending,
            TotalScore = null,
            IsPassed = null,
            CreatedDate = now,
            CreatedBy = graderId
        };

        _context.Set<GradingSession>().Add(gradingSession);
        await _context.SaveChangesAsync();

        // 4. Process auto-grading for each question
        var autoGradedCount = 0;
        var manualRequired = 0;
        decimal partialScore = 0;

        foreach (var attemptQuestion in attempt.Questions)
        {
            var question = attemptQuestion.Question;
            var answer = attemptQuestion.Answers.FirstOrDefault();
            var questionTypeName = question.QuestionType?.NameEn?.ToLower() ?? "";

            var gradedAnswer = new GradedAnswer
            {
                GradingSessionId = gradingSession.Id,
                AttemptId = dto.AttemptId,
                QuestionId = attemptQuestion.QuestionId,
                SelectedOptionIdsJson = answer?.SelectedOptionIdsJson,
                TextAnswer = answer?.TextAnswer,
                Score = 0,
                IsCorrect = false,
                IsManuallyGraded = false,
                CreatedDate = now,
                CreatedBy = graderId
            };

            // Determine if auto-gradable
            var isAutoGradable = IsQuestionAutoGradable(questionTypeName);

            if (isAutoGradable)
            {
                // Auto-gradable question (MCQ, TrueFalse, etc.)
                if (answer != null)
                {
                    // Perform auto-grading
                    var gradingResult = AutoGradeAnswer(question, answer, attemptQuestion.Points);
                    gradedAnswer.Score = gradingResult.Score;
                    gradedAnswer.IsCorrect = gradingResult.IsCorrect;
                    partialScore += gradingResult.Score;

                    // Update AttemptAnswer with grading result
                    answer.Score = gradingResult.Score;
                    answer.IsCorrect = gradingResult.IsCorrect;
                }
                else
                {
                    // Unanswered auto-gradable question = 0 points (auto-graded)
                    gradedAnswer.Score = 0;
                    gradedAnswer.IsCorrect = false;
                    gradedAnswer.GraderComment = "Unanswered";
                }
                gradedAnswer.IsManuallyGraded = false;
                autoGradedCount++;
            }
            else
            {
                // Requires manual grading (essay, subjective, etc.)
                gradedAnswer.IsManuallyGraded = true;
                manualRequired++;
            }

            _context.Set<GradedAnswer>().Add(gradedAnswer);
        }

        // 5. Update session status
        if (manualRequired > 0)
        {
            gradingSession.Status = GradingStatus.ManualRequired;
        }
        else
        {
            gradingSession.Status = GradingStatus.AutoGraded;
            gradingSession.TotalScore = partialScore;
            gradingSession.IsPassed = partialScore >= attempt.Exam.PassScore;
            gradingSession.GradedAt = now;

            // Update attempt with scores
            attempt.TotalScore = partialScore;
            attempt.IsPassed = partialScore >= attempt.Exam.PassScore;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<GradingInitiatedDto>.SuccessResponse(new GradingInitiatedDto
        {
            GradingSessionId = gradingSession.Id,
            AttemptId = dto.AttemptId,
            Status = gradingSession.Status,
            AutoGradedCount = autoGradedCount,
            ManualGradingRequired = manualRequired,
            PartialScore = partialScore,
            Message = manualRequired > 0
              ? $"Auto-grading complete. {manualRequired} question(s) require manual grading."
                : "All questions auto-graded successfully."
        });
    }

    public async Task<ApiResponse<GradingSessionDto>> GetGradingSessionAsync(int gradingSessionId)
    {
        var session = await _context.Set<GradingSession>()
          .Include(gs => gs.Attempt)
     .ThenInclude(a => a.Exam)
        .Include(gs => gs.Attempt)
     .ThenInclude(a => a.Candidate)
  .Include(gs => gs.Attempt)
        .ThenInclude(a => a.Questions)
.Include(gs => gs.Grader)
         .Include(gs => gs.Answers)
  .ThenInclude(ga => ga.Question)
     .ThenInclude(q => q.QuestionType)
    .Include(gs => gs.Answers)
                .ThenInclude(ga => ga.Question)
           .ThenInclude(q => q.Options)
    .Include(gs => gs.Answers)
                .ThenInclude(ga => ga.Question)
           .ThenInclude(q => q.AnswerKey)
     .FirstOrDefaultAsync(gs => gs.Id == gradingSessionId);

        if (session == null)
        {
            return ApiResponse<GradingSessionDto>.FailureResponse("Grading session not found");
        }

        return ApiResponse<GradingSessionDto>.SuccessResponse(MapToGradingSessionDto(session));
    }

    public async Task<ApiResponse<GradingSessionDto>> GetGradingSessionByAttemptAsync(int attemptId)
    {
        var session = await _context.Set<GradingSession>()
  .Include(gs => gs.Attempt)
      .ThenInclude(a => a.Exam)
    .Include(gs => gs.Attempt)
           .ThenInclude(a => a.Candidate)
       .Include(gs => gs.Attempt)
           .ThenInclude(a => a.Questions)
      .Include(gs => gs.Grader)
            .Include(gs => gs.Answers)
   .ThenInclude(ga => ga.Question)
     .ThenInclude(q => q.QuestionType)
         .Include(gs => gs.Answers)
           .ThenInclude(ga => ga.Question)
         .ThenInclude(q => q.Options)
         .Include(gs => gs.Answers)
           .ThenInclude(ga => ga.Question)
         .ThenInclude(q => q.AnswerKey)
    .FirstOrDefaultAsync(gs => gs.AttemptId == attemptId);

        if (session == null)
        {
            return ApiResponse<GradingSessionDto>.FailureResponse("Grading session not found for this attempt");
        }

        return ApiResponse<GradingSessionDto>.SuccessResponse(MapToGradingSessionDto(session));
    }

    public async Task<ApiResponse<GradingCompletedDto>> CompleteGradingAsync(CompleteGradingDto dto, string graderId)
    {
        var session = await _context.Set<GradingSession>()
              .Include(gs => gs.Attempt)
         .ThenInclude(a => a.Exam)
                  .Include(gs => gs.Attempt)
          .ThenInclude(a => a.Questions)
         .Include(gs => gs.Answers)
            .ThenInclude(a => a.Question)
                .ThenInclude(q => q.QuestionType)
            .FirstOrDefaultAsync(gs => gs.Id == dto.GradingSessionId);

        if (session == null)
        {
            return ApiResponse<GradingCompletedDto>.FailureResponse("Grading session not found");
        }

        if (session.Status == GradingStatus.Completed)
        {
            return ApiResponse<GradingCompletedDto>.FailureResponse("Grading is already completed");
        }

        // Check all questions are graded
        // For manual grading, consider graded if: UpdatedDate is set OR Score > 0 OR GraderComment is not empty
        // Also exclude auto-gradable questions (MCQ, True/False, Short Answer) - they should never require manual grading
        var pendingManualGrades = session.Answers
            .Where(a => a.IsManuallyGraded &&
                        !IsQuestionAutoGradable(a.Question?.QuestionType?.NameEn?.ToLower() ?? "") &&
                        a.UpdatedDate == null &&
                        a.Score == 0 &&
                        string.IsNullOrEmpty(a.GraderComment))
            .ToList();

        if (pendingManualGrades.Any())
        {
            return ApiResponse<GradingCompletedDto>.FailureResponse(
                $"{pendingManualGrades.Count} question(s) still require manual grading before completion.");
        }

        var now = DateTime.UtcNow;

        // Calculate total score
        var totalScore = session.Answers.Sum(a => a.Score);
        var maxPossibleScore = session.Attempt.Questions.Sum(q => q.Points);
        var passScore = session.Attempt.Exam.PassScore;
        var isPassed = totalScore >= passScore;

        // Update session
        session.TotalScore = totalScore;
        session.IsPassed = isPassed;
        session.GradedAt = now;
        session.Status = GradingStatus.Completed;
        session.UpdatedDate = now;
        session.UpdatedBy = graderId;

        // Update attempt
        session.Attempt.TotalScore = totalScore;
        session.Attempt.IsPassed = isPassed;

        await _context.SaveChangesAsync();

        // Finalize result so candidate appears on Candidate Result page (Result + CandidateExamSummary)
        var finalizeResult = await _examResultService.FinalizeResultAsync(dto.GradingSessionId, graderId);
        if (!finalizeResult.Success && finalizeResult.Message != null && !finalizeResult.Message.Contains("already exists"))
            _logger.LogWarning("Finalize result after grading complete failed: {Message}", finalizeResult.Message);

        return ApiResponse<GradingCompletedDto>.SuccessResponse(new GradingCompletedDto
        {
            GradingSessionId = session.Id,
            AttemptId = session.AttemptId,
            TotalScore = totalScore,
            MaxPossibleScore = maxPossibleScore,
            PassScore = passScore,
            IsPassed = isPassed,
            GradedAt = now,
            Status = GradingStatus.Completed,
            Message = isPassed ? "Grading completed. Candidate PASSED." : "Grading completed. Candidate FAILED."
        });
    }

    #endregion

    #region Manual Grading

    public async Task<ApiResponse<GradeSubmittedDto>> SubmitManualGradeAsync(ManualGradeDto dto, string graderId)
    {
        var session = await _context.Set<GradingSession>()
            .Include(gs => gs.Attempt)
         .ThenInclude(a => a.Questions)
            .Include(gs => gs.Answers)
            .FirstOrDefaultAsync(gs => gs.Id == dto.GradingSessionId);

        if (session == null)
        {
            return ApiResponse<GradeSubmittedDto>.FailureResponse("Grading session not found");
        }

        if (session.Status == GradingStatus.Completed)
        {
            return ApiResponse<GradeSubmittedDto>.FailureResponse(
   "Cannot modify grades for completed session. Use re-grade functionality.");
        }

        var gradedAnswer = session.Answers.FirstOrDefault(a => a.QuestionId == dto.QuestionId);
        if (gradedAnswer == null)
        {
            return ApiResponse<GradeSubmittedDto>.FailureResponse("Question not found in this grading session");
        }

        // Validate score against max points
        var attemptQuestion = session.Attempt.Questions.FirstOrDefault(q => q.QuestionId == dto.QuestionId);
        if (attemptQuestion == null)
        {
            return ApiResponse<GradeSubmittedDto>.FailureResponse("Question not found in attempt");
        }

        if (dto.Score > attemptQuestion.Points)
        {
            return ApiResponse<GradeSubmittedDto>.FailureResponse(
         $"Score ({dto.Score}) cannot exceed maximum points ({attemptQuestion.Points})");
        }

        var now = DateTime.UtcNow;

        // Update graded answer
        gradedAnswer.Score = dto.Score;
        gradedAnswer.IsCorrect = dto.IsCorrect;
        gradedAnswer.GraderComment = dto.GraderComment;
        gradedAnswer.IsManuallyGraded = true;
        gradedAnswer.UpdatedDate = now;
        gradedAnswer.UpdatedBy = graderId;

        // Update session grader if not set
        if (string.IsNullOrEmpty(session.GradedBy))
        {
            session.GradedBy = graderId;
        }

        await _context.SaveChangesAsync();

        return ApiResponse<GradeSubmittedDto>.SuccessResponse(new GradeSubmittedDto
        {
            GradedAnswerId = gradedAnswer.Id,
            QuestionId = dto.QuestionId,
            Score = dto.Score,
            IsCorrect = dto.IsCorrect,
            Success = true,
            Message = "Grade submitted successfully"
        });
    }

    public async Task<ApiResponse<List<GradeSubmittedDto>>> BulkSubmitManualGradesAsync(BulkManualGradeDto dto, string graderId)
    {
        var results = new List<GradeSubmittedDto>();

        foreach (var grade in dto.Grades)
        {
            var manualGradeDto = new ManualGradeDto
            {
                GradingSessionId = dto.GradingSessionId,
                QuestionId = grade.QuestionId,
                Score = grade.Score,
                IsCorrect = grade.IsCorrect,
                GraderComment = grade.GraderComment
            };

            var result = await SubmitManualGradeAsync(manualGradeDto, graderId);
            results.Add(new GradeSubmittedDto
            {
                QuestionId = grade.QuestionId,
                GradedAnswerId = result.Data?.GradedAnswerId ?? 0,
                Score = grade.Score,
                IsCorrect = grade.IsCorrect,
                Success = result.Success,
                Message = result.Success ? "Saved" : result.Message
            });
        }

        var allSuccess = results.All(r => r.Success);
        return allSuccess
               ? ApiResponse<List<GradeSubmittedDto>>.SuccessResponse(results, "All grades submitted successfully")
               : ApiResponse<List<GradeSubmittedDto>>.SuccessResponse(results, "Some grades could not be submitted");
    }

    public async Task<ApiResponse<List<GradedAnswerDto>>> GetManualGradingQueueAsync(int gradingSessionId)
    {
        var session = await _context.Set<GradingSession>()
            .Include(gs => gs.Attempt)
    .ThenInclude(a => a.Questions)
     .Include(gs => gs.Answers)
       .ThenInclude(ga => ga.Question)
      .ThenInclude(q => q.QuestionType)
  .Include(gs => gs.Answers)
          .ThenInclude(ga => ga.Question)
              .ThenInclude(q => q.AnswerKey)
    .FirstOrDefaultAsync(gs => gs.Id == gradingSessionId);

        if (session == null)
        {
            return ApiResponse<List<GradedAnswerDto>>.FailureResponse("Grading session not found");
        }

        var manualGradingAnswers = session.Answers
                 .Where(a => a.IsManuallyGraded)
               .Select(a => MapToGradedAnswerDto(a, session.Attempt.Questions.FirstOrDefault(q => q.QuestionId == a.QuestionId)?.Points ?? 0))
                 .ToList();

        return ApiResponse<List<GradedAnswerDto>>.SuccessResponse(manualGradingAnswers);
    }

    #endregion

    #region Re-grading

    public async Task<ApiResponse<RegradeResultDto>> RegradeAnswerAsync(RegradeDto dto, string graderId)
    {
        var session = await _context.Set<GradingSession>()
         .Include(gs => gs.Attempt)
   .ThenInclude(a => a.Exam)
   .Include(gs => gs.Attempt)
       .ThenInclude(a => a.Questions)
     .Include(gs => gs.Answers)
      .FirstOrDefaultAsync(gs => gs.Id == dto.GradingSessionId);

        if (session == null)
        {
            return ApiResponse<RegradeResultDto>.FailureResponse("Grading session not found");
        }

        var gradedAnswer = session.Answers.FirstOrDefault(a => a.QuestionId == dto.QuestionId);
        if (gradedAnswer == null)
        {
            return ApiResponse<RegradeResultDto>.FailureResponse("Question not found in this grading session");
        }

        // Validate score
        var attemptQuestion = session.Attempt.Questions.FirstOrDefault(q => q.QuestionId == dto.QuestionId);
        if (attemptQuestion == null)
        {
            return ApiResponse<RegradeResultDto>.FailureResponse("Question not found in attempt");
        }

        if (dto.NewScore > attemptQuestion.Points)
        {
            return ApiResponse<RegradeResultDto>.FailureResponse(
                     $"Score ({dto.NewScore}) cannot exceed maximum points ({attemptQuestion.Points})");
        }

        var previousScore = gradedAnswer.Score;
        var now = DateTime.UtcNow;

        // Update graded answer
        gradedAnswer.Score = dto.NewScore;
        gradedAnswer.IsCorrect = dto.IsCorrect;
        gradedAnswer.GraderComment = dto.Comment;
        gradedAnswer.IsManuallyGraded = true;
        gradedAnswer.UpdatedDate = now;
        gradedAnswer.UpdatedBy = graderId;

        // Recalculate total score
        var newTotalScore = session.Answers.Sum(a => a.Score);
        var isPassed = newTotalScore >= session.Attempt.Exam.PassScore;

        session.TotalScore = newTotalScore;
        session.IsPassed = isPassed;
        session.GradedAt = now;
        session.UpdatedDate = now;
        session.UpdatedBy = graderId;

        // Update attempt
        session.Attempt.TotalScore = newTotalScore;
        session.Attempt.IsPassed = isPassed;

        await _context.SaveChangesAsync();

        return ApiResponse<RegradeResultDto>.SuccessResponse(new RegradeResultDto
        {
            GradedAnswerId = gradedAnswer.Id,
            PreviousScore = previousScore,
            NewScore = dto.NewScore,
            NewTotalScore = newTotalScore,
            NewIsPassed = isPassed,
            Message = "Answer re-graded successfully"
        });
    }

    #endregion

    #region Queries

    public async Task<ApiResponse<PaginatedResponse<GradingSessionListDto>>> GetGradingSessionsAsync(GradingSearchDto searchDto)
    {
        var query = _context.Set<GradingSession>()
            .Include(gs => gs.Attempt)
    .ThenInclude(a => a.Exam)
 .Include(gs => gs.Attempt)
         .ThenInclude(a => a.Candidate)
            .Include(gs => gs.Attempt)
                .ThenInclude(a => a.Questions)
     .Include(gs => gs.Answers)
 .AsQueryable();

        // Filters
        if (searchDto.ExamId.HasValue)
        {
            query = query.Where(gs => gs.Attempt.ExamId == searchDto.ExamId.Value);
        }

        if (!string.IsNullOrEmpty(searchDto.CandidateId))
        {
            query = query.Where(gs => gs.Attempt.CandidateId == searchDto.CandidateId);
        }

        if (searchDto.Status.HasValue)
        {
            query = query.Where(gs => gs.Status == searchDto.Status.Value);
        }

        if (searchDto.IsPassed.HasValue)
        {
            query = query.Where(gs => gs.IsPassed == searchDto.IsPassed.Value);
        }

        if (searchDto.RequiresManualGrading == true)
        {
            query = query.Where(gs => gs.Status == GradingStatus.ManualRequired);
        }

        if (searchDto.GradedFrom.HasValue)
        {
            query = query.Where(gs => gs.GradedAt >= searchDto.GradedFrom.Value);
        }

        if (searchDto.GradedTo.HasValue)
        {
            query = query.Where(gs => gs.GradedAt <= searchDto.GradedTo.Value);
        }

        query = query.OrderByDescending(gs => gs.CreatedDate);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
           .ToListAsync();

        // Get finalized AttemptIds (those that have a Result record)
        var attemptIds = items.Select(s => s.AttemptId).ToList();
        var finalizedAttemptIds = await _context.Set<Result>()
            .Where(r => attemptIds.Contains(r.AttemptId))
            .Select(r => r.AttemptId)
            .ToListAsync();
        var finalizedSet = new HashSet<int>(finalizedAttemptIds);

        var dtos = items.Select(s => MapToGradingSessionListDto(s, finalizedSet.Contains(s.AttemptId))).ToList();

        return ApiResponse<PaginatedResponse<GradingSessionListDto>>.SuccessResponse(
       new PaginatedResponse<GradingSessionListDto>
       {
           Items = dtos,
           PageNumber = searchDto.PageNumber,
           PageSize = searchDto.PageSize,
           TotalCount = totalCount
       });
    }

    public async Task<ApiResponse<PaginatedResponse<GradingSessionListDto>>> GetManualGradingRequiredAsync(GradingSearchDto searchDto)
    {
        searchDto.RequiresManualGrading = true;
        return await GetGradingSessionsAsync(searchDto);
    }

    public async Task<ApiResponse<ExamGradingStatsDto>> GetExamGradingStatsAsync(int examId)
    {
        var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);
        if (exam == null)
        {
            return ApiResponse<ExamGradingStatsDto>.FailureResponse("Exam not found");
        }

        var gradingSessions = await _context.Set<GradingSession>()
 .Include(gs => gs.Attempt)
        .Include(gs => gs.Answers)
   .Where(gs => gs.Attempt.ExamId == examId)
         .ToListAsync();

        var completedSessions = gradingSessions.Where(gs => gs.Status == GradingStatus.Completed).ToList();
        var scores = completedSessions.Where(gs => gs.TotalScore.HasValue).Select(gs => gs.TotalScore!.Value).ToList();

        var stats = new ExamGradingStatsDto
        {
            ExamId = examId,
            ExamTitleEn = exam.TitleEn,
            TotalAttempts = gradingSessions.Count,
            GradedAttempts = completedSessions.Count,
            PendingGrading = gradingSessions.Count(gs => gs.Status == GradingStatus.Pending),
            ManualGradingRequired = gradingSessions.Count(gs => gs.Status == GradingStatus.ManualRequired),
            PassedCount = completedSessions.Count(gs => gs.IsPassed == true),
            FailedCount = completedSessions.Count(gs => gs.IsPassed == false),
            AverageScore = scores.Any() ? scores.Average() : 0,
            HighestScore = scores.Any() ? scores.Max() : 0,
            LowestScore = scores.Any() ? scores.Min() : 0,
            PassRate = completedSessions.Any()
     ? (decimal)completedSessions.Count(gs => gs.IsPassed == true) / completedSessions.Count * 100
    : 0
        };

        return ApiResponse<ExamGradingStatsDto>.SuccessResponse(stats);
    }

    public async Task<ApiResponse<List<QuestionGradingStatsDto>>> GetQuestionGradingStatsAsync(int examId)
    {
        var gradedAnswers = await _context.Set<GradedAnswer>()
               .Include(ga => ga.Question)
                   .ThenInclude(q => q.QuestionType)
     .Include(ga => ga.GradingSession)
                   .ThenInclude(gs => gs.Attempt)
       .ThenInclude(a => a.Questions)
               .Where(ga => ga.GradingSession.Attempt.ExamId == examId)
        .ToListAsync();

        var stats = gradedAnswers
            .GroupBy(ga => ga.QuestionId)
    .Select(g =>
      {
          var first = g.First();
          var attemptQuestion = first.GradingSession.Attempt.Questions
            .FirstOrDefault(q => q.QuestionId == first.QuestionId);

          return new QuestionGradingStatsDto
          {
              QuestionId = g.Key,
              QuestionBodyEn = first.Question.BodyEn,
              QuestionBodyAr = first.Question.BodyAr,
              QuestionTypeName = first.Question.QuestionType?.NameEn ?? "",
              TotalAnswers = g.Count(),
              CorrectAnswers = g.Count(a => a.IsCorrect),
              IncorrectAnswers = g.Count(a => !a.IsCorrect),
              AverageScore = g.Average(a => a.Score),
              MaxPoints = attemptQuestion?.Points ?? 0,
              DifficultyIndex = g.Any() ? (decimal)g.Count(a => a.IsCorrect) / g.Count() : 0
          };
      })
            .ToList();

        return ApiResponse<List<QuestionGradingStatsDto>>.SuccessResponse(stats);
    }

    #endregion

    #region Candidate Access

    public async Task<ApiResponse<CandidateGradingResultDto>> GetCandidateResultAsync(int attemptId, string candidateId)
    {
        var session = await _context.Set<GradingSession>()
           .Include(gs => gs.Attempt)
             .ThenInclude(a => a.Exam)
        .Include(gs => gs.Attempt)
            .ThenInclude(a => a.Questions)
        .Include(gs => gs.Answers)
           .ThenInclude(ga => ga.Question)
      .FirstOrDefaultAsync(gs => gs.AttemptId == attemptId);

        if (session == null)
        {
            return ApiResponse<CandidateGradingResultDto>.FailureResponse("Grading result not found");
        }

        if (session.Attempt.CandidateId != candidateId)
        {
            return ApiResponse<CandidateGradingResultDto>.FailureResponse("You do not have access to this result");
        }

        // Only return results if grading is complete
        if (session.Status != GradingStatus.Completed && session.Status != GradingStatus.AutoGraded)
        {
            return ApiResponse<CandidateGradingResultDto>.SuccessResponse(new CandidateGradingResultDto
            {
                AttemptId = attemptId,
                ExamId = session.Attempt.ExamId,
                ExamTitleEn = session.Attempt.Exam.TitleEn,
                ExamTitleAr = session.Attempt.Exam.TitleAr,
                Status = session.Status,
                IsGradingComplete = false,
                TotalScore = 0,
                MaxPossibleScore = session.Attempt.Questions.Sum(q => q.Points),
                PassScore = session.Attempt.Exam.PassScore,
                IsPassed = false,
                Percentage = 0
            });
        }

        var maxPossibleScore = session.Attempt.Questions.Sum(q => q.Points);
        var totalScore = session.TotalScore ?? 0;
        var percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        var result = new CandidateGradingResultDto
        {
            AttemptId = attemptId,
            ExamId = session.Attempt.ExamId,
            ExamTitleEn = session.Attempt.Exam.TitleEn,
            ExamTitleAr = session.Attempt.Exam.TitleAr,
            TotalScore = totalScore,
            MaxPossibleScore = maxPossibleScore,
            PassScore = session.Attempt.Exam.PassScore,
            IsPassed = session.IsPassed ?? false,
            Percentage = percentage,
            GradedAt = session.GradedAt,
            Status = session.Status,
            IsGradingComplete = true,
            QuestionResults = session.Answers.Select(a =>
         {
             var attemptQuestion = session.Attempt.Questions
                      .FirstOrDefault(q => q.QuestionId == a.QuestionId);

             return new CandidateQuestionResultDto
             {
                 QuestionId = a.QuestionId,
                 QuestionBodyEn = a.Question.BodyEn,
                 QuestionBodyAr = a.Question.BodyAr,
                 PointsEarned = a.Score,
                 MaxPoints = attemptQuestion?.Points ?? 0,
                 IsCorrect = a.IsCorrect,
                 Feedback = a.GraderComment
             };
         }).ToList()
        };

        return ApiResponse<CandidateGradingResultDto>.SuccessResponse(result);
    }

    public async Task<ApiResponse<bool>> IsGradingCompleteAsync(int attemptId)
    {
        var session = await _context.Set<GradingSession>()
                 .FirstOrDefaultAsync(gs => gs.AttemptId == attemptId);

        if (session == null)
        {
            return ApiResponse<bool>.SuccessResponse(false, "No grading session found");
        }

        var isComplete = session.Status == GradingStatus.Completed || session.Status == GradingStatus.AutoGraded;
        return ApiResponse<bool>.SuccessResponse(isComplete);
    }

    #endregion

    #region Auto-Grading

    public async Task<int> ProcessPendingGradingSessionsAsync()
    {
        // This can be called by a background job to process any pending sessions
        var pendingSessions = await _context.Set<GradingSession>()
                 .Include(gs => gs.Attempt)
               .ThenInclude(a => a.Questions)
               .ThenInclude(aq => aq.Answers)
      .Include(gs => gs.Answers)
              .Where(gs => gs.Status == GradingStatus.Pending)
            .ToListAsync();

        // For now, just return count - actual processing would be done in InitiateGradingAsync
        return pendingSessions.Count;
    }

    #endregion

    #region Private Helper Methods

    private bool IsQuestionAutoGradable(string questionTypeName)
    {
        var autoGradableTypes = new[]
            {
            "mcq", "multiple choice", "single choice",
            "true", "false", "truefalse", "true/false",
    "short answer", "shortanswer"
      };

        return autoGradableTypes.Any(t => questionTypeName.Contains(t));
    }

    private (decimal Score, bool IsCorrect) AutoGradeAnswer(
        Domain.Entities.QuestionBank.Question question,
    AttemptAnswer answer,
        decimal maxPoints)
    {
        var questionTypeName = question.QuestionType?.NameEn?.ToLower() ?? "";

        // MCQ / TrueFalse
        if (questionTypeName.Contains("mcq") || questionTypeName.Contains("multiple choice") ||
               questionTypeName.Contains("single choice") || questionTypeName.Contains("true") ||
         questionTypeName.Contains("false"))
        {
            return GradeMcqAnswer(question, answer, maxPoints, questionTypeName);
        }

        // Short Answer
        if (questionTypeName.Contains("short"))
        {
            return GradeShortAnswer(question, answer, maxPoints);
        }

        // Default: not auto-gradable
        return (0, false);
    }

    private (decimal Score, bool IsCorrect) GradeMcqAnswer(
        Domain.Entities.QuestionBank.Question question,
        AttemptAnswer answer,
        decimal maxPoints,
        string questionTypeName)
    {
        if (string.IsNullOrEmpty(answer.SelectedOptionIdsJson))
        {
            return (0, false);
        }

        var selectedIds = JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson) ?? new List<int>();
        var correctOptionIds = question.Options
      .Where(o => o.IsCorrect && !o.IsDeleted)
            .Select(o => o.Id)
  .ToHashSet();

        var selectedSet = selectedIds.ToHashSet();

        // Check if selected matches correct exactly
        var isCorrect = selectedSet.SetEquals(correctOptionIds);

        if (isCorrect)
        {
            return (maxPoints, true);
        }

        // For MCQ multiple choice, could implement partial credit
        // For now, all-or-nothing scoring
        return (0, false);
    }

    private (decimal Score, bool IsCorrect) GradeShortAnswer(
        Domain.Entities.QuestionBank.Question question,
   AttemptAnswer answer,
        decimal maxPoints)
    {
        if (string.IsNullOrEmpty(answer.TextAnswer))
        {
            return (0, false);
        }

        var answerKey = question.AnswerKey;
        if (answerKey == null || (string.IsNullOrEmpty(answerKey.AcceptedAnswersJsonEn) && string.IsNullOrEmpty(answerKey.AcceptedAnswersJsonAr)))
        {
            // No answer key defined - requires manual grading
            return (0, false);
        }

        var studentAnswer = answer.TextAnswer;

        // Check English accepted answers
        if (!string.IsNullOrEmpty(answerKey.AcceptedAnswersJsonEn))
        {
            var acceptedAnswersEn = JsonSerializer.Deserialize<List<string>>(answerKey.AcceptedAnswersJsonEn) ?? new List<string>();
            if (CheckShortAnswer(studentAnswer, acceptedAnswersEn, answerKey))
            {
                return (maxPoints, true);
            }
        }

        // Check Arabic accepted answers
        if (!string.IsNullOrEmpty(answerKey.AcceptedAnswersJsonAr))
        {
            var acceptedAnswersAr = JsonSerializer.Deserialize<List<string>>(answerKey.AcceptedAnswersJsonAr) ?? new List<string>();
            if (CheckShortAnswer(studentAnswer, acceptedAnswersAr, answerKey))
            {
                return (maxPoints, true);
            }
        }

        return (0, false);
    }

    private bool CheckShortAnswer(string studentAnswer, List<string> acceptedAnswers, Domain.Entities.QuestionBank.QuestionAnswerKey answerKey)
    {
        var normalizedStudent = studentAnswer;

        if (answerKey.TrimSpaces)
        {
            normalizedStudent = normalizedStudent.Trim();
        }

        if (answerKey.NormalizeWhitespace)
        {
            normalizedStudent = System.Text.RegularExpressions.Regex.Replace(normalizedStudent, @"\s+", " ");
        }

        if (!answerKey.CaseSensitive)
        {
            normalizedStudent = normalizedStudent.ToLowerInvariant();
        }

        foreach (var accepted in acceptedAnswers)
        {
            var normalizedAccepted = accepted;

            if (answerKey.TrimSpaces)
            {
                normalizedAccepted = normalizedAccepted.Trim();
            }

            if (answerKey.NormalizeWhitespace)
            {
                normalizedAccepted = System.Text.RegularExpressions.Regex.Replace(normalizedAccepted, @"\s+", " ");
            }

            if (!answerKey.CaseSensitive)
            {
                normalizedAccepted = normalizedAccepted.ToLowerInvariant();
            }

            if (normalizedStudent == normalizedAccepted)
            {
                return true;
            }
        }

        return false;
    }

    private GradingSessionDto MapToGradingSessionDto(GradingSession session)
    {
        var maxPossibleScore = session.Attempt.Questions.Sum(q => q.Points);

        return new GradingSessionDto
        {
            Id = session.Id,
            AttemptId = session.AttemptId,
            ExamId = session.Attempt.ExamId,
            ExamTitleEn = session.Attempt.Exam.TitleEn,
            ExamTitleAr = session.Attempt.Exam.TitleAr,
            CandidateId = session.Attempt.CandidateId,
            CandidateName = session.Attempt.Candidate?.FullName ?? session.Attempt.Candidate?.DisplayName ?? "",
            GradedBy = session.GradedBy,
            GraderName = session.Grader?.FullName ?? session.Grader?.DisplayName ?? "",
            Status = session.Status,
            TotalScore = session.TotalScore,
            MaxPossibleScore = maxPossibleScore,
            PassScore = session.Attempt.Exam.PassScore,
            IsPassed = session.IsPassed,
            GradedAt = session.GradedAt,
            CreatedDate = session.CreatedDate,
            TotalQuestions = session.Attempt.Questions.Count,
            GradedQuestions = session.Answers.Count(a => !a.IsManuallyGraded || a.UpdatedDate != null),
            ManualGradingRequired = session.Answers.Count(a => a.IsManuallyGraded && a.UpdatedDate == null),
            Answers = session.Answers.Select(a =>
                      MapToGradedAnswerDto(a, session.Attempt.Questions.FirstOrDefault(q => q.QuestionId == a.QuestionId)?.Points ?? 0)
            ).ToList()
        };
    }

    private GradingSessionListDto MapToGradingSessionListDto(GradingSession session, bool isResultFinalized = false)
    {
        var maxPossibleScore = session.Attempt.Questions.Sum(q => q.Points);

        return new GradingSessionListDto
        {
            Id = session.Id,
            AttemptId = session.AttemptId,
            ExamId = session.Attempt.ExamId,
            ExamTitleEn = session.Attempt.Exam.TitleEn,
            ExamTitleAr = session.Attempt.Exam.TitleAr,
            CandidateId = session.Attempt.CandidateId,
            CandidateName = session.Attempt.Candidate?.FullName ?? session.Attempt.Candidate?.DisplayName ?? "",
            Status = session.Status,
            TotalScore = session.TotalScore,
            MaxPossibleScore = maxPossibleScore,
            IsPassed = session.IsPassed,
            GradedAt = session.GradedAt,
            ManualGradingRequired = session.Answers.Count(a => a.IsManuallyGraded && a.UpdatedDate == null),
            IsResultFinalized = isResultFinalized
        };
    }

    private GradedAnswerDto MapToGradedAnswerDto(GradedAnswer answer, decimal maxPoints)
    {
        var dto = new GradedAnswerDto
        {
            Id = answer.Id,
            GradingSessionId = answer.GradingSessionId,
            QuestionId = answer.QuestionId,
            QuestionBodyEn = answer.Question.BodyEn,
            QuestionBodyAr = answer.Question.BodyAr,
            QuestionTypeName = answer.Question.QuestionType?.NameEn ?? "",
            QuestionTypeId = answer.Question.QuestionTypeId,
            MaxPoints = maxPoints,
            SelectedOptionIds = !string.IsNullOrEmpty(answer.SelectedOptionIdsJson)
                ? JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson)
                : null,
            SelectedOptions = GetSelectedOptionsWithText(answer),
            TextAnswer = answer.TextAnswer,
            Score = answer.Score,
            IsCorrect = answer.IsCorrect,
            IsManuallyGraded = answer.IsManuallyGraded,
            GraderComment = answer.GraderComment,
            CorrectOptions = answer.Question.Options
                .Where(o => o.IsCorrect && !o.IsDeleted)
                .Select(o => new CorrectOptionDto { Id = o.Id, TextEn = o.TextEn, TextAr = o.TextAr })
                .ToList(),
            ModelAnswerEn = answer.Question.AnswerKey?.RubricTextEn,
            ModelAnswerAr = answer.Question.AnswerKey?.RubricTextAr
        };

        return dto;
    }

    private List<SelectedOptionDto>? GetSelectedOptionsWithText(GradedAnswer answer)
    {
        if (string.IsNullOrEmpty(answer.SelectedOptionIdsJson))
            return null;

        var selectedIds = JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson);
        if (selectedIds == null || !selectedIds.Any())
            return null;

        return answer.Question.Options
            .Where(o => selectedIds.Contains(o.Id) && !o.IsDeleted)
            .Select(o => new SelectedOptionDto
            {
                Id = o.Id,
                TextEn = o.TextEn,
                TextAr = o.TextAr,
                IsCorrect = o.IsCorrect
            })
            .ToList();
    }

    #endregion
}
