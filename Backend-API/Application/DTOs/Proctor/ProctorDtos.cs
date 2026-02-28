using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Proctor;

#region ProctorSession DTOs

/// <summary>
/// Full proctor session details
/// </summary>
public class ProctorSessionDto
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public ProctorMode Mode { get; set; }
    public string ModeName => Mode.ToString();
    public ProctorSessionStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? DeviceFingerprint { get; set; }
    public string? UserAgent { get; set; }
    public string? IpAddress { get; set; }
    public string? BrowserName { get; set; }
    public string? OperatingSystem { get; set; }
    public int TotalEvents { get; set; }
    public int TotalViolations { get; set; }
    public decimal? RiskScore { get; set; }
    public string RiskLevel => GetRiskLevel(RiskScore);
    public DateTime? LastHeartbeatAt { get; set; }
    public int HeartbeatMissedCount { get; set; }
    public bool IsFlagged { get; set; }
    public ProctorDecisionDto? Decision { get; set; }
    public List<ProctorEventDto> RecentEvents { get; set; } = new();

    private static string GetRiskLevel(decimal? score) => score switch
    {
        null => "Unknown",
        <= 20 => "Low",
        <= 50 => "Medium",
        <= 75 => "High",
        _ => "Critical"
    };
}

/// <summary>
/// Lightweight session for listing
/// </summary>
public class ProctorSessionListDto
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public ProctorMode Mode { get; set; }
    public string ModeName => Mode.ToString();
    public ProctorSessionStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime StartedAt { get; set; }
    public int TotalViolations { get; set; }
    public decimal? RiskScore { get; set; }
    public ProctorDecisionStatus? DecisionStatus { get; set; }
    public bool RequiresReview { get; set; }
    public bool IsFlagged { get; set; }
    public bool IsSample { get; set; }
    public bool IsTerminatedByProctor { get; set; }
    public string? TerminationReason { get; set; }
    public string? LatestSnapshotUrl { get; set; }
    public int SnapshotCount { get; set; }
    public DateTime? LastSnapshotAt { get; set; }
}

/// <summary>
/// Create proctor session request
/// </summary>
public class CreateProctorSessionDto
{
    public int AttemptId { get; set; }
    public ProctorMode Mode { get; set; }
    public string? DeviceFingerprint { get; set; }
    public string? UserAgent { get; set; }
    public string? BrowserName { get; set; }
    public string? BrowserVersion { get; set; }
    public string? OperatingSystem { get; set; }
    public string? ScreenResolution { get; set; }
}

