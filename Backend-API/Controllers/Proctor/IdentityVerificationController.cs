using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/proctor/authentication")]
[Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor},{AppRoles.Candidate}")]
public class IdentityVerificationController : ControllerBase
{
    private readonly IIdentityVerificationService _service;
    private readonly ICurrentUserService _currentUserService;
    private readonly IWebHostEnvironment _env;

    public IdentityVerificationController(
        IIdentityVerificationService service,
        ICurrentUserService currentUserService,
        IWebHostEnvironment env)
    {
        _service = service;
        _currentUserService = currentUserService;
        _env = env;
    }

    /// <summary>
    /// Get identity verifications with filtering and pagination.
    /// </summary>
    [HttpGet("verifications")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetVerifications([FromQuery] IdentityVerificationSearchDto searchDto)
    {
        var result = await _service.GetVerificationsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get full detail of a single identity verification.
    /// </summary>
    [HttpGet("verifications/{id}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetVerificationDetail(int id)
    {
        var result = await _service.GetVerificationDetailAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Apply a single action (Approve / Reject / Flag) to one verification.
    /// </summary>
    [HttpPost("verifications/{id}/action")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> ApplyAction(int id, [FromBody] IdentityVerificationActionDto dto)
    {
        dto.Id = id;
        var userId = _currentUserService.UserId ?? "system";
        var result = await _service.ApplyActionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Apply a bulk action to multiple verifications.
    /// Transaction-safe with audit logging.
    /// </summary>
    [HttpPost("bulk-action")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> BulkAction([FromBody] IdentityVerificationBulkActionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _service.ApplyBulkActionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Candidate-Facing Endpoints ────────────────────────────────────────

    /// <summary>
    /// Submit identity verification (selfie + Emirates ID photo + info).
    /// Candidate-only. Files saved to wwwroot/candidateIDs/{candidateId}/
    /// </summary>
    [HttpPost("submit")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Candidate}")]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20MB
    public async Task<IActionResult> SubmitVerification(
        [FromForm] IFormFile selfiePhoto,
        [FromForm] IFormFile idPhoto,
        [FromForm] string? idDocumentType,
        [FromForm] string? idNumber)
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized(ApiResponse<string>.FailureResponse("Not authenticated."));

        // Validate files
        if (selfiePhoto == null || selfiePhoto.Length == 0)
            return BadRequest(ApiResponse<string>.FailureResponse("Selfie photo is required."));
        if (idPhoto == null || idPhoto.Length == 0)
            return BadRequest(ApiResponse<string>.FailureResponse("ID photo is required."));

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(selfiePhoto.ContentType))
            return BadRequest(ApiResponse<string>.FailureResponse("Selfie must be JPEG, PNG, or WebP."));
        if (!allowedTypes.Contains(idPhoto.ContentType))
            return BadRequest(ApiResponse<string>.FailureResponse("ID photo must be JPEG, PNG, or WebP."));

        // Create candidate folder
        var candidateDir = Path.Combine(_env.ContentRootPath, "wwwroot", "candidateIDs", candidateId);
        Directory.CreateDirectory(candidateDir);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var selfieExt = Path.GetExtension(selfiePhoto.FileName);
        var idExt = Path.GetExtension(idPhoto.FileName);

        var selfieFileName = $"selfie_{timestamp}{selfieExt}";
        var idFileName = $"id_{timestamp}{idExt}";

        var selfiePath = Path.Combine(candidateDir, selfieFileName);
        var idPath = Path.Combine(candidateDir, idFileName);

        // Save files
        await using (var stream = new FileStream(selfiePath, FileMode.Create))
            await selfiePhoto.CopyToAsync(stream);

        await using (var stream = new FileStream(idPath, FileMode.Create))
            await idPhoto.CopyToAsync(stream);

        // Relative paths for DB storage
        var selfieRelative = $"candidateIDs/{candidateId}/{selfieFileName}";
        var idRelative = $"candidateIDs/{candidateId}/{idFileName}";

        var deviceInfo = Request.Headers["User-Agent"].FirstOrDefault();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var result = await _service.SubmitVerificationAsync(
            candidateId, idDocumentType ?? "Emirates ID", idNumber,
            selfieRelative, idRelative, deviceInfo, ipAddress);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get current candidate's verification status.
    /// </summary>
    [HttpGet("status")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Candidate}")]
    public async Task<IActionResult> GetMyStatus()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized(ApiResponse<string>.FailureResponse("Not authenticated."));

        var result = await _service.GetCandidateStatusAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
