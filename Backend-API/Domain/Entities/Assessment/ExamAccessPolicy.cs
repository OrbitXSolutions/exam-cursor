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

    // Walk-in: anyone can self-register and take the exam via the share link
    public bool IsWalkIn { get; set; } = false;

    // Navigation Property
    public virtual Exam Exam { get; set; } = null!;
}
