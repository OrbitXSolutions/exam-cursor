namespace Smart_Core.Application.DTOs.AttemptControl;

// ── Main enriched DTO per attempt row ────────────────────────
public class AttemptControlItemDto
{
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string? RollNo { get; set; }
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public int ExamId { get; set; }
    public string? ExamTitleEn { get; set; }
    public string? ExamTitleAr { get; set; }
    public DateTime StartedAt { get; set; }
    public int RemainingSeconds { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LastActivityAt { get; set; }
    public int ExtraTimeSeconds { get; set; }
    public int ResumeCount { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceInfo { get; set; }

    // Backend-computed action flags
    public bool CanForceEnd { get; set; }
    public bool CanResume { get; set; }
    public bool CanAddTime { get; set; }
}

// ── Filter DTO ───────────────────────────────────────────────
public class AttemptControlFilterDto
{
    public int? ExamId { get; set; }
    public int? BatchId { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }     // InProgress / Paused / All
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── Force End ────────────────────────────────────────────────
public class ForceEndAttemptDto
{
    public int AttemptId { get; set; }
    public string? Reason { get; set; }
}

public class ForceEndResultDto
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

// ── Resume ───────────────────────────────────────────────────
public class ResumeAttemptControlDto
{
    public int AttemptId { get; set; }
}

public class ResumeResultDto
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int RemainingSeconds { get; set; }
    public int ResumeCount { get; set; }
}

// ── Add Time ─────────────────────────────────────────────────
public class AddTimeDto
{
    public int AttemptId { get; set; }
    public int ExtraMinutes { get; set; }
    public string? Reason { get; set; }
}

public class AddTimeResultDto
{
    public int AttemptId { get; set; }
    public int RemainingSeconds { get; set; }
    public int TotalExtraTimeSeconds { get; set; }
}
