namespace Smart_Core.Domain.Constants;

/// <summary>
/// Default constants for exam scheduling and behavior.
/// </summary>
public static class ExamDefaults
{
    /// <summary>
    /// Grace period (in minutes) after the scheduled start time for Fixed exams.
    /// Candidates can start within [StartAt, StartAt + GraceMinutes].
    /// </summary>
    public const int FixedStartGraceMinutes = 10;

    /// <summary>
    /// Maximum cumulative disconnect time (in seconds) before an attempt is auto-expired.
    /// </summary>
    public const int MaxDisconnectSeconds = 60;

    /// <summary>
    /// Heartbeat stale threshold (in seconds). If no heartbeat received within this window,
    /// the candidate is considered disconnected.
    /// </summary>
    public const int HeartbeatStaleThresholdSeconds = 45;
}
