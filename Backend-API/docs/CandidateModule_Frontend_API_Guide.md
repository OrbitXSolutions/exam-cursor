# Candidate Exam Module - Frontend API Guide

## Overview

This document provides a comprehensive guide for frontend developers to integrate the Candidate Exam Module. This module provides **safe DTOs** that never expose correct answers, answer keys, or `IsCorrect` flags to candidates during exam attempts.

---

## Key Principles

### Security & Safety
1. **NO correct answers exposed during exam attempts**
2. **NO IsCorrect flags in question options**
3. **NO answer keys or model answers during attempts**
4. **Respects exam settings** for result visibility and review

### Exam Settings Control
The system respects three key exam settings:
- `ShowResults`: Controls whether scores are shown after submission
- `AllowReview`: Controls whether candidate can review their answers
- `ShowCorrectAnswers`: Controls whether correct answers are shown during review (requires `AllowReview=true`)

---

## Authentication

All endpoints require authentication with JWT Bearer token.

### Header Required
```
Authorization: Bearer {your_jwt_token}
```

### Role Required
Most endpoints require the user to be in the **`Candidate`** role.

---

## API Endpoints

### Base URL
```
/api/Candidate
```

---

## 1. Exam Discovery

### 1.1 Get Available Exams

Get all published and active exams available to the candidate.

**Department Filtering Logic:**
- If user is in `Candidate` role and has **no department** ? Lists **all exams** (no filter)
- If user is in `Candidate` role and **has a department** ? Lists **all exams** (candidates can take any exam)
- If user is **NOT** in `Candidate` role ? Filters by **user's department only**

**Endpoint:**
```http
GET /api/Candidate/exams
```

**Request:**
No body required.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 1,
   "examType": 0,  // 0 = Flex, 1 = Fixed
      "titleEn": "Mathematics Final Exam",
      "titleAr": "???????? ??????? ?????????",
      "descriptionEn": "Comprehensive math exam",
      "descriptionAr": "?????? ??????? ????",
      "startAt": "2024-01-15T08:00:00Z",
      "endAt": "2024-01-15T12:00:00Z",
    "durationMinutes": 120,
      "maxAttempts": 3,
      "passScore": 70.00,
      "totalQuestions": 50,
   "totalPoints": 100.00,
      "myAttempts": 1,
      "myBestIsPassed": false
    }
  ],
  "errors": null
}
```

**Fields:**
- `examType`: `0` = Flex (start anytime), `1` = Fixed (must start at exact time)
- `myAttempts`: Number of attempts candidate has made (null if none)
- `myBestIsPassed`: Whether candidate's best attempt passed (null if no attempts)

---

### 1.2 Get Exam Preview

Get detailed exam information before starting, including eligibility check.

**Endpoint:**
```http
GET /api/Candidate/exams/{examId}/preview
```

**Path Parameters:**
- `examId` (int): Exam ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "examId": 1,
    "examType": 0,
    "titleEn": "Mathematics Final Exam",
    "titleAr": "???????? ??????? ?????????",
    "descriptionEn": "Comprehensive math exam",
    "descriptionAr": "?????? ??????? ????",
    "startAt": "2024-01-15T08:00:00Z",
    "endAt": "2024-01-15T12:00:00Z",
    "durationMinutes": 120,
    "maxAttempts": 3,
    "totalQuestions": 50,
    "totalPoints": 100.00,
    "passScore": 70.00,
    "instructions": [
    {
        "order": 1,
   "contentEn": "Read all questions carefully",
     "contentAr": "???? ???? ??????? ??????"
      }
    ],
    "accessPolicy": {
      "requiresAccessCode": true,
      "requireProctoring": false,
      "requireIdVerification": true,
      "requireWebcam": true,
      "preventCopyPaste": true,
      "preventScreenCapture": true,
      "requireFullscreen": true,
      "browserLockdown": false
    },
    "eligibility": {
      "canStartNow": true,
      "reasons": [],
      "attemptsUsed": 1,
      "attemptsRemaining": 2
    }
  }
}
```

