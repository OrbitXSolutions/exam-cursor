using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Notification;

public class NotificationTemplate : BaseEntity
{
    public int Id { get; set; }

    public NotificationEventType EventType { get; set; }

    public string SubjectEn { get; set; } = string.Empty;
    public string SubjectAr { get; set; } = string.Empty;

    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
