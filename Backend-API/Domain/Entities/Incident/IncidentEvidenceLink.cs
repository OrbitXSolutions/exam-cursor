using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Proctor;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Links evidence (proctor events or media) to an incident case.
/// Evidence links are append-only.
/// </summary>
public class IncidentEvidenceLink : BaseEntity
{
    public int Id { get; set; }

    public int IncidentCaseId { get; set; }

    // Link to Proctor Evidence or Event (either can be used)
    public int? ProctorEvidenceId { get; set; }
    public int? ProctorEventId { get; set; }

    /// <summary>
    /// Reviewer notes about this evidence
    /// </summary>
    public string? NoteEn { get; set; }
    public string? NoteAr { get; set; }

    /// <summary>
    /// Display order in the evidence list
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Who linked this evidence
    /// </summary>
    public string? LinkedBy { get; set; }
    public DateTime? LinkedAt { get; set; }

    // Navigation Properties
    public virtual IncidentCase IncidentCase { get; set; } = null!;
    public virtual ProctorEvidence? ProctorEvidence { get; set; }
    public virtual ProctorEvent? ProctorEvent { get; set; }
}
