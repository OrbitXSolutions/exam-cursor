# Frontend API Guide: Candidate Exam Module

## Overview

This document provides comprehensive API documentation for frontend developers to implement the **Candidate Exam Experience**. This covers everything a candidate needs to:
- Browse and view available exams
- Start and take exams
- Answer questions
- Submit attempts
- View results

All endpoints require JWT authentication.

---

## Base URL

```
https://zoolker-003-site8.jtempurl.com/api
```

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer {your_jwt_token}
```

---

## Table of Contents

1. [Candidate Journey Overview](#1-candidate-journey-overview)
2. [Browse Available Exams](#2-browse-available-exams)
3. [Start Exam Attempt](#3-start-exam-attempt)
4. [Taking the Exam](#4-taking-the-exam)
5. [Answering Questions](#5-answering-questions)
6. [Submit Attempt](#6-submit-attempt)
7. [View Results](#7-view-results)
8. [Attempt History](#8-attempt-history)
9. [Security Events Logging](#9-security-events-logging)
10. [TypeScript Interfaces](#10-typescript-interfaces)
11. [React Implementation Examples](#11-react-implementation-examples)
12. [Error Handling](#12-error-handling)

---

## 1. Candidate Journey Overview

```
???????????????????????????????????????????????????????????????????????????
?      CANDIDATE EXAM JOURNEY?
???????????????????????????????????????????????????????????????????????????
?       ?
?  1. BROWSE EXAMS          2. START ATTEMPT         3. TAKE EXAM        ?
?  ????????????????         ????????????????         ???????????????? ?
?  ? View list of ?   ???   ? Enter access ?   ???   ? Answer       ?    ?
?  ? available    ?      ? code (if any)?         ? questions    ?    ?
?  ? exams        ?    ? Start timer  ?      ? Navigate     ?    ?
?  ????????????????         ????????????????         ????????????????    ?
?         ?     ?             ?     ?
?         ?           ?       ?    ?
?  GET /Assessment/exams    POST /Attempt/start      POST /Attempt/      ?
?  ?isPublished=true             {attemptId}/answers ?
?          ?
?  4. SUBMIT       5. VIEW RESULTS        ?
?  ????????????????         ????????????????      ?
?  ? Submit exam  ?   ???   ? View score   ?           ?
?  ? Auto-submit  ?         ? Review (if   ?        ?
?  ? on timeout   ?  ? allowed)? ?
?  ????????????????         ????????????????              ?
?         ?              ??
?         ?  ?           ?
?  POST /Attempt/   GET /ExamResult/    ?
?  {attemptId}/submit  my-result/{attemptId}            ?
?         ?
???????????????????????????????????????????????????????????????????????????
```

---

## 2. Browse Available Exams

### 2.1 Get Available Exams for Candidate

Retrieves published and active exams that the candidate can take.

**Endpoint:** `GET /Assessment/exams`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `isPublished` | boolean | **Yes** | Set to `true` for candidates |
| `isActive` | boolean | **Yes** | Set to `true` for candidates |
| `search` | string | No | Search in title (EN/AR) |
| `departmentId` | number | No | Filter by department |
| `pageNumber` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Items per page (default: 10) |

**Example Request:**

```http
GET /api/Assessment/exams?isPublished=true&isActive=true&pageNumber=1&pageSize=10
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
     "id": 1,
        "titleEn": "IT Fundamentals Certification Exam",
      "titleAr": "?????? ????? ??????? ????? ?????????",
        "departmentId": 1,
        "departmentNameEn": "Information Technology",
        "departmentNameAr": "????? ?????????",
        "examType": 1,
    "examTypeName": "Flex",
 "durationMinutes": 120,
    "maxAttempts": 2,
        "passScore": 70.0,
        "totalQuestions": 50,
        "totalPoints": 100.0,
        "isPublished": true,
    "isActive": true,
"startAt": "2024-02-01T09:00:00Z",
        "endAt": "2024-02-28T23:59:59Z",
        "createdDate": "2024-01-15T10:30:00Z"
   }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 5,
 "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
