using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.Interfaces;

namespace Smart_Core.Controllers;

[ApiController]
[Route("api/user-notifications")]
[Authorize]
public class UserNotificationsController : ControllerBase
{
    private readonly IUserNotificationService _service;
    private readonly ICurrentUserService _currentUser;

    public UserNotificationsController(
        IUserNotificationService service,
        ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>Get paginated notifications for the current user.</summary>
    [HttpGet]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null)
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(page, 1);

        var result = await _service.GetPagedAsync(userId, page, pageSize, isRead);
        return Ok(result);
    }

    /// <summary>Get unread count for the current user. Used by bell badge.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var count = await _service.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    /// <summary>Mark a single notification as read.</summary>
    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _service.MarkAsReadAsync(userId, id);
        return NoContent();
    }

    /// <summary>Mark all notifications as read.</summary>
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = _currentUser.UserId;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        await _service.MarkAllAsReadAsync(userId);
        return NoContent();
    }
}
