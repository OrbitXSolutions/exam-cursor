using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Incident;

#region IncidentCase DTOs

/// <summary>
/// Full incident case details
/// </summary>
public class IncidentCaseDto
{
    public int Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int AttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string? CandidateEmail { get; set; }
    public int? ProctorSessionId { get; set; }
    public IncidentStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public IncidentSeverity Severity { get; set; }
  public string SeverityName => Severity.ToString();
  public IncidentSource Source { get; set; }
    public string SourceName => Source.ToString();
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? SummaryEn { get; set; }
    public string? SummaryAr { get; set; }
    public decimal? RiskScoreAtCreate { get; set; }
    public int? TotalViolationsAtCreate { get; set; }
    public string? AssignedTo { get; set; }
    public string? AssigneeName { get; set; }
    public DateTime? AssignedAt { get; set; }
    public IncidentOutcome? Outcome { get; set; }
  public string? OutcomeName => Outcome?.ToString();
    public string? ResolutionNoteEn { get; set; }
    public string? ResolvedBy { get; set; }
    public string? ResolverName { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
public List<IncidentTimelineEventDto> Timeline { get; set; } = new();
    public List<IncidentEvidenceLinkDto> EvidenceLinks { get; set; } = new();
    public List<IncidentDecisionHistoryDto> Decisions { get; set; } = new();
 public int CommentCount { get; set; }
    public int AppealCount { get; set; }
}

/// <summary>
/// Lightweight case for listing
/// </summary>
public class IncidentCaseListDto
{
    public int Id { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public IncidentStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public IncidentSeverity Severity { get; set; }
    public string SeverityName => Severity.ToString();
    public IncidentSource Source { get; set; }
 public string TitleEn { get; set; } = string.Empty;
    public decimal? RiskScoreAtCreate { get; set; }
    public string? AssigneeName { get; set; }
    public IncidentOutcome? Outcome { get; set; }
 public DateTime CreatedAt { get; set; }
    public bool HasPendingAppeal { get; set; }
}

/// <summary>
/// Create incident case request
/// </summary>
public class CreateIncidentCaseDto
{
    public int AttemptId { get; set; }
    public int? ProctorSessionId { get; set; }
    public IncidentSource Source { get; set; }
public IncidentSeverity Severity { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? SummaryEn { get; set; }
public string? SummaryAr { get; set; }
}

/// <summary>
/// Update incident case request
/// </summary>
public class UpdateIncidentCaseDto
{
    public int Id { get; set; }
public IncidentSeverity? Severity { get; set; }
    public string? TitleEn { get; set; }
    public string? TitleAr { get; set; }
    public string? SummaryEn { get; set; }
    public string? SummaryAr { get; set; }
}

/// <summary>
/// Search incident cases
/// </summary>
public class IncidentCaseSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public IncidentStatus? Status { get; set; }
    public IncidentSeverity? Severity { get; set; }
    public IncidentSource? Source { get; set; }
 public IncidentOutcome? Outcome { get; set; }
    public string? AssignedTo { get; set; }
    public bool? Unassigned { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// Assign case request
/// </summary>
public class AssignCaseDto
{
    public int CaseId { get; set; }
    public string AssigneeId { get; set; } = string.Empty;
}

/// <summary>
/// Change status request
/// </summary>
public class ChangeStatusDto
{
    public int CaseId { get; set; }
    public IncidentStatus NewStatus { get; set; }
    public string? Reason { get; set; }
}

#endregion

#region Timeline DTOs

/// <summary>
/// Timeline event details
/// </summary>
public class IncidentTimelineEventDto
{
    public int Id { get; set; }
    public IncidentTimelineEventType EventType { get; set; }
    public string EventTypeName => EventType.ToString();
    public string? ActorId { get; set; }
    public string? ActorName { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string? MetadataJson { get; set; }
    public DateTime OccurredAt { get; set; }
}

#endregion

#region Evidence DTOs

/// <summary>
/// Evidence link details
/// </summary>
public class IncidentEvidenceLinkDto
{
    public int Id { get; set; }
    public int? ProctorEvidenceId { get; set; }
    public int? ProctorEventId { get; set; }
    public string EvidenceType { get; set; } = string.Empty;
    public string? EvidenceDescription { get; set; }
    public string? PreviewUrl { get; set; }
    public string? NoteEn { get; set; }
    public string? NoteAr { get; set; }
    public int Order { get; set; }
    public string? LinkedBy { get; set; }
    public DateTime? LinkedAt { get; set; }
}

/// <summary>
/// Link evidence request
/// </summary>
public class LinkEvidenceDto
{
    public int CaseId { get; set; }
    public int? ProctorEvidenceId { get; set; }
    public int? ProctorEventId { get; set; }
    public string? NoteEn { get; set; }
    public string? NoteAr { get; set; }
}

#endregion

#region Decision DTOs

/// <summary>
/// Decision history entry
/// </summary>
public class IncidentDecisionHistoryDto
{
    public int Id { get; set; }
    public IncidentOutcome Outcome { get; set; }
 public string OutcomeName => Outcome.ToString();
    public string? ReasonEn { get; set; }
    public string? ReasonAr { get; set; }
    public string DecidedBy { get; set; } = string.Empty;
    public string? DeciderName { get; set; }
    public DateTime DecidedAt { get; set; }
    public decimal? RiskScoreAtDecision { get; set; }
    public bool IsAppealDecision { get; set; }
}

/// <summary>
/// Record decision request
/// </summary>
public class RecordDecisionDto
{
    public int CaseId { get; set; }
    public IncidentOutcome Outcome { get; set; }
    public string? ReasonEn { get; set; }
    public string? ReasonAr { get; set; }
    public string? InternalNotes { get; set; }
    public bool CloseCase { get; set; }
}

#endregion

#region Comment DTOs

/// <summary>
/// Comment details
/// </summary>
public class IncidentCommentDto
{
    public int Id { get; set; }
 public string AuthorId { get; set; } = string.Empty;
    public string? AuthorName { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsVisibleToCandidate { get; set; }
    public bool IsEdited { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
}

/// <summary>
/// Add comment request
/// </summary>
public class AddCommentDto
{
  public int CaseId { get; set; }
    public string Body { get; set; } = string.Empty;
    public bool IsVisibleToCandidate { get; set; }
}

/// <summary>
/// Edit comment request
/// </summary>
public class EditCommentDto
{
    public int CommentId { get; set; }
    public string Body { get; set; } = string.Empty;
}

#endregion

#region Appeal DTOs

/// <summary>
/// Appeal request details
/// </summary>
public class AppealRequestDto
{
    public int Id { get; set; }
    public string AppealNumber { get; set; } = string.Empty;
  public int IncidentCaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public AppealStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string Message { get; set; } = string.Empty;
    public string? SupportingInfo { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? DecisionNoteEn { get; set; }
    public string? DecisionNoteAr { get; set; }
    public IncidentOutcome? OriginalOutcome { get; set; }
}

/// <summary>
/// Lightweight appeal for listing
/// </summary>
public class AppealRequestListDto
{
    public int Id { get; set; }
    public string AppealNumber { get; set; } = string.Empty;
    public string CaseNumber { get; set; } = string.Empty;
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
  public AppealStatus Status { get; set; }
  public string StatusName => Status.ToString();
    public DateTime SubmittedAt { get; set; }
    public string? ReviewerName { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

/// <summary>
/// Submit appeal request (candidate)
/// </summary>
public class SubmitAppealDto
{
    public int IncidentCaseId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? SupportingInfo { get; set; }
}

/// <summary>
/// Review appeal request (admin/reviewer)
/// </summary>
public class ReviewAppealDto
{
    public int AppealId { get; set; }
    public AppealStatus Decision { get; set; }
    public string? DecisionNoteEn { get; set; }
    public string? DecisionNoteAr { get; set; }
    public string? InternalNotes { get; set; }
public IncidentOutcome? NewOutcome { get; set; }
}

/// <summary>
/// Search appeals
/// </summary>
public class AppealSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public AppealStatus? Status { get; set; }
  public DateTime? SubmittedFrom { get; set; }
    public DateTime? SubmittedTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion

#region Dashboard DTOs

/// <summary>
/// Incident dashboard
/// </summary>
public class IncidentDashboardDto
{
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int TotalCases { get; set; }
    public int OpenCases { get; set; }
    public int InReviewCases { get; set; }
    public int ResolvedCases { get; set; }
    public int ClosedCases { get; set; }
    public int UnassignedCases { get; set; }
    public int CriticalSeverityCases { get; set; }
    public int HighSeverityCases { get; set; }
    public int ClearedCount { get; set; }
    public int SuspiciousCount { get; set; }
    public int InvalidatedCount { get; set; }
    public int EscalatedCount { get; set; }
    public int PendingAppeals { get; set; }
    public List<ReviewerWorkloadDto> ReviewerWorkload { get; set; } = new();
    public List<SeverityDistributionDto> SeverityDistribution { get; set; } = new();
}

/// <summary>
/// Reviewer workload
/// </summary>
public class ReviewerWorkloadDto
{
    public string ReviewerId { get; set; } = string.Empty;
    public string ReviewerName { get; set; } = string.Empty;
    public int AssignedCases { get; set; }
    public int ResolvedCases { get; set; }
}

/// <summary>
/// Severity distribution
/// </summary>
public class SeverityDistributionDto
{
    public IncidentSeverity Severity { get; set; }
    public string SeverityName => Severity.ToString();
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

/// <summary>
/// Candidate's view of their incident/appeal status
/// </summary>
public class CandidateIncidentStatusDto
{
    public int IncidentCaseId { get; set; }
    public string CaseNumber { get; set; } = string.Empty;
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
 public IncidentStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public IncidentOutcome? Outcome { get; set; }
    public string? OutcomeName => Outcome?.ToString();
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public bool CanAppeal { get; set; }
    public AppealRequestDto? ActiveAppeal { get; set; }
}

#endregion
