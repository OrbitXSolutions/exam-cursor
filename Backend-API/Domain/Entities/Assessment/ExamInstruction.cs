using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamInstruction : BaseEntity
{
  public int Id { get; set; }

    public int ExamId { get; set; }

    // Bilingual Content (HTML or plain text)
    public string ContentEn { get; set; } = null!;
public string ContentAr { get; set; } = null!;

    public int Order { get; set; }

    // Navigation Property
    public virtual Exam Exam { get; set; } = null!;
}
