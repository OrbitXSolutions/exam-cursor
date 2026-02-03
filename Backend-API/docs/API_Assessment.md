# API Documentation: Assessment Module

## Base URL
`/api/Assessment`

**Authorization:** All endpoints require authentication (Bearer Token)

---

## Exams

### 1. Get All Exams
**Endpoint:** `GET /api/Assessment/exams`

**Method:** GET

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | null | Search in title (EN/AR) |
| isPublished | bool | No | null | Filter by published status |
| isActive | bool | No | null | Filter by active status |
| startDateFrom | DateTime | No | null | Filter exams starting from date |
| startDateTo | DateTime | No | null | Filter exams starting up to date |
| includeDeleted | bool | No | false | Include soft-deleted exams |
| pageNumber | int | No | 1 | Page number |
| pageSize | int | No | 10 | Items per page (max 100) |

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| pageNumber | Must be greater than 0 |
| pageSize | Must be between 1 and 100 |
| startDateTo | Must be >= startDateFrom if both provided |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
        "id": 1,
    "titleEn": "Final Exam",
        "titleAr": "???????? ???????",
        "startAt": "2024-01-15T09:00:00Z",
        "endAt": "2024-01-15T12:00:00Z",
        "durationMinutes": 120,
  "passScore": 60.0,
        "isPublished": true,
        "isActive": true,
        "createdDate": "2024-01-01T00:00:00Z",
   "sectionsCount": 3,
        "questionsCount": 50,
   "totalPoints": 100.0
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

### 2. Get Exam by ID
**Endpoint:** `GET /api/Assessment/exams/{id}`

**Method:** GET

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Exam ID |

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "titleEn": "Final Exam",
    "titleAr": "???????? ???????",
    "descriptionEn": "Comprehensive final examination",
 "descriptionAr": "?????? ????? ????",
    "startAt": "2024-01-15T09:00:00Z",
    "endAt": "2024-01-15T12:00:00Z",
    "durationMinutes": 120,
    "maxAttempts": 2,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "passScore": 60.0,
    "isPublished": true,
    "isActive": true,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": "2024-01-10T00:00:00Z",
    "sectionsCount": 3,
    "questionsCount": 50,
    "totalPoints": 100.0,
    "sections": [
    {
        "id": 1,
        "examId": 1,
        "titleEn": "Section 1",
        "titleAr": "????? ?????",
        "order": 1,
        "durationMinutes": 40,
        "questionsCount": 15,
        "totalPoints": 30.0,
        "questions": []
      }
    ],
  "instructions": [
      {
     "id": 1,
  "examId": 1,
        "contentEn": "Read all questions carefully",
        "contentAr": "???? ???? ??????? ??????",
        "order": 1,
    "createdDate": "2024-01-01T00:00:00Z"
      }
  ],
    "accessPolicy": {
      "id": 1,
      "examId": 1,
   "isPublic": false,
      "accessCode": "ABC123",
      "restrictToAssignedCandidates": true,
      "createdDate": "2024-01-01T00:00:00Z"
    }
  },
  "errors": []
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Exam not found",
  "data": null,
  "errors": []
}
```

---

### 3. Create Exam
**Endpoint:** `POST /api/Assessment/exams`

**Method:** POST

**Request Body:**
```json
{
  "titleEn": "string (required)",
  "titleAr": "string (required)",
  "descriptionEn": "string (optional)",
  "descriptionAr": "string (optional)",
  "startAt": "2024-01-15T09:00:00Z (optional)",
  "endAt": "2024-01-15T12:00:00Z (optional)",
  "durationMinutes": 120,
  "maxAttempts": 1,
  "shuffleQuestions": false,
  "shuffleOptions": false,
  "passScore": 60.0,
  "isActive": true
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| titleEn | Required, Max 500 characters |
| titleAr | Required, Max 500 characters |
| descriptionEn | Max 2000 characters |
| descriptionAr | Max 2000 characters |
| durationMinutes | Required, 1-600 minutes |
| maxAttempts | 0 (unlimited) or greater |
| passScore | 0 or greater |
| endAt | Must be after startAt if both provided |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": { /* ExamDto */ },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
"errors": ["English title is required", "Duration must be greater than 0"]
}
```

---

### 4. Update Exam
**Endpoint:** `PUT /api/Assessment/exams/{id}`

**Method:** PUT

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | int | Yes | Exam ID |

**Request Body:** Same as Create Exam

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam updated successfully",
  "data": { /* ExamDto */ },
  "errors": []
}
```