**Eligibility Reasons (if `canStartNow = false`):**
- "Exam starts at {date} UTC"
- "Exam ended at {date} UTC"
- "Maximum attempts (3) reached"
- "You have an active attempt in progress"

---

## 2. Start & Resume Exam

### 2.1 Start Exam

Start a new attempt or resume an existing active attempt.

**Endpoint:**
```http
POST /api/Candidate/exams/{examId}/start
```

**Path Parameters:**
- `examId` (int): Exam ID

**Request Body:**
```json
{
  "accessCode": "ABC123"  // optional, only if exam requires it
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Exam started successfully",
  "data": {
    "attemptId": 42,
    "examId": 1,
    "examTitleEn": "Mathematics Final Exam",
    "examTitleAr": "???????? ??????? ?????????",
    "startedAtUtc": "2024-01-15T09:30:00Z",
    "expiresAtUtc": "2024-01-15T11:30:00Z",
 "remainingSeconds": 7200,
    "status": 0,  // 0=Started
    "attemptNumber": 2,
    "maxAttempts": 3,
    "totalQuestions": 50,
    "answeredQuestions": 0,
    "examSettings": {
      "shuffleQuestions": true,
   "shuffleOptions": true,
      "lockPreviousSections": true,
      "preventBackNavigation": false
    },
    "sections": [
   {
        "sectionId": 1,
        "order": 1,
        "titleEn": "Section 1: Algebra",
    "titleAr": "????? ?????: ?????",
        "descriptionEn": "Questions about algebraic expressions",
        "descriptionAr": "????? ??? ????????? ???????",
        "durationMinutes": 40,
        "remainingSeconds": 2400,
      "sectionStartedAtUtc": "2024-01-15T09:30:00Z",
    "sectionExpiresAtUtc": "2024-01-15T10:10:00Z",
        "totalPoints": 40.00,
     "totalQuestions": 20,
        "answeredQuestions": 0,
        "topics": [
          {
"topicId": 1,
   "order": 1,
            "titleEn": "Linear Equations",
            "titleAr": "????????? ??????",
         "descriptionEn": null,
   "descriptionAr": null,
      "totalPoints": 20.00,
    "totalQuestions": 10,
  "answeredQuestions": 0,
            "questions": [
     {
                "attemptQuestionId": 101,
 "questionId": 10,
       "order": 1,
     "points": 2.00,
          "bodyEn": "Solve for x: 2x + 4 = 10",
        "bodyAr": "???? ???? x: 2x + 4 = 10",
     "questionTypeName": "Short Answer",
             "questionTypeId": 4,
        "sectionId": 1,
"topicId": 1,
                "options": [],
            "attachments": [],
       "currentAnswer": null
         }
         ]
          }
        ],
      "questions": [
      {
     "attemptQuestionId": 111,
        "questionId": 20,
         "order": 11,
            "points": 2.00,
 "bodyEn": "What is 2 + 2?",
  "bodyAr": "?? ?? 2 + 2?",
    "questionTypeName": "MCQ Single Choice",
            "questionTypeId": 1,
         "sectionId": 1,
            "topicId": null,
            "options": [
   {
         "id": 40,
              "textEn": "3",
          "textAr": "?",
         "order": 1,
                "attachmentPath": null
            },
      {
       "id": 41,
      "textEn": "4",
      "textAr": "?",
   "order": 2,
    "attachmentPath": null
     }
      ],
      "attachments": [],
         "currentAnswer": null
          }
        ]
      },
      {
   "sectionId": 2,
  "order": 2,
        "titleEn": "Section 2: Geometry",
        "titleAr": "????? ??????: ???????",
        "descriptionEn": "Questions about shapes and angles",
  "descriptionAr": "????? ??? ??????? ????????",
        "durationMinutes": 40,
 "remainingSeconds": null,
 "sectionStartedAtUtc": null,
        "sectionExpiresAtUtc": null,
        "totalPoints": 40.00,
        "totalQuestions": 20,
  "answeredQuestions": 0,
        "topics": [],
        "questions": []
      }
    ],
    "questions": [
      // Flat list of ALL questions for backward compatibility
      // Same structure as questions nested in sections/topics
    ],
"instructions": [
   {
        "order": 1,
        "contentEn": "Read all questions carefully",
        "contentAr": "???? ???? ??????? ??????"
      }
    ]
  }
}
```

