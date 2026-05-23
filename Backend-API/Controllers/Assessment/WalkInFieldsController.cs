using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Assessment;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Assessment;

/// <summary>
/// Manages dynamic registration fields for walk-in exams.
/// All endpoints require Admin or Instructor role.
/// </summary>
[ApiController]
[Route("api/Assessment/exams/{examId}/walkin-fields")]
[Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Instructor}")]
public class WalkInFieldsController : ControllerBase
{
    private readonly IWalkInFieldService _walkInFieldService;
    private readonly ICurrentUserService _currentUserService;

    public WalkInFieldsController(
        IWalkInFieldService walkInFieldService,
        ICurrentUserService currentUserService)
    {
        _walkInFieldService = walkInFieldService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Get all dynamic registration fields for a walk-in exam
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetFields(int examId)
    {
        var result = await _walkInFieldService.GetFieldsAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new dynamic registration field
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateField(int examId, [FromBody] SaveWalkInFieldDto dto)
    {
        var userId = _currentUserService.UserId;
        var result = await _walkInFieldService.SaveFieldAsync(examId, null, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Update an existing dynamic registration field
    /// </summary>
    [HttpPut("{fieldId}")]
    public async Task<IActionResult> UpdateField(int examId, int fieldId, [FromBody] SaveWalkInFieldDto dto)
    {
        var userId = _currentUserService.UserId;
        var result = await _walkInFieldService.SaveFieldAsync(examId, fieldId, dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Soft-delete a dynamic registration field
    /// </summary>
    [HttpDelete("{fieldId}")]
    public async Task<IActionResult> DeleteField(int examId, int fieldId)
    {
        var userId = _currentUserService.UserId;
        var result = await _walkInFieldService.DeleteFieldAsync(examId, fieldId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Bulk reorder dynamic registration fields
    /// </summary>
    [HttpPut("reorder")]
    public async Task<IActionResult> ReorderFields(int examId, [FromBody] List<ReorderWalkInFieldDto> orders)
    {
        var userId = _currentUserService.UserId;
        var result = await _walkInFieldService.ReorderFieldsAsync(examId, orders, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all candidate answers for admin reporting
    /// </summary>
    [HttpGet("/api/Assessment/exams/{examId}/walkin-answers")]
    public async Task<IActionResult> GetAnswers(int examId)
    {
        var result = await _walkInFieldService.GetAnswersByExamAsync(examId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
