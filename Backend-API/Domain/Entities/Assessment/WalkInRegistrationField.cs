using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public enum WalkInFieldType
{
    Text = 1,
    Number = 2
}

public class WalkInRegistrationField : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    public string LabelEn { get; set; } = null!;

    public string LabelAr { get; set; } = null!;

    public WalkInFieldType FieldType { get; set; } = WalkInFieldType.Text;

    public bool IsRequired { get; set; } = false;

    public int DisplayOrder { get; set; } = 0;

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual ICollection<WalkInRegistrationAnswer> Answers { get; set; } = new List<WalkInRegistrationAnswer>();
}
