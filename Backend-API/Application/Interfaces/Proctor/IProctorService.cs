using Microsoft.AspNetCore.Http;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces.Proctor;

/// <summary>
/// Service interface for proctoring functionality
/// </summary>
public interface IProctorService
{
  #region Session Management

  /// <summary>
  /// Create a new proctor session for an attempt
  /// </summary>
  Task<ApiResponse<ProctorSessionCreatedDto>> CreateSessionAsync(CreateProctorSessionDto dto, string candidateId, string ipAddress);

  /// <summary>
  /// Get proctor session by ID
  /// </summary>
  Task<ApiResponse<ProctorSessionDto>> GetSessionAsync(int sessionId);

  /// <summary>
  /// Get proctor session by attempt ID and mode
  /// </summary>
  Task<ApiResponse<ProctorSessionDto>> GetSessionByAttemptAsync(int attemptId, ProctorMode mode);

  /// <summary>
  /// End a proctor session
  /// </summary>
  Task<ApiResponse<ProctorSessionDto>> EndSessionAsync(int sessionId, string userId);

  /// <summary>
  /// Cancel a proctor session (admin only)
  /// </summary>
  Task<ApiResponse<bool>> CancelSessionAsync(int sessionId, string adminUserId);

  /// <summary>
  /// Get all sessions with filtering
  /// </summary>
  Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetSessionsAsync(ProctorSessionSearchDto searchDto);

  /// <summary>
  /// Get sessions for an exam
  /// </summary>
  Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetExamSessionsAsync(int examId, ProctorSessionSearchDto searchDto);

  #endregion

  #region Events

  /// <summary>
  /// Log a single proctor event
  /// </summary>
  Task<ApiResponse<ProctorEventDto>> LogEventAsync(LogProctorEventDto dto, string candidateId);

  /// <summary>
  /// Bulk log proctor events
  /// </summary>
  Task<ApiResponse<int>> BulkLogEventsAsync(BulkLogProctorEventsDto dto, string candidateId);

  /// <summary>
  /// Process heartbeat
  /// </summary>
  Task<ApiResponse<HeartbeatResponseDto>> ProcessHeartbeatAsync(HeartbeatDto dto, string candidateId);

  /// <summary>
  /// Get events for a session
  /// </summary>
  Task<ApiResponse<List<ProctorEventDto>>> GetSessionEventsAsync(int sessionId);

  /// <summary>
  /// Get events by type for a session
  /// </summary>
  Task<ApiResponse<List<ProctorEventDto>>> GetEventsByTypeAsync(int sessionId, ProctorEventType eventType);

  #endregion

  #region Risk Management

  /// <summary>
  /// Calculate risk score for a session
  /// </summary>
  Task<ApiResponse<RiskCalculationResultDto>> CalculateRiskScoreAsync(int sessionId, string calculatedBy);

  /// <summary>
  /// Get risk rules
  /// </summary>
  Task<ApiResponse<List<ProctorRiskRuleDto>>> GetRiskRulesAsync(bool activeOnly = true);

  /// <summary>
  /// Create a risk rule
  /// </summary>
  Task<ApiResponse<ProctorRiskRuleDto>> CreateRiskRuleAsync(SaveProctorRiskRuleDto dto, string userId);

  /// <summary>
  /// Update a risk rule
  /// </summary>
  Task<ApiResponse<ProctorRiskRuleDto>> UpdateRiskRuleAsync(int ruleId, SaveProctorRiskRuleDto dto, string userId);

  /// <summary>
  /// Delete a risk rule
  /// </summary>
  Task<ApiResponse<bool>> DeleteRiskRuleAsync(int ruleId, string userId);

  /// <summary>
  /// Toggle risk rule active status
  /// </summary>
  Task<ApiResponse<ProctorRiskRuleDto>> ToggleRiskRuleAsync(int ruleId, string userId);

  #endregion

  #region Evidence

