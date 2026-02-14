namespace Smart_Core.Application.DTOs.ExamOperations;

// ── Request DTOs ───────────────────────────────────────

public class AllowNewAttemptDto
{
    public string CandidateId { get; set; } = null!;
    public int ExamId { get; set; }
    public string Reason { get; set; } = null!;
}

public class OperationAddTimeDto
{
    public int AttemptId { get; set; }
    public int ExtraMinutes { get; set; }
    public string Reason { get; set; } = null!;
}

public class TerminateAttemptDto
{
    public int AttemptId { get; set; }
    public string Reason { get; set; } = null!;
}

public class ResumeAttemptOperationDto
{
    public int AttemptId { get; set; }
    public string? Reason { get; set; }
}

// ── Result DTOs ────────────────────────────────────────

public class AllowNewAttemptResultDto
{
    public int OverrideId { get; set; }
    public string CandidateId { get; set; } = null!;
    public int ExamId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class OperationAddTimeResultDto
{
    public int AttemptId { get; set; }
    public int RemainingSeconds { get; set; }
    public int TotalExtraTimeSeconds { get; set; }
}

public class TerminateAttemptResultDto
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class ResumeAttemptOperationResultDto
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RemainingSeconds { get; set; }
}

// ── Query/List DTOs ────────────────────────────────────

public class ExamOperationsCandidateDto
{
    public string CandidateId { get; set; } = null!;
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string? Email { get; set; }
    public string? RollNo { get; set; }
    public int ExamId { get; set; }
    public string? ExamTitleEn { get; set; }
    public string? ExamTitleAr { get; set; }
    public int TotalAttempts { get; set; }
    public int MaxAttempts { get; set; }
    public string? LatestAttemptStatus { get; set; }
    public int? LatestAttemptId { get; set; }
    public DateTime? LatestAttemptStartedAt { get; set; }
    public bool HasActiveAttempt { get; set; }
    public int PendingOverrides { get; set; }
    // Action flags
    public bool CanAllowNewAttempt { get; set; }
    public bool CanAddTime { get; set; }
    public bool CanTerminate { get; set; }
}

public class ExamOperationsFilterDto
{
    public int? ExamId { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── Audit log DTO (for reading) ───────────────────────

public class AdminOperationLogDto
{
    public int Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActorUserId { get; set; } = string.Empty;
    public string? ActorName { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public int ExamId { get; set; }
    public string? ExamTitle { get; set; }
    public int? OldAttemptId { get; set; }
    public int? NewAttemptId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? TraceId { get; set; }
}
