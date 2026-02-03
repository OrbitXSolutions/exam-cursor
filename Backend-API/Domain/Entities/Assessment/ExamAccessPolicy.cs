using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamAccessPolicy : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }

    public bool IsPublic { get; set; }

    // Optional access code
    public string? AccessCode { get; set; }

    // Optional: allow only specific users/groups later
    public bool RestrictToAssignedCandidates { get; set; }

    // Navigation Property
    public virtual Exam Exam { get; set; } = null!;
}
