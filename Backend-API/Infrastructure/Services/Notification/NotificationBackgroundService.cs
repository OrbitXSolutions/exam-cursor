using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Entities.Notification;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Notification;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;

    public NotificationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("NotificationBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingNotificationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in NotificationBackgroundService loop.");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }

        _logger.LogInformation("NotificationBackgroundService stopped.");
    }

    private async Task ProcessPendingNotificationsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var smsService = scope.ServiceProvider.GetRequiredService<ISmsService>();
        var encryption = scope.ServiceProvider.GetRequiredService<IEncryptionService>();

        // Get notification settings for batch size
        var settings = await db.NotificationSettings.FirstOrDefaultAsync(stoppingToken);
        var emailBatchSize = settings?.EmailBatchSize ?? 50;
        var smsBatchSize = settings?.SmsBatchSize ?? 50;
        var batchDelayMs = settings?.BatchDelayMs ?? 1000;

        // Process email notifications
        var pendingEmails = await db.NotificationLogs
            .Include(l => l.Candidate)
            .Include(l => l.Exam)
            .Where(l => l.Status == NotificationStatus.Pending && l.Channel == NotificationChannel.Email)
            .OrderBy(l => l.CreatedDate)
            .Take(emailBatchSize)
            .ToListAsync(stoppingToken);

        if (pendingEmails.Count > 0)
        {
            _logger.LogInformation("Processing {Count} pending email notifications.", pendingEmails.Count);
            await ProcessEmailBatchAsync(db, emailService, encryption, pendingEmails, stoppingToken);
            await Task.Delay(batchDelayMs, stoppingToken);
        }

        // Process SMS notifications
        var pendingSms = await db.NotificationLogs
            .Include(l => l.Candidate)
            .Include(l => l.Exam)
            .Where(l => l.Status == NotificationStatus.Pending && l.Channel == NotificationChannel.Sms)
            .OrderBy(l => l.CreatedDate)
            .Take(smsBatchSize)
            .ToListAsync(stoppingToken);

        if (pendingSms.Count > 0)
        {
            _logger.LogInformation("Processing {Count} pending SMS notifications.", pendingSms.Count);
            await ProcessSmsBatchAsync(db, smsService, encryption, pendingSms, stoppingToken);
        }
    }

    private async Task ProcessEmailBatchAsync(
        ApplicationDbContext db,
        IEmailService emailService,
        IEncryptionService encryption,
        List<NotificationLog> logs,
        CancellationToken stoppingToken)
    {
        // Load template and organization info once for the batch
        var eventType = logs.First().EventType;
        var template = await db.NotificationTemplates
            .FirstOrDefaultAsync(t => t.EventType == eventType && t.IsActive, stoppingToken);

        if (template == null)
        {
            _logger.LogWarning("No active template found for event {EventType}. Marking as failed.", eventType);
            foreach (var log in logs)
            {
                log.Status = NotificationStatus.Failed;
                log.ErrorMessage = "No active template configured for this event type.";
                log.UpdatedDate = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(stoppingToken);
            return;
        }

        var orgSettings = await db.OrganizationSettings.FirstOrDefaultAsync(stoppingToken);
        var systemSettings = await db.SystemSettings.FirstOrDefaultAsync(stoppingToken);
        var notifSettings = await db.NotificationSettings.FirstOrDefaultAsync(stoppingToken);
        var brandName = orgSettings?.Name ?? systemSettings?.BrandName ?? "SmartExam";
        var supportEmail = orgSettings?.SupportEmail ?? systemSettings?.SupportEmail ?? "";
        var primaryColor = orgSettings?.PrimaryColor ?? systemSettings?.PrimaryColor ?? "#0d9488";
        var logoUrl = orgSettings?.LogoPath ?? systemSettings?.LogoUrl ?? "";
        var loginUrl = notifSettings?.LoginUrl ?? "https://smartexam-sable.vercel.app/login";

        // Build ExamURL from share links (batch lookup for efficiency)
        var examIds = logs.Where(l => l.ExamId.HasValue).Select(l => l.ExamId!.Value).Distinct().ToList();
        var shareLinks = await db.ExamShareLinks
            .Where(sl => examIds.Contains(sl.ExamId) && sl.IsActive)
            .ToListAsync(stoppingToken);
        var shareLinkMap = shareLinks.ToDictionary(sl => sl.ExamId, sl => sl.ShareToken);

        // Base URL for public exam access (derive from loginUrl)
        var baseUrl = loginUrl.Contains("/login")
            ? loginUrl.Replace("/login", "")
            : loginUrl.TrimEnd('/');

        foreach (var log in logs)
        {
            if (stoppingToken.IsCancellationRequested) break;

            try
            {
                var candidate = log.Candidate;
                var exam = log.Exam;

                // Decrypt password
                var password = string.IsNullOrWhiteSpace(candidate?.EncryptedPassword)
                    ? "N/A"
                    : encryption.Decrypt(candidate.EncryptedPassword);

                // Build ExamURL for this log
                var examUrl = "";
                if (log.ExamId.HasValue && shareLinkMap.TryGetValue(log.ExamId.Value, out var shareToken))
                {
                    examUrl = $"{baseUrl}/exam/share/{shareToken}";
                }
                else if (log.ExamId.HasValue)
                {
                    examUrl = $"{baseUrl}/exam/{log.ExamId.Value}";
                }

                // Replace placeholders in template
                var subject = ReplacePlaceholders(template.SubjectEn, candidate, exam, password, brandName, supportEmail, loginUrl, examUrl);
                var bodyText = ReplacePlaceholders(template.BodyEn, candidate, exam, password, brandName, supportEmail, loginUrl, examUrl);

                // Wrap in HTML layout
                var htmlBody = WrapInHtmlLayout(bodyText, brandName, primaryColor, logoUrl);

                var success = await emailService.SendEmailAsync(log.RecipientEmail, subject, htmlBody);

                log.Subject = subject;
                log.Status = success ? NotificationStatus.Sent : NotificationStatus.Failed;
                log.ErrorMessage = success ? null : "SMTP delivery failed.";
                log.SentAt = success ? DateTime.UtcNow : null;
                log.UpdatedDate = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                log.Status = NotificationStatus.Failed;
                log.ErrorMessage = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                log.UpdatedDate = DateTime.UtcNow;
                _logger.LogError(ex, "Failed to process email notification {LogId}.", log.Id);
            }
        }

        await db.SaveChangesAsync(stoppingToken);
    }

    private async Task ProcessSmsBatchAsync(
        ApplicationDbContext db,
        ISmsService smsService,
        IEncryptionService encryption,
        List<NotificationLog> logs,
        CancellationToken stoppingToken)
    {
        var eventType = logs.First().EventType;
        var template = await db.NotificationTemplates
            .FirstOrDefaultAsync(t => t.EventType == eventType && t.IsActive, stoppingToken);

        if (template == null)
        {
            foreach (var log in logs)
            {
                log.Status = NotificationStatus.Failed;
                log.ErrorMessage = "No active template configured for this event type.";
                log.UpdatedDate = DateTime.UtcNow;
            }
            await db.SaveChangesAsync(stoppingToken);
            return;
        }

        var systemSettings = await db.SystemSettings.FirstOrDefaultAsync(stoppingToken);
        var brandName = systemSettings?.BrandName ?? "SmartExam";

        foreach (var log in logs)
        {
            if (stoppingToken.IsCancellationRequested) break;

            try
            {
                if (string.IsNullOrWhiteSpace(log.RecipientPhone))
                {
                    log.Status = NotificationStatus.Failed;
                    log.ErrorMessage = "No phone number available.";
                    log.UpdatedDate = DateTime.UtcNow;
                    continue;
                }

                var candidate = log.Candidate;
                var exam = log.Exam;

                // SMS body is shorter - use a compact version
                var smsBody = $"{brandName}: Exam \"{exam?.TitleEn ?? "N/A"}\" is now available. Login to take the exam.";

                var success = await smsService.SendSmsAsync(log.RecipientPhone, smsBody);

                log.Subject = "SMS Notification";
                log.Status = success ? NotificationStatus.Sent : NotificationStatus.Failed;
                log.ErrorMessage = success ? null : "SMS delivery failed.";
                log.SentAt = success ? DateTime.UtcNow : null;
                log.UpdatedDate = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                log.Status = NotificationStatus.Failed;
                log.ErrorMessage = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                log.UpdatedDate = DateTime.UtcNow;
                _logger.LogError(ex, "Failed to process SMS notification {LogId}.", log.Id);
            }
        }

        await db.SaveChangesAsync(stoppingToken);
    }

    private static string ReplacePlaceholders(
        string template,
        Domain.Entities.ApplicationUser? candidate,
        Domain.Entities.Assessment.Exam? exam,
        string password,
        string brandName,
        string supportEmail,
        string loginUrl,
        string examUrl = "")
    {
        return template
            .Replace("{{CandidateName}}", candidate?.FullName ?? candidate?.DisplayName ?? "Candidate")
            .Replace("{{Username}}", candidate?.Email ?? "N/A")
            .Replace("{{Password}}", password)
            .Replace("{{ExamTitle}}", exam?.TitleEn ?? "N/A")
            .Replace("{{ExamStartDate}}", exam?.StartAt?.ToString("yyyy-MM-dd HH:mm") ?? "N/A")
            .Replace("{{ExamEndDate}}", exam?.EndAt?.ToString("yyyy-MM-dd HH:mm") ?? "N/A")
            .Replace("{{ExamDuration}}", exam?.DurationMinutes.ToString() ?? "N/A")
            .Replace("{{BrandName}}", brandName)
            .Replace("{{SupportEmail}}", supportEmail)
            .Replace("{{LoginUrl}}", loginUrl)
            .Replace("{{ExamURL}}", examUrl);
    }

    private static string WrapInHtmlLayout(string bodyText, string brandName, string primaryColor, string logoUrl)
    {
        // Convert plain text newlines to HTML
        var htmlContent = bodyText
            .Replace("\r\n", "\n")
            .Replace("\n\n", "</p><p>")
            .Replace("\n", "<br/>");

        var logoHtml = string.IsNullOrWhiteSpace(logoUrl)
            ? $"<h1 style=\"margin:0;color:{primaryColor};font-size:24px;\">{brandName}</h1>"
            : $"<img src=\"{logoUrl}\" alt=\"{brandName}\" style=\"max-height:60px;max-width:200px;\" />";

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head><meta charset=""UTF-8""><meta name=""viewport"" content=""width=device-width,initial-scale=1""></head>
<body style=""margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;"">
<table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background-color:#f4f4f7;"">
<tr><td align=""center"" style=""padding:40px 20px;"">
<table role=""presentation"" width=""600"" cellpadding=""0"" cellspacing=""0"" style=""background:#ffffff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;"">
  <!-- Header -->
  <tr><td style=""background-color:{primaryColor};padding:24px 32px;text-align:center;"">
    {logoHtml}
  </td></tr>
  <!-- Body -->
  <tr><td style=""padding:32px;color:#333333;font-size:15px;line-height:1.6;"">
    <p>{htmlContent}</p>
  </td></tr>
  <!-- Footer -->
  <tr><td style=""background-color:#f8f9fa;padding:16px 32px;text-align:center;color:#888888;font-size:12px;border-top:1px solid #eeeeee;"">
    &copy; {DateTime.UtcNow.Year} {brandName}. All rights reserved.
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>";
    }
}
