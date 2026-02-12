using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.CandidateAdmin;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces.CandidateAdmin;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Candidate;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
public class CandidatesController : ControllerBase
{
    private readonly ICandidateAdminService _service;
    private readonly ICurrentUserService _currentUser;

    public CandidatesController(ICandidateAdminService service, ICurrentUserService currentUser)
    {
        _service = service;
        _currentUser = currentUser;
    }

    /// <summary>List candidates (paginated, searchable, filterable)</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<CandidateListDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCandidates([FromQuery] CandidateFilterDto filter)
    {
        var result = await _service.GetCandidatesAsync(filter);
        return Ok(result);
    }

    /// <summary>Get single candidate by ID</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CandidateListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCandidate(string id)
    {
        var result = await _service.GetCandidateByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new candidate</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CandidateListDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateCandidate([FromBody] CreateCandidateDto dto)
    {
        var result = await _service.CreateCandidateAsync(dto, _currentUser.UserId!);
        return result.Success ? StatusCode(201, result) : BadRequest(result);
    }

    /// <summary>Update an existing candidate</summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<CandidateListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateCandidate(string id, [FromBody] UpdateCandidateDto dto)
    {
        var result = await _service.UpdateCandidateAsync(id, dto, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Block a candidate</summary>
    [HttpPost("{id}/block")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BlockCandidate(string id)
    {
        var result = await _service.BlockCandidateAsync(id, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Unblock a candidate</summary>
    [HttpPost("{id}/unblock")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UnblockCandidate(string id)
    {
        var result = await _service.UnblockCandidateAsync(id, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Delete a candidate (safe — blocks if has attempts)</summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCandidate(string id)
    {
        var result = await _service.DeleteCandidateAsync(id, _currentUser.UserId!);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Export candidates to Excel</summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportCandidates([FromQuery] CandidateFilterDto filter)
    {
        var bytes = await _service.ExportCandidatesAsync(filter);
        var fileName = $"candidates_{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    /// <summary>Download import template</summary>
    [HttpGet("import-template")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetImportTemplate()
    {
        var bytes = await _service.GetImportTemplateAsync();
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "candidates_import_template.xlsx");
    }

    /// <summary>Import candidates from Excel</summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(ApiResponse<CandidateImportResultDto>), StatusCodes.Status200OK)]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> ImportCandidates(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<CandidateImportResultDto>.FailureResponse("No file uploaded."));

        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext != ".xlsx" && ext != ".xls")
            return BadRequest(ApiResponse<CandidateImportResultDto>.FailureResponse("Only .xlsx or .xls files are accepted."));

        using var stream = file.OpenReadStream();
        var result = await _service.ImportCandidatesAsync(stream, _currentUser.UserId!);
        return Ok(result);
    }
}
