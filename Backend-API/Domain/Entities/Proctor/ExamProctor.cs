using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Junction entity that assigns a Proctor user to a specific Exam.
/// One record per (ExamId, ProctorId) pair.
/// </summary>
public class ExamProctor : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public virtual Exam Exam { get; set; } = null!;

    public string ProctorId { get; set; } = null!;
    public virtual ApplicationUser Proctor { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public string? AssignedBy { get; set; }
}
