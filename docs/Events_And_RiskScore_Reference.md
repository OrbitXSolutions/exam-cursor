# Events & Risk Score — Complete Reference

> **Source of truth**: Extracted directly from backend source code (Domain enums, ProctorService, ProctorRiskRule entity).

---

## 1. Event Systems Overview

The platform tracks events across **three independent systems**:

| System                       | Entity                  | Table                    | Purpose                                                |
| ---------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------ |
| **Proctor Events**           | `ProctorEvent`          | `ProctorEvents`          | Real-time proctoring signals (camera, browser, screen) |
| **Attempt Events**           | `AttemptEvent`          | `AttemptEvents`          | Candidate exam activity audit log                      |
| **Incident Timeline Events** | `IncidentTimelineEvent` | `IncidentTimelineEvents` | Case management lifecycle tracking                     |

---

## 2. Proctor Events (`ProctorEventType`)

Stored in `ProctorEvents` table. Each event has:

- `EventType` (enum byte)
- `Severity` (0–5, where 5 = most severe)
- `IsViolation` (bool, computed on insert)
- `MetadataJson` (context-specific JSON payload)
- `OccurredAt` (server timestamp — source of truth)
- `ClientTimestamp` (browser-reported, for reference only)
- `SequenceNumber` (ordering within a session)

### 2.1 Soft Proctor Signals (Values 1–49)

> Available in both `Soft` and `Advanced` proctoring modes.

| Value | Name                      | Description                                        |
| ----- | ------------------------- | -------------------------------------------------- |
| 1     | `Heartbeat`               | Periodic activity ping — **never a violation**     |
| 2     | `TabSwitched`             | Candidate switched browser tabs                    |
| 3     | `WindowBlurred`           | Browser window lost focus                          |
| 4     | `FullscreenExited`        | Candidate exited fullscreen mode                   |
| 5     | `CopyAttempt`             | Copy attempt detected (Ctrl+C / right-click copy)  |
| 6     | `PasteAttempt`            | Paste attempt detected                             |
| 7     | `RightClickBlocked`       | Right-click was blocked                            |
| 8     | `DevToolsOpened`          | Developer tools opened (heuristic detection)       |
| 9     | `NetworkDisconnected`     | Network connection lost                            |
| 10    | `NetworkReconnected`      | Network connection restored                        |
| 11    | `KeyboardShortcutBlocked` | Blocked keyboard shortcut used (e.g., Ctrl+U, F12) |
| 12    | `PrintScreenAttempt`      | Print Screen key pressed                           |

### 2.2 Advanced Proctor Signals (Values 50–69)

> Only emitted when proctoring mode is `Advanced` (camera/microphone active).

| Value | Name                    | Description                               |
| ----- | ----------------------- | ----------------------------------------- |
| 50    | `CameraDenied`          | Camera permission denied by candidate     |
| 51    | `MicrophoneDenied`      | Microphone permission denied by candidate |
| 52    | `FaceNotDetected`       | No face detected in camera frame          |
| 53    | `MultipleFacesDetected` | Multiple faces visible in camera frame    |
| 54    | `CameraBlocked`         | Camera appears covered or blocked         |
| 55    | `FaceOutOfFrame`        | Face moved outside the camera frame       |
| 56    | `SuspiciousAudio`       | Suspicious audio/noise detected           |
| 57    | `ScreenShareStarted`    | Screen share stream started               |
| 58    | `ScreenShareEnded`      | Screen share stream ended normally        |

### 2.3 Proctor-Initiated Signals (Values 59–69)

> Emitted when a human proctor takes action.

| Value | Name                | Description                                  |
| ----- | ------------------- | -------------------------------------------- |
| 59    | `ProctorWarning`    | Warning message sent by proctor to candidate |
| 60    | `ProctorFlagged`    | Session manually flagged for review          |
| 61    | `ProctorUnflagged`  | Session flag removed by proctor              |
| 62    | `ProctorTerminated` | Session terminated by proctor                |

### 2.4 Screen Monitoring Signals (Values 70–79)

> Emitted by the screen share enforcement system.

| Value | Name                           | Description                                      |
| ----- | ------------------------------ | ------------------------------------------------ |
| 70    | `ScreenShareRequested`         | Screen share permission requested from candidate |
| 71    | `ScreenShareDenied`            | Candidate denied screen share permission         |
| 72    | `ScreenShareLost`              | Screen share stream lost unexpectedly            |
| 73    | `ScreenShareResumed`           | Screen share resumed after loss                  |
| 74    | `ScreenSharePermissionRevoked` | Candidate revoked screen share permission        |
| 75    | `ScreenShareTrackEnded`        | Browser stopped sharing (track ended)            |

