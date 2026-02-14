using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Attempt;

/// <summary>
/// Records an admin-granted override allowing a candidate to take
/// an additional attempt beyond the exam's MaxAttempts limit.
/// Does NOT modify exam configuration. Per-candidate only.
/// </summary>
public class AdminAttemptOverride : BaseEntity
{
    public int Id { get; set; }
    public string CandidateId { get; set; } = null!;
    public int ExamId { get; set; }

    /// <summary>Admin user who granted the override</summary>
    public string GrantedBy { get; set; } = null!;

    /// <summary>Mandatory reason for audit trail</summary>
    public string Reason { get; set; } = null!;

    public DateTime GrantedAt { get; set; }

    /// <summary>Whether the candidate has used this override to start a new attempt</summary>
    public bool IsUsed { get; set; }

    /// <summary>The attempt ID created when the candidate used this override</summary>
    public int? UsedAttemptId { get; set; }

    public DateTime? UsedAt { get; set; }

    // Navigation
    public virtual ApplicationUser Candidate { get; set; } = null!;
    public virtual Assessment.Exam Exam { get; set; } = null!;
    public virtual Attempt? UsedAttempt { get; set; }
}
