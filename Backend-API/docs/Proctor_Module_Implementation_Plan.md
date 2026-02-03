# Proctor Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Risk Scoring System](#risk-scoring-system)
8. [Evidence Management](#evidence-management)
9. [Decision Workflow](#decision-workflow)
10. [Real-Time Monitoring](#real-time-monitoring)
11. [Security & Privacy](#security--privacy)
12. [Future Enhancements](#future-enhancements)

---

## Overview

The Proctor Module provides comprehensive exam integrity monitoring through two modes:

### Soft Proctoring (Behavioral Monitoring)
- No camera or microphone required
- Tracks browser behavior and signals
- Detects tab switches, fullscreen exits, copy/paste attempts
- Lightweight and privacy-friendly

### Advanced Proctoring
- Requires camera and microphone permissions
- Captures video/audio/screenshot evidence
- AI-powered face detection (future)
- Full integrity verification

### Key Features
- **Session Management**: One session per attempt per mode
- **Event Logging**: Append-only event stream
- **Risk Scoring**: Configurable rules-based scoring
- **Evidence Capture**: Secure storage with retention policies
- **Review Workflow**: Decision system with override capability
- **Live Monitoring**: Real-time dashboard for proctors

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? Proctor/
?   ?  ??? ProctorSession.cs
?   ?       ??? ProctorEvent.cs
?   ?       ??? ProctorRiskRule.cs
?   ?       ??? ProctorRiskSnapshot.cs
?   ?       ??? ProctorEvidence.cs
?   ?  ??? ProctorDecision.cs
?   ??? Enums/
?     ??? ProctorEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Proctor/
?   ?   ??? ProctorDtos.cs
?   ??? Interfaces/
?   ?   ??? Proctor/
?   ?       ??? IProctorService.cs
?   ??? Validators/
?   ??? Proctor/
?           ??? ProctorValidators.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? Configurations/
?   ?       ??? Proctor/
?   ?           ??? ProctorSessionConfiguration.cs
?   ?           ??? ProctorEventConfiguration.cs
?   ?        ??? ProctorRiskRuleConfiguration.cs
?   ?       ??? ProctorRiskSnapshotConfiguration.cs
?   ?           ??? ProctorEvidenceConfiguration.cs
?   ?  ??? ProctorDecisionConfiguration.cs
?   ??? Services/
?       ??? Proctor/
?    ??? ProctorService.cs
??? Controllers/
    ??? Proctor/
        ??? ProctorController.cs
```

### Dependencies
- Attempt Module (attempt status, candidate info)
- Assessment Module (exam configuration)
- Storage Provider (evidence files)

---

## Database Schema

### Entity Relationships
```
???????????????????????
?    ProctorSession   ?
???????????????????????
? Id             ?
? AttemptId     ????
? ExamId  ?  ?
? CandidateId         ?  ?
? Mode (Soft/Advanced)?  ?
? Status              ?  ?
? RiskScore   ?  ?
? TotalEvents         ?  ?
? TotalViolations     ?  ?
???????????????????????  ?
         ?       ?
   ?1           ?
   ?    ?
    ???????????  ?
    ?    *    ?        ?
    ? ?          ?
???????????? ?????????????
?ProctorEvent?ProctorEvidence?
???????????? ?????????????
? EventType ? ? Type     ??
? Severity  ? ? FilePath ??
? OccurredAt? ? FileSize ??
? IsViolation?? Checksum ??
???????????? ?????????????
 ?               ?
      ?1              ?
         ?   ?
???????????????????      ?
? ProctorDecision ?      ?
???????????????????      ?
? Status     ?      ?
? DecidedBy?      ?
? DecidedAt       ?      ?
? IsFinalized     ?      ?
???????????????????      ?
         ?
???????????????????      ?
?ProctorRiskRule  ?      ?
???????????????????      ?
? EventType       ?      ?
? ThresholdCount  ?   ?
? WindowSeconds   ?      ?
? RiskPoints      ? ?
???????????????????  ?
         ?
???????????????????????  ?
? ProctorRiskSnapshot ?  ?
???????????????????????  ?
? ProctorSessionId    ????
? RiskScore    ?
? CalculatedAt        ?
???????????????????????
```

### Unique Constraints
- `ProctorSessions`: (AttemptId, Mode) - One session per attempt per mode
- `ProctorDecisions`: (ProctorSessionId) - One decision per session

### Indexes
- `ProctorSessions`: (AttemptId), (ExamId), (CandidateId), (Status), (RiskScore)
- `ProctorEvents`: (ProctorSessionId), (EventType), (OccurredAt), (IsViolation)
- `ProctorEvidence`: (ProctorSessionId), (Type), (ExpiresAt)
- `ProctorDecisions`: (Status), (DecidedAt)

---

## API Endpoints

### Session Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/proctor/session` | Create proctor session | Candidate |
| GET | `/api/proctor/session/{id}` | Get session by ID | Admin, Instructor, Reviewer |
| GET | `/api/proctor/session/attempt/{attemptId}` | Get session by attempt | All |
| POST | `/api/proctor/session/{id}/end` | End session | Candidate |
| POST | `/api/proctor/session/{id}/cancel` | Cancel session | Admin |
| GET | `/api/proctor/sessions` | Get all sessions | Admin, Instructor, Reviewer |
| GET | `/api/proctor/sessions/exam/{examId}` | Get exam sessions | Admin, Instructor, Reviewer |

### Events

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/proctor/event` | Log single event | Candidate |
| POST | `/api/proctor/events/bulk` | Bulk log events | Candidate |
| POST | `/api/proctor/heartbeat` | Process heartbeat | Candidate |
| GET | `/api/proctor/session/{id}/events` | Get session events | Admin, Instructor, Reviewer |
| GET | `/api/proctor/session/{id}/events/{type}` | Get events by type | Admin, Instructor, Reviewer |

### Risk Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/proctor/session/{id}/calculate-risk` | Calculate risk score | Admin, Instructor, Reviewer |
| GET | `/api/proctor/rules` | Get risk rules | Admin |
| POST | `/api/proctor/rules` | Create risk rule | Admin |
| PUT | `/api/proctor/rules/{id}` | Update risk rule | Admin |
| DELETE | `/api/proctor/rules/{id}` | Delete risk rule | Admin |
| POST | `/api/proctor/rules/{id}/toggle` | Toggle rule active | Admin |

### Evidence

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/proctor/evidence/request-upload` | Get upload URL | Candidate |
| POST | `/api/proctor/evidence/{id}/confirm` | Confirm upload | Candidate |
| GET | `/api/proctor/session/{id}/evidence` | Get session evidence | Admin, Instructor, Reviewer |
| GET | `/api/proctor/evidence/{id}/download-url` | Get download URL | Admin, Instructor, Reviewer |

### Decisions

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/proctor/decision` | Make decision | Admin, Instructor, Reviewer |
| POST | `/api/proctor/decision/override` | Override decision | Admin |
| GET | `/api/proctor/session/{id}/decision` | Get decision | Admin, Instructor, Reviewer |
| GET | `/api/proctor/pending-review` | Get pending reviews | Admin, Instructor, Reviewer |

### Dashboard & Monitoring

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/proctor/dashboard/exam/{id}` | Get exam dashboard | Admin, Instructor, Reviewer |
| GET | `/api/proctor/live/exam/{id}` | Get live monitoring | Admin, Instructor, Reviewer |

---

## Business Rules Implementation

### 1. Proctor Session Lifecycle

```csharp
// Session creation
public async Task<ProctorSession> CreateSessionAsync(int attemptId, ProctorMode mode)
{
    // Validate attempt is InProgress
    if (attempt.Status != AttemptStatus.InProgress)
        throw new InvalidOperationException("Cannot start proctoring");

  // Check unique constraint
    var existing = await GetByAttemptAndMode(attemptId, mode);
    if (existing != null)
  return existing; // Return existing if active

    return new ProctorSession
    {
        AttemptId = attemptId,
        Mode = mode,
 Status = ProctorSessionStatus.Active,
        StartedAt = DateTime.UtcNow,
      RiskScore = 0
    };
}

// Session ending
public void EndSession(ProctorSession session)
{
  // Triggered by attempt submission/expiry
    session.Status = ProctorSessionStatus.Completed;
    session.EndedAt = DateTime.UtcNow;
}
```

### 2. Soft Proctor Event Processing

```csharp
// Event logging
public async Task<ProctorEvent> LogEventAsync(LogProctorEventDto dto)
{
    // Validate session is active
    if (session.Status != ProctorSessionStatus.Active)
        throw new InvalidOperationException("Session is not active");

    // Create event with server timestamp
    var proctorEvent = new ProctorEvent
    {
   EventType = dto.EventType,
        Severity = dto.Severity,
        OccurredAt = DateTime.UtcNow, // Server time is source of truth
     ClientTimestamp = dto.ClientTimestamp,
        IsViolation = IsViolationEvent(dto.EventType, dto.Severity)
    };

    // Update session counters
    session.TotalEvents++;
 if (proctorEvent.IsViolation)
  session.TotalViolations++;

    return proctorEvent;
}

// Violation detection
private bool IsViolationEvent(ProctorEventType type, byte severity)
{
    if (type == ProctorEventType.Heartbeat)
   return false;

    if (severity >= 3)
    return true;

    var violationTypes = new[]
    {
      ProctorEventType.TabSwitched,
        ProctorEventType.FullscreenExited,
        ProctorEventType.DevToolsOpened,
        ProctorEventType.MultipleFacesDetected
    };

    return violationTypes.Contains(type);
}
```

### 3. Heartbeat Processing

```csharp
// Heartbeat endpoint
public async Task<HeartbeatResponse> ProcessHeartbeatAsync(int sessionId)
{
    session.LastHeartbeatAt = DateTime.UtcNow;

    // Log heartbeat event
    await LogEventAsync(new ProctorEvent
    {
        EventType = ProctorEventType.Heartbeat,
      Severity = 0,
        IsViolation = false
    });

    // Return warnings if needed
    return new HeartbeatResponse
    {
        Success = true,
        ServerTime = DateTime.UtcNow,
   CurrentRiskScore = session.RiskScore,
        HasWarning = session.TotalViolations > 5,
        WarningMessage = GetWarningMessage(session)
    };
}

// Missed heartbeat detection (background job)
public async Task CheckMissedHeartbeatsAsync()
{
    var threshold = DateTime.UtcNow.AddSeconds(-45);
    var missedSessions = await GetActiveSessions()
        .Where(s => s.LastHeartbeatAt < threshold)
        .ToListAsync();

    foreach (var session in missedSessions)
    {
  session.HeartbeatMissedCount++;
        await LogEventAsync(ProctorEventType.NetworkDisconnected, severity: 3);
    }
}
```

### 4. Risk Scoring

```csharp
// Calculate risk score based on rules
public decimal CalculateRiskScore(ProctorSession session, List<ProctorRiskRule> rules)
{
    decimal totalRiskPoints = 0;

  foreach (var rule in rules.Where(r => r.IsActive).OrderBy(r => r.Priority))
    {
        var relevantEvents = session.Events
            .Where(e => e.EventType == rule.EventType);

     // Apply severity filter
      if (rule.MinSeverity.HasValue)
            relevantEvents = relevantEvents.Where(e => e.Severity >= rule.MinSeverity);

        // Apply time window
     if (rule.WindowSeconds > 0)
        {
            var windowStart = DateTime.UtcNow.AddSeconds(-rule.WindowSeconds);
relevantEvents = relevantEvents.Where(e => e.OccurredAt >= windowStart);
        }

        var eventCount = relevantEvents.Count();
        var triggerCount = eventCount / rule.ThresholdCount;

        // Apply max triggers limit
        if (rule.MaxTriggers.HasValue)
      triggerCount = Math.Min(triggerCount, rule.MaxTriggers.Value);

        totalRiskPoints += triggerCount * rule.RiskPoints;
    }

    // Cap at 100
    return Math.Min(totalRiskPoints, 100);
}
```

### 5. Decision Workflow

```csharp
// Make decision
public async Task<ProctorDecision> MakeDecisionAsync(MakeDecisionDto dto, string reviewerId)
{
    // Validate attempt is submitted/expired
    if (session.Attempt.Status != AttemptStatus.Submitted &&
        session.Attempt.Status != AttemptStatus.Expired)
  {
        throw new InvalidOperationException("Cannot decide before attempt ends");
    }

 // Check for existing finalized decision
    if (session.Decision?.IsFinalized == true)
 {
        throw new InvalidOperationException("Decision is finalized. Use override.");
    }

    var decision = session.Decision ?? new ProctorDecision();
    decision.Status = dto.Status;
  decision.DecidedBy = reviewerId;
    decision.DecidedAt = DateTime.UtcNow;
    decision.IsFinalized = dto.Finalize;

    return decision;
}

// Override decision (Admin only)
public async Task<ProctorDecision> OverrideDecisionAsync(OverrideDecisionDto dto, string adminId)
{
    decision.PreviousStatus = decision.Status;
    decision.Status = dto.NewStatus;
    decision.OverriddenBy = adminId;
    decision.OverriddenAt = DateTime.UtcNow;
    decision.OverrideReason = dto.OverrideReason;

    return decision;
}
```

---

## Usage Examples

### 1. Create Proctor Session

**Request:**
```http
POST /api/proctor/session
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "attemptId": 100,
    "mode": 1,
    "deviceFingerprint": "abc123xyz",
    "userAgent": "Mozilla/5.0...",
    "browserName": "Chrome",
    "browserVersion": "120.0",
    "operatingSystem": "Windows 11",
    "screenResolution": "1920x1080"
}
```

**Response:**
```json
{
 "success": true,
    "data": {
        "proctorSessionId": 50,
      "attemptId": 100,
        "mode": 1,
        "startedAt": "2024-01-15T10:00:00Z",
   "heartbeatIntervalSeconds": 15,
        "message": "Proctor session started successfully"
    }
}
```

### 2. Log Proctor Event

**Request:**
```http
POST /api/proctor/event
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "proctorSessionId": 50,
    "eventType": 2,
    "severity": 2,
    "metadataJson": "{\"tabCount\": 3, \"windowTitle\": \"Google Search\"}",
    "clientTimestamp": "2024-01-15T10:15:30Z"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
    "id": 500,
    "proctorSessionId": 50,
   "eventType": 2,
        "eventTypeName": "TabSwitched",
        "severity": 2,
        "severityLabel": "Medium",
        "isViolation": true,
    "metadataJson": "{\"tabCount\": 3, \"windowTitle\": \"Google Search\"}",
        "occurredAt": "2024-01-15T10:15:30Z",
        "sequenceNumber": 42
    }
}
```

### 3. Bulk Log Events

**Request:**
```http
POST /api/proctor/events/bulk
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "proctorSessionId": 50,
    "events": [
        {
            "eventType": 3,
    "severity": 1,
            "metadataJson": "{\"duration\": 2000}",
            "clientTimestamp": "2024-01-15T10:16:00Z"
        },
        {
     "eventType": 5,
        "severity": 3,
            "metadataJson": "{\"text\": \"...\"}",
          "clientTimestamp": "2024-01-15T10:16:05Z"
      }
    ]
}
```

**Response:**
```json
{
    "success": true,
    "data": 2,
    "message": "2 events logged"
}
```

### 4. Send Heartbeat

**Request:**
```http
POST /api/proctor/heartbeat
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "proctorSessionId": 50,
    "clientTimestamp": "2024-01-15T10:20:00Z",
    "metadataJson": "{\"memoryUsage\": 256}"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "success": true,
  "serverTime": "2024-01-15T10:20:00Z",
        "currentRiskScore": 25.5,
        "totalViolations": 8,
      "hasWarning": true,
     "warningMessage": "Please stay focused on your exam."
    }
}
```

### 5. Get Session with Events

**Request:**
```http
GET /api/proctor/session/50
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 50,
 "attemptId": 100,
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "candidateId": "user123",
 "candidateName": "John Doe",
        "mode": 1,
        "modeName": "Soft",
   "status": 1,
        "statusName": "Active",
        "startedAt": "2024-01-15T10:00:00Z",
        "endedAt": null,
        "ipAddress": "192.168.1.100",
   "browserName": "Chrome",
        "totalEvents": 150,
        "totalViolations": 12,
        "riskScore": 35.5,
        "riskLevel": "Medium",
   "lastHeartbeatAt": "2024-01-15T10:20:00Z",
    "decision": null,
        "recentEvents": [
            {
     "id": 550,
       "eventType": 2,
     "eventTypeName": "TabSwitched",
           "severity": 2,
           "isViolation": true,
  "occurredAt": "2024-01-15T10:19:30Z"
            }
        ]
    }
}
```

### 6. Calculate Risk Score

**Request:**
```http
POST /api/proctor/session/50/calculate-risk
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
   "proctorSessionId": 50,
 "riskScore": 45.0,
        "riskLevel": "Medium",
 "totalEvents": 150,
        "totalViolations": 12,
        "triggeredRules": [
        {
        "ruleId": 1,
    "ruleName": "Tab Switch Threshold",
                "riskPoints": 10.0,
           "triggerCount": 1
         },
        {
      "ruleId": 3,
    "ruleName": "Fullscreen Exit",
          "riskPoints": 30.0,
      "triggerCount": 1
            },
         {
     "ruleId": 5,
    "ruleName": "Copy Attempt",
        "riskPoints": 5.0,
                "triggerCount": 1
        }
        ],
        "eventBreakdown": {
            "Heartbeat": 120,
         "TabSwitched": 8,
            "FullscreenExited": 2,
            "CopyAttempt": 3,
            "WindowBlurred": 15
        },
        "calculatedAt": "2024-01-15T10:25:00Z"
    }
}
```

### 7. Create Risk Rule

**Request:**
```http
POST /api/proctor/rules
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "nameEn": "Tab Switch Threshold",
    "nameAr": "?? ????? ?????? ???????",
    "descriptionEn": "Triggers when candidate switches tabs 3+ times within 2 minutes",
    "isActive": true,
    "eventType": 2,
    "thresholdCount": 3,
    "windowSeconds": 120,
    "riskPoints": 10.0,
    "minSeverity": null,
    "maxTriggers": 5,
 "priority": 10
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
      "nameEn": "Tab Switch Threshold",
    "nameAr": "?? ????? ?????? ???????",
        "isActive": true,
        "eventType": 2,
    "eventTypeName": "TabSwitched",
        "thresholdCount": 3,
        "windowSeconds": 120,
      "riskPoints": 10.0,
        "maxTriggers": 5,
        "priority": 10
    }
}
```

### 8. Request Evidence Upload

**Request:**
```http
POST /api/proctor/evidence/request-upload
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "proctorSessionId": 50,
    "type": 1,
    "fileName": "video_chunk_001.webm",
    "contentType": "video/webm",
    "startAt": "2024-01-15T10:00:00Z",
    "endAt": "2024-01-15T10:05:00Z",
 "durationSeconds": 300,
    "metadataJson": "{\"resolution\": \"640x480\", \"codec\": \"vp8\"}"
}
```

**Response:**
```json
{
    "success": true,
  "data": {
      "evidenceId": 100,
   "uploadUrl": "/api/proctor/evidence/100/upload",
        "expiresAt": "2024-01-15T10:30:00Z"
    }
}
```

### 9. Make Decision

**Request:**
```http
POST /api/proctor/decision
Content-Type: application/json
Authorization: Bearer {reviewer_token}

