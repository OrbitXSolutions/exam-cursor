using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamSection : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    // Bilingual Title & Description
    public string TitleEn { get; set; } = null!;
    public string TitleAr { get; set; } = null!;

    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    public int Order { get; set; }

    // Optional: section-level duration/points
    public int? DurationMinutes { get; set; }
    public decimal? TotalPointsOverride { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual ICollection<ExamTopic> Topics { get; set; } = new List<ExamTopic>();
    public virtual ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
}