---

### 5. Delete Exam (Soft Delete)
**Endpoint:** `DELETE /api/Assessment/exams/{id}`

**Method:** DELETE

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 6. Publish Exam
**Endpoint:** `POST /api/Assessment/exams/{id}/publish`

**Method:** POST

**Notes:** Exam must pass validation before publishing

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam published successfully",
  "data": { /* ExamDto */ },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot publish exam",
  "data": null,
  "errors": ["Exam must have at least one section", "Exam must have at least one question"]
}
```

---

### 7. Unpublish Exam
**Endpoint:** `POST /api/Assessment/exams/{id}/unpublish`

**Method:** POST

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam unpublished successfully",
  "data": { /* ExamDto */ },
  "errors": []
}
```

---

### 8. Toggle Exam Status
**Endpoint:** `POST /api/Assessment/exams/{id}/toggle-status`

**Method:** POST

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam status toggled successfully",
  "data": { /* ExamDto */ },
  "errors": []
}
```

---

### 9. Validate Exam for Publishing
**Endpoint:** `GET /api/Assessment/exams/{id}/validate`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam is valid for publishing",
  "data": {
    "isValid": true,
    "errors": []
  },
  "errors": []
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Exam validation failed",
  "data": {
  "isValid": false,
 "errors": ["Exam has no sections", "Total points is 0"]
  },
  "errors": []
}
```

---

## Exam Sections

### 1. Get Exam Sections
**Endpoint:** `GET /api/Assessment/exams/{examId}/sections`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
    "examId": 1,
      "titleEn": "Multiple Choice",
      "titleAr": "?????? ?? ?????",
      "descriptionEn": "Answer all questions",
      "descriptionAr": "??? ??? ???? ???????",
      "order": 1,
      "durationMinutes": 30,
    "totalPointsOverride": null,
      "createdDate": "2024-01-01T00:00:00Z",
      "questionsCount": 20,
      "totalPoints": 40.0,
      "questions": []
}
  ],
  "errors": []
}
```

---

### 2. Get Section by ID
**Endpoint:** `GET /api/Assessment/sections/{sectionId}`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": { /* ExamSectionDto */ },
  "errors": []
}
```

---

### 3. Create Section
**Endpoint:** `POST /api/Assessment/exams/{examId}/sections`

**Method:** POST

**Request Body:**
```json
{
  "titleEn": "string (required)",
  "titleAr": "string (required)",
  "descriptionEn": "string (optional)",
  "descriptionAr": "string (optional)",
  "order": 1,
  "durationMinutes": 30,
  "totalPointsOverride": null
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| titleEn | Required, Max 500 characters |
| titleAr | Required, Max 500 characters |
| descriptionEn | Max 2000 characters |
| descriptionAr | Max 2000 characters |
| order | 0 or greater |
| durationMinutes | If provided, must be > 0 |
| totalPointsOverride | If provided, must be > 0 |

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Section created successfully",
  "data": { /* ExamSectionDto */ },
  "errors": []
}
```

---

### 4. Update Section
**Endpoint:** `PUT /api/Assessment/sections/{sectionId}`

**Method:** PUT

**Request Body:** Same as Create Section

---

### 5. Delete Section
**Endpoint:** `DELETE /api/Assessment/sections/{sectionId}`

**Method:** DELETE

---

### 6. Reorder Sections
**Endpoint:** `POST /api/Assessment/exams/{examId}/sections/reorder`

**Method:** POST

**Request Body:**
```json
[
  { "sectionId": 1, "newOrder": 0 },
  { "sectionId": 2, "newOrder": 1 },
  { "sectionId": 3, "newOrder": 2 }
]
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| sectionId | Required, Must be > 0 |
| newOrder | Must be >= 0 |

---

## Exam Questions

### 1. Get Section Questions
**Endpoint:** `GET /api/Assessment/sections/{sectionId}/questions`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
    "examId": 1,
   "examSectionId": 1,
      "questionId": 10,
      "order": 0,
      "points": 2.0,
      "isRequired": true,
      "createdDate": "2024-01-01T00:00:00Z",
      "questionBody": "What is 2+2?",
      "questionTypeName": "Multiple Choice",
      "difficultyLevelName": "Easy",
      "originalPoints": 2.0
    }
  ],
  "errors": []
}
```

