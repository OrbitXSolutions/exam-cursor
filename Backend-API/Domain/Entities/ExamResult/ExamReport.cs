using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Aggregated report for an exam's results.
/// Generated on-demand or scheduled.
/// </summary>
public class ExamReport : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    // Reporting window (optional)
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }

    // Attempt aggregates
    public int TotalAttempts { get; set; }
    public int TotalSubmitted { get; set; }
    public int TotalExpired { get; set; }

    // Result aggregates
    public int TotalPassed { get; set; }
    public int TotalFailed { get; set; }

    // Score aggregates
    public decimal AverageScore { get; set; }
    public decimal HighestScore { get; set; }
 public decimal LowestScore { get; set; }
    public decimal PassRate { get; set; }

    // Optional: integrity/proctoring aggregates
    public int? TotalFlaggedAttempts { get; set; }
    public decimal? AverageRiskScore { get; set; }

    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = null!;

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
}
