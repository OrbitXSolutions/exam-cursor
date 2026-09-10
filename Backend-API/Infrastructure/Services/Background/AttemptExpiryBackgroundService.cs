using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.Interfaces.Audit;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Hubs;
using Smart_Core.Domain.Common;

namespace Smart_Core.Infrastructure.Services.Background;

/// <summary>
/// Expires overdue attempts and closed exam windows every 30 seconds, then notifies candidates.
/// </summary>
public class AttemptExpiryBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IHubContext<ProctorHub> _proctorHub;
    private readonly ILogger<AttemptExpiryBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);

    public AttemptExpiryBackgroundService(
        IServiceScopeFactory scopeFactory,
        IHubContext<ProctorHub> proctorHub,
        ILogger<AttemptExpiryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _proctorHub = proctorHub;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("AttemptExpiryBackgroundService started.");

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredAttemptsAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in AttemptExpiryBackgroundService cycle.");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task ProcessExpiredAttemptsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await using var workerLock = await SqlServerWorkerLock.TryAcquireAsync(
            db, "SmartCore:Worker:AttemptExpiry", ct);
        if (workerLock == null)
            return;

        var now = UaeTimeHelper.NowUae;
        var activeAttempts = db.Attempts.AsNoTracking()
            .Where(a => !a.IsDeleted
                && (a.Status == AttemptStatus.Started
                    || a.Status == AttemptStatus.InProgress
                    || a.Status == AttemptStatus.Resumed));
        var candidates = await activeAttempts
            .Where(a => a.ExpiresAt.HasValue && a.ExpiresAt.Value < now)
            .Select(a => a.Id)
            .Union(activeAttempts
                .Where(a => a.Exam.EndAt.HasValue && a.Exam.EndAt.Value < now
                    && (!a.ExpiresAt.HasValue || a.ExpiresAt.Value >= now))
                .Select(a => a.Id))
            .ToListAsync(ct);

        var timerCount = 0;
        var windowCount = 0;
        foreach (var attemptId in candidates)
        {
            ct.ThrowIfCancellationRequested();
            await workerLock.EnsureHeldAsync(ct);
            var expired = await TryExpireAttemptAsync(db, attemptId, now, ct);
            if (expired == null)
                continue;

            var windowClosed = expired.ExpiryReason == ExpiryReason.ExamWindowClosed;
            if (windowClosed)
                windowCount++;
            else
                timerCount++;

            // Auditing is awaited within its own live scope, after the expiry transaction commits.
            try
            {
                using var auditScope = _scopeFactory.CreateScope();
                var auditService = auditScope.ServiceProvider.GetRequiredService<IAuditService>();
                await auditService.LogSuccessAsync(
                    windowClosed ? AuditActions.AttemptExamWindowClosed : AuditActions.AttemptExpired,
                    "Attempt", attemptId.ToString(), actorId: "system",
                    metadata: windowClosed
                        ? (object)new { attemptId, examEndAt = expired.ExamEndAt }
                        : new { attemptId, expiryReason = expired.ExpiryReason.ToString() });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to audit expiry for attempt {AttemptId}", attemptId);
            }

            await PushExpiryNotification(
                attemptId, windowClosed ? "ExamWindowClosed" : "TimerExpired",
                expired.ExpiryReason.ToString(), ct);
        }

        if (timerCount + windowCount > 0)
        {
            _logger.LogInformation(
                "AttemptExpiryBackgroundService: expired {TimerCount} timer-overdue + {WindowCount} window-closed attempts.",
                timerCount, windowCount);
        }
    }

    private static async Task<ExpiredAttempt?> TryExpireAttemptAsync(
        ApplicationDbContext db, int attemptId, DateTimeOffset now, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var activeAttempt = db.Attempts.Where(a => a.Id == attemptId && !a.IsDeleted
            && (a.Status == AttemptStatus.Started
                || a.Status == AttemptStatus.InProgress
                || a.Status == AttemptStatus.Resumed));

        // Recheck status and deadlines in the UPDATE, not on a stale tracked attempt.
        var updated = await activeAttempt
            .Where(a => a.ExpiresAt.HasValue && a.ExpiresAt.Value < now)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(a => a.Status, AttemptStatus.Expired)
                .SetProperty(a => a.ExpiryReason, a =>
                    a.LastActivityAt.HasValue && a.LastActivityAt.Value >= a.ExpiresAt!.Value.AddMinutes(-5)
                        ? ExpiryReason.TimerExpiredWhileActive
                        : ExpiryReason.TimerExpiredWhileDisconnected)
                .SetProperty(a => a.UpdatedDate, now), ct);

        if (updated == 0)
        {
            updated = await activeAttempt
                .Where(a => a.Exam.EndAt.HasValue && a.Exam.EndAt.Value < now
                    && (!a.ExpiresAt.HasValue || a.ExpiresAt.Value >= now))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(a => a.Status, AttemptStatus.Expired)
                    .SetProperty(a => a.ExpiryReason, ExpiryReason.ExamWindowClosed)
                    .SetProperty(a => a.UpdatedDate, now), ct);
        }

        if (updated == 0)
            return null;

        var snapshot = await db.Attempts.AsNoTracking()
            .Where(a => a.Id == attemptId)
            .Select(a => new { a.ExamId, a.ExpiresAt, a.ExpiryReason })
            .SingleAsync(ct);
        var windowClosed = snapshot.ExpiryReason == ExpiryReason.ExamWindowClosed;
        var examEndAt = windowClosed
            ? await db.Exams.IgnoreQueryFilters().Where(e => e.Id == snapshot.ExamId)
                .Select(e => e.EndAt).SingleAsync(ct)
            : null;
        var expired = new ExpiredAttempt(snapshot.ExpiresAt, examEndAt, snapshot.ExpiryReason);
        var attemptEvent = new AttemptEvent
        {
            AttemptId = attemptId,
            EventType = AttemptEventType.TimedOut,
            OccurredAt = now,
            MetadataJson = windowClosed
                ? JsonSerializer.Serialize(new
                {
                    examEndAt = expired.ExamEndAt,
                    expiryReason = expired.ExpiryReason.ToString(),
                    source = "BackgroundService"
                })
                : JsonSerializer.Serialize(new
                {
                    expiredAt = expired.ExpiresAt,
                    expiryReason = expired.ExpiryReason.ToString(),
                    source = "BackgroundService"
                }),
            CreatedDate = now,
            CreatedBy = "system"
        };
        db.AttemptEvents.Add(attemptEvent);

        await db.Set<ProctorSession>()
            .Where(s => s.AttemptId == attemptId && s.Status == ProctorSessionStatus.Active)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(s => s.Status, ProctorSessionStatus.Completed)
                .SetProperty(s => s.EndedAt, now)
                .SetProperty(s => s.UpdatedDate, now)
                .SetProperty(s => s.UpdatedBy, "system"), ct);
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        db.Entry(attemptEvent).State = EntityState.Detached;
        return expired;
    }

    private sealed record ExpiredAttempt(
        DateTimeOffset? ExpiresAt, DateTimeOffset? ExamEndAt, ExpiryReason ExpiryReason);

    private async Task PushExpiryNotification(int attemptId, string eventType, string reason, CancellationToken ct)
    {
        try
        {
            var group = $"attempt_{attemptId}";
            await _proctorHub.Clients.Group(group).SendAsync("AttemptExpired", new
            {
                attemptId,
                eventType,
                reason,
                message = eventType == "ExamWindowClosed"
                    ? "The exam schedule window has closed. Your attempt has been ended."
                    : "Your exam time has expired."
            }, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push expiry notification for attempt {AttemptId}", attemptId);
        }
    }
}
