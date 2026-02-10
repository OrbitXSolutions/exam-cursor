using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Lookups;

public class QuestionTopic : BaseEntity
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;

    // FK to Subject (required)
    public int SubjectId { get; set; }

    // Navigation Properties
    public virtual QuestionSubject Subject { get; set; } = null!;
}
