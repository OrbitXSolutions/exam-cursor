using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Tracks decision history for an incident case.
/// The latest decision is the effective outcome.
/// </summary>
public class IncidentDecisionHistory : BaseEntity
{
    public int Id { get; set; }

  public int IncidentCaseId { get; set; }

    public IncidentOutcome Outcome { get; set; }

public string? ReasonEn { get; set; }
    public string? ReasonAr { get; set; }

    /// <summary>
    /// Internal notes (not visible to candidate)
    /// </summary>
    public string? InternalNotes { get; set; }

    public string DecidedBy { get; set; } = null!;
    public DateTime DecidedAt { get; set; }

    /// <summary>
    /// Snapshot of risk score at time of decision
    /// </summary>
    public decimal? RiskScoreAtDecision { get; set; }

    /// <summary>
    /// Whether this decision was made via appeal
    /// </summary>
    public bool IsAppealDecision { get; set; }
    public int? AppealRequestId { get; set; }

    // Navigation Properties
    public virtual IncidentCase IncidentCase { get; set; } = null!;
    public virtual AppealRequest? AppealRequest { get; set; }
}