"errors": []
}
```

---

### 2.2 Get Exam Details

Get full exam details before starting (for preview/information purposes).

**Endpoint:** `GET /Assessment/exams/{id}`

**Example Request:**

```http
GET /api/Assessment/exams/1
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "titleEn": "IT Fundamentals Certification Exam",
    "titleAr": "?????? ????? ??????? ????? ?????????",
    "descriptionEn": "This exam covers fundamental IT concepts including networking, hardware, and software.",
    "descriptionAr": "???? ??? ???????? ???????? ???????? ?????? ?????????.",
    "examType": 1,
    "durationMinutes": 120,
    "maxAttempts": 2,
    "passScore": 70.0,
    "totalQuestions": 50,
    "totalPoints": 100.0,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "startAt": "2024-02-01T09:00:00Z",
    "endAt": "2024-02-28T23:59:59Z",
    "showResults": true,
  "allowReview": true,
    "showCorrectAnswers": false,
    "requireProctoring": false,
    "requireWebcam": false,
    "preventCopyPaste": true,
    "requireFullscreen": true,
    "browserLockdown": false,
    "instructions": [
      {
        "id": 1,
        "contentEn": "Read all questions carefully before answering.",
        "contentAr": "???? ???? ??????? ?????? ??? ???????.",
      "order": 1
      },
      {
        "id": 2,
        "contentEn": "You cannot go back to previous questions once submitted.",
"contentAr": "?? ????? ?????? ??? ??????? ??????? ??? ???????.",
        "order": 2
      }
    ],
    "accessPolicy": {
      "isPublic": false,
      "restrictToAssignedCandidates": false
    }
  },
  "errors": []
}
```

> **Note:** The `accessPolicy.accessCode` is not exposed to candidates - they need to enter it when starting the exam.

---

### 2.3 Get My Exam Summary (Attempts & Best Score)

Check candidate's previous attempts and eligibility for an exam.

**Endpoint:** `GET /ExamResult/my-summary/exam/{examId}`

**Example Request:**

```http
GET /api/ExamResult/my-summary/exam/1
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "examId": 1,
    "examTitleEn": "IT Fundamentals Certification Exam",
    "examTitleAr": "?????? ????? ??????? ????? ?????????",
    "candidateId": "user-123",
    "candidateName": "John Doe",
    "totalAttempts": 1,
    "maxAttempts": 2,
    "remainingAttempts": 1,
    "bestAttemptId": 5,
    "bestScore": 85.0,
    "bestPercentage": 85.0,
    "bestIsPassed": true,
    "latestScore": 85.0,
    "latestIsPassed": true,
    "lastAttemptAt": "2024-01-20T10:30:00Z"
  },
  "errors": []
}
```

**Response When No Previous Attempts:**

```json
{
  "success": true,
  "data": {
    "examId": 1,
    "examTitleEn": "IT Fundamentals Certification Exam",
    "totalAttempts": 0,
    "maxAttempts": 2,
    "remainingAttempts": 2,
    "bestAttemptId": null,
    "bestScore": null,
    "bestIsPassed": null,
    "lastAttemptAt": null
  },
  "errors": []
}
```

---

## 3. Start Exam Attempt

### 3.1 Start New Attempt

Start a new exam attempt or resume an existing active attempt.

**Endpoint:** `POST /Attempt/start`

**Request Body:**

```json
{
  "examId": 1,
  "accessCode": "IT2024CERT"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `examId` | number | Yes | The exam ID to attempt |
| `accessCode` | string | Conditional | Required if exam has access code configured |

**Success Response (200) - New Attempt Started:**

```json
{
  "success": true,
  "message": "Attempt started successfully",
  "data": {
  "attemptId": 10,
    "examId": 1,
    "examTitleEn": "IT Fundamentals Certification Exam",
    "examTitleAr": "?????? ????? ??????? ????? ?????????",
    "examDescriptionEn": "This exam covers fundamental IT concepts.",
    "examDescriptionAr": "???? ??? ???????? ???????? ????????.",
    "startedAt": "2024-01-25T09:00:00Z",
    "expiresAt": "2024-01-25T11:00:00Z",
    "remainingSeconds": 7200,
    "totalQuestions": 50,
    "answeredQuestions": 0,
    "status": 0,
 "attemptNumber": 1,
    "maxAttempts": 2,
    "questions": [
      {
   "attemptQuestionId": 101,
        "questionId": 42,
        "order": 1,
  "points": 2.0,
        "bodyEn": "What layer of the OSI model is responsible for routing?",
    "bodyAr": "?? ?? ???? ????? OSI ???????? ?? ????????",
        "questionTypeName": "MCQ_Single",
        "questionTypeId": 1,
        "options": [
        { "id": 101, "textEn": "Physical Layer", "textAr": "?????? ??????????", "order": 1 },
     { "id": 102, "textEn": "Data Link Layer", "textAr": "???? ??? ????????", "order": 2 },
    { "id": 103, "textEn": "Network Layer", "textAr": "???? ??????", "order": 3 },
     { "id": 104, "textEn": "Transport Layer", "textAr": "???? ?????", "order": 4 }
        ],
      "attachments": [],
        "currentAnswer": null
      }
    // ... more questions
    ],
    "instructions": [
      { "order": 1, "contentEn": "Read all questions carefully.", "contentAr": "???? ???? ??????? ??????." }
    ]
  },
  "errors": []
}
```

**Success Response - Resuming Existing Attempt:**

```json
{
  "success": true,
  "message": "Resuming existing attempt",
  "data": {
    "attemptId": 10,
    "status": 1,
    "answeredQuestions": 15,
    "remainingSeconds": 5400,
    "questions": [
      {
        "attemptQuestionId": 101,
        "questionId": 42,
        "order": 1,
   "currentAnswer": {
        "attemptAnswerId": 201,
          "questionId": 42,
   "selectedOptionIds": [103],
          "textAnswer": null,
       "answeredAt": "2024-01-25T09:15:00Z"
  }
    // ... rest of question data
  }
    ]
  },
  "errors": []
}
```

**Error Responses:**

```json
// Exam not found
{
  "success": false,
  "message": "Exam not found",
  "data": null,
  "errors": []
}

// Exam not active
{
  "success": false,
  "message": "Exam is not active",
  "data": null,
  "errors": []
}

// Exam not published
{
  "success": false,
  "message": "Exam is not published",
  "data": null,
  "errors": []
}

// Exam not started yet
{
  "success": false,
  "message": "Exam has not started yet. It starts at 2024-02-01 09:00 UTC",
  "data": null,
  "errors": []
}

// Exam ended
{
  "success": false,
  "message": "Exam has ended. It ended at 2024-01-31 23:59 UTC",
  "data": null,
  "errors": []
}

// Access code required
{
  "success": false,
  "message": "Access code is required for this exam",
  "data": null,
  "errors": []
}

// Invalid access code
{
  "success": false,
  "message": "Invalid access code",
  "data": null,
  "errors": []
}

// Maximum attempts reached
{
  "success": false,
  "message": "Maximum attempts (2) reached for this exam",
  "data": null,
  "errors": []
}
```

---

## 4. Taking the Exam

### 4.1 Get Attempt Session (Resume)

Resume an existing attempt or get current state.

**Endpoint:** `GET /Attempt/{attemptId}/session`

**Example Request:**

```http
GET /api/Attempt/10/session
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "attemptId": 10,
  "examId": 1,
    "examTitleEn": "IT Fundamentals Certification Exam",
    "examTitleAr": "?????? ????? ??????? ????? ?????????",
    "startedAt": "2024-01-25T09:00:00Z",
    "expiresAt": "2024-01-25T11:00:00Z",
    "remainingSeconds": 5400,
    "totalQuestions": 50,
    "answeredQuestions": 15,
    "status": 1,
    "attemptNumber": 1,
    "maxAttempts": 2,
    "questions": [ /* ... questions with current answers */ ],
    "instructions": [ /* ... */ ]
  },
  "errors": []
}
```

**Error - Attempt Already Submitted:**

```json
{
  "success": false,
  "message": "Attempt is Submitted. Cannot resume.",
  "data": null,
  "errors": []
}
```

---

### 4.2 Get Timer Status

Check remaining time and sync with server.

**Endpoint:** `GET /Attempt/{attemptId}/timer`

**Example Request:**

```http
GET /api/Attempt/10/timer
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "attemptId": 10,
    "serverTime": "2024-01-25T09:30:00Z",
    "expiresAt": "2024-01-25T11:00:00Z",
    "remainingSeconds": 5400,
    "status": 1,
    "isExpired": false
  },
  "errors": []
}
```

**Response - Time Expired:**

```json
{
  "success": true,
  "data": {
    "attemptId": 10,
    "serverTime": "2024-01-25T11:01:00Z",
    "expiresAt": "2024-01-25T11:00:00Z",
    "remainingSeconds": 0,
    "status": 3,
    "isExpired": true
  },
  "errors": []
}
```

> **Important:** Implement a timer sync mechanism that calls this endpoint every 30-60 seconds to stay synced with server time.

---

## 5. Answering Questions

### 5.1 Save Single Answer

Save or update an answer for a specific question.

**Endpoint:** `POST /Attempt/{attemptId}/answers`

**Request Body for MCQ (Single Choice):**

```json
{
  "questionId": 42,
  "selectedOptionIds": [103],
  "textAnswer": null
}
```

**Request Body for MCQ (Multiple Choice):**

```json
{
  "questionId": 43,
  "selectedOptionIds": [105, 107, 108],
  "textAnswer": null
}
```

**Request Body for True/False:**

```json
{
  "questionId": 44,
  "selectedOptionIds": [110],
  "textAnswer": null
}
```

**Request Body for Short Answer/Essay:**

```json
{
  "questionId": 45,
  "selectedOptionIds": null,
  "textAnswer": "The OSI model consists of seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. Each layer has specific responsibilities..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "attemptAnswerId": 201,
    "questionId": 42,
    "answeredAt": "2024-01-25T09:15:00Z",
    "success": true,
    "message": "Answer saved successfully"
  },
  "errors": []
}
```

**Error Responses:**

```json
// Attempt expired
{
  "success": false,
  "message": "Attempt has expired. Cannot save answers.",
  "data": null,
  "errors": []
}

// Attempt already submitted
{
  "success": false,
  "message": "Cannot save answers. Attempt is Submitted.",
  "data": null,
  "errors": []
}

// Invalid option for MCQ
{
  "success": false,
  "message": "Invalid option selected",
  "data": null,
  "errors": []
}

// Single-choice MCQ validation
{
  "success": false,
  "message": "Single-choice MCQ must have exactly one selected option",
  "data": null,
  "errors": []
}

// Text answer required
{
  "success": false,
  "message": "Text answer is required for this question type",
  "data": null,
  "errors": []
}
```

---

### 5.2 Bulk Save Answers

Save multiple answers at once (useful for auto-save functionality).

**Endpoint:** `POST /Attempt/{attemptId}/answers/bulk`

**Request Body:**

```json
{
  "answers": [
    { "questionId": 42, "selectedOptionIds": [103], "textAnswer": null },
    { "questionId": 43, "selectedOptionIds": [105, 107], "textAnswer": null },
    { "questionId": 44, "selectedOptionIds": null, "textAnswer": "My essay answer..." }
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "All answers saved successfully",
  "data": [
  { "questionId": 42, "attemptAnswerId": 201, "answeredAt": "2024-01-25T09:15:00Z", "success": true, "message": "Saved" },
    { "questionId": 43, "attemptAnswerId": 202, "answeredAt": "2024-01-25T09:15:00Z", "success": true, "message": "Saved" },
    { "questionId": 44, "attemptAnswerId": 203, "answeredAt": "2024-01-25T09:15:00Z", "success": true, "message": "Saved" }
  ],
  "errors": []
}
```

**Partial Success Response:**

```json
{
  "success": true,
  "message": "Some answers could not be saved",
  "data": [
    { "questionId": 42, "attemptAnswerId": 201, "success": true, "message": "Saved" },
    { "questionId": 43, "attemptAnswerId": 0, "success": false, "message": "Invalid option selected" }
  ],
  "errors": []
}
```

---

### 5.3 Get Current Answers

Retrieve all saved answers for an attempt.

**Endpoint:** `GET /Attempt/{attemptId}/answers`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "attemptAnswerId": 201,
      "questionId": 42,
   "selectedOptionIds": [103],
      "textAnswer": null,
      "answeredAt": "2024-01-25T09:15:00Z"
    },
    {
    "attemptAnswerId": 202,
      "questionId": 43,
"selectedOptionIds": [105, 107],
      "textAnswer": null,
      "answeredAt": "2024-01-25T09:18:00Z"
 },
    {
      "attemptAnswerId": 203,
      "questionId": 45,
      "selectedOptionIds": null,
      "textAnswer": "The OSI model consists of...",
    "answeredAt": "2024-01-25T09:25:00Z"
    }
  ],
  "errors": []
}
```

---

## 6. Submit Attempt

### 6.1 Submit Exam

Submit the exam attempt. This finalizes all answers and triggers grading.

**Endpoint:** `POST /Attempt/{attemptId}/submit`

**Example Request:**

```http
POST /api/Attempt/10/submit
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "attemptId": 10,
    "submittedAt": "2024-01-25T10:45:00Z",
 "status": 2,
  "statusName": "Submitted",
    "totalQuestions": 50,
    "answeredQuestions": 48,
    "message": "Attempt submitted successfully"
  },
  "errors": []
}
```

**Error Responses:**

```json
// Already submitted
{
  "success": false,
  "message": "Attempt has already been submitted",
  "data": null,
  "errors": []
}

