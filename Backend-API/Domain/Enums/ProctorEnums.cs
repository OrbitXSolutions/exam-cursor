namespace Smart_Core.Domain.Enums;

/// <summary>
/// Proctoring mode for an exam session
/// </summary>
public enum ProctorMode : byte
{
   /// <summary>
   /// Behavioral monitoring only (no camera/mic)
   /// </summary>
   Soft = 1,

   /// <summary>
   /// Full proctoring with camera/microphone
   /// </summary>
   Advanced = 2
}

/// <summary>
/// Status of a proctor session
/// </summary>
public enum ProctorSessionStatus : byte
{
   /// <summary>
   /// Session is active and accepting events
   /// </summary>
   Active = 1,

   /// <summary>
   /// Session completed normally
   /// </summary>
   Completed = 2,

   /// <summary>
   /// Session was cancelled by admin
   /// </summary>
   Cancelled = 3
}

/// <summary>
/// Types of proctor events that can be tracked
/// </summary>
public enum ProctorEventType : byte
{
   // Soft Proctor Signals (1-49)
   /// <summary>
   /// Periodic activity ping
   /// </summary>
   Heartbeat = 1,

   /// <summary>
   /// Candidate switched browser tabs
   /// </summary>
   TabSwitched = 2,

   /// <summary>
   /// Browser window lost focus
   /// </summary>
   WindowBlurred = 3,

   /// <summary>
   /// Candidate exited fullscreen mode
   /// </summary>
   FullscreenExited = 4,

   /// <summary>
   /// Copy attempt detected
   /// </summary>
   CopyAttempt = 5,

   /// <summary>
   /// Paste attempt detected
   /// </summary>
   PasteAttempt = 6,

   /// <summary>
   /// Right-click was blocked
   /// </summary>
   RightClickBlocked = 7,

   /// <summary>
   /// Developer tools opened (heuristic detection)
   /// </summary>
   DevToolsOpened = 8,

   /// <summary>
   /// Network connection lost
   /// </summary>
   NetworkDisconnected = 9,

   /// <summary>
   /// Network connection restored
   /// </summary>
   NetworkReconnected = 10,

   /// <summary>
   /// Keyboard shortcut blocked
   /// </summary>
   KeyboardShortcutBlocked = 11,

   /// <summary>
   /// Print screen attempt
   /// </summary>
   PrintScreenAttempt = 12,

   // Advanced Proctor Signals (50-99)
   /// <summary>
   /// Camera permission denied
   /// </summary>
   CameraDenied = 50,

   /// <summary>
   /// Microphone permission denied
   /// </summary>
   MicrophoneDenied = 51,

   /// <summary>
   /// No face detected in frame
   /// </summary>
   FaceNotDetected = 52,

   /// <summary>
   /// Multiple faces detected in frame
   /// </summary>
   MultipleFacesDetected = 53,

   /// <summary>
   /// Camera was covered or blocked
   /// </summary>
   CameraBlocked = 54,

   /// <summary>
   /// Face moved out of frame
   /// </summary>
   FaceOutOfFrame = 55,

   /// <summary>
   /// Suspicious audio detected
   /// </summary>
   SuspiciousAudio = 56,

   /// <summary>
   /// Screen share started
   /// </summary>
   ScreenShareStarted = 57,

   /// <summary>
   /// Screen share ended
   /// </summary>
   ScreenShareEnded = 58,

   // Proctor-initiated signals (59+)
   /// <summary>
   /// Warning sent by proctor to candidate
   /// </summary>
   ProctorWarning = 59,

   /// <summary>
   /// Session flagged by proctor
   /// </summary>
   ProctorFlagged = 60,

   /// <summary>
   /// Session unflagged by proctor
   /// </summary>
   ProctorUnflagged = 61,

   /// <summary>
   /// Session terminated by proctor
   /// </summary>
   ProctorTerminated = 62
}

/// <summary>
/// Types of evidence that can be captured
/// </summary>
public enum EvidenceType : byte
{
   /// <summary>
   /// Video recording
   /// </summary>
   Video = 1,

   /// <summary>
   /// Audio recording
   /// </summary>
   Audio = 2,

   /// <summary>
   /// Still image/photo
   /// </summary>
   Image = 3,

   /// <summary>
   /// Screen capture/screenshot
   /// </summary>
   ScreenCapture = 4,

   /// <summary>
   /// Screen recording
   /// </summary>
   ScreenRecording = 5
}

/// <summary>
/// Decision status for proctor review
/// </summary>
public enum ProctorDecisionStatus : byte
{
   /// <summary>
   /// Awaiting review
   /// </summary>
   Pending = 1,

   /// <summary>
   /// No issues found, attempt is valid
   /// </summary>
   Cleared = 2,

   /// <summary>
   /// Suspicious activity detected, needs investigation
   /// </summary>
   Suspicious = 3,

   /// <summary>
   /// Confirmed cheating, attempt invalidated
   /// </summary>
   Invalidated = 4,

   /// <summary>
   /// Escalated to formal incident process
   /// </summary>
   Escalated = 5
}