**Important Notes:**
- **Questions do NOT include `isCorrect` in options** - Security measure
- **Sections are displayed as TABS** - Each section should be a separate tab
- **Section-level timing** - If `durationMinutes` is set on a section, show a separate timer
- **Auto-switch sections** - When section time expires, auto-switch to next section
- **Lock previous sections** - If `examSettings.lockPreviousSections` is true, disable navigation to previous sections after time expires
- **Shuffle** - Questions and options are already shuffled by the server if enabled
- **If resuming:** Will return existing active attempt with `currentAnswer` populated

### 2.1.1 Frontend Structure Guide

**Tab-Based Layout:**
```
???????????????????????????????????????????????????????????
?  [Section 1: Algebra ?? 38:45]  |  [Section 2: Geometry]  ?
???????????????????????????????????????????????????????????
?    ?
?  ?? Topic: Linear Equations (10 questions)    ?
?  ???????????????????????????????????????????????????   ?
?  ? Q1. Solve for x: 2x + 4 = 10     ? ?
?  ? Answer: [______________]       ?   ?
?  ???????????????????????????????????????????????????   ?
?    ?
?  ?? Section Questions (not in any topic)          ?
?  ???????????????????????????????????????????????????   ?
?  ? Q11. What is 2 + 2?    ?   ?
?  ? ? 3  ? 4  ? 5  ? 6           ?   ?
?  ???????????????????????????????????????????????????   ?
?     ?
?     [? Previous][Next ?]  [Submit Exam]        ?
???????????????????????????????????????????????????????????
```

**Timer Logic:**
1. **Exam-level timer**: Use `remainingSeconds` and `expiresAtUtc` for overall exam time
2. **Section-level timer**: If `section.durationMinutes` is set, use `section.remainingSeconds`
3. **When section time expires**:
   - Auto-save any unsaved answers
   - Switch to next section
   - Disable "Previous" navigation for expired section
   - Show notification to user

**Question Type Handling:**
| `questionTypeId` | `questionTypeName` | UI Component |
|------------------|-------------------|--------------|
| 1 | MCQ Single Choice | Radio buttons |
| 2 | MCQ Multiple Choice | Checkboxes |
| 3 | True/False | Radio buttons (2 options) |
| 4 | Short Answer | Text input |
| 5 | Essay | Textarea |

---

### 2.2 Get Attempt Session (Resume)

Get current attempt session - single source of truth for resuming.

**Endpoint:**
```http
GET /api/Candidate/attempts/{attemptId}/session
```

**Path Parameters:**
- `attemptId` (int): Attempt ID

**Response:** `200 OK`
Same structure as Start Exam response, but includes all current answers.

**Use Case:**
- Page refresh recovery
- Browser close/reopen recovery
- Network reconnection

---

## 3. Save Answers

### 3.1 Bulk Save Answers (Recommended)

Save multiple answers at once - **idempotent** (can call multiple times).

**Endpoint:**
```http
PUT /api/Candidate/attempts/{attemptId}/answers
```

