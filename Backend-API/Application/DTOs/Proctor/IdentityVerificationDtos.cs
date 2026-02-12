using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Proctor;

#region Identity Verification DTOs

/// <summary>
/// Lightweight identity verification item for listing.
/// </summary>
public class IdentityVerificationListDto
{
    public int Id { get; set; }
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public bool IdDocumentUploaded { get; set; }
    public decimal? FaceMatchScore { get; set; }
    public LivenessResult LivenessResult { get; set; }
    public string LivenessResultName => LivenessResult.ToString();
    public decimal? RiskScore { get; set; }
    public IdentityVerificationStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? AssignedProctorId { get; set; }
    public string? AssignedProctorName { get; set; }
    public DateTime SubmittedAt { get; set; }
}

/// <summary>
/// Full detail for the review modal.
/// </summary>
public class IdentityVerificationDetailDto
{
    public int Id { get; set; }
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;

    // Documents
    public bool IdDocumentUploaded { get; set; }
    public string? IdDocumentUrl { get; set; }
    public string? IdDocumentType { get; set; }
    public string? SelfieUrl { get; set; }

    // Scores
    public decimal? FaceMatchScore { get; set; }
    public LivenessResult LivenessResult { get; set; }
    public string LivenessResultName => LivenessResult.ToString();
    public decimal? RiskScore { get; set; }

    // Status
    public IdentityVerificationStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    // Assignment
    public string? AssignedProctorId { get; set; }
    public string? AssignedProctorName { get; set; }

    // Device
    public string? DeviceInfo { get; set; }
    public string? IpAddress { get; set; }

    // Timing
    public DateTime SubmittedAt { get; set; }

    // Audit logs (flattened from ProctorEvents)
    public List<IdentityAuditLogDto> AuditLogs { get; set; } = new();
}

/// <summary>
/// Audit log entry for identity verification modal.
/// </summary>
public class IdentityAuditLogDto
{
    public DateTime Timestamp { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? PerformedBy { get; set; }
    public string? Details { get; set; }
}

/// <summary>
/// Search / filter parameters for identity verification list.
/// </summary>
public class IdentityVerificationSearchDto
{
    public IdentityVerificationStatus? Status { get; set; }
    public int? ExamId { get; set; }
    public string? RiskLevel { get; set; }           // "Low", "Medium", "High", "Critical"
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? AssignedProctorId { get; set; }
    public string? Search { get; set; }              // candidate name search
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Single action on one identity verification.
/// </summary>
public class IdentityVerificationActionDto
{
    public int Id { get; set; }
    public string Action { get; set; } = string.Empty;   // "Approve", "Reject", "Flag"
    public string? Reason { get; set; }
}

/// <summary>
/// Bulk action on multiple identity verifications.
/// POST /api/proctor/authentication/bulk-action
/// </summary>
public class IdentityVerificationBulkActionDto
{
    public List<int> Ids { get; set; } = new();
    public string Action { get; set; } = string.Empty;   // "Approve", "Reject", "Flag"
    public string? Reason { get; set; }
}

/// <summary>
/// Result of a bulk action.
/// </summary>
public class BulkActionResultDto
{
    public int TotalRequested { get; set; }
    public int Succeeded { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = new();
}

#endregion
