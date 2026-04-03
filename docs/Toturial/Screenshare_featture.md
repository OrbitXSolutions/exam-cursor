🧾 Technical Requirements — Screen Monitoring (Concise)
🎯 Objective

Enable proctors to view the candidate’s browser screen during the exam, with proper event tracking and configurable enforcement.

1. Core Feature
   Candidate can share screen (window) before or during the exam
   Proctor can view the screen live
   Screen status must be visible:
   Active / Not Started / Stopped / Lost ..etc
2. Modes (per exam)
   Disabled → feature off
   Optional → candidate may continue without sharing (log event)
   Required → must share before starting exam
   Strict → if sharing stops → warning + action

3. Events (critical)

System must log:

Started
Denied
Stopped
Lost
Resumed

Each with timestamp + attemptId

4. Enforcement
   Required → block exam start until sharing begins
   Strict → if sharing stops:
   show warning
   start grace period (e.g. 20 seconds)
   then apply action (flag or terminate)
5. Proctor View
   Show:
   camera stream
   shared screen
   Display clear status
   Show alerts on stop/loss
6. Candidate UX
   Show clear consent message before exam
   Provide “Share Screen” action
   Notify candidate if sharing stops and allow retry
7. Recording (optional)
   Support optional screen recording
   If disabled → live + events only
8. Settings
   EnableScreenMonitoring
   Mode (Optional / Required / Strict)
   GracePeriod
   RecordScreen (true/false)
9. Constraints
   No silent capture (user permission required)
   Prefer tab/window over full screen
   Must be behind feature flag
   No breaking changes to existing system
10. Event Logging Requirements

The system must log all screen monitoring lifecycle events with precise timestamps and attempt/session association.

AddedEvents
Required events include:
ScreenShareRequested
ScreenShareStarted
ScreenShareDenied
ScreenShareStopped
ScreenShareLost
ScreenShareResumed
ScreenSharePermissionRevoked
ScreenShareTrackEnded
ScreenShareRecordingStarted
ScreenShareRecordingStopped
===================================================================================
