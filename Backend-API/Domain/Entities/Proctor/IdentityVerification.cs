using Smart_Core.Domain.Common;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Proctor;

/// <summary>
/// Represents a candidate identity verification request.
/// Tracks ID document upload, selfie face-match, liveness check, and approval status.
/// </summary>
public class IdentityVerification : BaseEntity
{
    public int Id { get; set; }

    // Relations
    public int ProctorSessionId { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string CandidateId { get; set; } = null!;

    // ID document
    public bool IdDocumentUploaded { get; set; }
    public string? IdDocumentPath { get; set; }
    public string? IdDocumentType { get; set; }       // e.g. "National ID", "Passport"

    // Selfie / face match
    public string? SelfiePath { get; set; }
    public decimal? FaceMatchScore { get; set; }       // 0-100

    // Liveness
    public LivenessResult LivenessResult { get; set; } = LivenessResult.NotChecked;

    // Risk
    public decimal? RiskScore { get; set; }

    // Status & review
    public IdentityVerificationStatus Status { get; set; } = IdentityVerificationStatus.Pending;
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    // Assigned proctor (optional)
    public string? AssignedProctorId { get; set; }

    // Device info captured at submission
    public string? DeviceInfo { get; set; }             // JSON: browser, OS, IP
    public string? IpAddress { get; set; }

    // SLA
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public virtual ProctorSession ProctorSession { get; set; } = null!;
    public virtual ApplicationUser Candidate { get; set; } = null!;
    public virtual ApplicationUser? AssignedProctor { get; set; }
    public virtual ApplicationUser? Reviewer { get; set; }
}
