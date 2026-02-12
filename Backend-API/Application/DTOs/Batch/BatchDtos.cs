namespace Smart_Core.Application.DTOs.Batch;

// ── List ────────────────────────────────────────────────────────
public class BatchListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int CandidateCount { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
}

// ── Detail (with candidate list) ────────────────────────────────
public class BatchDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int CandidateCount { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public List<BatchCandidateDto> Candidates { get; set; } = new();
}

// ── Candidate inside a batch ────────────────────────────────────
public class BatchCandidateDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? RollNo { get; set; }
    public string? Mobile { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime AddedAt { get; set; }
    public string? AddedBy { get; set; }
    public string? AddedByName { get; set; }
}

// ── Create ──────────────────────────────────────────────────────
public class CreateBatchDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

// ── Update ──────────────────────────────────────────────────────
public class UpdateBatchDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
}

// ── Filter / Query ──────────────────────────────────────────────
public class BatchFilterDto
{
    public string? Search { get; set; }
    public string? Status { get; set; }           // "Active" | "Inactive"
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public string? SortDir { get; set; } = "desc";
}

// ── Add / Remove candidates ─────────────────────────────────────
public class BatchCandidateIdsDto
{
    public List<string> CandidateIds { get; set; } = new();
}

public class BatchCandidateChangeResultDto
{
    public int TotalRequested { get; set; }
    public int AffectedCount { get; set; }
    public int SkippedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