// Time expired (late submission)
{
  "success": false,
  "message": "Attempt has expired. Your answers have been saved but late submission is not allowed.",
  "data": null,
  "errors": []
}

// Cancelled attempt
{
  "success": false,
  "message": "Attempt is Cancelled. Cannot submit.",
  "data": null,
  "errors": []
}
```

> **Auto-Submit Note:** Implement client-side auto-submit when timer reaches 0. The server will also auto-expire attempts that exceed their time limit.

---

## 7. View Results

### 7.1 Get My Result for an Attempt

View result after exam is graded and result is published.

**Endpoint:** `GET /ExamResult/my-result/{attemptId}`

**Example Request:**

```http
GET /api/ExamResult/my-result/10
Authorization: Bearer {token}
```

**Success Response (200) - When Results Published:**

```json
{
  "success": true,
"data": {
    "resultId": 5,
    "examId": 1,
    "examTitleEn": "IT Fundamentals Certification Exam",
    "examTitleAr": "?????? ????? ??????? ????? ?????????",
    "attemptNumber": 1,
    "totalScore": 85.0,
    "maxPossibleScore": 100.0,
    "passScore": 70.0,
    "percentage": 85.0,
  "isPassed": true,
    "gradeLabel": "A",
    "finalizedAt": "2024-01-25T11:30:00Z",
    "attemptStartedAt": "2024-01-25T09:00:00Z",
    "attemptSubmittedAt": "2024-01-25T10:45:00Z",
    "questionResults": [
      {
      "questionNumber": 1,
        "questionBodyEn": "What layer of the OSI model is responsible for routing?",
        "questionBodyAr": "?? ?? ???? ????? OSI ???????? ?? ????????",
        "pointsEarned": 2.0,
        "maxPoints": 2.0,
        "isCorrect": true,
        "feedback": null
      },
      {
    "questionNumber": 2,
        "questionBodyEn": "Which protocol operates at the Transport layer?",
        "questionBodyAr": "?? ???????? ???? ?? ???? ??????",
        "pointsEarned": 0.0,
        "maxPoints": 2.0,
  "isCorrect": false,
        "feedback": "The correct answer is TCP and UDP."
      }
    ]
  },
  "errors": []
}
```

> **Note:** The `questionResults` array is only included if the exam has `allowReview: true`. The feedback and correct answer information depends on `showCorrectAnswers` setting.

**Error - Result Not Published:**

```json
{
  "success": false,
  "message": "Result has not been published yet",
  "data": null,
  "errors": []
}
```

**Error - Result Not Ready:**

```json
{
  "success": false,
  "message": "Grading has not been completed for this attempt",
  "data": null,
  "errors": []
}
```

---

### 7.2 Get All My Results

Get all published results for the current candidate.

**Endpoint:** `GET /ExamResult/my-results`

**Example Request:**

```http
GET /api/ExamResult/my-results
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "resultId": 5,
      "examId": 1,
      "examTitleEn": "IT Fundamentals Certification Exam",
    "examTitleAr": "?????? ????? ??????? ????? ?????????",
      "attemptNumber": 1,
      "totalScore": 85.0,
      "maxPossibleScore": 100.0,
