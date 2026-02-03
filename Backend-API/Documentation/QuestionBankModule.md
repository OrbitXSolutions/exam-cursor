# QuestionBank Module Documentation

## Overview

The QuestionBank module provides a complete question management system for assessments, exams, and quizzes. It includes **Questions**, **Question Options** (for MCQ/True-False), **Question Attachments** (for images/PDFs), and **Question Answer Keys** (for ShortAnswer/Essay/Numeric types). This module integrates with the Lookups module for Question Types and Categories.

---

## 📁 Module Structure

```
Smart_Core/
├── Controllers/
│   └── QuestionBank/
│       └── QuestionBankController.cs
├── Application/
│   ├── DTOs/
│   │   └── QuestionBank/
│       ├── QuestionDtos.cs
│   │       ├── QuestionOptionDtos.cs
│   │    ├── QuestionAttachmentDtos.cs
│   │       └── QuestionAnswerKeyDtos.cs
│   ├── Interfaces/
│   │   └── QuestionBank/
│   │       └── IQuestionBankService.cs
│   └── Validators/
│     └── QuestionBank/
│    ├── QuestionValidators.cs
│        ├── QuestionOptionValidators.cs
│     ├── QuestionAttachmentValidators.cs
│  └── QuestionAnswerKeyValidators.cs
├── Domain/
│   └── Entities/
│   │   └── QuestionBank/
│   │    ├── Question.cs
│   │       ├── QuestionOption.cs
│   │       ├── QuestionAttachment.cs
│   │       └── QuestionAnswerKey.cs
│   └── Enums/
│ └── DifficultyLevel.cs
└── Infrastructure/
    └── Data/
 │   └── Configurations/
        │       └── QuestionBank/
        │      ├── QuestionConfiguration.cs
        │    ├── QuestionOptionConfiguration.cs
 │           ├── QuestionAttachmentConfiguration.cs
      │           └── QuestionAnswerKeyConfiguration.cs
        └── Services/
  └── QuestionBank/
  └── QuestionBankService.cs
```

---

## 🎚️ Difficulty Level Enum

```csharp
namespace Smart_Core.Domain.Enums;

public enum DifficultyLevel
{
    Easy = 1,
    Medium = 2,
    Hard = 3
}
```

| Value | Name | Description |
|-------|------|-------------|
| 1 | Easy | Beginner level questions |
| 2 | Medium | Intermediate level questions |
| 3 | Hard | Advanced level questions |

---

## 📦 Domain Entities

### Question

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| Body | string | Question text/HTML (max 5000 chars) |
| QuestionTypeId | int | FK to QuestionType |
| QuestionCategoryId | int | FK to QuestionCategory |
| Points | decimal | Score value (precision 10,2) |
| DifficultyLevel | DifficultyLevel | Easy/Medium/Hard |
| IsActive | bool | Active status (default: true) |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag |
| Options | ICollection | Question options (MCQ/TrueFalse) |
| Attachments | ICollection | Question attachments |
| AnswerKey | QuestionAnswerKey? | Answer key (ShortAnswer/Essay/Numeric) |

### QuestionOption

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| QuestionId | int | FK to Question |
| Text | string | Option text (max 1000 chars) |
| IsCorrect | bool | Whether this is a correct answer |
| Order | int | Display order |
| AttachmentPath | string? | Optional image/PDF path |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag |

### QuestionAttachment

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| QuestionId | int | FK to Question |
| FileName | string | Original file name (max 255 chars) |
| FilePath | string | Storage path (max 1000 chars) |
| FileType | string | "Image" or "PDF" |
| FileSize | long | File size in bytes |
| IsPrimary | bool | Primary attachment flag |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag |

### QuestionAnswerKey (NEW)

Stores the correct answer definition for non-MCQ question types (ShortAnswer, Essay, Numeric).

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| QuestionId | int | FK to Question (unique, one-to-zero-or-one) |
| AcceptedAnswersJson | string? | JSON array of accepted answers for ShortAnswer |
| CaseSensitive | bool | Case-sensitive comparison (default: false) |
| TrimSpaces | bool | Trim leading/trailing spaces (default: true) |
| NormalizeWhitespace | bool | Collapse multiple spaces (default: true) |
| RubricTextEn | string? | English grading rubric/model answer for Essay |
| RubricTextAr | string? | Arabic grading rubric/model answer for Essay |
| NumericAnswer | decimal? | Correct numeric answer (future-proof) |
| Tolerance | decimal? | Acceptable tolerance for numeric answers |
| CreatedDate | DateTime | Creation timestamp |
| UpdatedDate | DateTime? | Last update timestamp |
| CreatedBy | string? | User ID who created |
| UpdatedBy | string? | User ID who last updated |
| DeletedBy | string? | User ID who deleted |
| IsDeleted | bool | Soft delete flag |

