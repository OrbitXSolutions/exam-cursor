using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Incident;
using Smart_Core.Application.Interfaces.Incident;
using Smart_Core.Domain.Entities.Incident;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Incident;

public class IncidentService : IIncidentService
{
    private readonly ApplicationDbContext _context;

    public IncidentService(ApplicationDbContext context)
    {
 _context = context;
    }

    #region Case Management

    public async Task<ApiResponse<IncidentCaseDto>> CreateCaseAsync(CreateIncidentCaseDto dto, string userId)
    {
  // Validate attempt exists
        var attempt = await _context.Attempts
      .Include(a => a.Exam)
            .FirstOrDefaultAsync(a => a.Id == dto.AttemptId);

        if (attempt == null)
        {
      return ApiResponse<IncidentCaseDto>.FailureResponse("Attempt not found");
     }

   // Check if active case already exists for this attempt
     var existingCase = await _context.Set<IncidentCase>()
   .FirstOrDefaultAsync(c => c.AttemptId == dto.AttemptId && c.Status != IncidentStatus.Closed);

        if (existingCase != null)
   {
        return ApiResponse<IncidentCaseDto>.FailureResponse(
       $"An active incident case already exists for this attempt (Case #{existingCase.CaseNumber})");
        }

        var now = DateTime.UtcNow;
        var caseNumber = await GenerateCaseNumberAsync();

        // Get risk info from proctor session if available
        decimal? riskScore = null;
int? violations = null;

        if (dto.ProctorSessionId.HasValue)
        {
 var proctorSession = await _context.Set<ProctorSession>()
      .FirstOrDefaultAsync(s => s.Id == dto.ProctorSessionId.Value);

     if (proctorSession != null)
          {
     riskScore = proctorSession.RiskScore;
          violations = proctorSession.TotalViolations;
 }
        }

        var incidentCase = new IncidentCase
        {
        CaseNumber = caseNumber,
      ExamId = attempt.ExamId,
         AttemptId = dto.AttemptId,
            CandidateId = attempt.CandidateId,
            ProctorSessionId = dto.ProctorSessionId,
     Status = IncidentStatus.Open,
         Severity = dto.Severity,
            Source = dto.Source,
    TitleEn = dto.TitleEn,
   TitleAr = dto.TitleAr,
  SummaryEn = dto.SummaryEn,
            SummaryAr = dto.SummaryAr,
    RiskScoreAtCreate = riskScore,
   TotalViolationsAtCreate = violations,
    CreatedDate = now,
  CreatedBy = userId
        };

        _context.Set<IncidentCase>().Add(incidentCase);
        await _context.SaveChangesAsync();

   // Add timeline event
        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.Created, userId,
            "Case created", "?? ????? ??????",
new { source = dto.Source.ToString(), severity = dto.Severity.ToString() });

        return await GetCaseAsync(incidentCase.Id);
    }

    public async Task<ApiResponse<IncidentCaseDto>> CreateCaseFromProctorAsync(int proctorSessionId, string userId)
    {
        var session = await _context.Set<ProctorSession>()
       .Include(s => s.Attempt)
      .Include(s => s.Exam)
     .FirstOrDefaultAsync(s => s.Id == proctorSessionId);

        if (session == null)
        {
 return ApiResponse<IncidentCaseDto>.FailureResponse("Proctor session not found");
        }

  var dto = new CreateIncidentCaseDto
      {
          AttemptId = session.AttemptId,
          ProctorSessionId = proctorSessionId,
            Source = IncidentSource.ProctorAuto,
   Severity = DetermineSeverity(session.RiskScore, session.TotalViolations),
            TitleEn = $"Proctor Alert - Risk Score: {session.RiskScore:F1}",
  TitleAr = $"????? ???????? - ???? ???????: {session.RiskScore:F1}",
            SummaryEn = $"Automatic incident created due to {session.TotalViolations} violations detected.",
    SummaryAr = $"?? ????? ?????? ???????? ???? ?????? {session.TotalViolations} ??????."
        };

        return await CreateCaseAsync(dto, userId);
    }

  public async Task<ApiResponse<IncidentCaseDto>> GetCaseAsync(int caseId)
    {
        var incidentCase = await GetCaseWithIncludesAsync(caseId);

        if (incidentCase == null)
        {
return ApiResponse<IncidentCaseDto>.FailureResponse("Case not found");
        }

        return ApiResponse<IncidentCaseDto>.SuccessResponse(MapToCaseDto(incidentCase));
    }

    public async Task<ApiResponse<IncidentCaseDto>> GetCaseByAttemptAsync(int attemptId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
     .Include(c => c.Exam)
  .Include(c => c.Attempt)
        .Include(c => c.Candidate)
      .Include(c => c.Assignee)
            .Include(c => c.Timeline.OrderByDescending(t => t.OccurredAt).Take(20))
         .Include(c => c.EvidenceLinks.OrderBy(e => e.Order))
            .Include(c => c.Decisions.OrderByDescending(d => d.DecidedAt).Take(10))
  .Include(c => c.Comments)
.Include(c => c.Appeals)
            .FirstOrDefaultAsync(c => c.AttemptId == attemptId);

        if (incidentCase == null)
        {
return ApiResponse<IncidentCaseDto>.FailureResponse("No incident case found for this attempt");
}

        return ApiResponse<IncidentCaseDto>.SuccessResponse(MapToCaseDto(incidentCase));
    }

    public async Task<ApiResponse<IncidentCaseDto>> UpdateCaseAsync(UpdateIncidentCaseDto dto, string userId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .FirstOrDefaultAsync(c => c.Id == dto.Id);

        if (incidentCase == null)
      {
      return ApiResponse<IncidentCaseDto>.FailureResponse("Case not found");
        }

        if (incidentCase.Status == IncidentStatus.Closed)
        {
            return ApiResponse<IncidentCaseDto>.FailureResponse("Cannot update a closed case");
        }

var now = DateTime.UtcNow;
        var changes = new List<string>();

        if (dto.Severity.HasValue && dto.Severity.Value != incidentCase.Severity)
        {
   var oldSeverity = incidentCase.Severity;
       incidentCase.Severity = dto.Severity.Value;
      changes.Add($"Severity: {oldSeverity} ? {dto.Severity.Value}");

   await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.SeverityChanged, userId,
        $"Severity changed from {oldSeverity} to {dto.Severity.Value}",
        $"?? ????? ??????? ?? {oldSeverity} ??? {dto.Severity.Value}",
   new { oldSeverity = oldSeverity.ToString(), newSeverity = dto.Severity.Value.ToString() });
      }

        if (!string.IsNullOrEmpty(dto.TitleEn))
