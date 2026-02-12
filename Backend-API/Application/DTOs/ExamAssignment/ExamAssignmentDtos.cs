namespace Smart_Core.Application.DTOs.ExamAssignment;

// ── Candidate list item with assignment flags ───────────────────
public class AssignmentCandidateDto
{
    public string Id { get; set; } = string.Empty;
    public string? RollNo { get; set; }
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public bool IsActive { get; set; }
    public bool IsBlocked { get; set; }
    public bool ExamAssigned { get; set; }
    public bool ExamStarted { get; set; }
}

// ── Filter for candidate list ───────────────────────────────────
public class AssignmentCandidateFilterDto
{
    public int ExamId { get; set; }
    public DateTime ScheduleFrom { get; set; }
    public DateTime ScheduleTo { get; set; }
    public int? BatchId { get; set; }
    public string? Search { get; set; }
    public string? Status { get; set; }       // "Active" | "Blocked"
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ── Assign request ──────────────────────────────────────────────
public class AssignExamDto
{
    public int ExamId { get; set; }
    public DateTime ScheduleFrom { get; set; }
    public DateTime ScheduleTo { get; set; }
    public List<string>? CandidateIds { get; set; }
    public int? BatchId { get; set; }
    public bool ApplyToAllMatchingFilters { get; set; }
    // Filters for "apply to all" mode
    public string? Search { get; set; }
    public string? FilterStatus { get; set; }
}

// ── Unassign request ────────────────────────────────────────────
public class UnassignExamDto
{
    public int ExamId { get; set; }
    public List<string> CandidateIds { get; set; } = new();
}

// ── Result summary ──────────────────────────────────────────────
public class AssignmentResultDto
{
    public int TotalTargeted { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public List<AssignmentSkippedDto> SkippedDetails { get; set; } = new();
}

public class AssignmentSkippedDto
{
    public string CandidateId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
    public string Reason { get; set; } = string.Empty;
}
