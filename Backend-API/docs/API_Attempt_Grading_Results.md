# API Documentation: Attempt, Grading & Exam Results Module

## Base URL
`/api`

---

## Attempt Module (`/api/Attempt`)

**Authorization:** All endpoints require authentication

---

## Candidate Endpoints

### 1. Start Attempt
**Endpoint:** `POST /api/Attempt/start`

**Method:** POST

**Request Body:**
```json
{
  "examId": 1,
  "accessCode": "ABC123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": 1,
    "examId": 1,
    "examTitleEn": "Final Exam",
    "examTitleAr": "???????? ???????",
    "examDescriptionEn": "Comprehensive exam",
    "examDescriptionAr": "?????? ????",
    "startedAt": "2024-01-15T09:00:00Z",
    "expiresAt": "2024-01-15T11:00:00Z",
    "remainingSeconds": 7200,
    "totalQuestions": 50,
    "answeredQuestions": 0,
    "status": 0,
    "attemptNumber": 1,
    "maxAttempts": 2,
    "questions": [
      {
        "attemptQuestionId": 1,
  "questionId": 10,
    "order": 0,
    "points": 2.0,
        "body": "What is 2+2?",
        "questionTypeName": "Multiple Choice",
     "questionTypeId": 1,
        "options": [
          { "id": 1, "text": "3", "order": 0 },
    { "id": 2, "text": "4", "order": 1 }
 ],
        "attachments": [],
     "currentAnswer": null
      }
    ],
    "instructions": [
    { "order": 0, "contentEn": "Read carefully", "contentAr": "???? ??????" }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot start attempt",
  "errors": ["Maximum attempts reached", "Exam not available", "Invalid access code"]
}
```

---

### 2. Get Attempt Session
**Endpoint:** `GET /api/Attempt/{attemptId}/session`

**Method:** GET

---

### 3. Submit Attempt
**Endpoint:** `POST /api/Attempt/{attemptId}/submit`

**Method:** POST

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": 1,
    "submittedAt": "2024-01-15T10:30:00Z",
    "status": 2,
    "statusName": "Submitted",
    "totalQuestions": 50,
    "answeredQuestions": 48,
    "message": "Attempt submitted successfully"
  }
}
```

---

### 4. Get Attempt Timer
**Endpoint:** `GET /api/Attempt/{attemptId}/timer`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptId": 1,
    "serverTime": "2024-01-15T09:30:00Z",
    "expiresAt": "2024-01-15T11:00:00Z",
    "remainingSeconds": 5400,
    "status": 1,
    "isExpired": false
  }
}
```

---

### 5. Save Answer
**Endpoint:** `POST /api/Attempt/{attemptId}/answers`

**Method:** POST

**Request Body:**
```json
{
  "questionId": 10,
  "selectedOptionIds": [2],
  "textAnswer": null
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "attemptAnswerId": 1,
    "questionId": 10,
    "answeredAt": "2024-01-15T09:15:00Z",
    "success": true,
    "message": "Answer saved"
  }
}
```

---

### 6. Bulk Save Answers
**Endpoint:** `POST /api/Attempt/{attemptId}/answers/bulk`

**Method:** POST

**Request Body:**
```json
{
  "answers": [
    { "questionId": 10, "selectedOptionIds": [2], "textAnswer": null },
    { "questionId": 11, "selectedOptionIds": [5, 6], "textAnswer": null },
    { "questionId": 12, "selectedOptionIds": null, "textAnswer": "Essay answer text" }
  ]
}
```

---

### 7. Get Attempt Answers
**Endpoint:** `GET /api/Attempt/{attemptId}/answers`

**Method:** GET

---

### 8. Log Event
**Endpoint:** `POST /api/Attempt/{attemptId}/events`

**Method:** POST

**Request Body:**
```json
{
  "eventType": 1,
  "metadataJson": "{\"tabSwitchCount\": 1}"
}
```

**Event Types:**
| Value | Name |
|-------|------|
| 0 | Started |
| 1 | TabSwitch |
| 2 | WindowBlur |
| 3 | WindowFocus |
| 4 | CopyAttempt |
| 5 | PasteAttempt |
| 6 | RightClickAttempt |

---

### 9. Get My Exam Attempts
**Endpoint:** `GET /api/Attempt/exam/{examId}/my-attempts`

**Method:** GET

---

### 10. Get My Attempts
**Endpoint:** `GET /api/Attempt/my-attempts`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| examId | int | No | null |
| status | enum | No | null |
| startedFrom | DateTime | No | null |
| startedTo | DateTime | No | null |
| isPassed | bool | No | null |
| pageNumber | int | No | 1 |
| pageSize | int | No | 10 |

---

## Admin Endpoints

**Authorization:** `Admin` or `Instructor` role

### 11. Get All Attempts
**Endpoint:** `GET /api/Attempt`

