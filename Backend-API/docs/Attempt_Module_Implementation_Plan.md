# Attempt Module — Implementation Plan & Examples

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Business Rules Implementation](#business-rules-implementation)
6. [Usage Examples](#usage-examples)
7. [Security Considerations](#security-considerations)
8. [Future Enhancements](#future-enhancements)

---

## Overview

The Attempt Module manages the complete lifecycle of exam attempts by candidates, including:
- Starting/resuming attempts
- Saving answers (with autosave support)
- Managing attempt timer and expiry
- Submitting attempts
- Event logging for proctoring/auditing
- Admin operations (cancel, force-submit)

### Key Features
- **Idempotent Attempt Creation**: Prevents duplicate active attempts
- **Snapshot-based Questions**: Questions are frozen at attempt creation
- **Server-side Timer**: Server is the source of truth for time
- **Answer Validation**: Type-specific validation for MCQ, TrueFalse, Essay, etc.
- **Event Logging**: Comprehensive audit trail for proctoring
- **Security**: No exposure of correct answers to candidates

---

## Architecture

### File Structure
```
Smart_Core/
??? Domain/
?   ??? Entities/
?   ?   ??? Attempt/
?   ?   ??? Attempt.cs
?   ?       ??? AttemptQuestion.cs
?   ?     ??? AttemptAnswer.cs
?   ?       ??? AttemptEvent.cs
?   ??? Enums/
?       ??? AttemptEnums.cs
??? Application/
?   ??? DTOs/
?   ?   ??? Attempt/
?   ?       ??? AttemptDtos.cs
?   ??? Interfaces/
? ?   ??? Attempt/
?   ?       ??? IAttemptService.cs
? ??? Validators/
?       ??? Attempt/
?     ??? AttemptValidators.cs
??? Infrastructure/
? ??? Data/
?   ?   ??? Configurations/
?   ?       ??? Attempt/
?   ?           ??? AttemptConfiguration.cs
?   ?           ??? AttemptQuestionConfiguration.cs
??           ??? AttemptAnswerConfiguration.cs
?   ?    ??? AttemptEventConfiguration.cs
?   ??? Services/
?     ??? Attempt/
?           ??? AttemptService.cs
??? Controllers/
    ??? Attempt/
        ??? AttemptController.cs
```

### Dependencies
- Entity Framework Core
- FluentValidation
- System.Text.Json

---

## Database Schema

### Entity Relationships
```
???????????????       ????????????????????       ???????????????????
?    Exam     ?1     *?   Attempt      ?1     *? AttemptQuestion ?
????????????????????????????????????????????????????????????????????
? Id          ?  ? Id        ?       ? Id              ?
? TitleEn     ?       ? ExamId         ?       ? AttemptId       ?
? Duration... ?  ? CandidateId      ?       ? QuestionId      ?
? MaxAttempts ?    ? StartedAt     ?       ? Order (snapshot)?
? PassScore   ?       ? ExpiresAt     ?       ? Points(snapshot)?
???????????????       ? Status    ?       ???????????????????
   ? AttemptNumber    ?      ?
               ? TotalScore       ?                ?1
         ? IsPassed         ?  ?
????????????????????   ?
      ?1 ?
         ?    ?
  ?*            ?*
           ????????????????????       ???????????????????
      ?   AttemptEvent   ?       ?  AttemptAnswer  ?
    ????????????????????       ???????????????????
        ? Id         ?       ? Id    ?
   ? AttemptId        ?       ? AttemptQuestionId?
 ? EventType        ?    ? QuestionId      ?
 ? MetadataJson     ?  ? SelectedOption..?
       ? OccurredAt    ?       ? TextAnswer      ?
     ????????????????????       ? IsCorrect       ?
      ? Score       ?
         ? AnsweredAt      ?
    ???????????????????
```

### Unique Constraints
- `Attempts`: (ExamId, CandidateId, AttemptNumber)
- `AttemptQuestions`: (AttemptId, QuestionId)
- `AttemptAnswers`: (AttemptId, QuestionId)

### Indexes
- `Attempts`: (ExamId, CandidateId), (Status), (StartedAt), (ExpiresAt), (CandidateId)
- `AttemptQuestions`: (AttemptId), (Order)
- `AttemptAnswers`: (AttemptId), (AttemptQuestionId)
- `AttemptEvents`: (AttemptId), (AttemptId, OccurredAt), (EventType)

---

## API Endpoints

### Candidate Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attempt/start` | Start a new attempt or resume existing |
| GET | `/api/attempt/{id}/session` | Get attempt session (questions, timer) |
| POST | `/api/attempt/{id}/submit` | Submit the attempt |
| GET | `/api/attempt/{id}/timer` | Get remaining time |
| POST | `/api/attempt/{id}/answers` | Save a single answer |
| POST | `/api/attempt/{id}/answers/bulk` | Bulk save answers |
| GET | `/api/attempt/{id}/answers` | Get all answers |
| POST | `/api/attempt/{id}/events` | Log an event |
| GET | `/api/attempt/exam/{examId}/my-attempts` | Get my attempts for exam |
| GET | `/api/attempt/my-attempts` | Get all my attempts |

### Admin Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/attempt` | Get all attempts (paginated) | Admin, Instructor |
| GET | `/api/attempt/{id}` | Get attempt by ID | Admin, Instructor |
| GET | `/api/attempt/{id}/details` | Get full attempt details | Admin, Instructor |
| GET | `/api/attempt/{id}/events` | Get attempt events | Admin, Instructor |
| POST | `/api/attempt/cancel` | Cancel an attempt | Admin |
| POST | `/api/attempt/{id}/force-submit` | Force submit attempt | Admin |

---

## Business Rules Implementation

### 1. Attempt Creation

```csharp
// Rule: Check exam is active and published
if (!exam.IsActive)
    return FailureResponse("Exam is not active");

if (!exam.IsPublished)
    return FailureResponse("Exam is not published");

// Rule: Check exam schedule
if (exam.StartAt.HasValue && now < exam.StartAt.Value)
    return FailureResponse("Exam has not started yet");

if (exam.EndAt.HasValue && now > exam.EndAt.Value)
    return FailureResponse("Exam has ended");

// Rule: Validate access code if required
if (exam.AccessPolicy?.AccessCode != null)
{
    if (!exam.AccessPolicy.AccessCode.Equals(dto.AccessCode))
        return FailureResponse("Invalid access code");
}

// Rule: Check for existing active attempt (idempotency)
var existingAttempt = await GetActiveAttempt(examId, candidateId);
if (existingAttempt != null && !existingAttempt.IsExpired)
    return SuccessResponse(existingAttempt, "Resuming existing attempt");

// Rule: Check max attempts
if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
    return FailureResponse("Maximum attempts reached");
```

### 2. Timer & Expiry

```csharp
// Rule: Calculate effective expiry
private DateTime CalculateExpiresAt(DateTime startedAt, int durationMinutes, DateTime? examEndAt)
{
    var durationExpiry = startedAt.AddMinutes(durationMinutes);
    
    // EffectiveExpiresAt = min(StartedAt + Duration, Exam.EndAt)
    if (examEndAt.HasValue)
        return durationExpiry < examEndAt.Value ? durationExpiry : examEndAt.Value;
    
    return durationExpiry;
}

// Rule: Auto-expire on access
if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value)
{
    attempt.Status = AttemptStatus.Expired;
    await SaveChangesAsync();
}
```

### 3. Status Lifecycle

```csharp
// Allowed transitions
Started ? InProgress (on first answer save)
Started ? Submitted
Started ? Expired
InProgress ? Submitted
InProgress ? Expired
Started/InProgress ? Cancelled (admin only)

// Validation
if (attempt.Status == AttemptStatus.Submitted)
    return FailureResponse("Already submitted");

if (attempt.Status == AttemptStatus.Expired)
  return FailureResponse("Attempt has expired");
```

### 4. Question Snapshot

```csharp
// At attempt creation, snapshot questions
var order = 1;
foreach (var examQuestion in examQuestions)
{
    // Order: Use original or shuffle based on exam settings
    if (exam.ShuffleQuestions)
      examQuestions = examQuestions.OrderBy(_ => Guid.NewGuid());
    
    var attemptQuestion = new AttemptQuestion
    {
        AttemptId = attempt.Id,
   QuestionId = examQuestion.QuestionId,
        Order = order++,
   Points = examQuestion.Points  // Snapshot points
    };
}
```

### 5. Answer Validation

```csharp
// MCQ Single Choice
if (questionType.Contains("mcq") && questionType.Contains("single"))
{
 if (selectedOptions?.Count != 1)
    return (false, "Must select exactly one option");
}

// MCQ Multiple Choice
if (questionType.Contains("mcq") && questionType.Contains("multiple"))
{
 if (selectedOptions?.Count < 1)
     return (false, "Must select at least one option");
}

// True/False
if (questionType.Contains("true") && questionType.Contains("false"))
{
    if (selectedOptions?.Count != 1)
        return (false, "Must select one option");
}

// Essay/Short Answer
if (questionType.Contains("essay") || questionType.Contains("short"))
{
    if (string.IsNullOrWhiteSpace(textAnswer))
        return (false, "Text answer is required");
}

// Validate option IDs belong to question
var validOptionIds = question.Options.Select(o => o.Id).ToHashSet();
if (!selectedOptions.All(id => validOptionIds.Contains(id)))
    return (false, "Invalid option selected");
```

---

## Usage Examples

### 1. Start an Exam Attempt

**Request:**
```http
POST /api/attempt/start
Content-Type: application/json
Authorization: Bearer {token}

{
    "examId": 1,
    "accessCode": "ABC123"
}
```

**Response (Success):**
```json
{
    "success": true,
    "message": "Attempt started successfully",
    "data": {
        "attemptId": 42,
        "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "examTitleAr": "????? ?? ???????",
        "startedAt": "2024-01-15T10:00:00Z",
        "expiresAt": "2024-01-15T11:00:00Z",
        "remainingSeconds": 3600,
        "totalQuestions": 25,
        "answeredQuestions": 0,
        "status": 1,
        "attemptNumber": 1,
        "maxAttempts": 3,
        "questions": [
         {
       "attemptQuestionId": 1,
    "questionId": 101,
          "order": 1,
            "points": 4.0,
    "body": "What is a variable?",
  "questionTypeName": "MCQ Single Choice",
 "questionTypeId": 1,
             "options": [
    { "id": 1, "text": "A container for data", "order": 1 },
   { "id": 2, "text": "A programming language", "order": 2 },
          { "id": 3, "text": "A type of loop", "order": 3 }
                ],
     "attachments": [],
 "currentAnswer": null
            }
     ],
  "instructions": [
            { "order": 1, "contentEn": "Read carefully", "contentAr": "???? ??????" }
        ]
    }
}
```

### 2. Save an Answer (MCQ)

**Request:**
```http
POST /api/attempt/42/answers
Content-Type: application/json
Authorization: Bearer {token}

{
    "questionId": 101,
    "selectedOptionIds": [1]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Answer saved successfully",
    "data": {
     "attemptAnswerId": 1,
     "questionId": 101,
        "answeredAt": "2024-01-15T10:05:30Z",
        "success": true,
  "message": "Answer saved successfully"
    }
}
```

### 3. Save an Answer (Essay)

**Request:**
```http
POST /api/attempt/42/answers
Content-Type: application/json
Authorization: Bearer {token}

{
    "questionId": 105,
    "textAnswer": "A variable is a named container that stores data in memory. It can hold different types of values such as numbers, strings, or objects."
}
```

### 4. Bulk Save Answers

**Request:**
```http
POST /api/attempt/42/answers/bulk
Content-Type: application/json
Authorization: Bearer {token}

{
    "answers": [
        { "questionId": 101, "selectedOptionIds": [1] },
 { "questionId": 102, "selectedOptionIds": [5, 7] },
  { "questionId": 103, "textAnswer": "Programming is..." }
    ]
}
```

### 5. Get Timer

**Request:**
```http
GET /api/attempt/42/timer
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "attemptId": 42,
    "serverTime": "2024-01-15T10:30:00Z",
        "expiresAt": "2024-01-15T11:00:00Z",
  "remainingSeconds": 1800,
    "status": 2,
      "isExpired": false
    }
}
```

### 6. Submit Attempt

**Request:**
```http
POST /api/attempt/42/submit
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "attemptId": 42,
  "submittedAt": "2024-01-15T10:45:00Z",
        "status": 3,
        "statusName": "Submitted",
        "totalQuestions": 25,
    "answeredQuestions": 24,
        "message": "Attempt submitted successfully"
    }
}
```

### 7. Log Event (Tab Switch)

**Request:**
```http
POST /api/attempt/42/events
Content-Type: application/json
Authorization: Bearer {token}

{
    "eventType": 4,
    "metadataJson": "{\"browser\": \"Chrome\", \"timestamp\": \"2024-01-15T10:20:00Z\"}"
}
```

### 8. Admin - Get Attempt Details

**Request:**
```http
GET /api/attempt/42/details
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
 "success": true,
    "data": {
        "id": 42,
     "examId": 1,
        "examTitleEn": "Introduction to Programming",
        "candidateId": "user123",
        "candidateName": "John Doe",
        "startedAt": "2024-01-15T10:00:00Z",
   "submittedAt": "2024-01-15T10:45:00Z",
        "status": 3,
        "totalScore": 85.5,
        "isPassed": true,
        "events": [
       { "id": 1, "eventType": 1, "eventTypeName": "Started", "occurredAt": "2024-01-15T10:00:00Z" },
            { "id": 2, "eventType": 2, "eventTypeName": "AnswerSaved", "occurredAt": "2024-01-15T10:05:30Z" }
        ],
        "answerDetails": [
      {
          "attemptAnswerId": 1,
                "questionId": 101,
    "questionBody": "What is a variable?",
     "points": 4.0,
         "selectedOptionIds": [1],
   "isCorrect": true,
      "score": 4.0
     }
    ]
    }
}
```

### 9. Admin - Cancel Attempt

**Request:**
```http
POST /api/attempt/cancel
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "attemptId": 42,
    "reason": "Technical issues reported by candidate"
}
```

---

## Security Considerations

### 1. Never Expose Correct Answers

The `AttemptQuestionOptionDto` does NOT include `IsCorrect`:

```csharp
public class AttemptQuestionOptionDto
{
  public int Id { get; set; }
    public string Text { get; set; }
    public int Order { get; set; }
  // Note: NO IsCorrect property!
}
```

### 2. Candidate Ownership Validation

Every candidate endpoint validates ownership:

```csharp
if (attempt.CandidateId != candidateId)
{
    return FailureResponse("You do not have access to this attempt");
}
```

### 3. Server-Side Time Control

- All timestamps use `DateTime.UtcNow` on server
- Client cannot manipulate timer
- Expiry is enforced on every request

### 4. Answer Modification Prevention

- Answers can only be saved for `Started` or `InProgress` status
- After submit/expire, all modifications are rejected
- Events are append-only

---

## Future Enhancements

### 1. Proctoring Integration
- Webcam monitoring events
- Face detection alerts
- Browser lockdown events

### 2. Partial Scoring
- Support for partial credit on MCQ multiple choice
- Manual grading queue for essays

### 3. Attempt Analytics
- Time spent per question
- Answer change tracking
- Performance heatmaps

### 4. Resume Capability
- Network disconnect handling
- Browser crash recovery
- Multi-device prevention

### 5. Background Job for Expiry
```csharp
// Add to Program.cs for automatic expiry check
builder.Services.AddHostedService<AttemptExpiryBackgroundService>();

public class AttemptExpiryBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
     while (!stoppingToken.IsCancellationRequested)
        {
   using var scope = _serviceProvider.CreateScope();
        var attemptService = scope.ServiceProvider.GetRequiredService<IAttemptService>();
            await attemptService.ExpireOverdueAttemptsAsync();
  await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
  }
    }
}
```

---

## Migration Command

After adding the entities, run:

```bash
dotnet ef migrations add AddAttemptModule
dotnet ef database update
```

---

## Testing Checklist

- [ ] Start attempt for active, published exam
- [ ] Verify access code validation
- [ ] Verify max attempts enforcement
- [ ] Resume existing active attempt
- [ ] Save MCQ single choice answer
- [ ] Save MCQ multiple choice answer
- [ ] Save True/False answer
- [ ] Save Essay answer
- [ ] Bulk save answers
- [ ] Submit before expiry
- [ ] Reject submit after expiry
- [ ] Timer accuracy
- [ ] Auto-expire on timer check
- [ ] Event logging
- [ ] Admin view attempt details
- [ ] Admin cancel attempt
- [ ] Admin force submit
- [ ] Question shuffling
- [ ] Option shuffling
- [ ] Snapshot points immutability
