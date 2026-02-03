using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.ExamResult;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamResult;

namespace Smart_Core.Controllers.ExamResult;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExamResultController : ControllerBase
{
    private readonly IExamResultService _examResultService;
    private readonly ICurrentUserService _currentUserService;

    public ExamResultController(
    IExamResultService examResultService,
 ICurrentUserService currentUserService)
    {
        _examResultService = examResultService;
        _currentUserService = currentUserService;
 }

    #region Result Management

    /// <summary>
    /// Finalize result from completed grading session
    /// </summary>
    [HttpPost("finalize/{gradingSessionId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> FinalizeResult(int gradingSessionId)
    {
     var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.FinalizeResultAsync(gradingSessionId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get result by ID
    /// </summary>
    [HttpGet("{resultId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetResult(int resultId)
    {
 var result = await _examResultService.GetResultByIdAsync(resultId);
      return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get result by attempt ID
    /// </summary>
    [HttpGet("attempt/{attemptId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetResultByAttempt(int attemptId)
    {
    var result = await _examResultService.GetResultByAttemptAsync(attemptId);
     return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all results with pagination and filtering
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetResults([FromQuery] ResultSearchDto searchDto)
    {
      var result = await _examResultService.GetResultsAsync(searchDto);
      return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get results for a specific exam
    /// </summary>
    [HttpGet("exam/{examId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExamResults(int examId, [FromQuery] ResultSearchDto searchDto)
    {
        var result = await _examResultService.GetExamResultsAsync(examId, searchDto);
     return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update result after re-grading
    /// </summary>
    [HttpPut("update-from-regrade/{gradingSessionId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> UpdateResultFromRegrading(int gradingSessionId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.UpdateResultFromRegradingAsync(gradingSessionId, userId);
 return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Publishing

  /// <summary>
    /// Publish a single result to candidate
    /// </summary>
    [HttpPost("{resultId}/publish")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> PublishResult(int resultId)
{
      var userId = _currentUserService.UserId ?? "system";
   var result = await _examResultService.PublishResultAsync(resultId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Unpublish a result (Admin only)
    /// </summary>
    [HttpPost("{resultId}/unpublish")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UnpublishResult(int resultId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.UnpublishResultAsync(resultId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk publish results
 /// </summary>
    [HttpPost("publish/bulk")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> BulkPublishResults([FromBody] BulkPublishResultsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
      var result = await _examResultService.BulkPublishResultsAsync(dto, userId);
    return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Publish all results for an exam
    /// </summary>
    [HttpPost("publish/exam")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> PublishExamResults([FromBody] PublishExamResultsDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
    var result = await _examResultService.PublishExamResultsAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Candidate Access

    /// <summary>
    /// Get candidate's result for an attempt (only if published)
    /// </summary>
    [HttpGet("my-result/{attemptId}")]
    public async Task<IActionResult> GetMyResult(int attemptId)
  {
       var candidateId = _currentUserService.UserId;
 if (string.IsNullOrEmpty(candidateId))
  {
      return Unauthorized();
}

        var result = await _examResultService.GetCandidateResultAsync(attemptId, candidateId);
    return result.Success ? Ok(result) : BadRequest(result);
}

    /// <summary>
    /// Get all published results for the current candidate
    /// </summary>
    [HttpGet("my-results")]
    public async Task<IActionResult> GetMyResults()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
     {
         return Unauthorized();
   }

      var result = await _examResultService.GetCandidateAllResultsAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
  }

    /// <summary>
    /// Get candidate's exam summary
    /// </summary>
    [HttpGet("my-summary/exam/{examId}")]
    public async Task<IActionResult> GetMyExamSummary(int examId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
 {
         return Unauthorized();
        }

        var result = await _examResultService.GetCandidateExamSummaryAsync(examId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Reports

    /// <summary>
    /// Generate/refresh exam report
    /// </summary>
    [HttpPost("report/generate")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GenerateExamReport([FromBody] GenerateExamReportDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.GenerateExamReportAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get latest exam report
    /// </summary>
    [HttpGet("report/exam/{examId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExamReport(int examId)
    {
  var result = await _examResultService.GetExamReportAsync(examId);
    return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Generate/refresh question performance reports
    /// </summary>
    [HttpPost("report/question-performance/generate")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GenerateQuestionPerformance([FromBody] GenerateQuestionPerformanceDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
     var result = await _examResultService.GenerateQuestionPerformanceAsync(dto, userId);
   return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get question performance reports for an exam
    /// </summary>
 [HttpGet("report/question-performance/exam/{examId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetQuestionPerformance(int examId)
    {
var result = await _examResultService.GetQuestionPerformanceAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get result dashboard for an exam
    /// </summary>
[HttpGet("dashboard/exam/{examId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetResultDashboard(int examId)
    {
      var result = await _examResultService.GetResultDashboardAsync(examId);
   return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Candidate Summaries

    /// <summary>
    /// Refresh candidate exam summary
    /// </summary>
    [HttpPost("summary/refresh")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> RefreshCandidateSummary([FromQuery] int examId, [FromQuery] string candidateId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.RefreshCandidateExamSummaryAsync(examId, candidateId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all candidate summaries (optionally filter by exam). Omit examId to load all candidates across exams.
    /// </summary>
    [HttpGet("summary/candidates")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetCandidateSummaries(
        [FromQuery] int? examId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 100)
    {
        var result = await _examResultService.GetExamCandidateSummariesAsync(examId, pageNumber, pageSize);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all candidate summaries for an exam (path variant for backward compatibility)
    /// </summary>
    [HttpGet("summary/exam/{examId}/candidates")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExamCandidateSummaries(
      int examId,
  [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 100)
    {
        var result = await _examResultService.GetExamCandidateSummariesAsync(examId, pageNumber, pageSize);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Export

    /// <summary>
    /// Request a result export job
    /// </summary>
    [HttpPost("export/request")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> RequestExport([FromBody] RequestExportDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.RequestExportAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get export job by ID
    /// </summary>
    [HttpGet("export/{jobId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExportJob(int jobId)
  {
        var result = await _examResultService.GetExportJobAsync(jobId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get export jobs with filtering
    /// </summary>
    [HttpGet("export")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> GetExportJobs([FromQuery] ExportJobSearchDto searchDto)
    {
        var result = await _examResultService.GetExportJobsAsync(searchDto);
    return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Cancel a pending export job
    /// </summary>
    [HttpPost("export/{jobId}/cancel")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> CancelExportJob(int jobId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _examResultService.CancelExportJobAsync(jobId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Download exported file (placeholder - implement actual file serving)
    /// </summary>
    [HttpGet("export/{jobId}/download")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> DownloadExport(int jobId)
    {
    var jobResult = await _examResultService.GetExportJobAsync(jobId);
        if (!jobResult.Success || jobResult.Data == null)
   {
            return NotFound("Export job not found");
    }

        if (jobResult.Data.Status != Domain.Enums.ExportStatus.Completed)
        {
        return BadRequest("Export is not yet completed");
   }

        if (string.IsNullOrEmpty(jobResult.Data.FilePath))
        {
         return NotFound("Export file not found");
        }

        // TODO: Implement actual file serving from storage
        // For now, return placeholder
        return Ok(new { message = "Download endpoint - implement file serving", filePath = jobResult.Data.FilePath });
    }

    #endregion
}
