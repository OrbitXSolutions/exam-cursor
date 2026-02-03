# Assessment Module Documentation

## Overview

The Assessment module provides a complete exam/assessment management system. It supports creating exams with sections, questions from the Question Bank, access policies, and instructions. The module implements comprehensive business rules for exam validation and publishing.

---

## ?? Module Structure

```
Smart_Core/
??? Controllers/
?   ??? Assessment/
???? AssessmentController.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Assessment/
?   ?       ??? ExamDtos.cs
?   ?    ??? ExamSectionDtos.cs
? ?       ??? ExamQuestionDtos.cs
?   ?       ??? ExamAccessPolicyAndInstructionDtos.cs
?   ??? Interfaces/
?   ?   ??? Assessment/
?   ?   ??? IAssessmentService.cs
?   ??? Validators/
?  ??? Assessment/
?      ??? ExamValidators.cs
?           ??? ExamSectionValidators.cs
?   ??? ExamQuestionValidators.cs
?           ??? ExamAccessPolicyAndInstructionValidators.cs
??? Domain/
?   ??? Entities/
?       ??? Assessment/
?           ??? Exam.cs
???? ExamSection.cs
?           ??? ExamQuestion.cs
?           ??? ExamAccessPolicy.cs
?           ??? ExamInstruction.cs
??? Infrastructure/
    ??? Data/
    ?   ??? Configurations/
    ?       ??? Assessment/
?           ??? ExamConfiguration.cs
    ?           ??? ExamSectionConfiguration.cs
    ?   ??? ExamQuestionConfiguration.cs
    ?     ??? ExamAccessPolicyConfiguration.cs
?    ??? ExamInstructionConfiguration.cs
    ??? Services/
        ??? Assessment/
      ??? AssessmentService.cs
```

---

## ?? Domain Entities

### Exam

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key (auto-generated) |
| TitleEn | string | English title (max 500 chars) |
| TitleAr | string | Arabic title (max 500 chars) |
| DescriptionEn | string? | English description (max 2000 chars) |
| DescriptionAr | string? | Arabic description (max 2000 chars) |
| StartAt | DateTime? | Exam availability start date |
| EndAt | DateTime? | Exam availability end date |
| DurationMinutes | int | Exam duration in minutes |
| MaxAttempts | int | Maximum attempts allowed (0 = unlimited) |
| ShuffleQuestions | bool | Randomize question order |
| ShuffleOptions | bool | Randomize option order for MCQs |
| PassScore | decimal | Minimum score to pass |
| IsPublished | bool | Whether exam is published |
| IsActive | bool | Whether exam is active |

### ExamSection

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | FK to Exam |
| TitleEn | string | English title |
| TitleAr | string | Arabic title |
| DescriptionEn | string? | English description |
| DescriptionAr | string? | Arabic description |
| Order | int | Display order (unique within exam) |
| DurationMinutes | int? | Optional section duration override |
| TotalPointsOverride | decimal? | Optional points override |

### ExamQuestion

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | FK to Exam |
| ExamSectionId | int | FK to ExamSection |
| QuestionId | int | FK to Question (Question Bank) |
| Order | int | Display order (unique within section) |
| Points | decimal | Points for this question |
| IsRequired | bool | Whether question is required |

### ExamAccessPolicy

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | FK to Exam (one-to-one) |
| IsPublic | bool | Public access flag |
| AccessCode | string? | Optional access code |
| RestrictToAssignedCandidates | bool | Restrict to assigned users |

### ExamInstruction

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | FK to Exam |
| ContentEn | string | English instruction content |
| ContentAr | string | Arabic instruction content |
| Order | int | Display order (unique within exam) |

---

## ?? Entity Relationships

