# Frontend API Guide: Exam Management Module

## Overview

This document provides comprehensive API documentation for frontend developers to implement the Exam Management module. All endpoints require JWT authentication unless otherwise specified.

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

1. [Exam CRUD Operations](#1-exam-crud-operations)
2. [Exam Sections](#2-exam-sections)
3. [Exam Topics](#3-exam-topics)
4. [Exam Questions](#4-exam-questions)
5. [Exam Instructions](#5-exam-instructions)
6. [Exam Access Policy](#6-exam-access-policy)
7. [Exam Publishing](#7-exam-publishing)
8. [TypeScript Interfaces](#8-typescript-interfaces)
9. [React/Angular Code Examples](#9-code-examples)

---

## 1. Exam CRUD Operations

### 1.1 Get All Exams (Paginated)

Retrieves a paginated list of exams with optional filtering.

**Endpoint:** `GET /Assessment/exams`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in title (EN/AR) |
| `departmentId` | number | No | Filter by department |
| `examType` | number | No | 0=Fixed, 1=Flex |
| `isPublished` | boolean | No | Filter by published status |
| `isActive` | boolean | No | Filter by active status |
| `startDateFrom` | datetime | No | Filter exams starting after |
| `startDateTo` | datetime | No | Filter exams starting before |
| `pageNumber` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Items per page (default: 10, max: 100) |

**Example Request:**

```http
GET /api/Assessment/exams?pageNumber=1&pageSize=10&isPublished=true&departmentId=1
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
        "titleAr": "اختبار شهادة أساسيات تقنية المعلومات",
        "departmentId": 1,
        "departmentName": "Information Technology",
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
    "totalCount": 25,
    "totalPages": 3,
    "hasPreviousPage": false,
    "hasNextPage": true
  },
  "errors": []
}
```

---

### 1.2 Get Exam by ID

Retrieves complete exam details including sections, topics, questions, and instructions.

**Endpoint:** `GET /Assessment/exams/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Exam ID |

**Example Request:**

```http
GET /api/Assessment/exams/1
Authorization: Bearer {token}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "departmentId": 1,
    "departmentName": "Information Technology",
    "examType": 1,
    "examTypeName": "Flex",
    "titleEn": "IT Fundamentals Certification Exam",
    "titleAr": "اختبار شهادة أساسيات تقنية المعلومات",
    "descriptionEn": "This exam covers fundamental IT concepts including networking, hardware, and software.",
    "descriptionAr": "يغطي هذا الاختبار المفاهيم الأساسية لتقنية المعلومات بما في ذلك الشبكات والأجهزة والبرمجيات.",
    "startAt": "2024-02-01T09:00:00Z",
    "endAt": "2024-02-28T23:59:59Z",
    "durationMinutes": 120,
    "maxAttempts": 2,
    "shuffleQuestions": true,
    "shuffleOptions": true,
 "passScore": 70.0,
    "isPublished": false,
    "isActive": true,
    "totalQuestions": 50,
    "totalPoints": 100.0,
    "createdDate": "2024-01-15T10:30:00Z",
    "updatedDate": "2024-01-20T14:00:00Z",
 "sections": [
      {
   "id": 1,
  "titleEn": "Section 1: Networking",
        "titleAr": "القسم الأول: الشبكات",
        "descriptionEn": "Questions about networking concepts",
        "descriptionAr": "أسئلة حول مفاهيم الشبكات",
        "order": 1,
   "durationMinutes": 40,
        "totalPoints": 40.0,
  "questionCount": 20,
        "topics": [
          {
            "id": 1,
        "titleEn": "OSI Model",
    "titleAr": "نموذج OSI",
          "order": 1,
"questionCount": 5
          }
        ]
      }
    ],
    "instructions": [
      {
        "id": 1,
        "contentEn": "Read all questions carefully before answering.",
        "contentAr": "اقرأ جميع الأسئلة بعناية قبل الإجابة.",
        "order": 1
      }
    ],
    "accessPolicy": {
      "id": 1,
      "isPublic": false,
      "accessCode": "IT2024CERT",
      "restrictToAssignedCandidates": false
    }
  },
  "errors": []
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Exam not found",
  "data": null,
  "errors": []
}
```

---

### 1.3 Create Exam

Creates a new exam.

**Endpoint:** `POST /Assessment/exams`

**Request Body:**

```json
{
  "departmentId": null,
  "examType": 1,
  "titleEn": "IT Fundamentals Certification Exam",
  "titleAr": "اختبار شهادة أساسيات تقنية المعلومات",
  "descriptionEn": "This exam covers fundamental IT concepts.",
  "descriptionAr": "يغطي هذا الاختبار المفاهيم الأساسية لتقنية المعلومات.",
  "startAt": "2024-02-01T09:00:00Z",
  "endAt": "2024-02-28T23:59:59Z",
  "durationMinutes": 120,
  "maxAttempts": 2,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "passScore": 70.0,
  "isActive": true
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `departmentId` | number | **No** | Department ID. **If null or not provided, uses current user's department from token.** SuperDev users must provide this value. |
| `examType` | number | Yes | 0=Fixed, 1=Flex |
| `titleEn` | string | Yes | English title (max 500 chars) |
| `titleAr` | string | Yes | Arabic title (max 500 chars) |
| `descriptionEn` | string | No | English description |
| `descriptionAr` | string | No | Arabic description |
| `startAt` | datetime | No | Exam availability start (UTC) |
| `endAt` | datetime | No | Exam availability end (UTC) |
| `durationMinutes` | number | Yes | Duration in minutes (1-480) |
| `maxAttempts` | number | Yes | Max attempts (0=unlimited) |
| `shuffleQuestions` | boolean | No | Shuffle questions (default: false) |
| `shuffleOptions` | boolean | No | Shuffle options (default: false) |
| `passScore` | decimal | Yes | Passing score (0-100) |
| `isActive` | boolean | No | Active status (default: true) |

> **Note:** The `departmentId` is automatically resolved from the logged-in user's token if not provided. This means regular users (Admin/Instructor) can omit this field and the exam will be created in their assigned department.

**Success Response (201):**

```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "id": 1,
    "departmentId": 1,
    "titleEn": "IT Fundamentals Certification Exam",
    "titleAr": "اختبار شهادة أساسيات تقنية المعلومات",
    // ... full exam object
  },
  "errors": []
}
```

**Validation Error (400):**

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": [
    "Title (English) is required",
    "Title (Arabic) is required",
    "Duration must be between 1 and 480 minutes"
  ]
}
```

**Error Response (No Department):**

```json
{
  "success": false,
  "message": "User is not assigned to any department. Cannot create exam.",
  "data": null,
  "errors": []
}
```

---

### 1.4 Update Exam

Updates an existing exam. Cannot update published exams.

**Endpoint:** `PUT /Assessment/exams/{id}`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Exam ID |

**Request Body:** Same as Create Exam

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam updated successfully",
"data": {
    // ... updated exam object
  },
  "errors": []
}
```

**Error Response (400 - Published Exam):**

```json
{
  "success": false,
  "message": "Cannot update a published exam. Unpublish first.",
  "data": null,
  "errors": []
}
```

---

### 1.5 Delete Exam

Soft deletes an exam. Cannot delete published exams.

**Endpoint:** `DELETE /Assessment/exams/{id}`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 1.6 Toggle Exam Status

Activates or deactivates an exam.

**Endpoint:** `POST /Assessment/exams/{id}/toggle-status`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam activated successfully",
  "data": true,
  "errors": []
}
```

---

### 1.7 Update Exam Settings Only

Updates only the exam settings (result/review, proctoring, security) without modifying other exam properties.

**Endpoint:** `POST /Assessment/exams/{id}/settings`

**Request Body:**

```json
{
  "showResults": true,
  "allowReview": true,
  "showCorrectAnswers": false,
  "requireProctoring": true,
  "requireIdVerification": true,
  "requireWebcam": true,
  "preventCopyPaste": true,
  "preventScreenCapture": true,
  "requireFullscreen": true,
  "browserLockdown": false
}
```

**Request Body Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| **Result & Review Settings** ||||
| `showResults` | boolean | `true` | Show results to candidate after submission |
| `allowReview` | boolean | `false` | Allow candidate to review answers after submission |
| `showCorrectAnswers` | boolean | `false` | Show correct answers during review (requires `allowReview: true`) |
| **Proctoring Settings** ||||
| `requireProctoring` | boolean | `false` | Enable AI/human proctoring |
| `requireIdVerification` | boolean | `false` | Require ID verification before starting |
| `requireWebcam` | boolean | `false` | Require webcam during exam |
| **Security Settings** ||||
| `preventCopyPaste` | boolean | `false` | Block copy/paste operations |
| `preventScreenCapture` | boolean | `false` | Block screenshots/screen recording |
| `requireFullscreen` | boolean | `false` | Force fullscreen mode |
| `browserLockdown` | boolean | `false` | Enable browser lockdown mode |

**Validation Rules:**
- `showCorrectAnswers` can only be `true` if `allowReview` is also `true`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "titleEn": "IT Fundamentals Certification Exam",
    "showResults": true,
    "allowReview": true,
    "showCorrectAnswers": false,
    "requireProctoring": true,
    "requireIdVerification": true,
    "requireWebcam": true,
    "preventCopyPaste": true,
    "preventScreenCapture": true,
    "requireFullscreen": true,
    "browserLockdown": false,
    // ... full exam object
},
  "errors": []
}
```

**Error Response (Validation):**

```json
{
  "success": false,
  "message": "Cannot show correct answers without allowing review. Enable 'AllowReview' first.",
  "data": null,
  "errors": []
}
```

---

## 2. Exam Sections

### 2.1 Get Exam Sections

**Endpoint:** `GET /Assessment/exams/{examId}/sections`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "examId": 1,
      "titleEn": "Section 1: Networking",
      "titleAr": "القسم الأول: الشبكات",
      "descriptionEn": "Questions about networking concepts",
  "descriptionAr": "أسئلة حول مفاهيم الشبكات",
      "order": 1,
      "durationMinutes": 40,
      "totalPointsOverride": null,
      "calculatedPoints": 40.0,
      "questionCount": 20,
      "createdDate": "2024-01-15T10:30:00Z"
    }
  ],
  "errors": []
}
```

---

### 2.2 Get Section by ID

**Endpoint:** `GET /Assessment/sections/{sectionId}`

---

### 2.3 Create Section

**Endpoint:** `POST /Assessment/exams/{examId}/sections`

**Request Body:**

```json
{
  "titleEn": "Section 1: Networking Fundamentals",
  "titleAr": "القسم الأول: أساسيات الشبكات",
  "descriptionEn": "This section tests your knowledge of basic networking concepts.",
  "descriptionAr": "يختبر هذا القسم معرفتك بمفاهيم الشبكات الأساسية.",
  "order": 1,
  "durationMinutes": 40,
  "totalPointsOverride": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `titleEn` | string | Yes | English title |
| `titleAr` | string | Yes | Arabic title |
| `descriptionEn` | string | No | English description |
| `descriptionAr` | string | No | Arabic description |
| `order` | number | Yes | Display order |
| `durationMinutes` | number | No | Section time limit |
| `totalPointsOverride` | decimal | No | Override calculated points |

---

### 2.4 Update Section

**Endpoint:** `PUT /Assessment/sections/{sectionId}`

**Request Body:** Same as Create Section

---

### 2.5 Delete Section

**Endpoint:** `DELETE /Assessment/sections/{sectionId}`

---

### 2.6 Reorder Sections

**Endpoint:** `POST /Assessment/exams/{examId}/sections/reorder`

**Request Body:**

```json
[
  { "sectionId": 1, "newOrder": 2 },
  { "sectionId": 2, "newOrder": 1 }
]
```

---

## 3. Exam Topics

### 3.1 Get Section Topics

**Endpoint:** `GET /Assessment/sections/{sectionId}/topics`

---

### 3.2 Get Topic by ID

**Endpoint:** `GET /Assessment/topics/{topicId}`

---

### 3.3 Create Topic

**Endpoint:** `POST /Assessment/sections/{sectionId}/topics`

**Request Body:**

```json
{
  "titleEn": "OSI Model",
  "titleAr": "نموذج OSI",
  "descriptionEn": "Questions about the 7 layers of the OSI model.",
  "descriptionAr": "أسئلة حول الطبقات السبع لنموذج OSI.",
  "order": 1
}
```

---

### 3.4 Update Topic

**Endpoint:** `PUT /Assessment/topics/{topicId}`

---

### 3.5 Delete Topic

**Endpoint:** `DELETE /Assessment/topics/{topicId}`

---

### 3.6 Reorder Topics

**Endpoint:** `POST /Assessment/sections/{sectionId}/topics/reorder`

---

## 4. Exam Questions

### 4.1 Get Section Questions

**Endpoint:** `GET /Assessment/sections/{sectionId}/questions`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
  "id": 1,
   "examId": 1,
      "examSectionId": 1,
      "examTopicId": null,
      "questionId": 42,
      "order": 1,
      "points": 2.0,
      "isRequired": true,
      "createdDate": "2024-01-15T10:30:00Z",
      "questionBodyEn": "What layer of the OSI model is responsible for routing?",
   "questionBodyAr": "ما هي طبقة نموذج OSI المسؤولة عن التوجيه؟",
      "questionTypeNameEn": "MCQ_Single",
      "questionTypeNameAr": "اختيار من متعدد - إجابة واحدة",
      "difficultyLevelName": "Medium",
      "originalPoints": 2.0
    }
  ],
  "errors": []
}
```

---

### 4.2 Get Topic Questions

**Endpoint:** `GET /Assessment/topics/{topicId}/questions`

---

### 4.3 Add Single Question to Section

**Endpoint:** `POST /Assessment/sections/{sectionId}/questions`

**Request Body:**

```json
{
  "questionId": 42,
"order": 1,
  "pointsOverride": null,
  "isRequired": true
}
```

---

### 4.4 Add Single Question to Topic

**Endpoint:** `POST /Assessment/topics/{topicId}/questions`

---

### 4.5 Manual Add Questions (User Selects with Order)

Use this when the user wants to select specific questions and define their order.

**Endpoint (Section):** `POST /Assessment/sections/{sectionId}/questions/manual`

**Endpoint (Topic):** `POST /Assessment/topics/{topicId}/questions/manual`

**Request Body:**

```json
{
  "questions": [
    {
      "questionId": 1,
      "order": 1,
      "pointsOverride": null,
      "isRequired": true
    },
    {
   "questionId": 5,
      "order": 2,
      "pointsOverride": 5.0,
      "isRequired": true
    },
    {
      "questionId": 12,
      "order": 3,
      "pointsOverride": 10.0,
      "isRequired": false
    }
  ],
  "markAsRequired": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `questions` | array | Yes | List of questions to add |
| `questions[].questionId` | number | Yes | Question ID from Question Bank |
| `questions[].order` | number | Yes | Display order (must be unique) |
| `questions[].pointsOverride` | decimal | No | Custom points (null = use original) |
| `questions[].isRequired` | boolean | No | Override required status |
| `markAsRequired` | boolean | No | Default required status (default: true) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
   "examId": 1,
      "examSectionId": 1,
      "questionId": 1,
      "order": 1,
      "points": 2.0,
 "isRequired": true,
      "questionBodyEn": "What layer of the OSI model is responsible for routing?",
      "questionBodyAr": "ما هي طبقة نموذج OSI المسؤولة عن التوجيه؟",
      "questionTypeNameEn": "MCQ_Single",
      "questionTypeNameAr": "اختيار من متعدد - إجابة واحدة",
      "difficultyLevelName": "Medium",
  "originalPoints": 2.0
    }
  ],
  "errors": []
}
```

**Error Responses:**

```json
// Duplicate orders
{
  "success": false,
  "message": "Duplicate order values are not allowed",
  "data": null,
  "errors": []
}

