# ExamResult Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Candidate Access Control](#candidate-access-control)
8. [Report Generation](#report-generation)
9. [Export System](#export-system)
10. [Security Considerations](#security-considerations)
11. [Future Enhancements](#future-enhancements)

---

## Overview

The ExamResult Module manages the complete lifecycle of exam results, including:
- Result finalization from completed grading
- Result publishing control
- Candidate result access (secure, limited view)
- Exam-level reporting and analytics
- Question performance analysis
- Candidate summary tracking
- Result export functionality

### Key Features
- **Result Finalization**: Create immutable results from completed grading
- **Publishing Control**: Granular control over when candidates see results
- **Secure Candidate Access**: Candidates see only their published results
- **Comprehensive Reporting**: Exam statistics, pass rates, score distributions
- **Question Analytics**: Difficulty index, correct rates per question
- **Export System**: Async export to CSV, Excel, PDF

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? ExamResult/
?   ?       ??? Result.cs
?   ?       ??? ExamReport.cs
?   ?       ??? QuestionPerformanceReport.cs
?   ?       ??? CandidateExamSummary.cs
?   ?       ??? ResultExportJob.cs
?   ??? Enums/
?       ??? ExamResultEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? ExamResult/
?   ?  ??? ExamResultDtos.cs
?   ??? Interfaces/
?   ?   ??? ExamResult/
?   ?       ??? IExamResultService.cs
?   ??? Validators/
?       ??? ExamResult/
?           ??? ExamResultValidators.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? Configurations/
?   ?       ??? ExamResult/
?   ?           ??? ResultConfiguration.cs
?   ?    ??? ExamReportConfiguration.cs
?   ?     ??? QuestionPerformanceReportConfiguration.cs
?   ?       ??? CandidateExamSummaryConfiguration.cs
?   ?      ??? ResultExportJobConfiguration.cs
?   ??? Services/
?       ??? ExamResult/
?           ??? ExamResultService.cs
??? Controllers/
    ??? ExamResult/
     ??? ExamResultController.cs
```

### Dependencies
- Grading Module (source of TotalScore, IsPassed)
- Attempt Module (attempt data)
- Assessment Module (exam configuration)
- Storage Provider (for exports)

---

## Database Schema

### Entity Relationships
```
???????????????????     ????????????????????
?      Exam       ?1   *?      Result      ?
????????????????????????????????????????????
? Id        ?     ? Id   ?
? TitleEn     ?     ? ExamId  ?
? PassScore       ?     ? AttemptId (UK)   ?
? MaxAttempts     ?     ? CandidateId      ?
???????????????????     ? TotalScore    ?
          ? IsPassed    ?
         ? IsPublished      ?
      ? FinalizedAt      ?
         ????????????????????

???????????????????     ????????????????????????
?      Exam       ?1   *? CandidateExamSummary ?
????????????????????????????????????????????????
? Id       ?     ? Id    ?
?       ?     ? ExamId      ?
??????????????????? ? CandidateId (UK)     ?
      ? TotalAttempts        ?
 ? BestScore            ?
       ? BestIsPassed ?
            ? LastAttemptAt    ?
    ????????????????????????

???????????????????     ????????????????????
?      Exam       ?1   *?    ExamReport    ?
????????????????????????????????????????????
? Id     ?     ? Id               ?
?     ? ? ExamId ?
???????????????????     ? TotalAttempts    ?
     ? PassRate      ?
           ? AverageScore     ?
            ? GeneratedAt      ?
     ????????????????????

????????????????????????????
? QuestionPerformanceReport?
????????????????????????????
? Id     ?
? ExamId     ?
? QuestionId               ?
? TotalAnswers      ?
? CorrectAnswers?
? CorrectRate            ?
? DifficultyIndex          ?
????????????????????????????

????????????????????
?  ResultExportJob ?
????????????????????
? Id               ?
? ExamId           ?
? Format     ?
? Status      ?
? FilePath         ?
? RequestedAt      ?
? CompletedAt      ?
????????????????????
```

### Unique Constraints
- `Results`: (AttemptId) - One result per attempt
- `CandidateExamSummaries`: (ExamId, CandidateId) - One summary per candidate per exam

### Indexes
- `Results`: (ExamId, CandidateId), (ExamId, IsPassed), (FinalizedAt), (IsPublishedToCandidate)
- `ExamReports`: (ExamId, GeneratedAt)
- `QuestionPerformanceReports`: (ExamId, QuestionId)
- `ResultExportJobs`: (ExamId, Status, RequestedAt)

---

## API Endpoints

### Result Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/examresult/finalize/{gradingSessionId}` | Finalize result | Admin, Instructor |
| GET | `/api/examresult/{resultId}` | Get result by ID | Admin, Instructor |
| GET | `/api/examresult/attempt/{attemptId}` | Get result by attempt | Admin, Instructor |
| GET | `/api/examresult` | Get all results (paginated) | Admin, Instructor |
| GET | `/api/examresult/exam/{examId}` | Get exam results | Admin, Instructor |
| PUT | `/api/examresult/update-from-regrade/{id}` | Update after regrade | Admin, Instructor |

### Publishing

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/examresult/{resultId}/publish` | Publish result | Admin, Instructor |
| POST | `/api/examresult/{resultId}/unpublish` | Unpublish result | Admin |
| POST | `/api/examresult/publish/bulk` | Bulk publish | Admin, Instructor |
| POST | `/api/examresult/publish/exam` | Publish all exam results | Admin, Instructor |

### Candidate Access

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/examresult/my-result/{attemptId}` | Get my result | Authenticated |
| GET | `/api/examresult/my-results` | Get all my results | Authenticated |
| GET | `/api/examresult/my-summary/exam/{examId}` | Get my exam summary | Authenticated |

### Reports

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/examresult/report/generate` | Generate exam report | Admin, Instructor |
| GET | `/api/examresult/report/exam/{examId}` | Get exam report | Admin, Instructor |
| POST | `/api/examresult/report/question-performance/generate` | Generate Q stats | Admin, Instructor |
| GET | `/api/examresult/report/question-performance/exam/{examId}` | Get Q stats | Admin, Instructor |
| GET | `/api/examresult/dashboard/exam/{examId}` | Get dashboard | Admin, Instructor |

### Candidate Summaries

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/examresult/summary/refresh` | Refresh summary | Admin, Instructor |
| GET | `/api/examresult/summary/exam/{examId}/candidates` | Get all summaries | Admin, Instructor |

### Export

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/examresult/export/request` | Request export | Admin, Instructor |
| GET | `/api/examresult/export/{jobId}` | Get export job | Admin, Instructor |
| GET | `/api/examresult/export` | Get all export jobs | Admin, Instructor |
| POST | `/api/examresult/export/{jobId}/cancel` | Cancel export | Admin, Instructor |
| GET | `/api/examresult/export/{jobId}/download` | Download export | Admin, Instructor |

---

## Business Rules Implementation

### 1. Result Generation (Source of Truth)

```csharp
// Rule: Result only from completed grading
if (gradingSession.Status != GradingStatus.Completed && 
    gradingSession.Status != GradingStatus.AutoGraded)
{
    return FailureResponse("Grading must be completed first");
}

// Rule: One result per attempt
var existingResult = await GetByAttemptId(attemptId);
if (existingResult != null)
{
    return FailureResponse("Result already exists for this attempt");
}

// Create immutable result
var result = new Result
{
    ExamId = attempt.ExamId,
    AttemptId = attempt.Id,
    CandidateId = attempt.CandidateId,
    TotalScore = gradingSession.TotalScore ?? 0,
    IsPassed = totalScore >= exam.PassScore,
    FinalizedAt = DateTime.UtcNow
};
```

### 2. Result Finalization

```csharp
// On finalization, capture all scores
result.TotalScore = gradingSession.TotalScore ?? 0;
result.MaxPossibleScore = attempt.Questions.Sum(q => q.Points);
result.PassScore = exam.PassScore;
result.IsPassed = result.TotalScore >= result.PassScore;
result.GradeLabel = CalculateGradeLabel(result.TotalScore, result.MaxPossibleScore);
result.FinalizedAt = DateTime.UtcNow; // Server time

// After finalization - only these fields can be modified:
// - IsPublishedToCandidate
// - PublishedAt
// - PublishedBy
// - GradeLabel (if policy allows)
```

### 3. Publishing Results to Candidates

```csharp
// Rule: Only authorized roles can publish
[Authorize(Roles = "Admin,Instructor")]
public async Task<IActionResult> PublishResult(int resultId)

// On publish
result.IsPublishedToCandidate = true;
result.PublishedAt = DateTime.UtcNow;
result.PublishedBy = userId;

// Rule: Only Admin can unpublish
[Authorize(Roles = "Admin")]
public async Task<IActionResult> UnpublishResult(int resultId)
```

### 4. Candidate Access Control

```csharp
// Rule: Candidate can only see their own published results
if (result.CandidateId != candidateId)
{
    return FailureResponse("You do not have access to this result");
}

if (!result.IsPublishedToCandidate)
{
    return FailureResponse("Result is not yet published");
}

// Rule: Never expose correct answers
var dto = new CandidateResultDto
{
    TotalScore = result.TotalScore,
    IsPassed = result.IsPassed,
    // NO: CorrectAnswers, QuestionAnswerKey, etc.
};
```

### 5. Best Attempt / Candidate Summary Rules

```csharp
// Calculate best attempt (highest score, earliest on tie)
var bestResult = results
    .OrderByDescending(r => r.TotalScore)
    .ThenBy(r => r.FinalizedAt)
 .First();

summary.BestAttemptId = bestResult.AttemptId;
summary.BestScore = bestResult.TotalScore;
summary.BestIsPassed = bestResult.IsPassed;

// Latest attempt
var latestResult = results.OrderByDescending(r => r.FinalizedAt).First();
summary.LastAttemptAt = latestResult.Attempt.StartedAt;
summary.LatestScore = latestResult.TotalScore;
```

### 6. Exam Report Generation

```csharp
var report = new ExamReport
{
    TotalAttempts = attempts.Count,
    TotalSubmitted = attempts.Count(a => a.Status == AttemptStatus.Submitted),
    TotalExpired = attempts.Count(a => a.Status == AttemptStatus.Expired),
  TotalPassed = results.Count(r => r.IsPassed),
    TotalFailed = results.Count(r => !r.IsPassed),
    AverageScore = scores.Average(),
    HighestScore = scores.Max(),
    LowestScore = scores.Min(),
    PassRate = (TotalPassed / TotalResults) * 100,
    GeneratedAt = DateTime.UtcNow
};
```

### 7. Question Performance Report

```csharp
var report = new QuestionPerformanceReport
{
    TotalAnswers = questionAnswers.Count,
    CorrectAnswers = questionAnswers.Count(ga => ga.IsCorrect),
    IncorrectAnswers = TotalAnswers - CorrectAnswers,
    CorrectRate = CorrectAnswers / TotalAnswers, // 0..1
  AverageScore = questionAnswers.Average(ga => ga.Score),
    DifficultyIndex = CorrectRate // Lower = harder
};
```

### 8. Regrade Impact

```csharp
// When regrade happens, update result
result.TotalScore = gradingSession.TotalScore ?? 0;
result.IsPassed = result.TotalScore >= exam.PassScore;
result.GradeLabel = CalculateGradeLabel(result.TotalScore, result.MaxPossibleScore);
result.FinalizedAt = DateTime.UtcNow;
result.UpdatedDate = DateTime.UtcNow;
result.UpdatedBy = userId;

// Refresh dependent summaries
await RefreshCandidateExamSummaryAsync(examId, candidateId, userId);

// Note: Reports should be regenerated to reflect changes
```

---

## Usage Examples

### 1. Finalize Result from Grading

**Request:**
```http
POST /api/examresult/finalize/15
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
     "id": 42,
        "examId": 1,
"examTitleEn": "Introduction to Programming",
   "attemptId": 100,
     "attemptNumber": 1,
        "candidateId": "user123",
        "candidateName": "John Doe",
      "candidateEmail": "john@example.com",
        "totalScore": 85.5,
      "maxPossibleScore": 100,
     "passScore": 60,
     "percentage": 85.5,
        "isPassed": true,
        "gradeLabel": "B",
        "isPublishedToCandidate": false,
        "publishedAt": null,
        "finalizedAt": "2024-01-15T14:30:00Z"
    }
}
```

### 2. Get Results with Filtering

**Request:**
```http
GET /api/examresult?examId=1&isPassed=true&pageNumber=1&pageSize=10
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "items": [
            {
    "id": 42,
            "examId": 1,
          "examTitleEn": "Introduction to Programming",
      "attemptId": 100,
    "attemptNumber": 1,
   "candidateId": "user123",
    "candidateName": "John Doe",
"totalScore": 85.5,
      "maxPossibleScore": 100,
     "percentage": 85.5,
       "isPassed": true,
                "gradeLabel": "B",
           "isPublishedToCandidate": false,
  "finalizedAt": "2024-01-15T14:30:00Z"
         }
  ],
        "pageNumber": 1,
"pageSize": 10,
        "totalCount": 45
    }
}
```

### 3. Publish a Result

**Request:**
```http
POST /api/examresult/42/publish
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
  "data": {
    "id": 42,
        "isPublishedToCandidate": true,
     "publishedAt": "2024-01-15T15:00:00Z",
        ...
    }
}
```

### 4. Bulk Publish Results

**Request:**
```http
POST /api/examresult/publish/bulk
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "resultIds": [42, 43, 44, 45, 46]
}
```

**Response:**
```json
{
    "success": true,
    "data": 5,
    "message": "5 results published successfully"
}
```

### 5. Publish All Exam Results (Passed Only)

**Request:**
```http
POST /api/examresult/publish/exam
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "examId": 1,
    "passedOnly": true
}
```

**Response:**
```json
{
    "success": true,
    "data": 35,
    "message": "35 results published successfully"
}
```

### 6. Candidate Views Their Result

**Request:**
```http
GET /api/examresult/my-result/100
Authorization: Bearer {candidate_token}
```

**Response (if published):**
```json
{
    "success": true,
    "data": {
"resultId": 42,
    "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "examTitleAr": "????? ?? ???????",
        "attemptNumber": 1,
        "totalScore": 85.5,
        "maxPossibleScore": 100,
        "passScore": 60,
        "percentage": 85.5,
    "isPassed": true,
        "gradeLabel": "B",
        "finalizedAt": "2024-01-15T14:30:00Z",
        "attemptStartedAt": "2024-01-15T10:00:00Z",
        "attemptSubmittedAt": "2024-01-15T11:30:00Z",
        "questionResults": [
 {
                "questionNumber": 1,
       "questionBody": "What is a variable?",
        "pointsEarned": 4,
       "maxPoints": 4,
    "isCorrect": true,
             "feedback": null
      },
  {
            "questionNumber": 2,
 "questionBody": "Explain inheritance...",
      "pointsEarned": 8,
      "maxPoints": 10,
                "isCorrect": true,
     "feedback": "Good explanation, but missed method overriding"
            }
        ]
    }
}
```

**Response (if not published):**
```json
{
    "success": false,
    "message": "Result is not yet published"
}
```

### 7. Candidate Gets All Their Results

**Request:**
```http
GET /api/examresult/my-results
Authorization: Bearer {candidate_token}
```

**Response:**
```json
{
    "success": true,
 "data": [
        {
        "resultId": 42,
  "examId": 1,
   "examTitleEn": "Introduction to Programming",
            "attemptNumber": 1,
        "totalScore": 85.5,
            "maxPossibleScore": 100,
            "percentage": 85.5,
 "isPassed": true,
     "gradeLabel": "B",
            "finalizedAt": "2024-01-15T14:30:00Z"
      },
        {
    "resultId": 55,
          "examId": 2,
            "examTitleEn": "Data Structures",
     "attemptNumber": 1,
  "totalScore": 72,
    "maxPossibleScore": 100,
    "percentage": 72,
         "isPassed": true,
   "gradeLabel": "C",
   "finalizedAt": "2024-01-20T14:30:00Z"
        }
    ]
}
```

### 8. Candidate Gets Exam Summary

**Request:**
```http
GET /api/examresult/my-summary/exam/1
Authorization: Bearer {candidate_token}
```

**Response:**
```json
{
  "success": true,
    "data": {
        "id": 10,
     "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "examTitleAr": "????? ?? ???????",
        "candidateId": "user123",
        "candidateName": "John Doe",
        "totalAttempts": 2,
      "maxAttempts": 3,
        "remainingAttempts": 1,
        "bestAttemptId": 100,
        "bestScore": 85.5,
        "bestPercentage": 85.5,
        "bestIsPassed": true,
      "latestScore": 78,
        "latestIsPassed": true,
        "lastAttemptAt": "2024-01-20T10:00:00Z"
    }
}
```

### 9. Generate Exam Report

**Request:**
```http
POST /api/examresult/report/generate
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "examId": 1,
    "fromDate": "2024-01-01",
    "toDate": "2024-01-31"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 5,
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
    "fromDate": "2024-01-01T00:00:00Z",
  "toDate": "2024-01-31T00:00:00Z",
        "totalAttempts": 150,
        "totalSubmitted": 145,
        "totalExpired": 5,
        "totalPassed": 120,
   "totalFailed": 25,
        "averageScore": 72.5,
        "highestScore": 98,
  "lowestScore": 35,
        "passRate": 82.76,
        "totalFlaggedAttempts": null,
        "averageRiskScore": null,
   "generatedAt": "2024-01-31T16:00:00Z",
        "generatedBy": "instructor_001"
    }
}
```

### 10. Get Question Performance

**Request:**
```http
GET /api/examresult/report/question-performance/exam/1
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
  {
      "id": 1,
   "examId": 1,
        "questionId": 101,
          "questionBody": "What is a variable?",
            "questionTypeName": "MCQ Single Choice",
     "totalAnswers": 145,
     "correctAnswers": 130,
      "incorrectAnswers": 15,
            "unansweredCount": 0,
            "correctRate": 0.8966,
            "averageScore": 3.59,
      "maxPoints": 4,
      "difficultyIndex": 0.8966,
            "difficultyLabel": "Easy",
            "generatedAt": "2024-01-31T16:00:00Z"
        },
        {
            "id": 2,
       "examId": 1,
  "questionId": 105,
            "questionBody": "Explain the concept of inheritance...",
      "questionTypeName": "Essay",
       "totalAnswers": 145,
            "correctAnswers": 85,
          "incorrectAnswers": 60,
         "unansweredCount": 0,
          "correctRate": 0.5862,
            "averageScore": 6.5,
            "maxPoints": 10,
      "difficultyIndex": 0.5862,
            "difficultyLabel": "Medium",
            "generatedAt": "2024-01-31T16:00:00Z"
        },
        {
            "id": 3,
            "examId": 1,
 "questionId": 110,
    "questionBody": "Implement a binary search algorithm...",
   "questionTypeName": "Essay",
    "totalAnswers": 145,
 "correctAnswers": 42,
         "incorrectAnswers": 103,
            "unansweredCount": 0,
            "correctRate": 0.2897,
  "averageScore": 4.2,
            "maxPoints": 15,
   "difficultyIndex": 0.2897,
        "difficultyLabel": "Hard",
       "generatedAt": "2024-01-31T16:00:00Z"
        }
    ]
}
```

### 11. Get Result Dashboard

**Request:**
```http
GET /api/examresult/dashboard/exam/1
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "totalCandidates": 120,
    "totalAttempts": 150,
 "gradedCount": 145,
      "pendingGradingCount": 5,
        "publishedCount": 100,
    "unpublishedCount": 45,
        "passedCount": 120,
        "failedCount": 25,
        "passRate": 82.76,
        "averageScore": 72.5,
   "highestScore": 98,
        "lowestScore": 35,
  "scoreDistribution": [
  { "range": "0-10", "count": 2, "percentage": 1.38 },
            { "range": "10-20", "count": 3, "percentage": 2.07 },
            { "range": "20-30", "count": 5, "percentage": 3.45 },
            { "range": "30-40", "count": 8, "percentage": 5.52 },
        { "range": "40-50", "count": 12, "percentage": 8.28 },
            { "range": "50-60", "count": 15, "percentage": 10.34 },
         { "range": "60-70", "count": 25, "percentage": 17.24 },
            { "range": "70-80", "count": 35, "percentage": 24.14 },
            { "range": "80-90", "count": 30, "percentage": 20.69 },
          { "range": "90-100", "count": 10, "percentage": 6.90 }
    ]
    }
}
```

### 12. Request Export

**Request:**
```http
POST /api/examresult/export/request
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "examId": 1,
    "format": 2,
    "fromDate": "2024-01-01",
    "toDate": "2024-01-31",
    "passedOnly": false
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 10,
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
  "format": 2,
