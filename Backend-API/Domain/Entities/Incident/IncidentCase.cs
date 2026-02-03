using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Represents an incident case for review.
/// One active case per attempt is recommended.
/// </summary>
public class IncidentCase : BaseEntity
{
    public int Id { get; set; }

    // Links
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = null!;
    public int? ProctorSessionId { get; set; }

    // Case metadata
    public string CaseNumber { get; set; } = null!;
    public IncidentStatus Status { get; set; }
    public IncidentSeverity Severity { get; set; }
    public IncidentSource Source { get; set; }

public string TitleEn { get; set; } = null!;
    public string TitleAr { get; set; } = null!;

    public string? SummaryEn { get; set; }
    public string? SummaryAr { get; set; }

    // Risk snapshot at creation
    public decimal? RiskScoreAtCreate { get; set; }
    public int? TotalViolationsAtCreate { get; set; }

    // Assignment
    public string? AssignedTo { get; set; }
    public DateTime? AssignedAt { get; set; }

    // Resolution
    public IncidentOutcome? Outcome { get; set; }
    public string? ResolutionNoteEn { get; set; }
 public string? ResolutionNoteAr { get; set; }
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }

    // Closure
  public string? ClosedBy { get; set; }
    public DateTime? ClosedAt { get; set; }

    // Navigation Properties
    public virtual Exam Exam { get; set; } = null!;
    public virtual Attempt.Attempt Attempt { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;
    public virtual ProctorSession? ProctorSession { get; set; }
    public virtual ApplicationUser? Assignee { get; set; }

    public virtual ICollection<IncidentTimelineEvent> Timeline { get; set; }
        = new List<IncidentTimelineEvent>();

    public virtual ICollection<IncidentEvidenceLink> EvidenceLinks { get; set; }
   = new List<IncidentEvidenceLink>();

    public virtual ICollection<IncidentDecisionHistory> Decisions { get; set; }
        = new List<IncidentDecisionHistory>();

    public virtual ICollection<IncidentComment> Comments { get; set; }
        = new List<IncidentComment>();

    public virtual ICollection<AppealRequest> Appeals { get; set; }
        = new List<AppealRequest>();
}