```
???????????????????????????????????????????????????????????????
? Exam       ?
?  - TitleEn/TitleAr           ?
?  - DurationMinutes, MaxAttempts, PassScore         ?
?  - ShuffleQuestions, ShuffleOptions   ?
?  - IsPublished, IsActive ?
???????????????????????????????????????????????????????????????
?
       ????????????????????????????????????????????????????
   ?        ?       ?          ?
    ? 1:*           ? 1:1      ? 1:*       ?
???????????????? ??????????????? ???????????????          ?
? ExamSection  ? ?AccessPolicy ? ? Instruction ?          ?
?  - Order     ? ?  - IsPublic ? ?  - ContentEn?   ?
?  - TitleEn   ? ?  - Code     ? ?  - Order    ?   ?
???????????????? ??????????????? ???????????????    ?
       ?   ?
       ? 1:*    ?
????????????????????????????????????????????????????????????
?      ExamQuestion           ?
?  - Order, Points, IsRequired          ?
?  - QuestionId (FK to QuestionBank)            ?
????????????????????????????????????????????????????????????
```

---

## ?? DTO Structure (Minimized)

| Entity | DTOs | Notes |
|--------|------|-------|
| Exam | `ExamDto`, `ExamListDto`, `SaveExamDto`, `ExamSearchDto` | `SaveExamDto` used for both Create & Update |
| ExamSection | `ExamSectionDto`, `SaveExamSectionDto`, `ReorderSectionDto` | `SaveExamSectionDto` used for both Create & Update |
| ExamQuestion | `ExamQuestionDto`, `AddExamQuestionDto`, `UpdateExamQuestionDto`, `BulkAddQuestionsDto`, `ReorderQuestionDto` | Separate DTOs due to different properties |
| ExamAccessPolicy | `ExamAccessPolicyDto`, `SaveExamAccessPolicyDto` | `SaveExamAccessPolicyDto` used for both Create & Update |
| ExamInstruction | `ExamInstructionDto`, `SaveExamInstructionDto`, `ReorderInstructionDto` | `SaveExamInstructionDto` used for both Create & Update |

---

## ?? API Endpoints

### Exams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/exams` | Get all exams (paginated) |
| GET | `/api/assessment/exams/{id}` | Get exam with full details |
| POST | `/api/assessment/exams` | Create exam |
| PUT | `/api/assessment/exams/{id}` | Update exam |
| DELETE | `/api/assessment/exams/{id}` | Delete exam |
| PATCH | `/api/assessment/exams/{id}/publish` | Publish exam (with validation) |
| PATCH | `/api/assessment/exams/{id}/unpublish` | Unpublish exam |
| PATCH | `/api/assessment/exams/{id}/toggle-status` | Toggle active status |
| GET | `/api/assessment/exams/{id}/validate` | Validate exam for publishing |

### Sections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/exams/{examId}/sections` | Get all sections |
| GET | `/api/assessment/sections/{sectionId}` | Get section by ID |
| POST | `/api/assessment/exams/{examId}/sections` | Create section |
| PUT | `/api/assessment/sections/{sectionId}` | Update section |
| DELETE | `/api/assessment/sections/{sectionId}` | Delete section |
| PUT | `/api/assessment/exams/{examId}/sections/reorder` | Reorder sections |

### Questions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/sections/{sectionId}/questions` | Get questions in section |
| POST | `/api/assessment/sections/{sectionId}/questions` | Add question to section |
| POST | `/api/assessment/sections/{sectionId}/questions/bulk` | Bulk add questions |
| PUT | `/api/assessment/exam-questions/{examQuestionId}` | Update exam question |
| DELETE | `/api/assessment/exam-questions/{examQuestionId}` | Remove question |
| PUT | `/api/assessment/sections/{sectionId}/questions/reorder` | Reorder questions |

### Access Policy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/exams/{examId}/access-policy` | Get access policy |
| PUT | `/api/assessment/exams/{examId}/access-policy` | Create/Update policy |

