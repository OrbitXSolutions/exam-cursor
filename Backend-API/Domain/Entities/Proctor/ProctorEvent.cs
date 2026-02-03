using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents a single proctoring event during an exam session.
/// Events are append-only and cannot be modified.
/// </summary>
public class ProctorEvent : BaseEntity
{
    public int Id { get; set; }

    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }

    // Event classification
  public ProctorEventType EventType { get; set; }

    // Severity (0-5, where 5 is most severe)
    public byte Severity { get; set; }

    // Is this event considered a violation?
    public bool IsViolation { get; set; }

    // JSON metadata (context-specific data)
    // e.g., { "tabCount": 3, "windowTitle": "Google", "duration": 5000 }
    public string? MetadataJson { get; set; }

    // Client-reported timestamp
    public DateTime ClientTimestamp { get; set; }

    // Server timestamp (source of truth)
    public DateTime OccurredAt { get; set; }

    // Optional: sequence number for ordering
    public int SequenceNumber { get; set; }

    // Navigation Properties
    public virtual ProctorSession ProctorSession { get; set; } = null!;
}
