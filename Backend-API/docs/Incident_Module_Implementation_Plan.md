# Incident & Appeals Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Case Lifecycle](#case-lifecycle)
8. [Decision Workflow](#decision-workflow)
9. [Appeal Process](#appeal-process)
10. [Security & Privacy](#security--privacy)
11. [Integration with Proctor Module](#integration-with-proctor-module)
12. [Future Enhancements](#future-enhancements)

---

## Overview

The Incident & Appeals Module provides comprehensive case management for exam integrity issues:

### Key Features
- **Case Management**: Create, track, and resolve incident cases
- **Timeline Tracking**: Append-only audit trail of all case actions
- **Evidence Linking**: Connect proctor evidence and events to cases
- **Decision History**: Track all decisions with reviewer attribution
- **Comment System**: Internal notes for reviewers
- **Appeal Process**: Candidate appeals with structured workflow
- **Dashboard**: Real-time metrics and workload tracking

### Core Entities
- **IncidentCase**: Main case entity linked to attempt
- **IncidentTimelineEvent**: Audit trail of case actions
- **IncidentEvidenceLink**: Links to proctor evidence/events
- **IncidentDecisionHistory**: Decision records with history
- **IncidentComment**: Internal reviewer comments
- **AppealRequest**: Candidate appeal submissions

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? Incident/
?   ?       ??? IncidentCase.cs
?   ?  ??? IncidentTimelineEvent.cs
?   ?   ??? IncidentEvidenceLink.cs
?   ?       ??? IncidentDecisionHistory.cs
?   ?       ??? IncidentComment.cs
?   ?       ??? AppealRequest.cs
?   ??? Enums/
?       ??? IncidentEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Incident/
?   ? ??? IncidentDtos.cs
?   ??? Interfaces/
?   ?   ??? Incident/
?   ?       ??? IIncidentService.cs
?   ??? Validators/
?       ??? Incident/
? ??? IncidentValidators.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? Configurations/
?   ?       ??? Incident/
?   ?  ??? IncidentCaseConfiguration.cs
?   ?     ??? IncidentTimelineEventConfiguration.cs
?   ?           ??? IncidentEvidenceLinkConfiguration.cs
?   ?    ??? IncidentDecisionHistoryConfiguration.cs
?   ?        ??? IncidentCommentConfiguration.cs
?   ?  ??? AppealRequestConfiguration.cs
?   ??? Services/
?   ??? Incident/
?       ??? IncidentService.cs
??? Controllers/
    ??? Incident/
        ??? IncidentController.cs
```

### Dependencies
- Proctor Module (evidence, events, sessions)
- Attempt Module (attempt status)
- Assessment Module (exam info)
- Identity (users, roles)

---

## Database Schema

### Entity Relationships
```
???????????????????????
? IncidentCase     ?
???????????????????????
? Id           ?
? CaseNumber   ?
? ExamId     ?
? AttemptId      ?
? CandidateId         ?
? ProctorSessionId?   ?
? Status        ?
? Severity            ?
? Source        ?
? Outcome?       ?
? AssignedTo?         ?
???????????????????????
         ?
         ?1
  ?
    ??????????????????????????????????????
    ?    *    ?    *   ?    *   ?    *   ?
?     ?        ?      ?        ?
?????????? ?????????? ?????????? ?????????? ??????????
?Timeline? ?Evidence? ?Decision? ?Comment ? ? Appeal ?
? Event  ? ?  Link  ? ? History? ?        ? ?Request ?
?????????? ?????????? ?????????? ?????????? ??????????
?EventType? ?EvidId? ? ?Outcome ? ?AuthorId? ?Status  ?
?ActorId ? ?EventId?? ?DecidedBy? ?Body    ? ?Message ?
?Metadata? ?Notes   ? ?DecidedAt? ?Visible?? ?Decision?
?????????? ?????????? ?????????? ?????????? ??????????
```

### Unique Constraints
- `IncidentCases`: (CaseNumber) - Unique case number
- `AppealRequests`: (AppealNumber) - Unique appeal number

### Indexes
- `IncidentCases`: (Status, Severity, AssignedTo), (ExamId, CandidateId), (AttemptId)
- `IncidentTimelineEvents`: (IncidentCaseId), (OccurredAt)
- `IncidentDecisionHistory`: (IncidentCaseId), (DecidedAt)
- `AppealRequests`: (IncidentCaseId), (Status), (SubmittedAt)

---

## API Endpoints

### Case Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/case` | Create incident case | Admin, Instructor, Reviewer |
| POST | `/api/incident/case/from-proctor/{id}` | Create from proctor session | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}` | Get case by ID | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/by-attempt/{id}` | Get case by attempt | Admin, Instructor, Reviewer |
| PUT | `/api/incident/case` | Update case | Admin, Instructor, Reviewer |
| GET | `/api/incident/cases` | Get all cases | Admin, Instructor, Reviewer |
| GET | `/api/incident/cases/exam/{id}` | Get exam cases | Admin, Instructor, Reviewer |
| GET | `/api/incident/cases/my-assigned` | Get my assigned cases | Admin, Instructor, Reviewer |

### Assignment & Status

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/case/assign` | Assign case | Admin |
| POST | `/api/incident/case/reassign` | Reassign case | Admin |
| POST | `/api/incident/case/status` | Change status | Admin, Instructor, Reviewer |
| POST | `/api/incident/case/{id}/close` | Close case | Admin, Instructor, Reviewer |
| POST | `/api/incident/case/{id}/reopen` | Reopen case | Admin |

### Evidence

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/evidence/link` | Link evidence | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/evidence` | Get case evidence | Admin, Instructor, Reviewer |
| DELETE | `/api/incident/evidence/{id}` | Remove evidence link | Admin, Instructor, Reviewer |

### Decisions

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/decision` | Record decision | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/decisions` | Get decision history | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/decision/latest` | Get latest decision | Admin, Instructor, Reviewer |

### Comments

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/comment` | Add comment | Admin, Instructor, Reviewer |
| PUT | `/api/incident/comment` | Edit comment | Admin, Instructor, Reviewer |
| DELETE | `/api/incident/comment/{id}` | Delete comment | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/comments` | Get comments | Admin, Instructor, Reviewer |

### Timeline

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/incident/case/{id}/timeline` | Get timeline | Admin, Instructor, Reviewer |

### Appeals

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/incident/appeal` | Submit appeal | Candidate |
| GET | `/api/incident/appeal/{id}` | Get appeal | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/appeals` | Get case appeals | Admin, Instructor, Reviewer |
| GET | `/api/incident/appeals` | Get all appeals | Admin, Instructor, Reviewer |
| POST | `/api/incident/appeal/review` | Review appeal | Admin, Instructor, Reviewer |
| GET | `/api/incident/case/{id}/can-appeal` | Check can appeal | Candidate |

### Candidate Access

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/incident/my-incident/attempt/{id}` | Get my incident status | Candidate |
| GET | `/api/incident/my-incidents` | Get all my incidents | Candidate |
| GET | `/api/incident/case/{id}/my-appeal` | Get my appeal | Candidate |

### Dashboard

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/incident/dashboard/exam/{id}` | Get exam dashboard | Admin, Instructor, Reviewer |
| GET | `/api/incident/dashboard` | Get global dashboard | Admin |

---

## Business Rules Implementation

### 1. Case Creation

```csharp
// Manual case creation
public async Task<IncidentCase> CreateCaseAsync(CreateIncidentCaseDto dto)
{
    // Validate attempt exists
    var attempt = await GetAttemptAsync(dto.AttemptId);

    // Check for existing active case (one per attempt policy)
    var existingCase = await GetActiveCaseForAttemptAsync(dto.AttemptId);
    if (existingCase != null)
        throw new InvalidOperationException("Active case already exists");

    // Generate unique case number
    var caseNumber = await GenerateCaseNumberAsync(); // INC-20240115-0001

    // Get risk snapshot if proctor session exists
    var riskInfo = await GetRiskSnapshotAsync(dto.ProctorSessionId);

    return new IncidentCase
    {
  CaseNumber = caseNumber,
  AttemptId = dto.AttemptId,
        Status = IncidentStatus.Open,
     Severity = dto.Severity,
        Source = dto.Source,
        RiskScoreAtCreate = riskInfo?.RiskScore,
      TotalViolationsAtCreate = riskInfo?.TotalViolations
    };
}

// Automatic case creation from proctor
public async Task<IncidentCase> CreateFromProctorAsync(int proctorSessionId)
{
    var session = await GetProctorSessionAsync(proctorSessionId);
    
    var severity = DetermineSeverity(session.RiskScore, session.TotalViolations);
    // >= 75 risk or >= 20 violations = Critical
    // >= 50 risk or >= 10 violations = High
    // >= 25 risk or >= 5 violations = Medium
    // else = Low

    return await CreateCaseAsync(new CreateIncidentCaseDto
 {
        Source = IncidentSource.ProctorAuto,
        Severity = severity,
        TitleEn = $"Proctor Alert - Risk Score: {session.RiskScore:F1}"
    });
}
```

### 2. Status Lifecycle

```csharp
// Valid status transitions
private bool IsValidStatusTransition(IncidentStatus current, IncidentStatus target)
{
    return (current, target) switch
    {
      (IncidentStatus.Open, IncidentStatus.InReview) => true,
 (IncidentStatus.InReview, IncidentStatus.Resolved) => true,
   (IncidentStatus.Resolved, IncidentStatus.Closed) => true,
      _ => false
    };
}

// Change status
public async Task ChangeStatusAsync(int caseId, IncidentStatus newStatus)
{
    var incidentCase = await GetCaseAsync(caseId);
    
    if (!IsValidStatusTransition(incidentCase.Status, newStatus))
        throw new InvalidOperationException("Invalid status transition");

    var oldStatus = incidentCase.Status;
    incidentCase.Status = newStatus;

    if (newStatus == IncidentStatus.Closed)
    {
        incidentCase.ClosedBy = currentUserId;
incidentCase.ClosedAt = DateTime.UtcNow;
    }

    // Log timeline event
    await AddTimelineEventAsync(caseId, IncidentTimelineEventType.StatusChanged,
        metadata: new { oldStatus, newStatus });
}
```

### 3. Assignment

```csharp
// Assign case to reviewer
public async Task AssignCaseAsync(int caseId, string assigneeId)
{
    var incidentCase = await GetCaseAsync(caseId);
    var assignee = await GetUserAsync(assigneeId);

    var previousAssignee = incidentCase.AssignedTo;
    
    incidentCase.AssignedTo = assigneeId;
    incidentCase.AssignedAt = DateTime.UtcNow;

    // Auto-transition to InReview if Open
    if (incidentCase.Status == IncidentStatus.Open)
        incidentCase.Status = IncidentStatus.InReview;

    // Log timeline event with old/new assignee
    await AddTimelineEventAsync(caseId, IncidentTimelineEventType.Assigned,
        metadata: new { assigneeId, previousAssignee });
}
```

### 4. Evidence Linking

```csharp
// Link evidence (append-only)
public async Task LinkEvidenceAsync(LinkEvidenceDto dto)
{
    var incidentCase = await GetCaseAsync(dto.CaseId);

    if (incidentCase.Status == IncidentStatus.Closed)
        throw new InvalidOperationException("Cannot add evidence to closed case");

    // Get next order number
    var maxOrder = await GetMaxEvidenceOrderAsync(dto.CaseId);

    var link = new IncidentEvidenceLink
    {
        IncidentCaseId = dto.CaseId,
        ProctorEvidenceId = dto.ProctorEvidenceId,
      ProctorEventId = dto.ProctorEventId,
        NoteEn = dto.NoteEn,
        Order = maxOrder + 1,
 LinkedBy = currentUserId,
        LinkedAt = DateTime.UtcNow
    };

    // Log timeline event
    await AddTimelineEventAsync(dto.CaseId, IncidentTimelineEventType.EvidenceLinked);
}
```

### 5. Decision Recording

```csharp
// Record decision
public async Task RecordDecisionAsync(RecordDecisionDto dto)
{
    var incidentCase = await GetCaseAsync(dto.CaseId);

    if (incidentCase.Status == IncidentStatus.Closed)
      throw new InvalidOperationException("Cannot decide on closed case");

    // Get current risk score for snapshot
    var currentRiskScore = await GetCurrentRiskScoreAsync(incidentCase.ProctorSessionId);

    // Create decision history entry
    var decision = new IncidentDecisionHistory
    {
        IncidentCaseId = dto.CaseId,
        Outcome = dto.Outcome,
        ReasonEn = dto.ReasonEn,
        ReasonAr = dto.ReasonAr,
        DecidedBy = currentUserId,
        DecidedAt = DateTime.UtcNow,
        RiskScoreAtDecision = currentRiskScore
    };

    // Update case with latest decision
    incidentCase.Outcome = dto.Outcome;
    incidentCase.ResolutionNoteEn = dto.ReasonEn;
    incidentCase.ResolvedBy = currentUserId;
    incidentCase.ResolvedAt = DateTime.UtcNow;
    incidentCase.Status = IncidentStatus.Resolved;

 if (dto.CloseCase)
    {
  incidentCase.Status = IncidentStatus.Closed;
        incidentCase.ClosedBy = currentUserId;
        incidentCase.ClosedAt = DateTime.UtcNow;
    }

    // Log timeline event
    await AddTimelineEventAsync(dto.CaseId, IncidentTimelineEventType.DecisionRecorded,
        metadata: new { outcome = dto.Outcome, closeCase = dto.CloseCase });
}
```

### 6. Appeal Process

```csharp
// Submit appeal (candidate)
public async Task SubmitAppealAsync(SubmitAppealDto dto, string candidateId)
{
    var incidentCase = await GetCaseAsync(dto.IncidentCaseId);

    // Validate candidate owns this case
 if (incidentCase.CandidateId != candidateId)
        throw new UnauthorizedAccessException();

    // Must have a decision to appeal
    if (incidentCase.Outcome == null)
  throw new InvalidOperationException("Cannot appeal without decision");

    // Check for pending appeal
    var pendingAppeal = await GetPendingAppealAsync(dto.IncidentCaseId);
    if (pendingAppeal != null)
  throw new InvalidOperationException("Appeal already pending");

    var appealNumber = await GenerateAppealNumberAsync(); // APL-20240115-0001

    var appeal = new AppealRequest
    {
        AppealNumber = appealNumber,
        IncidentCaseId = dto.IncidentCaseId,
        CandidateId = candidateId,
        Status = AppealStatus.Submitted,
        Message = dto.Message,
        SubmittedAt = DateTime.UtcNow
    };

    // Log timeline event
    await AddTimelineEventAsync(dto.IncidentCaseId, IncidentTimelineEventType.AppealSubmitted);
}

// Review appeal (admin/reviewer)
public async Task ReviewAppealAsync(ReviewAppealDto dto, string reviewerId)
{
    var appeal = await GetAppealAsync(dto.AppealId);

    if (appeal.Status != AppealStatus.Submitted && appeal.Status != AppealStatus.InReview)
        throw new InvalidOperationException("Appeal already reviewed");

    appeal.Status = dto.Decision; // Approved or Rejected
    appeal.ReviewedBy = reviewerId;
    appeal.ReviewedAt = DateTime.UtcNow;
    appeal.DecisionNoteEn = dto.DecisionNoteEn;

    // If approved with new outcome, record new decision
    if (dto.Decision == AppealStatus.Approved && dto.NewOutcome.HasValue)
    {
     var decision = new IncidentDecisionHistory
        {
            IncidentCaseId = appeal.IncidentCaseId,
 Outcome = dto.NewOutcome.Value,
          IsAppealDecision = true,
 AppealRequestId = appeal.Id
      };

        // Update case outcome
        appeal.IncidentCase.Outcome = dto.NewOutcome.Value;
    }

    // Log timeline event
    await AddTimelineEventAsync(appeal.IncidentCaseId, IncidentTimelineEventType.AppealReviewed);
}
```

---

## Usage Examples

### 1. Create Incident Case

**Request:**
```http
POST /api/incident/case
Content-Type: application/json
Authorization: Bearer {reviewer_token}

{
    "attemptId": 100,
    "proctorSessionId": 50,
"source": 2,
    "severity": 3,
    "titleEn": "Multiple Tab Switches Detected",
    "titleAr": "?? ?????? ????? ????? ?????????",
    "summaryEn": "Candidate switched tabs 15 times during exam",
    "summaryAr": "??? ?????? ?????? ????????? 15 ??? ????? ????????"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "caseNumber": "INC-20240115-0001",
     "examId": 1,
"examTitleEn": "Introduction to Programming",
   "attemptId": 100,
        "candidateId": "user123",
        "candidateName": "John Doe",
        "proctorSessionId": 50,
        "status": 1,
        "statusName": "Open",
        "severity": 3,
        "severityName": "High",
    "source": 2,
      "sourceName": "ManualReport",
        "titleEn": "Multiple Tab Switches Detected",
      "riskScoreAtCreate": 45.5,
        "totalViolationsAtCreate": 15,
        "createdAt": "2024-01-15T10:00:00Z",
        "timeline": [
     {
"eventType": 1,
           "eventTypeName": "Created",
      "actorName": "Reviewer One",
  "descriptionEn": "Case created",
      "occurredAt": "2024-01-15T10:00:00Z"
   }
        ]
    }
}
```

### 2. Create Case from Proctor Session

**Request:**
```http
POST /api/incident/case/from-proctor/50
Authorization: Bearer {reviewer_token}
```

**Response:**
```json
{
    "success": true,
 "data": {
        "id": 2,
     "caseNumber": "INC-20240115-0002",
    "source": 1,
        "sourceName": "ProctorAuto",
     "severity": 3,
        "severityName": "High",
        "titleEn": "Proctor Alert - Risk Score: 65.5",
        "riskScoreAtCreate": 65.5,
        "totalViolationsAtCreate": 18
  }
}
```

### 3. Assign Case

**Request:**
```http
POST /api/incident/case/assign
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "caseId": 1,
    "assigneeId": "reviewer001"
}
```

**Response:**
```json
{
  "success": true,
    "data": {
"id": 1,
        "status": 2,
        "statusName": "InReview",
        "assignedTo": "reviewer001",
        "assigneeName": "Jane Reviewer",
        "assignedAt": "2024-01-15T10:30:00Z",
 "timeline": [
 {
        "eventType": 2,
  "eventTypeName": "Assigned",
             "actorName": "Admin User",
           "descriptionEn": "Assigned to Jane Reviewer",
         "occurredAt": "2024-01-15T10:30:00Z"
            }
        ]
    }
}
```

### 4. Link Evidence

**Request:**
```http
POST /api/incident/evidence/link
Content-Type: application/json
Authorization: Bearer {reviewer_token}

{
    "caseId": 1,
    "proctorEvidenceId": 100,
    "noteEn": "Video shows candidate looking at external device",
    "noteAr": "???? ??????? ?????? ???? ??? ???? ?????"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
  "id": 1,
     "proctorEvidenceId": 100,
        "evidenceType": "Video",
        "evidenceDescription": "video_chunk_001.webm",
        "noteEn": "Video shows candidate looking at external device",
        "order": 1,
        "linkedBy": "reviewer001",
        "linkedAt": "2024-01-15T11:00:00Z"
    }
}
```

### 5. Record Decision

**Request:**
```http
POST /api/incident/decision
Content-Type: application/json
Authorization: Bearer {reviewer_token}

{
    "caseId": 1,
    "outcome": 3,
    "reasonEn": "Video evidence confirms use of unauthorized device during exam",
    "reasonAr": "???? ???? ??????? ??????? ???? ??? ???? ?? ????? ????????",
    "internalNotes": "Clear violation at timestamp 15:30",
    "closeCase": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
"outcome": 3,
        "outcomeName": "Invalidated",
      "reasonEn": "Video evidence confirms use of unauthorized device during exam",
        "decidedBy": "reviewer001",
   "deciderName": "Jane Reviewer",
        "decidedAt": "2024-01-15T12:00:00Z",
        "riskScoreAtDecision": 65.5,
        "isAppealDecision": false
    }
}
```

### 6. Add Comment

**Request:**
```http
POST /api/incident/comment
Content-Type: application/json
Authorization: Bearer {reviewer_token}