---

## 🔗 Entity Relationships

```
┌───────────────────┐       ┌───────────────────┐
│  QuestionType   │  │QuestionCategory │
│    (Lookup)   │  │    (Lookup)     │
└───────────────────┘       └───────────────────┘
     │  │
   │ 1   │ 1
         │ │
  │ *      │ *
┌──────────────────────────────────────────────┐
│ Question   │
│  - Body         │
│  - Points     │
│  - DifficultyLevel    │
│  - IsActive  │
└──────────────────────────────────────────────┘
       │ │ │
         │ 1   │ 1  │ 1
  │         │        │
         │ *      │ *     │ 0..1
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ QuestionOption  │  │QuestionAttachment│   │QuestionAnswerKey │
│  - Text  │     │  - FileName      │  │ - AcceptedAnswersJson│
│  - IsCorrect    │ │  - FilePath      │   │ - RubricText    |
│  - Order        │       │  - FileType  │   │ - NumericAnswer   |
└───────────────────┘       │  - IsPrimary     │   └───────────────────┘
   └───────────────────┘
```

---

## 📋 QuestionAnswerKey Business Rules

### Correct Answer Storage by Question Type

| Question Type | Correct Answer Location | QuestionAnswerKey |
|---------------|------------------------|-------------------|
| MCQ_Single | `QuestionOption.IsCorrect` | Must be **null/absent** |
| MCQ_Multi | `QuestionOption.IsCorrect` | Must be **null/absent** |
| TrueFalse | `QuestionOption.IsCorrect` | Must be **null/absent** |
| ShortAnswer | `QuestionAnswerKey.AcceptedAnswersJson` | **Required** |
| Essay | `QuestionAnswerKey.RubricText*` | **Recommended** |
| Numeric | `QuestionAnswerKey.NumericAnswer` | **Required** |

### Relationship Rules

- **One-to-Zero-or-One**: Each Question can have at most one QuestionAnswerKey.
- **Optional for MCQ/TrueFalse**: These types store correctness in `QuestionOption.IsCorrect`.
- **Required for ShortAnswer**: Must have at least one accepted answer in `AcceptedAnswersJson`.
- **Recommended for Essay**: Should have rubric/model answer for graders.

### Validation Rules

#### For ShortAnswer Questions:
- `AcceptedAnswersJson` is **required** and must be a valid JSON array.
- Array must contain at least one non-empty string.
- Example: `["Paris", "paris", "PARIS"]`

#### For Essay Questions:
- At least one of `RubricTextEn` or `RubricTextAr` should be provided.
- If both are empty, allow but log a warning (manual grading with no guidance).

#### For Numeric Questions:
- `NumericAnswer` is **required**.
- `Tolerance` is optional (default: exact match, i.e., 0).

#### For MCQ/TrueFalse Questions:
- **Prevent** creation of QuestionAnswerKey.
- Return validation error if attempted.

### ShortAnswer Comparison Rules

When comparing candidate answers to accepted answers:

```csharp
// Normalization Process:
1. If TrimSpaces = true:  answer = answer.Trim()
2. If NormalizeWhitespace = true:  answer = Regex.Replace(answer, @"\s+", " ")
3. If CaseSensitive = false:  answer = answer.ToLowerInvariant()

// Comparison:
bool isCorrect = acceptedAnswers.Any(accepted => 
Normalize(accepted) == Normalize(candidateAnswer));
```

**Example:**

| Setting | Candidate Input | Accepted Answer | Match? |
|---------|----------------|-----------------|--------|
| CaseSensitive=false | "PARIS" | "paris" | ✅ Yes |
| CaseSensitive=true | "PARIS" | "paris" | ❌ No |
| TrimSpaces=true | "  Paris  " | "Paris" | ✅ Yes |
| NormalizeWhitespace=true | "New  York" | "New York" | ✅ Yes |

### Numeric Answer Comparison

```csharp
// With Tolerance:
bool isCorrect = Math.Abs(candidateAnswer - NumericAnswer) <= Tolerance;

// Example: NumericAnswer=10, Tolerance=0.5
// Correct range: 9.5 to 10.5
```

### Security Rules

⚠️ **CRITICAL: Answer Key Protection**

- **Never expose** `QuestionAnswerKey` data to candidate-facing endpoints.
- Only Admin/Instructor roles should access answer keys.
- Candidate exam endpoints must exclude answer key data.
- Use separate DTOs for admin vs. candidate responses.