// Questions already in exam
{
  "success": false,
  "message": "Questions already in exam: 1, 5",
  "data": null,
  "errors": []
}

// Inactive questions
{
  "success": false,
  "message": "Cannot add inactive questions: 12",
  "data": null,
  "errors": []
}
```

---

### 4.6 Random Add Questions (System Selects)

Use this when you want the system to randomly select questions based on criteria.

**Endpoint (Section):** `POST /Assessment/sections/{sectionId}/questions/random`

**Endpoint (Topic):** `POST /Assessment/topics/{topicId}/questions/random`

**Request Body:**

```json
{
  "count": 10,
  "categoryId": 1,
  "questionTypeId": 1,
  "difficultyLevel": 2,
  "useOriginalPoints": true,
  "markAsRequired": true,
  "excludeExistingInExam": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `count` | number | Yes | Number of questions to select |
| `categoryId` | number | No | Filter by category |
| `questionTypeId` | number | No | Filter by question type |
| `difficultyLevel` | number | No | 1=Easy, 2=Medium, 3=Hard |
| `useOriginalPoints` | boolean | No | Use original points (default: true) |
| `markAsRequired` | boolean | No | Mark as required (default: true) |
| `excludeExistingInExam` | boolean | No | Exclude duplicates (default: true) |

**Error Response (Not Enough Questions):**

```json
{
  "success": false,
  "message": "Only 5 questions available, but 10 requested. Adjust your criteria or reduce the count.",
  "data": null,
  "errors": []
}
```

---

### 4.7 Bulk Add Questions (Simple)

Simple bulk add with auto-ordering.

**Endpoint (Section):** `POST /Assessment/sections/{sectionId}/questions/bulk`

**Endpoint (Topic):** `POST /Assessment/topics/{topicId}/questions/bulk`

**Request Body:**

```json
{
  "questionIds": [1, 5, 12, 23, 45],
  "useOriginalPoints": true,
  "markAsRequired": true
}
```

---

### 4.8 Update Exam Question

**Endpoint:** `PUT /Assessment/exam-questions/{examQuestionId}`

**Request Body:**

```json
{
  "order": 2,
  "points": 5.0,
  "isRequired": true
}
```

---

### 4.9 Remove Question from Exam

**Endpoint:** `DELETE /Assessment/exam-questions/{examQuestionId}`

---

### 4.10 Reorder Questions

**Endpoint:** `POST /Assessment/sections/{sectionId}/questions/reorder`

**Request Body:**

```json
[
  { "examQuestionId": 1, "newOrder": 3 },
  { "examQuestionId": 2, "newOrder": 1 },
  { "examQuestionId": 3, "newOrder": 2 }
]
```

---

## 5. Exam Instructions

### 5.1 Get Exam Instructions

**Endpoint:** `GET /Assessment/exams/{examId}/instructions`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
    "id": 1,
   "examId": 1,
      "contentEn": "Read all questions carefully before answering.",
    "contentAr": "اقرأ جميع الأسئلة بعناية قبل الإجابة.",
      "order": 1,
      "createdDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "examId": 1,
      "contentEn": "You cannot go back to previous questions.",
      "contentAr": "لا يمكنك العودة إلى الأسئلة السابقة.",
      "order": 2,
      "createdDate": "2024-01-15T10:30:00Z"
    }
  ],
  "errors": []
}
```

---

### 5.2 Create Instruction

**Endpoint:** `POST /Assessment/exams/{examId}/instructions`

**Request Body:**

```json
{
  "contentEn": "Read all questions carefully before answering.",
  "contentAr": "اقرأ جميع الأسئلة بعناية قبل الإجابة.",
  "order": 1
}
```

---

### 5.3 Update Instruction

**Endpoint:** `PUT /Assessment/instructions/{instructionId}`

---

### 5.4 Delete Instruction

**Endpoint:** `DELETE /Assessment/instructions/{instructionId}`

---

### 5.5 Reorder Instructions

**Endpoint:** `POST /Assessment/exams/{examId}/instructions/reorder`

**Request Body:**

```json
[
  { "instructionId": 1, "newOrder": 2 },
  { "instructionId": 2, "newOrder": 1 }
]
```

---

## 6. Exam Access Policy

### 6.1 Get Access Policy

**Endpoint:** `GET /Assessment/exams/{examId}/access-policy`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
 "id": 1,
    "examId": 1,
    "isPublic": false,
    "accessCode": "IT2024CERT",
    "restrictToAssignedCandidates": false,
    "showResults": true,
    "allowReview": true,
    "showCorrectAnswers": false,
    "requireProctoring": true,
    "requireIdVerification": true,
    "requireWebcam": true,
    "preventCopyPaste": true,
    "preventScreenCapture": true,
  "requireFullscreen": true,
 "browserLockdown": false,
    "createdDate": "2024-01-15T10:30:00Z"
  },
  "errors": []
}
```