incidentCase.TitleEn = dto.TitleEn;

        if (!string.IsNullOrEmpty(dto.TitleAr))
         incidentCase.TitleAr = dto.TitleAr;

        if (dto.SummaryEn != null)
         incidentCase.SummaryEn = dto.SummaryEn;

        if (dto.SummaryAr != null)
 incidentCase.SummaryAr = dto.SummaryAr;

 incidentCase.UpdatedDate = now;
        incidentCase.UpdatedBy = userId;

      await _context.SaveChangesAsync();

    return await GetCaseAsync(incidentCase.Id);
    }

public async Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetCasesAsync(IncidentCaseSearchDto searchDto)
    {
   var query = _context.Set<IncidentCase>()
        .Include(c => c.Exam)
     .Include(c => c.Candidate)
            .Include(c => c.Assignee)
            .Include(c => c.Appeals)
            .AsQueryable();

    query = ApplyCaseFilters(query, searchDto);
        query = query.OrderByDescending(c => c.CreatedDate);

var totalCount = await query.CountAsync();
        var items = await query
        .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

   return ApiResponse<PaginatedResponse<IncidentCaseListDto>>.SuccessResponse(
            new PaginatedResponse<IncidentCaseListDto>
  {
        Items = items.Select(MapToCaseListDto).ToList(),
        PageNumber = searchDto.PageNumber,
              PageSize = searchDto.PageSize,
           TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetExamCasesAsync(
        int examId, IncidentCaseSearchDto searchDto)
    {
   searchDto.ExamId = examId;
        return await GetCasesAsync(searchDto);
    }

    public async Task<ApiResponse<PaginatedResponse<IncidentCaseListDto>>> GetAssignedCasesAsync(
        string reviewerId, IncidentCaseSearchDto searchDto)
  {
     searchDto.AssignedTo = reviewerId;
        return await GetCasesAsync(searchDto);
    }

    #endregion

    #region Assignment & Status

    public async Task<ApiResponse<IncidentCaseDto>> AssignCaseAsync(AssignCaseDto dto, string userId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
       .FirstOrDefaultAsync(c => c.Id == dto.CaseId);

      if (incidentCase == null)
 {
            return ApiResponse<IncidentCaseDto>.FailureResponse("Case not found");
        }

if (incidentCase.Status == IncidentStatus.Closed)
      {
    return ApiResponse<IncidentCaseDto>.FailureResponse("Cannot assign a closed case");
     }

   // Verify assignee exists
        var assignee = await _context.Users.FirstOrDefaultAsync(u => u.Id == dto.AssigneeId);
        if (assignee == null)
   {
        return ApiResponse<IncidentCaseDto>.FailureResponse("Assignee not found");
        }

        var now = DateTime.UtcNow;
        var previousAssignee = incidentCase.AssignedTo;

        incidentCase.AssignedTo = dto.AssigneeId;
      incidentCase.AssignedAt = now;
        incidentCase.UpdatedDate = now;
        incidentCase.UpdatedBy = userId;

   // Move to InReview if still Open
        if (incidentCase.Status == IncidentStatus.Open)
        {
       incidentCase.Status = IncidentStatus.InReview;
        }

        await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.Assigned, userId,
      $"Assigned to {assignee.FullName ?? assignee.UserName}",
            $"?? ??????? ??? {assignee.FullName ?? assignee.UserName}",
            new { assigneeId = dto.AssigneeId, assigneeName = assignee.FullName, previousAssignee });

   return await GetCaseAsync(incidentCase.Id);
    }

 public async Task<ApiResponse<IncidentCaseDto>> ReassignCaseAsync(AssignCaseDto dto, string userId)
    {
        return await AssignCaseAsync(dto, userId);
    }

    public async Task<ApiResponse<IncidentCaseDto>> ChangeStatusAsync(ChangeStatusDto dto, string userId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .FirstOrDefaultAsync(c => c.Id == dto.CaseId);

     if (incidentCase == null)
        {
        return ApiResponse<IncidentCaseDto>.FailureResponse("Case not found");
  }

        var oldStatus = incidentCase.Status;

        // Validate transition
      if (!IsValidStatusTransition(oldStatus, dto.NewStatus))
        {
    return ApiResponse<IncidentCaseDto>.FailureResponse(
       $"Invalid status transition from {oldStatus} to {dto.NewStatus}");
        }

        var now = DateTime.UtcNow;
   incidentCase.Status = dto.NewStatus;
        incidentCase.UpdatedDate = now;
        incidentCase.UpdatedBy = userId;

        if (dto.NewStatus == IncidentStatus.Closed)
  {
        incidentCase.ClosedBy = userId;
            incidentCase.ClosedAt = now;
        }

        await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.StatusChanged, userId,
            $"Status changed from {oldStatus} to {dto.NewStatus}",
        $"?? ????? ?????? ?? {oldStatus} ??? {dto.NewStatus}",
     new { oldStatus = oldStatus.ToString(), newStatus = dto.NewStatus.ToString(), reason = dto.Reason });

    return await GetCaseAsync(incidentCase.Id);
    }

    public async Task<ApiResponse<IncidentCaseDto>> CloseCaseAsync(int caseId, string userId)
    {
 return await ChangeStatusAsync(new ChangeStatusDto
        {
  CaseId = caseId,
 NewStatus = IncidentStatus.Closed
        }, userId);
    }

    public async Task<ApiResponse<IncidentCaseDto>> ReopenCaseAsync(int caseId, string reason, string userId)
    {
  var incidentCase = await _context.Set<IncidentCase>()
        .FirstOrDefaultAsync(c => c.Id == caseId);

        if (incidentCase == null)
        {
            return ApiResponse<IncidentCaseDto>.FailureResponse("Case not found");
}

   if (incidentCase.Status != IncidentStatus.Closed && incidentCase.Status != IncidentStatus.Resolved)
 {
        return ApiResponse<IncidentCaseDto>.FailureResponse("Only closed or resolved cases can be reopened");
        }

        var now = DateTime.UtcNow;
      var oldStatus = incidentCase.Status;

     incidentCase.Status = IncidentStatus.InReview;
        incidentCase.UpdatedDate = now;
incidentCase.UpdatedBy = userId;

        await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.Reopened, userId,
    $"Case reopened: {reason}",
            $"?? ????? ??? ??????: {reason}",
      new { previousStatus = oldStatus.ToString(), reason });

        return await GetCaseAsync(incidentCase.Id);
    }

    #endregion

    #region Evidence

    public async Task<ApiResponse<IncidentEvidenceLinkDto>> LinkEvidenceAsync(LinkEvidenceDto dto, string userId)
    {
   var incidentCase = await _context.Set<IncidentCase>()
      .FirstOrDefaultAsync(c => c.Id == dto.CaseId);

      if (incidentCase == null)
        {
        return ApiResponse<IncidentEvidenceLinkDto>.FailureResponse("Case not found");
        }

     if (incidentCase.Status == IncidentStatus.Closed)
        {
            return ApiResponse<IncidentEvidenceLinkDto>.FailureResponse("Cannot add evidence to a closed case");
        }

  var now = DateTime.UtcNow;

        // Get the next order number
    var maxOrder = await _context.Set<IncidentEvidenceLink>()
            .Where(e => e.IncidentCaseId == dto.CaseId)
         .MaxAsync(e => (int?)e.Order) ?? 0;

var evidenceLink = new IncidentEvidenceLink
        {
            IncidentCaseId = dto.CaseId,
            ProctorEvidenceId = dto.ProctorEvidenceId,
            ProctorEventId = dto.ProctorEventId,
 NoteEn = dto.NoteEn,
         NoteAr = dto.NoteAr,
    Order = maxOrder + 1,
 LinkedBy = userId,
    LinkedAt = now,
            CreatedDate = now,
            CreatedBy = userId
        };

      _context.Set<IncidentEvidenceLink>().Add(evidenceLink);
        await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.EvidenceLinked, userId,
"Evidence linked to case",
 "?? ??? ?????? ???????",
      new { evidenceId = dto.ProctorEvidenceId, eventId = dto.ProctorEventId });