{
    "caseId": 1,
    "body": "Reviewed video evidence from 10:00 to 20:00. Clear violation observed.",
    "isVisibleToCandidate": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
     "id": 1,
 "authorId": "reviewer001",
        "authorName": "Jane Reviewer",
   "body": "Reviewed video evidence from 10:00 to 20:00. Clear violation observed.",
        "isVisibleToCandidate": false,
    "isEdited": false,
      "createdAt": "2024-01-15T12:30:00Z"
    }
}
```

### 7. Get Timeline

**Request:**
```http
GET /api/incident/case/1/timeline
Authorization: Bearer {reviewer_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
    {
    "id": 5,
       "eventType": 5,
            "eventTypeName": "DecisionRecorded",
        "actorName": "Jane Reviewer",
            "descriptionEn": "Decision recorded: Invalidated",
        "metadataJson": "{\"outcome\":\"Invalidated\",\"closeCase\":false}",
       "occurredAt": "2024-01-15T12:00:00Z"
     },
        {
         "id": 4,
"eventType": 4,
    "eventTypeName": "EvidenceLinked",
   "actorName": "Jane Reviewer",
            "descriptionEn": "Evidence linked to case",
        "occurredAt": "2024-01-15T11:00:00Z"
        },
        {
    "id": 3,
      "eventType": 3,
     "eventTypeName": "StatusChanged",
       "actorName": "Admin User",
      "descriptionEn": "Status changed from Open to InReview",
    "occurredAt": "2024-01-15T10:30:00Z"
        },
        {
        "id": 2,
   "eventType": 2,
       "eventTypeName": "Assigned",
            "actorName": "Admin User",
  "descriptionEn": "Assigned to Jane Reviewer",
  "occurredAt": "2024-01-15T10:30:00Z"
        },
  {
            "id": 1,
            "eventType": 1,
            "eventTypeName": "Created",
     "actorName": "Reviewer One",
            "descriptionEn": "Case created",
            "occurredAt": "2024-01-15T10:00:00Z"
        }
    ]
}
```

### 8. Submit Appeal (Candidate)

**Request:**
```http
POST /api/incident/appeal
Content-Type: application/json
Authorization: Bearer {candidate_token}

