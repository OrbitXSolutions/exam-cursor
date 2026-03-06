using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Notification;

public class NotificationLog : BaseEntity
{
    public int Id { get; set; }

    public string CandidateId { get; set; } = string.Empty;
    public virtual ApplicationUser Candidate { get; set; } = null!;

    public int? ExamId { get; set; }
    public virtual Exam? Exam { get; set; }

    public NotificationEventType EventType { get; set; }
    public NotificationChannel Channel { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;

    public string RecipientEmail { get; set; } = string.Empty;
    public string? RecipientPhone { get; set; }

    public string? Subject { get; set; }
    public string? ErrorMessage { get; set; }

    public DateTime? SentAt { get; set; }
    public int RetryCount { get; set; } = 0;
}