"formatName": "Excel",
        "status": 1,
        "statusName": "Pending",
  "fromDate": "2024-01-01T00:00:00Z",
      "toDate": "2024-01-31T00:00:00Z",
        "passedOnly": false,
   "failedOnly": null,
 "requestedBy": "instructor_001",
 "requestedAt": "2024-01-31T16:30:00Z",
        "fileName": null,
        "filePath": null,
        "downloadUrl": null,
        "completedAt": null,
    "errorMessage": null
    }
}
```

### 13. Check Export Job Status

**Request:**
```http
GET /api/examresult/export/10
Authorization: Bearer {instructor_token}
```

**Response (Completed):**
```json
{
    "success": true,
    "data": {
    "id": 10,
        "examId": 1,
        "format": 2,
        "formatName": "Excel",
        "status": 3,
        "statusName": "Completed",
        "fileName": "exam_1_results_20240131163500.xlsx",
   "filePath": "/exports/exam_1_results_20240131163500.xlsx",
   "downloadUrl": "/api/examresult/export/10/download",
        "fileSizeBytes": 125000,
        "completedAt": "2024-01-31T16:35:00Z"
    }
}
```

---

## Candidate Access Control

### What Candidates CAN See
- Their own published results only
- Total score, pass/fail status, grade label
- Per-question scores (if exam allows review)
- Grader feedback (if provided and allowed)
- Their exam summary (attempts, best score)

### What Candidates CANNOT See
- Unpublished results
- Other candidates' results
- Correct answers / answer keys
- QuestionOption.IsCorrect
- Instructor-only comments
- Grading rubrics

### Implementation Pattern
```csharp
// Always check ownership
if (result.CandidateId != candidateId)
{
    return FailureResponse("Access denied");
}

