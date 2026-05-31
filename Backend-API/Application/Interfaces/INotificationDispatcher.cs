using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces;

/// <summary>
/// Fire-and-forget notification dispatcher.
/// Calling methods returns immediately — notifications execute on a background thread
/// in an isolated scope. Any error is logged and silently discarded.
/// Registered as Singleton — safe to inject into any controller or service.
/// </summary>
public interface INotificationDispatcher
{
    /// <summary>Notify a single user in the background.</summary>
    void NotifyUser(
        string userId,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null);

    /// <summary>Notify all users in the given roles in the background.</summary>
    /// <param name="actorUserId">Optional ID of the user who triggered the event (e.g. candidate). Used to include their email in the message.</param>
    void NotifyRoles(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null);
}
