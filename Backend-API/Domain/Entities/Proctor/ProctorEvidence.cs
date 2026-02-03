using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents captured evidence from advanced proctoring.
/// Evidence files are stored in secure storage (S3/local).
/// </summary>
public class ProctorEvidence : BaseEntity
{
    public int Id { get; set; }

    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }

    public EvidenceType Type { get; set; }

    // Storage info
 public string FileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public long FileSize { get; set; }
    public string? ContentType { get; set; }

    // Time boundaries for evidence chunk
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? DurationSeconds { get; set; }

    // Integrity checks
    public string? Checksum { get; set; }
    public string? ChecksumAlgorithm { get; set; }

    // Upload tracking
    public bool IsUploaded { get; set; }
    public DateTime? UploadedAt { get; set; }
 public int UploadAttempts { get; set; }
    public string? UploadError { get; set; }

    // Metadata (resolution, codec, device info, etc.)
    public string? MetadataJson { get; set; }

    // Retention
    public DateTime? ExpiresAt { get; set; }
    public bool IsExpired { get; set; }

    // Navigation Properties
  public virtual ProctorSession ProctorSession { get; set; } = null!;
}
