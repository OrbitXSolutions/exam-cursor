using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Smart_Core.Infrastructure.Hubs;

/// <summary>
/// SignalR hub for real-time in-app notifications.
/// Each authenticated user automatically joins group "user-{userId}".
/// The server pushes "ReceiveNotification" to that group when a new notification is created.
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            _logger.LogInformation("NotificationHub: user {UserId} connected (connId={ConnId})", userId, Context.ConnectionId);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
            _logger.LogInformation("NotificationHub: user {UserId} disconnected (connId={ConnId})", userId, Context.ConnectionId);
        }
        await base.OnDisconnectedAsync(exception);
    }
}
