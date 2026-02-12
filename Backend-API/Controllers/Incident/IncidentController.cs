using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Incident;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Incident;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Incident;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IncidentController : ControllerBase
{
    private readonly IIncidentService _incidentService;
    private readonly ICurrentUserService _currentUserService;

    public IncidentController(
    IIncidentService incidentService,
        ICurrentUserService currentUserService)
    {
        _incidentService = incidentService;
        _currentUserService = currentUserService;
    }

    #region Case Management

    /// <summary>
    /// Create a new incident case
    /// </summary>
    [HttpPost("case")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> CreateCase([FromBody] CreateIncidentCaseDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.CreateCaseAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create case automatically from proctor session
    /// </summary>
    [HttpPost("case/from-proctor/{proctorSessionId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> CreateCaseFromProctor(int proctorSessionId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.CreateCaseFromProctorAsync(proctorSessionId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get incident case by ID
    /// </summary>
    [HttpGet("case/{caseId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetCase(int caseId)
    {
        var result = await _incidentService.GetCaseAsync(caseId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get incident case by attempt ID
    /// </summary>
    [HttpGet("case/by-attempt/{attemptId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetCaseByAttempt(int attemptId)
    {
        var result = await _incidentService.GetCaseByAttemptAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Update incident case
    /// </summary>
    [HttpPut("case")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> UpdateCase([FromBody] UpdateIncidentCaseDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.UpdateCaseAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all incident cases with filtering
    /// </summary>
    [HttpGet("cases")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetCases([FromQuery] IncidentCaseSearchDto searchDto)
    {
        var result = await _incidentService.GetCasesAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get incident cases for an exam
    /// </summary>
    [HttpGet("cases/exam/{examId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetExamCases(int examId, [FromQuery] IncidentCaseSearchDto searchDto)
    {
        var result = await _incidentService.GetExamCasesAsync(examId, searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get cases assigned to current reviewer
    /// </summary>
    [HttpGet("cases/my-assigned")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetMyAssignedCases([FromQuery] IncidentCaseSearchDto searchDto)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.GetAssignedCasesAsync(userId, searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Assignment & Status

    /// <summary>
    /// Assign case to a reviewer
    /// </summary>
    [HttpPost("case/assign")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> AssignCase([FromBody] AssignCaseDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.AssignCaseAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reassign case to a different reviewer
    /// </summary>
    [HttpPost("case/reassign")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> ReassignCase([FromBody] AssignCaseDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.ReassignCaseAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Change case status
    /// </summary>
    [HttpPost("case/status")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> ChangeStatus([FromBody] ChangeStatusDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.ChangeStatusAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Close a resolved case
    /// </summary>
    [HttpPost("case/{caseId}/close")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> CloseCase(int caseId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.CloseCaseAsync(caseId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Reopen a case
    /// </summary>
    [HttpPost("case/{caseId}/reopen")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> ReopenCase(int caseId, [FromQuery] string reason)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.ReopenCaseAsync(caseId, reason, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Evidence

    /// <summary>
    /// Link evidence to a case
    /// </summary>
    [HttpPost("evidence/link")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> LinkEvidence([FromBody] LinkEvidenceDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.LinkEvidenceAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get evidence for a case
    /// </summary>
    [HttpGet("case/{caseId}/evidence")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetCaseEvidence(int caseId)
    {
        var result = await _incidentService.GetCaseEvidenceAsync(caseId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove evidence link
    /// </summary>
    [HttpDelete("evidence/{linkId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> RemoveEvidenceLink(int linkId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.RemoveEvidenceLinkAsync(linkId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Decisions

    /// <summary>
    /// Record a decision on a case
    /// </summary>
    [HttpPost("decision")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> RecordDecision([FromBody] RecordDecisionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.RecordDecisionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get decision history for a case
    /// </summary>
    [HttpGet("case/{caseId}/decisions")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetDecisionHistory(int caseId)
    {
        var result = await _incidentService.GetDecisionHistoryAsync(caseId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get the latest decision for a case
    /// </summary>
    [HttpGet("case/{caseId}/decision/latest")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetLatestDecision(int caseId)
    {
        var result = await _incidentService.GetLatestDecisionAsync(caseId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Comments

    /// <summary>
    /// Add a comment to a case
    /// </summary>
    [HttpPost("comment")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> AddComment([FromBody] AddCommentDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.AddCommentAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Edit a comment
    /// </summary>
    [HttpPut("comment")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> EditComment([FromBody] EditCommentDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.EditCommentAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Delete a comment
    /// </summary>
    [HttpDelete("comment/{commentId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> DeleteComment(int commentId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.DeleteCommentAsync(commentId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get comments for a case
    /// </summary>
    [HttpGet("case/{caseId}/comments")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetComments(int caseId)
    {
        var result = await _incidentService.GetCommentsAsync(caseId, true);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Timeline

    /// <summary>
    /// Get timeline for a case
    /// </summary>
    [HttpGet("case/{caseId}/timeline")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetTimeline(int caseId)
    {
        var result = await _incidentService.GetTimelineAsync(caseId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Appeals

    /// <summary>
    /// Submit an appeal (candidate)
    /// </summary>
    [HttpPost("appeal")]
    public async Task<IActionResult> SubmitAppeal([FromBody] SubmitAppealDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.SubmitAppealAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get appeal by ID
    /// </summary>
    [HttpGet("appeal/{appealId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetAppeal(int appealId)
    {
        var result = await _incidentService.GetAppealAsync(appealId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get appeals for a case
    /// </summary>
    [HttpGet("case/{caseId}/appeals")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetCaseAppeals(int caseId)
    {
        var result = await _incidentService.GetCaseAppealsAsync(caseId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all appeals with filtering
    /// </summary>
    [HttpGet("appeals")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetAppeals([FromQuery] AppealSearchDto searchDto)
    {
        var result = await _incidentService.GetAppealsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Review an appeal (admin/reviewer)
    /// </summary>
    [HttpPost("appeal/review")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> ReviewAppeal([FromBody] ReviewAppealDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _incidentService.ReviewAppealAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Check if candidate can submit appeal
    /// </summary>
    [HttpGet("case/{caseId}/can-appeal")]
    public async Task<IActionResult> CanSubmitAppeal(int caseId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.CanSubmitAppealAsync(caseId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get candidate's incident status for an attempt
    /// </summary>
    [HttpGet("my-incident/attempt/{attemptId}")]
    public async Task<IActionResult> GetMyIncidentStatus(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.GetCandidateIncidentStatusAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all incidents for current candidate
    /// </summary>
    [HttpGet("my-incidents")]
    public async Task<IActionResult> GetMyIncidents()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.GetCandidateIncidentsAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get my appeal for a case
    /// </summary>
    [HttpGet("case/{caseId}/my-appeal")]
    public async Task<IActionResult> GetMyAppeal(int caseId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }
        var result = await _incidentService.GetCandidateAppealAsync(caseId, candidateId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get incident dashboard for an exam
    /// </summary>
    [HttpGet("dashboard/exam/{examId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
    public async Task<IActionResult> GetDashboard(int examId)
    {
        var result = await _incidentService.GetDashboardAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get global incident dashboard
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> GetGlobalDashboard()
    {
        var result = await _incidentService.GetGlobalDashboardAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
