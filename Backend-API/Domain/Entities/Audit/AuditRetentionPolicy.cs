using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Audit;

/// <summary>
/// Defines retention policy for audit logs.
/// Governs how long logs are kept before archiving/deletion.
/// </summary>
public class AuditRetentionPolicy : BaseEntity
{
    public int Id { get; set; }

    public string NameEn { get; set; } = null!;
    public string NameAr { get; set; } = null!;

    public string? DescriptionEn { get; set; }
 public string? DescriptionAr { get; set; }

    public bool IsActive { get; set; }

    /// <summary>
    /// Whether this is the default global policy
    /// </summary>
    public bool IsDefault { get; set; }

    /// <summary>
    /// Priority for policy evaluation (lower = higher priority)
    /// </summary>
    public int Priority { get; set; }

    // How long to keep logs
    /// <summary>
    /// Number of days to retain logs
    /// </summary>
    public int RetentionDays { get; set; }

    // Scope filters (optional - null means applies globally)
    /// <summary>
    /// Apply to specific entity type, null for all
    /// </summary>
    public string? EntityName { get; set; }

    /// <summary>
    /// Apply to actions starting with this prefix, e.g., "Incident."
    /// </summary>
    public string? ActionPrefix { get; set; }

    /// <summary>
    /// Apply to specific channel
    /// </summary>
  public string? Channel { get; set; }

    /// <summary>
    /// Apply to specific actor type
    /// </summary>
    public string? ActorType { get; set; }

    // Archiving behavior
    /// <summary>
    /// Whether to archive logs before deletion
/// </summary>
    public bool ArchiveBeforeDelete { get; set; }

/// <summary>
    /// Archive target: S3, Blob, FileShare
/// </summary>
 public string? ArchiveTarget { get; set; }

    /// <summary>
    /// Archive path template
    /// </summary>
    public string? ArchivePathTemplate { get; set; }

    /// <summary>
    /// When this policy was last executed
    /// </summary>
    public DateTime? LastExecutedAt { get; set; }

    /// <summary>
    /// Number of logs processed in last execution
    /// </summary>
    public int? LastExecutionCount { get; set; }
}
