using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Represents a candidate's appeal against an incident decision.
/// </summary>
public class AppealRequest : BaseEntity
{
    public int Id { get; set; }

    public int IncidentCaseId { get; set; }
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = null!;

    /// <summary>
    /// Unique appeal reference number
    /// </summary>
    public string AppealNumber { get; set; } = null!;

    public AppealStatus Status { get; set; }

    /// <summary>
    /// Candidate's appeal message/reason
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// Optional: Additional supporting information
    /// </summary>
    public string? SupportingInfo { get; set; }

    /// <summary>
    /// When appeal was submitted
    /// </summary>
    public DateTime SubmittedAt { get; set; }

    // Review
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public string? DecisionNoteEn { get; set; }
    public string? DecisionNoteAr { get; set; }

    /// <summary>
    /// Internal notes (not visible to candidate)
    /// </summary>
    public string? InternalNotes { get; set; }

    // Navigation Properties
    public virtual IncidentCase IncidentCase { get; set; } = null!;
  public virtual Exam Exam { get; set; } = null!;
    public virtual Attempt.Attempt Attempt { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;
    public virtual ApplicationUser? Reviewer { get; set; }
}
