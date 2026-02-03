using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Attempt;

/// <summary>
/// Represents a candidate's answer to a question within an attempt.
/// One record per (AttemptId, QuestionId).
/// </summary>
public class AttemptAnswer : BaseEntity
{
    public int Id { get; set; }

    public int AttemptId { get; set; }
    public int AttemptQuestionId { get; set; }
    public int QuestionId { get; set; }

    // For MCQ / TrueFalse - stores JSON array of selected option IDs e.g. [1,3]
    public string? SelectedOptionIdsJson { get; set; }

    // For ShortAnswer / Essay
    public string? TextAnswer { get; set; }

    // Grading result (set by Grading Module)
    public bool? IsCorrect { get; set; }
    public decimal? Score { get; set; }

    public DateTime? AnsweredAt { get; set; }

    // Navigation Properties
    public virtual Attempt Attempt { get; set; } = null!;
  public virtual AttemptQuestion AttemptQuestion { get; set; } = null!;
}
