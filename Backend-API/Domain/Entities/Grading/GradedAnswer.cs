using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Domain.Entities.Grading;

/// <summary>
/// Represents the grading result for a single answer within a grading session.
/// One record per (GradingSessionId, QuestionId).
/// </summary>
public class GradedAnswer : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int GradingSessionId { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }

    // Original answer reference (snapshot for audit)
    public string? SelectedOptionIdsJson { get; set; }
    public string? TextAnswer { get; set; }

    // Grading result
    public decimal Score { get; set; }
    public bool IsCorrect { get; set; }

    // Manual grading support
    public bool IsManuallyGraded { get; set; }
 public string? GraderComment { get; set; }

    // Navigation Properties
  public virtual GradingSession GradingSession { get; set; } = null!;
    public virtual Question Question { get; set; } = null!;
}
