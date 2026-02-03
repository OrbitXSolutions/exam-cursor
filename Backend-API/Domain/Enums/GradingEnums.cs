namespace Smart_Core.Domain.Enums;

/// <summary>
/// Represents the status of a grading session
/// </summary>
public enum GradingStatus : byte
{
    /// <summary>
    /// Grading session created but not yet processed
    /// </summary>
    Pending = 1,

    /// <summary>
  /// All questions were auto-graded successfully
    /// </summary>
    AutoGraded = 2,

    /// <summary>
    /// Some questions require manual grading (e.g., Essay)
    /// </summary>
    ManualRequired = 3,

    /// <summary>
    /// All grading is complete (auto + manual)
    /// </summary>
    Completed = 4
}