{
    "incidentCaseId": 1,
    "message": "I did not use any external device. The video may show me looking at my watch to check the time. Please review again.",
    "supportingInfo": "I can provide my watch model information if needed."
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "appealNumber": "APL-20240115-0001",
  "incidentCaseId": 1,
        "caseNumber": "INC-20240115-0001",
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
      "candidateId": "user123",
        "candidateName": "John Doe",
        "status": 1,
        "statusName": "Submitted",
        "message": "I did not use any external device...",
        "submittedAt": "2024-01-15T14:00:00Z",
      "originalOutcome": 3
    }
}
```

### 9. Review Appeal

**Request:**
```http
POST /api/incident/appeal/review
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "appealId": 1,
    "decision": 3,
    "decisionNoteEn": "After careful review, the video clearly shows candidate looking at a phone, not a watch.",
    "decisionNoteAr": "??? ???????? ???????? ???? ??????? ????? ?? ?????? ???? ??? ???? ???? ????",
    "internalNotes": "Reviewed frame by frame. Device is clearly a smartphone.",
    "newOutcome": null
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "appealNumber": "APL-20240115-0001",
 "status": 4,
  "statusName": "Rejected",
        "reviewedBy": "admin001",
 "reviewerName": "Admin User",
     "reviewedAt": "2024-01-15T16:00:00Z",
        "decisionNoteEn": "After careful review, the video clearly shows...",
        "originalOutcome": 3
    }
}
```

### 10. Get Dashboard

**Request:**
```http
GET /api/incident/dashboard/exam/1
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
 "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "totalCases": 25,
      "openCases": 5,
        "inReviewCases": 8,
        "resolvedCases": 10,
        "closedCases": 2,
        "unassignedCases": 3,
      "criticalSeverityCases": 2,
  "highSeverityCases": 8,
        "clearedCount": 5,
        "suspiciousCount": 3,
   "invalidatedCount": 4,
      "escalatedCount": 0,
        "pendingAppeals": 2,
        "reviewerWorkload": [
     {
      "reviewerId": "reviewer001",
        "reviewerName": "Jane Reviewer",
    "assignedCases": 6,
        "resolvedCases": 4
  },
          {
    "reviewerId": "reviewer002",
    "reviewerName": "Bob Reviewer",
        "assignedCases": 5,
                "resolvedCases": 3
            }
      ],
        "severityDistribution": [
    { "severity": 1, "severityName": "Low", "count": 5, "percentage": 20.0 },
        { "severity": 2, "severityName": "Medium", "count": 10, "percentage": 40.0 },
        { "severity": 3, "severityName": "High", "count": 8, "percentage": 32.0 },
   { "severity": 4, "severityName": "Critical", "count": 2, "percentage": 8.0 }
        ]
    }
}
```

### 11. Candidate View of Incident

**Request:**
```http
GET /api/incident/my-incident/attempt/100
Authorization: Bearer {candidate_token}
```

**Response:**
```json
{
 "success": true,
  "data": {
        "incidentCaseId": 1,
        "caseNumber": "INC-20240115-0001",
   "examId": 1,
        "examTitleEn": "Introduction to Programming",
  "status": 3,
        "statusName": "Resolved",
        "outcome": 3,
        "outcomeName": "Invalidated",
        "createdAt": "2024-01-15T10:00:00Z",
 "resolvedAt": "2024-01-15T12:00:00Z",
"canAppeal": false,
     "activeAppeal": {
          "id": 1,
  "appealNumber": "APL-20240115-0001",
            "status": 4,
            "statusName": "Rejected",
            "submittedAt": "2024-01-15T14:00:00Z",
          "reviewedAt": "2024-01-15T16:00:00Z",
            "decisionNoteEn": "After careful review..."
        }
    }
}
```

---

## Case Lifecycle

### Status Flow
```
     ????????????????
     ?     Open     ?
     ?   (Initial)  ?
     ????????????????
            ? Assign
            ?
     ????????????????
     ?   InReview   ?
     ?  (Working)   ?
     ????????????????
            ? Decision
    ?
     ????????????????      Appeal
     ?   Resolved   ????????????
     ?  (Decided)   ?          ?
     ????????????????          ?
            ? Close      ?
            ?          ?
     ????????????????    ?????????????
     ?    Closed    ?    ?  Reopen   ?
     ?   (Final)    ?    ?  (Admin)  ?
 ????????????????    ?????????????
