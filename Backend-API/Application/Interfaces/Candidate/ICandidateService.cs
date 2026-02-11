using Smart_Core.Application.DTOs.Candidate;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Candidate;

public interface ICandidateService
{
    #region Exam Discovery & Preview

    /// <summary>
    /// Get all published and active exams (filtered by department if user is not Candidate role)
    /// </summary>
    Task<ApiResponse<List<CandidateExamListDto>>> GetAvailableExamsAsync(string candidateId);

    /// <summary>
    /// Get exam preview with instructions and eligibility check
    /// </summary>
    Task<ApiResponse<CandidateExamPreviewDto>> GetExamPreviewAsync(int examId, string candidateId);

    #endregion

    #region Exam Attempt

    /// <summary>
    /// Start a new attempt or resume an existing active attempt
    /// </summary>
    Task<ApiResponse<CandidateAttemptSessionDto>> StartExamAsync(int examId, StartExamRequest request, string candidateId);

    /// <summary>
    /// Get attempt session (single source of truth for resume)
    /// </summary>
    Task<ApiResponse<CandidateAttemptSessionDto>> GetAttemptSessionAsync(int attemptId, string candidateId);

    /// <summary>
    /// Bulk save answers (idempotent)
    /// </summary>
    Task<ApiResponse<bool>> SaveAnswersAsync(int attemptId, BulkSaveAnswersRequest request, string candidateId);

    /// <summary>
    /// Submit attempt
    /// </summary>
    Task<ApiResponse<CandidateResultSummaryDto>> SubmitAttemptAsync(int attemptId, string candidateId);

    #endregion

    #region Results

    /// <summary>
    /// Get result for specific attempt (respects exam settings)
    /// </summary>
    Task<ApiResponse<CandidateResultSummaryDto>> GetMyResultAsync(int attemptId, string candidateId);

    /// <summary>
    /// Get detailed result review with answers (only if allowReview = true)
    /// </summary>
    Task<ApiResponse<CandidateResultReviewDto>> GetMyResultReviewAsync(int attemptId, string candidateId);

    #endregion

    #region Dashboard

    /// <summary>
    /// Get comprehensive dashboard with all stats and info
    /// </summary>
    Task<ApiResponse<CandidateDashboardDto>> GetDashboardAsync(string candidateId);

    #endregion

    #region Exam Journey

    /// <summary>
    /// Get exam journey data - single endpoint for candidate landing page
    /// Returns primary action + exams grouped by journey stage
    /// </summary>
    Task<ApiResponse<ExamJourneyDto>> GetExamJourneyAsync(string candidateId);

    #endregion
}
