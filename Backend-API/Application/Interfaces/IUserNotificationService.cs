using Smart_Core.Application.DTOs.Notification;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces;

public interface IUserNotificationService
{
    /// <summary>Create a notification for a specific user and push via SignalR.</summary>
    Task CreateAsync(
        string userId,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null);

    /// <summary>Create a notification for all users in the given roles (fire-and-forget safe).</summary>
    /// <param name="actorUserId">Optional ID of the user who triggered the event. Their email is appended to the message.</param>
    Task CreateForRolesAsync(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null);

    /// <summary>
    /// Create a notification for users in the given roles, scoped to the department of the related exam.
    /// SuperAdmin is always included. Other roles are filtered by matching DepartmentId.
    /// Falls back to unscoped CreateForRolesAsync if department cannot be resolved.
    /// </summary>
    Task CreateForRolesScopedAsync(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null);

    /// <summary>Paginated list for the current user. Pass isRead=null for all.</summary>
    Task<UserNotificationPagedResultDto> GetPagedAsync(string userId, int page, int pageSize, bool? isRead = null);

    /// <summary>Count of unread notifications for the current user.</summary>
    Task<int> GetUnreadCountAsync(string userId);

    /// <summary>Mark one notification as read (ownership check included).</summary>
    Task MarkAsReadAsync(string userId, int notificationId);

    /// <summary>Mark all unread notifications as read for the current user.</summary>
    Task MarkAllAsReadAsync(string userId);
}