"passScore": 70.0,
      "percentage": 85.0,
      "isPassed": true,
      "gradeLabel": "A",
      "finalizedAt": "2024-01-25T11:30:00Z"
    },
    {
      "resultId": 8,
      "examId": 2,
      "examTitleEn": "Advanced Networking Exam",
      "examTitleAr": "?????? ??????? ????????",
      "attemptNumber": 2,
      "totalScore": 65.0,
   "maxPossibleScore": 100.0,
      "passScore": 70.0,
      "percentage": 65.0,
      "isPassed": false,
  "gradeLabel": "C",
      "finalizedAt": "2024-01-28T14:00:00Z"
    }
  ],
  "errors": []
}
```

---

## 8. Attempt History

### 8.1 Get My Attempts for an Exam

View all attempts for a specific exam.

**Endpoint:** `GET /Attempt/exam/{examId}/my-attempts`

**Example Request:**

```http
GET /api/Attempt/exam/1/my-attempts
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
    "id": 10,
   "examId": 1,
      "examTitleEn": "IT Fundamentals Certification Exam",
  "examTitleAr": "?????? ????? ??????? ????? ?????????",
      "candidateId": "user-123",
      "candidateName": "John Doe",
   "startedAt": "2024-01-25T09:00:00Z",
      "submittedAt": "2024-01-25T10:45:00Z",
      "status": 2,
    "statusName": "Submitted",
      "attemptNumber": 1,
      "totalScore": 85.0,
      "isPassed": true
    },
    {
      "id": 15,
      "examId": 1,
      "examTitleEn": "IT Fundamentals Certification Exam",
  "examTitleAr": "?????? ????? ??????? ????? ?????????",
      "candidateId": "user-123",
      "candidateName": "John Doe",
      "startedAt": "2024-01-26T14:00:00Z",
 "submittedAt": null,
      "status": 1,
      "statusName": "InProgress",
      "attemptNumber": 2,
 "totalScore": null,
      "isPassed": null
    }
  ],
  "errors": []
}
```

**Attempt Status Values:**

| Value | Name | Description |
|-------|------|-------------|
| 0 | Started | Attempt just started |
| 1 | InProgress | Candidate is answering questions |
| 2 | Submitted | Candidate submitted the attempt |
| 3 | Expired | Time ran out |
| 4 | Cancelled | Admin cancelled the attempt |

---

### 8.2 Get All My Attempts

Get all attempts across all exams with filtering.

**Endpoint:** `GET /Attempt/my-attempts`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `examId` | number | No | Filter by exam |
| `status` | number | No | Filter by status (0-4) |
| `startedFrom` | datetime | No | Filter by start date |
| `startedTo` | datetime | No | Filter by start date |
| `isPassed` | boolean | No | Filter by pass/fail |
| `pageNumber` | number | No | Page number |
| `pageSize` | number | No | Items per page |

**Example Request:**

```http
GET /api/Attempt/my-attempts?status=2&isPassed=true&pageNumber=1&pageSize=10
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
  {
        "id": 10,
        "examId": 1,
     "examTitleEn": "IT Fundamentals Certification Exam",
      "examTitleAr": "?????? ????? ??????? ????? ?????????",
      "startedAt": "2024-01-25T09:00:00Z",
        "submittedAt": "2024-01-25T10:45:00Z",
        "status": 2,
      "statusName": "Submitted",
        "attemptNumber": 1,
        "totalScore": 85.0,
        "isPassed": true
      }
],
  "pageNumber": 1,
    "pageSize": 10,
 "totalCount": 1,
    "totalPages": 1
  },
  "errors": []
}
```

---

## 9. Security Events Logging

### 9.1 Log Security Event

Log security-related events during exam (for proctoring purposes).

**Endpoint:** `POST /Attempt/{attemptId}/events`

**Request Body:**

```json
{
  "eventType": 1,
  "metadataJson": "{\"tabSwitchCount\": 3, \"timestamp\": \"2024-01-25T09:30:00Z\"}"
}
```

**Event Types:**

| Value | Name | Description |
|-------|------|-------------|
| 0 | Started | Exam started |
| 1 | TabSwitch | Candidate switched browser tabs |
| 2 | WindowBlur | Browser window lost focus |
| 3 | WindowFocus | Browser window regained focus |
| 4 | CopyAttempt | Candidate attempted to copy content |
| 5 | PasteAttempt | Candidate attempted to paste content |
| 6 | RightClickAttempt | Candidate right-clicked |
| 7 | AnswerSaved | Answer was saved |
| 8 | Submitted | Exam submitted |
| 9 | TimedOut | Time expired |

**Example - Log Tab Switch:**

```json
{
  "eventType": 1,
  "metadataJson": "{\"switchedTo\": \"unknown\", \"duration\": 5}"
}
```

**Example - Log Copy Attempt:**

```json
{
  "eventType": 4,
  "metadataJson": "{\"questionId\": 42, \"blocked\": true}"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": true,
  "message": "Event logged",
  "errors": []
}
```

---

## 10. TypeScript Interfaces

```typescript
// ============================================
// ENUMS
// ============================================

