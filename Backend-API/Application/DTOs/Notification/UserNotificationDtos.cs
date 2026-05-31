using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Notification;

public class UserNotificationDto
{
    public int Id { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public int Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int? RelatedExamId { get; set; }
    public int? RelatedAttemptId { get; set; }
}

public class UserNotificationCountDto
{
    public int Count { get; set; }
}

public class UserNotificationPagedResultDto
{
    public List<UserNotificationDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
}
