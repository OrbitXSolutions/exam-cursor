using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Candidate;

#region Candidate Exam List & Preview

/// <summary>
/// Safe exam list item for candidates (published + active only)
/// </summary>
public class CandidateExamListDto
{
    public int Id { get; set; }
    public ExamType ExamType { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public decimal PassScore { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalPoints { get; set; }
    public int? MyAttempts { get; set; }
    public bool? MyBestIsPassed { get; set; }
    public int? LatestAttemptId { get; set; }
    public AttemptStatus? LatestAttemptStatus { get; set; }
    public DateTime? LatestAttemptSubmittedAt { get; set; }
    public bool? LatestAttemptIsResultPublished { get; set; }
    /// <summary>
    /// Server-driven flag: true when candidate is eligible to retake (has attempts left,
    /// within exam window, and has NOT already passed with a published result).
    /// </summary>
    public bool CanRetake { get; set; }
}

/// <summary>
/// Exam preview for candidate before starting
/// </summary>
public class CandidateExamPreviewDto
{
    public int ExamId { get; set; }
    public ExamType ExamType { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalPoints { get; set; }
    public decimal PassScore { get; set; }
    public List<CandidateExamInstructionDto> Instructions { get; set; } = new();
    public CandidateAccessPolicyDto AccessPolicy { get; set; } = new();
    public CandidateEligibilityDto Eligibility { get; set; } = new();
}

/// <summary>
/// Instructions for candidate
/// </summary>
public class CandidateExamInstructionDto
{
    public int Order { get; set; }
    public string ContentEn { get; set; } = string.Empty;
    public string ContentAr { get; set; } = string.Empty;
}

/// <summary>
/// Safe access policy info for candidate
/// </summary>
public class CandidateAccessPolicyDto
{
    public bool RequiresAccessCode { get; set; }
    public bool RequireProctoring { get; set; }
    public bool RequireIdVerification { get; set; }
    public bool RequireWebcam { get; set; }
    public bool PreventCopyPaste { get; set; }
    public bool PreventScreenCapture { get; set; }
    public bool RequireFullscreen { get; set; }
    public bool BrowserLockdown { get; set; }
}

/// <summary>
/// Eligibility check result
/// </summary>
public class CandidateEligibilityDto
{
    public bool CanStartNow { get; set; }
    public List<string> Reasons { get; set; } = new();
    public int? AttemptsUsed { get; set; }
    public int? AttemptsRemaining { get; set; }
}

#endregion

#region Start Exam & Session

/// <summary>
/// Request to start exam
/// </summary>
public class StartExamRequest
{
    public string? AccessCode { get; set; }
}

/// <summary>
/// Session info after starting/resuming exam (NO CORRECT ANSWERS)
/// Organized by sections (tabs) with topics and questions
/// </summary>
public class CandidateAttemptSessionDto
{
    public int AttemptId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public DateTime StartedAtUtc { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public int RemainingSeconds { get; set; }
    public AttemptStatus Status { get; set; }
    public int AttemptNumber { get; set; }
    public int MaxAttempts { get; set; }
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }

    /// <summary>
    /// Exam settings for frontend behavior
    /// </summary>
    public CandidateExamSettingsDto ExamSettings { get; set; } = new();

    /// <summary>
    /// Sections (displayed as tabs) - each section has its own timer if DurationMinutes is set
    /// Frontend should display these as tabs and auto-switch when section time expires
    /// </summary>
    public List<CandidateSectionDto> Sections { get; set; } = new();

    /// <summary>
    /// Flat list of all questions (for backward compatibility and quick access)
    /// Questions are also available nested under sections/topics
    /// </summary>
    public List<CandidateQuestionDto> Questions { get; set; } = new();

    public List<CandidateExamInstructionDto> Instructions { get; set; } = new();
}

/// <summary>
/// Exam settings that affect frontend behavior
/// </summary>
public class CandidateExamSettingsDto
{
    /// <summary>
    /// If true, questions should be displayed in random order
    /// </summary>
    public bool ShuffleQuestions { get; set; }

    /// <summary>
    /// If true, options within questions should be displayed in random order
    /// </summary>
    public bool ShuffleOptions { get; set; }

    /// <summary>
    /// If true, candidate cannot go back to previous sections after moving forward
    /// </summary>
    public bool LockPreviousSections { get; set; }

    /// <summary>
    /// If true, candidate cannot navigate back to previous questions
    /// </summary>
    public bool PreventBackNavigation { get; set; }
}

/// <summary>
/// Section for candidate (displayed as a tab) - NO CORRECT ANSWERS
/// Each section can have its own duration
/// </summary>
public class CandidateSectionDto
{
    public int SectionId { get; set; }
    public int Order { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    /// <summary>
    /// Section source type: 1 = Subject (shows all topics), 2 = Topic (shows single topic)
    /// If null, it's a manual section (not from Builder)
    /// </summary>
    public int? SourceType { get; set; }

    /// <summary>
    /// Subject ID for Builder sections
    /// </summary>
    public int? SubjectId { get; set; }

    /// <summary>
    /// Subject title (English) for display in exam
    /// </summary>
    public string? SubjectTitleEn { get; set; }

    /// <summary>
    /// Subject title (Arabic) for display in exam
    /// </summary>
    public string? SubjectTitleAr { get; set; }

    /// <summary>
    /// Topic ID for Builder sections (only if SourceType = Topic)
    /// </summary>
    public int? TopicId { get; set; }

    /// <summary>
    /// Topic title (English) for display in exam
    /// </summary>
    public string? TopicTitleEn { get; set; }

    /// <summary>
    /// Topic title (Arabic) for display in exam
    /// </summary>
    public string? TopicTitleAr { get; set; }

    /// <summary>
    /// Section-specific duration in minutes (optional)
    /// If set, frontend should show a separate timer for this section
    /// When time expires, auto-switch to next section and disable navigation back
    /// </summary>
    public int? DurationMinutes { get; set; }

    /// <summary>
    /// Remaining seconds for this section (calculated from section start time)
    /// Only applicable if DurationMinutes is set
    /// </summary>
    public int? RemainingSeconds { get; set; }

    /// <summary>
    /// When this section's timer started (for section-level timing)
    /// </summary>
    public DateTime? SectionStartedAtUtc { get; set; }

    /// <summary>
    /// When this section's timer expires (for section-level timing)
    /// </summary>
    public DateTime? SectionExpiresAtUtc { get; set; }

    /// <summary>
    /// Total points for this section
    /// </summary>
    public decimal TotalPoints { get; set; }

    /// <summary>
    /// Total number of questions in this section (including questions in topics)
    /// </summary>
    public int TotalQuestions { get; set; }

    /// <summary>
    /// Number of answered questions in this section
    /// </summary>
    public int AnsweredQuestions { get; set; }

    /// <summary>
    /// Topics within this section (optional grouping)
    /// If no topics exist, questions are directly under the section
    /// </summary>
    public List<CandidateTopicDto> Topics { get; set; } = new();

    /// <summary>
    /// Questions directly under this section (not in any topic)
    /// Randomized if exam.ShuffleQuestions is true
    /// </summary>
    public List<CandidateQuestionDto> Questions { get; set; } = new();
}

/// <summary>
/// Topic within a section (optional grouping) - NO CORRECT ANSWERS
/// </summary>
public class CandidateTopicDto
{
    public int TopicId { get; set; }
    public int Order { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    /// <summary>
    /// Total points for this topic
    /// </summary>
    public decimal TotalPoints { get; set; }

    /// <summary>
    /// Total number of questions in this topic
    /// </summary>
    public int TotalQuestions { get; set; }

    /// <summary>
    /// Number of answered questions in this topic
    /// </summary>
    public int AnsweredQuestions { get; set; }

    /// <summary>
    /// Questions in this topic
    /// Randomized if exam.ShuffleQuestions is true
    /// </summary>
    public List<CandidateQuestionDto> Questions { get; set; } = new();
}

/// <summary>
/// Question for candidate (NO IsCorrect)
/// </summary>
public class CandidateQuestionDto
{
    public int AttemptQuestionId { get; set; }
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public decimal Points { get; set; }
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public string QuestionTypeName { get; set; } = string.Empty;
    public int QuestionTypeId { get; set; }

    /// <summary>
    /// Section ID this question belongs to (for reference)
    /// </summary>
    public int? SectionId { get; set; }

    /// <summary>
    /// Topic ID this question belongs to (for reference, null if directly under section)
    /// </summary>
    public int? TopicId { get; set; }

    public List<CandidateQuestionOptionDto> Options { get; set; } = new();
    public List<CandidateQuestionAttachmentDto> Attachments { get; set; } = new();
    public CandidateAnswerDto? CurrentAnswer { get; set; }
}

/// <summary>
/// Option for candidate (NO IsCorrect)
/// </summary>
public class CandidateQuestionOptionDto
{
    public int Id { get; set; }
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    public int Order { get; set; }
    public string? AttachmentPath { get; set; }
}

/// <summary>
/// Attachment for question
/// </summary>
public class CandidateQuestionAttachmentDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
}

/// <summary>
/// Current answer state
/// </summary>
public class CandidateAnswerDto
{
    public int? AttemptAnswerId { get; set; }
    public int QuestionId { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    public DateTime? AnsweredAt { get; set; }
}

#endregion

#region Save Answers

/// <summary>
/// Save single answer
/// </summary>
public class SaveAnswerRequest
{
    public int QuestionId { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
}

/// <summary>
/// Bulk save answers (idempotent)
/// </summary>
public class BulkSaveAnswersRequest
{
    public List<SaveAnswerRequest> Answers { get; set; } = new();
}

#endregion

#region Results

/// <summary>
/// Result summary for candidate (respects exam settings)
/// </summary>
public class CandidateResultSummaryDto
{
    public int ResultId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public DateTime SubmittedAt { get; set; }

    // Only if ShowResults = true
    public decimal? TotalScore { get; set; }
    public decimal? MaxPossibleScore { get; set; }
    public decimal? Percentage { get; set; }
    public bool? IsPassed { get; set; }
    public string? GradeLabel { get; set; }

    // Review settings
    public bool AllowReview { get; set; }
    public bool ShowCorrectAnswers { get; set; }
}

/// <summary>
/// Result review with answers (respects AllowReview and ShowCorrectAnswers)
/// </summary>
public class CandidateResultReviewDto
{
    public int ResultId { get; set; }
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public int AttemptNumber { get; set; }
    public DateTime SubmittedAt { get; set; }
    public decimal? TotalScore { get; set; }
    public decimal? MaxPossibleScore { get; set; }
    public decimal? Percentage { get; set; }
    public bool? IsPassed { get; set; }
    public string? GradeLabel { get; set; }
    public List<CandidateResultQuestionDto> Questions { get; set; } = new();
}

/// <summary>
/// Question result for candidate (conditional correctness based on exam settings)
/// </summary>
public class CandidateResultQuestionDto
{
    public int QuestionId { get; set; }
    public int Order { get; set; }
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public string QuestionTypeName { get; set; } = string.Empty;
    public decimal Points { get; set; }
    public decimal? ScoreEarned { get; set; }

    // Candidate's answer
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }

    // Options (with conditional IsCorrect)
    public List<CandidateResultOptionDto> Options { get; set; } = new();

    // Only if ShowCorrectAnswers = true
    public bool? IsCorrect { get; set; }
    public string? Feedback { get; set; }
}

/// <summary>
/// Option result for candidate
/// </summary>
public class CandidateResultOptionDto
{
    public int Id { get; set; }
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    public bool WasSelected { get; set; }

    // Only if ShowCorrectAnswers = true
    public bool? IsCorrect { get; set; }
}

#endregion

#region Dashboard

/// <summary>
/// Candidate dashboard overview with all stats and counts
/// </summary>
public class CandidateDashboardDto
{
    // Welcome section
    public string CandidateName { get; set; } = string.Empty;
    public string CandidateEmail { get; set; } = string.Empty;
    public DateTime CurrentDateUtc { get; set; }

    // Statistics Cards
    public DashboardStatsDto Stats { get; set; } = new();

    // Exams by Status
    public ExamsByStatusDto ExamsByStatus { get; set; } = new();

    // Quick Actions / Active Attempts
    public List<QuickActionDto> QuickActions { get; set; } = new();

    // Upcoming Exams
    public List<UpcomingExamDto> UpcomingExams { get; set; } = new();

    // Recent Activity
    public List<RecentActivityDto> RecentActivity { get; set; } = new();
}

/// <summary>
/// Dashboard statistics
/// </summary>
public class DashboardStatsDto
{
    public int TotalExamsAvailable { get; set; }
    public int TotalExamsAvailableChangePercent { get; set; } // +12%

    public int TotalAttempts { get; set; }
    public int TotalAttemptsChangePercent { get; set; } // +8%

    public decimal PassRate { get; set; } // 72.5%

    public int PendingGrading { get; set; } // Attempts awaiting grading
}

/// <summary>
/// Exams grouped by status
/// </summary>
public class ExamsByStatusDto
{
    public int UpcomingCount { get; set; }
    public int ActiveCount { get; set; } // Has active attempt
    public int CompletedCount { get; set; }
}

/// <summary>
/// Quick action for resuming attempt or taking exam
/// </summary>
public class QuickActionDto
{
    public int? AttemptId { get; set; } // If resuming
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "Resume" or "Start"
    public DateTime? ExpiresAt { get; set; }
    public int? RemainingMinutes { get; set; }
}

/// <summary>
/// Upcoming exam preview
/// </summary>
public class UpcomingExamDto
{
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public ExamType ExamType { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalPoints { get; set; }
    public int? AttemptsUsed { get; set; }
    public int MaxAttempts { get; set; }
}

/// <summary>
/// Recent activity item
/// </summary>
public class RecentActivityDto
{
    public string ActivityType { get; set; } = string.Empty; // "Attempt Started", "Attempt Submitted", "Result Published"
    public int ExamId { get; set; }
    public string ExamTitleEn { get; set; } = string.Empty;
    public string ExamTitleAr { get; set; } = string.Empty;
    public int? AttemptId { get; set; }
    public DateTime ActivityDate { get; set; }
    public string? Description { get; set; }
    public decimal? Score { get; set; }
    public bool? IsPassed { get; set; }
}

#endregion

#region Exam Journey (NEW - Production Candidate Experience)

/// <summary>
/// Journey stage for candidate-friendly status mapping
/// </summary>
public enum JourneyStage
{
    InProgress = 1,      // Active attempt exists and not expired
    ReadyToStart = 2,    // Can start now, attempts remaining, within exam window
    Finished = 3,        // Attempt submitted AND result published (passed or failed)
    WaitingResult = 4,   // Attempt submitted but result not published yet
    Locked = 5,          // Attempts exhausted OR eligibility failed
    History = 6          // Expired / Terminated / old attempts (low priority)
}

/// <summary>
/// Primary action type for the candidate
/// </summary>
public enum PrimaryActionType
{
    Resume = 1,      // Resume an in-progress exam
    Start = 2,       // Start a new exam
    ViewResult = 3   // View the latest result
}

/// <summary>
/// Main Exam Journey response - single endpoint for candidate landing
/// </summary>
public class ExamJourneyDto
{
    /// <summary>
    /// Current date/time (server UTC)
    /// </summary>
    public DateTime CurrentDateUtc { get; set; }

    /// <summary>
    /// Candidate display name
    /// </summary>
    public string CandidateNameEn { get; set; } = string.Empty;
    public string CandidateNameAr { get; set; } = string.Empty;

    /// <summary>
    /// Primary action - THE one thing the candidate should do now
    /// Null if no action available (empty state)
    /// </summary>
    public PrimaryActionDto? PrimaryAction { get; set; }

    /// <summary>
    /// Exams grouped by journey stage
    /// </summary>
    public JourneyGroupsDto Groups { get; set; } = new();
}

/// <summary>
/// Primary action - the ONE thing candidate should do now
/// </summary>
public class PrimaryActionDto
{
    public PrimaryActionType ActionType { get; set; }
    public int ExamId { get; set; }
    public int? AttemptId { get; set; } // Only for Resume action
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;

    /// <summary>
    /// Remaining seconds (only for Resume action)
    /// </summary>
    public int? RemainingSeconds { get; set; }

    /// <summary>
    /// Progress info (only for Resume action)
    /// </summary>
    public int? AnsweredQuestions { get; set; }
    public int? TotalQuestions { get; set; }

    /// <summary>
    /// Human-readable status label (optional)
    /// </summary>
    public string StatusLabel { get; set; } = string.Empty;

    /// <summary>
    /// For ViewResult: Score info
    /// </summary>
    public decimal? Score { get; set; }
    public decimal? MaxScore { get; set; }
    public bool? IsPassed { get; set; }
}

/// <summary>
/// Grouped exam cards by journey stage
/// </summary>
public class JourneyGroupsDto
{
    public List<JourneyExamCardDto> InProgress { get; set; } = new();
    public List<JourneyExamCardDto> ReadyToStart { get; set; } = new();
    public List<JourneyExamCardDto> Finished { get; set; } = new();
    public List<JourneyExamCardDto> WaitingResult { get; set; } = new();
    public List<JourneyExamCardDto> Locked { get; set; } = new();
    public List<JourneyExamCardDto> History { get; set; } = new();
}

/// <summary>
/// Exam card for journey view - contains all data needed for one exam card
/// </summary>
public class JourneyExamCardDto
{
    public int ExamId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int DurationMinutes { get; set; }
    public int TotalQuestions { get; set; }
    public decimal TotalPoints { get; set; }
    public decimal PassScore { get; set; }

    /// <summary>
    /// Attempt tracking
    /// </summary>
    public int AttemptsUsed { get; set; }
    public int MaxAttempts { get; set; }
    public int? LatestAttemptId { get; set; }

    /// <summary>
    /// Journey stage for this exam
    /// </summary>
    public JourneyStage Stage { get; set; }

    /// <summary>
    /// In-progress specific fields
    /// </summary>
    public int? RemainingSeconds { get; set; }
    public int? AnsweredQuestions { get; set; }

    /// <summary>
    /// Result specific fields
    /// </summary>
    public bool? IsResultPublished { get; set; }
    public bool? IsPassed { get; set; }
    public decimal? Score { get; set; }
    public decimal? MaxScore { get; set; }
    public decimal? Percentage { get; set; }

    /// <summary>
    /// Eligibility info (for ready-to-start or locked)
    /// </summary>
    public bool CanStartNow { get; set; }
    public List<string>? LockReasons { get; set; }

    /// <summary>
    /// CTA info for frontend
    /// </summary>
    public string CtaType { get; set; } = string.Empty; // "start", "resume", "view-result", "locked"
    public string? CtaTarget { get; set; } // URL or action target

    /// <summary>
    /// Exam window
    /// </summary>
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public ExamType ExamType { get; set; }
}

#endregion
