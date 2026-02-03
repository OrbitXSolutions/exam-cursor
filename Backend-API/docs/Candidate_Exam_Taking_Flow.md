# Candidate Exam Taking Flow - Section-Based Exams

## Overview

This document explains how to implement a **section-based exam interface** where:
- Each section is displayed as a **tab**
- Each section has its **own timer** (optional `DurationMinutes`)
- Topics are displayed under sections (if they exist)
- Questions are displayed under topics/sections
- Questions and options can be **randomized**
- When section time expires, the frontend **automatically switches to the next section**
- **Previous section button is disabled** after moving forward

---

## ?? API Endpoint to Get Exam Structure

### **Endpoint: Start/Resume Exam**

```
POST /api/Candidate/exams/{examId}/start
```

This endpoint returns the **complete exam structure** including:
- ? All sections (ordered)
- ? Section-level durations (if set)
- ? Topics under each section (if exist)
- ? All questions with options
- ? Questions already randomized (if `shuffleQuestions: true`)
- ? Options already randomized (if `shuffleOptions: true`)
- ? Current answers (if resuming)

---

## ?? Get Available Exams

### **Endpoint: List Exams**

```
GET /api/Candidate/exams
```

Returns all published and active exams available to the candidate, including:
- `myAttempts`: Number of attempts the candidate has made (null if no attempts)
- `myBestIsPassed`: Whether the candidate's best attempt passed (null if no attempts)

