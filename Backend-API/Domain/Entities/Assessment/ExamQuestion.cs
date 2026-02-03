using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.QuestionBank;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamQuestion : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public int ExamSectionId { get; set; }
    public int? ExamTopicId { get; set; }  // Optional topic within section

    public int QuestionId { get; set; }  // From QuestionBank

    public int Order { get; set; }

    // Allow overriding points per exam
    public decimal Points { get; set; }

    public bool IsRequired { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual ExamSection ExamSection { get; set; } = null!;
    public virtual ExamTopic? ExamTopic { get; set; }
    public virtual Question Question { get; set; } = null!;
}
