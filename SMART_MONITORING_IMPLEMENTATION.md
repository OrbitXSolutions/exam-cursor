# Smart Monitoring (AI Proctoring) — Phase 1 Implementation

## Summary

Client-side AI face detection using **MediaPipe FaceLandmarker** (`@mediapipe/tasks-vision` v0.10.32).
Runs entirely in the candidate's browser — no frames leave the device. Uses the existing webcam stream already running for snapshots + WebRTC live video.

### Detections Implemented

| #   | Detection             | Trigger                                        | Backend Event                | Severity |
| --- | --------------------- | ---------------------------------------------- | ---------------------------- | -------- |
| 1   | **Face Not Detected** | No face for 2s continuous                      | `FaceNotDetected` (18)       | High     |
| 2   | **Multiple Faces**    | >1 face for 2s continuous                      | `MultipleFacesDetected` (19) | Critical |
| 3   | **Face Out of Frame** | Face bbox centre >30% from frame centre for 2s | `FaceOutOfFrame` (20)        | Medium   |
| 4   | **Head Turned Away**  | Yaw >30° or pitch >25° for 2s                  | `HeadTurnDetected` (22)      | Medium   |
| 5   | **Camera Blocked**    | Dark/low-variance frame for 2s (heuristic)     | `CameraBlocked` (21)         | High     |

### Behaviour

- **Cooldown**: 10 seconds per event type (no repeated fires within 10s)
- **Warning**: Reuses existing centered AlertDialog + triple-beep sound
- **Event log**: Each violation auto-logged via `POST /api/Attempt/{id}/events`
- **Proctor visibility**: Events auto-pushed to proctor via SignalR `ViolationEventReceived`
- **Fail-safe**: If model fails to load → exam continues normally, no errors shown

---

## Files Changed

### New Files

| File                                                      | Purpose                                          |
| --------------------------------------------------------- | ------------------------------------------------ |
| `Frontend/Smart-Exam-App-main/lib/ai/smart-monitoring.ts` | Core AI detection module (SmartMonitoring class) |

### Modified Files — Backend

| File                                                            | Change                                                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Backend-API/Domain/Enums/AttemptEnums.cs`                      | Added 5 new enum values: `FaceNotDetected`=18, `MultipleFacesDetected`=19, `FaceOutOfFrame`=20, `CameraBlocked`=21, `HeadTurnDetected`=22 |
| `Backend-API/Domain/Entities/SystemSettings.cs`                 | Added `EnableSmartMonitoring` property (default: `true`)                                                                                  |
| `Backend-API/Controllers/Proctor/VideoRecordingController.cs`   | Added `enableSmartMonitoring` to `/video-config` response                                                                                 |
| `Backend-API/Infrastructure/Services/Attempt/AttemptService.cs` | Added 5 new event types to `ViolationEventTypes` set + severity mappings                                                                  |

### Modified Files — Backend (Settings)

| File                                                     | Change                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| `Backend-API/Controllers/Settings/SettingsController.cs` | Added `EnableSmartMonitoring` to DTO, mapper, and Update method |

### Modified Files — Frontend

| File                                                                               | Change                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `Frontend/Smart-Exam-App-main/lib/api/candidate.ts`                                | Added 5 new `AttemptEventType` enum values                                            |
| `Frontend/Smart-Exam-App-main/lib/webrtc/video-config.ts`                          | Added `enableSmartMonitoring` to `VideoConfig` interface + default + fetch            |
| `Frontend/Smart-Exam-App-main/app/(candidate)/take-exam/[attemptId]/exam-page.tsx` | Import + ref + start SmartMonitoring after video config + violation handler + cleanup |

### Modified Files — Proctor Event Display (Bug Fix)

| File                                                                                         | Change                                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Frontend/Smart-Exam-App-main/lib/api/proctoring.ts`                                         | Added types 18-22 to `EVENT_TYPE_NAMES`, `VIOLATION_TYPES`, and `getEventSeverity()` |
| `Frontend/Smart-Exam-App-main/components/attempt-event-log.tsx`                              | Added icons, labels (EN+AR), and alert styling for 5 AI event types                  |
| `Frontend/Smart-Exam-App-main/app/(dashboard)/proctor-center/recording/[attemptId]/page.tsx` | Added "Head" icon pattern for HeadTurnDetected                                       |

---

## Feature Flag

| Flag                    | Location                    | Default | How to Disable                                                                                  |
| ----------------------- | --------------------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `EnableSmartMonitoring` | `SystemSettings` table (DB) | `true`  | Set to `false` in DB — or add `"Proctoring:EnableSmartMonitoring": false` to `appsettings.json` |

When disabled:

- Frontend receives `enableSmartMonitoring: false` from `/video-config`
- SmartMonitoring class is never instantiated
- No model download, no detection loop, no events fired
- Zero performance impact

---

## Architecture

```
Candidate Browser
┌────────────────────────────────────────────┐
│ getUserMedia(320×240)                      │
│        │                                   │
│        ├── Snapshots (existing)            │
│        ├── CandidatePublisher (existing)   │
│        ├── ChunkRecorder (existing)        │
│        └── SmartMonitoring (NEW)           │
│              │                             │
│              ├── FaceLandmarker.detectForVideo()  │
│              │     ~5 FPS (200ms interval) │
│              │                             │
│              ├── checkCameraBlocked()      │
│              │     (pixel brightness heuristic)   │
│              │                             │
│              ▼                             │
│         onViolation callback               │
│              │                             │
│         ┌────┼────────────────┐            │
│         │  playWarningBeep() │            │
│         │  + AlertDialog     │            │
│         └────┬───────────────┘            │
│              │                             │
│         logAttemptEvent()                  │
│              POST /Attempt/{id}/events     │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Backend (.NET 9)                 │
│  AttemptService.LogEventAsync()  │
│    → Save to AttemptEvent table  │
│    → Push via SignalR:           │
│      ViolationEventReceived      │
│      to attempt_{id} group       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ Proctor Dashboard                │
│  Session detail page             │
│  → Events log (real-time)        │
│  → Violation badges              │
└──────────────────────────────────┘
```

