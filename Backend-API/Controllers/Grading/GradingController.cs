using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Grading;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Grading;

namespace Smart_Core.Controllers.Grading;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GradingController : ControllerBase
{
    private readonly IGradingService _gradingService;
    private readonly ICurrentUserService _currentUserService;

    public GradingController(
    IGradingService gradingService,
        ICurrentUserService currentUserService)
  {
    _gradingService = gradingService;
_currentUserService = currentUserService;
    }

    #region Grading Lifecycle

    /// <summary>
    /// Initiate grading for a submitted attempt (triggers auto-grading)
    /// </summary>
    [HttpPost("initiate")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> InitiateGrading([FromBody] InitiateGradingDto dto)
    {
     var graderId = _currentUserService.UserId ?? "system";
        var result = await _gradingService.InitiateGradingAsync(dto, graderId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get grading session by ID
    /// </summary>
    [HttpGet("{gradingSessionId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetGradingSession(int gradingSessionId)
    {
      var result = await _gradingService.GetGradingSessionAsync(gradingSessionId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get grading session by attempt ID
    /// </summary>
    [HttpGet("attempt/{attemptId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetGradingSessionByAttempt(int attemptId)
  {
  var result = await _gradingService.GetGradingSessionByAttemptAsync(attemptId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Complete grading session (finalize scores)
    /// </summary>
    [HttpPost("complete")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CompleteGrading([FromBody] CompleteGradingDto dto)
    {
   var graderId = _currentUserService.UserId ?? "system";
        var result = await _gradingService.CompleteGradingAsync(dto, graderId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Manual Grading

    /// <summary>
    /// Submit manual grade for a single question
/// </summary>
    [HttpPost("manual-grade")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> SubmitManualGrade([FromBody] ManualGradeDto dto)
    {
        var graderId = _currentUserService.UserId ?? "system";
  var result = await _gradingService.SubmitManualGradeAsync(dto, graderId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk submit manual grades
    /// </summary>
    [HttpPost("manual-grade/bulk")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> BulkSubmitManualGrades([FromBody] BulkManualGradeDto dto)
    {
        var graderId = _currentUserService.UserId ?? "system";
        var result = await _gradingService.BulkSubmitManualGradesAsync(dto, graderId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get questions requiring manual grading for a session
    /// </summary>
    [HttpGet("{gradingSessionId}/manual-queue")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetManualGradingQueue(int gradingSessionId)
    {
     var result = await _gradingService.GetManualGradingQueueAsync(gradingSessionId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Re-grading

    /// <summary>
    /// Re-grade a previously graded answer
    /// </summary>
    [HttpPost("regrade")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> RegradeAnswer([FromBody] RegradeDto dto)
    {
        var graderId = _currentUserService.UserId ?? "system";
        var result = await _gradingService.RegradeAnswerAsync(dto, graderId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Queries

    /// <summary>
    /// Get all grading sessions with pagination and filtering
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetGradingSessions([FromQuery] GradingSearchDto searchDto)
    {
        var result = await _gradingService.GetGradingSessionsAsync(searchDto);
     return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get grading sessions requiring manual grading
    /// </summary>
    [HttpGet("manual-required")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetManualGradingRequired([FromQuery] GradingSearchDto searchDto)
    {
        var result = await _gradingService.GetManualGradingRequiredAsync(searchDto);
   return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get grading statistics for an exam
    /// </summary>
  [HttpGet("stats/exam/{examId}")]
 [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExamGradingStats(int examId)
    {
        var result = await _gradingService.GetExamGradingStatsAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

 /// <summary>
    /// Get question-level grading statistics for an exam
    /// </summary>
    [HttpGet("stats/exam/{examId}/questions")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetQuestionGradingStats(int examId)
    {
        var result = await _gradingService.GetQuestionGradingStatsAsync(examId);
    return result.Success ? Ok(result) : BadRequest(result);
}

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get grading result for the current candidate
    /// </summary>
 [HttpGet("my-result/{attemptId}")]
    public async Task<IActionResult> GetMyResult(int attemptId)
    {
      var candidateId = _currentUserService.UserId;
   if (string.IsNullOrEmpty(candidateId))
        {
          return Unauthorized();
 }

        var result = await _gradingService.GetCandidateResultAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Check if grading is complete for an attempt
    /// </summary>
    [HttpGet("is-complete/{attemptId}")]
    public async Task<IActionResult> IsGradingComplete(int attemptId)
  {
  var result = await _gradingService.IsGradingCompleteAsync(attemptId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