```csharp
// Admin DTO - includes answer key
public class QuestionAdminDto
{
    // ... question properties
    public QuestionAnswerKeyDto? AnswerKey { get; set; }
}

// Candidate DTO - NO answer key
public class QuestionCandidateDto
{
    // ... question properties only
    // NO AnswerKey property
}
```

---

## 🔐 Authorization

All endpoints require **Admin** role authentication.

```csharp
[Authorize(Roles = AppRoles.Admin)]
```

---

## 🌐 API Endpoints

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questionbank/questions` | Get all with pagination, search & filters |
| GET | `/api/questionbank/questions/{id}` | Get by ID with options & attachments |
| POST | `/api/questionbank/questions` | Create new question with options |
| PUT | `/api/questionbank/questions/{id}` | Update question |
| DELETE | `/api/questionbank/questions/{id}` | Hard delete question |
| PATCH | `/api/questionbank/questions/{id}/toggle-status` | Toggle active status |

### Question Options

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questionbank/questions/{questionId}/options` | Get all options for a question |
| POST | `/api/questionbank/questions/{questionId}/options` | Add option to question |
| PUT | `/api/questionbank/options/{optionId}` | Update option |
| DELETE | `/api/questionbank/options/{optionId}` | Delete option |
| PUT | `/api/questionbank/questions/{questionId}/options/bulk` | Bulk update options |

### Question Attachments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questionbank/questions/{questionId}/attachments` | Get all attachments |
| POST | `/api/questionbank/questions/{questionId}/attachments` | Add attachment |
| PUT | `/api/questionbank/attachments/{attachmentId}` | Update attachment |
| DELETE | `/api/questionbank/attachments/{attachmentId}` | Delete attachment |
| PATCH | `/api/questionbank/attachments/{attachmentId}/set-primary` | Set as primary |

### Question Answer Keys (NEW - Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questionbank/questions/{questionId}/answer-key` | Get answer key |
| PUT | `/api/questionbank/questions/{questionId}/answer-key` | Create/Update answer key |
| DELETE | `/api/questionbank/questions/{questionId}/answer-key` | Delete answer key |

---

## ?? API Examples

### Authentication Header

All requests require a JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 1. Get All Questions (with filters)

**Request:**
```http
GET /api/questionbank/questions?PageNumber=1&PageSize=10&QuestionTypeId=1&DifficultyLevel=2&IsActive=true&Search=python
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Search | string | null | Search in question body |
| QuestionTypeId | int? | null | Filter by question type |
| QuestionCategoryId | int? | null | Filter by category |
| DifficultyLevel | int? | null | Filter by difficulty (1=Easy, 2=Medium, 3=Hard) |
| IsActive | bool? | null | Filter by active status |
| IncludeDeleted | bool | false | Include soft-deleted records |
| PageNumber | int | 1 | Page number |
| PageSize | int | 10 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
        "id": 1,
        "body": "What is the output of print(2 ** 3) in Python?",
        "questionTypeName": "MCQ_Single",
   "questionCategoryName": "Programming",
        "points": 5.00,
        "difficultyLevelName": "Medium",
        "isActive": true,
   "createdDate": "2024-01-15T10:30:00Z",
    "optionsCount": 4,
 "attachmentsCount": 1
      },
      {
        "id": 2,
        "body": "Which of the following are valid Python data types?",
        "questionTypeName": "MCQ_Multi",
        "questionCategoryName": "Programming",
  "points": 10.00,
        "difficultyLevelName": "Hard",
        "isActive": true,
   "createdDate": "2024-01-14T09:00:00Z",
        "optionsCount": 5,
        "attachmentsCount": 0
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 2,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "errors": []
}
```

---

### 2. Get Question by ID (with options & attachments)

**Request:**
```http
GET /api/questionbank/questions/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
"body": "What is the output of print(2 ** 3) in Python?",
    "questionTypeId": 1,
    "questionTypeName": "MCQ_Single",
    "questionCategoryId": 5,
    "questionCategoryName": "Programming",
    "points": 5.00,
    "difficultyLevel": 2,
    "difficultyLevelName": "Medium",
    "isActive": true,
    "createdDate": "2024-01-15T10:30:00Z",
    "updatedDate": null,
    "isDeleted": false,
    "options": [
      {
        "id": 1,
 "questionId": 1,
 "text": "6",
        "isCorrect": false,
      "order": 1,
        "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
      "id": 2,
        "questionId": 1,
        "text": "8",
        "isCorrect": true,
        "order": 2,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": 3,
        "questionId": 1,
        "text": "9",
        "isCorrect": false,
"order": 3,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": 4,
        "questionId": 1,
        "text": "5",
        "isCorrect": false,
      "order": 4,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      }
    ],
    "attachments": [
      {
        "id": 1,
        "questionId": 1,
     "fileName": "python_code.png",
        "filePath": "/media/questions/1/python_code.png",
        "fileType": "Image",
        "fileSize": 45678,
   "isPrimary": true,
 "createdDate": "2024-01-15T10:35:00Z"
      }
    ]
  },
  "errors": []
}
```