---

### 2. Add Question to Section
**Endpoint:** `POST /api/Assessment/sections/{sectionId}/questions`

**Method:** POST

**Request Body:**
```json
{
  "questionId": 10,
  "order": 0,
  "pointsOverride": null,
  "isRequired": true
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| questionId | Required, Must be > 0 |
| order | Must be >= 0 |
| pointsOverride | If provided, must be > 0 |

---

### 3. Bulk Add Questions
**Endpoint:** `POST /api/Assessment/sections/{sectionId}/questions/bulk`

**Method:** POST

**Request Body:**
```json
{
  "questionIds": [10, 11, 12, 13],
  "useOriginalPoints": true,
  "markAsRequired": true
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| questionIds | Required, At least one ID, All IDs must be > 0 |

---

### 4. Update Exam Question
**Endpoint:** `PUT /api/Assessment/exam-questions/{examQuestionId}`

**Method:** PUT

**Request Body:**
```json
{
  "order": 1,
  "points": 3.0,
  "isRequired": true
}
```

**Validation Requirements:**
| Field | Rules |
|-------|-------|
| order | Must be >= 0 |
| points | Must be > 0 |

---

### 5. Remove Question from Exam
**Endpoint:** `DELETE /api/Assessment/exam-questions/{examQuestionId}`

**Method:** DELETE

---

### 6. Reorder Questions
**Endpoint:** `POST /api/Assessment/sections/{sectionId}/questions/reorder`

**Method:** POST

**Request Body:**
```json
[
  { "examQuestionId": 1, "newOrder": 0 },
  { "examQuestionId": 2, "newOrder": 1 }
]
```

---

## Access Policy

### 1. Get Access Policy
**Endpoint:** `GET /api/Assessment/exams/{examId}/access-policy`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
 "id": 1,
    "examId": 1,
    "isPublic": false,
    "accessCode": "ABC123",
    "restrictToAssignedCandidates": true,
    "createdDate": "2024-01-01T00:00:00Z",
    "updatedDate": null
},
  "errors": []
}
```

---

### 2. Save Access Policy
**Endpoint:** `PUT /api/Assessment/exams/{examId}/access-policy`

**Method:** PUT

**Request Body:**
```json
{
  "isPublic": false,
  "accessCode": "ABC123",
  "restrictToAssignedCandidates": true
}
```

**Notes:**
- If `isPublic` is true, anyone can access the exam
- `accessCode` is required when exam is not public
- `restrictToAssignedCandidates` limits access to pre-assigned users

---

## Instructions

### 1. Get Exam Instructions
**Endpoint:** `GET /api/Assessment/exams/{examId}/instructions`

**Method:** GET

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "examId": 1,
      "contentEn": "Read all questions carefully before answering",
      "contentAr": "???? ???? ??????? ?????? ??? ???????",
      "order": 0,
      "createdDate": "2024-01-01T00:00:00Z"
    }
  ],
  "errors": []
}
```

---

### 2. Create Instruction
**Endpoint:** `POST /api/Assessment/exams/{examId}/instructions`

**Method:** POST

**Request Body:**
```json
{
  "contentEn": "string (required)",
  "contentAr": "string (required)",
  "order": 0
}
```

---

### 3. Update Instruction
**Endpoint:** `PUT /api/Assessment/instructions/{instructionId}`

**Method:** PUT

**Request Body:**
```json
{
  "contentEn": "string (required)",
  "contentAr": "string (required)",
  "order": 0
}
```

---

### 4. Delete Instruction
**Endpoint:** `DELETE /api/Assessment/instructions/{instructionId}`

**Method:** DELETE

---

### 5. Reorder Instructions
**Endpoint:** `POST /api/Assessment/exams/{examId}/instructions/reorder`

**Method:** POST

**Request Body:**
```json
[
  { "instructionId": 1, "newOrder": 0 },
  { "instructionId": 2, "newOrder": 1 }
]
```

---

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": ["Field-specific error messages"]
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
