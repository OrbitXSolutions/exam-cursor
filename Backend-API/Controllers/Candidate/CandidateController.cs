using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Candidate;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Candidate;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Candidate)]
public class CandidateController : ControllerBase
{
    private readonly ICandidateService _candidateService;
    private readonly ICurrentUserService _currentUserService;

    public CandidateController(
        ICandidateService candidateService,
        ICurrentUserService currentUserService)
    {
        _candidateService = candidateService;
        _currentUserService = currentUserService;
    }

    #region Exam Discovery & Preview

    /// <summary>
    /// Get all available exams (published + active)
    /// If user is in Candidate role and has no department => list all exams
    /// If user is in Candidate role and has department => list all exams (candidates can take any exam)
    /// If user is NOT in Candidate role => filter by user's department
    /// </summary>
    [HttpGet("exams")]
    public async Task<IActionResult> GetAvailableExams()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetAvailableExamsAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get exam preview with instructions, access policy, and eligibility check
    /// Returns: { canStartNow, reasons[], attemptInfo, instructions, securitySettings }
    /// </summary>
    [HttpGet("exams/{examId}/preview")]
    public async Task<IActionResult> GetExamPreview(int examId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetExamPreviewAsync(examId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Start & Resume Exam

    /// <summary>
    /// Start a new attempt or resume an existing active attempt
    /// Request: { accessCode?: string }
    /// Response: AttemptSessionDto with attemptId, questions (NO IsCorrect), timer, etc.
    /// </summary>
    [HttpPost("exams/{examId}/start")]
    public async Task<IActionResult> StartExam(int examId, [FromBody] StartExamRequest request)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.StartExamAsync(examId, request, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get attempt session (single source of truth for resume)
    /// Returns full session state including questions and current answers (NO IsCorrect)
    /// </summary>
    [HttpGet("attempts/{attemptId}/session")]
    public async Task<IActionResult> GetAttemptSession(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetAttemptSessionAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Save Answers & Submit

    /// <summary>
    /// Bulk save answers (idempotent) - updates existing or creates new
    /// Request: { answers: [{ questionId, selectedOptionIds?, textAnswer? }] }
    /// </summary>
    [HttpPut("attempts/{attemptId}/answers")]
    public async Task<IActionResult> SaveAnswers(int attemptId, [FromBody] BulkSaveAnswersRequest request)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.SaveAnswersAsync(attemptId, request, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Submit attempt (final submission, cannot be undone)
    /// Returns: Summary based on exam settings (may hide results if showResults=false)
    /// </summary>
    [HttpPost("attempts/{attemptId}/submit")]
    public async Task<IActionResult> SubmitAttempt(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.SubmitAttemptAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Results & Review

    /// <summary>
    /// Get my result for a specific attempt
    /// Respects exam settings:
    /// - showResults=false => summary only (no scores)
    /// - showResults=true => includes scores and pass/fail status
    /// Only returns published results
    /// </summary>
    [HttpGet("results/my-result/{attemptId}")]
    public async Task<IActionResult> GetMyResult(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetMyResultAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get detailed result review with questions and answers
    /// Respects exam settings:
    /// - allowReview=false => not allowed (403)
    /// - allowReview=true + showCorrectAnswers=false => can see own answers but no correct indicators
    /// - allowReview=true + showCorrectAnswers=true => full review with correct answers shown
    /// </summary>
    [HttpGet("results/my-result/{attemptId}/review")]
    public async Task<IActionResult> GetMyResultReview(int attemptId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetMyResultReviewAsync(attemptId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get comprehensive dashboard with all statistics and information
    /// Returns: Welcome info, statistics cards, exams by status, quick actions, upcoming exams, recent activity
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetDashboardAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Exam Journey

    /// <summary>
    /// Get exam journey - single endpoint for candidate landing page
    /// Returns: Primary action + exams grouped by journey stage
    /// </summary>
    [HttpGet("journey")]
    public async Task<IActionResult> GetExamJourney()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
        {
            return Unauthorized();
        }

        var result = await _candidateService.GetExamJourneyAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
