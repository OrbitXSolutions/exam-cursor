using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.ExamResult;

namespace Smart_Core.Controllers.ExamResult;

[ApiController]
[Route("api/[controller]")]
public class CertificateController : ControllerBase
{
    private readonly ICertificateService _certificateService;
    private readonly ICurrentUserService _currentUserService;

    public CertificateController(ICertificateService certificateService, ICurrentUserService currentUserService)
    {
        _certificateService = certificateService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Verify certificate by code (public, no auth required)
    /// </summary>
    [HttpGet("verify/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> Verify(string code)
    {
        var result = await _certificateService.VerifyAsync(code);
        return Ok(result);
    }

    /// <summary>
    /// Get my certificates (candidate)
    /// </summary>
    [HttpGet("my-certificates")]
    [Authorize]
    public async Task<IActionResult> GetMyCertificates()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        var result = await _certificateService.GetMyCertificatesAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get certificate by result ID (candidate owning the result)
    /// </summary>
    [HttpGet("by-result/{resultId}")]
    [Authorize]
    public async Task<IActionResult> GetByResult(int resultId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        var result = await _certificateService.GetByResultIdAsync(resultId, candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create certificate for a passed result (Admin/Instructor)
    /// </summary>
    [HttpPost("create/{resultId}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<IActionResult> Create(int resultId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _certificateService.CreateForResultAsync(resultId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Revoke certificate (Admin only)
    /// </summary>
    [HttpPost("{certificateId}/revoke")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Revoke(int certificateId, [FromBody] RevokeCertificateRequest request)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _certificateService.RevokeAsync(certificateId, request.Reason ?? "", userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Regenerate certificate (new code, Admin only)
    /// </summary>
    [HttpPost("{certificateId}/regenerate")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Regenerate(int certificateId)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _certificateService.RegenerateAsync(certificateId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Download certificate (HTML view - candidate can print to PDF)
    /// </summary>
    [HttpGet("{certificateId}/download")]
    [Authorize]
    public async Task<IActionResult> Download(int certificateId)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        var result = await _certificateService.GetByIdAsync(certificateId, candidateId);
        if (!result.Success || result.Data == null)
            return NotFound();

        var c = result.Data;
        var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><title>Certificate - {c.CertificateCode}</title>
<style>body{{font-family:sans-serif;max-width:800px;margin:40px auto;padding:20px;border:2px solid #333;}} 
h1{{color:#1a73e8;}} .code{{font-family:monospace;font-size:1.2em;}}</style>
</head>
<body>
<h1>Certificate of Achievement</h1>
<p class='code'><strong>Certificate Code:</strong> {c.CertificateCode}</p>
<p><strong>Examination:</strong> {c.ExamTitleEn}</p>
<p><strong>Candidate:</strong> {c.CandidateNameEn ?? "N/A"}</p>
<p><strong>Score:</strong> {c.Score} / {c.MaxScore} (Pass: {c.PassScore})</p>
<p><strong>Date Issued:</strong> {c.IssuedAt:yyyy-MM-dd}</p>
<p><em>Verify at: /verify-certificate?code={c.CertificateCode}</em></p>
</body>
</html>";
        return Content(html, "text/html");
    }
}

public class RevokeCertificateRequest
{
    public string? Reason { get; set; }
}