---

## How to Verify Locally

### Prerequisites

- Backend running (e.g., `dotnet run` in Backend-API/)
- Frontend running (e.g., `pnpm dev` in Frontend/Smart-Exam-App-main/)
- Webcam available
- Internet connection (MediaPipe model + WASM loaded from CDN on first run)

### Quick Test

1. Log in as a candidate
2. Start an exam attempt
3. Allow camera access
4. Open browser DevTools → Console
5. Look for:
   ```
   [SmartMonitoring] Loading MediaPipe FaceLandmarker model...
   [SmartMonitoring] ✅ FaceLandmarker loaded successfully
   [ExamPage] ✅ SmartMonitoring started successfully
   ```
6. Cover your camera → after ~2s you should see the warning dialog + beep
7. Look away from screen → after ~2s another warning
8. Verify event appears in Console:
   ```
   [SmartMonitoring] 🚨 Violation: CameraBlocked — Your camera appears to be blocked...
   ```

### Verify Feature Flag

1. In the database, set `SystemSettings.EnableSmartMonitoring = false`
2. Restart exam → Console should show:
   ```
   [ExamPage] enableSmartMonitoring=false, skipping AI detection
   ```
3. No AI warnings should fire

---

## Manual Test Checklist

| #   | Test                             | Expected Result                          | Pass/Fail |
| --- | -------------------------------- | ---------------------------------------- | --------- |
| 1   | Candidate starts exam normally   | No errors, webcam starts, model loads    |           |
| 2   | Face absent >2s                  | Warning dialog + beep + event logged     |           |
| 3   | Multiple faces >2s               | Warning dialog + beep + event logged     |           |
| 4   | Face out of centre >2s           | Warning dialog + beep + event logged     |           |
| 5   | Head turned left/right >2s       | Warning dialog + beep + event logged     |           |
| 6   | Camera covered/dark >2s          | Warning dialog + beep + event logged     |           |
| 7   | Same violation within 10s        | NOT fired again (cooldown)               |           |
| 8   | Proctor sees events in dashboard | Events appear in real-time via SignalR   |           |
| 9   | Feature flag OFF                 | No model loaded, no detection, no events |           |
| 10  | Model fails to load (offline)    | Exam continues normally, no crash        |           |

---

## Performance

| Metric               | Value                               |
| -------------------- | ----------------------------------- |
| Model size           | ~2MB (loaded from Google CDN)       |
| WASM runtime         | ~5MB (loaded from jsDelivr CDN)     |
| Detection interval   | 200ms (~5 FPS)                      |
| Per-frame cost       | ~5-15ms (GPU delegate, WebGL)       |
| Camera blocked check | <1ms (64×48 pixel sampling)         |
| Memory overhead      | ~50MB                               |
| First load time      | 2-5s (model download, cached after) |

---

## Known Limitations

1. **CDN dependency**: Model + WASM loaded from Google/jsDelivr CDN. If candidate is behind a strict proxy that blocks these domains, AI detection won't start (exam continues normally).

2. **GPU requirement**: Best performance on devices with WebGL support. Falls back to CPU automatically but will be slower (~30ms/frame).

3. **Head pose estimation**: Uses landmark geometry (not a trained pose model). Accuracy is ±5° — sufficient for "obviously looking away" but not for subtle glances.

4. **Camera blocked heuristic**: Based on brightness + variance. Very bright white frames (e.g., camera facing ceiling light) will NOT trigger camera blocked — only darkness/coverage.

5. **No phone detection**: ObjectDetector (COCO-SSD) skipped for Phase 1 to keep single-model performance. Planned for Phase 2.

6. **No auto-terminate**: All violations are warnings only. Termination remains a manual proctor decision.

7. **Single-browser tested**: Alert dialog may behave differently in Firefox vs Chrome for the `onOpenChange` handler.

8. **DB migration needed**: `EnableSmartMonitoring` column added to `SystemSettings` entity. Run `dotnet ef migrations add AddSmartMonitoring` and `dotnet ef database update` (or let EF auto-create on next startup if using EnsureCreated).

## For testing

Test Steps
Open http://localhost:3000 in Chrome
Log in as a candidate and start an exam attempt
Allow camera when prompted
Open DevTools (F12 → Console tab) — look for these lines:
Test each detection:
Test Action Expected (after ~2s)
Face absent Cover camera with hand or look completely away Warning dialog + beep
Multiple faces Have someone lean into frame next to you Warning dialog + beep
Head turned Turn head left/right significantly Warning dialog + beep
Camera blocked Cover camera with tape/paper (dark) Warning dialog + beep
Face out of frame Move to edge of camera view Warning dialog + beep
Cooldown Trigger same violation again within 10s Should NOT fire again
Proctor side: Open a second browser/tab, log in as proctor, go to /proctor-center → open the active session → events should appear in real-time
The first run will take 2-5 seconds extra to download the ~2MB model from Google CDN. After that it's cached by the browser.
