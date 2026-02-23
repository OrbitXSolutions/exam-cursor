using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.Assessment;

#region Exam DTOs

/// <summary>
/// Full exam details with all related data
/// </summary>
public class ExamDto
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public string? DepartmentNameEn { get; set; }
    public string? DepartmentNameAr { get; set; }
    public ExamType ExamType { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxAttempts { get; set; }
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public decimal PassScore { get; set; }
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; }

    #region Result & Review Settings

    /// <summary>
    /// Show results to candidate after exam submission
    /// </summary>
    public bool ShowResults { get; set; }

    /// <summary>
    /// Allow candidate to review their answers after submission
    /// </summary>
    public bool AllowReview { get; set; }

    /// <summary>
    /// Show correct answers during review
    /// </summary>
    public bool ShowCorrectAnswers { get; set; }

    #endregion

    #region Proctoring Settings

    /// <summary>
    /// Enable proctoring for this exam
    /// </summary>
    public bool RequireProctoring { get; set; }

    /// <summary>
    /// Require identity verification before starting
    /// </summary>
    public bool RequireIdVerification { get; set; }

    /// <summary>
    /// Require webcam to be enabled
    /// </summary>
    public bool RequireWebcam { get; set; }

    #endregion

    #region Security Settings

    /// <summary>
    /// Prevent copy/paste operations
    /// </summary>
    public bool PreventCopyPaste { get; set; }

    /// <summary>
    /// Prevent screen capture/screenshot
    /// </summary>
    public bool PreventScreenCapture { get; set; }

    /// <summary>
    /// Require fullscreen mode
    /// </summary>
    public bool RequireFullscreen { get; set; }

    /// <summary>
    /// Enable browser lockdown mode
    /// </summary>
    public bool BrowserLockdown { get; set; }

    #endregion

    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public int SectionsCount { get; set; }
    public int QuestionsCount { get; set; }
    public decimal TotalPoints { get; set; }
    public List<ExamSectionDto> Sections { get; set; } = new();
    public List<ExamInstructionDto> Instructions { get; set; } = new();
    public ExamAccessPolicyDto? AccessPolicy { get; set; }
}

/// <summary>
/// Lightweight exam list item
/// </summary>
public class ExamListDto
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public string? DepartmentNameEn { get; set; }
    public string? DepartmentNameAr { get; set; }
    public ExamType ExamType { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PassScore { get; set; }
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public int SectionsCount { get; set; }
    public int QuestionsCount { get; set; }
    public decimal TotalPoints { get; set; }
}

/// <summary>
/// Minimal exam item for dropdowns (id + name only)
/// </summary>
public class ExamDropdownItemDto
{
    public int Id { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
}

/// <summary>
/// Create or Update Exam DTO (same properties for both operations)
/// </summary>
public class SaveExamDto
{
    /// <summary>
    /// Department ID. If not provided (null or 0), will use the current user's department.
    /// SuperDev users must provide a department ID.
    /// </summary>
    public int? DepartmentId { get; set; }
    public ExamType ExamType { get; set; } = ExamType.Flex;
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxAttempts { get; set; } = 1;
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }
    public decimal PassScore { get; set; }
    public bool IsActive { get; set; } = true;

    #region Result & Review Settings

    /// <summary>
    /// Show results to candidate after exam submission (default: true)
    /// </summary>
    public bool ShowResults { get; set; } = true;

    /// <summary>
    /// Allow candidate to review their answers after submission
    /// </summary>
    public bool AllowReview { get; set; }

    /// <summary>
    /// Show correct answers during review
    /// </summary>
    public bool ShowCorrectAnswers { get; set; }

    #endregion

    #region Proctoring Settings

    /// <summary>
    /// Enable proctoring for this exam
    /// </summary>
    public bool RequireProctoring { get; set; }

    /// <summary>
    /// Require identity verification before starting
    /// </summary>
    public bool RequireIdVerification { get; set; }

    /// <summary>
    /// Require webcam to be enabled
    /// </summary>
    public bool RequireWebcam { get; set; }

    #endregion

    #region Security Settings

    /// <summary>
    /// Prevent copy/paste operations
    /// </summary>
    public bool PreventCopyPaste { get; set; }

    /// <summary>
    /// Prevent screen capture/screenshot
    /// </summary>
    public bool PreventScreenCapture { get; set; }

    /// <summary>
    /// Require fullscreen mode
    /// </summary>
    public bool RequireFullscreen { get; set; }

    /// <summary>
    /// Enable browser lockdown mode
    /// </summary>
    public bool BrowserLockdown { get; set; }

    #endregion
}

/// <summary>
/// Update only exam settings (result/review, proctoring, security)
/// </summary>
public class UpdateExamSettingsDto
{
    #region Result & Review Settings

    /// <summary>
    /// Show results to candidate after exam submission
    /// </summary>
    public bool ShowResults { get; set; } = true;

    /// <summary>
    /// Allow candidate to review their answers after submission
    /// </summary>
    public bool AllowReview { get; set; }

    /// <summary>
    /// Show correct answers during review (requires AllowReview to be true)
    /// </summary>
    public bool ShowCorrectAnswers { get; set; }

    #endregion

    #region Proctoring Settings

    /// <summary>
    /// Enable proctoring for this exam
    /// </summary>
    public bool RequireProctoring { get; set; }

    /// <summary>
    /// Require identity verification before starting
    /// </summary>
    public bool RequireIdVerification { get; set; }

    /// <summary>
    /// Require webcam to be enabled
    /// </summary>
    public bool RequireWebcam { get; set; }

    #endregion

    #region Security Settings

    /// <summary>
    /// Prevent copy/paste operations
    /// </summary>
    public bool PreventCopyPaste { get; set; }

    /// <summary>
    /// Prevent screen capture/screenshot
    /// </summary>
    public bool PreventScreenCapture { get; set; }

    /// <summary>
    /// Require fullscreen mode
    /// </summary>
    public bool RequireFullscreen { get; set; }

    /// <summary>
    /// Enable browser lockdown mode
    /// </summary>
    public bool BrowserLockdown { get; set; }

    #endregion
}

/// <summary>
/// Clone an existing exam as a new draft exam
/// </summary>
public class CloneExamDto
{
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public ExamType ExamType { get; set; } = ExamType.Flex;
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int DurationMinutes { get; set; }
}

/// <summary>
/// Search/filter exams
/// </summary>
public class ExamSearchDto
{
    public string? Search { get; set; }
    public int? DepartmentId { get; set; }
    public ExamType? ExamType { get; set; }
    public bool? IsPublished { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public bool IncludeDeleted { get; set; } = false;
    /// <summary>
    /// If true, returns only exams from the current user's department.
    /// SuperDev can see all exams regardless of this setting.
    /// </summary>
    public bool FilterByUserDepartment { get; set; } = true;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

#endregion
