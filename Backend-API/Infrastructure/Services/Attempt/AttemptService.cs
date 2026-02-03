using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.Attempt;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Attempt;

public class AttemptService : IAttemptService
{
    private readonly ApplicationDbContext _context;

    public AttemptService(ApplicationDbContext context)
    {
_context = context;
    }

    #region Attempt Lifecycle

    public async Task<ApiResponse<AttemptSessionDto>> StartAttemptAsync(StartAttemptDto dto, string candidateId)
    {
        // 1. Get exam with all required data
  var exam = await _context.Exams
            .Include(e => e.Sections.Where(s => !s.IsDeleted))
    .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
         .ThenInclude(eq => eq.Question)
   .ThenInclude(q => q.QuestionType)
        .Include(e => e.Sections.Where(s => !s.IsDeleted))
    .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
       .ThenInclude(eq => eq.Question)
       .ThenInclude(q => q.Options.Where(o => !o.IsDeleted))
        .Include(e => e.Sections.Where(s => !s.IsDeleted))
       .ThenInclude(s => s.Questions.Where(q => !q.IsDeleted))
   .ThenInclude(eq => eq.Question)
       .ThenInclude(q => q.Attachments.Where(a => !a.IsDeleted))
            .Include(e => e.AccessPolicy)
    .Include(e => e.Instructions.Where(i => !i.IsDeleted))
            .FirstOrDefaultAsync(e => e.Id == dto.ExamId);

        if (exam == null)
        {
   return ApiResponse<AttemptSessionDto>.FailureResponse("Exam not found");
        }

        // 2. Validate exam is active and published
        if (!exam.IsActive)
        {
 return ApiResponse<AttemptSessionDto>.FailureResponse("Exam is not active");
        }

        if (!exam.IsPublished)
      {
   return ApiResponse<AttemptSessionDto>.FailureResponse("Exam is not published");
   }

        // 3. Validate exam schedule
var now = DateTime.UtcNow;

        if (exam.StartAt.HasValue && now < exam.StartAt.Value)
        {
return ApiResponse<AttemptSessionDto>.FailureResponse(
                $"Exam has not started yet. It starts at {exam.StartAt.Value:yyyy-MM-dd HH:mm} UTC");
    }

  if (exam.EndAt.HasValue && now > exam.EndAt.Value)
    {
            return ApiResponse<AttemptSessionDto>.FailureResponse(
                $"Exam has ended. It ended at {exam.EndAt.Value:yyyy-MM-dd HH:mm} UTC");
        }

 // 4. Validate access code if required
        if (exam.AccessPolicy != null && !string.IsNullOrEmpty(exam.AccessPolicy.AccessCode))
        {
  if (string.IsNullOrEmpty(dto.AccessCode))
    {
      return ApiResponse<AttemptSessionDto>.FailureResponse("Access code is required for this exam");
          }

   if (!exam.AccessPolicy.AccessCode.Equals(dto.AccessCode, StringComparison.Ordinal))
            {
     return ApiResponse<AttemptSessionDto>.FailureResponse("Invalid access code");
    }
        }

        // 5. Check for existing active attempt
        var existingActiveAttempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
   .Include(a => a.Questions)
       .ThenInclude(aq => aq.Answers)
  .FirstOrDefaultAsync(a =>
      a.ExamId == dto.ExamId &&
     a.CandidateId == candidateId &&
    (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress));

        if (existingActiveAttempt != null)
        {
         // Check if expired
            if (existingActiveAttempt.ExpiresAt.HasValue && now > existingActiveAttempt.ExpiresAt.Value)
   {
     existingActiveAttempt.Status = AttemptStatus.Expired;
          await _context.SaveChangesAsync();
       // Continue to create new attempt if allowed
     }
            else
     {
       // Return existing active attempt
      return ApiResponse<AttemptSessionDto>.SuccessResponse(
          await BuildAttemptSessionDto(existingActiveAttempt, exam),
            "Resuming existing attempt");
            }
        }

// 6. Check max attempts
        var attemptCount = await _context.Set<Domain.Entities.Attempt.Attempt>()
     .CountAsync(a => a.ExamId == dto.ExamId && a.CandidateId == candidateId);

        if (exam.MaxAttempts > 0 && attemptCount >= exam.MaxAttempts)
 {
            return ApiResponse<AttemptSessionDto>.FailureResponse(
       $"Maximum attempts ({exam.MaxAttempts}) reached for this exam");
        }

  // 7. Create new attempt
        var attempt = new Domain.Entities.Attempt.Attempt
      {
         ExamId = dto.ExamId,
        CandidateId = candidateId,
            StartedAt = now,
            ExpiresAt = CalculateExpiresAt(now, exam.DurationMinutes, exam.EndAt),
            Status = AttemptStatus.Started,
            AttemptNumber = attemptCount + 1,
            CreatedDate = now,
          CreatedBy = candidateId
      };

        _context.Set<Domain.Entities.Attempt.Attempt>().Add(attempt);
        await _context.SaveChangesAsync();

   // 8. Generate attempt questions (snapshot)
        var examQuestions = exam.Sections
      .OrderBy(s => s.Order)
         .SelectMany(s => s.Questions.OrderBy(q => q.Order))
       .ToList();

        if (exam.ShuffleQuestions)
        {
         examQuestions = examQuestions.OrderBy(_ => Guid.NewGuid()).ToList();
        }

        var order = 1;
  foreach (var eq in examQuestions)
        {
          var attemptQuestion = new AttemptQuestion
            {
      AttemptId = attempt.Id,
        QuestionId = eq.QuestionId,
        Order = order++,
         Points = eq.Points, // Snapshot
        CreatedDate = now,
    CreatedBy = candidateId
          };
            _context.Set<AttemptQuestion>().Add(attemptQuestion);
      }

     // 9. Log started event
        var startEvent = new AttemptEvent
        {
            AttemptId = attempt.Id,
            EventType = AttemptEventType.Started,
          OccurredAt = now,
     MetadataJson = JsonSerializer.Serialize(new { attemptNumber = attempt.AttemptNumber }),
            CreatedDate = now,
   CreatedBy = candidateId
        };
        _context.Set<AttemptEvent>().Add(startEvent);

        await _context.SaveChangesAsync();

        // 10. Reload attempt with questions
        var createdAttempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Questions.OrderBy(q => q.Order))
           .ThenInclude(aq => aq.Answers)
       .FirstAsync(a => a.Id == attempt.Id);

