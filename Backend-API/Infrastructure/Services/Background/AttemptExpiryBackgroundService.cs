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

namespace Smart_Core.Infrastructure.Services.Background;

/// <summary>
/// Background service that runs every 30 seconds to:
/// 1. Expire overdue attempts (timer ran out) with heartbeat-based ExpiryReason detection.
/// 2. Force-expire attempts whose exam schedule window (EndAt) has passed (ExamWindowClosed).
/// 3. Push SignalR events to affected candidates.
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

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredAttemptsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AttemptExpiryBackgroundService cycle.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task ProcessExpiredAttemptsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var now = DateTime.UtcNow;

        // ── 1) Timer-expired attempts (ExpiresAt < now) ────────────────────
        var timerExpired = await db.Attempts
            .Where(a => !a.IsDeleted
                && (a.Status == AttemptStatus.Started
                    || a.Status == AttemptStatus.InProgress
                    || a.Status == AttemptStatus.Resumed)
                && a.ExpiresAt.HasValue
                && a.ExpiresAt.Value < now)
            .ToListAsync(ct);

        foreach (var attempt in timerExpired)
        {
            attempt.Status = AttemptStatus.Expired;
            attempt.UpdatedDate = now;

            // Determine expiry reason based on heartbeat gap
            var disconnectedThreshold = attempt.ExpiresAt!.Value.AddMinutes(-5);
            if (attempt.LastActivityAt.HasValue && attempt.LastActivityAt.Value >= disconnectedThreshold)
            {
                attempt.ExpiryReason = ExpiryReason.TimerExpiredWhileActive;
            }
            else
            {
                attempt.ExpiryReason = ExpiryReason.TimerExpiredWhileDisconnected;
            }

            db.AttemptEvents.Add(new AttemptEvent
            {
                AttemptId = attempt.Id,
                EventType = AttemptEventType.TimedOut,
                OccurredAt = now,
                MetadataJson = JsonSerializer.Serialize(new
                {
                    expiredAt = attempt.ExpiresAt,
                    expiryReason = attempt.ExpiryReason.ToString(),
                    source = "BackgroundService"
                }),
                CreatedDate = now,
                CreatedBy = "system"
            });
        }

        // ── 2) Exam-window-closed attempts (exam.EndAt < now) ──────────────
        var windowClosed = await db.Attempts
            .Include(a => a.Exam)
            .Where(a => !a.IsDeleted
                && (a.Status == AttemptStatus.Started
                    || a.Status == AttemptStatus.InProgress
                    || a.Status == AttemptStatus.Resumed)
                && a.Exam.EndAt.HasValue
                && a.Exam.EndAt.Value < now
                // Exclude attempts already caught by timer expiry above
                && (!a.ExpiresAt.HasValue || a.ExpiresAt.Value >= now))
            .ToListAsync(ct);

        foreach (var attempt in windowClosed)
        {
            attempt.Status = AttemptStatus.Expired;
            attempt.ExpiryReason = ExpiryReason.ExamWindowClosed;
            attempt.UpdatedDate = now;

            db.AttemptEvents.Add(new AttemptEvent
            {
                AttemptId = attempt.Id,
                EventType = AttemptEventType.TimedOut,
                OccurredAt = now,
                MetadataJson = JsonSerializer.Serialize(new
                {
                    examEndAt = attempt.Exam.EndAt,
                    expiryReason = ExpiryReason.ExamWindowClosed.ToString(),
                    source = "BackgroundService"
                }),
                CreatedDate = now,
                CreatedBy = "system"
            });
        }

        // ── 3) Close proctor sessions for all newly expired attempts ───────
        var allExpiredIds = timerExpired.Concat(windowClosed).Select(a => a.Id).ToList();

        if (allExpiredIds.Count > 0)
        {
            var orphanSessions = await db.Set<ProctorSession>()
                .Where(s => allExpiredIds.Contains(s.AttemptId) && s.Status == ProctorSessionStatus.Active)
                .ToListAsync(ct);

            foreach (var ps in orphanSessions)
            {
                ps.Status = ProctorSessionStatus.Completed;
                ps.EndedAt = now;
                ps.UpdatedDate = now;
                ps.UpdatedBy = "system";
            }

            await db.SaveChangesAsync(ct);

            // Audit log all expirations
            var auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
            foreach (var attempt in timerExpired)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await auditService.LogSuccessAsync(
                            AuditActions.AttemptExpired, "Attempt", attempt.Id.ToString(),
                            actorId: "system",
                            metadata: new { attemptId = attempt.Id, expiryReason = attempt.ExpiryReason.ToString() });
                    }
                    catch { }
                });
            }
            foreach (var attempt in windowClosed)
            {
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await auditService.LogSuccessAsync(
                            AuditActions.AttemptExamWindowClosed, "Attempt", attempt.Id.ToString(),
                            actorId: "system",
                            metadata: new { attemptId = attempt.Id, examEndAt = attempt.Exam.EndAt });
                    }
                    catch { }
                });
            }

            _logger.LogInformation(
                "AttemptExpiryBackgroundService: expired {TimerCount} timer-overdue + {WindowCount} window-closed attempts.",
                timerExpired.Count, windowClosed.Count);

            // ── 4) Push SignalR notifications to candidates ────────────────
            foreach (var attempt in timerExpired)
            {
                _ = PushExpiryNotification(attempt.Id, "TimerExpired", attempt.ExpiryReason.ToString());
            }
            foreach (var attempt in windowClosed)
            {
                _ = PushExpiryNotification(attempt.Id, "ExamWindowClosed", ExpiryReason.ExamWindowClosed.ToString());
            }
        }
    }

    private async Task PushExpiryNotification(int attemptId, string eventType, string reason)
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
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to push expiry notification for attempt {AttemptId}", attemptId);
        }
    }
}