---

### 3. Create Question with Options

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "What is the capital of France?",
  "questionTypeId": 1,
  "questionCategoryId": 3,
  "points": 5.00,
  "difficultyLevel": 1,
  "isActive": true,
  "options": [
    {
      "text": "London",
      "isCorrect": false,
      "order": 1,
      "attachmentPath": null
    },
    {
    "text": "Paris",
      "isCorrect": true,
      "order": 2,
      "attachmentPath": null
    },
    {
      "text": "Berlin",
      "isCorrect": false,
      "order": 3,
      "attachmentPath": null
    },
    {
      "text": "Madrid",
      "isCorrect": false,
      "order": 4,
    "attachmentPath": null
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 3,
    "body": "What is the capital of France?",
    "questionTypeId": 1,
 "questionTypeName": "MCQ_Single",
    "questionCategoryId": 3,
    "questionCategoryName": "Geography",
    "points": 5.00,
    "difficultyLevel": 1,
    "difficultyLevelName": "Easy",
    "isActive": true,
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": null,
    "isDeleted": false,
    "options": [
      {
   "id": 5,
        "questionId": 3,
        "text": "London",
  "isCorrect": false,
        "order": 1,
        "attachmentPath": null,
        "createdDate": "2024-01-15T12:00:00Z"
    },
 {
        "id": 6,
 "questionId": 3,
     "text": "Paris",
        "isCorrect": true,
        "order": 2,
        "attachmentPath": null,
    "createdDate": "2024-01-15T12:00:00Z"
      },
      {
        "id": 7,
        "questionId": 3,
        "text": "Berlin",
        "isCorrect": false,
        "order": 3,
     "attachmentPath": null,
        "createdDate": "2024-01-15T12:00:00Z"
      },
      {
        "id": 8,
    "questionId": 3,
        "text": "Madrid",
   "isCorrect": false,
   "order": 4,
        "attachmentPath": null,
   "createdDate": "2024-01-15T12:00:00Z"
      }
    ],
 "attachments": []
  },
  "errors": []
}
```

---

### 4. Create True/False Question

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "The Earth is flat.",
  "questionTypeId": 3,
  "questionCategoryId": 4,
  "points": 2.00,
  "difficultyLevel": 1,
  "isActive": true,
  "options": [
    {
      "text": "True",
"isCorrect": false,
      "order": 1
    },
    {
      "text": "False",
      "isCorrect": true,
"order": 2
    }
  ]
}
```

---

### 5. Create Short Answer Question (No Options)

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "Explain the concept of polymorphism in object-oriented programming.",
  "questionTypeId": 4,
  "questionCategoryId": 5,
  "points": 15.00,
  "difficultyLevel": 3,
  "isActive": true,
  "options": []
}
```

---

### 6. Update Question

**Request:**
```http
PUT /api/questionbank/questions/3
Content-Type: application/json

{
  "body": "What is the capital city of France?",
  "questionTypeId": 1,
  "questionCategoryId": 3,
  "points": 10.00,
  "difficultyLevel": 2,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 3,
 "body": "What is the capital city of France?",
    "questionTypeId": 1,
    "questionTypeName": "MCQ_Single",
    "questionCategoryId": 3,
    "questionCategoryName": "Geography",
    "points": 10.00,
    "difficultyLevel": 2,
    "difficultyLevelName": "Medium",
    "isActive": true,
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": "2024-01-15T14:30:00Z",
    "isDeleted": false,
    "options": [...],
    "attachments": []
  },
  "errors": []
}
```

---

### 7. Toggle Question Status

**Request:**
```http
PATCH /api/questionbank/questions/3/toggle-status
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deactivated successfully",
  "data": true,
  "errors": []
}
```

---

### 8. Delete Question (Hard Delete)

**Request:**
```http
DELETE /api/questionbank/questions/3
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 9. Add Option to Question

**Request:**
```http
POST /api/questionbank/questions/1/options
Content-Type: application/json

{
  "text": "None of the above",
  "isCorrect": false,
  "order": 5,
  "attachmentPath": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Option added successfully",
  "data": {
    "id": 9,
    "questionId": 1,
    "text": "None of the above",
    "isCorrect": false,
    "order": 5,
    "attachmentPath": null,
    "createdDate": "2024-01-15T15:00:00Z"
  },
  "errors": []
}
```

---

### 10. Bulk Update Options

