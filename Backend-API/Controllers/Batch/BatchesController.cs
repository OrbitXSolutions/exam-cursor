using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Batch;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Batch;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Batch;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
public class BatchesController : ControllerBase
{
    private readonly IBatchService _service;
    private readonly ICurrentUserService _currentUser;

    public BatchesController(IBatchService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>List batches (paginated, searchable, filterable)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<BatchListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBatches([FromQuery] BatchFilterDto filter)
    {
        var result = await _service.GetBatchesAsync(filter);
        return Ok(result);
    }

    /// <summary>Get single batch by ID (includes candidate list)</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BatchDetailDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBatch(int id)
    {
        var result = await _service.GetBatchByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new batch</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<BatchListDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBatch([FromBody] CreateBatchDto dto)
    {
        var result = await _service.CreateBatchAsync(dto, _currentUser.UserId!);
        return result.Success ? StatusCode(201, result) : BadRequest(result);
    }

    /// <summary>Update an existing batch</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BatchListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateBatch(int id, [FromBody] UpdateBatchDto dto)
    {
        var result = await _service.UpdateBatchAsync(id, dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Delete a batch (soft delete)</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteBatch(int id)
    {
        var result = await _service.DeleteBatchAsync(id, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Toggle batch active / inactive</summary>
    [HttpPost("{id:int}/toggle-status")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var result = await _service.ToggleStatusAsync(id, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Add candidates to a batch</summary>
    [HttpPost("{id:int}/candidates")]
    [ProducesResponseType(typeof(ApiResponse<BatchCandidateChangeResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddCandidates(int id, [FromBody] BatchCandidateIdsDto dto)
    {
        var result = await _service.AddCandidatesAsync(id, dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Remove candidates from a batch</summary>
    [HttpDelete("{id:int}/candidates")]
    [ProducesResponseType(typeof(ApiResponse<BatchCandidateChangeResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> RemoveCandidates(int id, [FromBody] BatchCandidateIdsDto dto)
    {
        var result = await _service.RemoveCandidatesAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Export batch candidates to Excel</summary>
    [HttpGet("{id:int}/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportBatchCandidates(int id)
    {
        var bytes = await _service.ExportBatchCandidatesAsync(id);
        var fileName = $"batch_{id}_candidates_{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