---

## 3. Attempt Events (`AttemptEventType`)

Stored in `AttemptEvents` table. This is a **pure audit log** — every significant action during an exam attempt is recorded. These events do **not** directly affect risk score but provide a full activity trail.

| Value | Name                    | Description                                             |
| ----- | ----------------------- | ------------------------------------------------------- |
| 1     | `Started`               | Attempt was started                                     |
| 2     | `AnswerSaved`           | Answer was saved (autosave or manual)                   |
| 3     | `Navigated`             | Candidate navigated between questions                   |
| 4     | `TabSwitched`           | Candidate switched browser tab                          |
| 5     | `FullscreenExited`      | Candidate exited fullscreen mode                        |
| 6     | `Submitted`             | Candidate submitted the attempt                         |
| 7     | `TimedOut`              | Attempt timed out                                       |
| 8     | `WindowBlur`            | Browser window lost focus                               |
| 9     | `WindowFocus`           | Browser window regained focus                           |
| 10    | `CopyAttempt`           | Copy attempt detected                                   |
| 11    | `PasteAttempt`          | Paste attempt detected                                  |
| 12    | `RightClickAttempt`     | Right-click attempt detected                            |
| 13    | `ForceEnded`            | Attempt force-ended by admin                            |
| 14    | `AdminResumed`          | Attempt resumed by admin                                |
| 15    | `TimeAdded`             | Extra time added by admin                               |
| 16    | `WebcamDenied`          | Webcam permission denied by candidate                   |
| 17    | `SnapshotFailed`        | Proctor snapshot upload failed                          |
| 18    | `FaceNotDetected`       | AI: No face detected in camera                          |
| 19    | `MultipleFacesDetected` | AI: Multiple faces detected in camera                   |
| 20    | `FaceOutOfFrame`        | AI: Face out of frame / not centred                     |
| 21    | `CameraBlocked`         | AI: Camera appears blocked or covered                   |
| 22    | `HeadTurnDetected`      | AI: Candidate head turned away from screen              |
| 23    | `DisconnectExpired`     | Attempt expired — cumulative disconnect budget exceeded |

---

## 4. Incident Timeline Events (`IncidentTimelineEventType`)

Stored in `IncidentTimelineEvents` table. Captures every state change in an incident case lifecycle.

| Value | Name               | Description                                      |
| ----- | ------------------ | ------------------------------------------------ |
| 1     | `Created`          | Incident case was created                        |
| 2     | `Assigned`         | Case assigned to a reviewer                      |
| 3     | `StatusChanged`    | Case status changed                              |
| 4     | `EvidenceLinked`   | Evidence (video/image/screenshot) linked to case |
| 5     | `DecisionRecorded` | A review decision was recorded                   |
| 6     | `CommentAdded`     | A comment was added                              |
| 7     | `AppealSubmitted`  | Candidate submitted an appeal                    |
| 8     | `AppealReviewed`   | Appeal was reviewed                              |
| 9     | `SeverityChanged`  | Incident severity level changed                  |
| 10    | `Reopened`         | Closed case was reopened                         |

---

## 5. Risk Score Calculation

### 5.1 Overview

Risk score is calculated per **ProctorSession** and is stored on the session. It is **rule-based and fully configurable** — administrators manage rules via the `ProctorRiskRules` table. The score is capped at **100**.

### 5.2 Risk Rule Structure (`ProctorRiskRule`)

Each rule defines when to add points to a session's risk score:

| Field            | Type               | Description                                                  |
| ---------------- | ------------------ | ------------------------------------------------------------ |
| `EventType`      | `ProctorEventType` | Which event type this rule targets                           |
| `ThresholdCount` | `int`              | Minimum occurrences to trigger the rule once                 |
| `WindowSeconds`  | `int`              | Time window to count events (0 = entire session)             |
| `RiskPoints`     | `decimal`          | Points added per trigger (0–100)                             |
| `MinSeverity`    | `byte?`            | Only count events with severity ≥ this value (null = all)    |
| `MaxTriggers`    | `int?`             | Max times this rule can contribute points (null = unlimited) |
| `Priority`       | `int`              | Evaluation order (lower number = evaluated first)            |
| `IsActive`       | `bool`             | Whether this rule participates in calculation                |

### 5.3 Calculation Algorithm