**Request:**
```http
PUT /api/questionbank/questions/1/options/bulk
Content-Type: application/json

[
  {
    "id": 1,
    "text": "Six",
    "isCorrect": false,
    "order": 1
  },
  {
    "id": 2,
    "text": "Eight",
    "isCorrect": true,
    "order": 2
  },
  {
    "id": 0,
    "text": "New Option",
    "isCorrect": false,
    "order": 5
  }
]
```

**Note:** Options with `id: 0` will be created as new options.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "questionId": 1,
      "text": "Six",
      "isCorrect": false,
      "order": 1,
      "attachmentPath": null,
      "createdDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "questionId": 1,
      "text": "Eight",
      "isCorrect": true,
      "order": 2,
      "attachmentPath": null,
      "createdDate": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "errors": []
}
```

---

### 11. Add Attachment to Question

**Request:**
```http
POST /api/questionbank/questions/1/attachments
Content-Type: application/json

{
  "fileName": "diagram.pdf",
  "filePath": "/media/questions/1/diagram.pdf",
  "fileType": "PDF",
  "fileSize": 125000,
  "isPrimary": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Attachment added successfully",
  "data": {
    "id": 2,
    "questionId": 1,
    "fileName": "diagram.pdf",
 "filePath": "/media/questions/1/diagram.pdf",
    "fileType": "PDF",
    "fileSize": 125000,
    "isPrimary": false,
    "createdDate": "2024-01-15T16:00:00Z"
  },
  "errors": []
}
```

---

### 12. Set Primary Attachment

**Request:**
```http
PATCH /api/questionbank/attachments/2/set-primary
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Primary attachment set successfully",
"data": true,
  "errors": []
}
```

---

## ?? API Examples

### Authentication Header

All requests require a JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 1. Get All Questions (with filters)

**Request:**
```http
GET /api/questionbank/questions?PageNumber=1&PageSize=10&QuestionTypeId=1&DifficultyLevel=2&IsActive=true&Search=python
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| Search | string | null | Search in question body |
| QuestionTypeId | int? | null | Filter by question type |
| QuestionCategoryId | int? | null | Filter by category |
| DifficultyLevel | int? | null | Filter by difficulty (1=Easy, 2=Medium, 3=Hard) |
| IsActive | bool? | null | Filter by active status |
| IncludeDeleted | bool | false | Include soft-deleted records |
| PageNumber | int | 1 | Page number |
| PageSize | int | 10 | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "items": [
      {
        "id": 1,
        "body": "What is the output of print(2 ** 3) in Python?",
        "questionTypeName": "MCQ_Single",
   "questionCategoryName": "Programming",
        "points": 5.00,
        "difficultyLevelName": "Medium",
        "isActive": true,
   "createdDate": "2024-01-15T10:30:00Z",
    "optionsCount": 4,
 "attachmentsCount": 1
      },
      {
        "id": 2,
        "body": "Which of the following are valid Python data types?",
        "questionTypeName": "MCQ_Multi",
        "questionCategoryName": "Programming",
  "points": 10.00,
        "difficultyLevelName": "Hard",
        "isActive": true,
   "createdDate": "2024-01-14T09:00:00Z",
        "optionsCount": 5,
        "attachmentsCount": 0
      }
    ],
    "pageNumber": 1,
    "pageSize": 10,
    "totalCount": 2,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "errors": []
}
```

---

### 2. Get Question by ID (with options & attachments)

**Request:**
```http
GET /api/questionbank/questions/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
"body": "What is the output of print(2 ** 3) in Python?",
    "questionTypeId": 1,
    "questionTypeName": "MCQ_Single",
    "questionCategoryId": 5,
    "questionCategoryName": "Programming",
    "points": 5.00,
    "difficultyLevel": 2,
    "difficultyLevelName": "Medium",
    "isActive": true,
    "createdDate": "2024-01-15T10:30:00Z",
    "updatedDate": null,
    "isDeleted": false,
    "options": [
      {
        "id": 1,
 "questionId": 1,
 "text": "6",
        "isCorrect": false,
      "order": 1,
        "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
      "id": 2,
        "questionId": 1,
        "text": "8",
        "isCorrect": true,
        "order": 2,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": 3,
        "questionId": 1,
        "text": "9",
        "isCorrect": false,
"order": 3,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": 4,
        "questionId": 1,
        "text": "5",
        "isCorrect": false,
      "order": 4,
     "attachmentPath": null,
        "createdDate": "2024-01-15T10:30:00Z"
      }
    ],
    "attachments": [
      {
        "id": 1,
        "questionId": 1,
     "fileName": "python_code.png",
        "filePath": "/media/questions/1/python_code.png",
        "fileType": "Image",
        "fileSize": 45678,
   "isPrimary": true,
 "createdDate": "2024-01-15T10:35:00Z"
      }
    ]
  },
  "errors": []
}
```

---

### 3. Create Question with Options

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "What is the capital of France?",
  "questionTypeId": 1,
  "questionCategoryId": 3,
  "points": 5.00,
  "difficultyLevel": 1,
  "isActive": true,
  "options": [
    {
      "text": "London",
      "isCorrect": false,
      "order": 1,
      "attachmentPath": null
    },
    {
    "text": "Paris",
      "isCorrect": true,
      "order": 2,
      "attachmentPath": null
    },
    {
      "text": "Berlin",
      "isCorrect": false,
      "order": 3,
      "attachmentPath": null
    },
    {
      "text": "Madrid",
      "isCorrect": false,
      "order": 4,
    "attachmentPath": null
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 3,
    "body": "What is the capital of France?",
    "questionTypeId": 1,
 "questionTypeName": "MCQ_Single",
    "questionCategoryId": 3,
    "questionCategoryName": "Geography",
    "points": 5.00,
    "difficultyLevel": 1,
    "difficultyLevelName": "Easy",
    "isActive": true,
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": null,
    "isDeleted": false,
    "options": [
      {
   "id": 5,
        "questionId": 3,
        "text": "London",
  "isCorrect": false,
        "order": 1,
        "attachmentPath": null,
        "createdDate": "2024-01-15T12:00:00Z"
    },
 {
        "id": 6,
 "questionId": 3,
     "text": "Paris",
        "isCorrect": true,
        "order": 2,
        "attachmentPath": null,
    "createdDate": "2024-01-15T12:00:00Z"
      },
      {
        "id": 7,
        "questionId": 3,
        "text": "Berlin",
        "isCorrect": false,
        "order": 3,
     "attachmentPath": null,
        "createdDate": "2024-01-15T12:00:00Z"
      },
      {
        "id": 8,
    "questionId": 3,
        "text": "Madrid",
   "isCorrect": false,
   "order": 4,
        "attachmentPath": null,
   "createdDate": "2024-01-15T12:00:00Z"
      }
    ],
 "attachments": []
  },
  "errors": []
}
```

