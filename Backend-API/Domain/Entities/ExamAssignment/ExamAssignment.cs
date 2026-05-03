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

    public DateTimeOffset ScheduleFrom { get; set; }
    public DateTimeOffset ScheduleTo { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset AssignedAt { get; set; } = UaeTimeHelper.NowUae;
    public string? AssignedBy { get; set; }
}