**Path Parameters:**
- `attemptId` (int): Attempt ID

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": 10,
      "selectedOptionIds": [41],  // for MCQ
      "textAnswer": null
    },
    {
      "questionId": 11,
      "selectedOptionIds": [45, 46],  // for multiple-choice MCQ
      "textAnswer": null
    },
    {
      "questionId": 12,
      "selectedOptionIds": null,
   "textAnswer": "The capital is Paris"  // for short answer/essay
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Answers saved successfully",
  "data": true
}
```

**Recommended Strategy:**
- Auto-save answers every 30-60 seconds
- Debounce answer changes before saving
- Display save status indicator to user
- Save when switching between sections

---

## 4. Submit Attempt

### 4.1 Submit Attempt

Final submission - cannot be undone.

**Endpoint:**
```http
POST /api/Candidate/attempts/{attemptId}/submit
```

**Path Parameters:**
- `attemptId` (int): Attempt ID

**Request:**
No body required.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Attempt submitted successfully. Results will be available after grading.",
  "data": {
 "resultId": 0,
    "examId": 1,
    "examTitleEn": "Mathematics Final Exam",
    "examTitleAr": "???????? ??????? ?????????",
    "attemptNumber": 2,
    "submittedAt": "2024-01-15T11:25:00Z",
    "totalScore": null,
  "maxPossibleScore": null,
 "percentage": null,
    "isPassed": null,
    "gradeLabel": null,
"allowReview": false,
    "showCorrectAnswers": false
  }
}
```

**Conditional Fields:**
- If `exam.showResults = false`: All score fields are `null`
- If `exam.showResults = true`: Scores shown after grading completes

---

## 5. Results & Review

### 5.1 Get My Result

Get result summary for a specific attempt.

**Endpoint:**
```http
GET /api/Candidate/results/my-result/{attemptId}
```

**Path Parameters:**
- `attemptId` (int): Attempt ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "resultId": 15,
    "examId": 1,
    "examTitleEn": "Mathematics Final Exam",
    "examTitleAr": "???????? ??????? ?????????",
    "attemptNumber": 2,
    "submittedAt": "2024-01-15T11:25:00Z",
    "totalScore": 85.00,
    "maxPossibleScore": 100.00,
 "percentage": 85.00,
    "isPassed": true,
 "gradeLabel": "B",
"allowReview": true,
    "showCorrectAnswers": false
  }
}
```

**Error Cases:**
- `404`: Result not found or not yet graded
- `403`: Result not published to candidate

---

### 5.2 Get My Result Review (Detailed)

Get detailed review with questions and answers.

**Endpoint:**
```http
GET /api/Candidate/results/my-result/{attemptId}/review
```

**Path Parameters:**
- `attemptId` (int): Attempt ID

**Prerequisites:**
- `exam.allowReview` must be `true`
- Result must be published

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
  "resultId": 15,
    "examId": 1,
    "examTitleEn": "Mathematics Final Exam",
    "examTitleAr": "???????? ??????? ?????????",
    "attemptNumber": 2,
    "submittedAt": "2024-01-15T11:25:00Z",
    "totalScore": 85.00,
    "maxPossibleScore": 100.00,
    "percentage": 85.00,
    "isPassed": true,
    "gradeLabel": "B",
  "questions": [
      {
   "questionId": 10,
        "order": 1,
        "bodyEn": "What is 2 + 2?",
    "bodyAr": "?? ?? 2 + 2?",
        "questionTypeName": "MCQ Single Choice",
        "points": 2.00,
        "scoreEarned": 2.00,
        "selectedOptionIds": [41],
        "textAnswer": null,
        "options": [
     {
            "id": 40,
            "textEn": "3",
            "textAr": "?",
     "wasSelected": false,
            "isCorrect": false
          },
 {
            "id": 41,
   "textEn": "4",
    "textAr": "?",
         "wasSelected": true,
            "isCorrect": true
 }
        ],
        "isCorrect": true,
        "feedback": "Correct!"
      }
    ]
  }
}
```

**Conditional Fields:**
- If `exam.showCorrectAnswers = false`:
  - `options[].isCorrect` = `null`
- `question.isCorrect` = `null`
  - `question.feedback` = `null`
- If `exam.showCorrectAnswers = true`:
  - All correctness indicators are shown

**Error Cases:**
- `403`: Review not allowed (`exam.allowReview = false`)
- `404`: Result not found or not published

---

## 6. Dashboard

### 6.1 Get Dashboard

