Current State: All Violation Events During Exam
Here are all events fired during exam-taking, organized by category:

Security/Behavioral Events (Soft Proctoring)

# Event Frontend Code Currently Severity

1 TabSwitched visibilitychange listener Logs event + toast Medium
2 WindowBlur blur event Logs event Low
3 FullscreenExited fullscreenchange listener Logs event + toast Medium
4 CopyAttempt copy event — blocked Logs event + toast (already prevented) Low
5 PasteAttempt paste event — blocked Logs event + toast (already prevented) Low
6 RightClickAttempt contextmenu — blocked Logs event Low
Camera/AI Events (Advanced Proctoring)

# Event Detection Currently Severity

7 FaceNotDetected SmartMonitoring (2s continuous) Logs event + toast High
8 MultipleFacesDetected SmartMonitoring (2s continuous) Logs event + toast High
9 FaceOutOfFrame SmartMonitoring (30% margin) Logs event + toast Medium
10 HeadTurnDetected SmartMonitoring (yaw>30°, pitch>25°) Logs event + toast Medium
11 CameraBlocked SmartMonitoring (dark+low variance) Logs event + toast High
12 WebcamDenied getUserMedia failure Logs event Critical
13 SnapshotFailed Snapshot upload failure Logs event Low

Frontend sends event (e.g., TabSwitched)
↓
Backend LogEventAsync() saves AttemptEvent (existing, no change)
↓
[NEW] Check: Is this a countable violation? (TabSwitched, FaceNotDetected, MultipleFacesDetected, CameraBlocked)
↓ YES
[NEW] Count total countable violations for this attempt from DB
[NEW] Update ProctorSession.CountableViolationCount
↓
[NEW] Load Exam.MaxViolationWarnings (X)
↓
If count == X-1:
→ Set ProctorSession.PendingWarningMessage = "LAST WARNING" (already polled by frontend)
↓
If count >= X:
→ Set Attempt.Status = Terminated
→ Set ProctorSession.IsTerminatedByProctor = true
→ Set ProctorSession.TerminationReason = "Auto-terminated: exceeded {X} violations"
→ Log AttemptEvent(ForceEnded) for audit trail
→ Send SignalR notification to candidate (instant, not wait for poll)
↓
Frontend receives termination → redirects to results page