---

### 6.2 Save Access Policy (Create/Update)

**Endpoint:** `PUT /Assessment/exams/{examId}/access-policy`

**Request Body:**

```json
{
  "isPublic": false,
  "accessCode": "IT2024CERT",
  "restrictToAssignedCandidates": false,
  "showResults": true,
  "allowReview": true,
  "showCorrectAnswers": false,
  "requireProctoring": true,
  "requireIdVerification": true,
  "requireWebcam": true,
  "preventCopyPaste": true,
"preventScreenCapture": true,
  "requireFullscreen": true,
  "browserLockdown": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| **Access Control** |||||
| `isPublic` | boolean | No | `false` | Public access without login |
| `accessCode` | string | No | `null` | Access code (min 6 chars) |
| `restrictToAssignedCandidates` | boolean | No | `false` | Restrict to assigned candidates only |
| **Result & Review Settings** |||||
| `showResults` | boolean | No | `true` | Show results to candidate after submission |
| `allowReview` | boolean | No | `false` | Allow candidate to review answers after submission |
| `showCorrectAnswers` | boolean | No | `false` | Show correct answers during review (requires `allowReview: true`) |
| **Proctoring Settings** |||||
| `requireProctoring` | boolean | No | `false` | Enable AI/human proctoring |
| `requireIdVerification` | boolean | No | `false` | Require ID verification before starting |
| `requireWebcam` | boolean | No | `false` | Require webcam during exam |
| **Security Settings** |||||
| `preventCopyPaste` | boolean | No | `false` | Block copy/paste operations |
| `preventScreenCapture` | boolean | No | `false` | Block screenshots/screen recording |
| `requireFullscreen` | boolean | No | `false` | Force fullscreen mode |
| `browserLockdown` | boolean | No | `false` | Enable browser lockdown (blocks other apps/tabs) |

**Validation Rules:**

- `showCorrectAnswers` can only be `true` if `allowReview` is also `true`
- `accessCode` must be at least 6 characters if provided

**Success Response (200):**

```json
{
  "success": true,
  "message": "Access policy updated successfully",
  "data": {
    "id": 1,
    "examId": 1,
    "isPublic": false,
    "accessCode": "IT2024CERT",
  "restrictToAssignedCandidates": false,
    "showResults": true,
    "allowReview": true,
  "showCorrectAnswers": false,
    "requireProctoring": true,
    "requireIdVerification": true,
    "requireWebcam": true,
    "preventCopyPaste": true,
    "preventScreenCapture": true,
    "requireFullscreen": true,
    "browserLockdown": false,
    "createdDate": "2024-01-15T10:30:00Z",
    "updatedDate": "2024-01-20T14:00:00Z"
  },
  "errors": []
}
```

**Error Response (Validation):**

```json
{
  "success": false,
  "message": "Cannot show correct answers without allowing review. Enable 'AllowReview' first.",
  "data": null,
  "errors": []
}
```

---

### 6.3 Access Policy Presets (Recommended Configurations)

Here are some recommended configurations for common exam scenarios:

#### Standard Exam (Low Security)
```json
{
  "isPublic": false,
  "showResults": true,
  "allowReview": true,
  "showCorrectAnswers": true,
  "requireProctoring": false,
  "preventCopyPaste": false,
  "requireFullscreen": false
}
```

#### Certification Exam (Medium Security)
```json
{
  "isPublic": false,
  "accessCode": "CERT2024",
  "showResults": true,
  "allowReview": false,
  "showCorrectAnswers": false,
  "requireProctoring": false,
  "preventCopyPaste": true,
  "requireFullscreen": true
}
```

#### High-Stakes Exam (High Security)
```json
{
  "isPublic": false,
  "accessCode": "SECURE2024",
  "restrictToAssignedCandidates": true,
  "showResults": false,
  "allowReview": false,
  "showCorrectAnswers": false,
  "requireProctoring": true,
  "requireIdVerification": true,
  "requireWebcam": true,
  "preventCopyPaste": true,
  "preventScreenCapture": true,
  "requireFullscreen": true,
  "browserLockdown": true
}
```

---

## 7. Exam Publishing

### 7.1 Validate Exam for Publishing

**Endpoint:** `GET /Assessment/exams/{examId}/validate`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "No instructions defined for this exam"
    ]
},
  "errors": []
}
```

