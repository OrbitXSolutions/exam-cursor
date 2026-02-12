using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.CandidateExamDetails;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.CandidateExamDetails;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.CandidateExamDetails;

[ApiController]
[Route("api/candidate-exam-details")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor}")]
public class CandidateExamDetailsController : ControllerBase
{
    private readonly ICandidateExamDetailsService _service;

    public CandidateExamDetailsController(ICandidateExamDetailsService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get full enriched exam details for a candidate.
    /// Returns candidate info, exam info, attempt summary, proctor data, event logs — all in ONE call.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<CandidateExamDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CandidateExamDetailsDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetExamDetails([FromQuery] CandidateExamDetailsQueryDto query)
    {
        if (string.IsNullOrWhiteSpace(query.CandidateId) || query.ExamId <= 0)
            return BadRequest(ApiResponse<CandidateExamDetailsDto>.FailureResponse(
                "CandidateId and ExamId are required."));

        var result = await _service.GetExamDetailsAsync(query);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get list of exams that a candidate has attempts for (for dropdown/selection).
    /// </summary>
    [HttpGet("candidate-exams")]
    [ProducesResponseType(typeof(ApiResponse<List<CandidateExamBriefDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCandidateExams([FromQuery] string candidateId)
    {
        if (string.IsNullOrWhiteSpace(candidateId))
            return BadRequest(ApiResponse<List<CandidateExamBriefDto>>.FailureResponse(
                "CandidateId is required."));

        var result = await _service.GetCandidateExamsAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