### **Response Example**

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": 1,
      "examType": 0,
      "titleEn": "IT Fundamentals Certification Exam",
    "titleAr": "?????? ????? ??????? ????? ?????????",
   "descriptionEn": "Comprehensive IT exam",
   "descriptionAr": "?????? ????? ??????? ????",
      "startAt": null,
      "endAt": null,
      "durationMinutes": 60,
  "maxAttempts": 7,
   "passScore": 25,
      "totalQuestions": 6,
      "totalPoints": 30,
      "myAttempts": 2,    // ? Candidate has taken this exam 2 times
      "myBestIsPassed": true     // ? Candidate has passed at least once
    },
    {
      "id": 2,
      "examType": 1,
      "titleEn": "Mathematics Final Exam",
      "titleAr": "???????? ??????? ?????????",
 "descriptionEn": null,
      "descriptionAr": null,
      "startAt": "2024-02-01T09:00:00Z",
      "endAt": "2024-02-28T17:00:00Z",
      "durationMinutes": 120,
      "maxAttempts": 3,
      "passScore": 70,
      "totalQuestions": 50,
      "totalPoints": 100,
      "myAttempts": null,     // ? Candidate has NOT taken this exam
      "myBestIsPassed": null     // ? null because no attempts
  }
  ],
  "errors": null
}
```

### **Field Definitions**

| Field | Type | Description |
|-------|------|-------------|
| `myAttempts` | `int?` | Number of attempts made by the current candidate. `null` if no attempts. |
| `myBestIsPassed` | `bool?` | `true` if candidate passed at least once, `false` if all attempts failed, `null` if no attempts or no graded results. |

### **Frontend Usage**

```typescript
// Display exam card with attempt info
const ExamCard = ({ exam }) => {
  const hasAttempts = exam.myAttempts !== null;
  const hasPassed = exam.myBestIsPassed === true;
  
  return (
    <div className="exam-card">
      <h3>{exam.titleEn}</h3>
      <p>Duration: {exam.durationMinutes} minutes</p>
      <p>Questions: {exam.totalQuestions}</p>
  <p>Pass Score: {exam.passScore}%</p>
  
      {hasAttempts ? (
        <div className="attempt-info">
 <span>Attempts: {exam.myAttempts} / {exam.maxAttempts || '?'}</span>
        {hasPassed ? (
   <span className="passed">? Passed</span>
    ) : (
      <span className="not-passed">? Not Passed Yet</span>
 )}
      </div>
      ) : (
        <div className="no-attempts">
          <span>Not attempted yet</span>
        </div>
      )}
    </div>
  );
};
```

---

## ?? Response Structure

### **Complete Response Example**

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
    "status": 0,
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
  "titleEn": "Section 1: Multiple Choice",
        "titleAr": "????? ?????: ?????? ?? ?????",
        "descriptionEn": "Answer all questions in this section",
        "descriptionAr": "??? ??? ???? ??????? ?? ??? ?????",
        "order": 1,
    "durationMinutes": 30,
        "remainingSeconds": 1800,
 "sectionStartedAtUtc": "2024-01-15T09:30:00Z",
        "sectionExpiresAtUtc": "2024-01-15T10:00:00Z",
        "totalQuestions": 20,
        "totalPoints": 40.0,
    "answeredQuestions": 0,
        "topics": [
   {
          "topicId": 1,
      "titleEn": "Algebra",
          "titleAr": "?????",
            "order": 1,
   "totalQuestions": 10,
       "totalPoints": 20.0,
          "answeredQuestions": 0,
            "questions": [
      {
        "attemptQuestionId": 101,
      "questionId": 10,
       "sectionId": 1,
       "topicId": 1,
       "order": 1,
       "points": 2.00,
         "bodyEn": "What is 2 + 2?",
       "bodyAr": "?? ?? 2 + 2?",
       "questionTypeName": "MCQ Single Choice",
          "questionTypeId": 1,
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
   }
    ],
      "questions": []
      },
      {
        "sectionId": 2,
    "titleEn": "Section 2: Essay Questions",
      "titleAr": "????? ??????: ????? ??????",
     "order": 2,
        "durationMinutes": 45,
        "remainingSeconds": null,
        "sectionStartedAtUtc": null,
 "sectionExpiresAtUtc": null,
        "totalQuestions": 10,
        "totalPoints": 30.0,
        "answeredQuestions": 0,
        "topics": [],
  "questions": []
   }
    ],
    "questions": [],
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

---

## ?? Timer Logic

### **Two Timer Types:**

1. **Overall Exam Timer** (`expiresAtUtc` - `currentTime`)
   - Counts down the total exam time
   - When this expires, exam is auto-submitted

2. **Section Timer** (`section.durationMinutes`)
   - Optional: Only if section has `durationMinutes` set
   - Counts down section-specific time
   - When expires, automatically moves to next section
   - **Previous button is disabled** (can't go back)

### **Timer Priority:**

- If **section timer expires first** ? Auto-advance to next section
- If **exam timer expires first** ? Auto-submit entire exam
- Whichever expires first takes precedence

---

## ?? Navigation Rules

| Action | Allowed? | Notes |
|--------|----------|-------|
| Go to **next section** | ? Yes | Anytime (saves current answers) |
| Go to **previous section** | ? No | Always disabled |
| Go to **specific section** (jump) | ? No | Must progress sequentially |
| Skip section | ? No | Must answer or leave blank |
| Submit exam early | ? Yes | From last section only |

---

## ?? Auto-Save Strategy

### **When to Save:**

1. **On answer change** (debounced 2 seconds)
2. **When moving to next section**
3. **Every 30 seconds** (background auto-save)
4. **When section timer expires**
5. **Before exam submission**

### **API Call:**

```typescript
const autoSave = async () => {
  const answersToSave = Array.from(answers.values()).map(answer => ({
    questionId: answer.questionId,
    selectedOptionIds: answer.selectedOptionIds,
    textAnswer: answer.textAnswer
  }));

  await fetch(`/api/Candidate/attempts/${attemptId}/answers`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      answers: answersToSave
    })
  });
};
```

---

## ?? Progress Tracking

```typescript
interface SectionProgress {
  sectionId: number;
  totalQuestions: number;
  answeredQuestions: number;
  percentage: number;
}

const calculateProgress = (section: Section, answers: Map<number, Answer>): SectionProgress => {
  const allQuestions = [
    ...section.questions,
    ...section.topics.flatMap(t => t.questions)
  ];

  const answered = allQuestions.filter(q => answers.has(q.questionId)).length;

  return {
    sectionId: section.sectionId,
    totalQuestions: allQuestions.length,
    answeredQuestions: answered,
    percentage: (answered / allQuestions.length) * 100
  };
};
```

---

## ?? Summary

### **Key Endpoints:**

| Action | Endpoint | Method |
|--------|----------|--------|
| List exams | `/api/Candidate/exams` | GET |
| Preview exam | `/api/Candidate/exams/{id}/preview` | GET |
| Start exam | `/api/Candidate/exams/{id}/start` | POST |
| Get session (resume) | `/api/Candidate/attempts/{id}/session` | GET |
| Save answers | `/api/Candidate/attempts/{id}/answers` | PUT |
| Submit exam | `/api/Candidate/attempts/{id}/submit` | POST |

### **Response Fields for Exam List:**

| Field | Type | Description |
|-------|------|-------------|
| `myAttempts` | `int?` | Count of attempts (null = no attempts) |
| `myBestIsPassed` | `bool?` | Best result passed? (null = no attempts/results) |

---

**This provides a complete section-based exam experience with proper timing, navigation controls, and attempt tracking!**