### Instructions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessment/exams/{examId}/instructions` | Get all instructions |
| POST | `/api/assessment/exams/{examId}/instructions` | Create instruction |
| PUT | `/api/assessment/instructions/{instructionId}` | Update instruction |
| DELETE | `/api/assessment/instructions/{instructionId}` | Delete instruction |
| PUT | `/api/assessment/exams/{examId}/instructions/reorder` | Reorder instructions |

---

## ?? API Examples

### 1. Create Exam

**Request:**
```http
POST /api/assessment/exams
Content-Type: application/json

{
  "titleEn": "Introduction to Python",
  "titleAr": "????? ?? ??????",
  "descriptionEn": "Basic Python programming concepts",
  "descriptionAr": "?????? ????? ?????? ????????",
  "startAt": "2024-02-01T09:00:00Z",
  "endAt": "2024-02-28T23:59:59Z",
  "durationMinutes": 60,
  "maxAttempts": 3,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "passScore": 60.00,
  "isActive": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": 1,
    "titleEn": "Introduction to Python",
    "titleAr": "????? ?? ??????",
    "descriptionEn": "Basic Python programming concepts",
    "descriptionAr": "?????? ????? ?????? ????????",
    "startAt": "2024-02-01T09:00:00Z",
    "endAt": "2024-02-28T23:59:59Z",
    "durationMinutes": 60,
    "maxAttempts": 3,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "passScore": 60.00,
    "isPublished": false,
    "isActive": true,
    "createdDate": "2024-01-15T10:30:00Z",
    "sectionsCount": 0,
    "questionsCount": 0,
    "totalPoints": 0,
    "sections": [],
    "instructions": [],
    "accessPolicy": null
  }
}
```

---

### 2. Create Section

**Request:**
```http
POST /api/assessment/exams/1/sections
Content-Type: application/json

{
  "titleEn": "Python Basics",
  "titleAr": "??????? ??????",
  "descriptionEn": "Variables, data types, and operators",
  "descriptionAr": "????????? ?????? ???????? ????????",
  "order": 1,
  "durationMinutes": null,
  "totalPointsOverride": null
}
```

---

### 3. Add Question to Section

**Request:**
```http
POST /api/assessment/sections/1/questions
Content-Type: application/json

{
  "questionId": 5,
  "order": 1,
  "pointsOverride": null,
  "isRequired": true
}
```

---

### 4. Bulk Add Questions

**Request:**
```http
POST /api/assessment/sections/1/questions/bulk
Content-Type: application/json

{
  "questionIds": [1, 2, 3, 4, 5],
  "useOriginalPoints": true,
  "markAsRequired": true
}
```

---

### 5. Validate Exam for Publishing

**Request:**
```http
GET /api/assessment/exams/1/validate
```

**Response (200 OK - Valid):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      "Unlimited attempts are allowed (MaxAttempts = 0)"
    ]
  }
}
```

**Response (200 OK - Invalid):**
```json
{
  "success": true,
"data": {
    "isValid": false,
    "errors": [
      "Exam must have at least one section",
      "Pass score (100) cannot exceed total points (50)"
    ],
    "warnings": []
  }
}
```

---

### 6. Publish Exam

**Request:**
```http
PATCH /api/assessment/exams/1/publish
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Exam published successfully",
  "data": true
}
```

**Response (400 Bad Request - Validation Failed):**
```json
{
  "success": false,
  "message": "Cannot publish exam",
  "errors": [
    "Section 'Python Basics' must have at least one question"
  ]
}
```

---

### 7. Set Access Policy

**Request:**
```http
PUT /api/assessment/exams/1/access-policy
Content-Type: application/json

{
  "isPublic": false,
  "accessCode": "PYTHON2024",
  "restrictToAssignedCandidates": true
}
```

---

### 8. Reorder Sections

**Request:**
```http
PUT /api/assessment/exams/1/sections/reorder
Content-Type: application/json