---

### 4. Create True/False Question

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "The Earth is flat.",
  "questionTypeId": 3,
  "questionCategoryId": 4,
  "points": 2.00,
  "difficultyLevel": 1,
  "isActive": true,
  "options": [
    {
      "text": "True",
"isCorrect": false,
      "order": 1
    },
    {
      "text": "False",
      "isCorrect": true,
"order": 2
    }
  ]
}
```

---

### 5. Create Short Answer Question (No Options)

**Request:**
```http
POST /api/questionbank/questions
Content-Type: application/json

{
  "body": "Explain the concept of polymorphism in object-oriented programming.",
  "questionTypeId": 4,
  "questionCategoryId": 5,
  "points": 15.00,
  "difficultyLevel": 3,
  "isActive": true,
  "options": []
}
```

---

### 6. Update Question

**Request:**
```http
PUT /api/questionbank/questions/3
Content-Type: application/json

{
  "body": "What is the capital city of France?",
  "questionTypeId": 1,
  "questionCategoryId": 3,
  "points": 10.00,
  "difficultyLevel": 2,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 3,
 "body": "What is the capital city of France?",
    "questionTypeId": 1,
    "questionTypeName": "MCQ_Single",
    "questionCategoryId": 3,
    "questionCategoryName": "Geography",
    "points": 10.00,
    "difficultyLevel": 2,
    "difficultyLevelName": "Medium",
    "isActive": true,
    "createdDate": "2024-01-15T12:00:00Z",
    "updatedDate": "2024-01-15T14:30:00Z",
    "isDeleted": false,
    "options": [...],
    "attachments": []
  },
  "errors": []
}
```

---

### 7. Toggle Question Status

**Request:**
```http
PATCH /api/questionbank/questions/3/toggle-status
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deactivated successfully",
  "data": true,
  "errors": []
}
```

---

### 8. Delete Question (Hard Delete)

**Request:**
```http
DELETE /api/questionbank/questions/3
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": true,
  "errors": []
}
```

---

### 9. Add Option to Question

**Request:**
```http
POST /api/questionbank/questions/1/options
Content-Type: application/json

{
  "text": "None of the above",
  "isCorrect": false,
  "order": 5,
  "attachmentPath": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Option added successfully",
  "data": {
    "id": 9,
    "questionId": 1,
    "text": "None of the above",
    "isCorrect": false,
    "order": 5,
    "attachmentPath": null,
    "createdDate": "2024-01-15T15:00:00Z"
  },
  "errors": []
}
```

---

### 10. Bulk Update Options

**Request:**
```http
PUT /api/questionbank/questions/1/options/bulk
Content-Type: application/json