export enum AttemptStatus {
  Started = 0,
  InProgress = 1,
  Submitted = 2,
  Expired = 3,
  Cancelled = 4
}

export enum AttemptEventType {
  Started = 0,
  TabSwitch = 1,
  WindowBlur = 2,
  WindowFocus = 3,
  CopyAttempt = 4,
  PasteAttempt = 5,
  RightClickAttempt = 6,
  AnswerSaved = 7,
  Submitted = 8,
  TimedOut = 9
}

// ============================================
// ATTEMPT INTERFACES
// ============================================

export interface StartAttemptDto {
  examId: number;
  accessCode?: string;
}

export interface AttemptSessionDto {
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  examDescriptionEn: string | null;
  examDescriptionAr: string | null;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  status: AttemptStatus;
  attemptNumber: number;
  maxAttempts: number;
  questions: AttemptQuestionDto[];
  instructions: ExamInstructionForCandidateDto[];
}

export interface AttemptQuestionDto {
  attemptQuestionId: number;
  questionId: number;
  order: number;
  points: number;
  bodyEn: string;
  bodyAr: string;
  questionTypeName: string;
  questionTypeId: number;
  options: AttemptQuestionOptionDto[];
  attachments: AttemptQuestionAttachmentDto[];
  currentAnswer: AttemptAnswerDto | null;
}

