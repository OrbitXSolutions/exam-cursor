using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamAssignment;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamAssignment;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.ExamAssignment;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor}")]
public class AssignmentsController : ControllerBase
{
    private readonly IExamAssignmentService _service;
    private readonly ICurrentUserService _currentUser;

    public AssignmentsController(IExamAssignmentService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Get candidate list with ExamAssigned and ExamStarted flags.
    /// Single unified endpoint — no extra calls needed.
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
