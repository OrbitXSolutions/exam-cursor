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
