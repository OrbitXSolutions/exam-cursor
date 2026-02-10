using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;
using Smart_Core.Domain.Entities.Lookups;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamSection : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    // Bilingual Title & Description (snapshot from Subject/Topic name if using Builder)
    public string TitleEn { get; set; } = null!;
    public string TitleAr { get; set; } = null!;

    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    public int Order { get; set; }

    // Optional: section-level duration/points
    public int? DurationMinutes { get; set; }
    public decimal? TotalPointsOverride { get; set; }

    // Builder fields - for generating questions from Question Bank
    public SectionSourceType? SourceType { get; set; }
    public int? QuestionSubjectId { get; set; }
    public int? QuestionTopicId { get; set; }
    public int PickCount { get; set; } = 0;

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual QuestionSubject? QuestionSubject { get; set; }
    public virtual QuestionTopic? QuestionTopic { get; set; }
    public virtual ICollection<ExamTopic> Topics { get; set; } = new List<ExamTopic>();
    public virtual ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
}
