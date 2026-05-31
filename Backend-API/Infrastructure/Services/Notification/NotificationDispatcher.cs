using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Infrastructure.Services.Notification;

/// <summary>
/// Singleton dispatcher. Wraps IUserNotificationService calls inside a dedicated
/// DI scope running on a background thread. The caller returns immediately.
/// All exceptions are caught and logged — never propagated to the caller.
/// </summary>
public class NotificationDispatcher : INotificationDispatcher
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(IServiceScopeFactory scopeFactory, ILogger<NotificationDispatcher> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    // ── Public fire-and-forget API ────────────────────────────────────

    public void NotifyUser(
        string userId,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null)
    {
        Fire(async scope =>
        {
            var svc = scope.ServiceProvider.GetRequiredService<IUserNotificationService>();
            await svc.CreateAsync(userId, type, titleEn, titleAr, messageEn, messageAr, relatedExamId, relatedAttemptId);
        });
    }

    public void NotifyRoles(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null)
    {
        Fire(async scope =>
        {
            var svc = scope.ServiceProvider.GetRequiredService<IUserNotificationService>();
            await svc.CreateForRolesAsync(roles, type, titleEn, titleAr, messageEn, messageAr, relatedExamId, relatedAttemptId, actorUserId);
        });
    }

    public void NotifyRolesScoped(
        string[] roles,
        UserNotificationType type,
        string titleEn, string titleAr,
        string messageEn, string messageAr,
        int? relatedExamId = null,
        int? relatedAttemptId = null,
        string? actorUserId = null)
    {
        Fire(async scope =>
        {
            var svc = scope.ServiceProvider.GetRequiredService<IUserNotificationService>();
            await svc.CreateForRolesScopedAsync(roles, type, titleEn, titleAr, messageEn, messageAr, relatedExamId, relatedAttemptId, actorUserId);
        });
    }

    // ── Internal fire-and-forget helper ──────────────────────────────

    private void Fire(Func<IServiceScope, Task> action)
    {
        // Queue on thread-pool; fully isolated — caller returns immediately
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                await action(scope);
            }
            catch (Exception ex)
            {
                // Non-critical: notification failure must NEVER affect the main request
                _logger.LogWarning(ex, "NotificationDispatcher: background notification failed (non-critical)");
            }
        });
    }
}