  /// <summary>
  /// Request upload URL for evidence
  /// </summary>
  Task<ApiResponse<EvidenceUploadResultDto>> RequestEvidenceUploadAsync(UploadEvidenceDto dto, string candidateId);

  /// <summary>
  /// Confirm evidence upload completed
  /// </summary>
  Task<ApiResponse<ProctorEvidenceDto>> ConfirmEvidenceUploadAsync(int evidenceId, long fileSize, string? checksum);

  /// <summary>
  /// Upload webcam snapshot directly (multipart)
  /// </summary>
  Task<ApiResponse<ProctorEvidenceDto>> UploadSnapshotAsync(int attemptId, IFormFile file, string candidateId);

  /// <summary>
  /// Get evidence for a session
  /// </summary>
  Task<ApiResponse<List<ProctorEvidenceDto>>> GetSessionEvidenceAsync(int sessionId);

  /// <summary>
  /// Get secure download URL for evidence
  /// </summary>
  Task<ApiResponse<string>> GetEvidenceDownloadUrlAsync(int evidenceId, string userId);

  #endregion

  #region Decisions

  /// <summary>
  /// Make a decision on a proctor session
  /// </summary>
  Task<ApiResponse<ProctorDecisionDto>> MakeDecisionAsync(MakeDecisionDto dto, string reviewerId);

  /// <summary>
  /// Override a previous decision
  /// </summary>
  Task<ApiResponse<ProctorDecisionDto>> OverrideDecisionAsync(OverrideDecisionDto dto, string adminUserId);

  /// <summary>
  /// Get decision for a session
  /// </summary>
  Task<ApiResponse<ProctorDecisionDto>> GetDecisionAsync(int sessionId);

  /// <summary>
  /// Get sessions pending review
  /// </summary>
  Task<ApiResponse<PaginatedResponse<ProctorSessionListDto>>> GetPendingReviewAsync(ProctorSessionSearchDto searchDto);

  #endregion

  #region Dashboard & Monitoring

  /// <summary>
  /// Get proctor dashboard for an exam
  /// </summary>
  Task<ApiResponse<ProctorDashboardDto>> GetDashboardAsync(int examId);

  /// <summary>
  /// Get live monitoring data for active sessions
  /// </summary>
  Task<ApiResponse<List<LiveMonitoringDto>>> GetLiveMonitoringAsync(int examId);

  /// <summary>
  /// Check for missed heartbeats and flag sessions
  /// </summary>
  Task<int> CheckMissedHeartbeatsAsync(int thresholdSeconds);

  /// <summary>
  /// Get top triage recommendations for the proctor assistant.
  /// Returns active sessions ranked by risk with human-readable reasons.
  /// </summary>
  Task<ApiResponse<List<TriageRecommendationDto>>> GetTriageRecommendationsAsync(int top = 5, bool includeSample = true);

  #endregion

  #region Proctor Actions

  /// <summary>
  /// Toggle flag on a session
  /// </summary>
  Task<ApiResponse<bool>> FlagSessionAsync(int sessionId, bool flagged, string proctorUserId);

  /// <summary>
  /// Send warning to a candidate in an active session
  /// </summary>
  Task<ApiResponse<bool>> SendWarningAsync(int sessionId, string message, string proctorUserId);

  /// <summary>
  /// Terminate a session and force-end the candidate's attempt
  /// </summary>
  Task<ApiResponse<bool>> TerminateSessionAsync(int sessionId, string reason, string proctorUserId);

  /// <summary>
  /// Get candidate session status (poll endpoint for warnings/termination)
  /// </summary>
  Task<ApiResponse<CandidateSessionStatusDto>> GetCandidateSessionStatusAsync(int attemptId, string candidateId);

  #endregion

  #region Cleanup

  /// <summary>
  /// Clean up expired evidence files
  /// </summary>
  Task<int> CleanupExpiredEvidenceAsync();

  #endregion
}
