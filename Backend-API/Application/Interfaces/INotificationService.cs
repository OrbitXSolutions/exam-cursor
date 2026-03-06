using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Notification;

namespace Smart_Core.Application.Interfaces;

public interface INotificationService
{
    // Settings
    Task<ApiResponse<NotificationSettingsDto>> GetNotificationSettingsAsync();
    Task<ApiResponse<NotificationSettingsDto>> UpdateNotificationSettingsAsync(NotificationSettingsDto dto, string updatedBy);

    // Templates
    Task<ApiResponse<List<NotificationTemplateDto>>> GetTemplatesAsync();
    Task<ApiResponse<NotificationTemplateDto>> GetTemplateByEventAsync(int eventType);
    Task<ApiResponse<NotificationTemplateDto>> UpdateTemplateAsync(int eventType, UpdateNotificationTemplateDto dto, string updatedBy);

    // Logs
    Task<ApiResponse<PaginatedResponse<NotificationLogDto>>> GetLogsAsync(NotificationLogFilterDto filter);
    Task<ApiResponse<bool>> RetryNotificationAsync(int logId);

    // Test
    Task<ApiResponse<bool>> SendTestEmailAsync(TestEmailDto dto);
    Task<ApiResponse<bool>> SendTestSmsAsync(TestSmsDto dto);

    // Event triggers
    Task QueueExamPublishedNotificationsAsync(int examId);
}
