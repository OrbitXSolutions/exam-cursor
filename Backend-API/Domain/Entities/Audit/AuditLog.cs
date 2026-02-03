using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Audit;

/// <summary>
/// Immutable audit log entry.
/// Records are append-only - no updates or deletes from application workflows.
/// </summary>
public class AuditLog : BaseEntity
{
    public long Id { get; set; }

  // Who performed the action
    /// <summary>
/// User ID (null for system jobs)
    /// </summary>
    public string? ActorId { get; set; }

    /// <summary>
    /// Type of actor: User, System, Service
    /// </summary>
    public ActorType ActorType { get; set; }

    /// <summary>
    /// Display name for quick UI display
    /// </summary>
 public string? ActorDisplayName { get; set; }

    // What happened
    /// <summary>
  /// Action identifier e.g., "Attempt.Submitted", "Proctor.EventRecorded"
    /// </summary>
    public string Action { get; set; } = null!;

    /// <summary>
    /// Entity type e.g., "Attempt", "ExamResult", "IncidentCase"
    /// </summary>
    public string EntityName { get; set; } = null!;

    /// <summary>
    /// Entity ID (stored as string to support int/guid polymorphism)
    /// </summary>
    public string EntityId { get; set; } = null!;

    // Correlation / context
    /// <summary>
    /// Request trace ID or job ID for end-to-end tracing
/// </summary>
    public string? CorrelationId { get; set; }

    /// <summary>
  /// Tenant ID for multi-tenant scenarios
    /// </summary>
    public string? TenantId { get; set; }

    /// <summary>
    /// Source: API, BackgroundJob, Scheduler
    /// </summary>
    public AuditSource? Source { get; set; }

    /// <summary>
    /// Channel: Web, Mobile, AdminPortal
    /// </summary>
    public AuditChannel? Channel { get; set; }

    // Request details
/// <summary>
    /// Client IP address
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Client user agent
    /// </summary>
    public string? UserAgent { get; set; }

    // Data snapshots
    /// <summary>
    /// State before change (JSON, optional)
    /// </summary>
    public string? BeforeJson { get; set; }

    /// <summary>
    /// State after change (JSON, optional)
    /// </summary>
    public string? AfterJson { get; set; }

    /// <summary>
    /// Extra metadata (JSON)
    /// </summary>
    public string? MetadataJson { get; set; }

    // Result
    /// <summary>
    /// Outcome: Success or Failure
    /// </summary>
    public AuditOutcome Outcome { get; set; }

    /// <summary>
    /// Error message if Outcome is Failure
    /// </summary>
    public string? ErrorMessage { get; set; }

    // Time
    /// <summary>
    /// When the action occurred (server time)
    /// </summary>
    public DateTime OccurredAt { get; set; }

    /// <summary>
    /// Duration in milliseconds (optional)
    /// </summary>
    public int? DurationMs { get; set; }
}
