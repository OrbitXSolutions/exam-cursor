using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Lookups;

public class QuestionType : BaseEntity
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
}
