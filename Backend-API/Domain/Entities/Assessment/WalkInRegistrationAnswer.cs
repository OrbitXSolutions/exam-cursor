using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public class WalkInRegistrationAnswer : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    /// <summary>
    /// FK to AspNetUsers (candidateId is a string GUID in Identity)
    /// </summary>
    public string CandidateId { get; set; } = null!;

    public int FieldId { get; set; }

    public string Value { get; set; } = string.Empty;

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual WalkInRegistrationField Field { get; set; } = null!;
}