[
  {
    "id": 1,
    "text": "Six",
    "isCorrect": false,
    "order": 1
  },
  {
    "id": 2,
    "text": "Eight",
    "isCorrect": true,
    "order": 2
  },
  {
    "id": 0,
    "text": "New Option",
    "isCorrect": false,
    "order": 5
  }
]
```

**Note:** Options with `id: 0` will be created as new options.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": [
    {
      "id": 1,
      "questionId": 1,
      "text": "Six",
      "isCorrect": false,
      "order": 1,
      "attachmentPath": null,
      "createdDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "questionId": 1,
      "text": "Eight",
      "isCorrect": true,
      "order": 2,
      "attachmentPath": null,
      "createdDate": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "errors": []
}
```

---

### 11. Add Attachment to Question

**Request:**
```http
POST /api/questionbank/questions/1/attachments
Content-Type: application/json

{
  "fileName": "diagram.pdf",
  "filePath": "/media/questions/1/diagram.pdf",
  "fileType": "PDF",
  "fileSize": 125000,
  "isPrimary": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Attachment added successfully",
  "data": {
    "id": 2,
    "questionId": 1,
    "fileName": "diagram.pdf",
 "filePath": "/media/questions/1/diagram.pdf",
    "fileType": "PDF",
    "fileSize": 125000,
    "isPrimary": false,
    "createdDate": "2024-01-15T16:00:00Z"
  },
  "errors": []
}
```

---

### 12. Set Primary Attachment

**Request:**
```http
PATCH /api/questionbank/attachments/2/set-primary
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Primary attachment set successfully",
"data": true,
  "errors": []
}
```

---

## 📝 QuestionAnswerKey Entity Code

```csharp
using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities.QuestionBank;

/// <summary>
/// Stores the correct answer definition for non-MCQ question types.
/// MCQ/TrueFalse correctness is stored in QuestionOption.IsCorrect.
/// One-to-Zero-or-One relationship with Question.
/// </summary>
public class QuestionAnswerKey : BaseEntity
{
    public int Id { get; set; }

    /// <summary>
    /// Foreign key to Question. One AnswerKey per Question maximum.
    /// </summary>
    public int QuestionId { get; set; }

    #region ShortAnswer Properties

    /// <summary>
    /// JSON array of accepted answer strings for ShortAnswer questions.
    /// Example: ["answer1", "answer 1", "ans1"]
    /// </summary>
    public string? AcceptedAnswersJson { get; set; }

    /// <summary>
    /// If true, comparison is case-sensitive. Default: false.
    /// </summary>
    public bool CaseSensitive { get; set; } = false;

    /// <summary>
    /// If true, leading/trailing spaces are trimmed. Default: true.
    /// </summary>
    public bool TrimSpaces { get; set; } = true;

    /// <summary>
    /// If true, multiple consecutive spaces are collapsed. Default: true.
    /// </summary>
    public bool NormalizeWhitespace { get; set; } = true;

    #endregion

 #region Essay Properties

 /// <summary>
    /// Grading rubric or model answer in English for Essay questions.
    /// </summary>
    public string? RubricTextEn { get; set; }

    /// <summary>
    /// Grading rubric or model answer in Arabic for Essay questions.
    /// </summary>
    public string? RubricTextAr { get; set; }

    #endregion

    #region Numeric Properties (Future-Proof)

    /// <summary>
    /// The correct numeric answer for Numeric question types.
    /// </summary>
    public decimal? NumericAnswer { get; set; }

    /// <summary>
    /// Acceptable tolerance range for numeric answers.
    /// </summary>
    public decimal? Tolerance { get; set; }

    #endregion

// Navigation Property
    public virtual Question Question { get; set; } = null!;
}
```

---

## 🗄️ Database Configuration

### QuestionAnswerKey Table

```sql
CREATE TABLE QuestionAnswerKeys (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    QuestionId INT NOT NULL,
    AcceptedAnswersJson NVARCHAR(MAX),
    CaseSensitive BIT NOT NULL DEFAULT 0,
    TrimSpaces BIT NOT NULL DEFAULT 1,
    NormalizeWhitespace BIT NOT NULL DEFAULT 1,
    RubricTextEn NVARCHAR(MAX),
    RubricTextAr NVARCHAR(MAX),
    NumericAnswer DECIMAL(18,6),
    Tolerance DECIMAL(18,6),
    CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_QuestionAnswerKeys_Questions 
 FOREIGN KEY (QuestionId) REFERENCES Questions(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_QuestionAnswerKeys_QuestionId UNIQUE (QuestionId)
);

CREATE UNIQUE INDEX IX_QuestionAnswerKeys_QuestionId 
    ON QuestionAnswerKeys(QuestionId);
```

