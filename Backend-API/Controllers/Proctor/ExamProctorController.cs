using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor}")]
public class ExamProctorController : ControllerBase
{
    private readonly IExamProctorService _service;
    private readonly ICurrentUserService _currentUser;

    public ExamProctorController(IExamProctorService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Get all proctors (assigned and available) for a specific exam.
    /// Single call — no additional requests needed by the frontend.
    /// </summary>
    [HttpGet("{examId:int}")]
    public async Task<IActionResult> GetExamProctors(int examId)
    {
        var result = await _service.GetExamProctorsAsync(examId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Assign one or more proctors to an exam.
    /// </summary>
    [HttpPost("assign")]
    public async Task<IActionResult> Assign([FromBody] AssignProctorToExamDto dto)
    {
        var assignedBy = _currentUser.UserId ?? "system";
        var result = await _service.AssignAsync(dto, assignedBy);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Unassign one or more proctors from an exam.
    /// </summary>
    [HttpPost("unassign")]
    public async Task<IActionResult> Unassign([FromBody] UnassignProctorFromExamDto dto)
    {
        var result = await _service.UnassignAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