return ApiResponse<IncidentEvidenceLinkDto>.SuccessResponse(MapToEvidenceLinkDto(evidenceLink));
    }

    public async Task<ApiResponse<List<IncidentEvidenceLinkDto>>> GetCaseEvidenceAsync(int caseId)
    {
    var evidenceLinks = await _context.Set<IncidentEvidenceLink>()
            .Include(e => e.ProctorEvidence)
            .Include(e => e.ProctorEvent)
       .Where(e => e.IncidentCaseId == caseId)
     .OrderBy(e => e.Order)
            .ToListAsync();

     return ApiResponse<List<IncidentEvidenceLinkDto>>.SuccessResponse(
   evidenceLinks.Select(MapToEvidenceLinkDto).ToList());
 }

    public async Task<ApiResponse<bool>> RemoveEvidenceLinkAsync(int linkId, string userId)
    {
 var link = await _context.Set<IncidentEvidenceLink>()
    .Include(e => e.IncidentCase)
.FirstOrDefaultAsync(e => e.Id == linkId);

        if (link == null)
   {
  return ApiResponse<bool>.FailureResponse("Evidence link not found");
        }

if (link.IncidentCase.Status == IncidentStatus.Closed)
        {
      return ApiResponse<bool>.FailureResponse("Cannot remove evidence from a closed case");
        }

        link.IsDeleted = true;
        link.DeletedBy = userId;
   link.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Evidence link removed");
}

    #endregion

  #region Decisions

    public async Task<ApiResponse<IncidentDecisionHistoryDto>> RecordDecisionAsync(RecordDecisionDto dto, string userId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .Include(c => c.Attempt)
         .FirstOrDefaultAsync(c => c.Id == dto.CaseId);

  if (incidentCase == null)
        {
      return ApiResponse<IncidentDecisionHistoryDto>.FailureResponse("Case not found");
}

        if (incidentCase.Status == IncidentStatus.Closed)
        {
            return ApiResponse<IncidentDecisionHistoryDto>.FailureResponse("Cannot record decision on a closed case");
        }

        // Get current risk score if proctor session exists
     decimal? currentRiskScore = null;
        if (incidentCase.ProctorSessionId.HasValue)
        {
            var proctorSession = await _context.Set<ProctorSession>()
  .FirstOrDefaultAsync(s => s.Id == incidentCase.ProctorSessionId.Value);
 currentRiskScore = proctorSession?.RiskScore;
     }

    var now = DateTime.UtcNow;

        var decision = new IncidentDecisionHistory
    {
  IncidentCaseId = dto.CaseId,
   Outcome = dto.Outcome,
   ReasonEn = dto.ReasonEn,
        ReasonAr = dto.ReasonAr,
       InternalNotes = dto.InternalNotes,
            DecidedBy = userId,
        DecidedAt = now,
RiskScoreAtDecision = currentRiskScore,
         CreatedDate = now,
          CreatedBy = userId
   };

        _context.Set<IncidentDecisionHistory>().Add(decision);

      // Update case with latest decision
      incidentCase.Outcome = dto.Outcome;
        incidentCase.ResolutionNoteEn = dto.ReasonEn;
        incidentCase.ResolutionNoteAr = dto.ReasonAr;
        incidentCase.ResolvedBy = userId;
        incidentCase.ResolvedAt = now;
        incidentCase.Status = IncidentStatus.Resolved;
        incidentCase.UpdatedDate = now;
        incidentCase.UpdatedBy = userId;

        if (dto.CloseCase)
    {
      incidentCase.Status = IncidentStatus.Closed;
   incidentCase.ClosedBy = userId;
      incidentCase.ClosedAt = now;
        }

        await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.DecisionRecorded, userId,
   $"Decision recorded: {dto.Outcome}",
    $"?? ????? ??????: {dto.Outcome}",
       new { outcome = dto.Outcome.ToString(), closeCase = dto.CloseCase });

        return ApiResponse<IncidentDecisionHistoryDto>.SuccessResponse(MapToDecisionDto(decision));
    }

  public async Task<ApiResponse<List<IncidentDecisionHistoryDto>>> GetDecisionHistoryAsync(int caseId)
    {
   var decisions = await _context.Set<IncidentDecisionHistory>()
  .Where(d => d.IncidentCaseId == caseId)
            .OrderByDescending(d => d.DecidedAt)
            .ToListAsync();

        return ApiResponse<List<IncidentDecisionHistoryDto>>.SuccessResponse(
            decisions.Select(MapToDecisionDto).ToList());
    }

    public async Task<ApiResponse<IncidentDecisionHistoryDto>> GetLatestDecisionAsync(int caseId)
    {
 var decision = await _context.Set<IncidentDecisionHistory>()
    .Where(d => d.IncidentCaseId == caseId)
 .OrderByDescending(d => d.DecidedAt)
        .FirstOrDefaultAsync();

        if (decision == null)
      {
    return ApiResponse<IncidentDecisionHistoryDto>.FailureResponse("No decision found");
        }

        return ApiResponse<IncidentDecisionHistoryDto>.SuccessResponse(MapToDecisionDto(decision));
    }

    #endregion

    #region Comments

    public async Task<ApiResponse<IncidentCommentDto>> AddCommentAsync(AddCommentDto dto, string userId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .FirstOrDefaultAsync(c => c.Id == dto.CaseId);

  if (incidentCase == null)
      {
        return ApiResponse<IncidentCommentDto>.FailureResponse("Case not found");
        }

        var author = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
      var now = DateTime.UtcNow;

        var comment = new IncidentComment
        {
 IncidentCaseId = dto.CaseId,
            AuthorId = userId,
            AuthorName = author?.FullName ?? author?.UserName,
     Body = dto.Body,
 IsVisibleToCandidate = dto.IsVisibleToCandidate,
   CreatedDate = now,
            CreatedBy = userId
        };

        _context.Set<IncidentComment>().Add(comment);
     await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.CommentAdded, userId,
            "Comment added",
     "?? ????? ?????",
         new { commentId = comment.Id, isVisibleToCandidate = dto.IsVisibleToCandidate });

        return ApiResponse<IncidentCommentDto>.SuccessResponse(MapToCommentDto(comment));
    }

    public async Task<ApiResponse<IncidentCommentDto>> EditCommentAsync(EditCommentDto dto, string userId)
    {
        var comment = await _context.Set<IncidentComment>()
     .FirstOrDefaultAsync(c => c.Id == dto.CommentId);

      if (comment == null)
        {
            return ApiResponse<IncidentCommentDto>.FailureResponse("Comment not found");
        }

        if (comment.AuthorId != userId)
        {
        return ApiResponse<IncidentCommentDto>.FailureResponse("You can only edit your own comments");
        }

        var now = DateTime.UtcNow;
      comment.Body = dto.Body;
        comment.IsEdited = true;
    comment.EditedAt = now;
        comment.UpdatedDate = now;
        comment.UpdatedBy = userId;

        await _context.SaveChangesAsync();

  return ApiResponse<IncidentCommentDto>.SuccessResponse(MapToCommentDto(comment));
    }

    public async Task<ApiResponse<bool>> DeleteCommentAsync(int commentId, string userId)
  {
        var comment = await _context.Set<IncidentComment>()
       .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
        {
            return ApiResponse<bool>.FailureResponse("Comment not found");
        }

        comment.IsDeleted = true;
   comment.DeletedBy = userId;
      comment.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Comment deleted");
    }

    public async Task<ApiResponse<List<IncidentCommentDto>>> GetCommentsAsync(int caseId, bool includeInternal = true)
    {
        var query = _context.Set<IncidentComment>()
            .Where(c => c.IncidentCaseId == caseId);

  if (!includeInternal)
     {
            query = query.Where(c => c.IsVisibleToCandidate);
        }

        var comments = await query
            .OrderBy(c => c.CreatedDate)
            .ToListAsync();

        return ApiResponse<List<IncidentCommentDto>>.SuccessResponse(
            comments.Select(MapToCommentDto).ToList());
    }

    #endregion

    #region Timeline

    public async Task<ApiResponse<List<IncidentTimelineEventDto>>> GetTimelineAsync(int caseId)
    {
        var timeline = await _context.Set<IncidentTimelineEvent>()
            .Where(t => t.IncidentCaseId == caseId)
            .OrderByDescending(t => t.OccurredAt)
            .ToListAsync();

        return ApiResponse<List<IncidentTimelineEventDto>>.SuccessResponse(
            timeline.Select(MapToTimelineDto).ToList());
    }

    #endregion

    #region Appeals

    public async Task<ApiResponse<AppealRequestDto>> SubmitAppealAsync(SubmitAppealDto dto, string candidateId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .Include(c => c.Exam)
            .Include(c => c.Attempt)
            .FirstOrDefaultAsync(c => c.Id == dto.IncidentCaseId);

if (incidentCase == null)
        {
    return ApiResponse<AppealRequestDto>.FailureResponse("Incident case not found");
        }

        if (incidentCase.CandidateId != candidateId)
        {
    return ApiResponse<AppealRequestDto>.FailureResponse("You can only appeal your own cases");
        }

        if (incidentCase.Outcome == null)
        {
            return ApiResponse<AppealRequestDto>.FailureResponse("Cannot appeal a case without a decision");
    }

        // Check if pending appeal exists
        var existingAppeal = await _context.Set<AppealRequest>()
          .FirstOrDefaultAsync(a => a.IncidentCaseId == dto.IncidentCaseId &&
         (a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview));

        if (existingAppeal != null)
        {
          return ApiResponse<AppealRequestDto>.FailureResponse("An appeal is already pending for this case");
        }

        var now = DateTime.UtcNow;
        var appealNumber = await GenerateAppealNumberAsync();

        var appeal = new AppealRequest
        {
         AppealNumber = appealNumber,
            IncidentCaseId = dto.IncidentCaseId,
            ExamId = incidentCase.ExamId,
      AttemptId = incidentCase.AttemptId,
            CandidateId = candidateId,
   Status = AppealStatus.Submitted,
      Message = dto.Message,
            SupportingInfo = dto.SupportingInfo,
      SubmittedAt = now,
       CreatedDate = now,
     CreatedBy = candidateId
        };

     _context.Set<AppealRequest>().Add(appeal);
await _context.SaveChangesAsync();

        await AddTimelineEventAsync(incidentCase.Id, IncidentTimelineEventType.AppealSubmitted, candidateId,
"Appeal submitted",
 "?? ????? ?????????",
            new { appealId = appeal.Id, appealNumber });

    return await GetAppealAsync(appeal.Id);
    }

    public async Task<ApiResponse<AppealRequestDto>> GetAppealAsync(int appealId)
    {
 var appeal = await _context.Set<AppealRequest>()
   .Include(a => a.IncidentCase)
          .Include(a => a.Exam)
     .Include(a => a.Candidate)
            .Include(a => a.Reviewer)
    .FirstOrDefaultAsync(a => a.Id == appealId);

        if (appeal == null)
        {
        return ApiResponse<AppealRequestDto>.FailureResponse("Appeal not found");
        }

     return ApiResponse<AppealRequestDto>.SuccessResponse(MapToAppealDto(appeal));
    }

    public async Task<ApiResponse<List<AppealRequestDto>>> GetCaseAppealsAsync(int caseId)
    {
        var appeals = await _context.Set<AppealRequest>()
            .Include(a => a.IncidentCase)
            .Include(a => a.Exam)
   .Include(a => a.Candidate)
          .Include(a => a.Reviewer)
    .Where(a => a.IncidentCaseId == caseId)
     .OrderByDescending(a => a.SubmittedAt)
         .ToListAsync();

     return ApiResponse<List<AppealRequestDto>>.SuccessResponse(
    appeals.Select(MapToAppealDto).ToList());
    }

 public async Task<ApiResponse<PaginatedResponse<AppealRequestListDto>>> GetAppealsAsync(AppealSearchDto searchDto)
    {
        var query = _context.Set<AppealRequest>()
.Include(a => a.IncidentCase)
            .Include(a => a.Exam)
    .Include(a => a.Candidate)
            .Include(a => a.Reviewer)
            .AsQueryable();

        if (searchDto.ExamId.HasValue)
            query = query.Where(a => a.ExamId == searchDto.ExamId.Value);

        if (!string.IsNullOrEmpty(searchDto.CandidateId))
   query = query.Where(a => a.CandidateId == searchDto.CandidateId);

  if (searchDto.Status.HasValue)
      query = query.Where(a => a.Status == searchDto.Status.Value);

        if (searchDto.SubmittedFrom.HasValue)
    query = query.Where(a => a.SubmittedAt >= searchDto.SubmittedFrom.Value);

    if (searchDto.SubmittedTo.HasValue)
      query = query.Where(a => a.SubmittedAt <= searchDto.SubmittedTo.Value);

        query = query.OrderByDescending(a => a.SubmittedAt);

        var totalCount = await query.CountAsync();
      var items = await query
       .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
          .ToListAsync();

        return ApiResponse<PaginatedResponse<AppealRequestListDto>>.SuccessResponse(
       new PaginatedResponse<AppealRequestListDto>
  {
   Items = items.Select(MapToAppealListDto).ToList(),
                PageNumber = searchDto.PageNumber,
    PageSize = searchDto.PageSize,
    TotalCount = totalCount
   });
    }

    public async Task<ApiResponse<AppealRequestDto>> ReviewAppealAsync(ReviewAppealDto dto, string reviewerId)
    {
        var appeal = await _context.Set<AppealRequest>()
 .Include(a => a.IncidentCase)
  .FirstOrDefaultAsync(a => a.Id == dto.AppealId);

 if (appeal == null)
        {
         return ApiResponse<AppealRequestDto>.FailureResponse("Appeal not found");
  }

    if (appeal.Status != AppealStatus.Submitted && appeal.Status != AppealStatus.InReview)
 {
            return ApiResponse<AppealRequestDto>.FailureResponse("Appeal has already been reviewed");
        }

        var now = DateTime.UtcNow;

        appeal.Status = dto.Decision;
        appeal.ReviewedBy = reviewerId;
        appeal.ReviewedAt = now;
        appeal.DecisionNoteEn = dto.DecisionNoteEn;
     appeal.DecisionNoteAr = dto.DecisionNoteAr;
        appeal.InternalNotes = dto.InternalNotes;
        appeal.UpdatedDate = now;
        appeal.UpdatedBy = reviewerId;

        // If approved with new outcome, record new decision
        if (dto.Decision == AppealStatus.Approved && dto.NewOutcome.HasValue)
    {
          var decision = new IncidentDecisionHistory
            {
             IncidentCaseId = appeal.IncidentCaseId,
    Outcome = dto.NewOutcome.Value,
      ReasonEn = dto.DecisionNoteEn,
                ReasonAr = dto.DecisionNoteAr,
     DecidedBy = reviewerId,
                DecidedAt = now,
   IsAppealDecision = true,
  AppealRequestId = appeal.Id,
      CreatedDate = now,
                CreatedBy = reviewerId
          };

            _context.Set<IncidentDecisionHistory>().Add(decision);

            // Update case outcome
            appeal.IncidentCase.Outcome = dto.NewOutcome.Value;
        appeal.IncidentCase.ResolutionNoteEn = dto.DecisionNoteEn;
            appeal.IncidentCase.ResolvedBy = reviewerId;
         appeal.IncidentCase.ResolvedAt = now;
            appeal.IncidentCase.UpdatedDate = now;
            appeal.IncidentCase.UpdatedBy = reviewerId;
      }

        await _context.SaveChangesAsync();

 await AddTimelineEventAsync(appeal.IncidentCaseId, IncidentTimelineEventType.AppealReviewed, reviewerId,
            $"Appeal {dto.Decision}: {dto.DecisionNoteEn}",
            $"????????? {dto.Decision}: {dto.DecisionNoteAr}",
            new { appealId = appeal.Id, decision = dto.Decision.ToString(), newOutcome = dto.NewOutcome?.ToString() });

        return await GetAppealAsync(appeal.Id);
    }

    public async Task<ApiResponse<AppealRequestDto>> GetCandidateAppealAsync(int caseId, string candidateId)
    {
        var appeal = await _context.Set<AppealRequest>()
            .Include(a => a.IncidentCase)
     .Include(a => a.Exam)
       .FirstOrDefaultAsync(a => a.IncidentCaseId == caseId && a.CandidateId == candidateId);

  if (appeal == null)
        {
    return ApiResponse<AppealRequestDto>.FailureResponse("No appeal found");
        }

        return ApiResponse<AppealRequestDto>.SuccessResponse(MapToAppealDto(appeal));
    }

    public async Task<ApiResponse<bool>> CanSubmitAppealAsync(int caseId, string candidateId)
    {
        var incidentCase = await _context.Set<IncidentCase>()
            .FirstOrDefaultAsync(c => c.Id == caseId);

   if (incidentCase == null || incidentCase.CandidateId != candidateId)
    {
            return ApiResponse<bool>.SuccessResponse(false);
  }

    if (incidentCase.Outcome == null)
        {
            return ApiResponse<bool>.SuccessResponse(false, "No decision has been made yet");
        }

        var pendingAppeal = await _context.Set<AppealRequest>()
            .AnyAsync(a => a.IncidentCaseId == caseId &&
              (a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview));

  return ApiResponse<bool>.SuccessResponse(!pendingAppeal);
    }

    #endregion

    #region Candidate Access

    public async Task<ApiResponse<CandidateIncidentStatusDto>> GetCandidateIncidentStatusAsync(
     int attemptId, string candidateId)
    {
     var incidentCase = await _context.Set<IncidentCase>()
  .Include(c => c.Exam)
          .Include(c => c.Appeals.Where(a => a.Status != AppealStatus.Rejected))
            .FirstOrDefaultAsync(c => c.AttemptId == attemptId && c.CandidateId == candidateId);

   if (incidentCase == null)
        {
 return ApiResponse<CandidateIncidentStatusDto>.FailureResponse("No incident found");
        }

    var activeAppeal = incidentCase.Appeals
            .FirstOrDefault(a => a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview);

        var canAppeal = incidentCase.Outcome != null && activeAppeal == null;

   return ApiResponse<CandidateIncidentStatusDto>.SuccessResponse(new CandidateIncidentStatusDto
 {
         IncidentCaseId = incidentCase.Id,
            CaseNumber = incidentCase.CaseNumber,
            ExamId = incidentCase.ExamId,
  ExamTitleEn = incidentCase.Exam.TitleEn,
       Status = incidentCase.Status,
    Outcome = incidentCase.Outcome,
   CreatedAt = incidentCase.CreatedDate,
            ResolvedAt = incidentCase.ResolvedAt,
            CanAppeal = canAppeal,
 ActiveAppeal = activeAppeal != null ? MapToAppealDto(activeAppeal) : null
        });
    }

    public async Task<ApiResponse<List<CandidateIncidentStatusDto>>> GetCandidateIncidentsAsync(string candidateId)
    {
        var incidents = await _context.Set<IncidentCase>()
         .Include(c => c.Exam)
      .Include(c => c.Appeals)
    .Where(c => c.CandidateId == candidateId)
  .OrderByDescending(c => c.CreatedDate)
     .ToListAsync();

        var result = incidents.Select(c =>
   {
            var activeAppeal = c.Appeals
          .FirstOrDefault(a => a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview);

     return new CandidateIncidentStatusDto
     {
         IncidentCaseId = c.Id,
             CaseNumber = c.CaseNumber,
       ExamId = c.ExamId,
        ExamTitleEn = c.Exam.TitleEn,
           Status = c.Status,
                Outcome = c.Outcome,
   CreatedAt = c.CreatedDate,
   ResolvedAt = c.ResolvedAt,
CanAppeal = c.Outcome != null && activeAppeal == null,
      ActiveAppeal = activeAppeal != null ? MapToAppealDto(activeAppeal) : null
    };
    }).ToList();

    return ApiResponse<List<CandidateIncidentStatusDto>>.SuccessResponse(result);
    }

    #endregion

    #region Dashboard

    public async Task<ApiResponse<IncidentDashboardDto>> GetDashboardAsync(int examId)
    {
        var exam = await _context.Exams.FirstOrDefaultAsync(e => e.Id == examId);
      if (exam == null)
     {
        return ApiResponse<IncidentDashboardDto>.FailureResponse("Exam not found");
        }

   var cases = await _context.Set<IncidentCase>()
     .Include(c => c.Assignee)
            .Where(c => c.ExamId == examId)
            .ToListAsync();

        var pendingAppeals = await _context.Set<AppealRequest>()
.CountAsync(a => a.ExamId == examId &&
      (a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview));

  return ApiResponse<IncidentDashboardDto>.SuccessResponse(BuildDashboard(exam.TitleEn, examId, cases, pendingAppeals));
    }

    public async Task<ApiResponse<IncidentDashboardDto>> GetGlobalDashboardAsync()
    {
        var cases = await _context.Set<IncidentCase>()
            .Include(c => c.Assignee)
            .ToListAsync();

     var pendingAppeals = await _context.Set<AppealRequest>()
   .CountAsync(a => a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview);

        return ApiResponse<IncidentDashboardDto>.SuccessResponse(BuildDashboard("All Exams", 0, cases, pendingAppeals));
    }

    #endregion

    #region Automation

    public async Task<int> ProcessProctorIncidentsAsync(decimal riskThreshold, int violationThreshold)
    {
        var now = DateTime.UtcNow;
   var createdCount = 0;

        // Find completed proctor sessions that exceed thresholds and don't have incidents
        var sessions = await _context.Set<ProctorSession>()
            .Include(s => s.Attempt)
            .Where(s => s.Status == ProctorSessionStatus.Completed &&
   (s.RiskScore >= riskThreshold || s.TotalViolations >= violationThreshold))
   .ToListAsync();

        foreach (var session in sessions)
        {
            // Check if incident already exists
  var existingCase = await _context.Set<IncidentCase>()
        .AnyAsync(c => c.AttemptId == session.AttemptId);

            if (!existingCase)
  {
     var result = await CreateCaseFromProctorAsync(session.Id, "System");
                if (result.Success)
      {
      createdCount++;
   }
            }
        }

        return createdCount;
    }

    #endregion

    #region Private Helper Methods

    private async Task<IncidentCase?> GetCaseWithIncludesAsync(int caseId)
    {
        return await _context.Set<IncidentCase>()
          .Include(c => c.Exam)
         .Include(c => c.Attempt)
      .Include(c => c.Candidate)
      .Include(c => c.Assignee)
            .Include(c => c.Timeline.OrderByDescending(t => t.OccurredAt).Take(50))
      .Include(c => c.EvidenceLinks.OrderBy(e => e.Order))
   .Include(c => c.Decisions.OrderByDescending(d => d.DecidedAt))
            .Include(c => c.Comments)
  .Include(c => c.Appeals)
            .FirstOrDefaultAsync(c => c.Id == caseId);
    }

    private IQueryable<IncidentCase> ApplyCaseFilters(IQueryable<IncidentCase> query, IncidentCaseSearchDto searchDto)
    {
        if (searchDto.ExamId.HasValue)
            query = query.Where(c => c.ExamId == searchDto.ExamId.Value);

        if (!string.IsNullOrEmpty(searchDto.CandidateId))
            query = query.Where(c => c.CandidateId == searchDto.CandidateId);

        if (searchDto.Status.HasValue)
            query = query.Where(c => c.Status == searchDto.Status.Value);

        if (searchDto.Severity.HasValue)
      query = query.Where(c => c.Severity == searchDto.Severity.Value);

        if (searchDto.Source.HasValue)
   query = query.Where(c => c.Source == searchDto.Source.Value);

        if (searchDto.Outcome.HasValue)
query = query.Where(c => c.Outcome == searchDto.Outcome.Value);

        if (!string.IsNullOrEmpty(searchDto.AssignedTo))
            query = query.Where(c => c.AssignedTo == searchDto.AssignedTo);

        if (searchDto.Unassigned == true)
            query = query.Where(c => c.AssignedTo == null);

        if (searchDto.CreatedFrom.HasValue)
        query = query.Where(c => c.CreatedDate >= searchDto.CreatedFrom.Value);

        if (searchDto.CreatedTo.HasValue)
      query = query.Where(c => c.CreatedDate <= searchDto.CreatedTo.Value);

   if (!string.IsNullOrEmpty(searchDto.Search))
        {
     var search = searchDto.Search.ToLower();
   query = query.Where(c =>
      c.CaseNumber.ToLower().Contains(search) ||
         c.TitleEn.ToLower().Contains(search) ||
     c.TitleAr.Contains(search));
        }

        return query;
    }

    private async Task<string> GenerateCaseNumberAsync()
    {
        var today = DateTime.UtcNow;
        var prefix = $"INC-{today:yyyyMMdd}";
      var count = await _context.Set<IncidentCase>()
         .CountAsync(c => c.CaseNumber.StartsWith(prefix));
        return $"{prefix}-{(count + 1):D4}";
    }

    private async Task<string> GenerateAppealNumberAsync()
    {
    var today = DateTime.UtcNow;
        var prefix = $"APL-{today:yyyyMMdd}";
        var count = await _context.Set<AppealRequest>()
  .CountAsync(a => a.AppealNumber.StartsWith(prefix));
        return $"{prefix}-{(count + 1):D4}";
    }

    private async Task AddTimelineEventAsync(int caseId, IncidentTimelineEventType eventType,
     string actorId, string descriptionEn, string descriptionAr, object? metadata = null)
    {
 var actor = await _context.Users.FirstOrDefaultAsync(u => u.Id == actorId);
        var now = DateTime.UtcNow;

    var timelineEvent = new IncidentTimelineEvent
   {
 IncidentCaseId = caseId,
            EventType = eventType,
            ActorId = actorId,
            ActorName = actorId == "System" ? "System" : (actor?.FullName ?? actor?.UserName),
  DescriptionEn = descriptionEn,
       DescriptionAr = descriptionAr,
            MetadataJson = metadata != null ? JsonSerializer.Serialize(metadata) : null,
      OccurredAt = now,
            CreatedDate = now,
   CreatedBy = actorId
        };

      _context.Set<IncidentTimelineEvent>().Add(timelineEvent);
        await _context.SaveChangesAsync();
    }

    private bool IsValidStatusTransition(IncidentStatus current, IncidentStatus target)
    {
     return (current, target) switch
        {
      (IncidentStatus.Open, IncidentStatus.InReview) => true,
     (IncidentStatus.InReview, IncidentStatus.Resolved) => true,
            (IncidentStatus.Resolved, IncidentStatus.Closed) => true,
     _ => false
     };
    }

    private IncidentSeverity DetermineSeverity(decimal? riskScore, int violations)
    {
        if (riskScore >= 75 || violations >= 20)
          return IncidentSeverity.Critical;
        if (riskScore >= 50 || violations >= 10)
            return IncidentSeverity.High;
    if (riskScore >= 25 || violations >= 5)
          return IncidentSeverity.Medium;
        return IncidentSeverity.Low;
    }

    private IncidentDashboardDto BuildDashboard(string examTitle, int examId,
        List<IncidentCase> cases, int pendingAppeals)
    {
        var total = cases.Count;

   return new IncidentDashboardDto
        {
            ExamId = examId,
    ExamTitleEn = examTitle,
    TotalCases = total,
            OpenCases = cases.Count(c => c.Status == IncidentStatus.Open),
            InReviewCases = cases.Count(c => c.Status == IncidentStatus.InReview),
      ResolvedCases = cases.Count(c => c.Status == IncidentStatus.Resolved),
            ClosedCases = cases.Count(c => c.Status == IncidentStatus.Closed),
       UnassignedCases = cases.Count(c => c.AssignedTo == null && c.Status != IncidentStatus.Closed),
   CriticalSeverityCases = cases.Count(c => c.Severity == IncidentSeverity.Critical && c.Status != IncidentStatus.Closed),
    HighSeverityCases = cases.Count(c => c.Severity == IncidentSeverity.High && c.Status != IncidentStatus.Closed),
  ClearedCount = cases.Count(c => c.Outcome == IncidentOutcome.Cleared),
            SuspiciousCount = cases.Count(c => c.Outcome == IncidentOutcome.Suspicious),
            InvalidatedCount = cases.Count(c => c.Outcome == IncidentOutcome.Invalidated),
  EscalatedCount = cases.Count(c => c.Outcome == IncidentOutcome.Escalated),
  PendingAppeals = pendingAppeals,
    ReviewerWorkload = cases
       .Where(c => c.AssignedTo != null)
  .GroupBy(c => c.AssignedTo!)
           .Select(g => new ReviewerWorkloadDto
        {
                    ReviewerId = g.Key,
    ReviewerName = g.First().Assignee?.FullName ?? g.First().Assignee?.UserName ?? g.Key,
      AssignedCases = g.Count(c => c.Status != IncidentStatus.Closed),
 ResolvedCases = g.Count(c => c.Status == IncidentStatus.Resolved || c.Status == IncidentStatus.Closed)
                }).ToList(),
      SeverityDistribution = Enum.GetValues<IncidentSeverity>()
          .Select(s => new SeverityDistributionDto
            {
        Severity = s,
    Count = cases.Count(c => c.Severity == s),
           Percentage = total > 0 ? (decimal)cases.Count(c => c.Severity == s) / total * 100 : 0
    }).ToList()
        };
    }

    #region Mapping Methods

    private IncidentCaseDto MapToCaseDto(IncidentCase c)
    {
        return new IncidentCaseDto
        {
   Id = c.Id,
      CaseNumber = c.CaseNumber,
        ExamId = c.ExamId,
   ExamTitleEn = c.Exam?.TitleEn ?? "",
     AttemptId = c.AttemptId,
      AttemptNumber = c.Attempt?.AttemptNumber ?? 0,
    CandidateId = c.CandidateId,
        CandidateName = c.Candidate?.FullName ?? c.Candidate?.UserName ?? "",
            CandidateEmail = c.Candidate?.Email,
    ProctorSessionId = c.ProctorSessionId,
       Status = c.Status,
        Severity = c.Severity,
            Source = c.Source,
            TitleEn = c.TitleEn,
 TitleAr = c.TitleAr,
    SummaryEn = c.SummaryEn,
            SummaryAr = c.SummaryAr,
            RiskScoreAtCreate = c.RiskScoreAtCreate,
            TotalViolationsAtCreate = c.TotalViolationsAtCreate,
            AssignedTo = c.AssignedTo,
         AssigneeName = c.Assignee?.FullName ?? c.Assignee?.UserName,
            AssignedAt = c.AssignedAt,
       Outcome = c.Outcome,
            ResolutionNoteEn = c.ResolutionNoteEn,
            ResolvedBy = c.ResolvedBy,
            ResolvedAt = c.ResolvedAt,
  CreatedAt = c.CreatedDate,
      Timeline = c.Timeline.Select(MapToTimelineDto).ToList(),
       EvidenceLinks = c.EvidenceLinks.Select(MapToEvidenceLinkDto).ToList(),
    Decisions = c.Decisions.Select(MapToDecisionDto).ToList(),
      CommentCount = c.Comments.Count,
            AppealCount = c.Appeals.Count
        };
    }

    private IncidentCaseListDto MapToCaseListDto(IncidentCase c)
{
        return new IncidentCaseListDto
    {
            Id = c.Id,
            CaseNumber = c.CaseNumber,
    ExamId = c.ExamId,
 ExamTitleEn = c.Exam?.TitleEn ?? "",
CandidateName = c.Candidate?.FullName ?? c.Candidate?.UserName ?? "",
         Status = c.Status,
         Severity = c.Severity,
         Source = c.Source,
   TitleEn = c.TitleEn,
            RiskScoreAtCreate = c.RiskScoreAtCreate,
            AssigneeName = c.Assignee?.FullName ?? c.Assignee?.UserName,
Outcome = c.Outcome,
CreatedAt = c.CreatedDate,
 HasPendingAppeal = c.Appeals.Any(a => a.Status == AppealStatus.Submitted || a.Status == AppealStatus.InReview)
        };
    }

    private IncidentTimelineEventDto MapToTimelineDto(IncidentTimelineEvent t)
    {
 return new IncidentTimelineEventDto
        {
  Id = t.Id,
            EventType = t.EventType,
    ActorId = t.ActorId,
    ActorName = t.ActorName,
            DescriptionEn = t.DescriptionEn,
    DescriptionAr = t.DescriptionAr,
      MetadataJson = t.MetadataJson,
            OccurredAt = t.OccurredAt
        };
 }

    private IncidentEvidenceLinkDto MapToEvidenceLinkDto(IncidentEvidenceLink e)
    {
        string evidenceType = "Unknown";
        string? description = null;

        if (e.ProctorEvidence != null)
        {
      evidenceType = e.ProctorEvidence.Type.ToString();
            description = e.ProctorEvidence.FileName;
   }
        else if (e.ProctorEvent != null)
 {
       evidenceType = "Event";
        description = e.ProctorEvent.EventType.ToString();
    }

        return new IncidentEvidenceLinkDto
      {
       Id = e.Id,
       ProctorEvidenceId = e.ProctorEvidenceId,
   ProctorEventId = e.ProctorEventId,
      EvidenceType = evidenceType,
            EvidenceDescription = description,
   NoteEn = e.NoteEn,
      NoteAr = e.NoteAr,
            Order = e.Order,
      LinkedBy = e.LinkedBy,
      LinkedAt = e.LinkedAt
        };
    }

    private IncidentDecisionHistoryDto MapToDecisionDto(IncidentDecisionHistory d)
    {
     return new IncidentDecisionHistoryDto
    {
        Id = d.Id,
            Outcome = d.Outcome,
            ReasonEn = d.ReasonEn,
            ReasonAr = d.ReasonAr,
            DecidedBy = d.DecidedBy,
     DecidedAt = d.DecidedAt,
            RiskScoreAtDecision = d.RiskScoreAtDecision,
 IsAppealDecision = d.IsAppealDecision
        };
    }

    private IncidentCommentDto MapToCommentDto(IncidentComment c)
    {
        return new IncidentCommentDto
        {
   Id = c.Id,
            AuthorId = c.AuthorId,
          AuthorName = c.AuthorName,
            Body = c.Body,
            IsVisibleToCandidate = c.IsVisibleToCandidate,
       IsEdited = c.IsEdited,
            CreatedAt = c.CreatedDate,
            EditedAt = c.EditedAt
     };
    }

    private AppealRequestDto MapToAppealDto(AppealRequest a)
    {
        return new AppealRequestDto
     {
            Id = a.Id,
            AppealNumber = a.AppealNumber,
            IncidentCaseId = a.IncidentCaseId,
            CaseNumber = a.IncidentCase?.CaseNumber ?? "",
            ExamId = a.ExamId,
          ExamTitleEn = a.Exam?.TitleEn ?? "",
            AttemptId = a.AttemptId,
            CandidateId = a.CandidateId,
            CandidateName = a.Candidate?.FullName ?? a.Candidate?.UserName ?? "",
            Status = a.Status,
 Message = a.Message,
        SupportingInfo = a.SupportingInfo,
 SubmittedAt = a.SubmittedAt,
            ReviewedBy = a.ReviewedBy,
       ReviewerName = a.Reviewer?.FullName ?? a.Reviewer?.UserName,
ReviewedAt = a.ReviewedAt,
DecisionNoteEn = a.DecisionNoteEn,
     DecisionNoteAr = a.DecisionNoteAr,
            OriginalOutcome = a.IncidentCase?.Outcome
     };
    }

    private AppealRequestListDto MapToAppealListDto(AppealRequest a)
    {
        return new AppealRequestListDto
        {
            Id = a.Id,
            AppealNumber = a.AppealNumber,
 CaseNumber = a.IncidentCase?.CaseNumber ?? "",
            ExamTitleEn = a.Exam?.TitleEn ?? "",
            CandidateName = a.Candidate?.FullName ?? a.Candidate?.UserName ?? "",
            Status = a.Status,
        SubmittedAt = a.SubmittedAt,
            ReviewerName = a.Reviewer?.FullName ?? a.Reviewer?.UserName,
     ReviewedAt = a.ReviewedAt
        };
    }

    #endregion

    #endregion
}