```

### Severity Determination
| Risk Score | Violations | Severity |
|------------|------------|----------|
| ? 75 | ? 20 | Critical |
| ? 50 | ? 10 | High |
| ? 25 | ? 5 | Medium |
| < 25 | < 5 | Low |

---

## Security & Privacy

### Candidate Restrictions
Candidates CANNOT see:
- Internal reviewer comments (unless marked visible)
- Full proctor event logs
- Raw evidence (unless policy allows)
- Other candidates' cases
- Reviewer internal notes

Candidates CAN see:
- Their case status and outcome
- Decision reason (public version)
- Their own appeals and responses
- Comments marked as visible

### Reviewer Restrictions
Reviewers can only see:
- Cases assigned to them
- Cases in their permitted scope
- Evidence through secure URLs

### Admin Access
Admins can:
- See all cases
- Assign/reassign cases
- Reopen closed cases
- Override decisions
- Access all evidence

### Audit Requirements
All actions logged in Timeline:
- Case creation
- Assignment/reassignment
- Status changes
- Evidence linking
- Decisions
- Comments
- Appeals

---

## Integration with Proctor Module

### Cross-Module Effects

**If Outcome = Invalidated:**
```csharp
// Update attempt result
var result = await GetResultAsync(attemptId);
result.ResultStatus = ResultStatus.Invalidated;
result.IntegrityStatus = IntegrityStatus.Invalidated;

