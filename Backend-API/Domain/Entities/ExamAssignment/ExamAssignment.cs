using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Domain.Entities.ExamAssignment;

public class ExamAssignment : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public virtual Exam Exam { get; set; } = null!;

    public string CandidateId { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;

    public DateTime ScheduleFrom { get; set; }
    public DateTime ScheduleTo { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public string? AssignedBy { get; set; }
}
