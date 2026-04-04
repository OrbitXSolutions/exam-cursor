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
Plan: Screen Monitoring (Live Screen Share)
TL;DR: Add live screen sharing from candidate → proctor via a separate RTCPeerConnection (independent from webcam), with per-exam configurable modes (Disabled/Optional/Required/Strict), event logging, enforcement logic, and a 50/50 split proctor view. Phase 1 = live-only, no screen recording.

Phase 1: Backend — Schema & Settings (blocks all other phases)
Extend Exam entity — Add 3 fields to Exam.cs proctoring region:

EnableScreenMonitoring (bool, default false)
ScreenMonitoringMode (int, default 0 → Disabled)
ScreenShareGracePeriod (int, default 20 seconds)
Add ScreenMonitoringMode enum to ProctorEnums.cs: Disabled=0, Optional=1, Required=2, Strict=3

Add 6 new ProctorEventType values starting at 70: ScreenShareRequested=70, ScreenShareDenied=71, ScreenShareLost=72, ScreenShareResumed=73, ScreenSharePermissionRevoked=74, ScreenShareTrackEnded=75 (note: ScreenShareStarted=57 and ScreenShareEnded=58 already exist)

EF Core migration — 3 new columns with safe defaults (non-breaking)

Update DTOs — Add fields to ExamDto, CreateExamDto, UpdateExamDto in ExamDtos.cs and CandidateExamSettingsDto in CandidateDtos.cs

Extend video-config — Add enableScreenMonitoring: true to VideoRecordingController.cs response

Phase 2: Backend — SignalR Hub Extension (blocks Frontend Phase 4)
Add 6 screen signaling methods to ProctorHub.cs using separate group attempt\_{attemptId}\_screen:

JoinScreenRoom, LeaveScreenRoom, SendScreenOffer, SendScreenAnswer, SendScreenIceCandidate, NotifyScreenShareStatus
New client events: ScreenPeerJoined, ScreenPeerLeft, ReceiveScreenOffer, ReceiveScreenAnswer, ReceiveScreenIceCandidate, ScreenShareStatusChanged

Phase 3: Frontend — WebRTC Classes (parallel with Phase 2)
Create ScreenSharePublisher — New file lib/webrtc/screen-share-publisher.ts, modeled after CandidatePublisher:

Uses getDisplayMedia({ video: { displaySurface: "window" } })
Tracks track.onended (browser stop sharing button)
Status: idle → requesting → active → stopped/denied/lost
Auto-reconnect on ICE failure
Create ScreenShareViewer — New file lib/webrtc/screen-share-viewer.ts, modeled after ProctorViewer:

Joins screen room, handles screen-prefixed signaling events
Extend ProctorSignaling in proctor-signaling.ts — Add joinScreenRoom, leaveScreenRoom, sendScreenOffer/Answer/IceCandidate, notifyScreenShareStatus + register new client events

Update VideoConfig interface in video-config.ts — Add enableScreenMonitoring: boolean

Phase 4: Frontend — Candidate Integration (depends on Phase 2 + 3)
Consent dialog — New file components/exam/screen-share-consent.tsx using existing Dialog/Button components. Shows "Screen Sharing Required/Optional" with consent message and Share/Skip actions

Integrate into exam-page.tsx — In exam-page.tsx/take-exam/[attemptId]/exam-page.tsx):

Check examSettings.enableScreenMonitoring + screenMonitoringMode
Required/Strict: Show consent → block exam start until sharing begins
Optional: Show consent → allow skip (log ScreenShareDenied)
Instantiate ScreenSharePublisher on share
Enforcement logic in exam-page.tsx:

Optional: Log event, continue
Required: Warning + prompt re-share, exam continues
Strict: Warning → grace period countdown (screenShareGracePeriod seconds) → increment violation count → existing MaxViolationWarnings handles termination
Status indicator — Small badge in exam header: green (active), red (stopped), gray (not sharing)

Phase 5: Frontend — Proctor View (depends on Phase 3)
Update proctor session page in page.tsx/proctor-center/[sessionId]/page.tsx):

50/50 grid: webcam (left) + screen share (right)
Each with status indicator + fullscreen toggle
If screen monitoring disabled for exam → webcam full-width (backward compatible)
Screen share alerts — Show status changes (Active/Stopped/Lost) in real-time via ScreenShareStatusChanged SignalR event; integrate into existing events timeline

Phase 6: Frontend — Exam Configuration (parallel with Phase 4/5)
Add settings to Security tab in configuration/page.tsx/exams/[id]/configuration/page.tsx):
enableScreenMonitoring toggle (Monitor icon)
screenMonitoringMode select (Optional/Required/Strict) — visible when enabled
screenShareGracePeriod number input — visible only in Strict mode
Include in "Activate All" master toggle
Add Zod validation
Verification
dotnet build — no compile errors after schema changes
EF migration — 3 columns with correct defaults, existing data unaffected
GET /api/Proctor/video-config returns enableScreenMonitoring
Create exam → enable screen monitoring → verify saved
Optional mode: consent → skip → exam starts → event logged
Required mode: consent → block until shared → share → exam starts
Strict mode: share → stop → warning → grace period → violation counted
Proctor view: 50/50 layout, both streams visible, status indicators
Backward compat: Existing exams (enableScreenMonitoring=false) — zero layout/behavior changes, zero extra API calls
Key Decisions
Decision Choice Rationale
PeerConnection Separate from webcam Independent start/stop, no renegotiation needed
SignalR group attempt\_{attemptId}\_screen Clean separation from webcam signaling
New event types 70-75 range 57-58 already exist; avoids enum gaps
Recording Excluded Phase 1 Live + events sufficient; recording adds complexity
Strict action Increment violation count Reuses existing MaxViolationWarnings logic
Settings scope Per-exam only No system toggle needed yet
getDisplayMedia displaySurface: "window" Prefer window over full screen per requirements
Scope Boundaries
Included: Live screen sharing, 4 modes, event logging, consent UI, enforcement, proctor 50/50 view, exam settings
Excluded: Screen recording/storage, screen replay, AI analysis of screen content
Estimated ~15 files touched (8 modified, 3 new, 1 migration). No breaking changes — all new fields default to disabled. Ready for your review.
