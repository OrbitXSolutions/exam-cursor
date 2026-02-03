using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Defines a rule for calculating risk score based on proctor events.
/// Rules are configurable and can be enabled/disabled.
/// </summary>
public class ProctorRiskRule : BaseEntity
{
    public int Id { get; set; }

    public string NameEn { get; set; } = null!;
    public string NameAr { get; set; } = null!;

    public string? DescriptionEn { get; set; }
 public string? DescriptionAr { get; set; }

    public bool IsActive { get; set; }

  // Match events by type
    public ProctorEventType EventType { get; set; }

    // Threshold logic
    /// <summary>
    /// Number of events required to trigger this rule
    /// </summary>
    public int ThresholdCount { get; set; }

    /// <summary>
    /// Time window in seconds to count events (0 = no window, count all)
    /// </summary>
    public int WindowSeconds { get; set; }

    /// <summary>
    /// Risk points added when rule is triggered (0-100)
  /// </summary>
    public decimal RiskPoints { get; set; }

    /// <summary>
    /// Minimum severity level to count the event (null = count all)
    /// </summary>
    public byte? MinSeverity { get; set; }

    /// <summary>
    /// Maximum times this rule can trigger per session (null = unlimited)
    /// </summary>
    public int? MaxTriggers { get; set; }

    /// <summary>
    /// Priority for rule evaluation (lower = higher priority)
    /// </summary>
    public int Priority { get; set; }

  /// <summary>
    /// Optional: Additional rule configuration as JSON
    /// </summary>
    public string? RuleConfigJson { get; set; }
}
