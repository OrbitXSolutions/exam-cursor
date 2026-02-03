# API Documentation: Proctor, Incident & Audit Module

## Base URL
`/api`

---

## Proctor Module (`/api/Proctor`)

**Authorization:** All endpoints require authentication

---

## Session Management

### 1. Create Proctor Session
**Endpoint:** `POST /api/Proctor/session`

**Method:** POST

**Request Body:**
```json
{
  "attemptId": 1,
  "mode": 1,
  "deviceFingerprint": "abc123xyz",
  "userAgent": "Mozilla/5.0...",
  "browserName": "Chrome",
  "browserVersion": "120.0",
  "operatingSystem": "Windows 11",
  "screenResolution": "1920x1080"
}
```

**Proctor Mode Enum:**
| Value | Name | Description |
|-------|------|-------------|
| 0 | None | No proctoring |
| 1 | Soft | Basic monitoring |
| 2 | Hard | Strict monitoring with lockdown |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "proctorSessionId": 1,
    "attemptId": 1,
    "mode": 1,
    "startedAt": "2024-01-15T09:00:00Z",
    "heartbeatIntervalSeconds": 30,
  "message": "Proctor session created"
  }
}
```

---

### 2. Get Proctor Session
**Endpoint:** `GET /api/Proctor/session/{sessionId}`

**Method:** GET

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

---

### 3. Get Session by Attempt
**Endpoint:** `GET /api/Proctor/session/attempt/{attemptId}`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| mode | ProctorMode | Soft (1) |

---

### 4. End Session
**Endpoint:** `POST /api/Proctor/session/{sessionId}/end`

**Method:** POST

---

### 5. Cancel Session (Admin Only)
**Endpoint:** `POST /api/Proctor/session/{sessionId}/cancel`

**Method:** POST

---

### 6. Get All Sessions
**Endpoint:** `GET /api/Proctor/sessions`

**Method:** GET

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| examId | int | No | null |
| candidateId | string | No | null |
| mode | ProctorMode | No | null |
| status | ProctorSessionStatus | No | null |
| decisionStatus | ProctorDecisionStatus | No | null |
| requiresReview | bool | No | null |
| minRiskScore | decimal | No | null |
| startedFrom | DateTime | No | null |
| startedTo | DateTime | No | null |
| pageNumber | int | No | 1 |
| pageSize | int | No | 10 |

---

## Events

### 7. Log Single Event
**Endpoint:** `POST /api/Proctor/event`

**Method:** POST

**Request Body:**
```json
{
  "proctorSessionId": 1,
  "eventType": 3,
  "severity": 2,
  "metadataJson": "{\"details\": \"Tab switched to another window\"}",
  "clientTimestamp": "2024-01-15T09:15:00Z"
}
```

**Proctor Event Type Enum:**
| Value | Name |
|-------|------|
| 0 | SessionStarted |
| 1 | SessionEnded |
| 2 | Heartbeat |
| 3 | TabSwitch |
| 4 | WindowBlur |
| 5 | WindowFocus |
| 6 | FullscreenExit |
| 7 | FullscreenEnter |
| 8 | CopyAttempt |
| 9 | PasteAttempt |
| 10 | RightClick |
| 11 | KeyboardShortcut |
| 12 | FaceNotDetected |
| 13 | MultipleFaces |
| 14 | AudioDetected |
| 15 | ScreenshareStarted |
| 16 | ScreenshareStopped |
| 17 | BrowserResize |
| 18 | NetworkDisconnect |
| 19 | NetworkReconnect |

**Severity Levels:**
| Value | Label |
|-------|-------|
| 0 | Info |
| 1 | Low |
| 2 | Medium |
| 3 | High |
| 4 | Critical |
| 5 | Severe |

---

### 8. Bulk Log Events
**Endpoint:** `POST /api/Proctor/events/bulk`

**Method:** POST

**Request Body:**
```json
{
"proctorSessionId": 1,
  "events": [
    { "eventType": 3, "severity": 2, "metadataJson": null, "clientTimestamp": null },
    { "eventType": 4, "severity": 1, "metadataJson": null, "clientTimestamp": null }
  ]
}
```

---

### 9. Process Heartbeat
**Endpoint:** `POST /api/Proctor/heartbeat`

**Method:** POST

**Request Body:**
```json
{
  "proctorSessionId": 1,
  "clientTimestamp": "2024-01-15T09:15:00Z",
  "metadataJson": null
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "serverTime": "2024-01-15T09:15:01Z",
    "currentRiskScore": 15.5,
    "totalViolations": 3,
 "hasWarning": false,
    "warningMessage": null
  }
}
```

---

### 10. Get Session Events
**Endpoint:** `GET /api/Proctor/session/{sessionId}/events`

**Method:** GET

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

---

## Risk Management

### 11. Calculate Risk Score
**Endpoint:** `POST /api/Proctor/session/{sessionId}/calculate-risk`

**Method:** POST

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

**Success Response (200 OK):**
```json
{
"success": true,
  "data": {
    "proctorSessionId": 1,
    "riskScore": 45.5,
"riskLevel": "Medium",
    "totalEvents": 150,
    "totalViolations": 12,
    "triggeredRules": [
      { "ruleId": 1, "ruleName": "Tab Switching", "riskPoints": 10.0, "triggerCount": 5 }
    ],
    "eventBreakdown": {
      "TabSwitch": 10,
      "WindowBlur": 5
    },
    "calculatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 12. Get Risk Rules
**Endpoint:** `GET /api/Proctor/rules`

**Method:** GET

**Authorization:** `Admin` role

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| activeOnly | bool | false |

---

### 13. Create Risk Rule
**Endpoint:** `POST /api/Proctor/rules`

**Method:** POST

**Authorization:** `Admin` role

**Request Body:**
```json
{
  "nameEn": "Tab Switching Rule",
  "nameAr": "????? ????? ???????",
  "descriptionEn": "Triggers when candidate switches tabs frequently",
  "descriptionAr": "??? ??????? ??? ????? ????????? ???? ?????",
  "isActive": true,
  "eventType": 3,
  "thresholdCount": 5,
  "windowSeconds": 300,
  "riskPoints": 10.0,
  "minSeverity": 1,
  "maxTriggers": 10,
  "priority": 1
}
```

---

### 14. Update Risk Rule
**Endpoint:** `PUT /api/Proctor/rules/{ruleId}`

**Method:** PUT

---

### 15. Delete Risk Rule
**Endpoint:** `DELETE /api/Proctor/rules/{ruleId}`

**Method:** DELETE

---

### 16. Toggle Risk Rule
**Endpoint:** `POST /api/Proctor/rules/{ruleId}/toggle`

**Method:** POST

---

## Evidence

### 17. Request Evidence Upload
**Endpoint:** `POST /api/Proctor/evidence/request-upload`

**Method:** POST

**Request Body:**
```json
{
  "proctorSessionId": 1,
  "type": 1,
  "fileName": "screen-recording.webm",
  "contentType": "video/webm",
  "startAt": "2024-01-15T09:00:00Z",
  "endAt": "2024-01-15T09:30:00Z",
  "durationSeconds": 1800,
  "metadataJson": null
}
```

**Evidence Type Enum:**
| Value | Name |
|-------|------|
| 0 | Webcam |
| 1 | Screen |
| 2 | Audio |
| 3 | Screenshot |
| 4 | Photo |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "evidenceId": 1,
    "uploadUrl": "https://storage.example.com/upload?token=xyz",
    "expiresAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 18. Confirm Evidence Upload
**Endpoint:** `POST /api/Proctor/evidence/{evidenceId}/confirm`

**Method:** POST

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| fileSize | long | Yes |
| checksum | string | No |

---

### 19. Get Session Evidence
**Endpoint:** `GET /api/Proctor/session/{sessionId}/evidence`

**Method:** GET

---

### 20. Get Evidence Download URL
**Endpoint:** `GET /api/Proctor/evidence/{evidenceId}/download-url`

**Method:** GET

---

## Decisions

### 21. Make Decision
**Endpoint:** `POST /api/Proctor/decision`

**Method:** POST

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

**Request Body:**
```json
{
  "proctorSessionId": 1,
  "status": 1,
  "decisionReasonEn": "No significant violations detected",
  "decisionReasonAr": "?? ??? ?????? ??????? ?????",
  "internalNotes": "Reviewed video evidence",
  "finalize": true
}
```

**Proctor Decision Status Enum:**
| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Cleared |
| 2 | Suspicious |
| 3 | Invalidated |
| 4 | RequiresReview |

---

### 22. Override Decision (Admin Only)
**Endpoint:** `POST /api/Proctor/decision/override`

**Method:** POST

**Request Body:**
```json
{
  "decisionId": 1,
  "newStatus": 3,
  "overrideReason": "Additional evidence found",
  "decisionReasonEn": "Attempt invalidated due to cheating",
  "decisionReasonAr": "?? ????? ???????? ???? ????"
}
```

---

### 23. Get Decision
**Endpoint:** `GET /api/Proctor/session/{sessionId}/decision`

**Method:** GET

---

### 24. Get Pending Review
**Endpoint:** `GET /api/Proctor/pending-review`

**Method:** GET

---

## Dashboard

### 25. Get Dashboard
**Endpoint:** `GET /api/Proctor/dashboard/exam/{examId}`

**Method:** GET

---

### 26. Get Live Monitoring
**Endpoint:** `GET /api/Proctor/live/exam/{examId}`

**Method:** GET

---

## Incident Module (`/api/Incident`)

**Authorization:** All endpoints require authentication

---

## Case Management

### 1. Create Incident Case
**Endpoint:** `POST /api/Incident/case`

**Method:** POST

**Authorization:** `Admin`, `Instructor`, or `ProctorReviewer` role

**Request Body:**
```json
{
  "attemptId": 1,
  "proctorSessionId": 1,
"source": 1,
  "severity": 2,
  "titleEn": "Multiple Tab Switches Detected",
  "titleAr": "?? ?????? ????? ????? ?????????",
  "summaryEn": "Candidate switched tabs 15 times during the exam",
  "summaryAr": "??? ?????? ?????? ????????? 15 ??? ????? ????????"
}
```

**Incident Source Enum:**
| Value | Name |
|-------|------|
| 0 | Manual |
| 1 | Proctor |
| 2 | System |
| 3 | Appeal |

**Incident Severity Enum:**
| Value | Name |
|-------|------|
| 0 | Low |
| 1 | Medium |
| 2 | High |
| 3 | Critical |

---

### 2. Create Case from Proctor Session
**Endpoint:** `POST /api/Incident/case/from-proctor/{proctorSessionId}`

**Method:** POST

---

### 3. Get Case
**Endpoint:** `GET /api/Incident/case/{caseId}`

**Method:** GET

---

### 4. Get Case by Attempt
**Endpoint:** `GET /api/Incident/case/by-attempt/{attemptId}`

**Method:** GET

---

### 5. Update Case
**Endpoint:** `PUT /api/Incident/case`

**Method:** PUT

**Request Body:**
```json
{
  "id": 1,
  "severity": 3,
  "titleEn": "Updated Title",
  "titleAr": "??????? ??????",
  "summaryEn": "Updated summary",
  "summaryAr": "?????? ??????"
}
```

---

### 6. Get All Cases
**Endpoint:** `GET /api/Incident/cases`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| examId | int | No |
| candidateId | string | No |
| status | IncidentStatus | No |
| severity | IncidentSeverity | No |
| source | IncidentSource | No |
| outcome | IncidentOutcome | No |
| assignedTo | string | No |
| unassigned | bool | No |
| createdFrom | DateTime | No |
| createdTo | DateTime | No |
| search | string | No |
| pageNumber | int | No |
| pageSize | int | No |

**Incident Status Enum:**
| Value | Name |
|-------|------|
| 0 | Open |
| 1 | InReview |
| 2 | Resolved |
| 3 | Closed |
| 4 | Reopened |

---

### 7. Assign Case (Admin Only)
**Endpoint:** `POST /api/Incident/case/assign`

**Method:** POST

**Request Body:**
```json
{
  "caseId": 1,
  "assigneeId": "user123"
}
```

---

### 8. Change Status
**Endpoint:** `POST /api/Incident/case/status`

**Method:** POST

**Request Body:**
```json
{
  "caseId": 1,
  "newStatus": 1,
  "reason": "Starting review"
}
```

---

### 9. Close Case
**Endpoint:** `POST /api/Incident/case/{caseId}/close`

**Method:** POST

---

### 10. Reopen Case (Admin Only)
**Endpoint:** `POST /api/Incident/case/{caseId}/reopen`

**Method:** POST

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| reason | string | Yes |

---

## Evidence

### 11. Link Evidence
**Endpoint:** `POST /api/Incident/evidence/link`

**Method:** POST

**Request Body:**
```json
{
  "caseId": 1,
  "proctorEvidenceId": 5,
  "proctorEventId": null,
  "noteEn": "Key evidence",
  "noteAr": "???? ?????"
}
```

---

### 12. Get Case Evidence
**Endpoint:** `GET /api/Incident/case/{caseId}/evidence`

**Method:** GET

---

### 13. Remove Evidence Link
**Endpoint:** `DELETE /api/Incident/evidence/{linkId}`

**Method:** DELETE

---

## Decisions

### 14. Record Decision
**Endpoint:** `POST /api/Incident/decision`

**Method:** POST

**Request Body:**
```json
{
  "caseId": 1,
  "outcome": 2,
  "reasonEn": "Evidence confirms violation",
  "reasonAr": "?????? ???? ????????",
  "internalNotes": "Reviewed all evidence",
  "closeCase": true
}
```

**Incident Outcome Enum:**
| Value | Name |
|-------|------|
| 0 | Cleared |
| 1 | Suspicious |
| 2 | Confirmed |
| 3 | Invalidated |
| 4 | Escalated |

---

### 15. Get Decision History
**Endpoint:** `GET /api/Incident/case/{caseId}/decisions`

**Method:** GET

---

## Comments

### 16. Add Comment
**Endpoint:** `POST /api/Incident/comment`

**Method:** POST

**Request Body:**
```json
{
  "caseId": 1,
  "body": "Initial review completed",
  "isVisibleToCandidate": false
}
```

---

### 17. Edit Comment
**Endpoint:** `PUT /api/Incident/comment`

**Method:** PUT

**Request Body:**
```json
{
  "commentId": 1,
  "body": "Updated comment text"
}
```

---

### 18. Delete Comment
**Endpoint:** `DELETE /api/Incident/comment/{commentId}`

**Method:** DELETE

---

### 19. Get Comments
**Endpoint:** `GET /api/Incident/case/{caseId}/comments`

**Method:** GET

---

## Timeline

### 20. Get Timeline
**Endpoint:** `GET /api/Incident/case/{caseId}/timeline`

**Method:** GET

---

## Appeals (Candidate)

### 21. Submit Appeal
**Endpoint:** `POST /api/Incident/appeal`

**Method:** POST

**Authorization:** Authenticated user (candidate)

**Request Body:**
```json
{
  "incidentCaseId": 1,
  "message": "I believe this was a false positive. I had technical issues.",
  "supportingInfo": "Network logs attached"
}
```

---

### 22. Get Appeal
**Endpoint:** `GET /api/Incident/appeal/{appealId}`

**Method:** GET

---

### 23. Get Case Appeals
**Endpoint:** `GET /api/Incident/case/{caseId}/appeals`

**Method:** GET

---

### 24. Review Appeal
**Endpoint:** `POST /api/Incident/appeal/review`

**Method:** POST

**Request Body:**
```json
{
  "appealId": 1,
  "decision": 1,
  "decisionNoteEn": "Appeal accepted after review",
  "decisionNoteAr": "?? ???? ????????? ??? ????????",
  "internalNotes": "Technical issue confirmed",
  "newOutcome": 0
}
```

**Appeal Status Enum:**
| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | Approved |
| 2 | Rejected |
| 3 | PartiallyApproved |

---

### 25. Can Submit Appeal
**Endpoint:** `GET /api/Incident/case/{caseId}/can-appeal`

**Method:** GET

---

## Candidate Access

### 26. Get My Incident Status
**Endpoint:** `GET /api/Incident/my-incident/attempt/{attemptId}`

**Method:** GET

---

### 27. Get My Incidents
**Endpoint:** `GET /api/Incident/my-incidents`

**Method:** GET

---

### 28. Get My Appeal
**Endpoint:** `GET /api/Incident/case/{caseId}/my-appeal`

**Method:** GET

---

## Dashboard

### 29. Get Dashboard
**Endpoint:** `GET /api/Incident/dashboard/exam/{examId}`

**Method:** GET

---

### 30. Get Global Dashboard (Admin Only)
**Endpoint:** `GET /api/Incident/dashboard`

**Method:** GET

---

## Audit Module (`/api/Audit`)

**Authorization:** All endpoints require `Admin`, `SuperAdmin`, or `Auditor` role

---

## Audit Logs

### 1. Get Audit Log
**Endpoint:** `GET /api/Audit/log/{logId}`

**Method:** GET

---

### 2. Search Logs
**Endpoint:** `GET /api/Audit/logs`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| actorId | string | No |
| actorType | ActorType | No |
| action | string | No |
| actionPrefix | string | No |
| entityName | string | No |
| entityId | string | No |
| correlationId | string | No |
| tenantId | string | No |
| source | AuditSource | No |
| channel | AuditChannel | No |
| outcome | AuditOutcome | No |
| fromDate | DateTime | No |
| toDate | DateTime | No |
| search | string | No |
| pageNumber | int | No |
| pageSize | int | No |

---

### 3. Get Entity History
**Endpoint:** `GET /api/Audit/entity-history`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| entityName | string | Yes |
| entityId | string | Yes |
| pageNumber | int | No |
| pageSize | int | No |

---

### 4. Get User Activity
**Endpoint:** `GET /api/Audit/user-activity`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| userId | string | Yes |
| fromDate | DateTime | No |
| toDate | DateTime | No |
| pageNumber | int | No |
| pageSize | int | No |

---

### 5. Get by Correlation ID
**Endpoint:** `GET /api/Audit/correlation/{correlationId}`

**Method:** GET

---

### 6. Get Recent Failures
**Endpoint:** `GET /api/Audit/failures`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| count | int | 50 |

---

## Retention Policies

### 7. Get Retention Policies
**Endpoint:** `GET /api/Audit/policies`

**Method:** GET

---

### 8. Create Retention Policy
**Endpoint:** `POST /api/Audit/policy`

**Method:** POST

**Authorization:** `Admin` or `SuperAdmin` role

**Request Body:**
```json
{
  "nameEn": "Standard Retention",
  "nameAr": "???????? ???????",
  "descriptionEn": "Retain logs for 90 days",
  "descriptionAr": "???????? ???????? ???? 90 ?????",
  "isActive": true,
  "priority": 100,
  "retentionDays": 90,
  "entityName": null,
  "actionPrefix": null,
  "channel": null,
  "actorType": null,
  "archiveBeforeDelete": true,
  "archiveTarget": "blob",
  "archivePathTemplate": "audit/{year}/{month}"
}
```

---

### 9. Update Retention Policy
**Endpoint:** `PUT /api/Audit/policy`

**Method:** PUT

---

### 10. Delete Retention Policy
**Endpoint:** `DELETE /api/Audit/policy/{policyId}`

**Method:** DELETE

---

### 11. Set Default Policy
**Endpoint:** `POST /api/Audit/policy/{policyId}/set-default`

**Method:** POST

---

### 12. Execute Retention
**Endpoint:** `POST /api/Audit/policies/execute`

**Method:** POST

---

### 13. Preview Retention
**Endpoint:** `GET /api/Audit/policy/{policyId}/preview`

**Method:** GET

---

## Export Jobs

### 14. Create Export Job
**Endpoint:** `POST /api/Audit/export`

**Method:** POST

**Request Body:**
```json
{
  "fromDate": "2024-01-01T00:00:00Z",
  "toDate": "2024-01-31T23:59:59Z",
  "tenantId": null,
  "entityName": "User",
  "actionPrefix": "Auth.",
  "actorId": null,
  "outcome": null,
  "format": 0
}
```

---

### 15. Get Export Job
**Endpoint:** `GET /api/Audit/export/{jobId}`

**Method:** GET

---

### 16. Get Export Jobs
**Endpoint:** `GET /api/Audit/exports`

**Method:** GET

---

### 17. Get My Export Jobs
**Endpoint:** `GET /api/Audit/exports/my`

**Method:** GET

---

### 18. Cancel Export Job
**Endpoint:** `POST /api/Audit/export/{jobId}/cancel`

**Method:** POST

---

### 19. Get Export Download URL
**Endpoint:** `GET /api/Audit/export/{jobId}/download`

**Method:** GET

---

## Dashboard

### 20. Get Dashboard
**Endpoint:** `GET /api/Audit/dashboard`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| fromDate | DateTime | No |
| toDate | DateTime | No |

---

### 21. Get Entity Dashboard
**Endpoint:** `GET /api/Audit/dashboard/entity/{entityName}`

**Method:** GET

---

## Standard Audit Actions

| Action | Description |
|--------|-------------|
| Auth.Login | User logged in |
| Auth.Logout | User logged out |
| Auth.LoginFailed | Login attempt failed |
| Auth.PasswordChanged | Password changed |
| Auth.PasswordReset | Password reset |
| User.Created | User account created |
| User.Updated | User account updated |
| User.Deleted | User account deleted |
| Exam.Created | Exam created |
| Exam.Published | Exam published |
| Attempt.Started | Exam attempt started |
| Attempt.Submitted | Exam attempt submitted |
| Grading.Completed | Grading completed |
| Result.Published | Result published |
| Proctor.SessionStarted | Proctor session started |
| Proctor.HighRiskTriggered | High risk score detected |
| Incident.Created | Incident case created |
| Appeal.Submitted | Appeal submitted |

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": ["Error details"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated",
  "data": null,
  "errors": []
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied",
  "data": null,
  "errors": []
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "errors": []
}
```
