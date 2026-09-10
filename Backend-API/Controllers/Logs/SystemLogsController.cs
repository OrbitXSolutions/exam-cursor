using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Logs;
using Smart_Core.Application.Interfaces.Logs;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Controllers.Logs;

/// <summary>
/// Metadata-only log reads restricted to SuperAdmin, matching the dashboard's /logs access rule.
/// Category names describe log subjects; Candidate and Proctor roles do not gain log-reading access.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.SuperAdmin)]
public sealed class SystemLogsController : ControllerBase
{
    private readonly ISystemLogService _service;

    public SystemLogsController(ISystemLogService service)
    {
        _service = service;
    }

    [HttpGet("candidate")]
    public Task<IActionResult> Candidate([FromQuery] SystemLogFilterDto filter, CancellationToken cancellationToken) =>
        GetCategory(LogCategory.Candidate, filter, cancellationToken);

    [HttpGet("proctor")]
    public Task<IActionResult> Proctor([FromQuery] SystemLogFilterDto filter, CancellationToken cancellationToken) =>
        GetCategory(LogCategory.Proctor, filter, cancellationToken);

    [HttpGet("user")]
    public Task<IActionResult> UserLogs([FromQuery] SystemLogFilterDto filter, CancellationToken cancellationToken) =>
        GetCategory(LogCategory.User, filter, cancellationToken);

    [HttpGet("developer")]
    public Task<IActionResult> Developer([FromQuery] SystemLogFilterDto filter, CancellationToken cancellationToken) =>
        GetCategory(LogCategory.Developer, filter, cancellationToken);

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Detail(long id, CancellationToken cancellationToken)
    {
        var result = await _service.GetDetailAsync(id, cancellationToken);
        return result == null
            ? NotFound(ApiResponse<object>.FailureResponse("Log not found."))
            : Ok(ApiResponse<SystemLogDetailDto>.SuccessResponse(result));
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken) =>
        Ok(ApiResponse<SystemLogStatsDto>.SuccessResponse(await _service.GetStatsAsync(cancellationToken)));

    // Compatibility views for the existing UI, not readers for retired Serilog SQL-sink tables.
    [HttpGet("app-logs")]
    public async Task<IActionResult> AppLogs([FromQuery] AppLogFilterDto filter, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PaginatedResponse<AppLogEntryDto>>.SuccessResponse(
            await _service.GetAppLogsAsync(filter, cancellationToken)));

    [HttpGet("app-errors")]
    public async Task<IActionResult> AppErrors([FromQuery] AppLogFilterDto filter, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PaginatedResponse<AppErrorEntryDto>>.SuccessResponse(
            await _service.GetAppErrorsAsync(filter, cancellationToken)));

    private async Task<IActionResult> GetCategory(LogCategory category, SystemLogFilterDto filter,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<PaginatedResponse<SystemLogDto>>.SuccessResponse(
            await _service.GetLogsAsync(category, filter, cancellationToken)));
}