Get comprehensive dashboard with all statistics and information for the candidate.

**Endpoint:**
```http
GET /api/Candidate/dashboard
```

**Request:**
No body required.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "candidateName": "Ali Mahmoud",
    "candidateEmail": "ali@example.com",
    "currentDateUtc": "2026-01-18T10:30:00Z",
    "stats": {
   "totalExamsAvailable": 12,
  "totalExamsAvailableChangePercent": 12,
    "totalAttempts": 156,
      "totalAttemptsChangePercent": 8,
      "passRate": 72.5,
      "pendingGrading": 8
    },
    "examsByStatus": {
      "upcomingCount": 5,
      "activeCount": 2,
      "completedCount": 10
    },
    "quickActions": [
      {
        "attemptId": 42,
        "examId": 5,
        "examTitleEn": "Physics Midterm",
     "examTitleAr": "?????? ??? ????? - ????????",
        "actionType": "Resume",
        "expiresAt": "2026-01-18T12:00:00Z",
     "remainingMinutes": 85
      }
    ],
    "upcomingExams": [
    {
     "examId": 8,
      "titleEn": "Chemistry Final",
 "titleAr": "???????? ??????? - ????????",
        "examType": 0,
        "startAt": "2026-01-20T09:00:00Z",
        "endAt": "2026-01-20T13:00:00Z",
 "durationMinutes": 120,
     "totalQuestions": 40,
        "totalPoints": 80.00,
        "attemptsUsed": 0,
        "maxAttempts": 3
      }
    ],
    "recentActivity": [
      {
        "activityType": "Result Published",
     "examId": 3,
        "examTitleEn": "Mathematics Quiz",
        "examTitleAr": "?????? ?????????",
      "attemptId": 35,
        "activityDate": "2026-01-17T14:30:00Z",
        "description": "Passed",
      "score": 85.00,
        "isPassed": true
      },
      {
        "activityType": "Attempt Submitted",
        "examId": 4,
    "examTitleEn": "English Exam",
        "examTitleAr": "?????? ????? ??????????",
    "attemptId": 40,
        "activityDate": "2026-01-16T11:20:00Z",
 "description": "Attempt #2 submitted",
    "score": null,
        "isPassed": null
      },
      {
        "activityType": "Attempt Started",
        "examId": 5,
  "examTitleEn": "Physics Midterm",
        "examTitleAr": "?????? ??? ????? - ????????",
        "attemptId": 42,
        "activityDate": "2026-01-18T10:15:00Z",
        "description": "Attempt #1 in progress",
        "score": null,
        "isPassed": null
      }
    ]
  }
}
```

**Dashboard Data Structure:**

#### Statistics Cards (`stats`)
- `totalExamsAvailable`: Total number of published & active exams
- `totalExamsAvailableChangePercent`: Percentage change (e.g., +12%)
- `totalAttempts`: Total attempts made by candidate
- `totalAttemptsChangePercent`: Percentage change (e.g., +8%)
- `passRate`: Overall pass rate percentage (72.5%)
- `pendingGrading`: Number of submitted attempts awaiting grading

#### Exams by Status (`examsByStatus`)
- `upcomingCount`: Exams not started yet
- `activeCount`: Exams with active attempts (in progress)
- `completedCount`: Exams with at least one completed attempt

#### Quick Actions (`quickActions`)
- Lists active attempts that can be resumed
- Shows remaining time for each active attempt
- `actionType`: Always "Resume" for active attempts

#### Upcoming Exams (`upcomingExams`)
- Lists next 5 upcoming exams
- Ordered by start date
- Shows attempts used and remaining

#### Recent Activity (`recentActivity`)
- Last 10 activities
- Types: "Attempt Started", "Attempt Submitted", "Result Published"
- Ordered by most recent first

---

## 7. Response Data Structures

### 7.1 Exam Types
- `0` = **Flex Time**: Candidate can start exam anytime within the exam period
- `1` = **Fixed Time**: Candidate must start at the exact start time

### 7.2 Attempt Status
- `0` = **Started**: Attempt created but not yet in progress
- `1` = **InProgress**: Candidate is actively taking the exam
- `2` = **Submitted**: Attempt completed and submitted
- `3` = **Expired**: Time limit exceeded before submission

### 7.3 Question Types
Common question type IDs:
- `1` = MCQ Single Choice
- `2` = MCQ Multiple Choice
- `3` = True/False
- `4` = Short Answer
- `5` = Essay

### 7.4 Activity Types
- `"Attempt Started"` - Candidate started taking an exam
- `"Attempt Submitted"` - Candidate submitted an exam attempt
- `"Result Published"` - Exam result was graded and published

### 7.5 Exam Settings (New)
```typescript
interface ExamSettings {
  shuffleQuestions: boolean;      // Questions randomized by server
  shuffleOptions: boolean;        // Options randomized by server
  lockPreviousSections: boolean;  // Disable back navigation after section expires
  preventBackNavigation: boolean; // Disable back navigation always
}
```

### 7.6 Section Structure (New)
```typescript
interface Section {
  sectionId: number;
  order: number;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  durationMinutes?: number;       // Section-specific timer (optional)
  remainingSeconds?: number;      // Calculated remaining time
  sectionStartedAtUtc?: string;   // When section timer started
  sectionExpiresAtUtc?: string; // When section timer expires
  totalPoints: number;
  totalQuestions: number;
  answeredQuestions: number;
  topics: Topic[];  // Optional topic groupings
  questions: Question[];   // Questions directly under section
}
```

### 7.7 Topic Structure (New)
```typescript
interface Topic {
  topicId: number;
  order: number;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  totalPoints: number;
  totalQuestions: number;
  answeredQuestions: number;
  questions: Question[];
}
```

---

## 8. Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": [
    "Detailed error message 1",
    "Detailed error message 2"
  ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (not allowed to access resource)
- `404` - Not Found
- `500` - Internal Server Error

---

## 9. Testing Checklist

### Dashboard
- [ ] Dashboard loads with all sections
- [ ] Statistics cards show correct counts
- [ ] Change percentages display correctly (+12%, +8%)
- [ ] Pass rate shows as percentage (72.5%)
- [ ] Exams by status counts are accurate
- [ ] Quick actions show only active attempts
- [ ] Resume buttons work for active attempts
- [ ] Remaining time displays correctly
- [ ] Upcoming exams list shows next exams
- [ ] Recent activity shows in chronological order
- [ ] Activity icons and colors are correct

### Exam Discovery
- [ ] Available exams list loads
- [ ] Exam preview shows all details
- [ ] Eligibility check works correctly
- [ ] Department filtering works as expected

### Exam Start
- [ ] Can start new attempt
- [ ] Can resume existing attempt
- [ ] Access code validation works (if required)
- [ ] Timer countdown works correctly
- [ ] Questions load without isCorrect flags

### During Exam (Section/Topic Structure)
- [ ] **Sections display as tabs**
- [ ] **Section timer shows when durationMinutes is set**
- [ ] **Auto-switch to next section when time expires**
- [ ] **Previous section tab disabled after time expires**
- [ ] **Topics display as collapsible groups within sections**
- [ ] **Questions within topics display correctly**
- [ ] **Questions directly under section (no topic) display correctly**
- [ ] Can view questions
- [ ] Can select answers (MCQ)
- [ ] Can enter text answers
- [ ] Auto-save works
- [ ] Manual save works
- [ ] Timer shows remaining time
- [ ] Can navigate between questions

### Submit
- [ ] Can submit attempt
- [ ] Confirmation dialog shown
- [ ] Cannot submit twice
- [ ] Redirect to results page

### Results
- [ ] Result summary shows correctly
- [ ] Scores shown/hidden based on exam settings
- [ ] Review allowed/denied based on exam settings
- [ ] Correct answers shown/hidden based on settings

---

## 10. Security Notes

### What is NEVER exposed to candidates:
- ? Correct answer flags during attempt (`isCorrect` in options)
- ? Answer keys before submission
- ? Model answers during attempt
- ? Scores before exam settings allow it
- ? Other candidates' answers or scores

### What is conditionally exposed:
- ?? Scores - Only if `exam.showResults = true`
- ?? Review - Only if `exam.allowReview = true`
- ?? Correct answers - Only if `exam.showCorrectAnswers = true` AND `exam.allowReview = true`

### Token Security:
- Store JWT securely (httpOnly cookies or secure storage)
- Include token in Authorization header for all requests
- Handle 401 responses by redirecting to login
- Refresh tokens before expiry

---

## 11. Summary

### API Endpoints Quick Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/Candidate/dashboard` | GET | Get complete dashboard | ? Candidate |
| `/api/Candidate/exams` | GET | List available exams | ? Candidate |
| `/api/Candidate/exams/{id}/preview` | GET | Preview exam | ? Candidate |
| `/api/Candidate/exams/{id}/start` | POST | Start exam | ? Candidate |
| `/api/Candidate/attempts/{id}/session` | GET | Get session (resume) | ? Candidate |
| `/api/Candidate/attempts/{id}/answers` | PUT | Save answers (bulk) | ? Candidate |
| `/api/Candidate/attempts/{id}/submit` | POST | Submit attempt | ? Candidate |
| `/api/Candidate/results/my-result/{id}` | GET | Get result summary | ? Candidate |
| `/api/Candidate/results/my-result/{id}/review` | GET | Get detailed review | ? Candidate |

