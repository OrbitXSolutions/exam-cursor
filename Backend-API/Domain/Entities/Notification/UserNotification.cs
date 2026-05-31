using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Notification;

public class UserNotification
{
    public int Id { get; set; }

    /// <summary>FK → AspNetUsers.Id</summary>
    public string UserId { get; set; } = string.Empty;
    public virtual ApplicationUser User { get; set; } = null!;

    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;

    public UserNotificationType Type { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTimeOffset? ReadAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = UaeTimeHelper.NowUae;

    /// <summary>Optional FK for quick navigation from the notification</summary>
    public int? RelatedExamId { get; set; }
    public int? RelatedAttemptId { get; set; }
}