### All Tables

| Table | Description |
|-------|-------------|
| Questions | Main question table |
| QuestionOptions | Answer options for MCQ/True-False |
| QuestionAttachments | Images/PDFs attached to questions |
| QuestionAnswerKeys | Answer keys for ShortAnswer/Essay/Numeric |

### All Indexes

```sql
-- Questions
IX_Questions_QuestionTypeId
IX_Questions_QuestionCategoryId
IX_Questions_DifficultyLevel
IX_Questions_IsActive
IX_Questions_CreatedDate

-- QuestionOptions
IX_QuestionOptions_QuestionId
IX_QuestionOptions_QuestionId_Order
IX_QuestionOptions_QuestionId_IsCorrect

-- QuestionAttachments
IX_QuestionAttachments_QuestionId
IX_QuestionAttachments_QuestionId_IsPrimary

-- QuestionAnswerKeys
IX_QuestionAnswerKeys_QuestionId (Unique)
```

### Cascade Delete

- Deleting a Question will cascade delete all its Options, Attachments, and AnswerKey

### Query Filters

All entities have soft delete query filter:
```csharp
builder.HasQueryFilter(x => !x.IsDeleted);
```

---

## ✅ Validation Rules

### Question

| Field | Rule |
|-------|------|
| Body | Required, Max 5000 characters |
| QuestionTypeId | Required, Must be > 0 |
| QuestionCategoryId | Required, Must be > 0 |
| Points | Required, Must be > 0 and ≤ 1000 |
| DifficultyLevel | Required, Must be valid enum (1, 2, or 3) |

### QuestionOption

| Field | Rule |
|-------|------|
| Text | Required, Max 1000 characters |
| Order | Must be ≥ 0 |
| AttachmentPath | Optional, Max 1000 characters |

### QuestionAttachment

| Field | Rule |
|-------|------|
| FileName | Required, Max 255 characters |
| FilePath | Required, Max 1000 characters |
| FileType | Required, Must be "Image" or "PDF" |
| FileSize | Required, Must be > 0 and ≤ 50MB |

### QuestionAnswerKey

| Field | Rule |
|-------|------|
| QuestionId | Required, Must reference valid Question |
| AcceptedAnswersJson | Required for ShortAnswer, valid JSON array |
| RubricTextEn/Ar | Recommended for Essay (at least one) |
| NumericAnswer | Required for Numeric type |
| Tolerance | Optional, Must be ≥ 0 if specified |

---

## 📚 Question Types Reference

Based on the seeded Lookups data:

| ID | NameEn | NameAr | Answer Source |
|----|--------|--------|---------------|
| 1 | MCQ_Single | اختيار من متعدد (إجابة واحدة) | QuestionOption.IsCorrect |
| 2 | MCQ_Multi | اختيار من متعدد (أكثر من إجابة) | QuestionOption.IsCorrect |
| 3 | TrueFalse | صح/خطأ | QuestionOption.IsCorrect |
| 4 | ShortAnswer | إجابة قصيرة | QuestionAnswerKey.AcceptedAnswersJson |
| 5 | Essay | مقالي | QuestionAnswerKey.RubricText* |
| 6 | Numeric | رقمي | QuestionAnswerKey.NumericAnswer |

---

## 📝 Notes

1. **Hard Delete**: DELETE endpoints perform permanent deletion from the database.
2. **Cascade Delete**: Deleting a question removes all associated options, attachments, and answer key.
3. **Soft Delete Filter**: GET operations exclude soft-deleted records by default.
4. **Primary Attachment**: Only one attachment per question can be marked as primary.
5. **Options Order**: Options are returned sorted by the `Order` field.
6. **Points Precision**: Points are stored with decimal precision (10,2).
7. **HTML Support**: Question body supports HTML content for rich text.
8. **File Size Limit**: Attachments are limited to 50MB per file.
9. **Answer Key Security**: Never expose answer keys to candidate-facing endpoints.
10. **One Answer Key**: Maximum one QuestionAnswerKey per Question (enforced by unique constraint).

---

## 🚀 Migration

### Apply Database Migration

```bash
dotnet ef migrations add AddQuestionAnswerKey
dotnet ef database update
```

### Verify Tables Created

After migration, the following tables should exist:
- `Questions`
- `QuestionOptions`
- `QuestionAttachments`
- `QuestionAnswerKeys`
Key Business Rules
Question Type	Answer Storage	QuestionAnswerKey
MCQ_Single/Multi	QuestionOption.IsCorrect	Must be null
TrueFalse	QuestionOption.IsCorrect	Must be null
ShortAnswer	AcceptedAnswersJson	Required
Essay	RubricText*	Recommended
Numeric	NumericAnswer	Required