[
  { "sectionId": 3, "newOrder": 1 },
  { "sectionId": 1, "newOrder": 2 },
  { "sectionId": 2, "newOrder": 3 }
]
```

---

## ? Business Rules Implemented

### Exam Rules
- ? Title is mandatory and unique
- ? Duration must be > 0 and ? 600 minutes
- ? EndAt must be after StartAt
- ? Cannot publish without sections and questions
- ? MaxAttempts must be ? 0 (0 = unlimited)
- ? PassScore validated against total points

### Section Rules
- ? Unique order within exam
- ? Title is mandatory
- ? Optional section duration must be > 0

### Question Rules
- ? Question must exist and be active
- ? No duplicate questions in same exam
- ? Unique order within section
- ? Points must be > 0
- ? MCQ validation (options, correct answers)
- ? True/False validation (exactly 2 options)

### Access Policy Rules
- ? Cannot be both public and restricted
- ? Access code length validation (6-50 chars)

### Instruction Rules
- ? Content is mandatory
- ? Unique order within exam

---

## ??? Database Constraints

### Unique Indexes
- `IX_ExamSections_ExamId_Order` - Unique order per exam
- `IX_ExamQuestions_SectionId_Order` - Unique order per section  
- `IX_ExamQuestions_ExamId_QuestionId` - Prevent duplicate questions
- `IX_ExamInstructions_ExamId_Order` - Unique order per exam
- `IX_ExamAccessPolicies_ExamId` - One policy per exam

### Cascade Delete
- Deleting an Exam cascades to Sections, Questions, Instructions, AccessPolicy
- Deleting a Section cascades to ExamQuestions

---

## ?? Setup & Migration

```bash
dotnet ef migrations add AddAssessmentModule
dotnet ef database update
```

---

## ?? Code Examples

### Creating a Complete Exam

```csharp
// 1. Create Exam
var examDto = new SaveExamDto
{
    TitleEn = "Final Exam",
    TitleAr = "???????? ???????",
    DurationMinutes = 120,
    MaxAttempts = 2,
    PassScore = 60,
    ShuffleQuestions = true,
    ShuffleOptions = true,
    IsActive = true
};
var exam = await _assessmentService.CreateExamAsync(examDto, userId);

// 2. Add Section
var sectionDto = new SaveExamSectionDto
{
    TitleEn = "Section 1",
    TitleAr = "????? 1",
    Order = 1
};
var section = await _assessmentService.CreateSectionAsync(exam.Data.Id, sectionDto, userId);

// 3. Bulk Add Questions
var questionsDto = new BulkAddQuestionsDto
{
    QuestionIds = new List<int> { 1, 2, 3, 4, 5 },
    UseOriginalPoints = true,
    MarkAsRequired = true
};
await _assessmentService.BulkAddQuestionsToSectionAsync(section.Data.Id, questionsDto, userId);

// 4. Add Instructions
var instructionDto = new SaveExamInstructionDto
{
    ContentEn = "Read all questions carefully before answering.",
    ContentAr = "???? ???? ??????? ?????? ??? ???????.",
    Order = 1
};
await _assessmentService.CreateInstructionAsync(exam.Data.Id, instructionDto, userId);

// 5. Validate
var validation = await _assessmentService.ValidateExamForPublishAsync(exam.Data.Id);
if (validation.Data.IsValid)
{
    // 6. Publish
    await _assessmentService.PublishExamAsync(exam.Data.Id, userId);
}
```

---

## ?? Notes

1. **Soft Delete**: All entities support soft delete with query filters
2. **Hard Delete**: DELETE endpoints perform permanent deletion
3. **Publishing Validation**: Comprehensive validation before publishing
4. **Question Bank Integration**: Questions linked from QuestionBank module
5. **Points Override**: Each exam question can override original question points
6. **Order Management**: Reorder endpoints for sections, questions, instructions
7. **Access Control**: Admin-only authorization on all endpoints
