using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamResult;
using Smart_Core.Application.Interfaces.ExamResult;
using Smart_Core.Domain.Entities.ExamResult;
using Smart_Core.Domain.Entities.Grading;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.ExamResult;

public class ExamResultService : IExamResultService
{
    private readonly ApplicationDbContext _context;
    private readonly ICertificateService _certificateService;

    public ExamResultService(ApplicationDbContext context, ICertificateService certificateService)
    {
        _context = context;
        _certificateService = certificateService;
    }

    #region Result Management

    public async Task<ApiResponse<ResultDto>> FinalizeResultAsync(int gradingSessionId, string userId)
    {
        // Get grading session with all required data
        var gradingSession = await _context.Set<GradingSession>()
            .Include(gs => gs.Attempt)
          .ThenInclude(a => a.Exam)
    .Include(gs => gs.Attempt)
      .ThenInclude(a => a.Candidate)
     .Include(gs => gs.Attempt)
        .ThenInclude(a => a.Questions)
            .FirstOrDefaultAsync(gs => gs.Id == gradingSessionId);

        if (gradingSession == null)
        {
            return ApiResponse<ResultDto>.FailureResponse("Grading session not found");
        }

        // Validate grading is complete
      if (gradingSession.Status != GradingStatus.Completed && gradingSession.Status != GradingStatus.AutoGraded)
        {
   return ApiResponse<ResultDto>.FailureResponse(
   $"Grading must be completed before finalizing result. Current status: {gradingSession.Status}");
        }

        // Check if result already exists
        var existingResult = await _context.Set<Result>()
          .FirstOrDefaultAsync(r => r.AttemptId == gradingSession.AttemptId);

      if (existingResult != null)
        {
            return ApiResponse<ResultDto>.FailureResponse(
          "Result already exists for this attempt. Use update if re-grading was performed.");
    }

      var now = DateTime.UtcNow;
        var attempt = gradingSession.Attempt;
        var exam = attempt.Exam;
        var maxPossibleScore = attempt.Questions.Sum(q => q.Points);
        var totalScore = gradingSession.TotalScore ?? 0;
      var isPassed = totalScore >= exam.PassScore;

        // Create result
 var result = new Result
        {
            ExamId = attempt.ExamId,
   AttemptId = attempt.Id,
            CandidateId = attempt.CandidateId,
  TotalScore = totalScore,
    MaxPossibleScore = maxPossibleScore,
            PassScore = exam.PassScore,
     IsPassed = isPassed,
          GradeLabel = CalculateGradeLabel(totalScore, maxPossibleScore),
            IsPublishedToCandidate = false,
     FinalizedAt = now,
 CreatedDate = now,
 CreatedBy = userId
        };

   _context.Set<Result>().Add(result);

        // Update attempt with final scores
        attempt.TotalScore = totalScore;
        attempt.IsPassed = isPassed;

        await _context.SaveChangesAsync();

        // Refresh candidate summary
        await RefreshCandidateExamSummaryInternalAsync(exam.Id, attempt.CandidateId, userId);

        return await GetResultByIdAsync(result.Id);
    }

    public async Task<ApiResponse<ResultDto>> GetResultByIdAsync(int resultId)
    {
        var result = await _context.Set<Result>()
            .Include(r => r.Exam)
        .Include(r => r.Attempt)
          .Include(r => r.Candidate)
            .FirstOrDefaultAsync(r => r.Id == resultId);

        if (result == null)
        {
            return ApiResponse<ResultDto>.FailureResponse("Result not found");
        }

        return ApiResponse<ResultDto>.SuccessResponse(MapToResultDto(result));
    }

    public async Task<ApiResponse<ResultDto>> GetResultByAttemptAsync(int attemptId)
    {
      var result = await _context.Set<Result>()
    .Include(r => r.Exam)
      .Include(r => r.Attempt)
  .Include(r => r.Candidate)
        .FirstOrDefaultAsync(r => r.AttemptId == attemptId);

        if (result == null)
        {
            return ApiResponse<ResultDto>.FailureResponse("Result not found for this attempt");
      }

        return ApiResponse<ResultDto>.SuccessResponse(MapToResultDto(result));
    }