**Validation Failed Response:**

```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      "Exam must have at least one section",
      "Exam must have at least one question"
    ],
    "warnings": []
  },
  "errors": []
}
```

---

### 7.2 Publish Exam

**Endpoint:** `POST /Assessment/exams/{examId}/publish`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam published successfully",
  "data": true,
  "errors": []
}
```

**Error Response (Validation Failed):**

```json
{
  "success": false,
  "message": "Cannot publish exam: Exam must have at least one section",
  "data": false,
  "errors": []
}
```

---

### 7.3 Unpublish Exam

**Endpoint:** `POST /Assessment/exams/{examId}/unpublish`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam unpublished successfully",
  "data": true,
  "errors": []
}
```

---

## 8. TypeScript Interfaces

```typescript
// ============================================
// ENUMS
// ============================================

export enum ExamType {
  Fixed = 0,
  Flex = 1
}

export enum DifficultyLevel {
  Easy = 1,
  Medium = 2,
  Hard = 3
}

// ============================================
// API RESPONSE WRAPPER
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ============================================
// EXAM INTERFACES
// ============================================

export interface ExamListDto {
  id: number;
  titleEn: string;
  titleAr: string;
  departmentId: number;
  departmentName: string;
  examType: ExamType;
  examTypeName: string;
  durationMinutes: number;
  maxAttempts: number;
  passScore: number;
  totalQuestions: number;
  totalPoints: number;
  isPublished: boolean;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  createdDate: string;
}

export interface ExamDto extends ExamListDto {
  descriptionEn: string | null;
  descriptionAr: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  updatedDate: string | null;
  sections: ExamSectionDto[];
  instructions: ExamInstructionDto[];
  accessPolicy: ExamAccessPolicyDto | null;
}

export interface SaveExamDto {
  /**
   * Department ID. If null/undefined, uses current user's department from token.
   * SuperDev users must provide this value.
   */
  departmentId?: number | null;
  examType: ExamType;
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  startAt?: string;
  endAt?: string;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  passScore: number;
  isActive?: boolean;
}

export interface ExamSearchDto {
  search?: string;
  departmentId?: number;
  examType?: ExamType;
  isPublished?: boolean;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  pageNumber?: number;
  pageSize?: number;
}

// ============================================
// EXAM SETTINGS INTERFACE
// ============================================

/**
 * Update only exam settings (result/review, proctoring, security)
 * Use PATCH /Assessment/exams/{id}/settings
 */
export interface UpdateExamSettingsDto {
  // Result & Review Settings
  showResults?: boolean; // default: true
  allowReview?: boolean;    // default: false
  showCorrectAnswers?: boolean;  // default: false (requires allowReview: true)
  // Proctoring Settings
  requireProctoring?: boolean;   // default: false
  requireIdVerification?: boolean;  // default: false
  requireWebcam?: boolean;     // default: false
  // Security Settings
  preventCopyPaste?: boolean;    // default: false
  preventScreenCapture?: boolean;  // default: false
  requireFullscreen?: boolean;   // default: false
  browserLockdown?: boolean;   // default: false
}

// ============================================
// SECTION INTERFACES
// ============================================

export interface ExamSectionDto {
  id: number;
  examId: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  order: number;
  durationMinutes: number | null;
  totalPointsOverride: number | null;
  calculatedPoints: number;
  questionCount: number;
  topics: ExamTopicDto[];
  createdDate: string;
}

export interface SaveExamSectionDto {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  order: number;
  durationMinutes?: number;
  totalPointsOverride?: number;
}

export interface ReorderSectionDto {
  sectionId: number;
  newOrder: number;
}

// ============================================
// TOPIC INTERFACES
// ============================================

export interface ExamTopicDto {
  id: number;
  examSectionId: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  order: number;
  questionCount: number;
  createdDate: string;
}

export interface SaveExamTopicDto {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  order: number;
}

export interface ReorderTopicDto {
  topicId: number;
  newOrder: number;
}

// ============================================
// QUESTION INTERFACES
// ============================================

export interface ExamQuestionDto {
  id: number;
  examId: number;
  examSectionId: number;
  examTopicId: number | null;
  questionId: number;
  order: number;
  points: number;
  isRequired: boolean;
  createdDate: string;
  // Question Bank details (bilingual)
  questionBodyEn: string;
  questionBodyAr: string;
  questionTypeNameEn: string;
  questionTypeNameAr: string;
  difficultyLevelName: string;
  originalPoints: number;
}

export interface AddExamQuestionDto {
  questionId: number;
  order: number;
  pointsOverride?: number;
  isRequired?: boolean;
}

export interface UpdateExamQuestionDto {
  order: number;
  points: number;
  isRequired: boolean;
}

export interface ManualQuestionSelectionDto {
  questions: ManualQuestionItemDto[];
  markAsRequired?: boolean;
}

export interface ManualQuestionItemDto {
  questionId: number;
  order: number;
  pointsOverride?: number;
  isRequired?: boolean;
}

export interface RandomQuestionSelectionDto {
  count: number;
  categoryId?: number;
  questionTypeId?: number;
  difficultyLevel?: DifficultyLevel;
  useOriginalPoints?: boolean;
  markAsRequired?: boolean;
  excludeExistingInExam?: boolean;
}

export interface BulkAddQuestionsDto {
  questionIds: number[];
  useOriginalPoints?: boolean;
  markAsRequired?: boolean;
}

export interface ReorderQuestionDto {
  examQuestionId: number;
  newOrder: number;
}

// ============================================
// INSTRUCTION INTERFACES
// ============================================

export interface ExamInstructionDto {
  id: number;
  examId: number;
  contentEn: string;
  contentAr: string;
  order: number;
  createdDate: string;
}

export interface SaveExamInstructionDto {
  contentEn: string;
  contentAr: string;
  order: number;
}

export interface ReorderInstructionDto {
  instructionId: number;
  newOrder: number;
}

// ============================================
// ACCESS POLICY INTERFACES
// ============================================

export interface ExamAccessPolicyDto {
  id: number;
  examId: number;
  // Access Control
  isPublic: boolean;
  accessCode: string | null;
  restrictToAssignedCandidates: boolean;
  // Result & Review Settings
  showResults: boolean;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  // Proctoring Settings
  requireProctoring: boolean;
  requireIdVerification: boolean;
  requireWebcam: boolean;
  // Security Settings
  preventCopyPaste: boolean;
  preventScreenCapture: boolean;
  requireFullscreen: boolean;
  browserLockdown: boolean;
  // Timestamps
  createdDate: string;
  updatedDate: string | null;
}

export interface SaveExamAccessPolicyDto {
  // Access Control
  isPublic?: boolean;
  accessCode?: string;
  restrictToAssignedCandidates?: boolean;
  // Result & Review Settings
  showResults?: boolean;     // default: true
allowReview?: boolean;     // default: false
  showCorrectAnswers?: boolean;  // default: false (requires allowReview: true)
  // Proctoring Settings
  requireProctoring?: boolean;   // default: false
  requireIdVerification?: boolean;  // default: false
  requireWebcam?: boolean;   // default: false
  // Security Settings
  preventCopyPaste?: boolean;    // default: false
  preventScreenCapture?: boolean;  // default: false
  requireFullscreen?: boolean;   // default: false
  browserLockdown?: boolean;   // default: false
}

// ============================================
// VALIDATION INTERFACES
// ============================================

export interface ExamValidationResultDto {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

## 9. Code Examples

### 9.1 React Example with Axios

```typescript
import axios from 'axios';