export interface AttemptQuestionOptionDto {
  id: number;
  textEn: string;
  textAr: string;
  order: number;
  attachmentPath?: string;
}

export interface AttemptQuestionAttachmentDto {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string;
}

export interface ExamInstructionForCandidateDto {
  order: number;
  contentEn: string;
  contentAr: string;
}

// ============================================
// ANSWER INTERFACES
// ============================================

export interface AttemptAnswerDto {
  attemptAnswerId?: number;
  questionId: number;
  selectedOptionIds?: number[];
  textAnswer?: string;
  answeredAt?: string;
}

export interface SaveAnswerDto {
  questionId: number;
  selectedOptionIds?: number[];
  textAnswer?: string;
}

export interface BulkSaveAnswersDto {
  answers: SaveAnswerDto[];
}

export interface AnswerSavedDto {
  attemptAnswerId: number;
  questionId: number;
  answeredAt: string;
  success: boolean;
  message?: string;
}

// ============================================
// TIMER INTERFACE
// ============================================

export interface AttemptTimerDto {
  attemptId: number;
  serverTime: string;
  expiresAt: string;
  remainingSeconds: number;
  status: AttemptStatus;
  isExpired: boolean;
}

// ============================================
// SUBMIT INTERFACE
// ============================================

export interface AttemptSubmittedDto {
  attemptId: number;
  submittedAt: string;
  status: AttemptStatus;
  statusName: string;
  totalQuestions: number;
  answeredQuestions: number;
  message: string;
}

