QUESTIONS BEFORE IMPLEMENTATION
AI Provider: Which AI service are you using?

OpenAI API (GPT-4)?
Azure OpenAI?
Already configured somewhere in the project?
If not configured, I need API key + endpoint
AI Prompt Strategy: For the AI grading helper, I'll use this prompt pattern:

Does this look right? Any adjustments?

Grading page location: Can you tell me the exact route/file path of the existing grading page so I can integrate the rubric display + AI helper into it?

Bilingual AI grading: Should AI grade based on the language the candidate answered in? Or always English?

Once confirmed I start implementation immediately.

- Phone detection via COCO-SSD is **NOT part of this phase** (do not implement phone detection now).

## Candidate Detection

# Smart Exam — Smart Monitoring (AI Proctoring) Phase 1 — MediaPipe Tasks Vision

## Non-negotiable rules

1. **NO UI design changes**. Do NOT change styles, colors, layout, typography, design system.

2. **NO breaking changes**. Do not modify existing exam submit/grading/result flows. If AI fails, exam continues normally.
3. **Client-side only**. No server-side frame processing. No uploading frames for AI.
4. **Minimal impact**. Do not degrade exam page responsiveness. Do not increase backend calls beyond what is necessary for logging violations.

5. **Discovery-first**: Inspect the repo and reuse existing IDs, endpoints, event log, SignalR push, and warning mechanisms. Do not invent new patterns unless needed.

## AI library decisions (fixed)

