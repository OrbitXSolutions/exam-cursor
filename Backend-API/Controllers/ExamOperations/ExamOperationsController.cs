using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamOperations;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamOperations;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.ExamOperations;

[ApiController]
[Route("api/exam-operations")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor}")]
public class ExamOperationsController : ControllerBase
{
    private readonly IExamOperationsService _service;
    private readonly ICurrentUserService _currentUser;

    public ExamOperationsController(IExamOperationsService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>List candidates with attempt info for exam operations</summary>
    [HttpGet("candidates")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCandidates([FromQuery] ExamOperationsFilterDto filter)
    {
        var result = await _service.GetCandidatesAsync(filter);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Grant a new attempt override for a candidate</summary>
    [HttpPost("allow-new-attempt")]
    [ProducesResponseType(typeof(ApiResponse<AllowNewAttemptResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AllowNewAttempt([FromBody] AllowNewAttemptDto dto)
    {
        var result = await _service.AllowNewAttemptAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Add extra time to an active attempt</summary>
    [HttpPost("add-time")]
    [ProducesResponseType(typeof(ApiResponse<OperationAddTimeResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddTime([FromBody] OperationAddTimeDto dto)
    {
        var result = await _service.AddTimeAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Terminate (force-end) an active attempt</summary>
    [HttpPost("terminate")]
    [ProducesResponseType(typeof(ApiResponse<TerminateAttemptResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Terminate([FromBody] TerminateAttemptDto dto)
    {
        var result = await _service.TerminateAttemptAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Resume a paused attempt (exists in code, hidden in UI)</summary>
    [HttpPost("resume")]
    [ProducesResponseType(typeof(ApiResponse<ResumeAttemptOperationResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Resume([FromBody] ResumeAttemptOperationDto dto)
    {
        var result = await _service.ResumeAttemptAsync(dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Get admin operation audit logs for a candidate+exam</summary>
    [HttpGet("logs")]
    [ProducesResponseType(typeof(ApiResponse<List<AdminOperationLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogs([FromQuery] string candidateId, [FromQuery] int examId)
    {
        var result = await _service.GetOperationLogsAsync(candidateId, examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