```
GIVEN: ProctorSession with its Events, and all active ProctorRiskRules ordered by Priority

totalRiskPoints = 0

FOR each rule IN active rules:
    relevantEvents = session.Events
        WHERE EventType == rule.EventType
        AND (rule.MinSeverity IS NULL OR event.Severity >= rule.MinSeverity)
        AND (rule.WindowSeconds == 0 OR event.OccurredAt >= (now - rule.WindowSeconds))

    eventCount    = COUNT(relevantEvents)
    triggerCount  = FLOOR(eventCount / rule.ThresholdCount)

    IF rule.MaxTriggers IS NOT NULL:
        triggerCount = MIN(triggerCount, rule.MaxTriggers)

    IF triggerCount > 0:
        totalRiskPoints += triggerCount * rule.RiskPoints

riskScore = MIN(totalRiskPoints, 100)
```

### 5.4 Risk Level Thresholds

| Score Range | Risk Level   |
| ----------- | ------------ |
| `null`      | Unknown      |
| 0 – 20      | **Low**      |
| 21 – 50     | **Medium**   |
| 51 – 75     | **High**     |
| 76 – 100    | **Critical** |

### 5.5 Example Calculation

**Scenario**: Candidate has 5 `TabSwitched` events and 3 `FaceNotDetected` events.

**Active Rules**:
| Rule | EventType | Threshold | Window | Points | MaxTriggers |
|---|---|---|---|---|---|
| Tab Switch Monitor | `TabSwitched` | 2 | 300s | 10 | 3 |
| Face Detection | `FaceNotDetected` | 1 | 0 | 15 | 2 |

**Calculation**:

- `TabSwitched`: 5 events ÷ 2 threshold = 2 triggers → capped at 3 max → **2 × 10 = 20 pts**
- `FaceNotDetected`: 3 events ÷ 1 threshold = 3 triggers → capped at 2 max → **2 × 15 = 30 pts**
- **Total = 50 → Risk Level: Medium**

---

## 6. Violation Classification

On every `ProctorEvent` insert, `IsViolation` is computed by this logic:

```
IF eventType == Heartbeat → NOT a violation

IF severity >= 3          → IS a violation (regardless of type)

IF eventType IN [
    TabSwitched,
    FullscreenExited,
    CopyAttempt,
    PasteAttempt,
    DevToolsOpened,
    FaceNotDetected,
    MultipleFacesDetected
]                         → IS a violation (regardless of severity)

OTHERWISE                 → NOT a violation
```

`TotalViolations` on the session is incremented each time a violation event is recorded.

---

## 7. Risk Snapshot

Every time `CalculateRiskScore` is called, a `ProctorRiskSnapshot` is saved:

| Field                | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `RiskScore`          | Final capped score (0–100)                            |
| `TotalEvents`        | Total events at calculation time                      |
| `TotalViolations`    | Total violations at calculation time                  |
| `EventBreakdownJson` | `{ "TabSwitched": 5, "FaceNotDetected": 3, ... }`     |
| `TriggeredRulesJson` | List of rules triggered with points and trigger count |
| `CalculatedAt`       | UTC timestamp of calculation                          |
| `CalculatedBy`       | UserId who triggered the calculation                  |

---

## 8. Proctor Modes

| Mode       | Value | Camera/Mic | Soft Signals | Advanced Signals |
| ---------- | ----- | ---------- | ------------ | ---------------- |
| `Soft`     | 1     | No         | Yes          | No               |
| `Advanced` | 2     | Yes        | Yes          | Yes              |

---

## 9. Screen Monitoring Modes

| Mode       | Value | Behavior                                                      |
| ---------- | ----- | ------------------------------------------------------------- |
| `Disabled` | 0     | No screen monitoring                                          |
| `Optional` | 1     | Candidate may proceed without sharing (event logged)          |
| `Required` | 2     | Must share screen before exam starts                          |
| `Strict`   | 3     | If sharing stops: warning + grace period + enforcement action |

---

## 10. Proctor Decision Outcomes

Decisions are recorded after proctors review a session:

| Value | Name          | Meaning                                           |
| ----- | ------------- | ------------------------------------------------- |
| 1     | `Pending`     | Awaiting review                                   |
| 2     | `Cleared`     | No issues — attempt is valid                      |
| 3     | `Suspicious`  | Suspicious activity — needs further investigation |
| 4     | `Invalidated` | Confirmed cheating — attempt invalidated          |
| 5     | `Escalated`   | Formally escalated to incident process            |

---

## 11. API Trigger Points

| Trigger                                                 | When Risk Score Recalculates            |
| ------------------------------------------------------- | --------------------------------------- |
| `POST /api/proctor/sessions/{id}/start`                 | After session start (initial score = 0) |
| `POST /api/proctor/events`                              | After each individual event is logged   |
| `POST /api/proctor/events/batch`                        | After batch event insert                |
| `POST /api/proctor/sessions/{sessionId}/calculate-risk` | Manual recalculation by admin/proctor   |
