using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents the final decision on a proctor session after review.
/// One decision per proctor session.
/// </summary>
public class ProctorDecision : BaseEntity
{
    public int Id { get; set; }

    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }

    public ProctorDecisionStatus Status { get; set; }

  public string? DecisionReasonEn { get; set; }
    public string? DecisionReasonAr { get; set; }

    // Additional notes for internal use
    public string? InternalNotes { get; set; }

    // Who decided
    public string? DecidedBy { get; set; }
    public DateTime? DecidedAt { get; set; }

    // Override tracking (if decision was changed)
  public ProctorDecisionStatus? PreviousStatus { get; set; }
    public string? OverriddenBy { get; set; }
    public DateTime? OverriddenAt { get; set; }
  public string? OverrideReason { get; set; }

    // Optional: link to incident case id
    public int? IncidentId { get; set; }

    // Is decision finalized (no more changes allowed except override)
    public bool IsFinalized { get; set; }

    // Navigation Properties
    public virtual ProctorSession ProctorSession { get; set; } = null!;
}