const API_BASE_URL = 'https://https://zoolker-003-site8.jtempurl.com/api';

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// EXAM SERVICE
// ============================================

export const examService = {
  // Get all exams with pagination
  async getExams(params: ExamSearchDto): Promise<ApiResponse<PaginatedResponse<ExamListDto>>> {
    const response = await apiClient.get('/Assessment/exams', { params });
    return response.data;
  },

  // Get exam by ID
  async getExamById(id: number): Promise<ApiResponse<ExamDto>> {
    const response = await apiClient.get(`/Assessment/exams/${id}`);
    return response.data;
  },

  // Create exam
  async createExam(data: SaveExamDto): Promise<ApiResponse<ExamDto>> {
    const response = await apiClient.post('/Assessment/exams', data);
    return response.data;
  },

  // Update exam
  async updateExam(id: number, data: SaveExamDto): Promise<ApiResponse<ExamDto>> {
    const response = await apiClient.put(`/Assessment/exams/${id}`, data);
    return response.data;
},

  // Delete exam
  async deleteExam(id: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete(`/Assessment/exams/${id}`);
    return response.data;
  },

  // Publish exam
  async publishExam(id: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/exams/${id}/publish`);
    return response.data;
  },

  // Unpublish exam
  async unpublishExam(id: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/exams/${id}/unpublish`);
    return response.data;
  },

  // Validate exam
  async validateExam(id: number): Promise<ApiResponse<ExamValidationResultDto>> {
    const response = await apiClient.get(`/Assessment/exams/${id}/validate`);
    return response.data;
  },

  // Toggle status
  async toggleStatus(id: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/exams/${id}/toggle-status`);
    return response.data;
  },
};

// ============================================
// SECTION SERVICE
// ============================================

export const sectionService = {
  async getSections(examId: number): Promise<ApiResponse<ExamSectionDto[]>> {
    const response = await apiClient.get(`/Assessment/exams/${examId}/sections`);
    return response.data;
  },

  async createSection(examId: number, data: SaveExamSectionDto): Promise<ApiResponse<ExamSectionDto>> {
const response = await apiClient.post(`/Assessment/exams/${examId}/sections`, data);
    return response.data;
  },

  async updateSection(sectionId: number, data: SaveExamSectionDto): Promise<ApiResponse<ExamSectionDto>> {
    const response = await apiClient.put(`/Assessment/sections/${sectionId}`, data);
    return response.data;
  },

  async deleteSection(sectionId: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete(`/Assessment/sections/${sectionId}`);
  return response.data;
  },

  async reorderSections(examId: number, data: ReorderSectionDto[]): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/exams/${examId}/sections/reorder`, data);
    return response.data;
  },
};

