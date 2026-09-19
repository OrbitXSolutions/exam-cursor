using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services.Authorization;

namespace Smart_Core.Controllers.Proctor;

[ApiController]
[Route("api/Proctor/evidence")]
[Authorize]
public class ProctorEvidenceFileController(
    ApplicationDbContext db,
    ResourceAuthorizationService authorization,
    IStorageProvider storage) : ControllerBase
{
    [HttpGet("{evidenceId:int}/download")]
    public async Task<IActionResult> DownloadSnapshot(int evidenceId)
    {
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        if (!await authorization.CanAccessEvidenceAsync(evidenceId))
            return NotFound();
        var evidence = await db.ProctorEvidence.AsNoTracking().FirstOrDefaultAsync(e =>
            e.Id == evidenceId && e.Type == EvidenceType.Image && e.IsUploaded && !e.IsExpired);
        if (evidence == null)
            return NotFound();
        var contentType = Path.GetExtension(evidence.FilePath).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => null
        };
        if (contentType == null)
            return NotFound();
        var stream = await storage.GetAsync(evidence.FilePath);
        return stream == null ? NotFound() : File(stream, contentType);
    }
}
