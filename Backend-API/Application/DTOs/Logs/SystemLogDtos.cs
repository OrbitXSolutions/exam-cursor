using System.ComponentModel.DataAnnotations;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Logs;

public class SystemLogFilterDto
{
    [EnumDataType(typeof(SystemLogLevel))]
    public SystemLogLevel? Level { get; set; }
    [StringLength(256)]
    public string? Search { get; set; }
    [StringLength(256)]
    public string? Action { get; set; }
    [StringLength(512)]
    public string? Endpoint { get; set; }
    [Range(100, 599)]
    public int? StatusCode { get; set; }
    [StringLength(450)]
    public string? UserId { get; set; }
    public DateTimeOffset? DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }
    [Range(1, 1000000)]
    public int PageNumber { get; set; } = 1;
    [Range(1, 100)]
    public int PageSize { get; set; } = 50;
}

public class AppLogFilterDto
{
    [RegularExpression("^(Information|Info|Warning|Error|Fatal|Critical)$")]
    public string? Level { get; set; }
    [StringLength(256)]
    public string? Search { get; set; }
    public DateTimeOffset? DateFrom { get; set; }
    public DateTimeOffset? DateTo { get; set; }
    [Range(1, 1000000)]
    public int PageNumber { get; set; } = 1;
    [Range(1, 100)]
    public int PageSize { get; set; } = 50;
}

public class SystemLogDto
{
    public long Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public string? UserRole { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Controller { get; set; }
    public string? Endpoint { get; set; }
    public string? HttpMethod { get; set; }
    public int? ResponseStatusCode { get; set; }
    public string? ErrorMessage { get; set; }
    public string? TraceId { get; set; }
    public string? IpAddress { get; set; }
    public long? DurationMs { get; set; }
}

public class SystemLogDetailDto : SystemLogDto
{
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
    public string? StackTrace { get; set; }
    public string? ExceptionType { get; set; }
    public string? UserAgent { get; set; }
}

public class SystemLogStatsDto
{
    public int CandidateCount { get; set; }
    public int ProctorCount { get; set; }
    public int UserCount { get; set; }
    public int DeveloperCount { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
    public int TodayCount { get; set; }
}

public class AppLogEntryDto
{
    public long Id { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public DateTimeOffset TimeStamp { get; set; }
    public string? UserId { get; set; }
    public string? RequestPath { get; set; }
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
    public string? RequestMethod { get; set; }
    public string? StatusCode { get; set; }
    public string? ElapsedMs { get; set; }
}

public class AppErrorEntryDto
{
    public long Id { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Exception { get; set; }
    public DateTimeOffset TimeStamp { get; set; }
    public string? UserId { get; set; }
    public string? ExceptionMessage { get; set; }
    public string? ExceptionType { get; set; }
    public string? InnerException { get; set; }
    public string? Endpoint { get; set; }
    public string? RequestId { get; set; }
    public string? MachineName { get; set; }
    public string? EnvironmentName { get; set; }
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
}