/// <summary>
/// Session created response
/// </summary>
public class ProctorSessionCreatedDto
{
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public ProctorMode Mode { get; set; }
    public DateTime StartedAt { get; set; }
    public int HeartbeatIntervalSeconds { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Search proctor sessions
/// </summary>
public class ProctorSessionSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public ProctorMode? Mode { get; set; }
    public ProctorSessionStatus? Status { get; set; }
    public ProctorDecisionStatus? DecisionStatus { get; set; }
    public bool? RequiresReview { get; set; }
    public decimal? MinRiskScore { get; set; }
    public DateTime? StartedFrom { get; set; }
    public DateTime? StartedTo { get; set; }
    public bool IncludeSamples { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion

#region ProctorEvent DTOs

/// <summary>
/// Proctor event details
/// </summary>
public class ProctorEventDto
{
    public int Id { get; set; }
    public int ProctorSessionId { get; set; }
    public ProctorEventType EventType { get; set; }
    public string EventTypeName => EventType.ToString();
    public byte Severity { get; set; }
    public string SeverityLabel => GetSeverityLabel(Severity);
    public bool IsViolation { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime OccurredAt { get; set; }
    public int SequenceNumber { get; set; }

    private static string GetSeverityLabel(byte severity) => severity switch
    {
        0 => "Info",
        1 => "Low",
        2 => "Medium",
        3 => "High",
        4 => "Critical",
        5 => "Severe",
        _ => "Unknown"
    };
}

/// <summary>
/// Log proctor event request
/// </summary>
public class LogProctorEventDto
{
    public int ProctorSessionId { get; set; }
    public ProctorEventType EventType { get; set; }
    public byte Severity { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime? ClientTimestamp { get; set; }
}

/// <summary>
/// Bulk log events request
/// </summary>
public class BulkLogProctorEventsDto
{
    public int ProctorSessionId { get; set; }
    public List<LogProctorEventItemDto> Events { get; set; } = new();
}

/// <summary>
/// Single event in bulk log
/// </summary>
public class LogProctorEventItemDto
{
    public ProctorEventType EventType { get; set; }
    public byte Severity { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime? ClientTimestamp { get; set; }
}

/// <summary>
/// Heartbeat request
/// </summary>
public class HeartbeatDto
{
    public int ProctorSessionId { get; set; }
    public DateTime? ClientTimestamp { get; set; }
    public string? MetadataJson { get; set; }
}

/// <summary>
/// Heartbeat response
/// </summary>
public class HeartbeatResponseDto
{
    public bool Success { get; set; }
    public DateTime ServerTime { get; set; }
    public decimal? CurrentRiskScore { get; set; }
    public int TotalViolations { get; set; }
    public bool HasWarning { get; set; }
    public string? WarningMessage { get; set; }
}

#endregion

#region ProctorRiskRule DTOs

/// <summary>
/// Risk rule details
/// </summary>
public class ProctorRiskRuleDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public bool IsActive { get; set; }
    public ProctorEventType EventType { get; set; }
    public string EventTypeName => EventType.ToString();
    public int ThresholdCount { get; set; }
    public int WindowSeconds { get; set; }
    public decimal RiskPoints { get; set; }
    public byte? MinSeverity { get; set; }
    public int? MaxTriggers { get; set; }
    public int Priority { get; set; }
}

/// <summary>
/// Create/update risk rule
/// </summary>
public class SaveProctorRiskRuleDto
{
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public bool IsActive { get; set; }
    public ProctorEventType EventType { get; set; }
    public int ThresholdCount { get; set; }
    public int WindowSeconds { get; set; }
    public decimal RiskPoints { get; set; }
    public byte? MinSeverity { get; set; }
    public int? MaxTriggers { get; set; }
    public int Priority { get; set; }
}

#endregion

#region ProctorEvidence DTOs

/// <summary>
/// Evidence details
/// </summary>
public class ProctorEvidenceDto
{
    public int Id { get; set; }
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public EvidenceType Type { get; set; }
    public string TypeName => Type.ToString();
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileSizeFormatted => FormatFileSize(FileSize);
    public string? ContentType { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? DurationSeconds { get; set; }
    public bool IsUploaded { get; set; }
    public DateTime? UploadedAt { get; set; }
    public string? PreviewUrl { get; set; }
    public string? DownloadUrl { get; set; }

    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB" };
        int order = 0;
        double size = bytes;
        while (size >= 1024 && order < sizes.Length - 1)
        {
            order++;
            size /= 1024;
        }
        return $"{size:0.##} {sizes[order]}";
    }
}

/// <summary>
/// Upload evidence request
/// </summary>
public class UploadEvidenceDto
{
    public int ProctorSessionId { get; set; }
    public EvidenceType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? DurationSeconds { get; set; }
    public string? MetadataJson { get; set; }
}

/// <summary>
/// Evidence upload result
/// </summary>
public class EvidenceUploadResultDto
{
    public int EvidenceId { get; set; }
    public string UploadUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

#endregion

#region ProctorDecision DTOs

/// <summary>
/// Decision details
/// </summary>
public class ProctorDecisionDto
{
    public int Id { get; set; }
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public ProctorDecisionStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? DecisionReasonEn { get; set; }
    public string? DecisionReasonAr { get; set; }
    public string? DecidedBy { get; set; }
    public string? DeciderName { get; set; }
    public DateTime? DecidedAt { get; set; }
    public bool IsFinalized { get; set; }
    public ProctorDecisionStatus? PreviousStatus { get; set; }
    public bool WasOverridden => PreviousStatus.HasValue;
}

/// <summary>
/// Make decision request
/// </summary>
public class MakeDecisionDto
{
    public int ProctorSessionId { get; set; }
    public ProctorDecisionStatus Status { get; set; }
    public string? DecisionReasonEn { get; set; }
    public string? DecisionReasonAr { get; set; }
    public string? InternalNotes { get; set; }
    public bool Finalize { get; set; }
}

/// <summary>
/// Override decision request
/// </summary>
public class OverrideDecisionDto
{
    public int DecisionId { get; set; }
    public ProctorDecisionStatus NewStatus { get; set; }
    public string? OverrideReason { get; set; }
    public string? DecisionReasonEn { get; set; }
    public string? DecisionReasonAr { get; set; }
}

#endregion

#region Risk Calculation DTOs

/// <summary>
/// Risk calculation result
/// </summary>
public class RiskCalculationResultDto
{
    public int ProctorSessionId { get; set; }
    public decimal RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
    public int TotalViolations { get; set; }
    public List<TriggeredRuleDto> TriggeredRules { get; set; } = new();
    public Dictionary<string, int> EventBreakdown { get; set; } = new();
    public DateTime CalculatedAt { get; set; }
}

/// <summary>
/// Triggered rule info
/// </summary>
public class TriggeredRuleDto
{
    public int RuleId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public decimal RiskPoints { get; set; }
    public int TriggerCount { get; set; }
}

#endregion

#region Dashboard DTOs

/// <summary>
/// Proctor dashboard for admin
/// </summary>
public class ProctorDashboardDto
{
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int TotalSessions { get; set; }
    public int ActiveSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int HighRiskCount { get; set; }
    public int PendingReviewCount { get; set; }
    public int ClearedCount { get; set; }
    public int InvalidatedCount { get; set; }
    public decimal AverageRiskScore { get; set; }
    public List<EventTypeCountDto> TopViolations { get; set; } = new();
    public List<RiskDistributionDto> RiskDistribution { get; set; } = new();
}

/// <summary>
/// Event type count
/// </summary>
public class EventTypeCountDto
{
    public ProctorEventType EventType { get; set; }
    public string EventTypeName => EventType.ToString();
    public int Count { get; set; }
}

/// <summary>
/// Risk distribution bucket
/// </summary>
public class RiskDistributionDto
{
    public string Range { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// Real-time monitoring data
/// </summary>
public class LiveMonitoringDto
{
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public ProctorSessionStatus Status { get; set; }
    public decimal? RiskScore { get; set; }
    public int TotalViolations { get; set; }
    public DateTime? LastHeartbeatAt { get; set; }
    public bool IsOnline { get; set; }
    public ProctorEventDto? LastEvent { get; set; }
}

#endregion

#region Proctor Action DTOs

/// <summary>
/// Toggle flag on a session
/// </summary>
public class FlagSessionDto
{
    public bool Flagged { get; set; }
}

/// <summary>
/// Send warning to candidate
/// </summary>
public class SendWarningDto
{
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Terminate session with reason (also force-ends Attempt)
/// </summary>
public class TerminateSessionDto
{
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Candidate session status (polled by candidate exam page)
/// </summary>
public class CandidateSessionStatusDto
{
    public bool HasWarning { get; set; }
    public string? WarningMessage { get; set; }
    public bool IsTerminated { get; set; }
    public string? TerminationReason { get; set; }
}

#endregion

#region Triage / AI Assistant DTOs

/// <summary>
/// A single triage recommendation for the proctor assistant
/// </summary>
public class TriageRecommendationDto
{
    public int SessionId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public string ExamTitle { get; set; } = string.Empty;
    public decimal RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public int TotalViolations { get; set; }
    public string ReasonEn { get; set; } = string.Empty;
    public string ReasonAr { get; set; } = string.Empty;
}

#endregion
