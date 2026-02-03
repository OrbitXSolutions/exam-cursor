using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Represents the final result of an exam attempt.
/// One result per attempt, generated after grading is complete.
/// </summary>
public class Result : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = null!;

    // Summary
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
  public decimal PassScore { get; set; }
    public bool IsPassed { get; set; }

  // Optional: grade/band (A, B, C...) if needed
    public string? GradeLabel { get; set; }

    // Publishing control
    public bool IsPublishedToCandidate { get; set; }
    public DateTime? PublishedAt { get; set; }
  public string? PublishedBy { get; set; }

    // Audit (when result was finalized)
    public DateTime FinalizedAt { get; set; }

    // Navigation Properties
public virtual Exam Exam { get; set; } = null!;
    public virtual Attempt.Attempt Attempt { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;
}
