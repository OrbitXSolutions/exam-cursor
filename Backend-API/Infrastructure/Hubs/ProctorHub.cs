using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Infrastructure.Hubs;

/// <summary>
/// SignalR hub for WebRTC signaling between candidate (publisher) and proctor (viewer).
/// Candidate joins group "attempt_{attemptId}" and publishes offer/ICE.
/// Proctor joins the same group and sends answer/ICE back.
/// </summary>
[Authorize]
public class ProctorHub : Hub
{
    private readonly ILogger<ProctorHub> _logger;

    public ProctorHub(ILogger<ProctorHub> logger)
    {
        _logger = logger;
    }

    // ── Connection lifecycle ──────────────────────────────────────────

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier ?? "unknown";
        _logger.LogInformation("ProctorHub: {UserId} connected (connId={ConnId})", userId, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier ?? "unknown";
        _logger.LogInformation("ProctorHub: {UserId} disconnected (connId={ConnId})", userId, Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    // ── Group management ──────────────────────────────────────────────

    /// <summary>
    /// Candidate or proctor joins the signaling room for an attempt.
    /// </summary>
    public async Task JoinAttemptRoom(int attemptId, string role)
    {
        var group = $"attempt_{attemptId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, group);

        // Notify others in the room (e.g. proctor gets "candidate-joined")
        await Clients.OthersInGroup(group).SendAsync("PeerJoined", new
        {
            userId = Context.UserIdentifier,
            connectionId = Context.ConnectionId,
            role, // "candidate" or "proctor"
            attemptId
        });

        _logger.LogInformation("ProctorHub: {UserId} joined room {Group} as {Role}",
            Context.UserIdentifier, group, role);
    }

    /// <summary>
    /// Leave the signaling room.
    /// </summary>
    public async Task LeaveAttemptRoom(int attemptId)
    {
        var group = $"attempt_{attemptId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);

        await Clients.OthersInGroup(group).SendAsync("PeerLeft", new
        {
            userId = Context.UserIdentifier,
            connectionId = Context.ConnectionId,
            attemptId
        });

        _logger.LogInformation("ProctorHub: {UserId} left room {Group}",
            Context.UserIdentifier, group);
    }

    // ── WebRTC signaling ──────────────────────────────────────────────

    /// <summary>
    /// Candidate sends SDP offer to proctor(s) in the room.
    /// </summary>
    public async Task SendOffer(int attemptId, string sdp)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: SendOffer from {ConnId} for attempt {AttemptId} (sdp={SdpLen} chars)",
            Context.ConnectionId, attemptId, sdp?.Length ?? 0);
        await Clients.OthersInGroup(group).SendAsync("ReceiveOffer", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            sdp,
            attemptId
        });
        _logger.LogInformation("ProctorHub: ReceiveOffer sent to OthersInGroup({Group})", group);
    }

    /// <summary>
    /// Proctor sends SDP answer back to candidate.
    /// </summary>
    public async Task SendAnswer(int attemptId, string sdp, string targetConnectionId)
    {
        _logger.LogInformation("ProctorHub: SendAnswer from {ConnId} to {TargetConnId} for attempt {AttemptId} (sdp={SdpLen} chars)",
            Context.ConnectionId, targetConnectionId, attemptId, sdp?.Length ?? 0);
        await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            sdp,
            attemptId
        });
        _logger.LogInformation("ProctorHub: ReceiveAnswer sent to {TargetConnId}", targetConnectionId);
    }

    /// <summary>
    /// Exchange ICE candidates between peers.
    /// </summary>
    public async Task SendIceCandidate(int attemptId, string candidate, string? targetConnectionId = null)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: SendIceCandidate from {ConnId} for attempt {AttemptId} (target={Target})",
            Context.ConnectionId, attemptId, targetConnectionId ?? "broadcast");

        if (!string.IsNullOrEmpty(targetConnectionId))
        {
            // Send to specific peer
            await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", new
            {
                fromConnectionId = Context.ConnectionId,
                candidate,
                attemptId
            });
        }
        else
        {
            // Broadcast to all others in the group
            await Clients.OthersInGroup(group).SendAsync("ReceiveIceCandidate", new
            {
                fromConnectionId = Context.ConnectionId,
                candidate,
                attemptId
            });
        }
    }

    /// <summary>
    /// Request the candidate to resend their offer (for reconnection).
    /// </summary>
    public async Task RequestRenegotiation(int attemptId)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: RequestRenegotiation from {ConnId} for attempt {AttemptId}",
            Context.ConnectionId, attemptId);
        await Clients.OthersInGroup(group).SendAsync("RenegotiationRequested", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            attemptId
        });
    }

    /// <summary>
    /// Candidate notifies proctor that the exam has been submitted.
    /// </summary>
    public async Task NotifyExamSubmitted(int attemptId)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: NotifyExamSubmitted from {ConnId} for attempt {AttemptId}",
            Context.ConnectionId, attemptId);
        await Clients.OthersInGroup(group).SendAsync("ExamSubmitted", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            attemptId
        });
    }

    /// <summary>
    /// Proctor sends a warning message to the candidate instantly via SignalR.
    /// This supplements the existing HTTP polling — not a replacement.
    /// </summary>
    public async Task SendWarningToCandidate(int attemptId, string message)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: SendWarningToCandidate from {ConnId} for attempt {AttemptId}: {Message}",
            Context.ConnectionId, attemptId, message);
        await Clients.OthersInGroup(group).SendAsync("ReceiveWarning", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            message,
            attemptId
        });
    }

    /// <summary>
    /// Candidate notifies proctor about connection status changes.
    /// </summary>
    public async Task NotifyConnectionStatus(int attemptId, string status)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: NotifyConnectionStatus from {ConnId} for attempt {AttemptId}: status={Status}",
            Context.ConnectionId, attemptId, status);
        await Clients.OthersInGroup(group).SendAsync("ConnectionStatusChanged", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            status, // "connected", "reconnecting", "disconnected"
            attemptId
        });
    }

    /// <summary>
    /// Proctor sends a termination notification to the candidate instantly via SignalR.
    /// This supplements the existing HTTP polling — candidate doesn't need to wait for next poll.
    /// </summary>
    public async Task SendTerminationToCandidate(int attemptId, string reason)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: SendTerminationToCandidate from {ConnId} for attempt {AttemptId}: {Reason}",
            Context.ConnectionId, attemptId, reason);
        await Clients.OthersInGroup(group).SendAsync("SessionTerminated", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            reason,
            attemptId
        });
    }

    /// <summary>
    /// Proctor notifies the candidate that their exam time has been extended.
    /// Candidate's timer updates instantly without waiting for next server sync.
    /// </summary>
    public async Task NotifyTimeExtended(int attemptId, int extraMinutes, int newRemainingSeconds)
    {
        var group = $"attempt_{attemptId}";
        _logger.LogInformation("ProctorHub: NotifyTimeExtended for attempt {AttemptId}: +{Extra}min, remaining={Remaining}s",
            attemptId, extraMinutes, newRemainingSeconds);
        await Clients.Group(group).SendAsync("TimeExtended", new
        {
            attemptId,
            extraMinutes,
            newRemainingSeconds,
            message = $"Your exam time has been extended by {extraMinutes} minute(s)."
        });
    }
}
