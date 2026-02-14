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
}
