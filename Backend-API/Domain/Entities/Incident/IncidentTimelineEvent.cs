using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Incident;

/// <summary>
/// Represents a timeline event in an incident case.
/// Timeline is append-only for audit purposes.
/// </summary>
public class IncidentTimelineEvent : BaseEntity
{
  public int Id { get; set; }

    public int IncidentCaseId { get; set; }

    public IncidentTimelineEventType EventType { get; set; }

    /// <summary>
    /// User who performed the action, or "System" for automated actions
    /// </summary>
    public string? ActorId { get; set; }
    public string? ActorName { get; set; }

 /// <summary>
    /// Event description
  /// </summary>
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    /// <summary>
    /// Additional context as JSON
    /// e.g., { "previousStatus": "Open", "newStatus": "InReview" }
    /// </summary>
    public string? MetadataJson { get; set; }

    public DateTime OccurredAt { get; set; }

    // Navigation Properties
    public virtual IncidentCase IncidentCase { get; set; } = null!;
}
