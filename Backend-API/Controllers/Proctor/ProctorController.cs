using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProctorController : ControllerBase
{
    private readonly IProctorService _proctorService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAiProctorService _aiProctorService;

    public ProctorController(
  IProctorService proctorService,
  ICurrentUserService currentUserService,
  IAiProctorService aiProctorService)
    {
        _proctorService = proctorService;
        _currentUserService = currentUserService;
        _aiProctorService = aiProctorService;
    }

    #region Session Management

    /// <summary>
    /// Create a new proctor session for an attempt
    /// </summary>
    [HttpPost("session")]
    public async Task<IActionResult> CreateSession([FromBody] CreateProctorSessionDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var result = await _proctorService.CreateSessionAsync(dto, candidateId, ipAddress);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get proctor session by ID
    /// </summary>
    [HttpGet("session/{sessionId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetSession(int sessionId)
    {
        var result = await _proctorService.GetSessionAsync(sessionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get proctor session by attempt and mode
    /// </summary>
    [HttpGet("session/attempt/{attemptId}")]
    public async Task<IActionResult> GetSessionByAttempt(int attemptId, [FromQuery] ProctorMode mode = ProctorMode.Soft)
    {
        var result = await _proctorService.GetSessionByAttemptAsync(attemptId, mode);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// End a proctor session
    /// </summary>
    [HttpPost("session/{sessionId}/end")]
    public async Task<IActionResult> EndSession(int sessionId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.EndSessionAsync(sessionId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel a proctor session (admin only)
    /// </summary>
    [HttpPost("session/{sessionId}/cancel")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> CancelSession(int sessionId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.CancelSessionAsync(sessionId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Toggle flag on a proctor session
    /// </summary>
    [HttpPost("session/{sessionId}/flag")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> FlagSession(int sessionId, [FromBody] FlagSessionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.FlagSessionAsync(sessionId, dto.Flagged, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Send a warning to a candidate during an active session
    /// </summary>
    [HttpPost("session/{sessionId}/warning")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> SendWarning(int sessionId, [FromBody] SendWarningDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.SendWarningAsync(sessionId, dto.Message, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Terminate a session and force-end the candidate's attempt
    /// </summary>
    [HttpPost("session/{sessionId}/terminate")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> TerminateSession(int sessionId, [FromBody] TerminateSessionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.TerminateSessionAsync(sessionId, dto.Reason, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Candidate polls this endpoint for pending warnings or termination
    /// </summary>
    [HttpGet("candidate-status/{attemptId}")]
    public async Task<IActionResult> GetCandidateSessionStatus(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        var result = await _proctorService.GetCandidateSessionStatusAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all proctor sessions with filtering
    /// </summary>
    [HttpGet("sessions")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetSessions([FromQuery] ProctorSessionSearchDto searchDto)
    {
        var result = await _proctorService.GetSessionsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get proctor sessions for an exam
    /// </summary>
    [HttpGet("sessions/exam/{examId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetExamSessions(int examId, [FromQuery] ProctorSessionSearchDto searchDto)
    {
        var result = await _proctorService.GetExamSessionsAsync(examId, searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Events

    /// <summary>
    /// Log a single proctor event
    /// </summary>
    [HttpPost("event")]
    public async Task<IActionResult> LogEvent([FromBody] LogProctorEventDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _proctorService.LogEventAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk log proctor events
    /// </summary>
    [HttpPost("events/bulk")]
    public async Task<IActionResult> BulkLogEvents([FromBody] BulkLogProctorEventsDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _proctorService.BulkLogEventsAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Process heartbeat
    /// </summary>
    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _proctorService.ProcessHeartbeatAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get events for a session
    /// </summary>
    [HttpGet("session/{sessionId}/events")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetSessionEvents(int sessionId)
    {
        var result = await _proctorService.GetSessionEventsAsync(sessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get events by type for a session
    /// </summary>
    [HttpGet("session/{sessionId}/events/{eventType}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetEventsByType(int sessionId, ProctorEventType eventType)
    {
        var result = await _proctorService.GetEventsByTypeAsync(sessionId, eventType);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Risk Management

    /// <summary>
    /// Calculate risk score for a session
    /// </summary>
    [HttpPost("session/{sessionId}/calculate-risk")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> CalculateRiskScore(int sessionId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.CalculateRiskScoreAsync(sessionId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all risk rules
    /// </summary>
    [HttpGet("rules")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> GetRiskRules([FromQuery] bool activeOnly = false)
    {
        var result = await _proctorService.GetRiskRulesAsync(activeOnly);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a risk rule
    /// </summary>
    [HttpPost("rules")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> CreateRiskRule([FromBody] SaveProctorRiskRuleDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.CreateRiskRuleAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update a risk rule
    /// </summary>
    [HttpPut("rules/{ruleId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> UpdateRiskRule(int ruleId, [FromBody] SaveProctorRiskRuleDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.UpdateRiskRuleAsync(ruleId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a risk rule
    /// </summary>
    [HttpDelete("rules/{ruleId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> DeleteRiskRule(int ruleId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.DeleteRiskRuleAsync(ruleId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Toggle risk rule active status
    /// </summary>
    [HttpPost("rules/{ruleId}/toggle")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> ToggleRiskRule(int ruleId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.ToggleRiskRuleAsync(ruleId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Evidence

    /// <summary>
    /// Upload webcam snapshot directly (multipart/form-data, file field: "file")
    /// </summary>
    [HttpPost("snapshot/{attemptId}")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadSnapshot(int attemptId, IFormFile file)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();
        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        var result = await _proctorService.UploadSnapshotAsync(attemptId, file, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Request upload URL for evidence
    /// </summary>
    [HttpPost("evidence/request-upload")]
    public async Task<IActionResult> RequestEvidenceUpload([FromBody] UploadEvidenceDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _proctorService.RequestEvidenceUploadAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Confirm evidence upload completed
    /// </summary>
    [HttpPost("evidence/{evidenceId}/confirm")]
    public async Task<IActionResult> ConfirmEvidenceUpload(
        int evidenceId,
        [FromQuery] long fileSize,
  [FromQuery] string? checksum = null)
    {
        var result = await _proctorService.ConfirmEvidenceUploadAsync(evidenceId, fileSize, checksum);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get evidence for a session
    /// </summary>
    [HttpGet("session/{sessionId}/evidence")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetSessionEvidence(int sessionId)
    {
        var result = await _proctorService.GetSessionEvidenceAsync(sessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get secure download URL for evidence
    /// </summary>
    [HttpGet("evidence/{evidenceId}/download-url")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetEvidenceDownloadUrl(int evidenceId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.GetEvidenceDownloadUrlAsync(evidenceId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Decisions

    /// <summary>
    /// Make a decision on a proctor session
    /// </summary>
    [HttpPost("decision")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> MakeDecision([FromBody] MakeDecisionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.MakeDecisionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Override a previous decision
    /// </summary>
    [HttpPost("decision/override")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> OverrideDecision([FromBody] OverrideDecisionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _proctorService.OverrideDecisionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get decision for a session
    /// </summary>
    [HttpGet("session/{sessionId}/decision")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetDecision(int sessionId)
    {
        var result = await _proctorService.GetDecisionAsync(sessionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get sessions pending review
    /// </summary>
    [HttpGet("pending-review")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetPendingReview([FromQuery] ProctorSessionSearchDto searchDto)
    {
        var result = await _proctorService.GetPendingReviewAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Dashboard & Monitoring

    /// <summary>
    /// Get proctor dashboard for an exam
    /// </summary>
    [HttpGet("dashboard/exam/{examId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetDashboard(int examId)
    {
        var result = await _proctorService.GetDashboardAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get live monitoring data for active sessions
    /// </summary>
    [HttpGet("live/exam/{examId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetLiveMonitoring(int examId)
    {
        var result = await _proctorService.GetLiveMonitoringAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get top triage recommendations for the proctor AI assistant.
    /// Returns active sessions ranked by risk with human-readable reasons.
    /// </summary>
    [HttpGet("triage")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetTriageRecommendations([FromQuery] int top = 5, [FromQuery] bool includeSample = true)
    {
        var result = await _proctorService.GetTriageRecommendationsAsync(top, includeSample);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region AI Proctor Analysis

    /// <summary>
    /// Generate an AI-powered risk analysis for a proctoring session.
    /// Uses GPT-4o to analyze events, violations, and patterns.
    /// Advisory only — the proctor always has final authority.
    /// </summary>
    [HttpGet("session/{sessionId}/ai-analysis")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetAiRiskAnalysis(int sessionId)
    {
        var result = await _aiProctorService.GetAiRiskAnalysisAsync(sessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
