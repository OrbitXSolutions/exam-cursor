using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents a proctoring session for an exam attempt.
/// One session per attempt per mode (Soft/Advanced).
/// </summary>
public class ProctorSession : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string CandidateId { get; set; } = null!;

    // Session type
    public ProctorMode Mode { get; set; }

    // Timing
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    // Status
    public ProctorSessionStatus Status { get; set; }

    // Runtime fingerprint
    public string? DeviceFingerprint { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }

    // Browser/device info
    public string? BrowserName { get; set; }
    public string? BrowserVersion { get; set; }
    public string? OperatingSystem { get; set; }
    public string? ScreenResolution { get; set; }

    // Summary metrics (derived)
    public int TotalEvents { get; set; }
    public int TotalViolations { get; set; }

    // Risk score (0..100)
    public decimal? RiskScore { get; set; }

    // Last heartbeat tracking
    public DateTime? LastHeartbeatAt { get; set; }
    public int HeartbeatMissedCount { get; set; }

    // Proctor flags & warnings
    public bool IsFlagged { get; set; }
    public string? PendingWarningMessage { get; set; }
    public bool IsTerminatedByProctor { get; set; }
    public string? TerminationReason { get; set; }

    // Navigation Properties
    public virtual Attempt.Attempt Attempt { get; set; } = null!;
    public virtual Exam Exam { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;

    public virtual ICollection<ProctorEvent> Events { get; set; }
        = new List<ProctorEvent>();

    public virtual ICollection<ProctorEvidence> EvidenceItems { get; set; }
           = new List<ProctorEvidence>();

    public virtual ICollection<ProctorRiskSnapshot> RiskSnapshots { get; set; }
        = new List<ProctorRiskSnapshot>();

    public virtual ProctorDecision? Decision { get; set; }
}
