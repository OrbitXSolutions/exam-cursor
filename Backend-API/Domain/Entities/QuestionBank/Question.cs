using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.QuestionBank;

public class Question : BaseEntity
{
    public int Id { get; set; }

    // Bilingual Question Body
    public string BodyEn { get; set; } = null!;
    public string BodyAr { get; set; } = null!;

    // Optional explanation/hint for the question
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }

    // Lookups
    public int QuestionTypeId { get; set; }
    public int QuestionCategoryId { get; set; }

    // Scoring & Difficulty
    public decimal Points { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }

    // Status
    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public virtual Lookups.QuestionType QuestionType { get; set; } = null!;
    public virtual Lookups.QuestionCategory QuestionCategory { get; set; } = null!;

    // Collections
    public virtual ICollection<QuestionAttachment> Attachments { get; set; } = new List<QuestionAttachment>();
    public virtual ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();

    // One-to-Zero-or-One: AnswerKey (for ShortAnswer/Essay/Numeric types)
    public virtual QuestionAnswerKey? AnswerKey { get; set; }
}