        return ApiResponse<AttemptSessionDto>.SuccessResponse(
      await BuildAttemptSessionDto(createdAttempt, exam),
        "Attempt started successfully");
    }

    public async Task<ApiResponse<AttemptSessionDto>> GetAttemptSessionAsync(int attemptId, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
     .Include(a => a.Questions.OrderBy(q => q.Order))
                .ThenInclude(aq => aq.Answers)
            .Include(a => a.Exam)
      .ThenInclude(e => e.Sections)
 .ThenInclude(s => s.Questions)
   .ThenInclude(eq => eq.Question)
         .ThenInclude(q => q.QuestionType)
       .Include(a => a.Exam)
              .ThenInclude(e => e.Sections)
.ThenInclude(s => s.Questions)
       .ThenInclude(eq => eq.Question)
        .ThenInclude(q => q.Options)
  .Include(a => a.Exam)
      .ThenInclude(e => e.Sections)
           .ThenInclude(s => s.Questions)
      .ThenInclude(eq => eq.Question)
            .ThenInclude(q => q.Attachments)
            .Include(a => a.Exam)
         .ThenInclude(e => e.Instructions)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
      return ApiResponse<AttemptSessionDto>.FailureResponse("Attempt not found");
        }

      if (attempt.CandidateId != candidateId)
    {
     return ApiResponse<AttemptSessionDto>.FailureResponse("You do not have access to this attempt");
   }

        // Check if expired
 var now = DateTime.UtcNow;
        if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value &&
   (attempt.Status == AttemptStatus.Started || attempt.Status == AttemptStatus.InProgress))
   {
  attempt.Status = AttemptStatus.Expired;
            await _context.SaveChangesAsync();
        }

        if (attempt.Status == AttemptStatus.Submitted || attempt.Status == AttemptStatus.Expired ||
     attempt.Status == AttemptStatus.Cancelled)
        {
          return ApiResponse<AttemptSessionDto>.FailureResponse(
             $"Attempt is {attempt.Status}. Cannot resume.");
        }

        return ApiResponse<AttemptSessionDto>.SuccessResponse(
    await BuildAttemptSessionDto(attempt, attempt.Exam));
    }

    public async Task<ApiResponse<AttemptSubmittedDto>> SubmitAttemptAsync(int attemptId, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
      .Include(a => a.Questions)
  .ThenInclude(aq => aq.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
            return ApiResponse<AttemptSubmittedDto>.FailureResponse("Attempt not found");
        }

        if (attempt.CandidateId != candidateId)
        {
            return ApiResponse<AttemptSubmittedDto>.FailureResponse("You do not have access to this attempt");
        }

   var now = DateTime.UtcNow;

        // Check if already submitted or in final state
   if (attempt.Status == AttemptStatus.Submitted)
        {
        return ApiResponse<AttemptSubmittedDto>.FailureResponse("Attempt has already been submitted");
        }

 if (attempt.Status == AttemptStatus.Expired || attempt.Status == AttemptStatus.Cancelled)
        {
      return ApiResponse<AttemptSubmittedDto>.FailureResponse($"Attempt is {attempt.Status}. Cannot submit.");
        }

        // Check expiry - force expire if past time
    if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value)
     {
            attempt.Status = AttemptStatus.Expired;
      await _context.SaveChangesAsync();
        return ApiResponse<AttemptSubmittedDto>.FailureResponse(
        "Attempt has expired. Your answers have been saved but late submission is not allowed.");
        }

        // Submit
        attempt.Status = AttemptStatus.Submitted;
        attempt.SubmittedAt = now;
        attempt.UpdatedDate = now;
      attempt.UpdatedBy = candidateId;

        // Log submitted event
        var submitEvent = new AttemptEvent
        {
      AttemptId = attemptId,
    EventType = AttemptEventType.Submitted,
        OccurredAt = now,
            CreatedDate = now,
          CreatedBy = candidateId
        };
        _context.Set<AttemptEvent>().Add(submitEvent);

        await _context.SaveChangesAsync();

        var totalQuestions = attempt.Questions.Count;
        var answeredQuestions = attempt.Questions.Count(q => q.Answers.Any());

  return ApiResponse<AttemptSubmittedDto>.SuccessResponse(new AttemptSubmittedDto
        {
            AttemptId = attemptId,
            SubmittedAt = now,
            Status = AttemptStatus.Submitted,
            TotalQuestions = totalQuestions,
            AnsweredQuestions = answeredQuestions,
            Message = "Attempt submitted successfully"
        });
    }

  public async Task<ApiResponse<AttemptTimerDto>> GetAttemptTimerAsync(int attemptId, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
      return ApiResponse<AttemptTimerDto>.FailureResponse("Attempt not found");
    }

        if (attempt.CandidateId != candidateId)
        {
      return ApiResponse<AttemptTimerDto>.FailureResponse("You do not have access to this attempt");
        }

        var now = DateTime.UtcNow;
        var remainingSeconds = 0;

   if (attempt.ExpiresAt.HasValue)
     {
      remainingSeconds = Math.Max(0, (int)(attempt.ExpiresAt.Value - now).TotalSeconds);
   }

   // Auto-expire if needed
      if (remainingSeconds <= 0 &&
            (attempt.Status == AttemptStatus.Started || attempt.Status == AttemptStatus.InProgress))
        {
     attempt.Status = AttemptStatus.Expired;
 await _context.SaveChangesAsync();
    }

        return ApiResponse<AttemptTimerDto>.SuccessResponse(new AttemptTimerDto
      {
     AttemptId = attemptId,
    ServerTime = now,
         ExpiresAt = attempt.ExpiresAt ?? now,
          RemainingSeconds = remainingSeconds,
            Status = attempt.Status
        });
    }

    public async Task<int> ExpireOverdueAttemptsAsync()
    {
 var now = DateTime.UtcNow;

        var overdueAttempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
    .Where(a =>
     (a.Status == AttemptStatus.Started || a.Status == AttemptStatus.InProgress) &&
            a.ExpiresAt.HasValue &&
       a.ExpiresAt.Value < now)
         .ToListAsync();

        foreach (var attempt in overdueAttempts)
   {
          attempt.Status = AttemptStatus.Expired;
            attempt.UpdatedDate = now;

       var expiredEvent = new AttemptEvent
       {
    AttemptId = attempt.Id,
        EventType = AttemptEventType.TimedOut,
     OccurredAt = now,
    MetadataJson = JsonSerializer.Serialize(new { expiredAt = attempt.ExpiresAt }),
     CreatedDate = now,
           CreatedBy = "system"
   };
      _context.Set<AttemptEvent>().Add(expiredEvent);
        }

        await _context.SaveChangesAsync();
        return overdueAttempts.Count;
    }

    #endregion

    #region Answers

    public async Task<ApiResponse<AnswerSavedDto>> SaveAnswerAsync(int attemptId, SaveAnswerDto dto, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
.Include(a => a.Questions)
    .ThenInclude(aq => aq.Question)
          .ThenInclude(q => q.QuestionType)
            .Include(a => a.Questions)
  .ThenInclude(aq => aq.Question)
                .ThenInclude(q => q.Options)
       .Include(a => a.Questions)
                .ThenInclude(aq => aq.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
 return ApiResponse<AnswerSavedDto>.FailureResponse("Attempt not found");
    }

        if (attempt.CandidateId != candidateId)
        {
     return ApiResponse<AnswerSavedDto>.FailureResponse("You do not have access to this attempt");
        }

        var now = DateTime.UtcNow;

        // Validate attempt status
 if (attempt.Status != AttemptStatus.Started && attempt.Status != AttemptStatus.InProgress)
      {
return ApiResponse<AnswerSavedDto>.FailureResponse(
    $"Cannot save answers. Attempt is {attempt.Status}.");
        }

        // Validate not expired
        if (attempt.ExpiresAt.HasValue && now > attempt.ExpiresAt.Value)
        {
            attempt.Status = AttemptStatus.Expired;
      await _context.SaveChangesAsync();
  return ApiResponse<AnswerSavedDto>.FailureResponse("Attempt has expired. Cannot save answers.");
        }

        // Find the attempt question
        var attemptQuestion = attempt.Questions.FirstOrDefault(q => q.QuestionId == dto.QuestionId);
        if (attemptQuestion == null)
        {
            return ApiResponse<AnswerSavedDto>.FailureResponse("Question not found in this attempt");
        }

        // Validate answer based on question type
        var questionTypeName = attemptQuestion.Question.QuestionType?.NameEn?.ToLower() ?? "";
        var validationResult = ValidateAnswer(dto, attemptQuestion.Question, questionTypeName);
        if (!validationResult.IsValid)
   {
         return ApiResponse<AnswerSavedDto>.FailureResponse(validationResult.ErrorMessage!);
        }

        // Update status to InProgress if still Started
        if (attempt.Status == AttemptStatus.Started)
        {
            attempt.Status = AttemptStatus.InProgress;
    }

      // Find or create answer
        var existingAnswer = attemptQuestion.Answers.FirstOrDefault(a => a.QuestionId == dto.QuestionId);

        if (existingAnswer != null)
        {
 // Update existing
    existingAnswer.SelectedOptionIdsJson = dto.SelectedOptionIds != null
            ? JsonSerializer.Serialize(dto.SelectedOptionIds)
       : null;
  existingAnswer.TextAnswer = dto.TextAnswer;
        existingAnswer.AnsweredAt = now;
            existingAnswer.UpdatedDate = now;
      existingAnswer.UpdatedBy = candidateId;
        }
        else
        {
        // Create new
            existingAnswer = new AttemptAnswer
  {
        AttemptId = attemptId,
            AttemptQuestionId = attemptQuestion.Id,
         QuestionId = dto.QuestionId,
                SelectedOptionIdsJson = dto.SelectedOptionIds != null
       ? JsonSerializer.Serialize(dto.SelectedOptionIds)
    : null,
       TextAnswer = dto.TextAnswer,
          AnsweredAt = now,
        CreatedDate = now,
    CreatedBy = candidateId
            };
   _context.Set<AttemptAnswer>().Add(existingAnswer);
        }

        // Log event
        var answerEvent = new AttemptEvent
        {
      AttemptId = attemptId,
 EventType = AttemptEventType.AnswerSaved,
            OccurredAt = now,
            MetadataJson = JsonSerializer.Serialize(new { questionId = dto.QuestionId }),
   CreatedDate = now,
            CreatedBy = candidateId
  };
        _context.Set<AttemptEvent>().Add(answerEvent);

 await _context.SaveChangesAsync();

        return ApiResponse<AnswerSavedDto>.SuccessResponse(new AnswerSavedDto
     {
        AttemptAnswerId = existingAnswer.Id,
  QuestionId = dto.QuestionId,
            AnsweredAt = now,
   Success = true,
      Message = "Answer saved successfully"
        });
    }

    public async Task<ApiResponse<List<AnswerSavedDto>>> BulkSaveAnswersAsync(
     int attemptId, BulkSaveAnswersDto dto, string candidateId)
  {
        var results = new List<AnswerSavedDto>();

    foreach (var answer in dto.Answers)
        {
  var result = await SaveAnswerAsync(attemptId, answer, candidateId);
     results.Add(new AnswerSavedDto
            {
      QuestionId = answer.QuestionId,
      AttemptAnswerId = result.Data?.AttemptAnswerId ?? 0,
         AnsweredAt = result.Data?.AnsweredAt ?? DateTime.UtcNow,
                Success = result.Success,
        Message = result.Success ? "Saved" : result.Message
   });
        }

        var allSuccess = results.All(r => r.Success);
        return allSuccess
        ? ApiResponse<List<AnswerSavedDto>>.SuccessResponse(results, "All answers saved successfully")
  : ApiResponse<List<AnswerSavedDto>>.SuccessResponse(results, "Some answers could not be saved");
    }

    public async Task<ApiResponse<List<AttemptAnswerDto>>> GetAttemptAnswersAsync(int attemptId, string candidateId)
    {
  var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
        .Include(a => a.Questions)
      .ThenInclude(aq => aq.Answers)
        .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
    {
      return ApiResponse<List<AttemptAnswerDto>>.FailureResponse("Attempt not found");
}

        if (attempt.CandidateId != candidateId)
        {
            return ApiResponse<List<AttemptAnswerDto>>.FailureResponse("You do not have access to this attempt");
        }

        var answers = attempt.Questions
     .SelectMany(q => q.Answers)
 .Select(a => new AttemptAnswerDto
            {
     AttemptAnswerId = a.Id,
          QuestionId = a.QuestionId,
        SelectedOptionIds = !string.IsNullOrEmpty(a.SelectedOptionIdsJson)
      ? JsonSerializer.Deserialize<List<int>>(a.SelectedOptionIdsJson)
         : null,
  TextAnswer = a.TextAnswer,
                AnsweredAt = a.AnsweredAt
      })
       .ToList();

        return ApiResponse<List<AttemptAnswerDto>>.SuccessResponse(answers);
    }

    #endregion

    #region Events

    public async Task<ApiResponse<bool>> LogEventAsync(int attemptId, LogAttemptEventDto dto, string candidateId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
      .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
     return ApiResponse<bool>.FailureResponse("Attempt not found");
        }

        if (attempt.CandidateId != candidateId)
        {
         return ApiResponse<bool>.FailureResponse("You do not have access to this attempt");
    }

        // Only log events for active attempts
        if (attempt.Status != AttemptStatus.Started && attempt.Status != AttemptStatus.InProgress)
    {
 return ApiResponse<bool>.FailureResponse("Cannot log events for inactive attempt");
}

        var now = DateTime.UtcNow;

        var attemptEvent = new AttemptEvent
   {
          AttemptId = attemptId,
      EventType = dto.EventType,
      MetadataJson = dto.MetadataJson,
        OccurredAt = now,
         CreatedDate = now,
            CreatedBy = candidateId
        };

        _context.Set<AttemptEvent>().Add(attemptEvent);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Event logged");
    }

    public async Task<ApiResponse<List<AttemptEventDto>>> GetAttemptEventsAsync(int attemptId)
    {
 var events = await _context.Set<AttemptEvent>()
 .Where(e => e.AttemptId == attemptId)
       .OrderBy(e => e.OccurredAt)
    .Select(e => new AttemptEventDto
          {
     Id = e.Id,
      AttemptId = e.AttemptId,
        EventType = e.EventType,
    MetadataJson = e.MetadataJson,
      OccurredAt = e.OccurredAt
   })
            .ToListAsync();

 return ApiResponse<List<AttemptEventDto>>.SuccessResponse(events);
    }

    #endregion

    #region Queries

    public async Task<ApiResponse<AttemptDto>> GetAttemptByIdAsync(int attemptId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
       .Include(a => a.Exam)
            .Include(a => a.Candidate)
            .Include(a => a.Questions)
       .ThenInclude(aq => aq.Answers)
          .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
        {
            return ApiResponse<AttemptDto>.FailureResponse("Attempt not found");
        }

    return ApiResponse<AttemptDto>.SuccessResponse(MapToAttemptDto(attempt));
  }

    public async Task<ApiResponse<AttemptDetailDto>> GetAttemptDetailsAsync(int attemptId)
    {
   var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
 .Include(a => a.Exam)
     .Include(a => a.Candidate)
      .Include(a => a.Questions)
        .ThenInclude(aq => aq.Question)
    .ThenInclude(q => q.QuestionType)
   .Include(a => a.Questions)
                .ThenInclude(aq => aq.Answers)
  .Include(a => a.Events.OrderBy(e => e.OccurredAt))
       .FirstOrDefaultAsync(a => a.Id == attemptId);

 if (attempt == null)
        {
     return ApiResponse<AttemptDetailDto>.FailureResponse("Attempt not found");
        }

        var dto = new AttemptDetailDto
        {
   Id = attempt.Id,
     ExamId = attempt.ExamId,
    ExamTitleEn = attempt.Exam.TitleEn,
            ExamTitleAr = attempt.Exam.TitleAr,
   CandidateId = attempt.CandidateId,
        CandidateName = attempt.Candidate.FullName ?? attempt.Candidate.DisplayName ?? attempt.Candidate.UserName ?? "",
 StartedAt = attempt.StartedAt,
 SubmittedAt = attempt.SubmittedAt,
          ExpiresAt = attempt.ExpiresAt,
         Status = attempt.Status,
   AttemptNumber = attempt.AttemptNumber,
            TotalScore = attempt.TotalScore,
            IsPassed = attempt.IsPassed,
            TotalQuestions = attempt.Questions.Count,
  AnsweredQuestions = attempt.Questions.Count(q => q.Answers.Any()),
       RemainingSeconds = CalculateRemainingSeconds(attempt),
  CreatedDate = attempt.CreatedDate,
            Events = attempt.Events.Select(e => new AttemptEventDto
     {
      Id = e.Id,
AttemptId = e.AttemptId,
         EventType = e.EventType,
            MetadataJson = e.MetadataJson,
 OccurredAt = e.OccurredAt
   }).ToList(),
            AnswerDetails = attempt.Questions.SelectMany(q => q.Answers.Select(a => new AttemptAnswerDetailDto
        {
   AttemptAnswerId = a.Id,
  QuestionId = a.QuestionId,
    QuestionBodyEn = q.Question.BodyEn,
          QuestionBodyAr = q.Question.BodyAr,
        QuestionTypeName = q.Question.QuestionType?.NameEn ?? "",
           Points = q.Points,
     SelectedOptionIds = !string.IsNullOrEmpty(a.SelectedOptionIdsJson)
   ? JsonSerializer.Deserialize<List<int>>(a.SelectedOptionIdsJson)
         : null,
  TextAnswer = a.TextAnswer,
      IsCorrect = a.IsCorrect,
    Score = a.Score,
     AnsweredAt = a.AnsweredAt
     })).ToList()
        };

    return ApiResponse<AttemptDetailDto>.SuccessResponse(dto);
    }

    public async Task<ApiResponse<PaginatedResponse<AttemptListDto>>> GetAttemptsAsync(AttemptSearchDto searchDto)
    {
        var query = _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Exam)
            .Include(a => a.Candidate)
            .AsQueryable();

        // Filters
        if (searchDto.ExamId.HasValue)
        {
            query = query.Where(a => a.ExamId == searchDto.ExamId.Value);
        }

  if (!string.IsNullOrEmpty(searchDto.CandidateId))
        {
            query = query.Where(a => a.CandidateId == searchDto.CandidateId);
}

        if (searchDto.Status.HasValue)
        {
   query = query.Where(a => a.Status == searchDto.Status.Value);
    }

        if (searchDto.StartedFrom.HasValue)
        {
     query = query.Where(a => a.StartedAt >= searchDto.StartedFrom.Value);
        }

        if (searchDto.StartedTo.HasValue)
        {
 query = query.Where(a => a.StartedAt <= searchDto.StartedTo.Value);
        }

     if (searchDto.IsPassed.HasValue)
        {
         query = query.Where(a => a.IsPassed == searchDto.IsPassed.Value);
        }

        query = query.OrderByDescending(a => a.StartedAt);

   var totalCount = await query.CountAsync();
