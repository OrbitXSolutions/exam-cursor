using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Represents an export job for exam results.
/// Tracks the lifecycle of async export operations.
/// </summary>
public class ResultExportJob : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    // Export settings
    public ExportFormat Format { get; set; }
    public ExportStatus Status { get; set; }

    // Filter options (optional)
    public DateTimeOffset? FromDate { get; set; }
    public DateTimeOffset? ToDate { get; set; }
    public bool? PassedOnly { get; set; }
  public bool? FailedOnly { get; set; }

    // Request info
    public string RequestedBy { get; set; } = null!;
    public DateTimeOffset RequestedAt { get; set; }

    // Output
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public long? FileSizeBytes { get; set; }
 public DateTimeOffset? CompletedAt { get; set; }

    // Error handling
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
}
