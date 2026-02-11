using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamResult;

namespace Smart_Core.Application.Interfaces.ExamResult;

/// <summary>
/// Service interface for managing exam results and reports
/// </summary>
public interface IExamResultService
{
    #region Result Management

    /// <summary>
    /// Finalize result from completed grading session
    /// </summary>
    Task<ApiResponse<ResultDto>> FinalizeResultAsync(int gradingSessionId, string userId);

    /// <summary>
    /// Get result by ID
    /// </summary>
    Task<ApiResponse<ResultDto>> GetResultByIdAsync(int resultId);

    /// <summary>
    /// Get result by attempt ID
  /// </summary>
    Task<ApiResponse<ResultDto>> GetResultByAttemptAsync(int attemptId);

    /// <summary>
    /// Get all results with pagination and filtering
    /// </summary>
    Task<ApiResponse<PaginatedResponse<ResultListDto>>> GetResultsAsync(ResultSearchDto searchDto);

    /// <summary>
    /// Get results for a specific exam
    /// </summary>
    Task<ApiResponse<PaginatedResponse<ResultListDto>>> GetExamResultsAsync(int examId, ResultSearchDto searchDto);

    /// <summary>
    /// Update result after re-grading
    /// </summary>
    Task<ApiResponse<ResultDto>> UpdateResultFromRegradingAsync(int gradingSessionId, string userId);

    #endregion

    #region Publishing

    /// <summary>
    /// Publish a single result to candidate
    /// </summary>
    Task<ApiResponse<ResultDto>> PublishResultAsync(int resultId, string userId);

    /// <summary>
  /// Unpublish a result (Admin only)
    /// </summary>
    Task<ApiResponse<ResultDto>> UnpublishResultAsync(int resultId, string userId);

    /// <summary>
    /// Bulk publish results
    /// </summary>
    Task<ApiResponse<int>> BulkPublishResultsAsync(BulkPublishResultsDto dto, string userId);

    /// <summary>
    /// Publish all results for an exam
    /// </summary>
    Task<ApiResponse<int>> PublishExamResultsAsync(PublishExamResultsDto dto, string userId);

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get candidate's result for an attempt (only if published)
    /// </summary>
  Task<ApiResponse<CandidateResultDto>> GetCandidateResultAsync(int attemptId, string candidateId);

    /// <summary>
    /// Get all published results for a candidate
    /// </summary>
    Task<ApiResponse<List<CandidateResultDto>>> GetCandidateAllResultsAsync(string candidateId);

    /// <summary>
    /// Get candidate's exam summary
  /// </summary>
    Task<ApiResponse<CandidateExamSummaryDto>> GetCandidateExamSummaryAsync(int examId, string candidateId);

    #endregion

    #region Reports

 /// <summary>
  /// Generate/refresh exam report
    /// </summary>
    Task<ApiResponse<ExamReportDto>> GenerateExamReportAsync(GenerateExamReportDto dto, string userId);

    /// <summary>
    /// Get latest exam report
    /// </summary>
    Task<ApiResponse<ExamReportDto>> GetExamReportAsync(int examId);

    /// <summary>
    /// Generate/refresh question performance reports
    /// </summary>
 Task<ApiResponse<List<QuestionPerformanceDto>>> GenerateQuestionPerformanceAsync(GenerateQuestionPerformanceDto dto, string userId);

    /// <summary>
    /// Get question performance reports for an exam
  /// </summary>
    Task<ApiResponse<List<QuestionPerformanceDto>>> GetQuestionPerformanceAsync(int examId);

    /// <summary>
    /// Get result dashboard for an exam
    /// </summary>
    Task<ApiResponse<ResultDashboardDto>> GetResultDashboardAsync(int examId);

    #endregion

    #region Candidate Summaries

    /// <summary>
    /// Refresh candidate exam summary
    /// </summary>
    Task<ApiResponse<CandidateExamSummaryDto>> RefreshCandidateExamSummaryAsync(int examId, string candidateId, string userId);

    /// <summary>
 /// Get all candidate summaries for an exam (or all exams when examId is null)
    /// </summary>
    Task<ApiResponse<PaginatedResponse<CandidateExamSummaryListDto>>> GetExamCandidateSummariesAsync(int? examId, int pageNumber, int pageSize);

    /// <summary>
    /// Get combined candidate result list with grading status in a single request
    /// </summary>
    Task<ApiResponse<CandidateResultListResponseDto>> GetCandidateResultListAsync(int? examId, int pageNumber, int pageSize);

    #endregion

    #region Export

    /// <summary>
    /// Request a result export job
  /// </summary>
    Task<ApiResponse<ResultExportJobDto>> RequestExportAsync(RequestExportDto dto, string userId);

    /// <summary>
    /// Get export job by ID
    /// </summary>
    Task<ApiResponse<ResultExportJobDto>> GetExportJobAsync(int jobId);

    /// <summary>
    /// Get export jobs for an exam
    /// </summary>
    Task<ApiResponse<PaginatedResponse<ResultExportJobListDto>>> GetExportJobsAsync(ExportJobSearchDto searchDto);

    /// <summary>
    /// Cancel a pending export job
    /// </summary>
    Task<ApiResponse<bool>> CancelExportJobAsync(int jobId, string userId);

    /// <summary>
    /// Process pending export jobs (called by background service)
    /// </summary>
    Task<int> ProcessPendingExportJobsAsync();

    #endregion
}