    public async Task<ApiResponse<PaginatedResponse<ResultListDto>>> GetResultsAsync(ResultSearchDto searchDto)
    {
        var query = _context.Set<Result>()
            .Include(r => r.Exam)
 .Include(r => r.Attempt)
            .Include(r => r.Candidate)
 .AsQueryable();

        // Apply filters
        query = ApplyResultFilters(query, searchDto);

     query = query.OrderByDescending(r => r.FinalizedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
    .ToListAsync();

        return ApiResponse<PaginatedResponse<ResultListDto>>.SuccessResponse(
   new PaginatedResponse<ResultListDto>
   {
    Items = items.Select(MapToResultListDto).ToList(),
  PageNumber = searchDto.PageNumber,
        PageSize = searchDto.PageSize,
    TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<PaginatedResponse<ResultListDto>>> GetExamResultsAsync(int examId, ResultSearchDto searchDto)
    {
        searchDto.ExamId = examId;
  return await GetResultsAsync(searchDto);
    }

    public async Task<ApiResponse<ResultDto>> UpdateResultFromRegradingAsync(int gradingSessionId, string userId)
    {
        var gradingSession = await _context.Set<GradingSession>()
      .Include(gs => gs.Attempt)
    .ThenInclude(a => a.Exam)
            .Include(gs => gs.Attempt)
           .ThenInclude(a => a.Questions)
        .FirstOrDefaultAsync(gs => gs.Id == gradingSessionId);

        if (gradingSession == null)
        {
     return ApiResponse<ResultDto>.FailureResponse("Grading session not found");
        }

        var result = await _context.Set<Result>()
            .FirstOrDefaultAsync(r => r.AttemptId == gradingSession.AttemptId);

        if (result == null)
      {
   // Create new result if doesn't exist
         return await FinalizeResultAsync(gradingSessionId, userId);
        }

        var now = DateTime.UtcNow;
        var exam = gradingSession.Attempt.Exam;
    var maxPossibleScore = gradingSession.Attempt.Questions.Sum(q => q.Points);
        var totalScore = gradingSession.TotalScore ?? 0;
        var isPassed = totalScore >= exam.PassScore;

        // Update result
        result.TotalScore = totalScore;
        result.MaxPossibleScore = maxPossibleScore;
        result.IsPassed = isPassed;
        result.GradeLabel = CalculateGradeLabel(totalScore, maxPossibleScore);
        result.FinalizedAt = now;
        result.UpdatedDate = now;
        result.UpdatedBy = userId;

        // Update attempt
        gradingSession.Attempt.TotalScore = totalScore;
        gradingSession.Attempt.IsPassed = isPassed;

        await _context.SaveChangesAsync();

        // Refresh candidate summary
   await RefreshCandidateExamSummaryInternalAsync(exam.Id, gradingSession.Attempt.CandidateId, userId);

    return await GetResultByIdAsync(result.Id);
  }

    #endregion

    #region Publishing

    public async Task<ApiResponse<ResultDto>> PublishResultAsync(int resultId, string userId)
    {
        var result = await _context.Set<Result>()
            .FirstOrDefaultAsync(r => r.Id == resultId);

    if (result == null)
        {
      return ApiResponse<ResultDto>.FailureResponse("Result not found");
        }

        if (result.IsPublishedToCandidate)
        {
   return ApiResponse<ResultDto>.FailureResponse("Result is already published");
    }

        var now = DateTime.UtcNow;
        result.IsPublishedToCandidate = true;
        result.PublishedAt = now;
        result.PublishedBy = userId;

        // Auto-create certificate for passed results
        if (result.IsPassed)
        {
            await _certificateService.CreateForResultAsync(result.Id, userId);
        }
  result.UpdatedDate = now;
        result.UpdatedBy = userId;

   await _context.SaveChangesAsync();

        return await GetResultByIdAsync(resultId);
    }

    public async Task<ApiResponse<ResultDto>> UnpublishResultAsync(int resultId, string userId)
    {
        var result = await _context.Set<Result>()
            .FirstOrDefaultAsync(r => r.Id == resultId);

        if (result == null)
   {
        return ApiResponse<ResultDto>.FailureResponse("Result not found");
      }

      if (!result.IsPublishedToCandidate)
    {
            return ApiResponse<ResultDto>.FailureResponse("Result is not published");
        }

   var now = DateTime.UtcNow;
        result.IsPublishedToCandidate = false;
   result.UpdatedDate = now;
        result.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return await GetResultByIdAsync(resultId);
    }

    public async Task<ApiResponse<int>> BulkPublishResultsAsync(BulkPublishResultsDto dto, string userId)
    {
        var results = await _context.Set<Result>()
            .Where(r => dto.ResultIds.Contains(r.Id) && !r.IsPublishedToCandidate)
      .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var result in results)
        {
     result.IsPublishedToCandidate = true;
            result.PublishedAt = now;
 result.PublishedBy = userId;
          result.UpdatedDate = now;
            result.UpdatedBy = userId;
      }

        await _context.SaveChangesAsync();

        return ApiResponse<int>.SuccessResponse(results.Count, $"{results.Count} results published successfully");
  }

    public async Task<ApiResponse<int>> PublishExamResultsAsync(PublishExamResultsDto dto, string userId)
    {
 var query = _context.Set<Result>()
         .Where(r => r.ExamId == dto.ExamId && !r.IsPublishedToCandidate);

        if (dto.PassedOnly)
        {
            query = query.Where(r => r.IsPassed);
        }

        var results = await query.ToListAsync();

        var now = DateTime.UtcNow;
   foreach (var result in results)
        {
result.IsPublishedToCandidate = true;
    result.PublishedAt = now;
        result.PublishedBy = userId;
  result.UpdatedDate = now;
   result.UpdatedBy = userId;
        }

        await _context.SaveChangesAsync();

      return ApiResponse<int>.SuccessResponse(results.Count, $"{results.Count} results published successfully");
    }

    #endregion

    #region Candidate Access

    public async Task<ApiResponse<CandidateResultDto>> GetCandidateResultAsync(int attemptId, string candidateId)
    {
        var result = await _context.Set<Result>()
            .Include(r => r.Exam)
          .Include(r => r.Attempt)
     .FirstOrDefaultAsync(r => r.AttemptId == attemptId);

        if (result == null)
        {
      return ApiResponse<CandidateResultDto>.FailureResponse("Result not found");
  }

  if (result.CandidateId != candidateId)
    {
            return ApiResponse<CandidateResultDto>.FailureResponse("You do not have access to this result");
        }

        if (!result.IsPublishedToCandidate)
        {
            return ApiResponse<CandidateResultDto>.FailureResponse("Result is not yet published");
   }

        var percentage = result.MaxPossibleScore > 0
? (result.TotalScore / result.MaxPossibleScore) * 100
     : 0;

      var dto = new CandidateResultDto
        {
            ResultId = result.Id,
          ExamId = result.ExamId,
  ExamTitleEn = result.Exam.TitleEn,
            ExamTitleAr = result.Exam.TitleAr,
      AttemptNumber = result.Attempt.AttemptNumber,
            TotalScore = result.TotalScore,
            MaxPossibleScore = result.MaxPossibleScore,
            PassScore = result.PassScore,
        Percentage = percentage,
    IsPassed = result.IsPassed,
   GradeLabel = result.GradeLabel,
   FinalizedAt = result.FinalizedAt,
        AttemptStartedAt = result.Attempt.StartedAt,
         AttemptSubmittedAt = result.Attempt.SubmittedAt
  };

        return ApiResponse<CandidateResultDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<List<CandidateResultDto>>> GetCandidateAllResultsAsync(string candidateId)
    {
    var results = await _context.Set<Result>()
          .Include(r => r.Exam)
            .Include(r => r.Attempt)
   .Where(r => r.CandidateId == candidateId && r.IsPublishedToCandidate)
        .OrderByDescending(r => r.FinalizedAt)
      .ToListAsync();

  var dtos = results.Select(r =>
        {
            var percentage = r.MaxPossibleScore > 0
        ? (r.TotalScore / r.MaxPossibleScore) * 100
             : 0;

            return new CandidateResultDto
    {
                ResultId = r.Id,
          ExamId = r.ExamId,
  ExamTitleEn = r.Exam.TitleEn,
     ExamTitleAr = r.Exam.TitleAr,
       AttemptNumber = r.Attempt.AttemptNumber,
      TotalScore = r.TotalScore,
       MaxPossibleScore = r.MaxPossibleScore,
         PassScore = r.PassScore,
         Percentage = percentage,
  IsPassed = r.IsPassed,
   GradeLabel = r.GradeLabel,
     FinalizedAt = r.FinalizedAt,
         AttemptStartedAt = r.Attempt.StartedAt,
                AttemptSubmittedAt = r.Attempt.SubmittedAt
        };
    }).ToList();

      return ApiResponse<List<CandidateResultDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<CandidateExamSummaryDto>> GetCandidateExamSummaryAsync(int examId, string candidateId)
    {
        var summary = await _context.Set<CandidateExamSummary>()
      .Include(s => s.Exam)
            .Include(s => s.Candidate)
      .FirstOrDefaultAsync(s => s.ExamId == examId && s.CandidateId == candidateId);

        if (summary == null)
 {
            // Generate on-the-fly if not exists
          var refreshResult = await RefreshCandidateExamSummaryInternalAsync(examId, candidateId, "system");
            if (refreshResult == null)
    {
            return ApiResponse<CandidateExamSummaryDto>.FailureResponse("No attempts found for this exam");
    }
            summary = refreshResult;
  }

        var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);
        var remainingAttempts = exam?.MaxAttempts > 0 
        ? Math.Max(0, exam.MaxAttempts - summary.TotalAttempts) 
    : -1; // -1 indicates unlimited

        var percentage = summary.BestScore.HasValue && summary.BestResult != null
            ? (summary.BestScore.Value / summary.BestResult.MaxPossibleScore) * 100
     : 0;

        var dto = new CandidateExamSummaryDto
        {
    Id = summary.Id,
            ExamId = summary.ExamId,
            ExamTitleEn = summary.Exam?.TitleEn ?? "",
  ExamTitleAr = summary.Exam?.TitleAr ?? "",
            CandidateId = summary.CandidateId,
        CandidateName = summary.Candidate?.FullName ?? summary.Candidate?.DisplayName ?? "",
        TotalAttempts = summary.TotalAttempts,
   MaxAttempts = exam?.MaxAttempts ?? 0,
            RemainingAttempts = remainingAttempts,
         BestAttemptId = summary.BestAttemptId,
       BestScore = summary.BestScore,
            BestPercentage = percentage,
            BestIsPassed = summary.BestIsPassed,
            LatestScore = summary.LatestScore,
         LatestIsPassed = summary.LatestIsPassed,
       LastAttemptAt = summary.LastAttemptAt
};

        return ApiResponse<CandidateExamSummaryDto>.SuccessResponse(dto);
    }

    #endregion

    #region Reports

    public async Task<ApiResponse<ExamReportDto>> GenerateExamReportAsync(GenerateExamReportDto dto, string userId)
    {
        var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == dto.ExamId);
        if (exam == null)
   {
        return ApiResponse<ExamReportDto>.FailureResponse("Exam not found");
        }

        var now = DateTime.UtcNow;

        // Query attempts
        var attemptsQuery = _context.Attempts.Where(a => a.ExamId == dto.ExamId);
        if (dto.FromDate.HasValue)
            attemptsQuery = attemptsQuery.Where(a => a.StartedAt >= dto.FromDate.Value);
  if (dto.ToDate.HasValue)
    attemptsQuery = attemptsQuery.Where(a => a.StartedAt <= dto.ToDate.Value);

        var attempts = await attemptsQuery.ToListAsync();

        // Query results
        var resultsQuery = _context.Set<Result>().Where(r => r.ExamId == dto.ExamId);
        if (dto.FromDate.HasValue)
  resultsQuery = resultsQuery.Where(r => r.FinalizedAt >= dto.FromDate.Value);
   if (dto.ToDate.HasValue)
        resultsQuery = resultsQuery.Where(r => r.FinalizedAt <= dto.ToDate.Value);

        var results = await resultsQuery.ToListAsync();

        var scores = results.Select(r => r.TotalScore).ToList();

        var report = new Domain.Entities.ExamResult.ExamReport
        {
     ExamId = dto.ExamId,
            FromDate = dto.FromDate,
         ToDate = dto.ToDate,
       TotalAttempts = attempts.Count,
            TotalSubmitted = attempts.Count(a => a.Status == AttemptStatus.Submitted),
            TotalExpired = attempts.Count(a => a.Status == AttemptStatus.Expired),
            TotalPassed = results.Count(r => r.IsPassed),
     TotalFailed = results.Count(r => !r.IsPassed),
  AverageScore = scores.Any() ? scores.Average() : 0,
            HighestScore = scores.Any() ? scores.Max() : 0,
  LowestScore = scores.Any() ? scores.Min() : 0,
   PassRate = results.Any() ? (decimal)results.Count(r => r.IsPassed) / results.Count * 100 : 0,
            GeneratedAt = now,
    GeneratedBy = userId,
            CreatedDate = now,
        CreatedBy = userId
        };

        _context.Set<Domain.Entities.ExamResult.ExamReport>().Add(report);
     await _context.SaveChangesAsync();

 return await GetExamReportInternalAsync(report);
    }

    public async Task<ApiResponse<ExamReportDto>> GetExamReportAsync(int examId)
    {
        var report = await _context.Set<Domain.Entities.ExamResult.ExamReport>()
     .Include(r => r.Exam)
        .Where(r => r.ExamId == examId)
            .OrderByDescending(r => r.GeneratedAt)
            .FirstOrDefaultAsync();

        if (report == null)
        {
   return ApiResponse<ExamReportDto>.FailureResponse("No report found. Generate a report first.");
        }

        return await GetExamReportInternalAsync(report);
    }

    public async Task<ApiResponse<List<QuestionPerformanceDto>>> GenerateQuestionPerformanceAsync(
        GenerateQuestionPerformanceDto dto, string userId)
    {
        var exam = await _context.Exams
            .Include(e => e.Questions)
                .ThenInclude(eq => eq.Question)
     .ThenInclude(q => q.QuestionType)
            .FirstOrDefaultAsync(e => e.Id == dto.ExamId);

     if (exam == null)
        {
     return ApiResponse<List<QuestionPerformanceDto>>.FailureResponse("Exam not found");
        }

        var now = DateTime.UtcNow;

    // Get all graded answers for this exam
        var gradedAnswers = await _context.GradedAnswers
  .Include(ga => ga.GradingSession)
           .ThenInclude(gs => gs.Attempt)
 .Where(ga => ga.GradingSession.Attempt.ExamId == dto.ExamId &&
             ga.GradingSession.Status == GradingStatus.Completed)
            .ToListAsync();

      // Delete existing reports for this exam
        var existingReports = await _context.Set<QuestionPerformanceReport>()
            .Where(r => r.ExamId == dto.ExamId)
            .ToListAsync();
        _context.Set<QuestionPerformanceReport>().RemoveRange(existingReports);

        var reports = new List<QuestionPerformanceReport>();

        foreach (var examQuestion in exam.Questions)
        {
            var questionAnswers = gradedAnswers.Where(ga => ga.QuestionId == examQuestion.QuestionId).ToList();
     var totalAnswers = questionAnswers.Count;
            var correctAnswers = questionAnswers.Count(ga => ga.IsCorrect);
          var incorrectAnswers = totalAnswers - correctAnswers;
   var correctRate = totalAnswers > 0 ? (decimal)correctAnswers / totalAnswers : 0;
      var avgScore = questionAnswers.Any() ? questionAnswers.Average(ga => ga.Score) : 0;

            var report = new QuestionPerformanceReport
         {
                ExamId = dto.ExamId,
       QuestionId = examQuestion.QuestionId,
       TotalAnswers = totalAnswers,
   CorrectAnswers = correctAnswers,
                IncorrectAnswers = incorrectAnswers,
          UnansweredCount = 0, // TODO: Calculate from attempts without answers
 CorrectRate = correctRate,
            AverageScore = avgScore,
       MaxPoints = examQuestion.Points,
      DifficultyIndex = correctRate, // Lower = harder
                GeneratedAt = now,
GeneratedBy = userId,
     CreatedDate = now,
      CreatedBy = userId
  };

     reports.Add(report);
  }

        _context.Set<QuestionPerformanceReport>().AddRange(reports);
        await _context.SaveChangesAsync();

        return await GetQuestionPerformanceAsync(dto.ExamId);
    }

    public async Task<ApiResponse<List<QuestionPerformanceDto>>> GetQuestionPerformanceAsync(int examId)
    {
        var reports = await _context.Set<QuestionPerformanceReport>()
            .Include(r => r.Question)
          .ThenInclude(q => q.QuestionType)
     .Where(r => r.ExamId == examId)
          .OrderBy(r => r.DifficultyIndex)
       .ToListAsync();

        var dtos = reports.Select(r => new QuestionPerformanceDto
        {
Id = r.Id,
     ExamId = r.ExamId,
            QuestionId = r.QuestionId,
      QuestionBodyEn = r.Question?.BodyEn ?? "",
            QuestionBodyAr = r.Question?.BodyAr ?? "",
 QuestionTypeName = r.Question?.QuestionType?.NameEn ?? "",
   TotalAnswers = r.TotalAnswers,
 CorrectAnswers = r.CorrectAnswers,
   IncorrectAnswers = r.IncorrectAnswers,
       UnansweredCount = r.UnansweredCount,
   CorrectRate = r.CorrectRate,
   AverageScore = r.AverageScore,
      MaxPoints = r.MaxPoints,
  DifficultyIndex = r.DifficultyIndex,
       DifficultyLabel = GetDifficultyLabel(r.DifficultyIndex),
   GeneratedAt = r.GeneratedAt
        }).ToList();

     return ApiResponse<List<QuestionPerformanceDto>>.SuccessResponse(dtos);
    }

    public async Task<ApiResponse<ResultDashboardDto>> GetResultDashboardAsync(int examId)
    {
      var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);
        if (exam == null)
        {
   return ApiResponse<ResultDashboardDto>.FailureResponse("Exam not found");
        }

        var attempts = await _context.Attempts
            .Where(a => a.ExamId == examId)
    .ToListAsync();

 var results = await _context.Set<Result>()
     .Where(r => r.ExamId == examId)
       .ToListAsync();

        var gradingSessions = await _context.GradingSessions
            .Where(gs => gs.Attempt.ExamId == examId)
.ToListAsync();

        var candidateCount = attempts.Select(a => a.CandidateId).Distinct().Count();
        var scores = results.Select(r => r.TotalScore).ToList();

        var dashboard = new ResultDashboardDto
    {
  ExamId = examId,
       ExamTitleEn = exam.TitleEn,
         TotalCandidates = candidateCount,
            TotalAttempts = attempts.Count,
            GradedCount = results.Count,
  PendingGradingCount = gradingSessions.Count(gs => gs.Status == GradingStatus.Pending || gs.Status == GradingStatus.ManualRequired),
            PublishedCount = results.Count(r => r.IsPublishedToCandidate),
  UnpublishedCount = results.Count(r => !r.IsPublishedToCandidate),
    PassedCount = results.Count(r => r.IsPassed),
     FailedCount = results.Count(r => !r.IsPassed),
    PassRate = results.Any() ? (decimal)results.Count(r => r.IsPassed) / results.Count * 100 : 0,
            AverageScore = scores.Any() ? scores.Average() : 0,
     HighestScore = scores.Any() ? scores.Max() : 0,
  LowestScore = scores.Any() ? scores.Min() : 0,
            ScoreDistribution = CalculateScoreDistribution(results)
        };

     return ApiResponse<ResultDashboardDto>.SuccessResponse(dashboard);
    }

    #endregion

  #region Candidate Summaries

    public async Task<ApiResponse<CandidateExamSummaryDto>> RefreshCandidateExamSummaryAsync(
        int examId, string candidateId, string userId)
    {
        var summary = await RefreshCandidateExamSummaryInternalAsync(examId, candidateId, userId);
   if (summary == null)
        {
         return ApiResponse<CandidateExamSummaryDto>.FailureResponse("No attempts found for this candidate");
  }

        return await GetCandidateExamSummaryAsync(examId, candidateId);
    }

    public async Task<ApiResponse<PaginatedResponse<CandidateExamSummaryListDto>>> GetExamCandidateSummariesAsync(
        int? examId, int pageNumber, int pageSize)
    {
        // If no summaries exist at all, try to create missing summaries from existing Results (repair)
        var countBefore = await _context.Set<CandidateExamSummary>().CountAsync();
        if (countBefore == 0)
            await EnsureSummariesForOrphanResultsAsync("system");

        var query = _context.Set<CandidateExamSummary>()
            .Include(s => s.Candidate)
            .Include(s => s.BestResult)
            .Include(s => s.Exam)
            .AsQueryable();

        if (examId.HasValue && examId.Value > 0)
            query = query.Where(s => s.ExamId == examId.Value);

        query = query.OrderByDescending(s => s.LastAttemptAt).ThenByDescending(s => s.BestScore);

        var totalCount = await query.CountAsync();
        // If we would return empty, try once more to create summaries for any Result that has none (e.g. Ali's case)
        if (totalCount == 0)
        {
            await EnsureSummariesForOrphanResultsAsync("system");
            query = _context.Set<CandidateExamSummary>()
                .Include(s => s.Candidate)
                .Include(s => s.BestResult)
                .Include(s => s.Exam)
                .AsQueryable();
            if (examId.HasValue && examId.Value > 0)
                query = query.Where(s => s.ExamId == examId.Value);
            query = query.OrderByDescending(s => s.LastAttemptAt).ThenByDescending(s => s.BestScore);
            totalCount = await query.CountAsync();
        }

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(s => new CandidateExamSummaryListDto
        {
            CandidateId = s.CandidateId,
            CandidateName = s.Candidate?.FullName ?? s.Candidate?.DisplayName ?? "",
            CandidateEmail = s.Candidate?.Email,
            TotalAttempts = s.TotalAttempts,
            BestScore = s.BestScore,
            BestPercentage = s.BestScore.HasValue && s.BestResult != null && s.BestResult.MaxPossibleScore > 0
                ? (s.BestScore.Value / s.BestResult.MaxPossibleScore) * 100
                : null,
            BestIsPassed = s.BestIsPassed,
            LastAttemptAt = s.LastAttemptAt,
            ExamId = s.ExamId,
            ExamTitleEn = s.Exam?.TitleEn,
            ExamTitleAr = s.Exam?.TitleAr
        }).ToList();

        return ApiResponse<PaginatedResponse<CandidateExamSummaryListDto>>.SuccessResponse(
            new PaginatedResponse<CandidateExamSummaryListDto>
            {
                Items = dtos,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<CandidateResultListResponseDto>> GetCandidateResultListAsync(
        int? examId, int pageNumber, int pageSize)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1) pageSize = 100;

        var attemptsQuery = _context.Attempts
            .Include(a => a.Candidate)
            .Include(a => a.Exam)
            .Where(a => a.Status == AttemptStatus.Submitted || a.Status == AttemptStatus.Expired
                     || a.Status == AttemptStatus.ForceSubmitted || a.Status == AttemptStatus.Terminated)
            .AsQueryable();

        if (examId.HasValue && examId.Value > 0)
        {
            attemptsQuery = attemptsQuery.Where(a => a.ExamId == examId.Value);
        }

        var groupedAttemptsQuery = attemptsQuery
            .GroupBy(a => new { a.ExamId, a.CandidateId })
            .Select(g => new
            {
                g.Key.ExamId,
                g.Key.CandidateId,
                TotalAttempts = g.Count(),
                LatestAttemptNumber = g.Max(x => x.AttemptNumber),
                LastAttemptAt = g.Max(x => x.SubmittedAt ?? x.StartedAt)
            });

        var totalCount = await groupedAttemptsQuery.CountAsync();

        var pagedGroups = await groupedAttemptsQuery
            .OrderByDescending(x => x.LastAttemptAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        if (!pagedGroups.Any())
        {
            return ApiResponse<CandidateResultListResponseDto>.SuccessResponse(
                new CandidateResultListResponseDto
                {
                    Items = new List<CandidateResultListDto>(),
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    Summary = new CandidateResultListSummaryDto
                    {
                        TotalCandidates = totalCount
                    }
                });
        }

        var examIds = pagedGroups.Select(x => x.ExamId).Distinct().ToHashSet();
        var candidateIds = pagedGroups.Select(x => x.CandidateId).Distinct().ToHashSet();
        var keyedGroups = pagedGroups.ToDictionary(
            x => $"{x.ExamId}:{x.CandidateId}",
            x => x);

        var candidateAttempts = await attemptsQuery
            .Where(a => examIds.Contains(a.ExamId) && candidateIds.Contains(a.CandidateId))
            .ToListAsync();

        var latestAttempts = candidateAttempts
            .GroupBy(a => $"{a.ExamId}:{a.CandidateId}")
            .Where(g => keyedGroups.ContainsKey(g.Key))
            .Select(g =>
            {
                var grp = keyedGroups[g.Key];
                return g.Where(a => a.AttemptNumber == grp.LatestAttemptNumber)
                    .OrderByDescending(a => a.SubmittedAt ?? a.StartedAt)
                    .ThenByDescending(a => a.Id)
                    .First();
            })
            .ToList();

        var latestAttemptIds = latestAttempts.Select(a => a.Id).ToList();

        var maxPossibleScoreByAttemptId = await _context.Set<Smart_Core.Domain.Entities.Attempt.AttemptQuestion>()
            .Where(aq => latestAttemptIds.Contains(aq.AttemptId))
            .GroupBy(aq => aq.AttemptId)
            .Select(g => new { AttemptId = g.Key, MaxPossibleScore = g.Sum(x => x.Points) })
            .ToDictionaryAsync(x => x.AttemptId, x => x.MaxPossibleScore);

        var gradingSessions = await _context.GradingSessions
            .Where(gs => latestAttemptIds.Contains(gs.AttemptId))
            .ToListAsync();

        var gradingByAttemptId = gradingSessions
            .GroupBy(gs => gs.AttemptId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.GradedAt ?? x.CreatedDate)
                    .ThenByDescending(x => x.Id)
                    .First());

        var results = await _context.Set<Result>()
            .Where(r => latestAttemptIds.Contains(r.AttemptId))
            .ToListAsync();

        var resultByAttemptId = results.ToDictionary(r => r.AttemptId, r => r);

        var rows = latestAttempts
            .Select(a =>
            {
                var key = $"{a.ExamId}:{a.CandidateId}";
                var grouped = keyedGroups[key];
                gradingByAttemptId.TryGetValue(a.Id, out var gradingSession);
                resultByAttemptId.TryGetValue(a.Id, out var result);

                var score = result?.TotalScore ?? gradingSession?.TotalScore;
                decimal? maxScoreFromAttempt = null;
                if (maxPossibleScoreByAttemptId.TryGetValue(a.Id, out var maxScoreValue))
                {
                    maxScoreFromAttempt = maxScoreValue;
                }
                var maxPossibleScore = result?.MaxPossibleScore ?? maxScoreFromAttempt;
                var percentage = score.HasValue && maxPossibleScore.HasValue && maxPossibleScore.Value > 0
                    ? (score.Value / maxPossibleScore.Value) * 100
                    : (decimal?)null;

                var gradingStatusCode = gradingSession?.Status ?? GradingStatus.Pending;
                var gradingStatus = GetCandidateResultListGradingStatusLabel(gradingStatusCode);

                return new CandidateResultListDto
                {
                    ExamId = a.ExamId,
                    ExamTitleEn = a.Exam?.TitleEn ?? string.Empty,
                    ExamTitleAr = a.Exam?.TitleAr ?? string.Empty,
                    CandidateId = a.CandidateId,
                    CandidateName = a.Candidate?.FullName ?? a.Candidate?.DisplayName ?? string.Empty,
                    CandidateEmail = a.Candidate?.Email,
                    TotalAttempts = grouped.TotalAttempts,
                    AttemptId = a.Id,
                    AttemptNumber = a.AttemptNumber,
                    GradingSessionId = gradingSession?.Id,
                    ResultId = result?.Id,
                    Score = score,
                    MaxPossibleScore = maxPossibleScore,
                    Percentage = percentage,
                    IsPassed = result?.IsPassed ?? gradingSession?.IsPassed,
                    IsPublished = result?.IsPublishedToCandidate ?? false,
                    IsResultFinalized = result != null,
                    GradingStatusCode = gradingStatusCode,
                    GradingStatus = gradingStatus,
                    GradedAt = gradingSession?.GradedAt,
                    LastAttemptAt = grouped.LastAttemptAt,
                    AttemptStatusName = a.Status.ToString(),
                    ExpiryReasonName = a.ExpiryReason != ExpiryReason.None ? a.ExpiryReason.ToString() : null
                };
            })
            .OrderByDescending(x => x.LastAttemptAt)
            .ToList();

        return ApiResponse<CandidateResultListResponseDto>.SuccessResponse(
            new CandidateResultListResponseDto
            {
                Items = rows,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                Summary = new CandidateResultListSummaryDto
                {
                    TotalCandidates = totalCount
                }
            });
    }

    #endregion

    #region Export

    public async Task<ApiResponse<ResultExportJobDto>> RequestExportAsync(RequestExportDto dto, string userId)
 {
      var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == dto.ExamId);
        if (exam == null)
        {
         return ApiResponse<ResultExportJobDto>.FailureResponse("Exam not found");
        }

        var now = DateTime.UtcNow;

        var job = new ResultExportJob
        {
            ExamId = dto.ExamId,
         Format = dto.Format,
       Status = ExportStatus.Pending,
            FromDate = dto.FromDate,
        ToDate = dto.ToDate,
PassedOnly = dto.PassedOnly,
   FailedOnly = dto.FailedOnly,
  RequestedBy = userId,
      RequestedAt = now,
    CreatedDate = now,
        CreatedBy = userId
        };

        _context.Set<ResultExportJob>().Add(job);
        await _context.SaveChangesAsync();

  return await GetExportJobAsync(job.Id);
    }

    public async Task<ApiResponse<ResultExportJobDto>> GetExportJobAsync(int jobId)
    {
     var job = await _context.Set<ResultExportJob>()
     .Include(j => j.Exam)
 .FirstOrDefaultAsync(j => j.Id == jobId);

   if (job == null)
        {
    return ApiResponse<ResultExportJobDto>.FailureResponse("Export job not found");
        }

        return ApiResponse<ResultExportJobDto>.SuccessResponse(MapToExportJobDto(job));
    }

    public async Task<ApiResponse<PaginatedResponse<ResultExportJobListDto>>> GetExportJobsAsync(ExportJobSearchDto searchDto)
    {
   var query = _context.Set<ResultExportJob>()
  .Include(j => j.Exam)
       .AsQueryable();

        if (searchDto.ExamId.HasValue)
            query = query.Where(j => j.ExamId == searchDto.ExamId.Value);

    if (searchDto.Status.HasValue)
    query = query.Where(j => j.Status == searchDto.Status.Value);

        if (searchDto.RequestedFrom.HasValue)
            query = query.Where(j => j.RequestedAt >= searchDto.RequestedFrom.Value);

   if (searchDto.RequestedTo.HasValue)
            query = query.Where(j => j.RequestedAt <= searchDto.RequestedTo.Value);

        query = query.OrderByDescending(j => j.RequestedAt);

        var totalCount = await query.CountAsync();
        var items = await query
       .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
     .Take(searchDto.PageSize)
  .ToListAsync();

     var dtos = items.Select(j => new ResultExportJobListDto
        {
      Id = j.Id,
            ExamId = j.ExamId,
            ExamTitleEn = j.Exam?.TitleEn ?? "",
      Format = j.Format,
    Status = j.Status,
            RequestedAt = j.RequestedAt,
            CompletedAt = j.CompletedAt,
 DownloadUrl = j.Status == ExportStatus.Completed ? $"/api/examresult/export/{j.Id}/download" : null
        }).ToList();

   return ApiResponse<PaginatedResponse<ResultExportJobListDto>>.SuccessResponse(
          new PaginatedResponse<ResultExportJobListDto>
       {
 Items = dtos,
       PageNumber = searchDto.PageNumber,
      PageSize = searchDto.PageSize,
           TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<bool>> CancelExportJobAsync(int jobId, string userId)
    {
        var job = await _context.Set<ResultExportJob>()
     .FirstOrDefaultAsync(j => j.Id == jobId);

    if (job == null)
        {
            return ApiResponse<bool>.FailureResponse("Export job not found");
        }

        if (job.Status != ExportStatus.Pending)
   {
        return ApiResponse<bool>.FailureResponse("Only pending jobs can be cancelled");
     }

        job.Status = ExportStatus.Failed;
        job.ErrorMessage = "Cancelled by user";
        job.UpdatedDate = DateTime.UtcNow;
        job.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Export job cancelled");
    }

    public async Task<int> ProcessPendingExportJobsAsync()
    {
     var pendingJobs = await _context.Set<ResultExportJob>()
        .Where(j => j.Status == ExportStatus.Pending)
     .ToListAsync();

        var processedCount = 0;

        foreach (var job in pendingJobs)
        {
            try
   {
   job.Status = ExportStatus.Processing;
                await _context.SaveChangesAsync();

 // TODO: Implement actual export logic based on format
      // For now, mark as completed with placeholder
      job.Status = ExportStatus.Completed;
     job.FileName = $"exam_{job.ExamId}_results_{DateTime.UtcNow:yyyyMMddHHmmss}.{job.Format.ToString().ToLower()}";
       job.FilePath = $"/exports/{job.FileName}";
       job.CompletedAt = DateTime.UtcNow;

                processedCount++;
        }
 catch (Exception ex)
      {
     job.Status = ExportStatus.Failed;
      job.ErrorMessage = ex.Message;
    job.RetryCount++;
      }

       await _context.SaveChangesAsync();
        }

        return processedCount;
    }

    #endregion

 #region Private Helper Methods

    /// <summary>
    /// Creates CandidateExamSummary records for any Result that does not yet have one (e.g. missed by an older flow).
    /// </summary>
    private async Task EnsureSummariesForOrphanResultsAsync(string userId)
    {
        var orphanPairs = await _context.Set<Result>()
            .GroupBy(r => new { r.ExamId, r.CandidateId })
            .Where(g => !_context.Set<CandidateExamSummary>().Any(s => s.ExamId == g.Key.ExamId && s.CandidateId == g.Key.CandidateId))
            .Select(g => new { g.Key.ExamId, g.Key.CandidateId })
            .ToListAsync();

        foreach (var p in orphanPairs)
            await RefreshCandidateExamSummaryInternalAsync(p.ExamId, p.CandidateId, userId);
    }

    private async Task<CandidateExamSummary?> RefreshCandidateExamSummaryInternalAsync(
      int examId, string candidateId, string userId)
    {
     var results = await _context.Set<Result>()
     .Include(r => r.Attempt)
     .Where(r => r.ExamId == examId && r.CandidateId == candidateId)
    .OrderByDescending(r => r.TotalScore)
            .ThenBy(r => r.FinalizedAt)
            .ToListAsync();

        if (!results.Any())
        {
       return null;
        }

      var now = DateTime.UtcNow;
        var bestResult = results.First();
        var latestResult = results.OrderByDescending(r => r.FinalizedAt).First();

        var summary = await _context.Set<CandidateExamSummary>()
   .FirstOrDefaultAsync(s => s.ExamId == examId && s.CandidateId == candidateId);

        if (summary == null)
        {
        summary = new CandidateExamSummary
 {
           ExamId = examId,
          CandidateId = candidateId,
         CreatedDate = now,
  CreatedBy = userId
     };
          _context.Set<CandidateExamSummary>().Add(summary);
  }

 summary.TotalAttempts = results.Count;
 summary.BestAttemptId = bestResult.AttemptId;
        summary.BestResultId = bestResult.Id;
        summary.BestScore = bestResult.TotalScore;
      summary.BestIsPassed = bestResult.IsPassed;
        summary.LatestAttemptId = latestResult.AttemptId;
   summary.LatestScore = latestResult.TotalScore;
     summary.LatestIsPassed = latestResult.IsPassed;
        summary.LastAttemptAt = latestResult.Attempt.StartedAt;
        summary.UpdatedDate = now;
        summary.UpdatedBy = userId;

        await _context.SaveChangesAsync();

      return summary;
  }

    private async Task<ApiResponse<ExamReportDto>> GetExamReportInternalAsync(Domain.Entities.ExamResult.ExamReport report)
    {
 var exam = report.Exam ?? await _context.Exams.FirstOrDefaultAsync(e => e.Id == report.ExamId);

 var dto = new ExamReportDto
    {
          Id = report.Id,
   ExamId = report.ExamId,
      ExamTitleEn = exam?.TitleEn ?? "",
  ExamTitleAr = exam?.TitleAr ?? "",
  FromDate = report.FromDate,
         ToDate = report.ToDate,
            TotalAttempts = report.TotalAttempts,
            TotalSubmitted = report.TotalSubmitted,
            TotalExpired = report.TotalExpired,
    TotalPassed = report.TotalPassed,
       TotalFailed = report.TotalFailed,
  AverageScore = report.AverageScore,
   HighestScore = report.HighestScore,
     LowestScore = report.LowestScore,
      PassRate = report.PassRate,
   TotalFlaggedAttempts = report.TotalFlaggedAttempts,
            AverageRiskScore = report.AverageRiskScore,
            GeneratedAt = report.GeneratedAt,
    GeneratedBy = report.GeneratedBy
        };

     return ApiResponse<ExamReportDto>.SuccessResponse(dto);
    }

    private string GetCandidateResultListGradingStatusLabel(GradingStatus status)
    {
        return status switch
        {
            GradingStatus.AutoGraded => "Auto Graded",
            GradingStatus.ManualRequired => "In Review",
            GradingStatus.Completed => "Manual Graded",
            _ => "Pending"
        };
    }

    private IQueryable<Result> ApplyResultFilters(IQueryable<Result> query, ResultSearchDto searchDto)
    {
        if (searchDto.ExamId.HasValue)
            query = query.Where(r => r.ExamId == searchDto.ExamId.Value);

   if (!string.IsNullOrEmpty(searchDto.CandidateId))
      query = query.Where(r => r.CandidateId == searchDto.CandidateId);

        if (searchDto.IsPassed.HasValue)
  query = query.Where(r => r.IsPassed == searchDto.IsPassed.Value);

 if (searchDto.IsPublished.HasValue)
 query = query.Where(r => r.IsPublishedToCandidate == searchDto.IsPublished.Value);

     if (searchDto.FinalizedFrom.HasValue)
            query = query.Where(r => r.FinalizedAt >= searchDto.FinalizedFrom.Value);

        if (searchDto.FinalizedTo.HasValue)
       query = query.Where(r => r.FinalizedAt <= searchDto.FinalizedTo.Value);

        if (!string.IsNullOrEmpty(searchDto.Search))
      {
      var search = searchDto.Search.ToLower();
         query = query.Where(r =>
 r.Candidate.Email!.ToLower().Contains(search) ||
              (r.Candidate.FullName != null && r.Candidate.FullName.ToLower().Contains(search)));
        }

        return query;
    }

    private string CalculateGradeLabel(decimal score, decimal maxScore)
    {
        if (maxScore == 0) return "N/A";

        var percentage = (score / maxScore) * 100;

        return percentage switch
        {
            >= 90 => "A",
        >= 80 => "B",
      >= 70 => "C",
        >= 60 => "D",
            _ => "F"
      };
    }

    private string GetDifficultyLabel(decimal difficultyIndex)
    {
        return difficultyIndex switch
     {
 >= 0.8m => "Easy",
        >= 0.5m => "Medium",
  >= 0.3m => "Hard",
       _ => "Very Hard"
        };
    }

    private List<ScoreDistributionDto> CalculateScoreDistribution(List<Result> results)
    {
        if (!results.Any()) return new List<ScoreDistributionDto>();

        var maxScore = results.Max(r => r.MaxPossibleScore);
        var bucketSize = maxScore / 10;
        var distribution = new List<ScoreDistributionDto>();

        for (int i = 0; i < 10; i++)
        {
            var min = i * bucketSize;
       var max = (i + 1) * bucketSize;
            var count = results.Count(r => r.TotalScore >= min && r.TotalScore < max);

     distribution.Add(new ScoreDistributionDto
 {
           Range = $"{min:F0}-{max:F0}",
       Count = count,
                Percentage = results.Any() ? (decimal)count / results.Count * 100 : 0
         });
        }

        return distribution;
    }

    private ResultDto MapToResultDto(Result result)
    {
        var percentage = result.MaxPossibleScore > 0
   ? (result.TotalScore / result.MaxPossibleScore) * 100
       : 0;

        return new ResultDto
     {
     Id = result.Id,
          ExamId = result.ExamId,
    ExamTitleEn = result.Exam?.TitleEn ?? "",
        ExamTitleAr = result.Exam?.TitleAr ?? "",
   AttemptId = result.AttemptId,
          AttemptNumber = result.Attempt?.AttemptNumber ?? 0,
    CandidateId = result.CandidateId,
     CandidateName = result.Candidate?.FullName ?? result.Candidate?.DisplayName ?? "",
CandidateEmail = result.Candidate?.Email,
      TotalScore = result.TotalScore,
    MaxPossibleScore = result.MaxPossibleScore,
  PassScore = result.PassScore,
Percentage = percentage,
       IsPassed = result.IsPassed,
     GradeLabel = result.GradeLabel,
            IsPublishedToCandidate = result.IsPublishedToCandidate,
     PublishedAt = result.PublishedAt,
            FinalizedAt = result.FinalizedAt,
            AttemptStartedAt = result.Attempt?.StartedAt,
            AttemptSubmittedAt = result.Attempt?.SubmittedAt
        };
 }

    private ResultListDto MapToResultListDto(Result result)
 {
        var percentage = result.MaxPossibleScore > 0
            ? (result.TotalScore / result.MaxPossibleScore) * 100
      : 0;

        return new ResultListDto
        {
            Id = result.Id,
            ExamId = result.ExamId,
  ExamTitleEn = result.Exam?.TitleEn ?? "",
          AttemptId = result.AttemptId,
            AttemptNumber = result.Attempt?.AttemptNumber ?? 0,
      CandidateId = result.CandidateId,
   CandidateName = result.Candidate?.FullName ?? result.Candidate?.DisplayName ?? "",
        TotalScore = result.TotalScore,
        MaxPossibleScore = result.MaxPossibleScore,
    Percentage = percentage,
            IsPassed = result.IsPassed,
       GradeLabel = result.GradeLabel,
            IsPublishedToCandidate = result.IsPublishedToCandidate,
            FinalizedAt = result.FinalizedAt
 };
    }

 private ResultExportJobDto MapToExportJobDto(ResultExportJob job)
    {
     return new ResultExportJobDto
        {
            Id = job.Id,
    ExamId = job.ExamId,
            ExamTitleEn = job.Exam?.TitleEn ?? "",
  Format = job.Format,
      Status = job.Status,
       FromDate = job.FromDate,
            ToDate = job.ToDate,
            PassedOnly = job.PassedOnly,
            FailedOnly = job.FailedOnly,
            RequestedBy = job.RequestedBy,
      RequestedAt = job.RequestedAt,
  FileName = job.FileName,
            FilePath = job.FilePath,
       DownloadUrl = job.Status == ExportStatus.Completed ? $"/api/examresult/export/{job.Id}/download" : null,
        FileSizeBytes = job.FileSizeBytes,
CompletedAt = job.CompletedAt,
            ErrorMessage = job.ErrorMessage
        };
    }

    #endregion
}
