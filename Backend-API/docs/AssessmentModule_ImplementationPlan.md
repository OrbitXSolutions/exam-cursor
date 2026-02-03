# Assessment Module - Implementation Plan

## Overview

The Assessment Module provides comprehensive exam management capabilities for the Smart Core application. This document outlines the implementation details, architecture, business rules, and API endpoints.

---

Department
├── Users (ApplicationUser.DepartmentId)
└── Exams (Exam.DepartmentId)
    └── Sections (ExamSection)
        └── Topics (ExamTopic) ← NEW
            └── Questions (ExamQuestion.ExamTopicId)

Exam
├── ExamType (Fixed/Flex) ← NEW
├── DepartmentId ← NEW (for access control)
├── StartAt / EndAt
└── DurationMinutes

Access Control Rules
1.	SuperDev can see and manage all exams across all departments
2.	Admin can only see/manage exams in their own department
3.	Users must be assigned to a department to create/view exams
4.	Exam answers/results are visible only to admins of the same department

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Domain Entities](#domain-entities)
3. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
4. [Business Rules](#business-rules)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Validation Rules](#validation-rules)
8. [Service Layer](#service-layer)
9. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

```
???????????????????????????????????????????????????????????????????
?         Presentation Layer ?
?            (AssessmentController)      ?
???????????????????????????????????????????????????????????????????
              ?
     ?
???????????????????????????????????????????????????????????????????
?        Application Layer      ?
?   (IAssessmentService, DTOs, Validators)              ?
???????????????????????????????????????????????????????????????????
           ?
?
???????????????????????????????????????????????????????????????????
?   Infrastructure Layer              ?
?         (AssessmentService, ApplicationDbContext)                ?
???????????????????????????????????????????????????????????????????
      ?
       ?
???????????????????????????????????????????????????????????????????
?           Domain Layer        ?
?     (Exam, ExamSection, ExamQuestion, ExamAccessPolicy,    ?
?     ExamInstruction) ?
???????????????????????????????????????????????????????????????????
```

---

## Domain Entities

### 1. Exam

The main entity representing an examination.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| TitleEn | string | English title (required, max 500 chars) |
| TitleAr | string | Arabic title (required, max 500 chars) |
| DescriptionEn | string? | English description (max 2000 chars) |
| DescriptionAr | string? | Arabic description (max 2000 chars) |
| StartAt | DateTime? | Exam availability start date |
| EndAt | DateTime? | Exam availability end date |
| DurationMinutes | int | Exam duration in minutes |
| MaxAttempts | int | Maximum attempts allowed (0 = unlimited) |
| ShuffleQuestions | bool | Randomize question order |
| ShuffleOptions | bool | Randomize option order for MCQs |
| PassScore | decimal | Minimum score to pass |
| IsPublished | bool | Publication status |
| IsActive | bool | Active/inactive status |

**Relationships:**
- One-to-Many: Sections, Questions, Instructions
- One-to-One: AccessPolicy

### 2. ExamSection

Groups questions within an exam.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | Foreign key to Exam |
| TitleEn | string | English title |
| TitleAr | string | Arabic title |
| DescriptionEn | string? | English description |
| DescriptionAr | string? | Arabic description |
| Order | int | Display order within exam |
| DurationMinutes | int? | Optional section-specific duration |
| TotalPointsOverride | decimal? | Override total points |

### 3. ExamQuestion

Links questions from Question Bank to exam sections.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | Foreign key to Exam |
| ExamSectionId | int | Foreign key to ExamSection |
| QuestionId | int | Foreign key to Question (Question Bank) |
| Order | int | Display order within section |
| Points | decimal | Points for this question (can override original) |
| IsRequired | bool | Whether question must appear in attempt |

### 4. ExamAccessPolicy

Controls exam access settings.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | Foreign key to Exam |
| IsPublic | bool | Public access flag |
| AccessCode | string? | Optional access code |
| RestrictToAssignedCandidates | bool | Restrict to assigned users |

### 5. ExamInstruction

Exam instructions displayed to candidates.

| Property | Type | Description |
|----------|------|-------------|
| Id | int | Primary key |
| ExamId | int | Foreign key to Exam |
| ContentEn | string | English instruction content |
| ContentAr | string | Arabic instruction content |
| Order | int | Display order |

---

## DTOs (Data Transfer Objects)

### Design Principle: Minimized DTOs

To reduce code duplication, we use unified DTOs for create/update operations where properties are identical.

### Exam DTOs

```csharp
// Full exam details (response)
ExamDto

// Lightweight list item (response)
ExamListDto

// Create or Update (request) - UNIFIED
SaveExamDto

// Search/filter (request)
ExamSearchDto
```

### Section DTOs

```csharp
// Full section details (response)
ExamSectionDto

// Create or Update (request) - UNIFIED
SaveExamSectionDto

// Reorder sections (request)
ReorderSectionDto
```

### Question DTOs

```csharp
// Exam question with details (response)
ExamQuestionDto

// Add question to section (request)
AddExamQuestionDto

// Update exam question (request)
UpdateExamQuestionDto

// Bulk add questions (request)
BulkAddQuestionsDto

// Reorder questions (request)
ReorderQuestionDto
```

### Access Policy DTOs

```csharp
// Policy details (response)
ExamAccessPolicyDto

// Create or Update (request) - UNIFIED
SaveExamAccessPolicyDto
```

### Instruction DTOs

```csharp
// Instruction details (response)
ExamInstructionDto

// Create or Update (request) - UNIFIED
SaveExamInstructionDto

// Reorder instructions (request)
ReorderInstructionDto
```

---

## Business Rules

### 1. Exam Rules

| Rule | Description |
|------|-------------|
| Unique Title | Exam title must be unique within the system |
| Duration | Must be > 0 and ? 600 minutes |
| Scheduling | If StartAt and EndAt defined, EndAt must be after StartAt |
| Publishing | Cannot publish without sections and questions |
| Attempts | MaxAttempts ? 1 (0 for unlimited) |
| Pass Score | Must be between 0 and total exam points |
| Active Status | Inactive exams not available even if published |
| Structural Changes | Restricted on published exams with attempts |

### 2. Section Rules

| Rule | Description |
|------|-------------|
| Unique Order | Order must be unique within the same exam |
| Title Required | Each section must have a non-empty title |
| Duration | If specified, must be > 0 |
| Deletion | Cannot delete from published exam with attempts |

### 3. Question Rules

| Rule | Description |
|------|-------------|
| Question Validity | Must exist in Question Bank |
| Active Only | Only active questions in published exams |
| No Duplicates | Same question cannot be added twice to same exam |
| Unique Order | Order must be unique within section |
| Points | Must be > 0 |
| Required Questions | Always appear in attempt if marked required |

### 4. Access Policy Rules

| Rule | Description |
|------|-------------|
| Public Access | No prior assignment needed |
| Restricted Access | Only assigned candidates/groups allowed |
| Access Code | Minimum 6 characters if used |
| Mutual Exclusivity | Cannot be both public AND restricted |

### 5. Question Type Validation (for Publishing)

| Question Type | Validation Rules |
|---------------|------------------|
| MCQ (Multiple Choice) | ? 2 options required |
| Single-Choice MCQ | Exactly 1 correct option |
| Multiple-Choice MCQ | ? 1 correct option |
| True/False | Exactly 2 options |
| Short Answer | No options required |
| Essay | No options required |

---

## API Endpoints

### Base URL: `/api/Assessment`

### Exam Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | Get all exams (paginated) |
| GET | `/exams/{id}` | Get exam by ID |
| POST | `/exams` | Create new exam |
| PUT | `/exams/{id}` | Update exam |
| DELETE | `/exams/{id}` | Delete exam (soft) |
| POST | `/exams/{id}/publish` | Publish exam |
| POST | `/exams/{id}/unpublish` | Unpublish exam |
| POST | `/exams/{id}/toggle-status` | Toggle active status |
| GET | `/exams/{id}/validate` | Validate for publishing |

### Section Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams/{examId}/sections` | Get exam sections |
| GET | `/sections/{sectionId}` | Get section by ID |
| POST | `/exams/{examId}/sections` | Create section |
| PUT | `/sections/{sectionId}` | Update section |
| DELETE | `/sections/{sectionId}` | Delete section |
| POST | `/exams/{examId}/sections/reorder` | Reorder sections |

### Question Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sections/{sectionId}/questions` | Get section questions |
| POST | `/sections/{sectionId}/questions` | Add question to section |
| POST | `/sections/{sectionId}/questions/bulk` | Bulk add questions |
| PUT | `/exam-questions/{examQuestionId}` | Update exam question |
| DELETE | `/exam-questions/{examQuestionId}` | Remove question |
| POST | `/sections/{sectionId}/questions/reorder` | Reorder questions |

### Access Policy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams/{examId}/access-policy` | Get access policy |
| PUT | `/exams/{examId}/access-policy` | Save access policy |

### Instruction Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams/{examId}/instructions` | Get exam instructions |
| POST | `/exams/{examId}/instructions` | Create instruction |
| PUT | `/instructions/{instructionId}` | Update instruction |
| DELETE | `/instructions/{instructionId}` | Delete instruction |
| POST | `/exams/{examId}/instructions/reorder` | Reorder instructions |

---

## Database Schema

### Tables

```sql
-- Exams table
CREATE TABLE Exams (
Id INT IDENTITY(1,1) PRIMARY KEY,
    TitleEn NVARCHAR(500) NOT NULL,
    TitleAr NVARCHAR(500) NOT NULL,
    DescriptionEn NVARCHAR(2000),
    DescriptionAr NVARCHAR(2000),
    StartAt DATETIME2,
    EndAt DATETIME2,
    DurationMinutes INT NOT NULL,
    MaxAttempts INT NOT NULL,
    ShuffleQuestions BIT NOT NULL DEFAULT 0,
    ShuffleOptions BIT NOT NULL DEFAULT 0,
    PassScore DECIMAL(10,2) NOT NULL,
    IsPublished BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
  CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0
);

-- ExamSections table
CREATE TABLE ExamSections (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExamId INT NOT NULL FOREIGN KEY REFERENCES Exams(Id) ON DELETE CASCADE,
    TitleEn NVARCHAR(500) NOT NULL,
    TitleAr NVARCHAR(500) NOT NULL,
    DescriptionEn NVARCHAR(2000),
    DescriptionAr NVARCHAR(2000),
    [Order] INT NOT NULL,
    DurationMinutes INT,
    TotalPointsOverride DECIMAL(10,2),
    CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0
);

-- ExamQuestions table
CREATE TABLE ExamQuestions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExamId INT NOT NULL FOREIGN KEY REFERENCES Exams(Id) ON DELETE CASCADE,
    ExamSectionId INT NOT NULL FOREIGN KEY REFERENCES ExamSections(Id) ON DELETE CASCADE,
    QuestionId INT NOT NULL FOREIGN KEY REFERENCES Questions(Id) ON DELETE RESTRICT,
    [Order] INT NOT NULL,
    Points DECIMAL(10,2) NOT NULL,
    IsRequired BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0
);

-- ExamAccessPolicies table
CREATE TABLE ExamAccessPolicies (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExamId INT NOT NULL FOREIGN KEY REFERENCES Exams(Id) ON DELETE CASCADE,
    IsPublic BIT NOT NULL DEFAULT 0,
AccessCode NVARCHAR(50),
    RestrictToAssignedCandidates BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0
);

-- ExamInstructions table
CREATE TABLE ExamInstructions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ExamId INT NOT NULL FOREIGN KEY REFERENCES Exams(Id) ON DELETE CASCADE,
    ContentEn NVARCHAR(5000) NOT NULL,
    ContentAr NVARCHAR(5000) NOT NULL,
  [Order] INT NOT NULL,
    CreatedDate DATETIME2 NOT NULL,
    UpdatedDate DATETIME2,
    CreatedBy NVARCHAR(450),
    UpdatedBy NVARCHAR(450),
    DeletedBy NVARCHAR(450),
    IsDeleted BIT NOT NULL DEFAULT 0
);
```

### Indexes

```sql
-- Exams indexes
CREATE INDEX IX_Exams_TitleEn ON Exams(TitleEn);
CREATE INDEX IX_Exams_IsPublished ON Exams(IsPublished);
CREATE INDEX IX_Exams_IsActive ON Exams(IsActive);
CREATE INDEX IX_Exams_StartAt ON Exams(StartAt);
CREATE INDEX IX_Exams_CreatedDate ON Exams(CreatedDate);

-- ExamSections indexes
CREATE UNIQUE INDEX IX_ExamSections_ExamId_Order ON ExamSections(ExamId, [Order]);
CREATE INDEX IX_ExamSections_ExamId ON ExamSections(ExamId);

-- ExamQuestions indexes
CREATE UNIQUE INDEX IX_ExamQuestions_SectionId_Order ON ExamQuestions(ExamSectionId, [Order]);
CREATE UNIQUE INDEX IX_ExamQuestions_ExamId_QuestionId ON ExamQuestions(ExamId, QuestionId);
CREATE INDEX IX_ExamQuestions_ExamId ON ExamQuestions(ExamId);
CREATE INDEX IX_ExamQuestions_ExamSectionId ON ExamQuestions(ExamSectionId);
CREATE INDEX IX_ExamQuestions_QuestionId ON ExamQuestions(QuestionId);

-- ExamAccessPolicies indexes
CREATE UNIQUE INDEX IX_ExamAccessPolicies_ExamId ON ExamAccessPolicies(ExamId);

-- ExamInstructions indexes
CREATE UNIQUE INDEX IX_ExamInstructions_ExamId_Order ON ExamInstructions(ExamId, [Order]);
CREATE INDEX IX_ExamInstructions_ExamId ON ExamInstructions(ExamId);
```

---

## Validation Rules

### FluentValidation Validators

#### SaveExamDtoValidator
- TitleEn: Required, max 500 chars
- TitleAr: Required, max 500 chars
- DescriptionEn: Max 2000 chars
- DescriptionAr: Max 2000 chars
- DurationMinutes: > 0 and ? 600
- MaxAttempts: ? 0
- PassScore: ? 0
- EndAt > StartAt (when both specified)

#### SaveExamSectionDtoValidator
- TitleEn: Required, max 500 chars
- TitleAr: Required, max 500 chars
- Order: ? 0
- DurationMinutes: > 0 (if specified)
- TotalPointsOverride: > 0 (if specified)

#### AddExamQuestionDtoValidator
- QuestionId: > 0
- Order: ? 0
- PointsOverride: > 0 (if specified)

#### SaveExamAccessPolicyDtoValidator
- AccessCode: 6-50 chars (if specified)
- Cannot be both Public AND RestrictToAssignedCandidates

#### SaveExamInstructionDtoValidator
- ContentEn: Required, max 5000 chars
- ContentAr: Required, max 5000 chars
- Order: ? 0

---

## Service Layer

### IAssessmentService Interface

```csharp
public interface IAssessmentService
{
    // Exams
    Task<ApiResponse<PaginatedResponse<ExamListDto>>> GetAllExamsAsync(ExamSearchDto searchDto);
 Task<ApiResponse<ExamDto>> GetExamByIdAsync(int id);
    Task<ApiResponse<ExamDto>> CreateExamAsync(SaveExamDto dto, string createdBy);
    Task<ApiResponse<ExamDto>> UpdateExamAsync(int id, SaveExamDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteExamAsync(int id);
    Task<ApiResponse<bool>> PublishExamAsync(int id, string updatedBy);
    Task<ApiResponse<bool>> UnpublishExamAsync(int id, string updatedBy);
    Task<ApiResponse<bool>> ToggleExamStatusAsync(int id, string updatedBy);

    // Sections
    Task<ApiResponse<List<ExamSectionDto>>> GetExamSectionsAsync(int examId);
  Task<ApiResponse<ExamSectionDto>> GetSectionByIdAsync(int sectionId);
    Task<ApiResponse<ExamSectionDto>> CreateSectionAsync(int examId, SaveExamSectionDto dto, string createdBy);
    Task<ApiResponse<ExamSectionDto>> UpdateSectionAsync(int sectionId, SaveExamSectionDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteSectionAsync(int sectionId);
 Task<ApiResponse<bool>> ReorderSectionsAsync(int examId, List<ReorderSectionDto> reorderDtos, string updatedBy);

    // Questions
    Task<ApiResponse<List<ExamQuestionDto>>> GetSectionQuestionsAsync(int sectionId);
    Task<ApiResponse<ExamQuestionDto>> AddQuestionToSectionAsync(int sectionId, AddExamQuestionDto dto, string createdBy);
  Task<ApiResponse<List<ExamQuestionDto>>> BulkAddQuestionsToSectionAsync(int sectionId, BulkAddQuestionsDto dto, string createdBy);
    Task<ApiResponse<ExamQuestionDto>> UpdateExamQuestionAsync(int examQuestionId, UpdateExamQuestionDto dto, string updatedBy);
    Task<ApiResponse<bool>> RemoveQuestionFromExamAsync(int examQuestionId);
    Task<ApiResponse<bool>> ReorderQuestionsAsync(int sectionId, List<ReorderQuestionDto> reorderDtos, string updatedBy);

    // Access Policy
    Task<ApiResponse<ExamAccessPolicyDto>> GetAccessPolicyAsync(int examId);
    Task<ApiResponse<ExamAccessPolicyDto>> SaveAccessPolicyAsync(int examId, SaveExamAccessPolicyDto dto, string userId);

  // Instructions
    Task<ApiResponse<List<ExamInstructionDto>>> GetExamInstructionsAsync(int examId);
    Task<ApiResponse<ExamInstructionDto>> CreateInstructionAsync(int examId, SaveExamInstructionDto dto, string createdBy);
    Task<ApiResponse<ExamInstructionDto>> UpdateInstructionAsync(int instructionId, SaveExamInstructionDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteInstructionAsync(int instructionId);
    Task<ApiResponse<bool>> ReorderInstructionsAsync(int examId, List<ReorderInstructionDto> reorderDtos, string updatedBy);

    // Validation
    Task<ApiResponse<ExamValidationResultDto>> ValidateExamForPublishAsync(int examId);
}
```

---

## Future Enhancements

### Phase 2: Exam Attempts Module
- [ ] ExamAttempt entity and tracking
- [ ] Candidate answers storage
- [ ] Time tracking and auto-submit
- [ ] Attempt history and review

### Phase 3: Scoring & Results
- [ ] Auto-grading for objective questions
- [ ] Manual grading interface for essays
- [ ] Result calculation and certificates
- [ ] Analytics and reporting

### Phase 4: Advanced Features
- [ ] Exam versioning for published exams
- [ ] Question pools and random selection
- [ ] Proctoring integration
- [ ] Multi-tenant support
- [ ] Exam templates

### Phase 5: Integration
- [ ] LMS integration (SCORM, xAPI)
- [ ] Calendar integration
- [ ] Notification system
- [ ] Export/Import functionality

---

## File Structure

```
Smart_Core/
??? Application/
?   ??? DTOs/
?   ?   ??? Assessment/
?   ?       ??? ExamDtos.cs
?   ?       ??? ExamSectionDtos.cs
?   ?       ??? ExamQuestionDtos.cs
?   ?       ??? ExamAccessPolicyAndInstructionDtos.cs
?   ??? Interfaces/
?   ?   ??? Assessment/
??       ??? IAssessmentService.cs
?   ??? Validators/
? ??? Assessment/
?           ??? ExamValidators.cs
?           ??? ExamSectionValidators.cs
?           ??? ExamQuestionValidators.cs
?   ??? ExamAccessPolicyAndInstructionValidators.cs
??? Controllers/
?   ??? Assessment/
?       ??? AssessmentController.cs
??? Domain/
?   ??? Entities/
?       ??? Assessment/
?           ??? Exam.cs
?           ??? ExamSection.cs
?        ??? ExamQuestion.cs
?    ??? ExamAccessPolicy.cs
?           ??? ExamInstruction.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? ApplicationDbContext.cs
??   ??? Configurations/
?   ?       ??? Assessment/
?   ?           ??? ExamConfiguration.cs
?   ?           ??? ExamSectionConfiguration.cs
?   ?    ??? ExamQuestionConfiguration.cs
?   ?    ??? ExamAccessPolicyConfiguration.cs
?   ?           ??? ExamInstructionConfiguration.cs
?   ??? Services/
?   ??? Assessment/
?    ??? AssessmentService.cs
??? docs/
    ??? AssessmentModule_ImplementationPlan.md
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024 | Development Team | Initial implementation |

---

## References

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [FluentValidation](https://docs.fluentvalidation.net)
- [Mapster](https://github.com/MapsterMapper/Mapster)
