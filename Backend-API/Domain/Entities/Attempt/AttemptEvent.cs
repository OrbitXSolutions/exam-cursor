using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Attempt;

/// <summary>
/// Audit log of events that occur during an exam attempt.
/// Events are append-only for integrity.
/// </summary>
public class AttemptEvent : BaseEntity
{
public int Id { get; set; }

 public int AttemptId { get; set; }

    public AttemptEventType EventType { get; set; }

    // Extra data (browser info, question id, timestamps, etc.)
    public string? MetadataJson { get; set; }

    public DateTime OccurredAt { get; set; }

  // Navigation Property
    public virtual Attempt Attempt { get; set; } = null!;
}
