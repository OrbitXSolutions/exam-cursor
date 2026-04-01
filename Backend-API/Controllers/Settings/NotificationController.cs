using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Settings;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.Admin},{AppRoles.SuperDev}")]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;

    public NotificationController(
        INotificationService notificationService,
        ICurrentUserService currentUserService)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
    }

    // ── Settings ────────────────────────────────────────────────

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _notificationService.GetNotificationSettingsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] NotificationSettingsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _notificationService.UpdateNotificationSettingsAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Templates ───────────────────────────────────────────────

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var result = await _notificationService.GetTemplatesAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("templates/{eventType:int}")]
    public async Task<IActionResult> GetTemplate(int eventType)
    {
        var result = await _notificationService.GetTemplateByEventAsync(eventType);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("templates/{eventType:int}")]
    public async Task<IActionResult> UpdateTemplate(int eventType, [FromBody] UpdateNotificationTemplateDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _notificationService.UpdateTemplateAsync(eventType, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Logs ────────────────────────────────────────────────────

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs([FromQuery] NotificationLogFilterDto filter)
    {
        var result = await _notificationService.GetLogsAsync(filter);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("logs/{logId:int}/retry")]
    public async Task<IActionResult> RetryNotification(int logId)
    {
        var result = await _notificationService.RetryNotificationAsync(logId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("logs/{logId:int}/send-now")]
    public async Task<IActionResult> SendNow(int logId)
    {
        var result = await _notificationService.SendNowAsync(logId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Test ────────────────────────────────────────────────────

    [HttpPost("test-email")]
    public async Task<IActionResult> TestEmail([FromBody] TestEmailDto dto)
    {
        var result = await _notificationService.SendTestEmailAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("test-sms")]
    public async Task<IActionResult> TestSms([FromBody] TestSmsDto dto)
    {
        var result = await _notificationService.SendTestSmsAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Manual triggers ─────────────────────────────────────────

    [HttpPost("queue-exam-emails/{examId:int}")]
    public async Task<IActionResult> QueueExamEmails(int examId)
    {
        await _notificationService.QueueExamPublishedNotificationsAsync(examId);
        return Ok(new { success = true, message = "Notifications queued for exam." });
    }
}