var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
     .Take(searchDto.PageSize)
            .ToListAsync();

var dtos = items.Select(MapToAttemptListDto).ToList();

        return ApiResponse<PaginatedResponse<AttemptListDto>>.SuccessResponse(
         new PaginatedResponse<AttemptListDto>
       {
     Items = dtos,
       PageNumber = searchDto.PageNumber,
        PageSize = searchDto.PageSize,
           TotalCount = totalCount
         });
    }

    public async Task<ApiResponse<List<AttemptListDto>>> GetCandidateExamAttemptsAsync(int examId, string candidateId)
    {
  var attempts = await _context.Set<Domain.Entities.Attempt.Attempt>()
          .Include(a => a.Exam)
          .Include(a => a.Candidate)
 .Where(a => a.ExamId == examId && a.CandidateId == candidateId)
            .OrderByDescending(a => a.AttemptNumber)
         .ToListAsync();

     return ApiResponse<List<AttemptListDto>>.SuccessResponse(
      attempts.Select(MapToAttemptListDto).ToList());
    }

    public async Task<ApiResponse<PaginatedResponse<AttemptListDto>>> GetCandidateAttemptsAsync(
        string candidateId, AttemptSearchDto searchDto)
    {
        searchDto.CandidateId = candidateId;
        return await GetAttemptsAsync(searchDto);
    }

    #endregion

    #region Admin Operations

    public async Task<ApiResponse<bool>> CancelAttemptAsync(CancelAttemptDto dto, string adminUserId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
       .FirstOrDefaultAsync(a => a.Id == dto.AttemptId);

        if (attempt == null)
        {
      return ApiResponse<bool>.FailureResponse("Attempt not found");
        }

        if (attempt.Status == AttemptStatus.Submitted || attempt.Status == AttemptStatus.Cancelled)
        {
        return ApiResponse<bool>.FailureResponse($"Cannot cancel. Attempt is already {attempt.Status}.");
        }

        var now = DateTime.UtcNow;

        attempt.Status = AttemptStatus.Cancelled;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        var cancelEvent = new AttemptEvent
        {
     AttemptId = dto.AttemptId,
         EventType = AttemptEventType.TimedOut, // Using TimedOut for cancelled
            MetadataJson = JsonSerializer.Serialize(new { reason = dto.Reason, cancelledBy = adminUserId }),
 OccurredAt = now,
         CreatedDate = now,
     CreatedBy = adminUserId
      };
        _context.Set<AttemptEvent>().Add(cancelEvent);

      await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Attempt cancelled successfully");
    }

    public async Task<ApiResponse<AttemptSubmittedDto>> ForceSubmitAttemptAsync(int attemptId, string adminUserId)
    {
        var attempt = await _context.Set<Domain.Entities.Attempt.Attempt>()
            .Include(a => a.Questions)
       .ThenInclude(aq => aq.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

     if (attempt == null)
        {
       return ApiResponse<AttemptSubmittedDto>.FailureResponse("Attempt not found");
        }

        if (attempt.Status == AttemptStatus.Submitted)
        {
            return ApiResponse<AttemptSubmittedDto>.FailureResponse("Attempt has already been submitted");
        }

        if (attempt.Status == AttemptStatus.Cancelled)
        {
     return ApiResponse<AttemptSubmittedDto>.FailureResponse("Cannot submit cancelled attempt");
      }

var now = DateTime.UtcNow;

        attempt.Status = AttemptStatus.Submitted;
        attempt.SubmittedAt = now;
        attempt.UpdatedDate = now;
        attempt.UpdatedBy = adminUserId;

        var submitEvent = new AttemptEvent
   {
       AttemptId = attemptId,
  EventType = AttemptEventType.Submitted,
       MetadataJson = JsonSerializer.Serialize(new { forcedBy = adminUserId }),
            OccurredAt = now,
       CreatedDate = now,
      CreatedBy = adminUserId
        };
        _context.Set<AttemptEvent>().Add(submitEvent);

   await _context.SaveChangesAsync();

        return ApiResponse<AttemptSubmittedDto>.SuccessResponse(new AttemptSubmittedDto
        {
          AttemptId = attemptId,
    SubmittedAt = now,
 Status = AttemptStatus.Submitted,
            TotalQuestions = attempt.Questions.Count,
            AnsweredQuestions = attempt. Questions.Count(q => q.Answers.Any()),
       Message = "Attempt force submitted by admin"
    });
    }

    #endregion

    #region Private Helper Methods

    private DateTime CalculateExpiresAt(DateTime startedAt, int durationMinutes, DateTime? examEndAt)
    {
   var durationExpiry = startedAt.AddMinutes(durationMinutes);

        if (examEndAt.HasValue)
        {
   return durationExpiry < examEndAt.Value ? durationExpiry : examEndAt.Value;
}

        return durationExpiry;
    }

  private int CalculateRemainingSeconds(Domain.Entities.Attempt.Attempt attempt)
    {
    if (!attempt.ExpiresAt.HasValue) return 0;
        if (attempt.Status == AttemptStatus.Submitted || attempt.Status == AttemptStatus.Expired ||
  attempt.Status == AttemptStatus.Cancelled)
        {
            return 0;
        }

        var remaining = (int)(attempt.ExpiresAt.Value - DateTime.UtcNow).TotalSeconds;
        return Math.Max(0, remaining);
 }

    private (bool IsValid, string? ErrorMessage) ValidateAnswer(
        SaveAnswerDto dto,
        Domain.Entities.QuestionBank.Question question,
        string questionTypeName)
    {
        // MCQ single choice
        if (questionTypeName.Contains("mcq") && questionTypeName.Contains("single"))
        {
    if (dto.SelectedOptionIds == null || dto.SelectedOptionIds.Count != 1)
    {
     return (false, "Single-choice MCQ must have exactly one selected option");
        }

      if (!string.IsNullOrEmpty(dto.TextAnswer))
   {
     return (false, "MCQ questions cannot have text answers");
     }

            // Validate option belongs to question
            var validOptionIds = question.Options.Select(o => o.Id).ToHashSet();
         if (!dto.SelectedOptionIds.All(id => validOptionIds.Contains(id)))
      {
   return (false, "Invalid option selected");
            }
        }
        // MCQ multiple choice
        else if (questionTypeName.Contains("mcq") && questionTypeName.Contains("multiple"))
        {
if (dto.SelectedOptionIds == null || dto.SelectedOptionIds.Count < 1)
          {
     return (false, "Multiple-choice MCQ must have at least one selected option");
         }

     if (!string.IsNullOrEmpty(dto.TextAnswer))
   {
                return (false, "MCQ questions cannot have text answers");
            }

          var validOptionIds = question.Options.Select(o => o.Id).ToHashSet();
 if (!dto.SelectedOptionIds.All(id => validOptionIds.Contains(id)))
      {
 return (false, "Invalid option(s) selected");
 }
        }
        // True/False
        else if (questionTypeName.Contains("true") && questionTypeName.Contains("false"))
        {
            if (dto.SelectedOptionIds == null || dto.SelectedOptionIds.Count != 1)
      {
    return (false, "True/False question must have exactly one selected option");
       }

        var validOptionIds = question.Options.Select(o => o.Id).ToHashSet();
   if (!dto.SelectedOptionIds.All(id => validOptionIds.Contains(id)))
            {
     return (false, "Invalid option selected");
            }
        }
        // Short answer / Essay
   else if (questionTypeName.Contains("short") || questionTypeName.Contains("essay"))
        {
     if (dto.SelectedOptionIds != null && dto.SelectedOptionIds.Any())
         {
       return (false, "Text-based questions cannot have selected options");
            }

    if (string.IsNullOrWhiteSpace(dto.TextAnswer))
  {
   return (false, "Text answer is required for this question type");
            }
        }

        return (true, null);
    }

    private async Task<AttemptSessionDto> BuildAttemptSessionDto(
        Domain.Entities.Attempt.Attempt attempt,
        Domain.Entities.Assessment.Exam exam)
    {
        var questions = new List<AttemptQuestionDto>();

        // Get questions for this attempt
  var attemptQuestions = await _context.Set<AttemptQuestion>()
         .Include(aq => aq.Question)
   .ThenInclude(q => q.QuestionType)
    .Include(aq => aq.Question)
    .ThenInclude(q => q.Options.Where(o => !o.IsDeleted))
    .Include(aq => aq.Question)
     .ThenInclude(q => q.Attachments.Where(a => !a.IsDeleted))
        .Include(aq => aq.Answers)
     .Where(aq => aq.AttemptId == attempt.Id)
       .OrderBy(aq => aq.Order)
        .ToListAsync();

        foreach (var aq in attemptQuestions)
  {
 // Get options and shuffle if enabled
         var optionsList = aq.Question.Options.ToList();
         if (exam.ShuffleOptions)
            {
optionsList = optionsList.OrderBy(_ => Guid.NewGuid()).ToList();
       }
  else
            {
    optionsList = optionsList.OrderBy(o => o.Order).ToList();
  }

     var options = optionsList.Select(o => new AttemptQuestionOptionDto
            {
    Id = o.Id,
           TextEn = o.TextEn,
    TextAr = o.TextAr,
   Order = o.Order,
   AttachmentPath = o.AttachmentPath
       }).ToList();

      var currentAnswer = aq.Answers.FirstOrDefault();

            questions.Add(new AttemptQuestionDto
            {
        AttemptQuestionId = aq.Id,
             QuestionId = aq.QuestionId,
              Order = aq.Order,
        Points = aq.Points,
     BodyEn = aq.Question.BodyEn,
    BodyAr = aq.Question.BodyAr,
      QuestionTypeName = aq.Question.QuestionType?.NameEn ?? "",
     QuestionTypeId = aq.Question.QuestionTypeId,
       Options = options,
   Attachments = aq.Question.Attachments.Select(a => new AttemptQuestionAttachmentDto
      {
           Id = a.Id,
       FileName = a.FileName,
         FilePath = a.FilePath,
 FileType = a.FileType
     }).ToList(),
           CurrentAnswer = currentAnswer != null ? new AttemptAnswerDto
     {
      AttemptAnswerId = currentAnswer.Id,
  QuestionId = currentAnswer.QuestionId,
SelectedOptionIds = !string.IsNullOrEmpty(currentAnswer.SelectedOptionIdsJson)
                ? JsonSerializer.Deserialize<List<int>>(currentAnswer.SelectedOptionIdsJson)
    : null,
      TextAnswer = currentAnswer.TextAnswer,
        AnsweredAt = currentAnswer.AnsweredAt
       } : null
         });
        }

        var instructions = exam.Instructions
       .OrderBy(i => i.Order)
      .Select(i => new ExamInstructionForCandidateDto
         {
        Order = i.Order,
         ContentEn = i.ContentEn,
             ContentAr = i.ContentAr
         })
            .ToList();

    return new AttemptSessionDto
        {
            AttemptId = attempt.Id,
            ExamId = exam.Id,
            ExamTitleEn = exam.TitleEn,
   ExamTitleAr = exam.TitleAr,
     ExamDescriptionEn = exam.DescriptionEn,
            ExamDescriptionAr = exam.DescriptionAr,
     StartedAt = attempt.StartedAt,
            ExpiresAt = attempt.ExpiresAt ?? DateTime.UtcNow,
         RemainingSeconds = CalculateRemainingSeconds(attempt),
        TotalQuestions = questions.Count,
            AnsweredQuestions = questions.Count(q => q.CurrentAnswer != null),
        Status = attempt.Status,
      AttemptNumber = attempt.AttemptNumber,
        MaxAttempts = exam.MaxAttempts,
            Questions = questions,
         Instructions = instructions
  };
    }

    private AttemptDto MapToAttemptDto(Domain.Entities.Attempt.Attempt attempt)
    {
        return new AttemptDto
        {
    Id = attempt.Id,
      ExamId = attempt.ExamId,
     ExamTitleEn = attempt.Exam?.TitleEn ?? "",
         ExamTitleAr = attempt.Exam?.TitleAr ?? "",
          CandidateId = attempt.CandidateId,
            CandidateName = attempt.Candidate != null
     ? (attempt.Candidate.FullName ?? attempt.Candidate.DisplayName ?? attempt.Candidate.UserName ?? "")
    : "",
    StartedAt = attempt.StartedAt,
      SubmittedAt = attempt.SubmittedAt,
            ExpiresAt = attempt.ExpiresAt,
          Status = attempt.Status,
            AttemptNumber = attempt.AttemptNumber,
            TotalScore = attempt.TotalScore,
  IsPassed = attempt.IsPassed,
         TotalQuestions = attempt.Questions?.Count ?? 0,
         AnsweredQuestions = attempt.Questions?.Count(q => q.Answers.Any()) ?? 0,
      RemainingSeconds = CalculateRemainingSeconds(attempt),
         CreatedDate = attempt.CreatedDate
  };
    }

    private AttemptListDto MapToAttemptListDto(Domain.Entities.Attempt.Attempt attempt)
    {
        return new AttemptListDto
     {
    Id = attempt.Id,
       ExamId = attempt.ExamId,
ExamTitleEn = attempt.Exam?.TitleEn ?? "",
       ExamTitleAr = attempt.Exam?.TitleAr ?? "",
      CandidateId = attempt.CandidateId,
  CandidateName = attempt.Candidate != null
        ? (attempt.Candidate.FullName ?? attempt.Candidate.DisplayName ?? attempt.Candidate.UserName ?? "")
     : "",
   StartedAt = attempt.StartedAt,
  SubmittedAt = attempt.SubmittedAt,
            Status = attempt.Status,
  AttemptNumber = attempt.AttemptNumber,
            TotalScore = attempt.TotalScore,
IsPassed = attempt.IsPassed
      };
    }

  #endregion
}
