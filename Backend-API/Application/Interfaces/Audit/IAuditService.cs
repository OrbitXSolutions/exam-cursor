using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces.Audit;

/// <summary>
/// Service interface for audit logging and management
/// </summary>
public interface IAuditService
{
    #region Audit Logging

    /// <summary>
    /// Log an audit event (async, non-blocking)
    /// </summary>
    Task LogAsync(CreateAuditLogDto dto);

    /// <summary>
    /// Log an audit event synchronously
  /// </summary>
    void Log(CreateAuditLogDto dto);

    /// <summary>
    /// Log a success action
    /// </summary>
    Task LogSuccessAsync(
  string action,
        string entityName,
      string entityId,
  string? actorId = null,
        object? before = null,
        object? after = null,
        object? metadata = null);

    /// <summary>
  /// Log a failure action
    /// </summary>
  Task LogFailureAsync(
        string action,
        string entityName,
        string entityId,
        string errorMessage,
        string? actorId = null,
        object? metadata = null);

    /// <summary>
    /// Log a system action (background job, scheduler)
    /// </summary>
    Task LogSystemActionAsync(
        string action,
        string entityName,
        string entityId,
        AuditOutcome outcome,
        string? errorMessage = null,
        object? metadata = null);

    #endregion

    #region Audit Log Queries

    /// <summary>
    /// Get audit log by ID
    /// </summary>
    Task<ApiResponse<AuditLogDto>> GetLogAsync(long logId);

    /// <summary>
    /// Search audit logs
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> SearchLogsAsync(AuditLogSearchDto searchDto);

    /// <summary>
    /// Get entity history (all changes to a specific entity)
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> GetEntityHistoryAsync(EntityHistoryRequestDto request);

  /// <summary>
    /// Get user activity (all actions by a specific user)
    /// </summary>
    Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> GetUserActivityAsync(UserActivityRequestDto request);

    /// <summary>
    /// Get logs by correlation ID
    /// </summary>
    Task<ApiResponse<List<AuditLogListDto>>> GetByCorrelationIdAsync(string correlationId);

    /// <summary>
    /// Get recent failures
    /// </summary>
  Task<ApiResponse<List<AuditLogListDto>>> GetRecentFailuresAsync(int count = 50);

    #endregion

    #region Retention Policies

    /// <summary>
    /// Get all retention policies
    /// </summary>
    Task<ApiResponse<List<AuditRetentionPolicyDto>>> GetRetentionPoliciesAsync();

    /// <summary>
    /// Get retention policy by ID
    /// </summary>
    Task<ApiResponse<AuditRetentionPolicyDto>> GetRetentionPolicyAsync(int policyId);

    /// <summary>
    /// Create retention policy
  /// </summary>
 Task<ApiResponse<AuditRetentionPolicyDto>> CreateRetentionPolicyAsync(CreateRetentionPolicyDto dto, string userId);

    /// <summary>
    /// Update retention policy
    /// </summary>
    Task<ApiResponse<AuditRetentionPolicyDto>> UpdateRetentionPolicyAsync(UpdateRetentionPolicyDto dto, string userId);

    /// <summary>
    /// Delete retention policy
    /// </summary>
    Task<ApiResponse<bool>> DeleteRetentionPolicyAsync(int policyId, string userId);

 /// <summary>
    /// Set default retention policy
    /// </summary>
    Task<ApiResponse<AuditRetentionPolicyDto>> SetDefaultPolicyAsync(int policyId, string userId);

    /// <summary>
    /// Execute retention policies (manual trigger)
    /// </summary>
    Task<ApiResponse<List<RetentionExecutionResultDto>>> ExecuteRetentionAsync(string userId);

    /// <summary>
    /// Preview retention policy execution
    /// </summary>
  Task<ApiResponse<int>> PreviewRetentionAsync(int policyId);

    #endregion

    #region Export Jobs

    /// <summary>
    /// Create export job
    /// </summary>
    Task<ApiResponse<AuditExportJobDto>> CreateExportJobAsync(CreateExportJobDto dto, string userId);

    /// <summary>
    /// Get export job by ID
    /// </summary>
    Task<ApiResponse<AuditExportJobDto>> GetExportJobAsync(int jobId);

    /// <summary>
    /// Get export jobs
 /// </summary>
    Task<ApiResponse<PaginatedResponse<AuditExportJobListDto>>> GetExportJobsAsync(ExportJobSearchDto searchDto);

    /// <summary>
    /// Get my export jobs
    /// </summary>
    Task<ApiResponse<List<AuditExportJobListDto>>> GetMyExportJobsAsync(string userId);

    /// <summary>
    /// Cancel export job
    /// </summary>
    Task<ApiResponse<bool>> CancelExportJobAsync(int jobId, string userId);

    /// <summary>
    /// Get download URL for completed export
    /// </summary>
 Task<ApiResponse<string>> GetExportDownloadUrlAsync(int jobId, string userId);

    /// <summary>
    /// Process pending export jobs (background)
    /// </summary>
    Task ProcessPendingExportsAsync();

    #endregion

    #region Dashboard

    /// <summary>
    /// Get audit dashboard statistics
 /// </summary>
    Task<ApiResponse<AuditDashboardDto>> GetDashboardAsync(DateTime? fromDate = null, DateTime? toDate = null);

    /// <summary>
    /// Get audit statistics for a specific entity
    /// </summary>
    Task<ApiResponse<AuditDashboardDto>> GetEntityDashboardAsync(string entityName);

    #endregion
}
