using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Attempt;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Attempt;

namespace Smart_Core.Controllers.Attempt;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttemptController : ControllerBase
{
    private readonly IAttemptService _attemptService;
    private readonly ICurrentUserService _currentUserService;

    public AttemptController(
        IAttemptService attemptService,
        ICurrentUserService currentUserService)
    {
        _attemptService = attemptService;
        _currentUserService = currentUserService;
    }

    #region Candidate Endpoints

    /// <summary>
    /// Start a new attempt or resume an existing active attempt for an exam
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartAttempt([FromBody] StartAttemptDto dto)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
         return Unauthorized();
        }

        var result = await _attemptService.StartAttemptAsync(dto, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get attempt session details (for resuming an attempt)
    /// </summary>
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
    [HttpPost("{attemptId}/submit")]
    public async Task<IActionResult> SubmitAttempt(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
  return Unauthorized();
        }

     var result = await _attemptService.SubmitAttemptAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get remaining time for an attempt
    /// </summary>
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
 [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetAttempts([FromQuery] AttemptSearchDto searchDto)
    {
 var result = await _attemptService.GetAttemptsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get attempt by ID (Admin)
    /// </summary>
    [HttpGet("{attemptId}")]
 [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetAttemptById(int attemptId)
    {
   var result = await _attemptService.GetAttemptByIdAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get attempt details with events and answer details (Admin)
    /// </summary>
    [HttpGet("{attemptId}/details")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetAttemptDetails(int attemptId)
    {
        var result = await _attemptService.GetAttemptDetailsAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all events for an attempt (Admin)
    /// </summary>
    [HttpGet("{attemptId}/events")]
    [Authorize(Roles = "Admin,Instructor")]
  public async Task<IActionResult> GetAttemptEvents(int attemptId)
    {
var result = await _attemptService.GetAttemptEventsAsync(attemptId);
  return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel an attempt (Admin only)
    /// </summary>
    [HttpPost("cancel")]
    [Authorize(Roles = "Admin")]
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
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ForceSubmitAttempt(int attemptId)
{
        var adminUserId = _currentUserService.UserId ?? "system";
  var result = await _attemptService.ForceSubmitAttemptAsync(attemptId, adminUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
