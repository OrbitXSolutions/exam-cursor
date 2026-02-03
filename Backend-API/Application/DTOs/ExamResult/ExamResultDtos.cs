using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.ExamResult;

#region Result DTOs

/// <summary>
/// Full result details
/// </summary>
public class ResultDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
  public string ExamTitleEn { get; set; } = string.Empty;
public string ExamTitleAr { get; set; } = string.Empty;
    public int AttemptId { get; set; }
    public int AttemptNumber { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public string? CandidateEmail { get; set; }
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public decimal PassScore { get; set; }
    public decimal Percentage { get; set; }
    public bool IsPassed { get; set; }
    public string? GradeLabel { get; set; }
    public bool IsPublishedToCandidate { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime FinalizedAt { get; set; }
    public DateTime? AttemptStartedAt { get; set; }
    public DateTime? AttemptSubmittedAt { get; set; }
}

/// <summary>
/// Lightweight result for listing
/// </summary>
public class ResultListDto
{
    public int Id { get; set; }
  public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public int AttemptId { get; set; }
  public int AttemptNumber { get; set; }
    public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public decimal Percentage { get; set; }
    public bool IsPassed { get; set; }
    public string? GradeLabel { get; set; }
    public bool IsPublishedToCandidate { get; set; }
    public DateTime FinalizedAt { get; set; }
}

/// <summary>
/// Search/filter results
/// </summary>
public class ResultSearchDto
{
    public int? ExamId { get; set; }
    public string? CandidateId { get; set; }
    public bool? IsPassed { get; set; }
    public bool? IsPublished { get; set; }
    public DateTime? FinalizedFrom { get; set; }
    public DateTime? FinalizedTo { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

/// <summary>
/// Candidate-facing result (limited info)
/// </summary>
public class CandidateResultDto
{
    public int ResultId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public decimal TotalScore { get; set; }
    public decimal MaxPossibleScore { get; set; }
    public decimal PassScore { get; set; }
  public decimal Percentage { get; set; }
    public bool IsPassed { get; set; }
    public string? GradeLabel { get; set; }
    public DateTime FinalizedAt { get; set; }
    public DateTime? AttemptStartedAt { get; set; }
    public DateTime? AttemptSubmittedAt { get; set; }
    public List<CandidateQuestionResultDto>? QuestionResults { get; set; }
}

/// <summary>
/// Per-question result for candidate (no answer key exposure) - Note: This is separate from Grading DTOs version
/// </summary>
public class CandidateQuestionResultDto
{
  public int QuestionNumber { get; set; }
    
    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;
    
    public decimal PointsEarned { get; set; }
    public decimal MaxPoints { get; set; }
  public bool IsCorrect { get; set; }
    public string? Feedback { get; set; }
}

/// <summary>
/// Publish result request
/// </summary>
public class PublishResultDto
{
    public int ResultId { get; set; }
}

/// <summary>
/// Bulk publish results
/// </summary>
public class BulkPublishResultsDto
{
  public List<int> ResultIds { get; set; } = new();
}

/// <summary>
/// Publish all results for an exam
/// </summary>
public class PublishExamResultsDto
{
    public int ExamId { get; set; }
    public bool PassedOnly { get; set; } = false;
}

#endregion

#region ExamReport DTOs

/// <summary>
/// Exam report details
/// </summary>
public class ExamReportDto
{
  public int Id { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
 public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int TotalAttempts { get; set; }
    public int TotalSubmitted { get; set; }
    public int TotalExpired { get; set; }
    public int TotalPassed { get; set; }
    public int TotalFailed { get; set; }
    public decimal AverageScore { get; set; }
    public decimal HighestScore { get; set; }
    public decimal LowestScore { get; set; }
    public decimal PassRate { get; set; }
    public int? TotalFlaggedAttempts { get; set; }
    public decimal? AverageRiskScore { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; } = string.Empty;
}

/// <summary>
/// Generate exam report request
/// </summary>
public class GenerateExamReportDto
{
    public int ExamId { get; set; }
    public DateTime? FromDate { get; set; }
 public DateTime? ToDate { get; set; }
}

#endregion

#region QuestionPerformanceReport DTOs

/// <summary>
/// Question performance details
/// </summary>
public class QuestionPerformanceDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public int QuestionId { get; set; }
    
    // Bilingual Question Body
    public string QuestionBodyEn { get; set; } = string.Empty;
    public string QuestionBodyAr { get; set; } = string.Empty;
  
    public string QuestionTypeName { get; set; } = string.Empty;
    public int TotalAnswers { get; set; }
    public int CorrectAnswers { get; set; }
    public int IncorrectAnswers { get; set; }
    public int UnansweredCount { get; set; }
    public decimal CorrectRate { get; set; }
    public decimal AverageScore { get; set; }
    public decimal MaxPoints { get; set; }
    public decimal DifficultyIndex { get; set; }
    public string DifficultyLabel { get; set; } = string.Empty; // Easy, Medium, Hard
    public DateTime GeneratedAt { get; set; }
}

/// <summary>
/// Generate question performance report request
/// </summary>
public class GenerateQuestionPerformanceDto
{
    public int ExamId { get; set; }
}

#endregion

#region CandidateExamSummary DTOs

/// <summary>
/// Candidate exam summary details
/// </summary>
public class CandidateExamSummaryDto
{
    public int Id { get; set; }
 public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string CandidateId { get; set; } = string.Empty;
 public string CandidateName { get; set; } = string.Empty;
    public int TotalAttempts { get; set; }
    public int MaxAttempts { get; set; }
    public int RemainingAttempts { get; set; }
public int? BestAttemptId { get; set; }
    public decimal? BestScore { get; set; }
    public decimal? BestPercentage { get; set; }
    public bool? BestIsPassed { get; set; }
    public decimal? LatestScore { get; set; }
    public bool? LatestIsPassed { get; set; }
    public DateTime? LastAttemptAt { get; set; }
}

/// <summary>
/// Candidate summary list item
/// </summary>
public class CandidateExamSummaryListDto
{
 public string CandidateId { get; set; } = string.Empty;
    public string CandidateName { get; set; } = string.Empty;
 public string? CandidateEmail { get; set; }
    public int TotalAttempts { get; set; }
    public decimal? BestScore { get; set; }
    public decimal? BestPercentage { get; set; }
    public bool? BestIsPassed { get; set; }
    public DateTime? LastAttemptAt { get; set; }
    /// <summary>Present when returning all candidates across exams</summary>
    public int? ExamId { get; set; }
    public string? ExamTitleEn { get; set; }
    public string? ExamTitleAr { get; set; }
}

#endregion

#region ResultExportJob DTOs

/// <summary>
/// Export job details
/// </summary>
public class ResultExportJobDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
 public string ExamTitleEn { get; set; } = string.Empty;
 public ExportFormat Format { get; set; }
    public string FormatName => Format.ToString();
    public ExportStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool? PassedOnly { get; set; }
    public bool? FailedOnly { get; set; }
    public string RequestedBy { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? DownloadUrl { get; set; }
    public long? FileSizeBytes { get; set; }
 public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Request export job
/// </summary>
public class RequestExportDto
{
    public int ExamId { get; set; }
    public ExportFormat Format { get; set; }
  public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool? PassedOnly { get; set; }
    public bool? FailedOnly { get; set; }
}

/// <summary>
/// Export job list item
/// </summary>
public class ResultExportJobListDto
{
    public int Id { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public ExportFormat Format { get; set; }
    public string FormatName => Format.ToString();
    public ExportStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? DownloadUrl { get; set; }
}

/// <summary>
/// Search export jobs
/// </summary>
public class ExportJobSearchDto
{
    public int? ExamId { get; set; }
    public ExportStatus? Status { get; set; }
    public DateTime? RequestedFrom { get; set; }
    public DateTime? RequestedTo { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion

#region Dashboard DTOs

/// <summary>
/// Result dashboard for admin/instructor
/// </summary>
public class ResultDashboardDto
{
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
public int TotalCandidates { get; set; }
    public int TotalAttempts { get; set; }
    public int GradedCount { get; set; }
    public int PendingGradingCount { get; set; }
    public int PublishedCount { get; set; }
    public int UnpublishedCount { get; set; }
    public int PassedCount { get; set; }
    public int FailedCount { get; set; }
    public decimal PassRate { get; set; }
    public decimal AverageScore { get; set; }
    public decimal HighestScore { get; set; }
    public decimal LowestScore { get; set; }
    public List<ScoreDistributionDto> ScoreDistribution { get; set; } = new();
}

/// <summary>
/// Score distribution bucket
/// </summary>
public class ScoreDistributionDto
{
    public string Range { get; set; } = string.Empty; // e.g., "0-10", "11-20"
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

#endregion
