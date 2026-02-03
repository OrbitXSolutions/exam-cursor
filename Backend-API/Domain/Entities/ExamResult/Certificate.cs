using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.ExamResult;

/// <summary>
/// Certificate issued when a candidate passes an exam.
/// One certificate per passed result.
/// </summary>
public class Certificate : BaseEntity
{
    public int Id { get; set; }

    // Unique verification code (e.g. CERT-XXXX-XXXX)
    public string CertificateCode { get; set; } = null!;

    // Relations
    public int ResultId { get; set; }
    public int ExamId { get; set; }
    public int AttemptId { get; set; }
    public string CandidateId { get; set; } = null!;

    // Snapshot of pass data (for verification display)
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public decimal PassScore { get; set; }
    public string ExamTitleEn { get; set; } = null!;
    public string ExamTitleAr { get; set; } = null!;
    public string? CandidateNameEn { get; set; }
    public string? CandidateNameAr { get; set; }

    // Issued date
    public DateTime IssuedAt { get; set; }

    // Optional: stored PDF path (when generated)
    public string? FilePath { get; set; }
    public string? FileUrl { get; set; }

    // Revocation
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedBy { get; set; }
    public string? RevokeReason { get; set; }

    // Navigation
    public virtual Result Result { get; set; } = null!;
}