// ============================================
// QUESTION SERVICE
// ============================================

export const examQuestionService = {
  async getSectionQuestions(sectionId: number): Promise<ApiResponse<ExamQuestionDto[]>> {
  const response = await apiClient.get(`/Assessment/sections/${sectionId}/questions`);
    return response.data;
  },

  async getTopicQuestions(topicId: number): Promise<ApiResponse<ExamQuestionDto[]>> {
    const response = await apiClient.get(`/Assessment/topics/${topicId}/questions`);
    return response.data;
  },

  // Manual selection (user picks questions with order)
  async manualAddToSection(sectionId: number, data: ManualQuestionSelectionDto): Promise<ApiResponse<ExamQuestionDto[]>> {
    const response = await apiClient.post(`/Assessment/sections/${sectionId}/questions/manual`, data);
    return response.data;
  },

  async manualAddToTopic(topicId: number, data: ManualQuestionSelectionDto): Promise<ApiResponse<ExamQuestionDto[]>> {
    const response = await apiClient.post(`/Assessment/topics/${topicId}/questions/manual`, data);
    return response.data;
  },

  // Random selection (system picks based on criteria)
  async randomAddToSection(sectionId: number, data: RandomQuestionSelectionDto): Promise<ApiResponse<ExamQuestionDto[]>> {
    const response = await apiClient.post(`/Assessment/sections/${sectionId}/questions/random`, data);
    return response.data;
  },

  async randomAddToTopic(topicId: number, data: RandomQuestionSelectionDto): Promise<ApiResponse<ExamQuestionDto[]>> {
    const response = await apiClient.post(`/Assessment/topics/${topicId}/questions/random`, data);
return response.data;
  },

  // Update question
  async updateQuestion(examQuestionId: number, data: UpdateExamQuestionDto): Promise<ApiResponse<ExamQuestionDto>> {
    const response = await apiClient.put(`/Assessment/exam-questions/${examQuestionId}`, data);
    return response.data;
  },

  // Remove question
  async removeQuestion(examQuestionId: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete(`/Assessment/exam-questions/${examQuestionId}`);
    return response.data;
  },

  // Reorder questions
  async reorderQuestions(sectionId: number, data: ReorderQuestionDto[]): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/sections/${sectionId}/questions/reorder`, data);
    return response.data;
  },
};

// ============================================
// INSTRUCTION SERVICE
// ============================================

export const instructionService = {
  async getInstructions(examId: number): Promise<ApiResponse<ExamInstructionDto[]>> {
    const response = await apiClient.get(`/Assessment/exams/${examId}/instructions`);
    return response.data;
  },

  async createInstruction(examId: number, data: SaveExamInstructionDto): Promise<ApiResponse<ExamInstructionDto>> {
    const response = await apiClient.post(`/Assessment/exams/${examId}/instructions`, data);
    return response.data;
  },

  async updateInstruction(instructionId: number, data: SaveExamInstructionDto): Promise<ApiResponse<ExamInstructionDto>> {
    const response = await apiClient.put(`/Assessment/instructions/${instructionId}`, data);
    return response.data;
  },

  async deleteInstruction(instructionId: number): Promise<ApiResponse<boolean>> {
    const response = await apiClient.delete(`/Assessment/instructions/${instructionId}`);
    return response.data;
  },

  async reorderInstructions(examId: number, data: ReorderInstructionDto[]): Promise<ApiResponse<boolean>> {
    const response = await apiClient.post(`/Assessment/exams/${examId}/instructions/reorder`, data);
    return response.data;
  },
};

// ============================================
// ACCESS POLICY SERVICE
// ============================================

export const accessPolicyService = {
  async getAccessPolicy(examId: number): Promise<ApiResponse<ExamAccessPolicyDto>> {
    const response = await apiClient.get(`/Assessment/exams/${examId}/access-policy`);
    return response.data;
  },

  async saveAccessPolicy(examId: number, data: SaveExamAccessPolicyDto): Promise<ApiResponse<ExamAccessPolicyDto>> {
    const response = await apiClient.put(`/Assessment/exams/${examId}/access-policy`, data);
    return response.data;
  },
};
```

### 9.2 React Hook Example

```typescript
import { useState, useEffect, useCallback } from 'react';
import { examService } from './services/examService';

// Custom hook for exam list
export function useExamList(initialParams: ExamSearchDto = {}) {
  const [exams, setExams] = useState<ExamListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [params, setParams] = useState<ExamSearchDto>(initialParams);

  const fetchExams = useCallback(async () => {
 setLoading(true);
    setError(null);
    try {
      const response = await examService.getExams(params);
      if (response.success && response.data) {
        setExams(response.data.items);
        setPagination({
          pageNumber: response.data.pageNumber,
          pageSize: response.data.pageSize,
       totalCount: response.data.totalCount,
          totalPages: response.data.totalPages,
    });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to fetch exams');
    } finally {
   setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const changePage = (page: number) => {
    setParams(prev => ({ ...prev, pageNumber: page }));
  };

  const changeSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, pageNumber: 1 }));
  };

  const refresh = () => fetchExams();

  return {
exams,
    loading,
    error,
    pagination,
    changePage,
    changeSearch,
    refresh,
    setParams,
  };
}

// Custom hook for single exam
export function useExam(examId: number | null) {
  const [exam, setExam] = useState<ExamDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExam = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await examService.getExamById(examId);
      if (response.success) {
      setExam(response.data);
   } else {
        setError(response.message);
      }
    } catch (err) {
setError('Failed to fetch exam');
    } finally {
    setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  return { exam, loading, error, refresh: fetchExam };
}
```

### 9.3 Bilingual Text Helper

```typescript
// Utility for displaying bilingual text based on current locale
type Locale = 'en' | 'ar';

export function getLocalizedText(
  textEn: string,
  textAr: string,
  locale: Locale = 'en'
): string {
  return locale === 'ar' ? textAr : textEn;
}

// React context for locale
import { createContext, useContext, useState, ReactNode } from 'react';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (textEn: string, textAr: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  const t = (textEn: string, textAr: string) => getLocalizedText(textEn, textAr, locale);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
 throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Usage in component
function ExamCard({ exam }: { exam: ExamListDto }) {
  const { t } = useLocale();
  
  return (
 <div className="exam-card">
      <h3>{t(exam.titleEn, exam.titleAr)}</h3>
      <p>{exam.durationMinutes} minutes</p>
      <p>Pass Score: {exam.passScore}%</p>
    </div>
  );
}
```

---

## Error Handling

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;      // true if operation succeeded
  message: string;       // Success or error message
  data: T | null;        // Response data (null on error)
  errors: string[];      // Validation errors array
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Error Handling Example

```typescript
async function handleApiCall<T>(apiCall: () => Promise<ApiResponse<T>>): Promise<T | null> {
  try {
    const response = await apiCall();
    
    if (response.success) {
      return response.data;
    }
 
    // Handle validation errors
    if (response.errors.length > 0) {
      console.error('Validation errors:', response.errors);
      // Show validation errors to user
    }
    
    // Handle general error
    console.error('API Error:', response.message);
    return null;
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 429) {
        // Rate limited
  alert('Too many requests. Please wait a moment.');
      }
    }
    throw error;
  }
}
```

---

## Quick Reference: All Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| **Exams** | GET | `/Assessment/exams` | List all exams (paginated) |
| | GET | `/Assessment/exams/{id}` | Get exam by ID |
| | POST | `/Assessment/exams` | Create exam |
| | PUT | `/Assessment/exams/{id}` | Update exam (full) |
| | POST | `/Assessment/exams/{id}/settings` | Update exam settings only |
| | DELETE | `/Assessment/exams/{id}` | Delete exam |
| | POST | `/Assessment/exams/{id}/publish` | Publish exam |
| | POST | `/Assessment/exams/{id}/unpublish` | Unpublish exam |
| | POST | `/Assessment/exams/{id}/toggle-status` | Toggle active status |
| | GET | `/Assessment/exams/{id}/validate` | Validate exam |
