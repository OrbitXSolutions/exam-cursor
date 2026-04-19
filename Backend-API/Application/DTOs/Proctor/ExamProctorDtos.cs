namespace Smart_Core.Application.DTOs.Proctor;

// ── Proctor item returned in the page ─────────────────────────
public class ExamProctorItemDto
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? FullName { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool IsAssigned { get; set; }
    public DateTime? AssignedAt { get; set; }
}

// ── Combined page response (single GET) ───────────────────────
public class ExamProctorPageDto
{
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public List<ExamProctorItemDto> AssignedProctors { get; set; } = new();
    public List<ExamProctorItemDto> AvailableProctors { get; set; } = new();
}

// ── Assign request ─────────────────────────────────────────────
public class AssignProctorToExamDto
{
    public int ExamId { get; set; }
    public List<string> ProctorIds { get; set; } = new();
}

// ── Unassign request ───────────────────────────────────────────
public class UnassignProctorFromExamDto
{
    public int ExamId { get; set; }
    public List<string> ProctorIds { get; set; } = new();
}

// ── Action result ──────────────────────────────────────────────
public class ProctorAssignmentResultDto
{
    public int TotalTargeted { get; set; }
    public int SuccessCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> SkippedReasons { get; set; } = new();
}