// ============================================
// ATTEMPT LIST INTERFACE
// ============================================

export interface AttemptListDto {
  id: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  startedAt: string;
  submittedAt: string | null;
  status: AttemptStatus;
  statusName: string;
  attemptNumber: number;
  totalScore: number | null;
  isPassed: boolean | null;
}

// ============================================
// RESULT INTERFACES
// ============================================

export interface CandidateResultDto {
  resultId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  attemptNumber: number;
  totalScore: number;
  maxPossibleScore: number;
  passScore: number;
  percentage: number;
  isPassed: boolean;
  gradeLabel?: string;
  finalizedAt: string;
  attemptStartedAt?: string;
  attemptSubmittedAt?: string;
  questionResults?: CandidateQuestionResultDto[];
}

export interface CandidateQuestionResultDto {
  questionNumber: number;
  questionBodyEn: string;
  questionBodyAr: string;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
  feedback?: string;
}

export interface CandidateExamSummaryDto {
  id: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  totalAttempts: number;
  maxAttempts: number;
  remainingAttempts: number;
  bestAttemptId?: number;
  bestScore?: number;
bestPercentage?: number;
  bestIsPassed?: boolean;
  latestScore?: number;
  latestIsPassed?: boolean;
  lastAttemptAt?: string;
}

// ============================================
// EVENT LOGGING INTERFACE
// ============================================

export interface LogAttemptEventDto {
  eventType: AttemptEventType;
  metadataJson?: string;
}
```

---

## 11. React Implementation Examples

### 11.1 Exam Taking Service

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://zoolker-003-site8.jtempurl.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const candidateExamService = {
  // Browse available exams
  async getAvailableExams(params: { search?: string; pageNumber?: number; pageSize?: number }) {
    const response = await apiClient.get('/Assessment/exams', {
      params: { ...params, isPublished: true, isActive: true }
    });
    return response.data;
  },

  // Get exam details
  async getExamDetails(examId: number) {
    const response = await apiClient.get(`/Assessment/exams/${examId}`);
    return response.data;
  },

  // Get my exam summary (attempts info)
  async getMyExamSummary(examId: number) {
    const response = await apiClient.get(`/ExamResult/my-summary/exam/${examId}`);
    return response.data;
  },

  // Start or resume attempt
  async startAttempt(examId: number, accessCode?: string) {
  const response = await apiClient.post('/Attempt/start', { examId, accessCode });
    return response.data;
  },

  // Get attempt session
  async getAttemptSession(attemptId: number) {
    const response = await apiClient.get(`/Attempt/${attemptId}/session`);
    return response.data;
  },

  // Get timer
  async getTimer(attemptId: number) {
    const response = await apiClient.get(`/Attempt/${attemptId}/timer`);
    return response.data;
  },

  // Save single answer
  async saveAnswer(attemptId: number, answer: SaveAnswerDto) {
    const response = await apiClient.post(`/Attempt/${attemptId}/answers`, answer);
return response.data;
  },

  // Bulk save answers
  async bulkSaveAnswers(attemptId: number, answers: SaveAnswerDto[]) {
    const response = await apiClient.post(`/Attempt/${attemptId}/answers/bulk`, { answers });
    return response.data;
  },

  // Submit attempt
  async submitAttempt(attemptId: number) {
    const response = await apiClient.post(`/Attempt/${attemptId}/submit`);
    return response.data;
  },

  // Log event
  async logEvent(attemptId: number, eventType: AttemptEventType, metadata?: object) {
 const response = await apiClient.post(`/Attempt/${attemptId}/events`, {
      eventType,
      metadataJson: metadata ? JSON.stringify(metadata) : null
    });
    return response.data;
  },

  // Get my result
  async getMyResult(attemptId: number) {
    const response = await apiClient.get(`/ExamResult/my-result/${attemptId}`);
    return response.data;
  },

  // Get all my results
  async getMyResults() {
    const response = await apiClient.get('/ExamResult/my-results');
    return response.data;
  },

  // Get my attempts for exam
  async getMyExamAttempts(examId: number) {
    const response = await apiClient.get(`/Attempt/exam/${examId}/my-attempts`);
 return response.data;
  },

  // Get all my attempts
  async getMyAttempts(params: { examId?: number; status?: number; pageNumber?: number; pageSize?: number }) {
    const response = await apiClient.get('/Attempt/my-attempts', { params });
    return response.data;
  }
};
```

### 11.2 Exam Timer Hook

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { candidateExamService } from './candidateExamService';

