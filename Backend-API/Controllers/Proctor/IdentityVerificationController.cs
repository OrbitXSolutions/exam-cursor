using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Common;
using Smart_Core.Infrastructure.Storage;
using Smart_Core.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/proctor/authentication")]
[Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Proctor},{AppRoles.Candidate}")]
public class IdentityVerificationController : ControllerBase
{
    private readonly IIdentityVerificationService _service;
    private readonly ICurrentUserService _currentUserService;
    private readonly StoragePaths _storagePaths;
    private readonly ApplicationDbContext _context;

    public IdentityVerificationController(
        IIdentityVerificationService service,
        ICurrentUserService currentUserService,
        StoragePaths storagePaths,
        ApplicationDbContext context)
    {
        _service = service;
        _currentUserService = currentUserService;
        _storagePaths = storagePaths;
        _context = context;
    }

    /// <summary>
    /// Get identity verifications with filtering and pagination.
    /// </summary>
    [HttpGet("verifications")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> GetVerifications([FromQuery] IdentityVerificationSearchDto searchDto)
    {
        var result = await _service.GetVerificationsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get full detail of a single identity verification.
    /// </summary>
    [HttpGet("verifications/{id}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> GetVerificationDetail(int id)
    {
        var result = await _service.GetVerificationDetailAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("verifications/{id:int}/images/{kind}")]
    public async Task<IActionResult> GetImage(int id, string kind)
    {
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        if (kind is not ("selfie" or "document"))
            return NotFound();

        // Reuse the same resource boundary as detail, list, and review operations.
        var verification = await _service.GetVerificationDetailAsync(id);
        if (!verification.Success)
            return NotFound();

        var stored = await _context.IdentityVerifications.AsNoTracking()
            .Where(v => v.Id == id && !v.IsDeleted)
            .Select(v => new { v.CandidateId, Path = kind == "selfie" ? v.SelfiePath : v.IdDocumentPath })
            .FirstOrDefaultAsync(HttpContext.RequestAborted);
        if (stored == null || string.IsNullOrWhiteSpace(stored.Path))
            return NotFound();

        try
        {
            var path = ResolveIdentityImage(stored.CandidateId, stored.Path);
            if (path == null || !System.IO.File.Exists(path))
                return NotFound();

            var contentType = Path.GetExtension(path).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".webp" => "image/webp",
                _ => null
            };
            if (contentType == null)
                return NotFound();

            var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read);
            try
            {
                var file = new FormFile(stream, 0, stream.Length, "image", Path.GetFileName(path))
                {
                    Headers = new HeaderDictionary(),
                    ContentType = contentType
                };
                if (await ImageUploadValidator.GetSafeExtensionAsync(file, allowWebP: true,
                        cancellationToken: HttpContext.RequestAborted) == null)
                {
                    await stream.DisposeAsync();
                    return NotFound();
                }
                stream.Position = 0;
                return File(stream, contentType);
            }
            catch
            {
                await stream.DisposeAsync();
                throw;
            }
        }
        catch (Exception ex) when (ex is ArgumentException or IOException or UnauthorizedAccessException)
        {
            return NotFound();
        }
    }

    private string? ResolveIdentityImage(string candidateId, string storedPath)
    {
        var relative = storedPath.Replace('\\', '/');
        // Older records can store a public URL, a root-relative URL, or only the filename.
        // URLs are parsed locally, never fetched; only the known identity path is accepted.
        if (relative.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            relative.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            if (!Uri.TryCreate(relative, UriKind.Absolute, out var url) ||
                !string.IsNullOrEmpty(url.Query) || !string.IsNullOrEmpty(url.Fragment))
                return null;
            relative = Uri.UnescapeDataString(url.AbsolutePath);
        }
        relative = relative.TrimStart('/');
        if (relative.StartsWith("candidateIDs/", StringComparison.OrdinalIgnoreCase))
            relative = relative["candidateIDs/".Length..];
        else if (!relative.Contains('/'))
            relative = $"{candidateId}/{relative}";

        if (!relative.StartsWith(candidateId + "/", StringComparison.Ordinal))
            return null;
        var path = StoragePaths.ResolveRelativePath(_storagePaths.IdentityPath, relative);
        var candidateRoot = StoragePaths.ResolveRelativePath(_storagePaths.IdentityPath, candidateId);
        _ = StoragePaths.ResolveRelativePath(candidateRoot, relative[(candidateId.Length + 1)..]);

        // Lexical confinement must not be bypassed by a symlink in a shared storage volume.
        for (FileSystemInfo? entry = new FileInfo(path); entry != null; entry =
             entry is FileInfo file ? file.Directory : ((DirectoryInfo)entry).Parent)
        {
            if ((entry.Attributes & FileAttributes.ReparsePoint) != 0)
                return null;
            if (entry.FullName == _storagePaths.IdentityPath)
                break;
        }
        return path;
    }

    /// <summary>
    /// Apply a single action (Approve / Reject / Flag) to one verification.
    /// </summary>
    [HttpPost("verifications/{id}/action")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Proctor}")]
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
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Proctor}")]
    public async Task<IActionResult> BulkAction([FromBody] IdentityVerificationBulkActionDto dto)
    {
        var userId = _currentUserService.UserId ?? "system";
        var result = await _service.ApplyBulkActionAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // â”€â”€ Candidate-Facing Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// <summary>
    /// Submit identity verification (selfie + Emirates ID photo + info).
    /// Candidate-only. Files saved under the configured identity storage directory.
    /// </summary>
    [HttpPost("submit")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Candidate}")]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20MB
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> SubmitVerification(
        IFormFile selfiePhoto,
        IFormFile idPhoto,
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

        var selfieExt = await ImageUploadValidator.GetSafeExtensionAsync(selfiePhoto, allowWebP: true,
            cancellationToken: HttpContext.RequestAborted);
        if (selfieExt == null)
            return BadRequest(ApiResponse<string>.FailureResponse("Selfie must be a JPEG, PNG, or WebP image with a matching file extension and content type."));
        var idExt = await ImageUploadValidator.GetSafeExtensionAsync(idPhoto, allowWebP: true,
            cancellationToken: HttpContext.RequestAborted);
        if (idExt == null)
            return BadRequest(ApiResponse<string>.FailureResponse("ID photo must be a JPEG, PNG, or WebP image with a matching file extension and content type."));

        // Create candidate folder
        var candidateDir = StoragePaths.ResolveRelativePath(_storagePaths.IdentityPath, candidateId);
        Directory.CreateDirectory(candidateDir);

        var timestamp = $"{UaeTimeHelper.NowUae:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}";

        var selfieFileName = $"selfie_{timestamp}{selfieExt}";
        var idFileName = $"id_{timestamp}{idExt}";

        var selfiePath = Path.Combine(candidateDir, selfieFileName);
        var idPath = Path.Combine(candidateDir, idFileName);

        // Save files
        await using (var stream = new FileStream(selfiePath, FileMode.CreateNew))
            await selfiePhoto.CopyToAsync(stream, HttpContext.RequestAborted);

        await using (var stream = new FileStream(idPath, FileMode.CreateNew))
            await idPhoto.CopyToAsync(stream, HttpContext.RequestAborted);

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
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Candidate}")]
    public async Task<IActionResult> GetMyStatus()
    {
        var candidateId = _currentUserService.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized(ApiResponse<string>.FailureResponse("Not authenticated."));

        var result = await _service.GetCandidateStatusAsync(candidateId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