// Update proctor decision for consistency
var proctorDecision = await GetProctorDecisionAsync(proctorSessionId);
if (proctorDecision != null)
{
    proctorDecision.Status = ProctorDecisionStatus.Invalidated;
}
```

**If Outcome = Cleared:**
```csharp
// Update proctor decision
var proctorDecision = await GetProctorDecisionAsync(proctorSessionId);
if (proctorDecision != null)
{
    proctorDecision.Status = ProctorDecisionStatus.Cleared;
}
```

**If Outcome = Suspicious:**
```csharp
// Add integrity flag but keep results
var result = await GetResultAsync(attemptId);
result.IntegrityStatus = IntegrityStatus.Suspicious;
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddIncidentModule
dotnet ef database update
```

---

## Testing Checklist

- [ ] Create incident case manually
- [ ] Create case from proctor session
- [ ] Reject duplicate active case per attempt
- [ ] Assign case to reviewer
- [ ] Auto-transition to InReview on assignment
- [ ] Reassign case (log both old/new in timeline)
- [ ] Change status with valid transitions
- [ ] Reject invalid status transitions
- [ ] Link proctor evidence
- [ ] Link proctor event
- [ ] Record decision (Cleared, Suspicious, Invalidated, Escalated)
- [ ] Decision updates case outcome
- [ ] Close case on decision if requested
- [ ] Add internal comment
- [ ] Add candidate-visible comment
- [ ] Edit own comment
- [ ] Delete comment
- [ ] Get full timeline
- [ ] Submit appeal (candidate)
- [ ] Reject appeal without decision
- [ ] Reject duplicate pending appeal
- [ ] Review appeal - Approve with new outcome
- [ ] Review appeal - Reject
- [ ] Reopen closed case (admin only)
- [ ] Get candidate's limited view
- [ ] Verify candidates cannot see internal comments
- [ ] Get exam dashboard
- [ ] Get global dashboard
- [ ] Verify all actions create timeline events
