namespace Smart_Core.Domain.Common;

/// <summary>
/// Central helper for UAE timezone (Asia/Dubai = UTC+4, no DST).
/// All "current time" usage in the system must go through this helper.
/// DB stores datetimeoffset; the offset (+04:00) is visible in SSMS for reporting/debugging.
/// </summary>
public static class UaeTimeHelper
{
    /// <summary>Fixed UAE offset — UTC+4, no DST.</summary>
    public static readonly TimeSpan UaeOffset = TimeSpan.FromHours(4);

    /// <summary>Returns the current moment as a DateTimeOffset with +04:00 offset.</summary>
    public static DateTimeOffset NowUae => DateTimeOffset.UtcNow.ToOffset(UaeOffset);

    /// <summary>Converts a UTC DateTime to UAE DateTimeOffset (+04:00).</summary>
    public static DateTimeOffset ToUae(DateTime utcTime) =>
        new DateTimeOffset(DateTime.SpecifyKind(utcTime, DateTimeKind.Utc)).ToOffset(UaeOffset);

    /// <summary>Converts any DateTimeOffset to UAE DateTimeOffset (+04:00).</summary>
    public static DateTimeOffset ToUae(DateTimeOffset dt) =>
        dt.ToOffset(UaeOffset);
}