// Always check publication status
if (!result.IsPublishedToCandidate)
{
    return FailureResponse("Result not yet published");
}

// Return limited DTO - no answer keys
return new CandidateResultDto { ... }; // No CorrectOptions
```

---

## Report Generation

### On-Demand vs Scheduled
- **ExamReport**: Generated on-demand, cached until next generation
- **QuestionPerformanceReport**: Generated on-demand, replaces previous
- **CandidateExamSummary**: Auto-refreshed on result finalization
- **ResultDashboard**: Calculated in real-time

### Performance Considerations
```csharp
// For large datasets, consider:
// 1. Incremental updates instead of full recalculation
// 2. Background job for report generation
// 3. Caching for frequently accessed reports
// 4. Pagination for candidate summaries
```

---

## Export System

### Export Workflow
1. User requests export ? Job created with `Pending` status
2. Background service picks up job ? Status = `Processing`
3. Query results, generate file ? Store to storage provider
4. Mark job `Completed` with file path
5. User downloads file via download endpoint

### Supported Formats
- **CSV**: Lightweight, universal compatibility
- **Excel**: Formatted with headers, filters
- **PDF**: Formatted report with charts (future)

### Security
- Only Admin/Instructor can request exports
- Export respects user's access scope
- No answer keys in exports (unless admin export flag)

---

## Security Considerations

### Role-Based Access
```csharp
// Result management - Admin/Instructor only
[Authorize(Roles = "Admin,Instructor")]

