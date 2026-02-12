using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/proctor/authentication")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer")]
public class IdentityVerificationController : ControllerBase
{
    private readonly IIdentityVerificationService _service;
    private readonly ICurrentUserService _currentUserService;

    public IdentityVerificationController(
        IIdentityVerificationService service,
        ICurrentUserService currentUserService)
    {
        _service = service;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Get identity verifications with filtering and pagination.
    /// </summary>
    [HttpGet("verifications")]
    public async Task<IActionResult> GetVerifications([FromQuery] IdentityVerificationSearchDto searchDto)
    {
        var result = await _service.GetVerificationsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get full detail of a single identity verification.
    /// </summary>
    [HttpGet("verifications/{id}")]
    public async Task<IActionResult> GetVerificationDetail(int id)
    {
        var result = await _service.GetVerificationDetailAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Apply a single action (Approve / Reject / Flag) to one verification.
    /// </summary>
    [HttpPost("verifications/{id}/action")]
    public async Task<IActionResult> ApplyAction(int id, [FromBody] IdentityVerificationActionDto dto)
    {
        dto.Id = id;
        var userId = _currentUserService.UserId ?? "system";
        var result = await _service.ApplyActionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Apply a bulk action to multiple verifications.
    /// Transaction-safe with audit logging.
    /// </summary>
    [HttpPost("bulk-action")]
    public async Task<IActionResult> BulkAction([FromBody] IdentityVerificationBulkActionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _service.ApplyBulkActionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
