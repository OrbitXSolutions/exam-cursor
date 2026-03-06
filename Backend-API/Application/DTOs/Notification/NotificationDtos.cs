using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Notification;

// ── Notification Settings ─────────────────────────────────────
public class NotificationSettingsDto
{
    // SMTP
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string? SmtpPassword { get; set; }
    public string SmtpFromEmail { get; set; } = string.Empty;
    public string SmtpFromName { get; set; } = string.Empty;
    public bool SmtpEnableSsl { get; set; } = true;
    public bool EnableEmail { get; set; }

    // SMS
    public bool EnableSms { get; set; }
    public SmsProvider SmsProvider { get; set; } = SmsProvider.Twilio;
    public string SmsAccountSid { get; set; } = string.Empty;
    public string? SmsAuthToken { get; set; }
    public string SmsFromNumber { get; set; } = string.Empty;
    public string? CustomSmsApiUrl { get; set; }
    public string? CustomSmsApiKey { get; set; }

    // Batching
    public int EmailBatchSize { get; set; } = 50;
    public int SmsBatchSize { get; set; } = 50;
    public int BatchDelayMs { get; set; } = 1000;

    // Frontend login URL
    public string LoginUrl { get; set; } = string.Empty;
}

// ── Notification Template ─────────────────────────────────────
public class NotificationTemplateDto
{
    public int Id { get; set; }
    public NotificationEventType EventType { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string SubjectEn { get; set; } = string.Empty;
    public string SubjectAr { get; set; } = string.Empty;
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class UpdateNotificationTemplateDto
{
    public string SubjectEn { get; set; } = string.Empty;
    public string SubjectAr { get; set; } = string.Empty;
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

// ── Notification Log ──────────────────────────────────────────
public class NotificationLogDto
{
    public int Id { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public int? ExamId { get; set; }
    public string? ExamTitle { get; set; }
    public NotificationEventType EventType { get; set; }
    public string EventName { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public string ChannelName { get; set; } = string.Empty;
    public NotificationStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string RecipientEmail { get; set; } = string.Empty;
    public string? RecipientPhone { get; set; }
    public string? Subject { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime CreatedDate { get; set; }
    public int RetryCount { get; set; }
}

public class NotificationLogFilterDto
{
    public NotificationStatus? Status { get; set; }
    public NotificationChannel? Channel { get; set; }
    public NotificationEventType? EventType { get; set; }
    public int? ExamId { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

// ── Test DTOs ─────────────────────────────────────────────────
public class TestEmailDto
{
    public string ToEmail { get; set; } = string.Empty;
}

public class TestSmsDto
{
    public string ToPhone { get; set; } = string.Empty;
}
