using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Grading;

#region GradingSession DTOs

/// <summary>
/// Full grading session details
/// </summary>
public class GradingSessionDto
{
    public int Id { get; set; }
  public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
 public string ExamTitleAr { get; set; } = string.Empty;
  public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string? GradedBy { get; set; }
    public string? GraderName { get; set; }
    public GradingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
  public decimal PassScore { get; set; }
    public bool? IsPassed { get; set; }
    public DateTime? GradedAt { get; set; }
    public DateTime CreatedDate { get; set; }
    public int TotalQuestions { get; set; }
    public int GradedQuestions { get; set; }
    public int ManualGradingRequired { get; set; }
    public List<GradedAnswerDto> Answers { get; set; } = new();
}

/// <summary>
/// Lightweight grading session for listing
/// </summary>
public class GradingSessionListDto
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public GradingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public bool? IsPassed { get; set; }
    public DateTime? GradedAt { get; set; }
    public int ManualGradingRequired { get; set; }
}

/// <summary>
/// Search/filter grading sessions
/// </summary>
public class GradingSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public GradingStatus? Status { get; set; }
    public bool? IsPassed { get; set; }
    public bool? RequiresManualGrading { get; set; }
    public DateTime? GradedFrom { get; set; }
    public DateTime? GradedTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// Initiate grading for an attempt
/// </summary>
public class InitiateGradingDto
{
    public int AttemptId { get; set; }
}

/// <summary>
/// Response after initiating grading
/// </summary>
public class GradingInitiatedDto
{
    public int GradingSessionId { get; set; }
    public int AttemptId { get; set; }
    public GradingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public int AutoGradedCount { get; set; }
    public int ManualGradingRequired { get; set; }
  public decimal? PartialScore { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion

#region GradedAnswer DTOs

/// <summary>
/// Graded answer details
/// </summary>
public class GradedAnswerDto
{
    public int Id { get; set; }
    public int GradingSessionId { get; set; }
    public int QuestionId { get; set; }
    
    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;
    
    public string QuestionTypeName { get; set; } = string.Empty;
    public int QuestionTypeId { get; set; }
  public decimal MaxPoints { get; set; }
    
    // Answer data
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    
    // Grading result
    public decimal Score { get; set; }
    public bool IsCorrect { get; set; }
    public bool IsManuallyGraded { get; set; }
    public string? GraderComment { get; set; }
  
    // For display - correct answers (admin only)
    public List<CorrectOptionDto>? CorrectOptions { get; set; }
    
    // Bilingual Model Answer
 public string? ModelAnswerEn { get; set; }
  public string? ModelAnswerAr { get; set; }
}

/// <summary>
/// Correct option for display
/// </summary>
public class CorrectOptionDto
{
    public int Id { get; set; }
    
    // Bilingual Text
 public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
}

/// <summary>
/// Manual grade submission
/// </summary>
public class ManualGradeDto
{
    public int GradingSessionId { get; set; }
    public int QuestionId { get; set; }
    public decimal Score { get; set; }
    public bool IsCorrect { get; set; }
    public string? GraderComment { get; set; }
}

/// <summary>
/// Bulk manual grading
/// </summary>
public class BulkManualGradeDto
{
 public int GradingSessionId { get; set; }
    public List<ManualGradeItemDto> Grades { get; set; } = new();
}

/// <summary>
/// Single item in bulk grading
/// </summary>
public class ManualGradeItemDto
{
    public int QuestionId { get; set; }
    public decimal Score { get; set; }
    public bool IsCorrect { get; set; }
    public string? GraderComment { get; set; }
}

/// <summary>
/// Response after manual grading
/// </summary>
public class GradeSubmittedDto
{
    public int GradedAnswerId { get; set; }
    public int QuestionId { get; set; }
    public decimal Score { get; set; }
    public bool IsCorrect { get; set; }
    public bool Success { get; set; }
    public string? Message { get; set; }
}

#endregion

#region Completion DTOs

/// <summary>
/// Complete grading request
/// </summary>
public class CompleteGradingDto
{
    public int GradingSessionId { get; set; }
}

/// <summary>
/// Grading completed response
/// </summary>
public class GradingCompletedDto
{
    public int GradingSessionId { get; set; }
    public int AttemptId { get; set; }
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public decimal PassScore { get; set; }
    public bool IsPassed { get; set; }
    public DateTime GradedAt { get; set; }
    public GradingStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion

#region Re-grading DTOs

/// <summary>
/// Re-grade request
/// </summary>
public class RegradeDto
{
    public int GradingSessionId { get; set; }
    public int QuestionId { get; set; }
    public decimal NewScore { get; set; }
    public bool IsCorrect { get; set; }
    public string? Comment { get; set; }
    public string? Reason { get; set; }
}

/// <summary>
/// Re-grade response
/// </summary>
public class RegradeResultDto
{
  public int GradedAnswerId { get; set; }
    public decimal PreviousScore { get; set; }
    public decimal NewScore { get; set; }
    public decimal NewTotalScore { get; set; }
    public bool NewIsPassed { get; set; }
    public string Message { get; set; } = string.Empty;
}

#endregion

#region Statistics DTOs

/// <summary>
/// Grading statistics for an exam
/// </summary>
public class ExamGradingStatsDto
{
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int TotalAttempts { get; set; }
    public int GradedAttempts { get; set; }
 public int PendingGrading { get; set; }
    public int ManualGradingRequired { get; set; }
  public int PassedCount { get; set; }
    public int FailedCount { get; set; }
    public decimal AverageScore { get; set; }
  public decimal HighestScore { get; set; }
    public decimal LowestScore { get; set; }
    public decimal PassRate { get; set; }
}

/// <summary>
/// Question-level grading statistics
/// </summary>
public class QuestionGradingStatsDto
{
    public int QuestionId { get; set; }
    
    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
  public string QuestionBodyAr { get; set; } = string.Empty;
    
    public string QuestionTypeName { get; set; } = string.Empty;
    public int TotalAnswers { get; set; }
    public int CorrectAnswers { get; set; }
 public int IncorrectAnswers { get; set; }
    public decimal AverageScore { get; set; }
    public decimal MaxPoints { get; set; }
    public decimal DifficultyIndex { get; set; } // CorrectAnswers / TotalAnswers
}

#endregion

#region Candidate Result DTOs

/// <summary>
/// Grading result for candidate view (limited info)
/// </summary>
public class CandidateGradingResultDto
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public decimal PassScore { get; set; }
    public bool IsPassed { get; set; }
public decimal Percentage { get; set; }
    public DateTime? GradedAt { get; set; }
    public GradingStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public bool IsGradingComplete { get; set; }
    
    // Optional: Per-question results if exam allows review
  public List<CandidateQuestionResultDto>? QuestionResults { get; set; }
}

/// <summary>
/// Question result for candidate (configurable visibility)
/// </summary>
public class CandidateQuestionResultDto
{
    public int QuestionId { get; set; }
    
    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;
    
    public decimal PointsEarned { get; set; }
    public decimal MaxPoints { get; set; }
    public bool IsCorrect { get; set; }
    public string? Feedback { get; set; } // GraderComment if allowed
}

#endregion
