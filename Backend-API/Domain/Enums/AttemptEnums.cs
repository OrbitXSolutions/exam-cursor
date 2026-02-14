namespace Smart_Core.Domain.Enums;

/// <summary>
/// Represents the lifecycle status of an exam attempt
/// </summary>
public enum AttemptStatus : byte
{
    /// <summary>
    /// Attempt has been created but candidate hasn't started answering
    /// </summary>
    Started = 1,

    /// <summary>
    /// Candidate is actively answering questions
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// Candidate has submitted the attempt
    /// </summary>
    Submitted = 3,

    /// <summary>
    /// Attempt has expired due to time limit
    /// </summary>
    Expired = 4,

    /// <summary>
    /// Attempt was cancelled by admin/support
    /// </summary>
    Cancelled = 5,

    /// <summary>
    /// Attempt was paused (by admin or system)
    /// </summary>
    Paused = 6,

    /// <summary>
    /// Attempt was force-submitted by an administrator
    /// </summary>
    ForceSubmitted = 7,

    /// <summary>
    /// Attempt was terminated by a proctor (not a submission)
    /// </summary>
    Terminated = 8
}

/// <summary>
/// Types of events that can occur during an exam attempt
/// </summary>
public enum AttemptEventType : byte
{
    /// <summary>
    /// Attempt was started
    /// </summary>
    Started = 1,

    /// <summary>
    /// An answer was saved (autosave or manual)
    /// </summary>
    AnswerSaved = 2,

    /// <summary>
    /// Candidate navigated between questions
    /// </summary>
    Navigated = 3,

    /// <summary>
    /// Candidate switched browser tab
    /// </summary>
    TabSwitched = 4,

    /// <summary>
    /// Candidate exited fullscreen mode
    /// </summary>
    FullscreenExited = 5,

    /// <summary>
    /// Attempt was submitted
    /// </summary>
    Submitted = 6,

    /// <summary>
    /// Attempt timed out
    /// </summary>
    TimedOut = 7,

    /// <summary>
    /// Window lost focus (blur)
    /// </summary>
    WindowBlur = 8,

    /// <summary>
    /// Window gained focus
    /// </summary>
    WindowFocus = 9,

    /// <summary>
    /// Copy attempt detected
    /// </summary>
    CopyAttempt = 10,

    /// <summary>
    /// Paste attempt detected
    /// </summary>
    PasteAttempt = 11,

    /// <summary>
    /// Right-click attempt detected
    /// </summary>
    RightClickAttempt = 12,

    /// <summary>
    /// Attempt was force-ended by admin
    /// </summary>
    ForceEnded = 13,

    /// <summary>
    /// Attempt was resumed by admin
    /// </summary>
    AdminResumed = 14,

    /// <summary>
    /// Extra time was added by admin
    /// </summary>
    TimeAdded = 15,

    /// <summary>
    /// Webcam permission was denied by the candidate
    /// </summary>
    WebcamDenied = 16,

    /// <summary>
    /// Proctor snapshot upload failed
    /// </summary>
    SnapshotFailed = 17
}
