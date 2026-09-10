using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Logs;

public class SystemLog
{
    public long Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public SystemLogLevel Level { get; set; }
    public LogCategory Category { get; set; }
    public string? UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public string? UserRole { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Controller { get; set; }
    public string? Endpoint { get; set; }
    public string? HttpMethod { get; set; }
    // Retained for schema compatibility; the logging pipeline never captures payloads.
    public string? RequestBody { get; set; }
    public int? ResponseStatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public string? ErrorMessage { get; set; }
    public string? StackTrace { get; set; }
    public string? ExceptionType { get; set; }
    public string? TraceId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public long? DurationMs { get; set; }
}
