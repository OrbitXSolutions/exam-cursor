using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.Interfaces.Assessment;

namespace Smart_Core.Controllers.Assessment;

/// <summary>
/// Public endpoints for exam share links — NO authentication required
/// </summary>
[ApiController]
[Route("api/public/exam")]
public class PublicExamController : ControllerBase
{
    private readonly IExamShareService _examShareService;

    public PublicExamController(IExamShareService examShareService)
    {
        _examShareService = examShareService;
    }

    /// <summary>
    /// Get exam info by share token (public, no auth)
    /// </summary>
    [HttpGet("{shareToken}")]
    public async Task<IActionResult> GetExamByShareToken(string shareToken)
    {
        var result = await _examShareService.GetExamByShareTokenAsync(shareToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get candidates list for share link (public, no auth)
    /// </summary>
    [HttpGet("{shareToken}/candidates")]
    public async Task<IActionResult> GetCandidates(string shareToken, [FromQuery] string? search)
    {
        var result = await _examShareService.GetCandidatesByShareTokenAsync(shareToken, search);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Select candidate and get auth token (public, no auth)
    /// </summary>
    [HttpPost("{shareToken}/select-candidate")]
    public async Task<IActionResult> SelectCandidate(string shareToken, [FromBody] SelectCandidateDto dto)
    {
        var result = await _examShareService.SelectCandidateAsync(shareToken, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
