namespace Smart_Core.Application.DTOs.CandidateAdmin;

// ── List / Detail ──────────────────────────────────────────────
public class CandidateListDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? RollNo { get; set; }
    public string? Mobile { get; set; }
    public string Status { get; set; } = "Active";
    public bool IsBlocked { get; set; }
    public bool IsWalkIn { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
    public DateTimeOffset? LastLoginDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public string? DeletedBy { get; set; }
    public DateTimeOffset? DeletedDate { get; set; }
}

// ── Create ─────────────────────────────────────────────────────
public class CreateCandidateDto
{
    public string FullName { get; set; } = string.Empty;
    public string? FullNameAr { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? RollNo { get; set; }
    public string? Mobile { get; set; }
    /// <summary>
    /// When true and the email belongs to a previously soft-deleted candidate,
    /// restore and update that record instead of creating a new one.
    /// </summary>
    public bool ForceReactivate { get; set; } = false;
}

// ── Update ─────────────────────────────────────────────────────
public class UpdateCandidateDto
{
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? RollNo { get; set; }
    public string? Mobile { get; set; }
}

// ── Export filter (no pagination — export always fetches all) ──
public class CandidateExportFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? DepartmentId { get; set; }
}

// ── Filter / Query ─────────────────────────────────────────────
public class CandidateFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }          // "Active" | "Blocked"
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }           // column name
    public string? SortDir { get; set; } = "desc"; // "asc" | "desc"
}

// ── Import ─────────────────────────────────────────────────────
public class CandidateImportRowDto
{
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? RollNo { get; set; }
    public string? Mobile { get; set; }
}

public class CandidateImportResultDto
{
    public int TotalRows { get; set; }
    public int InsertedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<CandidateImportErrorDto> Errors { get; set; } = new();
    public List<CandidateImportedAccountDto> CreatedAccounts { get; set; } = new();
}

public class CandidateImportErrorDto
{
    public int Row { get; set; }
    public string Email { get; set; } = string.Empty;
    public List<string> Reasons { get; set; } = new();
}

public class CandidateImportedAccountDto
{
    public int Row { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string RollNo { get; set; } = string.Empty;
    public string TemporaryPassword { get; set; } = string.Empty;
}
