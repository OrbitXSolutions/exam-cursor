using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

/// <summary>
/// Topics under each Exam Section
/// </summary>
public class ExamTopic : BaseEntity
{
    public int Id { get; set; }
    public int ExamSectionId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int Order { get; set; }

    // Navigation properties
    public virtual ExamSection ExamSection { get; set; } = null!;
    public virtual ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
}
