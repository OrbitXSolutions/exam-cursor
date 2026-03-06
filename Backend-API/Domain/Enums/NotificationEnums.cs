namespace Smart_Core.Domain.Enums;

public enum NotificationEventType
{
    ExamPublished = 1,
    ResultPublished = 2,
    ExamExpired = 3
}

public enum NotificationChannel
{
    Email = 1,
    Sms = 2
}

public enum NotificationStatus
{
    Pending = 1,
    Sent = 2,
    Failed = 3
}

public enum SmsProvider
{
    Twilio = 1,
    Vonage = 2,
    Custom = 3
}
