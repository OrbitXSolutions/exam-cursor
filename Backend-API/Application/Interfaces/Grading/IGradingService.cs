using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Grading;

namespace Smart_Core.Application.Interfaces.Grading;

/// <summary>
/// Service interface for managing exam grading
/// </summary>
public interface IGradingService
{
    #region Grading Lifecycle

    /// <summary>
    /// Initiate grading for a submitted attempt (triggers auto-grading)
    /// </summary>
    Task<ApiResponse<GradingInitiatedDto>> InitiateGradingAsync(InitiateGradingDto dto, string graderId);

    /// <summary>
    /// Get grading session by ID
    /// </summary>
    Task<ApiResponse<GradingSessionDto>> GetGradingSessionAsync(int gradingSessionId);

    /// <summary>
    /// Get grading session by attempt ID
    /// </summary>
    Task<ApiResponse<GradingSessionDto>> GetGradingSessionByAttemptAsync(int attemptId);

    /// <summary>
    /// Complete grading session (finalize scores)
    /// </summary>
    Task<ApiResponse<GradingCompletedDto>> CompleteGradingAsync(CompleteGradingDto dto, string graderId);

    #endregion

 #region Manual Grading

    /// <summary>
    /// Submit manual grade for a single question
    /// </summary>
    Task<ApiResponse<GradeSubmittedDto>> SubmitManualGradeAsync(ManualGradeDto dto, string graderId);

    /// <summary>
    /// Bulk submit manual grades
    /// </summary>
  Task<ApiResponse<List<GradeSubmittedDto>>> BulkSubmitManualGradesAsync(BulkManualGradeDto dto, string graderId);

    /// <summary>
    /// Get questions requiring manual grading for a session
    /// </summary>
  Task<ApiResponse<List<GradedAnswerDto>>> GetManualGradingQueueAsync(int gradingSessionId);

    #endregion

    #region Re-grading

    /// <summary>
    /// Re-grade a previously graded answer
    /// </summary>
  Task<ApiResponse<RegradeResultDto>> RegradeAnswerAsync(RegradeDto dto, string graderId);

    #endregion

    #region Queries

    /// <summary>
    /// Get all grading sessions with pagination and filtering
    /// </summary>
Task<ApiResponse<PaginatedResponse<GradingSessionListDto>>> GetGradingSessionsAsync(GradingSearchDto searchDto);

    /// <summary>
    /// Get grading sessions requiring manual grading
    /// </summary>
    Task<ApiResponse<PaginatedResponse<GradingSessionListDto>>> GetManualGradingRequiredAsync(GradingSearchDto searchDto);

    /// <summary>
    /// Get grading statistics for an exam
    /// </summary>
    Task<ApiResponse<ExamGradingStatsDto>> GetExamGradingStatsAsync(int examId);

    /// <summary>
    /// Get question-level grading statistics for an exam
    /// </summary>
    Task<ApiResponse<List<QuestionGradingStatsDto>>> GetQuestionGradingStatsAsync(int examId);

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get grading result for candidate (limited info)
    /// </summary>
    Task<ApiResponse<CandidateGradingResultDto>> GetCandidateResultAsync(int attemptId, string candidateId);

    /// <summary>
    /// Check if grading is complete for an attempt
 /// </summary>
    Task<ApiResponse<bool>> IsGradingCompleteAsync(int attemptId);

    #endregion

    #region Auto-Grading

    /// <summary>
    /// Run auto-grading for all pending sessions (batch job)
    /// </summary>
    Task<int> ProcessPendingGradingSessionsAsync();

    #endregion
}