### Key Differences from Admin APIs
- **No sensitive data**: Admin APIs include correct answers, statistics, etc.
- **Filtered results**: Candidates only see their own data
- **Conditional data**: Results depend on exam settings
- **Time-based access**: Fixed-time exams enforce timing
- **Safety first**: All DTOs designed to prevent cheating

---

## 12. Frontend Implementation Guide

### 12.1 Section-Based Exam Structure

The exam is organized hierarchically:
```
Exam
??? Section 1 (Tab 1) - with optional timer
?   ??? Topic A (collapsible group)
?   ? ??? Question 1
?   ?   ??? Question 2
?   ??? Topic B
?   ?   ??? Question 3
?   ??? Questions not in any topic
?       ??? Question 4
?  ??? Question 5
??? Section 2 (Tab 2) - with optional timer
?   ??? Questions
??? Section 3 (Tab 3)
    ??? Questions
```

### 12.2 Timer Implementation

**Exam-Level Timer:**
```javascript
// Overall exam timer
const examTimer = {
  expiresAt: response.data.expiresAtUtc,
  remainingSeconds: response.data.remainingSeconds
};
```

**Section-Level Timer (when applicable):**
```javascript
// Per-section timer (only if section.durationMinutes is set)
const sectionTimer = {
  sectionId: section.sectionId,
  expiresAt: section.sectionExpiresAtUtc,
  remainingSeconds: section.remainingSeconds,
  hasTimer: !!section.durationMinutes
};
```

### 12.3 Navigation Rules

```javascript
// Check if can navigate to previous section
function canNavigateToPreviousSection(currentSectionIndex, sections, examSettings) {
  // If exam prevents back navigation
  if (examSettings.preventBackNavigation) return false;
  
  // If lock previous sections is enabled
  if (examSettings.lockPreviousSections) {
  const previousSection = sections[currentSectionIndex - 1];
    // Check if previous section's time has expired
    if (previousSection?.sectionExpiresAtUtc) {
      return new Date() < new Date(previousSection.sectionExpiresAtUtc);
    }
  }
  
  return currentSectionIndex > 0;
}
```

### 12.4 Auto-Save Strategy

```javascript
// Auto-save configuration
const autoSaveConfig = {
  debounceMs: 2000,      // Wait 2s after last change
  intervalMs: 30000,   // Also save every 30s
  onSectionSwitch: true  // Save when switching sections
};
