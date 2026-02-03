namespace Smart_Core.Domain.Enums;

/// <summary>
/// Exam scheduling type
/// </summary>
public enum ExamType : byte
{
    /// <summary>
    /// Flex exam - Candidate can start anytime within the availability window (StartAt to EndAt).
    /// The exam duration starts when the candidate begins.
    /// </summary>
    Flex = 0,

    /// <summary>
    /// Fixed exam - All candidates must start at the exact StartAt time.
    /// The exam ends at StartAt + DurationMinutes for everyone.
    /// </summary>
    Fixed = 1
}
