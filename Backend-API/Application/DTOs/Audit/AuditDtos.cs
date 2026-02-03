using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Audit;

#region AuditLog DTOs

/// <summary>
/// Full audit log details
/// </summary>
public class AuditLogDto
{
    public long Id { get; set; }
    public string? ActorId { get; set; }
    public ActorType ActorType { get; set; }
    public string ActorTypeName => ActorType.ToString();
    public string? ActorDisplayName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
  public string? TenantId { get; set; }
    public AuditSource? Source { get; set; }
    public string? SourceName => Source?.ToString();
    public AuditChannel? Channel { get; set; }
    public string? ChannelName => Channel?.ToString();
  public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? MetadataJson { get; set; }
    public AuditOutcome Outcome { get; set; }
    public string OutcomeName => Outcome.ToString();
  public string? ErrorMessage { get; set; }
    public DateTime OccurredAt { get; set; }
    public int? DurationMs { get; set; }
}

/// <summary>
/// Lightweight audit log for listing
/// </summary>
public class AuditLogListDto
{
    public long Id { get; set; }
    public string? ActorDisplayName { get; set; }
    public ActorType ActorType { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public AuditOutcome Outcome { get; set; }
    public string OutcomeName => Outcome.ToString();
    public AuditSource? Source { get; set; }
    public AuditChannel? Channel { get; set; }
    public DateTime OccurredAt { get; set; }
    public bool HasSnapshot => !string.IsNullOrEmpty(BeforeJson) || !string.IsNullOrEmpty(AfterJson);
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
}

/// <summary>
/// Create audit log entry (internal use)
/// </summary>
public class CreateAuditLogDto
{
    public string? ActorId { get; set; }
 public ActorType ActorType { get; set; } = ActorType.User;
    public string? ActorDisplayName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public string? TenantId { get; set; }
    public AuditSource? Source { get; set; }
    public AuditChannel? Channel { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public object? Before { get; set; }
    public object? After { get; set; }
  public object? Metadata { get; set; }
    public AuditOutcome Outcome { get; set; } = AuditOutcome.Success;
    public string? ErrorMessage { get; set; }
    public int? DurationMs { get; set; }
}

/// <summary>
/// Search audit logs
/// </summary>
public class AuditLogSearchDto
{
    public string? ActorId { get; set; }
 public ActorType? ActorType { get; set; }
    public string? Action { get; set; }
    public string? ActionPrefix { get; set; }
    public string? EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? CorrelationId { get; set; }
    public string? TenantId { get; set; }
    public AuditSource? Source { get; set; }
    public AuditChannel? Channel { get; set; }
    public AuditOutcome? Outcome { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// Entity history request
/// </summary>
public class EntityHistoryRequestDto
{
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

/// <summary>
/// User activity request
/// </summary>
public class UserActivityRequestDto
{
    public string UserId { get; set; } = string.Empty;
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

#endregion

#region RetentionPolicy DTOs

/// <summary>
/// Retention policy details
/// </summary>
public class AuditRetentionPolicyDto
{
    public int Id { get; set; }
  public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public int Priority { get; set; }
    public int RetentionDays { get; set; }
    public string? EntityName { get; set; }
    public string? ActionPrefix { get; set; }
    public string? Channel { get; set; }
    public string? ActorType { get; set; }
    public bool ArchiveBeforeDelete { get; set; }
    public string? ArchiveTarget { get; set; }
    public string? ArchivePathTemplate { get; set; }
    public DateTime? LastExecutedAt { get; set; }
    public int? LastExecutionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Create retention policy
/// </summary>
public class CreateRetentionPolicyDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public bool IsActive { get; set; } = true;
  public int Priority { get; set; } = 100;
    public int RetentionDays { get; set; }
    public string? EntityName { get; set; }
    public string? ActionPrefix { get; set; }
    public string? Channel { get; set; }
    public string? ActorType { get; set; }
    public bool ArchiveBeforeDelete { get; set; }
    public string? ArchiveTarget { get; set; }
    public string? ArchivePathTemplate { get; set; }
}

/// <summary>
/// Update retention policy
/// </summary>
public class UpdateRetentionPolicyDto
{
    public int Id { get; set; }
 public string? NameEn { get; set; }
    public string? NameAr { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public bool? IsActive { get; set; }
    public int? Priority { get; set; }
 public int? RetentionDays { get; set; }
    public string? EntityName { get; set; }
    public string? ActionPrefix { get; set; }
    public string? Channel { get; set; }
    public string? ActorType { get; set; }
    public bool? ArchiveBeforeDelete { get; set; }
    public string? ArchiveTarget { get; set; }
    public string? ArchivePathTemplate { get; set; }
}

#endregion

#region ExportJob DTOs

/// <summary>
/// Export job details
/// </summary>
public class AuditExportJobDto
{
    public int Id { get; set; }
  public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
  public string? TenantId { get; set; }
    public string? EntityName { get; set; }
    public string? ActionPrefix { get; set; }
    public string? ActorId { get; set; }
 public AuditOutcome? Outcome { get; set; }
  public string? OutcomeName => Outcome?.ToString();
    public string? FilterJson { get; set; }
    public ExportFormat Format { get; set; }
    public string FormatName => Format.ToString();
    public ExportStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string RequestedBy { get; set; } = string.Empty;
    public string? RequesterName { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public int? TotalRecords { get; set; }
    public DateTime? CompletedAt { get; set; }
  public DateTime? ExpiresAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? DownloadUrl { get; set; }
}

/// <summary>
/// Export job list item
/// </summary>
public class AuditExportJobListDto
{
    public int Id { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public ExportFormat Format { get; set; }
public string FormatName => Format.ToString();
    public ExportStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? RequesterName { get; set; }
    public DateTime RequestedAt { get; set; }
    public int? TotalRecords { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsExpired => ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Create export job request
/// </summary>
public class CreateExportJobDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string? TenantId { get; set; }
    public string? EntityName { get; set; }
    public string? ActionPrefix { get; set; }
    public string? ActorId { get; set; }
    public AuditOutcome? Outcome { get; set; }
    public ExportFormat Format { get; set; } = ExportFormat.Csv;
}

/// <summary>
/// Search export jobs
/// </summary>
public class ExportJobSearchDto
{
    public ExportStatus? Status { get; set; }
    public string? RequestedBy { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
 public int PageSize { get; set; } = 20;
}

#endregion

#region Dashboard DTOs

/// <summary>
/// Audit dashboard statistics
/// </summary>
public class AuditDashboardDto
{
    public long TotalLogs { get; set; }
    public long LogsToday { get; set; }
    public long LogsThisWeek { get; set; }
    public long LogsThisMonth { get; set; }
    public long SuccessCount { get; set; }
    public long FailureCount { get; set; }
    public decimal SuccessRate { get; set; }
    public List<AuditActionSummaryDto> TopActions { get; set; } = new();
  public List<AuditEntitySummaryDto> TopEntities { get; set; } = new();
    public List<AuditActorSummaryDto> TopActors { get; set; } = new();
    public List<AuditChannelSummaryDto> ChannelDistribution { get; set; } = new();
    public List<AuditTimeSeriesDto> HourlyDistribution { get; set; } = new();
    public int ActiveRetentionPolicies { get; set; }
    public int PendingExportJobs { get; set; }
}

/// <summary>
/// Action summary for dashboard
/// </summary>
public class AuditActionSummaryDto
{
    public string Action { get; set; } = string.Empty;
    public long Count { get; set; }
    public long SuccessCount { get; set; }
    public long FailureCount { get; set; }
}

/// <summary>
/// Entity summary for dashboard
/// </summary>
public class AuditEntitySummaryDto
{
    public string EntityName { get; set; } = string.Empty;
    public long Count { get; set; }
}

/// <summary>
/// Actor summary for dashboard
/// </summary>
public class AuditActorSummaryDto
{
    public string? ActorId { get; set; }
    public string? ActorDisplayName { get; set; }
    public ActorType ActorType { get; set; }
    public long Count { get; set; }
}

/// <summary>
/// Channel distribution for dashboard
/// </summary>
public class AuditChannelSummaryDto
{
    public AuditChannel? Channel { get; set; }
    public string? ChannelName => Channel?.ToString() ?? "Unknown";
    public long Count { get; set; }
public decimal Percentage { get; set; }
}

/// <summary>
/// Time series data for charts
/// </summary>
public class AuditTimeSeriesDto
{
    public DateTime Timestamp { get; set; }
    public long Count { get; set; }
    public long SuccessCount { get; set; }
    public long FailureCount { get; set; }
}

/// <summary>
/// Retention execution result
/// </summary>
public class RetentionExecutionResultDto
{
    public int PolicyId { get; set; }
    public string PolicyName { get; set; } = string.Empty;
    public int LogsProcessed { get; set; }
    public int LogsArchived { get; set; }
    public int LogsDeleted { get; set; }
    public DateTime ExecutedAt { get; set; }
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

#endregion

#region Audit Actions Constants

/// <summary>
/// Standard audit action constants
/// </summary>
public static class AuditActions
{
    // Auth
    public const string AuthLogin = "Auth.Login";
    public const string AuthLogout = "Auth.Logout";
  public const string AuthLoginFailed = "Auth.LoginFailed";
    public const string AuthPasswordChanged = "Auth.PasswordChanged";
    public const string AuthPasswordReset = "Auth.PasswordReset";
    public const string AuthRoleChanged = "Auth.RoleChanged";
    public const string AuthUserBlocked = "Auth.UserBlocked";
    public const string AuthUserUnblocked = "Auth.UserUnblocked";

    // User
    public const string UserCreated = "User.Created";
    public const string UserUpdated = "User.Updated";
    public const string UserDeleted = "User.Deleted";

    // Assessment
    public const string ExamCreated = "Exam.Created";
  public const string ExamUpdated = "Exam.Updated";
    public const string ExamPublished = "Exam.Published";
    public const string ExamUnpublished = "Exam.Unpublished";
    public const string ExamDeleted = "Exam.Deleted";

    // Attempt
    public const string AttemptStarted = "Attempt.Started";
    public const string AttemptSubmitted = "Attempt.Submitted";
    public const string AttemptExpired = "Attempt.Expired";
    public const string AttemptForceSubmitted = "Attempt.ForceSubmitted";

    // Grading
 public const string GradingStarted = "Grading.Started";
    public const string GradingCompleted = "Grading.Completed";
    public const string ManualGradeRecorded = "Grading.ManualGrade";
    public const string GradingRegraded = "Grading.Regraded";

    // Result
    public const string ResultFinalized = "Result.Finalized";
    public const string ResultPublished = "Result.Published";
    public const string ResultUnpublished = "Result.Unpublished";
    public const string ResultInvalidated = "Result.Invalidated";
    public const string ResultExported = "Result.Exported";

    // Proctor
    public const string ProctorSessionStarted = "Proctor.SessionStarted";
    public const string ProctorSessionEnded = "Proctor.SessionEnded";
    public const string ProctorEventRecorded = "Proctor.EventRecorded";
    public const string ProctorEvidenceUploaded = "Proctor.EvidenceUploaded";
    public const string ProctorHighRiskTriggered = "Proctor.HighRiskTriggered";
    public const string ProctorDecisionMade = "Proctor.DecisionMade";

    // Incident
    public const string IncidentCreated = "Incident.Created";
    public const string IncidentAssigned = "Incident.Assigned";
 public const string IncidentStatusChanged = "Incident.StatusChanged";
    public const string IncidentDecisionMade = "Incident.DecisionMade";
    public const string IncidentClosed = "Incident.Closed";
    public const string IncidentReopened = "Incident.Reopened";

    // Appeal
    public const string AppealSubmitted = "Appeal.Submitted";
    public const string AppealReviewed = "Appeal.Reviewed";
    public const string AppealApproved = "Appeal.Approved";
    public const string AppealRejected = "Appeal.Rejected";

    // Audit
    public const string AuditExportRequested = "Audit.ExportRequested";
    public const string AuditExportCompleted = "Audit.ExportCompleted";
    public const string AuditRetentionExecuted = "Audit.RetentionExecuted";
}

#endregion