{
    "proctorSessionId": 50,
    "status": 3,
    "decisionReasonEn": "Multiple tab switches and fullscreen exits detected. Evidence of potential external resource usage.",
  "decisionReasonAr": "?? ?????? ????? ????? ??????? ??????? ??????? ?? ??? ??? ??????",
    "internalNotes": "Review evidence files for confirmation",
    "finalize": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 25,
 "proctorSessionId": 50,
        "attemptId": 100,
        "status": 3,
        "statusName": "Suspicious",
        "decisionReasonEn": "Multiple tab switches...",
        "decidedBy": "reviewer001",
  "decidedAt": "2024-01-15T11:00:00Z",
        "isFinalized": false
    }
}
```

### 10. Override Decision (Admin)

**Request:**
```http
POST /api/proctor/decision/override
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "decisionId": 25,
    "newStatus": 4,
    "overrideReason": "After reviewing video evidence, confirmed cheating behavior",
    "decisionReasonEn": "Confirmed use of external device during exam"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 25,
        "status": 4,
        "statusName": "Invalidated",
        "previousStatus": 3,
        "wasOverridden": true,
        "decidedBy": "admin001",
        "decidedAt": "2024-01-15T12:00:00Z",
        "isFinalized": true
    }
}
```

### 11. Get Dashboard

**Request:**
```http
GET /api/proctor/dashboard/exam/1
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
"success": true,
    "data": {
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
 "totalSessions": 150,
        "activeSessions": 25,
        "completedSessions": 120,
        "highRiskCount": 15,
  "pendingReviewCount": 30,
        "clearedCount": 85,
        "invalidatedCount": 5,
   "averageRiskScore": 22.5,
        "topViolations": [
          { "eventType": 2, "eventTypeName": "TabSwitched", "count": 450 },
          { "eventType": 3, "eventTypeName": "WindowBlurred", "count": 320 },
   { "eventType": 4, "eventTypeName": "FullscreenExited", "count": 85 }
        ],
        "riskDistribution": [
            { "range": "0-20 (Low)", "count": 95, "percentage": 63.33 },
            { "range": "21-50 (Medium)", "count": 35, "percentage": 23.33 },
   { "range": "51-75 (High)", "count": 15, "percentage": 10.00 },
   { "range": "76-100 (Critical)", "count": 5, "percentage": 3.33 }
        ]
    }
}
```

### 12. Live Monitoring

**Request:**
```http
GET /api/proctor/live/exam/1
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
 "data": [
        {
 "proctorSessionId": 50,
   "attemptId": 100,
            "candidateName": "John Doe",
      "status": 1,
  "riskScore": 35.5,
    "totalViolations": 12,
  "lastHeartbeatAt": "2024-01-15T10:20:00Z",
            "isOnline": true,
            "lastEvent": {
       "eventType": 2,
           "eventTypeName": "TabSwitched",
        "occurredAt": "2024-01-15T10:19:30Z"
  }
    },
        {
   "proctorSessionId": 51,
   "attemptId": 101,
            "candidateName": "Jane Smith",
            "status": 1,
            "riskScore": 5.0,
            "totalViolations": 2,
      "lastHeartbeatAt": "2024-01-15T10:19:55Z",
     "isOnline": true,
      "lastEvent": null
        }
    ]
}
```

---

## Risk Scoring System

### Default Rules (Suggested)

| Rule | Event Type | Threshold | Window | Points | Description |
|------|------------|-----------|--------|--------|-------------|
| Tab Switch | TabSwitched | 3 | 120s | 10 | 3+ tab switches in 2 minutes |
| Fullscreen Exit | FullscreenExited | 1 | 0 | 30 | Any fullscreen exit |
| DevTools | DevToolsOpened | 1 | 0 | 40 | Opening developer tools |
| Copy Attempt | CopyAttempt | 2 | 0 | 15 | 2+ copy attempts |
| Network Loss | NetworkDisconnected | 1 | 0 | 20 | Network disconnection |
| No Face | FaceNotDetected | 3 | 60s | 25 | Face not detected 3+ times |
| Multiple Faces | MultipleFacesDetected | 1 | 0 | 35 | Multiple faces detected |

### Risk Levels

| Score Range | Level | Action |
|-------------|-------|--------|
| 0-20 | Low | No action needed |
| 21-50 | Medium | Flag for review |
| 51-75 | High | Priority review |
| 76-100 | Critical | Immediate attention |

---

## Security & Privacy

### Candidate Restrictions
- Candidates CANNOT see:
  - Risk scores
  - Proctor events
  - Evidence files
  - Decision details
  - Other candidates' data

### Evidence Security
- All evidence files are:
  - Stored in secure storage (S3/encrypted)
  - Accessed via time-limited signed URLs
  - Subject to retention policies (90 days default)
  - Checksum verified for integrity

### Audit Trail
- All proctor actions are logged
- Decisions include who/when
- Overrides require reason
- Events are append-only

---

## Future Enhancements

### 1. AI Face Detection
```csharp
public class FaceDetectionResult
{
    public int FaceCount { get; set; }
    public bool IsFaceVisible { get; set; }
    public decimal ConfidenceScore { get; set; }
    public string? FaceMatchResult { get; set; }
}
```

### 2. Real-Time WebSocket Updates
```csharp
// SignalR hub for live updates
public class ProctorHub : Hub
{
    public async Task JoinExamMonitoring(int examId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"exam_{examId}");
    }

    public async Task SendEventAlert(int examId, ProctorEventDto evt)
    {
        await Clients.Group($"exam_{examId}").SendAsync("EventAlert", evt);
    }
}
```

### 3. Screen Recording Analysis
```csharp
public class ScreenAnalysisResult
{
    public bool HasSuspiciousContent { get; set; }
    public List<string> DetectedApplications { get; set; }
    public decimal RiskContribution { get; set; }
}
```

### 4. Automated Decision Recommendations
```csharp
public class AutoDecisionRecommendation
{
    public ProctorDecisionStatus RecommendedStatus { get; set; }
    public decimal Confidence { get; set; }
    public List<string> Reasons { get; set; }
}
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddProctorModule
dotnet ef database update
```

---

## Frontend Integration Notes

### JavaScript SDK Example
```javascript
class ProctorClient {
    constructor(sessionId, heartbeatInterval = 15000) {
      this.sessionId = sessionId;
        this.heartbeatInterval = heartbeatInterval;
    }

