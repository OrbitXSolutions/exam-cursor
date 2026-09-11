using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Constants;
using Smart_Core.Infrastructure.Data;

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
    private readonly ApplicationDbContext _db;
    private const string CandidateRole = "candidate";
    private const string ProctorRole = "proctor";

    public ProctorHub(ILogger<ProctorHub> logger, ApplicationDbContext db)
    {
        _logger = logger;
        _db = db;
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
    /// Authorization: caller must be the candidate who owns the attempt,
    /// or staff with department/assignment access (or SuperAdmin).
    /// </summary>
    public async Task JoinAttemptRoom(int attemptId, string role)
    {
        var group = Room(attemptId);
        role = await JoinRoomAsync(attemptId, false, role);

        // Notify others in the room (e.g. proctor gets "candidate-joined")
        await Clients.Group(RoleGroup(group, OppositeRole(role))).SendAsync("PeerJoined", new
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
        var group = Room(attemptId);
        var role = await LeaveRoomAsync(attemptId, false);
        if (role == null) return;

        await Clients.Group(RoleGroup(group, OppositeRole(role))).SendAsync("PeerLeft", new
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
        await RequireJoinedRoleAsync(attemptId, false, CandidateRole);
        var group = RoleGroup(Room(attemptId), ProctorRole);
        _logger.LogInformation("ProctorHub: SendOffer from {ConnId} for attempt {AttemptId} (sdp={SdpLen} chars)",
            Context.ConnectionId, attemptId, sdp?.Length ?? 0);
        await Clients.Group(group).SendAsync("ReceiveOffer", new
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
        await RequireJoinedRoleAsync(attemptId, false, ProctorRole);
        _logger.LogInformation("ProctorHub: SendAnswer from {ConnId} to {TargetConnId} for attempt {AttemptId} (sdp={SdpLen} chars)",
            Context.ConnectionId, targetConnectionId, attemptId, sdp?.Length ?? 0);
        await Target(attemptId, false, CandidateRole, targetConnectionId).SendAsync("ReceiveAnswer", new
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
        var role = await RequireJoinedRoleAsync(attemptId, false);
        var group = RoleGroup(Room(attemptId), OppositeRole(role));
        _logger.LogInformation("ProctorHub: SendIceCandidate from {ConnId} for attempt {AttemptId} (target={Target})",
            Context.ConnectionId, attemptId, targetConnectionId ?? "broadcast");

        if (!string.IsNullOrEmpty(targetConnectionId))
        {
            // Send to specific peer
            await Target(attemptId, false, OppositeRole(role), targetConnectionId).SendAsync("ReceiveIceCandidate", new
            {
                fromConnectionId = Context.ConnectionId,
                candidate,
                attemptId
            });
        }
        else
        {
            // Broadcast to all others in the group
            await Clients.Group(group).SendAsync("ReceiveIceCandidate", new
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
        await RequireJoinedRoleAsync(attemptId, false, ProctorRole);
        var group = RoleGroup(Room(attemptId), CandidateRole);
        _logger.LogInformation("ProctorHub: RequestRenegotiation from {ConnId} for attempt {AttemptId}",
            Context.ConnectionId, attemptId);
        await Clients.Group(group).SendAsync("RenegotiationRequested", new
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
        await RequireJoinedRoleAsync(attemptId, false, CandidateRole);
        var group = RoleGroup(Room(attemptId), ProctorRole);
        _logger.LogInformation("ProctorHub: NotifyExamSubmitted from {ConnId} for attempt {AttemptId}",
            Context.ConnectionId, attemptId);
        await Clients.Group(group).SendAsync("ExamSubmitted", new
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
        await RequireJoinedRoleAsync(attemptId, false, ProctorRole);
        var group = RoleGroup(Room(attemptId), CandidateRole);
        _logger.LogInformation("ProctorHub: SendWarningToCandidate from {ConnId} for attempt {AttemptId}: {Message}",
            Context.ConnectionId, attemptId, message);
        await Clients.Group(group).SendAsync("ReceiveWarning", new
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
        await RequireJoinedRoleAsync(attemptId, false, CandidateRole);
        var group = RoleGroup(Room(attemptId), ProctorRole);
        _logger.LogInformation("ProctorHub: NotifyConnectionStatus from {ConnId} for attempt {AttemptId}: status={Status}",
            Context.ConnectionId, attemptId, status);
        await Clients.Group(group).SendAsync("ConnectionStatusChanged", new
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
        await RequireJoinedRoleAsync(attemptId, false, ProctorRole);
        var group = RoleGroup(Room(attemptId), CandidateRole);
        _logger.LogInformation("ProctorHub: SendTerminationToCandidate from {ConnId} for attempt {AttemptId}: {Reason}",
            Context.ConnectionId, attemptId, reason);
        await Clients.Group(group).SendAsync("SessionTerminated", new
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
        await RequireJoinedRoleAsync(attemptId, false, ProctorRole);
        var group = Room(attemptId);
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

    // ── Screen share signaling ────────────────────────────────────────

    /// <summary>
    /// Candidate or proctor joins the screen share signaling room.
    /// Uses a separate group from webcam to avoid signal collision.
    /// Authorization: same rules as JoinAttemptRoom.
    /// </summary>
    public async Task JoinScreenRoom(int attemptId, string role)
    {
        var group = Room(attemptId, true);
        role = await JoinRoomAsync(attemptId, true, role);

        await Clients.Group(RoleGroup(group, OppositeRole(role))).SendAsync("ScreenPeerJoined", new
        {
            userId = Context.UserIdentifier,
            connectionId = Context.ConnectionId,
            role,
            attemptId
        });

        _logger.LogInformation("ProctorHub: {UserId} joined screen room {Group} as {Role}",
            Context.UserIdentifier, group, role);
    }

    /// <summary>
    /// Leave the screen share signaling room.
    /// </summary>
    public async Task LeaveScreenRoom(int attemptId)
    {
        var group = Room(attemptId, true);
        var role = await LeaveRoomAsync(attemptId, true);
        if (role == null) return;

        await Clients.Group(RoleGroup(group, OppositeRole(role))).SendAsync("ScreenPeerLeft", new
        {
            userId = Context.UserIdentifier,
            connectionId = Context.ConnectionId,
            attemptId
        });

        _logger.LogInformation("ProctorHub: {UserId} left screen room {Group}",
            Context.UserIdentifier, group);
    }

    /// <summary>
    /// Candidate sends screen share SDP offer to proctor(s).
    /// </summary>
    public async Task SendScreenOffer(int attemptId, string sdp)
    {
        await RequireJoinedRoleAsync(attemptId, true, CandidateRole);
        var group = RoleGroup(Room(attemptId, true), ProctorRole);
        _logger.LogInformation("ProctorHub: SendScreenOffer from {ConnId} for attempt {AttemptId}",
            Context.ConnectionId, attemptId);
        await Clients.Group(group).SendAsync("ReceiveScreenOffer", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            sdp,
            attemptId
        });
    }

    /// <summary>
    /// Proctor sends screen share SDP answer back to candidate.
    /// </summary>
    public async Task SendScreenAnswer(int attemptId, string sdp, string targetConnectionId)
    {
        await RequireJoinedRoleAsync(attemptId, true, ProctorRole);
        _logger.LogInformation("ProctorHub: SendScreenAnswer from {ConnId} to {TargetConnId} for attempt {AttemptId}",
            Context.ConnectionId, targetConnectionId, attemptId);
        await Target(attemptId, true, CandidateRole, targetConnectionId).SendAsync("ReceiveScreenAnswer", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            sdp,
            attemptId
        });
    }

    /// <summary>
    /// Exchange screen share ICE candidates between peers.
    /// </summary>
    public async Task SendScreenIceCandidate(int attemptId, string candidate, string? targetConnectionId = null)
    {
        var role = await RequireJoinedRoleAsync(attemptId, true);
        var group = RoleGroup(Room(attemptId, true), OppositeRole(role));
        _logger.LogInformation("ProctorHub: SendScreenIceCandidate from {ConnId} for attempt {AttemptId} (target={Target})",
            Context.ConnectionId, attemptId, targetConnectionId ?? "broadcast");

        if (!string.IsNullOrEmpty(targetConnectionId))
        {
            await Target(attemptId, true, OppositeRole(role), targetConnectionId).SendAsync("ReceiveScreenIceCandidate", new
            {
                fromConnectionId = Context.ConnectionId,
                candidate,
                attemptId
            });
        }
        else
        {
            await Clients.Group(group).SendAsync("ReceiveScreenIceCandidate", new
            {
                fromConnectionId = Context.ConnectionId,
                candidate,
                attemptId
            });
        }
    }

    /// <summary>
    /// Candidate reports screen share status changes to proctor.
    /// Status: "started", "stopped", "lost", "resumed", "denied"
    /// </summary>
    public async Task NotifyScreenShareStatus(int attemptId, string status)
    {
        // Screen publishers also join the main room; status is consumed by webcam viewers.
        await RequireJoinedRoleAsync(attemptId, false, CandidateRole);
        var group = RoleGroup(Room(attemptId), ProctorRole);
        _logger.LogInformation("ProctorHub: NotifyScreenShareStatus from {ConnId} for attempt {AttemptId}: status={Status}",
            Context.ConnectionId, attemptId, status);
        await Clients.Group(group).SendAsync("ScreenShareStatusChanged", new
        {
            fromConnectionId = Context.ConnectionId,
            fromUserId = Context.UserIdentifier,
            status,
            attemptId
        });
    }

    // ── Authorization helpers ─────────────────────────────────────────

    private static string Room(int attemptId, bool screen = false)
        => screen ? $"attempt_{attemptId}_screen" : $"attempt_{attemptId}";

    private static string RoleGroup(string room, string role) => $"{room}:role:{role}";
    private static string PeerGroup(string room, string role, string connectionId)
        => $"{RoleGroup(room, role)}:connection:{connectionId}";
    private static string OppositeRole(string role) => role == CandidateRole ? ProctorRole : CandidateRole;

    private IClientProxy Target(int attemptId, bool screen, string role, string connectionId)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            throw new HubException("A target connection is required.");
        // Membership, including remote-node removal on leave/disconnect, is owned by SignalR.
        // Never send to an arbitrary connection or rely on a process-local recipient registry.
        return Clients.Group(PeerGroup(Room(attemptId, screen), role, connectionId));
    }

    private async Task<string> JoinRoomAsync(int attemptId, bool screen, string requestedRole)
    {
        var role = await CurrentRoleAsync(attemptId);
        if (role == null || role != requestedRole)
            throw new HubException("Not authorized for this attempt or role.");

        var room = Room(attemptId, screen);
        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, room);
            await Groups.AddToGroupAsync(Context.ConnectionId, RoleGroup(room, role));
            await Groups.AddToGroupAsync(Context.ConnectionId, PeerGroup(room, role, Context.ConnectionId));
        }
        catch
        {
            // A partial backplane failure must not leave a receive-only unauthorized session.
            Context.Abort();
            throw;
        }
        // Caller-only state survives hub instances, not connections. Targets use distributed groups.
        Context.Items[room] = role;
        return role;
    }

    private async Task<string?> LeaveRoomAsync(int attemptId, bool screen)
    {
        var currentRole = await CurrentRoleAsync(attemptId);
        var role = await RemoveRoomMembershipAsync(Room(attemptId, screen));
        if (role == null)
            throw new HubException("Join the attempt room first.");
        return currentRole == role ? role : null;
    }

    private async Task<string?> RemoveRoomMembershipAsync(string room)
    {
        if (!Context.Items.TryGetValue(room, out var value) || value is not string role)
            return null;

        Context.Items.Remove(room);
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, PeerGroup(room, role, Context.ConnectionId));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoleGroup(room, role));
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, room);
        }
        catch
        {
            Context.Abort();
            throw;
        }
        return role;
    }

    private async Task<string> RequireJoinedRoleAsync(int attemptId, bool screen, string? requiredRole = null)
    {
        // Check before the membership/operation-role guards so even a wrong-channel or
        // wrong-role invocation evicts a previously joined caller whose entitlement was revoked.
        var currentRole = await CurrentRoleAsync(attemptId);
        if (!Context.Items.TryGetValue(Room(attemptId, screen), out var value) ||
            value is not string role || (requiredRole != null && role != requiredRole) ||
            currentRole != role)
            throw new HubException("Not authorized for this attempt or role.");
        return role;
    }

    private async Task<string?> CurrentRoleAsync(int attemptId)
    {
        var role = await AuthorizedRoleAsync(attemptId);
        var rooms = new[] { Room(attemptId), Room(attemptId, true) };
        if (role == null || rooms.Any(room =>
                Context.Items.TryGetValue(room, out var previousRole) && !Equals(previousRole, role)))
        {
            foreach (var room in rooms)
                await RemoveRoomMembershipAsync(room);
            return null;
        }
        return role;
    }

    private async Task<string?> AuthorizedRoleAsync(int attemptId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId) || Context.User?.Identity?.IsAuthenticated != true)
            return null;

        var attempt = await _db.Attempts
            .Where(a => a.Id == attemptId && !a.IsDeleted && !a.Exam.IsDeleted)
            .Select(a => new { a.CandidateId, a.ExamId, a.Exam.DepartmentId })
            .FirstOrDefaultAsync();
        if (attempt == null)
            return null;

        // Do not use CanAccessAttemptForUserAsync: an exam-assigned sibling candidate
        // may access the exam, but must never access this candidate's media.
        if (attempt.CandidateId == userId)
            return CandidateRole;
        if (Context.User.IsInRole(AppRoles.SuperAdmin))
            return ProctorRole;
        if (!Context.User.IsInRole(AppRoles.Proctor) && !Context.User.IsInRole(AppRoles.Admin))
            return null;

        // Match ResourceAuthorizationService's department OR explicit-proctor entitlement.
        var user = await _db.Users.Where(u => u.Id == userId && !u.IsDeleted)
            .Select(u => new { u.DepartmentId }).FirstOrDefaultAsync();
        if (user == null)
            return null;
        return (user.DepartmentId.HasValue && user.DepartmentId == attempt.DepartmentId) ||
            await _db.ExamProctors.AnyAsync(ep =>
                ep.ExamId == attempt.ExamId && ep.ProctorId == userId && !ep.IsDeleted)
            ? ProctorRole : null;
    }
}
