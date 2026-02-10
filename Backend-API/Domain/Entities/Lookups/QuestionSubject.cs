using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Lookups;

public class QuestionSubject : BaseEntity
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;

    // Navigation Properties
    public virtual ICollection<QuestionTopic> Topics { get; set; } = new List<QuestionTopic>();
}
