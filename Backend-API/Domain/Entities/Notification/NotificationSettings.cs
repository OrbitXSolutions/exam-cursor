using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Notification;

public class NotificationSettings : BaseEntity
{
    public int Id { get; set; }

    // SMTP Configuration
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPasswordEncrypted { get; set; } = string.Empty;
    public string SmtpFromEmail { get; set; } = string.Empty;
    public string SmtpFromName { get; set; } = string.Empty;
    public bool SmtpEnableSsl { get; set; } = true;
    public bool EnableEmail { get; set; } = false;

    // SMS Configuration
    public bool EnableSms { get; set; } = false;
    public SmsProvider SmsProvider { get; set; } = SmsProvider.Twilio;
    public string SmsAccountSid { get; set; } = string.Empty;
    public string SmsAuthTokenEncrypted { get; set; } = string.Empty;
    public string SmsFromNumber { get; set; } = string.Empty;

    // Custom SMS API (for SmsProvider.Custom)
    public string? CustomSmsApiUrl { get; set; }
    public string? CustomSmsApiKey { get; set; }

    // Batch Configuration
    public int EmailBatchSize { get; set; } = 50;
    public int SmsBatchSize { get; set; } = 50;
    public int BatchDelayMs { get; set; } = 1000;

    // Frontend login URL for email links
    public string LoginUrl { get; set; } = "https://smartexam-sable.vercel.app/login";
}
