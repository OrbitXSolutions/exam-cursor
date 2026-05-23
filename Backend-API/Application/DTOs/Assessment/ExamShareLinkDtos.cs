using Smart_Core.Application.DTOs.Auth;

namespace Smart_Core.Application.DTOs.Assessment;

// ========== Admin DTOs ==========

public class ExamShareLinkDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string ShareToken { get; set; } = string.Empty;
    public string ShareUrl { get; set; } = string.Empty;
    public DateTimeOffset? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedDate { get; set; }
}

public class GenerateShareLinkDto
{
    /// <summary>
    /// Optional: custom expiration. If null, uses exam EndAt or no expiry.
    /// </summary>
    public DateTimeOffset? ExpiresAt { get; set; }
}

// ========== Public DTOs (no sensitive data) ==========

public class PublicExamInfoDto
{
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    // Organization branding
    public string? OrganizationName { get; set; }
    public string? OrganizationLogoUrl { get; set; }
    public bool IsWalkIn { get; set; }

    /// <summary>
    /// Dynamic registration fields configured for this walk-in exam.
    /// Empty list for non-walk-in exams.
    /// </summary>
    public List<WalkInFieldDto> WalkInFields { get; set; } = new();
}

public class ShareCandidateDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? FullNameAr { get; set; }
    public string? RollNo { get; set; }

    /// <summary>
    /// True if candidate has exhausted all attempts for this exam
    /// </summary>
    public bool HasExhaustedAttempts { get; set; }

    /// <summary>
    /// Message explaining why the candidate can't take the exam (if applicable)
    /// </summary>
    public string? StatusMessage { get; set; }
}

public class SelectCandidateDto
{
    public string CandidateId { get; set; } = string.Empty;
}

/// <summary>
/// Walk-in self-registration DTO
/// </summary>
public class WalkInRegisterDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Dynamic field answers. Null/empty is valid for exams with no configured fields.
    /// </summary>
    public List<WalkInFieldAnswerInputDto>? DynamicFields { get; set; }
}

public class SelectCandidateResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTimeOffset Expiration { get; set; }
    public int ExamId { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string? CandidateName { get; set; }
}