    start() {
        // Start heartbeat
        this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatInterval);

 // Listen for violations
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
      document.addEventListener('copy', () => this.logEvent('CopyAttempt', 3));
 document.addEventListener('paste', () => this.logEvent('PasteAttempt', 3));
window.addEventListener('blur', () => this.logEvent('WindowBlurred', 1));
    }

    async logEvent(eventType, severity, metadata = {}) {
    await fetch('/api/proctor/event', {
    method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
            body: JSON.stringify({
                proctorSessionId: this.sessionId,
         eventType: eventType,
             severity: severity,
     metadataJson: JSON.stringify(metadata),
clientTimestamp: new Date().toISOString()
     })
        });
    }

    async sendHeartbeat() {
    const response = await fetch('/api/proctor/heartbeat', {
            method: 'POST',
 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
       body: JSON.stringify({
     proctorSessionId: this.sessionId,
         clientTimestamp: new Date().toISOString()
            })
        });
        const result = await response.json();
        if (result.data.hasWarning) {
    this.showWarning(result.data.warningMessage);
        }
    }

    stop() {
        clearInterval(this.heartbeatTimer);
    }
}
```

---

## Testing Checklist

- [ ] Create soft proctor session
- [ ] Create advanced proctor session
- [ ] Reject duplicate session (same attempt+mode)
- [ ] Log single event
- [ ] Bulk log events
- [ ] Process heartbeat
- [ ] Detect missed heartbeats
- [ ] Calculate risk score
- [ ] Create/update/delete risk rules
- [ ] Request evidence upload
- [ ] Confirm evidence upload
- [ ] Get evidence download URL
- [ ] Make decision (pending, cleared, suspicious)
- [ ] Finalize decision
- [ ] Override decision (admin only)
- [ ] End session on attempt submit
- [ ] Cancel session (admin)
- [ ] Get dashboard metrics
- [ ] Get live monitoring data
- [ ] Verify candidates cannot see proctor data
- [ ] Verify risk score capped at 100
- [ ] Verify events are append-only
