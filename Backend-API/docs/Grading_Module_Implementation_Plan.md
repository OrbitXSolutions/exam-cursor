# Grading Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Auto-Grading Logic](#auto-grading-logic)
8. [Security Considerations](#security-considerations)
9. [Future Enhancements](#future-enhancements)

---

## Overview

The Grading Module handles the complete grading lifecycle for exam attempts, including:
- Auto-grading for objective questions (MCQ, TrueFalse, ShortAnswer)
- Manual grading queue for essay/subjective questions
- Re-grading with full audit trail
- Candidate result access with configurable visibility
- Exam-level and question-level statistics

### Key Features
- **Auto-Grading Engine**: Automatic grading for objective question types
- **Manual Grading Queue**: Workflow for instructors to grade essays
- **Re-grading Support**: Modify grades with full audit trail
- **Cross-Module Consistency**: Uses snapshots, unaffected by Question Bank changes
- **Statistics & Analytics**: Pass rates, difficulty index, score distributions

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? Grading/
?   ?       ??? GradingSession.cs
?   ?       ??? GradedAnswer.cs
?   ??? Enums/
?  ??? GradingEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Grading/
?   ?       ??? GradingDtos.cs
?   ??? Interfaces/
?   ?   ??? Grading/
?   ?       ??? IGradingService.cs
?   ??? Validators/
?       ??? Grading/
?           ??? GradingValidators.cs
??? Infrastructure/
?   ??? Data/
?   ?   ??? Configurations/
?   ?       ??? Grading/
?   ?    ??? GradingSessionConfiguration.cs
?   ?           ??? GradedAnswerConfiguration.cs
?   ??? Services/
?       ??? Grading/
?       ??? GradingService.cs
??? Controllers/
    ??? Grading/
        ??? GradingController.cs
```

### Dependencies
- Entity Framework Core
- FluentValidation
- System.Text.Json
- Attempt Module (for attempt data)
- QuestionBank Module (for correct answers)

---

## Database Schema

### Entity Relationships
```
???????????????????     ????????????????????
?    Attempt    ?1     1?  GradingSession  ?
??????????????????????????????????????????????
? Id      ?       ? Id?
? ExamId          ?       ? AttemptId (UK)   ?
? CandidateId     ?   ? GradedBy         ?
? TotalScore      ????????? Status        ?
? IsPassed        ?       ? TotalScore       ?
???????????????????       ? IsPassed      ?
          ? GradedAt         ?
        ????????????????????
   ?1
        ?
?*
       ????????????????????
            ?   GradedAnswer   ?
 ????????????????????
     ? Id       ?
  ? GradingSessionId ?
       ? QuestionId (UK)  ?
        ? Score      ?
  ? IsCorrect        ?
           ? IsManuallyGraded ?
             ? GraderComment    ?
        ????????????????????
```

### Unique Constraints
- `GradingSessions`: (AttemptId) - One session per attempt
- `GradedAnswers`: (GradingSessionId, QuestionId) - One graded answer per question per session

### Indexes
- `GradingSessions`: (AttemptId), (Status), (GradedBy), (GradedAt)
- `GradedAnswers`: (GradingSessionId), (AttemptId), (IsManuallyGraded)

---

## API Endpoints

### Grading Lifecycle

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/grading/initiate` | Start grading (triggers auto-grade) | Admin, Instructor |
| GET | `/api/grading/{id}` | Get grading session | Admin, Instructor |
| GET | `/api/grading/attempt/{attemptId}` | Get session by attempt | Admin, Instructor |
| POST | `/api/grading/complete` | Complete grading | Admin, Instructor |

### Manual Grading

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/grading/manual-grade` | Submit single grade | Admin, Instructor |
| POST | `/api/grading/manual-grade/bulk` | Bulk submit grades | Admin, Instructor |
| GET | `/api/grading/{id}/manual-queue` | Get pending manual grades | Admin, Instructor |

### Re-grading

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/grading/regrade` | Re-grade an answer | Admin, Instructor |

### Queries

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/grading` | Get all sessions (paginated) | Admin, Instructor |
| GET | `/api/grading/manual-required` | Get sessions needing manual grading | Admin, Instructor |
| GET | `/api/grading/stats/exam/{id}` | Get exam grading statistics | Admin, Instructor |
| GET | `/api/grading/stats/exam/{id}/questions` | Get question-level stats | Admin, Instructor |

### Candidate Access

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/grading/my-result/{attemptId}` | Get candidate's result | Authenticated |
| GET | `/api/grading/is-complete/{attemptId}` | Check if grading complete | Authenticated |

---

## Business Rules Implementation

### 1. Grading Session Creation

```csharp
// Rule: Only submitted/expired attempts can be graded
if (attempt.Status != AttemptStatus.Submitted && attempt.Status != AttemptStatus.Expired)
{
    return FailureResponse("Attempt must be Submitted or Expired");
}

// Rule: One grading session per attempt
var existingSession = await GetByAttemptId(attemptId);
if (existingSession != null)
{
    return FailureResponse("Grading session already exists");
}

// Initialize with Pending status
var session = new GradingSession
{
    AttemptId = attemptId,
    Status = GradingStatus.Pending,
    TotalScore = null,
    IsPassed = null
};
```

### 2. Auto-Grading Rules

```csharp
// Determine if question is auto-gradable
private bool IsQuestionAutoGradable(string questionTypeName)
{
    var autoGradableTypes = new[]
    {
        "mcq", "multiple choice", "single choice",
   "true", "false", "truefalse",
     "short answer"
    };
    return autoGradableTypes.Any(t => questionTypeName.Contains(t));
}

// MCQ Grading: Compare selected with correct
var selectedIds = JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson);
var correctIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).ToHashSet();
var isCorrect = selectedIds.ToHashSet().SetEquals(correctIds);

// ShortAnswer: Normalize and compare
var studentAnswer = answer.TextAnswer;
if (answerKey.TrimSpaces) studentAnswer = studentAnswer.Trim();
if (!answerKey.CaseSensitive) studentAnswer = studentAnswer.ToLowerInvariant();
// Compare against AcceptedAnswersJson list
```

### 3. Manual Grading Validation

```csharp
// Rule: Score cannot exceed max points
if (dto.Score > attemptQuestion.Points)
{
    return FailureResponse($"Score cannot exceed {attemptQuestion.Points}");
}

// Rule: Cannot modify completed session (use regrade instead)
if (session.Status == GradingStatus.Completed)
{
    return FailureResponse("Use re-grade for completed sessions");
}
```

### 4. Completing Grading

```csharp
// Rule: All questions must be graded
var pendingManualGrades = session.Answers
    .Where(a => a.IsManuallyGraded && a.UpdatedDate == null)
    .ToList();

if (pendingManualGrades.Any())
{
    return FailureResponse($"{pendingManualGrades.Count} questions need grading");
}

// Calculate final results
session.TotalScore = session.Answers.Sum(a => a.Score);
session.IsPassed = session.TotalScore >= exam.PassScore;
session.Status = GradingStatus.Completed;
session.GradedAt = DateTime.UtcNow;

// Update attempt with results
attempt.TotalScore = session.TotalScore;
attempt.IsPassed = session.IsPassed;
```

### 5. Re-grading

```csharp
// Rule: Update single answer and recalculate totals
gradedAnswer.Score = dto.NewScore;
gradedAnswer.IsCorrect = dto.IsCorrect;
gradedAnswer.GraderComment = dto.Comment;
gradedAnswer.UpdatedDate = DateTime.UtcNow;
gradedAnswer.UpdatedBy = graderId;

// Recalculate session totals
session.TotalScore = session.Answers.Sum(a => a.Score);
session.IsPassed = session.TotalScore >= exam.PassScore;

// Update attempt
attempt.TotalScore = session.TotalScore;
attempt.IsPassed = session.IsPassed;
```

---

## Usage Examples

### 1. Initiate Grading (Auto-Grade)

**Request:**
```http
POST /api/grading/initiate
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "attemptId": 42
}
```

**Response:**
```json
{
    "success": true,
    "message": "Auto-grading complete. 3 question(s) require manual grading.",
    "data": {
   "gradingSessionId": 15,
        "attemptId": 42,
        "status": 3,
"statusName": "ManualRequired",
        "autoGradedCount": 22,
        "manualGradingRequired": 3,
        "partialScore": 72.5
    }
}
```

### 2. Get Grading Session

**Request:**
```http
GET /api/grading/15
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 15,
        "attemptId": 42,
        "examId": 1,
      "examTitleEn": "Introduction to Programming",
        "candidateId": "user123",
        "candidateName": "John Doe",
        "status": 3,
        "statusName": "ManualRequired",
        "totalScore": null,
        "maxPossibleScore": 100,
  "passScore": 60,
        "isPassed": null,
      "totalQuestions": 25,
      "gradedQuestions": 22,
        "manualGradingRequired": 3,
      "answers": [
            {
    "id": 1,
        "questionId": 101,
   "questionBody": "What is a variable?",
     "questionTypeName": "MCQ Single Choice",
    "maxPoints": 4,
"selectedOptionIds": [1],
                "score": 4,
                "isCorrect": true,
     "isManuallyGraded": false,
    "correctOptions": [
        { "id": 1, "text": "A container for data" }
        ]
        },
    {
       "id": 2,
           "questionId": 105,
       "questionBody": "Explain the concept of inheritance...",
  "questionTypeName": "Essay",
         "maxPoints": 10,
   "textAnswer": "Inheritance is a mechanism where...",
         "score": 0,
              "isCorrect": false,
                "isManuallyGraded": true,
             "modelAnswer": "Inheritance allows a class to..."
            }
        ]
    }
}
```

### 3. Get Manual Grading Queue

**Request:**
```http
GET /api/grading/15/manual-queue
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
     {
            "id": 2,
 "questionId": 105,
    "questionBody": "Explain the concept of inheritance...",
            "questionTypeName": "Essay",
   "maxPoints": 10,
  "textAnswer": "Inheritance is a mechanism where a new class inherits properties...",
            "score": 0,
            "isCorrect": false,
         "isManuallyGraded": true,
            "modelAnswer": "Inheritance allows a class to inherit properties and methods..."
  }
    ]
}
```

### 4. Submit Manual Grade

**Request:**
```http
POST /api/grading/manual-grade
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "gradingSessionId": 15,
    "questionId": 105,
  "score": 8,
    "isCorrect": true,
    "graderComment": "Good explanation but missed the concept of method overriding."
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "gradedAnswerId": 2,
        "questionId": 105,
        "score": 8,
    "isCorrect": true,
        "success": true,
        "message": "Grade submitted successfully"
    }
}
```

### 5. Bulk Submit Manual Grades

**Request:**
```http
POST /api/grading/manual-grade/bulk
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "gradingSessionId": 15,
    "grades": [
     {
            "questionId": 105,
            "score": 8,
"isCorrect": true,
            "graderComment": "Good explanation"
        },
        {
            "questionId": 110,
            "score": 6,
    "isCorrect": true,
     "graderComment": "Partially correct"
        },
    {
        "questionId": 115,
    "score": 3,
            "isCorrect": false,
            "graderComment": "Missing key concepts"
   }
    ]
}
```

### 6. Complete Grading

**Request:**
```http
POST /api/grading/complete
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "gradingSessionId": 15
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "gradingSessionId": 15,
        "attemptId": 42,
        "totalScore": 89.5,
     "maxPossibleScore": 100,
        "passScore": 60,
        "isPassed": true,
        "gradedAt": "2024-01-15T14:30:00Z",
 "status": 4,
        "message": "Grading completed. Candidate PASSED."
    }
}
```

### 7. Re-grade an Answer

**Request:**
```http
POST /api/grading/regrade
Content-Type: application/json
Authorization: Bearer {instructor_token}

{
    "gradingSessionId": 15,
    "questionId": 105,
    "newScore": 9,
    "isCorrect": true,
    "comment": "After review, answer deserves more credit",
    "reason": "Appeal review - additional consideration given"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "gradedAnswerId": 2,
        "previousScore": 8,
        "newScore": 9,
      "newTotalScore": 90.5,
        "newIsPassed": true,
   "message": "Answer re-graded successfully"
    }
}
```

### 8. Get Candidate Result

**Request:**
```http
GET /api/grading/my-result/42
Authorization: Bearer {candidate_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "attemptId": 42,
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
  "examTitleAr": "????? ?? ???????",
        "totalScore": 89.5,
        "maxPossibleScore": 100,
        "passScore": 60,
        "isPassed": true,
 "percentage": 89.5,
        "gradedAt": "2024-01-15T14:30:00Z",
        "status": 4,
        "statusName": "Completed",
        "isGradingComplete": true,
        "questionResults": [
     {
      "questionId": 101,
      "questionBody": "What is a variable?",
       "pointsEarned": 4,
        "maxPoints": 4,
             "isCorrect": true,
              "feedback": null
            },
      {
       "questionId": 105,
       "questionBody": "Explain the concept of inheritance...",
     "pointsEarned": 9,
    "maxPoints": 10,
        "isCorrect": true,
 "feedback": "Good explanation but missed the concept of method overriding."
         }
        ]
    }
}
```

### 9. Get Exam Statistics

**Request:**
```http
GET /api/grading/stats/exam/1
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "examId": 1,
 "examTitleEn": "Introduction to Programming",
        "totalAttempts": 150,
        "gradedAttempts": 145,
        "pendingGrading": 2,
        "manualGradingRequired": 3,
        "passedCount": 120,
        "failedCount": 25,
        "averageScore": 72.5,
        "highestScore": 98,
        "lowestScore": 35,
        "passRate": 82.76
    }
}
```

### 10. Get Question Statistics

**Request:**
```http
GET /api/grading/stats/exam/1/questions
Authorization: Bearer {instructor_token}
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
   "questionId": 101,
            "questionBody": "What is a variable?",
    "questionTypeName": "MCQ Single Choice",
            "totalAnswers": 145,
        "correctAnswers": 130,
            "incorrectAnswers": 15,
   "averageScore": 3.59,
            "maxPoints": 4,
    "difficultyIndex": 0.897
      },
        {
  "questionId": 102,
            "questionBody": "Which of the following are data types?",
   "questionTypeName": "MCQ Multiple Choice",
            "totalAnswers": 145,
            "correctAnswers": 85,
   "incorrectAnswers": 60,
        "averageScore": 2.35,
     "maxPoints": 4,
       "difficultyIndex": 0.586
        }
 ]
}
```

---

## Auto-Grading Logic

### MCQ Single/Multiple Choice

```csharp
// Get selected and correct options
var selectedIds = JsonSerializer.Deserialize<List<int>>(answer.SelectedOptionIdsJson);
var correctOptionIds = question.Options
    .Where(o => o.IsCorrect)
    .Select(o => o.Id)
    .ToHashSet();

// All-or-nothing scoring
var isCorrect = selectedIds.ToHashSet().SetEquals(correctOptionIds);
return isCorrect ? (maxPoints, true) : (0, false);

// Future: Partial credit for multiple choice
// var correctSelected = selectedIds.Count(id => correctOptionIds.Contains(id));
// var partialScore = (correctSelected / correctOptionIds.Count) * maxPoints;
```

### True/False

Same as MCQ Single Choice - exactly one option must be selected.

### Short Answer

```csharp
// Get accepted answers from answer key
var acceptedAnswers = JsonSerializer.Deserialize<List<string>>(answerKey.AcceptedAnswersJson);

var studentAnswer = answer.TextAnswer;

// Normalize based on settings
if (answerKey.TrimSpaces)
    studentAnswer = studentAnswer.Trim();

if (answerKey.NormalizeWhitespace)
    studentAnswer = Regex.Replace(studentAnswer, @"\s+", " ");

if (!answerKey.CaseSensitive)
    studentAnswer = studentAnswer.ToLowerInvariant();

// Check against each accepted answer
foreach (var accepted in acceptedAnswers)
{
    var normalized = NormalizeAnswer(accepted, answerKey);
    if (studentAnswer == normalized)
        return (maxPoints, true);
}

return (0, false);
```

### Essay (Manual Only)

Essays are not auto-gradable. They are flagged with `IsManuallyGraded = true` and appear in the manual grading queue.

---

## Security Considerations

### 1. Role-Based Access

```csharp
// Grading operations restricted to Admin/Instructor
[Authorize(Roles = "Admin,Instructor")]
public async Task<IActionResult> SubmitManualGrade(...)

// Candidates can only see their own results
if (session.Attempt.CandidateId != candidateId)
{
    return FailureResponse("You do not have access to this result");
}
```

### 2. Result Visibility

```csharp
// Only return results when grading is complete
if (session.Status != GradingStatus.Completed && session.Status != GradingStatus.AutoGraded)
{
    return new CandidateGradingResultDto
    {
        Status = session.Status,
   IsGradingComplete = false,
        // Limited info only
    };
}
```

### 3. Audit Trail

All grading operations are tracked via BaseEntity:
- `CreatedDate`, `CreatedBy` - Initial grading
- `UpdatedDate`, `UpdatedBy` - Re-grading
- Full history preserved for auditing

### 4. Snapshot Integrity

Grading uses AttemptQuestion snapshots, not live Question Bank data:
- Points are frozen at attempt creation
- Changes to Question Bank don't affect existing grades

---

## Future Enhancements

### 1. Partial Credit Scoring

```csharp
// MCQ Multiple Choice with partial credit
var correctSelected = selectedIds.Count(id => correctOptionIds.Contains(id));
var incorrectSelected = selectedIds.Count(id => !correctOptionIds.Contains(id));
var partialScore = Math.Max(0, 
    (correctSelected - incorrectSelected) / correctOptionIds.Count) * maxPoints;
```

### 2. AI-Assisted Essay Grading

```csharp
// Integration with AI grading service
public async Task<GradingSuggestion> GetAiGradingSuggestionAsync(
    string studentAnswer, 
    string rubric,
    decimal maxPoints)
{
    // Call AI service for suggested score and feedback
}
```

### 3. Grading Rubrics

```csharp
public class GradingRubric
{
    public int QuestionId { get; set; }
    public List<RubricCriterion> Criteria { get; set; }
}

public class RubricCriterion
{
    public string Description { get; set; }
    public decimal Points { get; set; }
    public bool IsMet { get; set; }
}
```

### 4. Background Auto-Grading Job

```csharp
// Add to Program.cs
builder.Services.AddHostedService<GradingBackgroundService>();

public class GradingBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
   // Auto-initiate grading for submitted attempts
            await ProcessPendingAttemptsAsync();
          await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
   }
    }
}
```

### 5. Grade Appeals Workflow

```csharp
public class GradeAppeal
{
    public int GradedAnswerId { get; set; }
    public string CandidateId { get; set; }
    public string AppealReason { get; set; }
    public AppealStatus Status { get; set; } // Pending, Approved, Rejected
  public string? Resolution { get; set; }
}
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddGradingModule
dotnet ef database update
```

---

## Testing Checklist

- [ ] Initiate grading for submitted attempt
- [ ] Initiate grading for expired attempt
- [ ] Reject grading for non-submitted attempt
- [ ] Auto-grade MCQ single choice
- [ ] Auto-grade MCQ multiple choice
- [ ] Auto-grade True/False
- [ ] Auto-grade Short Answer
- [ ] Flag Essay for manual grading
- [ ] Submit manual grade
- [ ] Validate score against max points
- [ ] Bulk submit manual grades
- [ ] Complete grading (all graded)
- [ ] Reject completion with pending grades
- [ ] Re-grade an answer
- [ ] Recalculate totals after re-grade
- [ ] Candidate view result (complete)
- [ ] Hide result before completion
- [ ] Get exam statistics
- [ ] Get question statistics
- [ ] Verify one session per attempt constraint
- [ ] Verify audit trail on re-grade
