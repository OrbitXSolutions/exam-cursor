using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.QuestionBank;

public class QuestionOption : BaseEntity
{
    public int Id { get; set; }

    // Relation
    public int QuestionId { get; set; }

    // Bilingual Option Content
    public string TextEn { get; set; } = null!;
    public string TextAr { get; set; } = null!;

    // Correctness
    public bool IsCorrect { get; set; }

    // Ordering
    public int Order { get; set; }

    // Optional attachment (image/pdf per option if needed later)
    public string? AttachmentPath { get; set; }

    // Navigation Property
    public virtual Question Question { get; set; } = null!;
}
