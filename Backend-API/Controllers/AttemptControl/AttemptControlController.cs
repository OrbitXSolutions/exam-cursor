using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.AttemptControl;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.AttemptControl;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.AttemptControl;

[ApiController]
[Route("api/attempt-control")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor}")]
public class AttemptControlController : ControllerBase
{
    private readonly IAttemptControlService _service;
    private readonly ICurrentUserService _currentUser;

    public AttemptControlController(IAttemptControlService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Get active attempts with enriched action flags.
    /// Returns InProgress and Paused attempts by default.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AttemptControlItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttempts([FromQuery] AttemptControlFilterDto filter)
    {
        var result = await _service.GetAttemptsAsync(filter);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Force end (force submit) an active attempt.
    /// </summary>
    [HttpPost("force-end")]
    [ProducesResponseType(typeof(ApiResponse<ForceEndResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForceEnd([FromBody] ForceEndAttemptDto dto)
    {
        var result = await _service.ForceEndAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Resume a paused attempt.
    /// </summary>
    [HttpPost("resume")]
    [ProducesResponseType(typeof(ApiResponse<ResumeResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Resume([FromBody] ResumeAttemptControlDto dto)
    {
        var result = await _service.ResumeAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Add extra time to an in-progress attempt.
    /// </summary>
    [HttpPost("add-time")]
    [ProducesResponseType(typeof(ApiResponse<AddTimeResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddTime([FromBody] AddTimeDto dto)
    {
        var result = await _service.AddTimeAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
