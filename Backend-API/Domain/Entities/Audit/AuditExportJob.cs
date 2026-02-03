using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Audit;

/// <summary>
/// Tracks audit log export jobs.
/// </summary>
public class AuditExportJob : BaseEntity
{
    public int Id { get; set; }

    // Filters
    /// <summary>
    /// Start date for logs to export
    /// </summary>
    public DateTime FromDate { get; set; }

    /// <summary>
    /// End date for logs to export
    /// </summary>
    public DateTime ToDate { get; set; }

    /// <summary>
    /// Filter by tenant
    /// </summary>
 public string? TenantId { get; set; }

    /// <summary>
    /// Filter by entity type
    /// </summary>
    public string? EntityName { get; set; }

    /// <summary>
    /// Filter by action prefix
    /// </summary>
    public string? ActionPrefix { get; set; }

    /// <summary>
/// Filter by actor
  /// </summary>
    public string? ActorId { get; set; }

    /// <summary>
    /// Filter by outcome
/// </summary>
    public AuditOutcome? Outcome { get; set; }

    /// <summary>
    /// Additional filter criteria as JSON
    /// </summary>
    public string? FilterJson { get; set; }

    // Output
    /// <summary>
 /// Export file format
    /// </summary>
    public ExportFormat Format { get; set; }

    /// <summary>
    /// Current status
    /// </summary>
    public ExportStatus Status { get; set; }

    /// <summary>
    /// User who requested the export
    /// </summary>
    public string RequestedBy { get; set; } = null!;

    /// <summary>
    /// When the export was requested
    /// </summary>
  public DateTime RequestedAt { get; set; }

    /// <summary>
    /// When processing started
    /// </summary>
    public DateTime? StartedAt { get; set; }

    /// <summary>
    /// Path to the generated file
    /// </summary>
    public string? FilePath { get; set; }

    /// <summary>
    /// File name
    /// </summary>
    public string? FileName { get; set; }

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// Total records exported
    /// </summary>
    public int? TotalRecords { get; set; }

    /// <summary>
    /// When export completed
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// When the export file expires
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Error message if failed
    /// </summary>
    public string? ErrorMessage { get; set; }

    // Navigation
    public virtual ApplicationUser Requester { get; set; } = null!;
}