**Method:** GET

### 12. Get Attempt by ID
**Endpoint:** `GET /api/Attempt/{attemptId}`

**Method:** GET

### 13. Get Attempt Details
**Endpoint:** `GET /api/Attempt/{attemptId}/details`

**Method:** GET

### 14. Get Attempt Events
**Endpoint:** `GET /api/Attempt/{attemptId}/events`

**Method:** GET

### 15. Cancel Attempt (Admin Only)
**Endpoint:** `POST /api/Attempt/cancel`

**Method:** POST

**Request Body:**
```json
{
  "attemptId": 1,
  "reason": "Technical issues reported"
}
```

### 16. Force Submit Attempt (Admin Only)
**Endpoint:** `POST /api/Attempt/{attemptId}/force-submit`

**Method:** POST

---

## Grading Module (`/api/Grading`)

**Authorization:** All endpoints require `Admin` or `Instructor` role (except candidate endpoints)

---

### 1. Initiate Grading
**Endpoint:** `POST /api/Grading/initiate`

**Method:** POST

**Request Body:**
```json
{
  "attemptId": 1
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gradingSessionId": 1,
    "attemptId": 1,
    "status": 1,
    "statusName": "InProgress",
    "autoGradedCount": 45,
    "manualGradingRequired": 5,
    "partialScore": 85.0,
    "message": "Auto-grading completed. 5 questions require manual grading."
  }
}
```

---

### 2. Get Grading Session
**Endpoint:** `GET /api/Grading/{gradingSessionId}`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "attemptId": 1,
    "examId": 1,
    "examTitleEn": "Final Exam",
    "candidateId": "user123",
    "candidateName": "John Doe",
    "status": 1,
    "statusName": "InProgress",
    "totalScore": null,
    "maxPossibleScore": 100.0,
    "passScore": 60.0,
    "isPassed": null,
