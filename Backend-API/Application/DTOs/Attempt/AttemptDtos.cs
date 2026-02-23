using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Attempt;

#region Attempt DTOs

/// <summary>
/// Full attempt details for candidate view
/// </summary>
public class AttemptDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public AttemptStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public ExpiryReason ExpiryReason { get; set; }
    public string ExpiryReasonName => ExpiryReason.ToString();
    public int? ResumedFromAttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public int RemainingSeconds { get; set; }
    public DateTime CreatedDate { get; set; }
}

/// <summary>
/// Lightweight attempt for listing
/// </summary>
public class AttemptListDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public AttemptStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public ExpiryReason ExpiryReason { get; set; }
    public string ExpiryReasonName => ExpiryReason.ToString();
    public int? ResumedFromAttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public decimal? TotalScore { get; set; }
    public bool? IsPassed { get; set; }
}

/// <summary>
/// Start a new attempt request
/// </summary>
public class StartAttemptDto
{
    public int ExamId { get; set; }
    public string? AccessCode { get; set; }
}

/// <summary>
/// Response when starting/resuming an attempt
/// </summary>
public class AttemptSessionDto
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string? ExamDescriptionEn { get; set; }
    public string? ExamDescriptionAr { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int RemainingSeconds { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public AttemptStatus Status { get; set; }
    public int AttemptNumber { get; set; }
    public int MaxAttempts { get; set; }
    public List<AttemptQuestionDto> Questions { get; set; } = new();
    public List<ExamInstructionForCandidateDto> Instructions { get; set; } = new();
}

/// <summary>
/// Exam instruction for candidate (bilingual)
/// </summary>
public class ExamInstructionForCandidateDto
{
    public int Order { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
}

/// <summary>
/// Search/filter attempts
/// </summary>
public class AttemptSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public AttemptStatus? Status { get; set; }
    public DateTime? StartedFrom { get; set; }
    public DateTime? StartedTo { get; set; }
    public bool? IsPassed { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion

#region AttemptQuestion DTOs

/// <summary>
/// Question for candidate during attempt (no correctness info)
/// </summary>
public class AttemptQuestionDto
{
    public int AttemptQuestionId { get; set; }
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public decimal Points { get; set; }

    // Bilingual Body
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;

    public string QuestionTypeName { get; set; } = string.Empty;
    public int QuestionTypeId { get; set; }
    public List<AttemptQuestionOptionDto> Options { get; set; } = new();
    public List<AttemptQuestionAttachmentDto> Attachments { get; set; } = new();
    public AttemptAnswerDto? CurrentAnswer { get; set; }
}

/// <summary>
/// Question option for candidate (no IsCorrect exposed)
/// </summary>
public class AttemptQuestionOptionDto
{
    public int Id { get; set; }

    // Bilingual Text
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;

    public int Order { get; set; }
    public string? AttachmentPath { get; set; }
}

/// <summary>
/// Attachment for question
/// </summary>
public class AttemptQuestionAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
}

#endregion

#region AttemptAnswer DTOs

/// <summary>
/// Current answer state
/// </summary>
public class AttemptAnswerDto
{
    public int? AttemptAnswerId { get; set; }
    public int QuestionId { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    public DateTime? AnsweredAt { get; set; }
}

/// <summary>
/// Save/update answer request
/// </summary>
public class SaveAnswerDto
{
    public int QuestionId { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
}

/// <summary>
/// Bulk save answers request
/// </summary>
public class BulkSaveAnswersDto
{
    public List<SaveAnswerDto> Answers { get; set; } = new();
}

/// <summary>
/// Answer saved response
/// </summary>
public class AnswerSavedDto
{
    public int AttemptAnswerId { get; set; }
    public int QuestionId { get; set; }
    public DateTime AnsweredAt { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
}

#endregion

#region AttemptEvent DTOs

/// <summary>
/// Log an event during attempt
/// </summary>
public class LogAttemptEventDto
{
    public AttemptEventType EventType { get; set; }
    public string? MetadataJson { get; set; }
}

/// <summary>
/// Event details for admin/reporting
/// </summary>
public class AttemptEventDto
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public AttemptEventType EventType { get; set; }
    public string EventTypeName => EventType.ToString();
    public string? MetadataJson { get; set; }
    public DateTime OccurredAt { get; set; }

    // Enrichment fields for AnswerSaved events
    public string? QuestionTextEn { get; set; }
    public string? QuestionTextAr { get; set; }
    public string? AnswerSummary { get; set; }
}

#endregion

#region Submit DTOs

/// <summary>
/// Submit attempt request
/// </summary>
public class SubmitAttemptDto
{
    public int AttemptId { get; set; }
}

/// <summary>
/// Submit response
/// </summary>
public class AttemptSubmittedDto
{
    public int AttemptId { get; set; }
    public DateTime SubmittedAt { get; set; }
    public AttemptStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion

#region Timer DTOs

/// <summary>
/// Get remaining time response
/// </summary>
public class AttemptTimerDto
{
    public int AttemptId { get; set; }
    public DateTime ServerTime { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int RemainingSeconds { get; set; }
    public AttemptStatus Status { get; set; }
    public bool IsExpired => RemainingSeconds <= 0 || Status == AttemptStatus.Expired;
}

#endregion

#region Admin DTOs

/// <summary>
/// Attempt details for admin/instructor view (includes events)
/// </summary>
public class AttemptDetailDto : AttemptDto
{
    public List<AttemptEventDto> Events { get; set; } = new();
    public List<AttemptAnswerDetailDto> AnswerDetails { get; set; } = new();
}

/// <summary>
/// Answer details for admin view (includes correctness after grading)
/// </summary>
public class AttemptAnswerDetailDto
{
    public int AttemptAnswerId { get; set; }
    public int QuestionId { get; set; }

    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;

    public string QuestionTypeName { get; set; } = string.Empty;
    public decimal Points { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    public bool? IsCorrect { get; set; }
    public decimal? Score { get; set; }
    public DateTime? AnsweredAt { get; set; }
}

/// <summary>
/// Cancel attempt request (admin only)
/// </summary>
public class CancelAttemptDto
{
    public int AttemptId { get; set; }
    public string? Reason { get; set; }
}

#endregion
