using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Attempt;

/// <summary>
/// Service interface for managing exam attempts
/// </summary>
public interface IAttemptService
{
    #region Attempt Lifecycle

    /// <summary>
    /// Start a new attempt or resume an existing active attempt
    /// </summary>
    Task<ApiResponse<AttemptSessionDto>> StartAttemptAsync(StartAttemptDto dto, string candidateId);

    /// <summary>
    /// Get attempt session details (for resuming)
    /// </summary>
    Task<ApiResponse<AttemptSessionDto>> GetAttemptSessionAsync(int attemptId, string candidateId);

    /// <summary>
    /// Submit an attempt
    /// </summary>
    Task<ApiResponse<AttemptSubmittedDto>> SubmitAttemptAsync(int attemptId, string candidateId);

    /// <summary>
    /// Get remaining time for an attempt
    /// </summary>
Task<ApiResponse<AttemptTimerDto>> GetAttemptTimerAsync(int attemptId, string candidateId);

    /// <summary>
    /// Check and expire attempts that have exceeded their time limit
    /// </summary>
    Task<int> ExpireOverdueAttemptsAsync();

    #endregion

    #region Answers

    /// <summary>
    /// Save or update an answer
    /// </summary>
    Task<ApiResponse<AnswerSavedDto>> SaveAnswerAsync(int attemptId, SaveAnswerDto dto, string candidateId);

    /// <summary>
    /// Bulk save answers
    /// </summary>
    Task<ApiResponse<List<AnswerSavedDto>>> BulkSaveAnswersAsync(int attemptId, BulkSaveAnswersDto dto, string candidateId);

    /// <summary>
    /// Get all answers for an attempt
    /// </summary>
    Task<ApiResponse<List<AttemptAnswerDto>>> GetAttemptAnswersAsync(int attemptId, string candidateId);

    #endregion

    #region Events

    /// <summary>
    /// Log an event during the attempt
    /// </summary>
    Task<ApiResponse<bool>> LogEventAsync(int attemptId, LogAttemptEventDto dto, string candidateId);

    /// <summary>
    /// Get all events for an attempt (admin only)
    /// </summary>
    Task<ApiResponse<List<AttemptEventDto>>> GetAttemptEventsAsync(int attemptId);

    #endregion

    #region Queries

    /// <summary>
    /// Get attempt by ID
  /// </summary>
    Task<ApiResponse<AttemptDto>> GetAttemptByIdAsync(int attemptId);

    /// <summary>
    /// Get attempt details for admin view
    /// </summary>
    Task<ApiResponse<AttemptDetailDto>> GetAttemptDetailsAsync(int attemptId);

    /// <summary>
    /// Get all attempts with pagination and filtering
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AttemptListDto>>> GetAttemptsAsync(AttemptSearchDto searchDto);

    /// <summary>
    /// Get candidate's attempts for a specific exam
    /// </summary>
    Task<ApiResponse<List<AttemptListDto>>> GetCandidateExamAttemptsAsync(int examId, string candidateId);

    /// <summary>
    /// Get all attempts for a candidate
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AttemptListDto>>> GetCandidateAttemptsAsync(string candidateId, AttemptSearchDto searchDto);

    #endregion

    #region Admin Operations

    /// <summary>
 /// Cancel an attempt (admin only)
    /// </summary>
    Task<ApiResponse<bool>> CancelAttemptAsync(CancelAttemptDto dto, string adminUserId);

    /// <summary>
    /// Force submit an attempt (admin only)
    /// </summary>
    Task<ApiResponse<AttemptSubmittedDto>> ForceSubmitAttemptAsync(int attemptId, string adminUserId);

    #endregion
}
