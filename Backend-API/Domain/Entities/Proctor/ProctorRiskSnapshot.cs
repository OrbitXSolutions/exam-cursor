using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents a snapshot of the risk score at a point in time.
/// Used for auditing and tracking risk progression.
/// </summary>
public class ProctorRiskSnapshot : BaseEntity
{
  public int Id { get; set; }

public int ProctorSessionId { get; set; }

// Snapshot of computed score
    public decimal RiskScore { get; set; }

    // Summary counts at time of snapshot
    public int TotalEvents { get; set; }
    public int TotalViolations { get; set; }

    // Breakdown by event type (JSON)
    // e.g., { "TabSwitched": 3, "FullscreenExited": 1 }
    public string? EventBreakdownJson { get; set; }

    // Rules that triggered (JSON)
  // e.g., [{ "ruleId": 1, "points": 10 }, { "ruleId": 3, "points": 30 }]
    public string? TriggeredRulesJson { get; set; }

    public DateTime CalculatedAt { get; set; }
    public string CalculatedBy { get; set; } = null!;

    // Navigation Properties
    public virtual ProctorSession ProctorSession { get; set; } = null!;
}
