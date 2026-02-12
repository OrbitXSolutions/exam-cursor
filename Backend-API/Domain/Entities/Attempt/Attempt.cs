using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Attempt;

/// <summary>
/// Represents a candidate's attempt at an exam
/// </summary>
public class Attempt : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int ExamId { get; set; }
    public string CandidateId { get; set; } = null!;

    // Timing
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    // Status
    public AttemptStatus Status { get; set; }

    // Attempts tracking
    public int AttemptNumber { get; set; }

    // Scoring (filled after grading)
    public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }

    // Admin control fields
    public string? ForceSubmittedBy { get; set; }
    public DateTime? ForceSubmittedAt { get; set; }
    public int ExtraTimeSeconds { get; set; }
    public int ResumeCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceInfo { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;

    public virtual ICollection<AttemptQuestion> Questions { get; set; }
        = new List<AttemptQuestion>();

    public virtual ICollection<AttemptEvent> Events { get; set; }
    = new List<AttemptEvent>();
}
