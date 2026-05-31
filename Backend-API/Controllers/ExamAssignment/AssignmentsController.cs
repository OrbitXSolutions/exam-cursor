using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamAssignment;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamAssignment;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Controllers.ExamAssignment;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Instructor}")]
public class AssignmentsController : ControllerBase
{
    private readonly IExamAssignmentService _service;
    private readonly ICurrentUserService _currentUser;
    private readonly INotificationDispatcher _notifications;

    public AssignmentsController(
        IExamAssignmentService service,
        ICurrentUserService currentUser,
        INotificationDispatcher notifications)
    {
        _service = service;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    /// <summary>
    /// Get candidate list with ExamAssigned and ExamStarted flags.
    /// Single unified endpoint â€” no extra calls needed.
    /// </summary>
    [HttpGet("candidates")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AssignmentCandidateDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCandidates([FromQuery] AssignmentCandidateFilterDto filter)
    {
        var result = await _service.GetCandidatesAsync(filter);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Assign exam to candidates (single, batch, or filtered).
    /// </summary>
    [HttpPost("assign")]
    [ProducesResponseType(typeof(ApiResponse<AssignmentResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Assign([FromBody] AssignExamDto dto)
    {
        var result = await _service.AssignAsync(dto, _currentUser.UserId!);
        if (result.Success && dto.CandidateIds is { Count: > 0 })
        {
            var skippedIds = result.Data?.SkippedDetails.Select(s => s.CandidateId).ToHashSet() ?? [];
            foreach (var candidateId in dto.CandidateIds.Where(id => !skippedIds.Contains(id)))
                _notifications.NotifyUser(
                    candidateId,
                    UserNotificationType.ExamAssigned,
                    "Exam Assigned", "تم تعيينك في اختبار",
                    "You have been assigned to a new exam.", "تم تعيينك في اختبار جديد.",
                    relatedExamId: dto.ExamId);
        }
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Unassign exam from candidates (only if not started).
    /// </summary>
    [HttpPost("unassign")]
    [ProducesResponseType(typeof(ApiResponse<AssignmentResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Unassign([FromBody] UnassignExamDto dto)
    {
        var result = await _service.UnassignAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
