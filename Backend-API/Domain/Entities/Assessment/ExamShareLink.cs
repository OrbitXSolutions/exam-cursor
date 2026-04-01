using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Assessment;

public class ExamShareLink : BaseEntity
{
    public int Id { get; set; }

    public int ExamId { get; set; }
    public virtual Exam Exam { get; set; } = null!;

    /// <summary>
    /// Cryptographically random token used in the share URL
    /// </summary>
    public string ShareToken { get; set; } = string.Empty;

    /// <summary>
    /// Auto-expires when the exam EndAt passes (if set)
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    public bool IsActive { get; set; } = true;
}
