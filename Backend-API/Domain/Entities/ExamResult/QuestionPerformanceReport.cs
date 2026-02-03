using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Performance statistics for a specific question within an exam.
/// Used for question difficulty analysis.
/// </summary>
public class QuestionPerformanceReport : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public int QuestionId { get; set; }

    // Aggregates
    public int TotalAnswers { get; set; }
    public int CorrectAnswers { get; set; }
public int IncorrectAnswers { get; set; }
    public int UnansweredCount { get; set; }

    public decimal CorrectRate { get; set; }   // 0..1
    public decimal AverageScore { get; set; }
    public decimal MaxPoints { get; set; }

    // Difficulty index (CorrectRate - lower = harder)
    public decimal DifficultyIndex { get; set; }

    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = null!;

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual Question Question { get; set; } = null!;
}
