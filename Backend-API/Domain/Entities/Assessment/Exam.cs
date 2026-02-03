using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Domain.Entities.Assessment;

public class Exam : BaseEntity
{
    public int Id { get; set; }

    // Department association - for access control
    public int DepartmentId { get; set; }
    public virtual Department Department { get; set; } = null!;

    // Exam Type: Fixed (starts at specific time) or Flex (candidate can start anytime)
    public ExamType ExamType { get; set; } = ExamType.Flex;

    // Bilingual Title & Description
    public string TitleEn { get; set; } = null!;
    public string TitleAr { get; set; } = null!;

    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }

    // Scheduling
    // For Fixed: StartAt is the exact start time, EndAt is calculated as StartAt + DurationMinutes
    // For Flex: StartAt/EndAt define the availability window when candidates can start the exam
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }

    // Duration (in minutes) - how long the candidate has once they start
    public int DurationMinutes { get; set; }

    // Attempts policy
    public int MaxAttempts { get; set; }

    // Randomization rules
    public bool ShuffleQuestions { get; set; }
    public bool ShuffleOptions { get; set; }

    // Passing rule
    public decimal PassScore { get; set; }

    public bool IsPublished { get; set; }
    public bool IsActive { get; set; } = true;

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
    /// Show correct answers during review (only applies if AllowReview is true)
    /// </summary>
    public bool ShowCorrectAnswers { get; set; }

    #endregion

    #region Proctoring Settings

    /// <summary>
    /// Enable AI/human proctoring for this exam
    /// </summary>
    public bool RequireProctoring { get; set; }

    /// <summary>
    /// Require identity verification before starting the exam
    /// </summary>
    public bool RequireIdVerification { get; set; }

    /// <summary>
    /// Require webcam to be enabled during the exam
    /// </summary>
    public bool RequireWebcam { get; set; }

    #endregion

    #region Security Settings

    /// <summary>
    /// Prevent copy/paste operations during the exam
    /// </summary>
    public bool PreventCopyPaste { get; set; }

    /// <summary>
    /// Prevent screen capture/screenshot during the exam
    /// </summary>
    public bool PreventScreenCapture { get; set; }

    /// <summary>
    /// Require exam to run in fullscreen mode
    /// </summary>
    public bool RequireFullscreen { get; set; }

    /// <summary>
    /// Enable browser lockdown mode (blocks other tabs, applications, etc.)
    /// </summary>
    public bool BrowserLockdown { get; set; }

    #endregion

    // Navigation Properties
    public virtual ICollection<ExamSection> Sections { get; set; } = new List<ExamSection>();
    public virtual ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
    public virtual ExamAccessPolicy? AccessPolicy { get; set; }
    public virtual ICollection<ExamInstruction> Instructions { get; set; } = new List<ExamInstruction>();
}
