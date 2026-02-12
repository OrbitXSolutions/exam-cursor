using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.CandidateExamDetails;

// ── Query DTO ──────────────────────────────────────────────────────────────────

/// <summary>
/// Query parameters for the candidate exam details endpoint
/// </summary>
public class CandidateExamDetailsQueryDto
{
    public string CandidateId { get; set; } = null!;
    public int ExamId { get; set; }
    public int? AttemptId { get; set; }
    public int ScreenshotLimit { get; set; } = 50;
}

// ── Main Response ──────────────────────────────────────────────────────────────

/// <summary>
/// Full enriched response for the Candidate Exam Details page.
/// Contains ALL data in a single DTO — no extra API calls needed.
/// </summary>
public class CandidateExamDetailsDto
{
    // ── Candidate ──
    public ExamDetailsCandidateDto Candidate { get; set; } = null!;

    // ── Exam ──
    public ExamDetailsExamDto Exam { get; set; } = null!;

    // ── Selected Attempt (null if no attempts exist) ──
    public ExamDetailsAttemptDto? AttemptSummary { get; set; }

    // ── Assignment (null if not assigned) ──
    public ExamDetailsAssignmentDto? Assignment { get; set; }

    // ── Proctor Session Summary (null if no proctor session) ──
    public ExamDetailsProctorDto? Proctor { get; set; }

    // ── Event Logs (formatted for shared AttemptEventLog component) ──
    public List<ExamDetailsEventDto> EventLogs { get; set; } = new();

    // ── All Attempts for attempt switching ──
    public List<ExamDetailsAttemptBriefDto> AttemptsList { get; set; } = new();

    // ── State ──
    public bool HasAttempts { get; set; }

    // ── Computed Admin Action Flags ──
    public bool CanForceEnd { get; set; }
    public bool CanResume { get; set; }
    public bool CanAddTime { get; set; }

    // ── Result Information (for navigation links) ──
    public ExamDetailsResultInfoDto? ResultInfo { get; set; }
}

// ── Nested DTOs ────────────────────────────────────────────────────────────────

public class ExamDetailsCandidateDto
{
    public string CandidateId { get; set; } = null!;
    public string FullName { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string? RollNo { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public bool IsBlocked { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class ExamDetailsExamDto
{
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string? TitleAr { get; set; }
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public bool RequireProctoring { get; set; }
    public int MaxAttempts { get; set; }
}

public class ExamDetailsAttemptDto
{
    public int AttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public AttemptStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int TotalDurationSeconds { get; set; }
    public int RemainingSeconds { get; set; }
    public int ExtraTimeSeconds { get; set; }
    public int ResumeCount { get; set; }
    public DateTime? LastActivityAt { get; set; }
    public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }
    public string? ForceSubmittedBy { get; set; }
    public DateTime? ForceSubmittedAt { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceInfo { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
}

public class ExamDetailsAssignmentDto
{
    public DateTime? ScheduleFrom { get; set; }
    public DateTime? ScheduleTo { get; set; }
    public DateTime AssignedAt { get; set; }
    public string? AssignedBy { get; set; }
    public bool IsActive { get; set; }
}

public class ExamDetailsProctorDto
{
    public int SessionId { get; set; }
    public string ModeName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public int TotalEvents { get; set; }
    public int TotalViolations { get; set; }
    public decimal? RiskScore { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public DateTime? LastHeartbeatAt { get; set; }
    public string? DecisionStatus { get; set; }
    public string? DecisionNotes { get; set; }

    // Video evidence (first video/screen recording)
    public ExamDetailsEvidenceItemDto? Video { get; set; }

    // Screenshots (limited, latest first)
    public List<ExamDetailsEvidenceItemDto> Screenshots { get; set; } = new();
    public int TotalScreenshots { get; set; }
}

public class ExamDetailsEvidenceItemDto
{
    public int Id { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public DateTime? CapturedAt { get; set; }
    public int? DurationSeconds { get; set; }
    public bool IsUploaded { get; set; }
}

/// <summary>
/// Event log entry — matches the shape expected by the shared AttemptEventLog component.
/// </summary>
public class ExamDetailsEventDto
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int EventType { get; set; }
    public string EventTypeName { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public DateTime OccurredAt { get; set; }

    // Enrichment fields for AnswerSaved events
    public string? QuestionTextEn { get; set; }
    public string? QuestionTextAr { get; set; }
    public string? AnswerSummary { get; set; }
}

public class ExamDetailsAttemptBriefDto
{
    public int AttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public AttemptStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }
}

public class ExamDetailsResultInfoDto
{
    public int? ResultId { get; set; }
    public bool IsFinalized { get; set; }
    public bool IsPublished { get; set; }
    public int? GradingSessionId { get; set; }
    public int? CertificateId { get; set; }
}

// ── Candidate Exams Dropdown ───────────────────────────────────────────────────

/// <summary>
/// Lightweight DTO for the "exams for this candidate" dropdown.
/// </summary>
public class CandidateExamBriefDto
{
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string? TitleAr { get; set; }
    public int TotalAttempts { get; set; }
    public DateTime LastAttemptAt { get; set; }
}
