using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Attempt;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Controllers.Attempt;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttemptController : ControllerBase
{
    private readonly IAttemptService _attemptService;
    private readonly ICurrentUserService _currentUserService;
    private readonly INotificationDispatcher _notifications;

    public AttemptController(
        IAttemptService attemptService,
        ICurrentUserService currentUserService,
        INotificationDispatcher notifications)
    {
        _attemptService = attemptService;
        _currentUserService = currentUserService;
        _notifications = notifications;
    }

    #region Candidate Endpoints

    /// <summary>
    /// Start a new attempt or resume an existing active attempt for an exam
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpPost("start")]
    public async Task<IActionResult> StartAttempt([FromBody] StartAttemptDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
         return Unauthorized();
        }

        var result = await _attemptService.StartAttemptAsync(dto, candidateId);
        if (result.Success && result.Data != null)
            _notifications.NotifyRoles(
                [AppRoles.SuperAdmin, AppRoles.Admin],
                UserNotificationType.CandidateStartedExam,
                "Candidate Started Exam", "بدأ مرشح الاختبار",
                $"A candidate has started the exam.", "بدأ مرشح خوض الاختبار.",
                relatedExamId: result.Data.ExamId,
                relatedAttemptId: result.Data.AttemptId,
                actorUserId: candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get attempt session details (for resuming an attempt)
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpGet("{attemptId}/session")]
    public async Task<IActionResult> GetAttemptSession(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
 if (string.IsNullOrEmpty(candidateId))
      {
            return Unauthorized();
        }

        var result = await _attemptService.GetAttemptSessionAsync(attemptId, candidateId);
     return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Submit an attempt
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpPost("{attemptId}/submit")]
    public async Task<IActionResult> SubmitAttempt(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
  return Unauthorized();
        }

     var result = await _attemptService.SubmitAttemptAsync(attemptId, candidateId);
        if (result.Success)
            _notifications.NotifyRoles(
                [AppRoles.SuperAdmin, AppRoles.Admin],
                UserNotificationType.CandidateSubmittedExam,
                "Candidate Submitted Exam", "أتم مرشح تقديم الاختبار",
                "A candidate has submitted their exam.", "أتم مرشح تقديم الاختبار.",
                relatedAttemptId: attemptId,
                actorUserId: candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get remaining time for an attempt
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpGet("{attemptId}/timer")]
    public async Task<IActionResult> GetAttemptTimer(int attemptId)
  {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
}

        var result = await _attemptService.GetAttemptTimerAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Save an answer for a question
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpPost("{attemptId}/answers")]
    public async Task<IActionResult> SaveAnswer(int attemptId, [FromBody] SaveAnswerDto dto)
    {
      var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
   return Unauthorized();
        }

        var result = await _attemptService.SaveAnswerAsync(attemptId, dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk save multiple answers
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpPost("{attemptId}/answers/bulk")]
    public async Task<IActionResult> BulkSaveAnswers(int attemptId, [FromBody] BulkSaveAnswersDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
      {
            return Unauthorized();
        }

        var result = await _attemptService.BulkSaveAnswersAsync(attemptId, dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all answers for an attempt
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpGet("{attemptId}/answers")]
    public async Task<IActionResult> GetAttemptAnswers(int attemptId)
 {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
  return Unauthorized();
        }

   var result = await _attemptService.GetAttemptAnswersAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Log an event during the attempt (tab switch, navigation, etc.)
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpPost("{attemptId}/events")]
    public async Task<IActionResult> LogEvent(int attemptId, [FromBody] LogAttemptEventDto dto)
    {
    var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
   return Unauthorized();
        }

        var result = await _attemptService.LogEventAsync(attemptId, dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get candidate's attempts for a specific exam
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpGet("exam/{examId}/my-attempts")]
    public async Task<IActionResult> GetMyExamAttempts(int examId)
    {
     var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
      }

        var result = await _attemptService.GetCandidateExamAttemptsAsync(examId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all attempts for the current candidate
    /// </summary>
    [Authorize(Roles = "SuperAdmin,Candidate")]
    [HttpGet("my-attempts")]
    public async Task<IActionResult> GetMyAttempts([FromQuery] AttemptSearchDto searchDto)
    {
        var candidateId = _currentUserService.UserId;
  if (string.IsNullOrEmpty(candidateId))
        {
        return Unauthorized();
        }

        var result = await _attemptService.GetCandidateAttemptsAsync(candidateId, searchDto);
return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Admin Endpoints

    /// <summary>
    /// Get all attempts with pagination and filtering (Admin)
    /// </summary>
    [HttpGet]
 [Authorize(Roles = "SuperAdmin,Admin,Instructor")]
    public async Task<IActionResult> GetAttempts([FromQuery] AttemptSearchDto searchDto)
    {
 var result = await _attemptService.GetAttemptsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get attempt by ID (Admin)
    /// </summary>
    [HttpGet("{attemptId}")]
 [Authorize(Roles = "SuperAdmin,Admin,Instructor")]
    public async Task<IActionResult> GetAttemptById(int attemptId)
    {
   var result = await _attemptService.GetAttemptByIdAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get attempt details with events and answer details (Admin)
    /// </summary>
    [HttpGet("{attemptId}/details")]
    [Authorize(Roles = "SuperAdmin,Admin,Instructor")]
    public async Task<IActionResult> GetAttemptDetails(int attemptId)
    {
        var result = await _attemptService.GetAttemptDetailsAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all events for an attempt (Admin)
    /// </summary>
    [HttpGet("{attemptId}/events")]
    [Authorize(Roles = "SuperAdmin,Admin,Instructor")]
  public async Task<IActionResult> GetAttemptEvents(int attemptId)
    {
var result = await _attemptService.GetAttemptEventsAsync(attemptId);
  return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel an attempt (Admin only)
    /// </summary>
    [HttpPost("cancel")]
    [Authorize(Roles = "SuperAdmin,Admin")]
  public async Task<IActionResult> CancelAttempt([FromBody] CancelAttemptDto dto)
    {
        var adminUserId = _currentUserService.UserId ?? "system";
  var result = await _attemptService.CancelAttemptAsync(dto, adminUserId);
 return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Force submit an attempt (Admin only)
    /// </summary>
    [HttpPost("{attemptId}/force-submit")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ForceSubmitAttempt(int attemptId)
{
        var adminUserId = _currentUserService.UserId ?? "system";
  var result = await _attemptService.ForceSubmitAttemptAsync(attemptId, adminUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