// Unpublish - Admin only (audit trail requirement)
[Authorize(Roles = "Admin")]

// Candidate access - Authenticated + ownership check
[Authorize] + ownership validation
```

### Data Protection
- Results are immutable after finalization
- All changes tracked via BaseEntity
- Candidates never see unpublished results
- No answer keys exposed to candidates

---

## Future Enhancements

### 1. Certificate Generation
```csharp
public class Certificate
{
    public int ResultId { get; set; }
    public string CertificateNumber { get; set; }
    public DateTime IssuedAt { get; set; }
    public string? PdfPath { get; set; }
}
```

### 2. Result Appeal System
```csharp
public class ResultAppeal
{
    public int ResultId { get; set; }
    public string CandidateId { get; set; }
    public string AppealReason { get; set; }
    public AppealStatus Status { get; set; }
    public string? Resolution { get; set; }
}
```

### 3. Proctoring Integration
```csharp
// Add to ExamReport
public int TotalFlaggedAttempts { get; set; }
public decimal AverageRiskScore { get; set; }

// Add to Result
public decimal? IntegrityScore { get; set; }
public int? FlagCount { get; set; }
```

### 4. Email Notifications
```csharp
// On result publish
await _emailService.SendResultNotificationAsync(
    candidateEmail,
    examTitle,
    totalScore,
    isPassed
);
```

### 5. Advanced Analytics
```csharp
public class ExamAnalytics
{
    public decimal StandardDeviation { get; set; }
    public decimal Median { get; set; }
  public List<PercentileDto> Percentiles { get; set; }
    public decimal ReliabilityIndex { get; set; } // KR-20, Cronbach's Alpha
}
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddExamResultModule
dotnet ef database update
```

---

## Testing Checklist

- [ ] Finalize result from completed grading
- [ ] Reject finalization for incomplete grading
- [ ] Enforce one result per attempt
- [ ] Publish single result
- [ ] Bulk publish results
- [ ] Publish all exam results (passed only option)
- [ ] Unpublish result (Admin only)
- [ ] Candidate view published result
- [ ] Block candidate from unpublished result
- [ ] Block candidate from other's result
- [ ] Candidate view exam summary
- [ ] Update result after regrade
- [ ] Generate exam report
- [ ] Generate question performance
- [ ] Get result dashboard
- [ ] Request export job
- [ ] Process export job
- [ ] Download completed export
- [ ] Cancel pending export
- [ ] Verify grade label calculation
- [ ] Verify pass rate calculation
- [ ] Verify difficulty index calculation
- [ ] Verify score distribution
- [ ] Test date range filters