export function useExamTimer(attemptId: number, onExpire: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with server
  const syncTimer = useCallback(async () => {
    try {
      const response = await candidateExamService.getTimer(attemptId);
      if (response.success && response.data) {
        setRemainingSeconds(response.data.remainingSeconds);
        setServerTime(new Date(response.data.serverTime));
  
    if (response.data.isExpired) {
     setIsExpired(true);
          onExpire();
        }
      }
    } catch (error) {
      console.error('Failed to sync timer:', error);
    }
  }, [attemptId, onExpire]);

  // Initial sync and start countdown
  useEffect(() => {
    syncTimer();

    // Sync every 30 seconds
    syncIntervalRef.current = setInterval(syncTimer, 30000);

    // Countdown every second
    intervalRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
    setIsExpired(true);
  onExpire();
     return 0;
     }
  return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [syncTimer, onExpire]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    isExpired,
    isWarning: remainingSeconds <= 300 && remainingSeconds > 60, // Last 5 minutes
    isCritical: remainingSeconds <= 60, // Last minute
    syncTimer
  };
}
```

### 11.3 Security Event Logger Hook

```typescript
import { useEffect, useCallback, useRef } from 'react';
import { candidateExamService, AttemptEventType } from './candidateExamService';

export function useSecurityLogger(attemptId: number, enabled: boolean) {
  const tabSwitchCountRef = useRef(0);

  const logEvent = useCallback(async (eventType: AttemptEventType, metadata?: object) => {
    if (!enabled) return;
    
try {
      await candidateExamService.logEvent(attemptId, eventType, metadata);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [attemptId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Handle visibility change (tab switch)
 const handleVisibilityChange = () => {
   if (document.hidden) {
      tabSwitchCountRef.current++;
        logEvent(AttemptEventType.TabSwitch, { 
          count: tabSwitchCountRef.current,
 timestamp: new Date().toISOString()
});
   }
    };

    // Handle window blur
    const handleBlur = () => {
      logEvent(AttemptEventType.WindowBlur, {
        timestamp: new Date().toISOString()
      });
    };

    // Handle window focus
    const handleFocus = () => {
      logEvent(AttemptEventType.WindowFocus, {
 timestamp: new Date().toISOString()
});
    };

    // Handle copy attempt
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent(AttemptEventType.CopyAttempt, {
        blocked: true,
        timestamp: new Date().toISOString()
  });
    };

    // Handle paste attempt
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent(AttemptEventType.PasteAttempt, {
        blocked: true,
 timestamp: new Date().toISOString()
      });
    };

    // Handle right-click
  const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent(AttemptEventType.RightClickAttempt, {
        blocked: true,
   timestamp: new Date().toISOString()
      });
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('copy', handleCopy);
   document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
  };
  }, [enabled, logEvent]);

  return { logEvent, tabSwitchCount: tabSwitchCountRef.current };
}
```


---

## 12. Error Handling

### Common Error Responses

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (token invalid/missing) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Handling Example

```typescript
async function handleExamAction<T>(
  action: () => Promise<ApiResponse<T>>,
  onSuccess: (data: T) => void,
  onError: (message: string) => void
) {
  try {
    const response = await action();

    if (response.success && response.data) {
    onSuccess(response.data);
    } else {
      onError(response.message || 'An error occurred');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
// Redirect to login
    window.location.href = '/login';
        return;
      }

      const message = error.response?.data?.message || 'Network error';
    onError(message);
    } else {
   onError('An unexpected error occurred');
  }
  }
}

// Usage
await handleExamAction(
  () => candidateExamService.submitAttempt(attemptId),
  (data) => {
    toast.success('Exam submitted successfully!');
    navigate('/results');
  },
  (message) => {
    toast.error(message);
  }
);
```

---

## Quick Reference: All Candidate Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Browse Exams** | GET | `/Assessment/exams?isPublished=true&isActive=true` | List available exams |
| | GET | `/Assessment/exams/{id}` | Get exam details |
| | GET | `/ExamResult/my-summary/exam/{examId}` | Get my exam summary |
| **Attempt** | POST | `/Attempt/start` | Start or resume attempt |
| | GET | `/Attempt/{attemptId}/session` | Get attempt session |
| | GET | `/Attempt/{attemptId}/timer` | Get timer status |
| | POST | `/Attempt/{attemptId}/submit` | Submit attempt |
| **Answers** | POST | `/Attempt/{attemptId}/answers` | Save single answer |
| | POST | `/Attempt/{attemptId}/answers/bulk` | Bulk save answers |
| | GET | `/Attempt/{attemptId}/answers` | Get current answers |
| **Events** | POST | `/Attempt/{attemptId}/events` | Log security event |
| **Results** | GET | `/ExamResult/my-result/{attemptId}` | Get my result |
| | GET | `/ExamResult/my-results` | Get all my results |
| **History** | GET | `/Attempt/exam/{examId}/my-attempts` | Get my exam attempts |
| | GET | `/Attempt/my-attempts` | Get all my attempts |

---

## Contact

For questions or issues, contact the backend team.

**Last Updated:** January 2024
**API Version:** v1
