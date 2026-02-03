using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Grading;

/// <summary>
/// Represents a grading session for an exam attempt.
/// One grading session per attempt.
/// </summary>
public class GradingSession : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int AttemptId { get; set; }
    public string? GradedBy { get; set; }   // UserId (Instructor/Admin/System)

    // Status
    public GradingStatus Status { get; set; }

    // Summary
 public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }

    public DateTime? GradedAt { get; set; }

    // Navigation Properties
    public virtual Attempt.Attempt Attempt { get; set; } = null!;
    public virtual ApplicationUser? Grader { get; set; }

    public virtual ICollection<GradedAnswer> Answers { get; set; }
  = new List<GradedAnswer>();
}
