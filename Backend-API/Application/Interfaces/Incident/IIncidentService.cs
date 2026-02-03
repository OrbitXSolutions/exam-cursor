using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Incident;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces.Incident;

/// <summary>
/// Service interface for incident and appeal management
/// </summary>
public interface IIncidentService
{
    #region Case Management

    /// <summary>
    /// Create a new incident case
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> CreateCaseAsync(CreateIncidentCaseDto dto, string userId);

    /// <summary>
    /// Create case automatically from proctor session
    /// </summary>
Task<ApiResponse<IncidentCaseDto>> CreateCaseFromProctorAsync(int proctorSessionId, string userId);

    /// <summary>
  /// Get incident case by ID
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> GetCaseAsync(int caseId);

  /// <summary>
    /// Get incident case by attempt ID
    /// </summary>
 Task<ApiResponse<IncidentCaseDto>> GetCaseByAttemptAsync(int attemptId);

    /// <summary>
    /// Update incident case
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> UpdateCaseAsync(UpdateIncidentCaseDto dto, string userId);

    /// <summary>
    /// Get all cases with filtering
    /// </summary>
    Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetCasesAsync(IncidentCaseSearchDto searchDto);

    /// <summary>
    /// Get cases for an exam
  /// </summary>
    Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetExamCasesAsync(int examId, IncidentCaseSearchDto searchDto);

    /// <summary>
    /// Get cases assigned to a reviewer
    /// </summary>
    Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetAssignedCasesAsync(string reviewerId, IncidentCaseSearchDto searchDto);

    #endregion

    #region Assignment & Status

    /// <summary>
    /// Assign case to a reviewer
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> AssignCaseAsync(AssignCaseDto dto, string userId);

  /// <summary>
    /// Reassign case to a different reviewer
  /// </summary>
    Task<ApiResponse<IncidentCaseDto>> ReassignCaseAsync(AssignCaseDto dto, string userId);

    /// <summary>
 /// Change case status
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> ChangeStatusAsync(ChangeStatusDto dto, string userId);

    /// <summary>
    /// Close a resolved case
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> CloseCaseAsync(int caseId, string userId);

    /// <summary>
    /// Reopen a case (for appeals)
    /// </summary>
    Task<ApiResponse<IncidentCaseDto>> ReopenCaseAsync(int caseId, string reason, string userId);

    #endregion

    #region Evidence

    /// <summary>
    /// Link evidence to a case
    /// </summary>
    Task<ApiResponse<IncidentEvidenceLinkDto>> LinkEvidenceAsync(LinkEvidenceDto dto, string userId);

    /// <summary>
    /// Get evidence for a case
    /// </summary>
    Task<ApiResponse<List<IncidentEvidenceLinkDto>>> GetCaseEvidenceAsync(int caseId);

    /// <summary>
/// Remove evidence link
  /// </summary>
    Task<ApiResponse<bool>> RemoveEvidenceLinkAsync(int linkId, string userId);

    #endregion

#region Decisions

    /// <summary>
    /// Record a decision on a case
    /// </summary>
    Task<ApiResponse<IncidentDecisionHistoryDto>> RecordDecisionAsync(RecordDecisionDto dto, string userId);

    /// <summary>
 /// Get decision history for a case
    /// </summary>
    Task<ApiResponse<List<IncidentDecisionHistoryDto>>> GetDecisionHistoryAsync(int caseId);

    /// <summary>
    /// Get the latest decision for a case
/// </summary>
    Task<ApiResponse<IncidentDecisionHistoryDto>> GetLatestDecisionAsync(int caseId);

    #endregion

    #region Comments

    /// <summary>
    /// Add a comment to a case
    /// </summary>
    Task<ApiResponse<IncidentCommentDto>> AddCommentAsync(AddCommentDto dto, string userId);

    /// <summary>
    /// Edit a comment
  /// </summary>
    Task<ApiResponse<IncidentCommentDto>> EditCommentAsync(EditCommentDto dto, string userId);

    /// <summary>
    /// Delete a comment
    /// </summary>
    Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, string userId);

    /// <summary>
    /// Get comments for a case
    /// </summary>
    Task<ApiResponse<List<IncidentCommentDto>>> GetCommentsAsync(int caseId, bool includeInternal = true);

    #endregion

    #region Timeline

  /// <summary>
    /// Get timeline for a case
    /// </summary>
    Task<ApiResponse<List<IncidentTimelineEventDto>>> GetTimelineAsync(int caseId);

    #endregion

    #region Appeals

    /// <summary>
    /// Submit an appeal (candidate)
    /// </summary>
    Task<ApiResponse<AppealRequestDto>> SubmitAppealAsync(SubmitAppealDto dto, string candidateId);

    /// <summary>
  /// Get appeal by ID
    /// </summary>
    Task<ApiResponse<AppealRequestDto>> GetAppealAsync(int appealId);

    /// <summary>
    /// Get appeals for a case
    /// </summary>
    Task<ApiResponse<List<AppealRequestDto>>> GetCaseAppealsAsync(int caseId);

    /// <summary>
    /// Get all appeals with filtering
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AppealRequestListDto>>> GetAppealsAsync(AppealSearchDto searchDto);

 /// <summary>
    /// Review an appeal (admin/reviewer)
    /// </summary>
 Task<ApiResponse<AppealRequestDto>> ReviewAppealAsync(ReviewAppealDto dto, string reviewerId);

    /// <summary>
    /// Get candidate's appeal for a case
    /// </summary>
    Task<ApiResponse<AppealRequestDto>> GetCandidateAppealAsync(int caseId, string candidateId);

    /// <summary>
    /// Check if candidate can submit appeal
  /// </summary>
    Task<ApiResponse<bool>> CanSubmitAppealAsync(int caseId, string candidateId);

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get candidate's incident status (limited view)
    /// </summary>
    Task<ApiResponse<CandidateIncidentStatusDto>> GetCandidateIncidentStatusAsync(int attemptId, string candidateId);

    /// <summary>
    /// Get all incidents for a candidate
    /// </summary>
    Task<ApiResponse<List<CandidateIncidentStatusDto>>> GetCandidateIncidentsAsync(string candidateId);

    #endregion

    #region Dashboard

    /// <summary>
    /// Get incident dashboard for an exam
    /// </summary>
    Task<ApiResponse<IncidentDashboardDto>> GetDashboardAsync(int examId);

    /// <summary>
    /// Get global incident dashboard
    /// </summary>
    Task<ApiResponse<IncidentDashboardDto>> GetGlobalDashboardAsync();

    #endregion

    #region Automation

    /// <summary>
    /// Check proctor sessions and create incidents based on rules
 /// </summary>
    Task<int> ProcessProctorIncidentsAsync(decimal riskThreshold, int violationThreshold);

    #endregion
}