"totalQuestions": 50,
    "gradedQuestions": 45,
    "manualGradingRequired": 5,
    "answers": [
   {
 "id": 1,
        "questionId": 10,
        "questionBody": "What is 2+2?",
        "questionTypeName": "Multiple Choice",
      "maxPoints": 2.0,
        "selectedOptionIds": [2],
        "textAnswer": null,
        "score": 2.0,
        "isCorrect": true,
        "isManuallyGraded": false,
        "graderComment": null
      }
    ]
  }
}
```

---

### 3. Get Grading Session by Attempt
**Endpoint:** `GET /api/Grading/attempt/{attemptId}`

**Method:** GET

---

### 4. Complete Grading
**Endpoint:** `POST /api/Grading/complete`

**Method:** POST

**Request Body:**
```json
{
  "gradingSessionId": 1
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
"data": {
    "gradingSessionId": 1,
    "attemptId": 1,
    "totalScore": 85.0,
 "maxPossibleScore": 100.0,
    "passScore": 60.0,
    "isPassed": true,
    "gradedAt": "2024-01-15T12:00:00Z",
    "status": 2,
    "message": "Grading completed successfully"
  }
}
```

---

### 5. Submit Manual Grade
**Endpoint:** `POST /api/Grading/manual-grade`

**Method:** POST

**Request Body:**
```json
{
  "gradingSessionId": 1,
  "questionId": 15,
  "score": 8.0,
  "isCorrect": true,
  "graderComment": "Well explained answer"
}
```

---

### 6. Bulk Submit Manual Grades
**Endpoint:** `POST /api/Grading/manual-grade/bulk`

**Method:** POST

**Request Body:**
```json
{
  "gradingSessionId": 1,
  "grades": [
    { "questionId": 15, "score": 8.0, "isCorrect": true, "graderComment": "Good" },
    { "questionId": 16, "score": 5.0, "isCorrect": false, "graderComment": "Incomplete" }
  ]
}
```

---

### 7. Get Manual Grading Queue
**Endpoint:** `GET /api/Grading/{gradingSessionId}/manual-queue`

**Method:** GET

---

### 8. Regrade Answer
**Endpoint:** `POST /api/Grading/regrade`

**Method:** POST

**Request Body:**
```json
{
  "gradingSessionId": 1,
  "questionId": 10,
  "newScore": 1.5,
  "isCorrect": false,
  "comment": "Partial credit",
  "reason": "Answer was partially correct"
}
```

---

### 9. Get All Grading Sessions
**Endpoint:** `GET /api/Grading`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| examId | int | No | null |
| candidateId | string | No | null |
| status | enum | No | null |
| isPassed | bool | No | null |
| requiresManualGrading | bool | No | null |
| pageNumber | int | No | 1 |
| pageSize | int | No | 10 |

**Grading Status Enum:**
| Value | Name |
|-------|------|
| 0 | Pending |
| 1 | InProgress |
| 2 | Completed |
| 3 | RequiresManualGrading |

---

### 10. Get Exam Grading Stats
**Endpoint:** `GET /api/Grading/stats/exam/{examId}`

**Method:** GET

---

### 11. Get Question Grading Stats
**Endpoint:** `GET /api/Grading/stats/exam/{examId}/questions`

**Method:** GET

---

### 12. Get My Result (Candidate)
**Endpoint:** `GET /api/Grading/my-result/{attemptId}`

**Method:** GET

**Authorization:** Authenticated user (candidate)

---

### 13. Is Grading Complete
**Endpoint:** `GET /api/Grading/is-complete/{attemptId}`

**Method:** GET

---

## Exam Result Module (`/api/ExamResult`)

**Authorization:** Most endpoints require `Admin` or `Instructor` role

---

### 1. Finalize Result
**Endpoint:** `POST /api/ExamResult/finalize/{gradingSessionId}`

**Method:** POST

---

### 2. Get Result by ID
**Endpoint:** `GET /api/ExamResult/{resultId}`

**Method:** GET

---

### 3. Get Result by Attempt
**Endpoint:** `GET /api/ExamResult/attempt/{attemptId}`

**Method:** GET

---

### 4. Get All Results
**Endpoint:** `GET /api/ExamResult`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| examId | int | No | null |
| candidateId | string | No | null |
| isPassed | bool | No | null |
| isPublished | bool | No | null |
| finalizedFrom | DateTime | No | null |
| finalizedTo | DateTime | No | null |
| search | string | No | null |
| pageNumber | int | No | 1 |
| pageSize | int | No | 10 |

---

### 5. Get Exam Results
**Endpoint:** `GET /api/ExamResult/exam/{examId}`

**Method:** GET

---

### 6. Publish Result
**Endpoint:** `POST /api/ExamResult/{resultId}/publish`

**Method:** POST

---

### 7. Unpublish Result (Admin Only)
**Endpoint:** `POST /api/ExamResult/{resultId}/unpublish`

**Method:** POST

---

### 8. Bulk Publish Results
**Endpoint:** `POST /api/ExamResult/publish/bulk`

**Method:** POST

**Request Body:**
```json
{
  "resultIds": [1, 2, 3, 4, 5]
}
```

---

### 9. Publish Exam Results
**Endpoint:** `POST /api/ExamResult/publish/exam`

**Method:** POST

**Request Body:**
```json
{
  "examId": 1,
  "passedOnly": false
}
```

---

### 10. Get My Result (Candidate)
**Endpoint:** `GET /api/ExamResult/my-result/{attemptId}`

**Method:** GET

**Authorization:** Authenticated user

---

### 11. Get My Results (Candidate)
**Endpoint:** `GET /api/ExamResult/my-results`

**Method:** GET

---

### 12. Get My Exam Summary (Candidate)
**Endpoint:** `GET /api/ExamResult/my-summary/exam/{examId}`

**Method:** GET

---

### 13. Generate Exam Report
**Endpoint:** `POST /api/ExamResult/report/generate`

**Method:** POST

**Request Body:**
```json
{
  "examId": 1,
"fromDate": "2024-01-01T00:00:00Z",
  "toDate": "2024-01-31T23:59:59Z"
}
```

---

### 14. Get Exam Report
**Endpoint:** `GET /api/ExamResult/report/exam/{examId}`

**Method:** GET

---

### 15. Generate Question Performance
**Endpoint:** `POST /api/ExamResult/report/question-performance/generate`

**Method:** POST

**Request Body:**
```json
{
  "examId": 1
}
```

---

### 16. Get Question Performance
**Endpoint:** `GET /api/ExamResult/report/question-performance/exam/{examId}`

**Method:** GET

---

### 17. Get Result Dashboard
**Endpoint:** `GET /api/ExamResult/dashboard/exam/{examId}`

**Method:** GET

---

### 18. Request Export
**Endpoint:** `POST /api/ExamResult/export/request`

**Method:** POST

**Request Body:**
```json
{
  "examId": 1,
  "format": 0,
  "fromDate": "2024-01-01T00:00:00Z",
  "toDate": "2024-01-31T23:59:59Z",
  "passedOnly": null,
  "failedOnly": null
}
```

**Export Format Enum:**
| Value | Name |
|-------|------|
| 0 | Csv |
| 1 | Excel |
| 2 | Pdf |
| 3 | Json |

---

### 19. Get Export Job
**Endpoint:** `GET /api/ExamResult/export/{jobId}`

**Method:** GET

---

### 20. Get Export Jobs
**Endpoint:** `GET /api/ExamResult/export`

**Method:** GET

---

### 21. Cancel Export Job
**Endpoint:** `POST /api/ExamResult/export/{jobId}/cancel`

**Method:** POST

---

### 22. Download Export
**Endpoint:** `GET /api/ExamResult/export/{jobId}/download`

**Method:** GET

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

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "errors": []
}
```