- Use **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`) for:
  - Face presence → `FaceNotDetected`
  - Multiple faces → `MultipleFacesDetected`
    what else you can detect?
- **Do NOT use** `face-api.js`
- **Do NOT use** BlazeFace if MediaPipe is available

## Required detections & behaviors (Phase 1 scope)

You must implement these 5 checks on the candidate side, based on the already-running webcam stream:

### 1) Face Not Detected

- Trigger violation only after **2 seconds continuous** face absence.
- Fire existing backend event type: `FaceNotDetected` (enum code already exists).
- Show the existing centered warning overlay + existing beep.

### 2) Multiple Faces Detected

- Trigger violation only after **2 seconds continuous** detection of > 1 face.
- Fire existing backend event type: `MultipleFacesDetected`.
- Show the existing centered warning overlay + existing beep.

### 3) Cooldown (anti-spam)

- Cooldown per event type: **10 seconds** (do not fire the same violation repeatedly within 10s).
- This is required to prevent UI spam and event log flooding.

### 4) CameraBlocked

- Implement a simple heuristic (not AI) to detect camera blocked / very dark frames (e.g., low brightness/low variance) continuously for **2 seconds**.
- Fire existing backend event type: `CameraBlocked`.
- Show warning overlay + beep.

### 5) FaceOutOfFrame

- Use the face bounding box position to detect if the face is significantly out of the central region continuously for **2 seconds** (define a reasonable center threshold).
- Fire existing backend event type: `FaceOutOfFrame`.
- Show warning overlay + beep.

## Event logging & proctor visibility

- Each violation must:
  1. Be logged into the existing **EventLog** (ProctorEvent pipeline).
  2. Be visible to the proctor in real-time if the system already supports that (SignalR/event push). Reuse existing real-time mechanisms.
- Do NOT implement new “risk score escalation” logic in this phase.
- Do NOT implement auto-terminate. Termination remains a manual proctor decision.

## Performance requirements

- Run detection at a controlled rate (e.g., 5–10 FPS max). Do not process every video frame.
- Must not freeze the exam UI.
- If model loading fails or permissions fail:
  - Fail silently (log to console)
  - Continue exam normally
  - Snapshots + existing proctoring remain unaffected

## Implementation approach requirements

1. Start with a **Discovery Report**:
   - Where is the candidate warning overlay + beep implemented? How to trigger it without UI changes?
   - Where do proctor warnings/events get logged? Which endpoint or SignalR call is used?
   - What is the correct ID to attach events to (AttemptId / SessionId) based on current code?
   - Where should the AI module hook into the candidate video pipeline (reuse existing getUserMedia stream)?
2. Provide a **TODO plan** (milestones + file-level changes).
3. Implement behind a **feature flag** (system setting or config) e.g. `EnableSmartMonitoring` (name can follow existing conventions).
4. Add minimal settings for thresholds (optional) but defaults must match the spec above.
5. At the end, deliver a single markdown file:
   **SMART_MONITORING_IMPLEMENTATION.md**
   including:
   - Summary
   - Files changed
   - Feature flag(s) and defaults
   - How to verify locally
   - Manual test checklist (pass/fail)
   - Known limitations

## Manual test checklist (must complete and report)

- Candidate starts exam normally (no errors).
- Face absent for >2s → warning appears centered + existing beep + event logged.
- Multiple faces for >2s → warning + beep + event logged.
- Face out of center for >2s → warning + beep + event logged.
- Camera blocked/dark for >2s → warning + beep + event logged.
- Cooldown works (no repeated events within 10s per type).
- Proctor can see the violation events on their side (existing UI/event log).
- Turning feature flag OFF disables all AI checks and no events are fired.

## Start now

Begin with Discovery Report + TODO plan. Do not start coding until you confirm the discovery findings and the exact integration points you will use.

- The warning same as cuurent sound but may appears centered in the candidate page/ or bigger size with longer duration.

## Performance Issue

Yes — I know exactly what's happening. The performance issue is the SmartMonitoring AI face detection running MediaPipe FaceLandmarker at 200ms intervals (5 FPS) on the candidate's browser. When you're screen-sharing via Teams + running two browsers side by side, the candidate tab is doing:

WebRTC video publishing (encoding + sending webcam)
Video chunk recording (MediaRecorder encoding 3s WebM chunks)
MediaPipe FaceLandmarker AI inference every 200ms ← the heavy one
Canvas frame analysis (brightness/variance for camera-blocked detection)
All of this on the same machine that's also running Teams screen share + the proctor browser with WebRTC video decoding.

Quick fixes to discuss:
Option A: Reduce detection frequency (safest)
Change detection interval from 200ms (5 FPS) to 500ms (2 FPS) or even 1000ms (1 FPS). Face detection doesn't need 5 FPS — checking once per second is plenty for proctoring.

Option B: Disable SmartMonitoring for the demo
Since you already have the proctor watching the live video, the AI detection is supplementary. You can turn it off from the backend settings (it's a toggle). Zero code changes.

Option C: Both — reduce frequency now, let admin toggle it off if needed
My recommendation for the demo: Go with Option C — reduce to 1 FPS in code (still works but 5x lighter), and if it's still slow during the demo, the admin can disable it from Settings with one click.

Current: 200ms (5 FPS) — way too heavy.

My recommendation: 1000ms (1 FPS). Here's why:

Interval FPS CPU Load Detection Quality
200ms 5 Heavy ← current Overkill for proctoring
500ms 2 Medium Good
1000ms 1 Light Perfectly fine — 2s threshold means you still catch violations within 3s
2000ms 0.5 Very light Might feel sluggish with the 2s continuous threshold
1 FPS is the sweet spot — the 2-second continuous threshold still works (needs 2 consecutive detections to fire), and it's 5x lighter on CPU. The candidate won't notice any difference in behavior, but CPU usage drops massively.

Want me to go with 1000ms?

FPS = Frames Per Second — how many times per second the AI analyzes a video frame from the webcam.
200ms interval = 5 FPS → AI checks the webcam image 5 times every second
1000ms interval = 1 FPS → AI checks once per second
More checks = more CPU usage. For proctoring (detecting if a face is missing), once per second is more than enough. You don't need 5 checks per second to notice someone walked away from the screen.

That works too — 2000ms (once every 2 seconds). Even lighter on CPU. The only tradeoff: with a 2s continuous threshold, it takes ~4 seconds to fire a violation instead of ~3s. Totally fine for a demo.

Done. Detection interval changed from 200ms → 2000ms (once every 2 seconds). That's a 10x reduction in CPU usage from the AI module.

Done. Here's what happens now when a candidate submits:

Overlay appears on the live video showing "Exam Submitted" with a green checkmark
Green success toast (15 seconds) appears: "Candidate has submitted the exam (Attempt #X)" with a "View Report Now" action button the proctor can click immediately
Auto-redirect after 15 seconds to /proctor-center/video/{candidateId}?attemptId={attemptId} — the candidate's full session evidence page (video recording, snapshots, screen captures, events log)
The proctor can either click "View Report Now" on the toast to go immediately, or wait 15 seconds for the auto-redirect. They won't stay stuck on the dead session details page.

##

Issue 2: No STUN/TURN servers configured (CRITICAL for WebRTC)
StunServers: [] in appsettings — works on localhost because both browsers are on the same network. On the server, candidate and proctor are on different networks, so WebRTC peer-to-peer can't discover public IPs without STUN, and can't relay through NAT without TURN.

3. No Transport Fallback
   Problem: skipNegotiation: true + WebSockets only — if IIS WebSocket module has any issue, connection dies with no fallback.
   Fix: In production, the client now uses accessTokenFactory with negotiate enabled, allowing automatic fallback to ServerSentEvents → LongPolling. Localhost keeps the fast skipNegotiation path.

4. No STUN Servers (WebRTC breaks across networks)
   Problem: StunServers: [] — works on localhost (same network), fails on server (candidate and proctor on different networks, NAT can't be traversed).
   Fix: Added Google STUN servers in appsettings.json:

stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
stun:stun2.l.google.com:19302 5. IIS WebSocket Config
Created web.config with <webSocket enabled="true" /> for SmarterASP IIS hosting.
