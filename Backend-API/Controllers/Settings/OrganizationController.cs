using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Controllers.Settings;

[ApiController]
[Route("api/[controller]")]
public class OrganizationController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedImageExtensions = { ".png", ".jpg", ".jpeg", ".svg" };
    private static readonly string[] AllowedFaviconExtensions = { ".png", ".jpg", ".jpeg", ".svg", ".ico" };
    private const long MaxImageSizeBytes = 5 * 1024 * 1024; // 5 MB

    public OrganizationController(ApplicationDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // ─── Admin: GET organization settings ─────────────────────────────
    [HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> Get()
    {
        var org = await GetOrCreateAsync();
        var dto = MapToDto(org);
        return Ok(ApiResponse<OrganizationSettingsDto>.SuccessResponse(dto));
    }

    // ─── Admin: PUT organization settings ─────────────────────────────
    [HttpPut]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    public async Task<IActionResult> Update([FromBody] UpdateOrganizationDto dto)
    {
        var org = await GetOrCreateAsync();

        org.Name = dto.Name ?? org.Name;
        org.SupportEmail = dto.SupportEmail;
        org.MobileNumber = dto.MobileNumber;
        org.OfficeNumber = dto.OfficeNumber;
        org.SupportUrl = dto.SupportUrl;
        org.FooterText = dto.FooterText;
        org.PrimaryColor = dto.PrimaryColor;
        org.IsActive = dto.IsActive;
        org.UpdatedDate = DateTime.UtcNow;
        org.UpdatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        await _db.SaveChangesAsync();

        var result = MapToDto(org);
        return Ok(ApiResponse<OrganizationSettingsDto>.SuccessResponse(result, "Organization settings updated successfully."));
    }

    // ─── Admin: Upload logo or favicon ────────────────────────────────
    [HttpPost("upload/{type}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin}")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> Upload(string type, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<string>.FailureResponse("No file provided."));

        if (file.Length > MaxImageSizeBytes)
            return BadRequest(ApiResponse<string>.FailureResponse("File size exceeds 5 MB limit."));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExts = type.ToLower() == "favicon" ? AllowedFaviconExtensions : AllowedImageExtensions;

        if (!allowedExts.Contains(ext))
            return BadRequest(ApiResponse<string>.FailureResponse($"Invalid file type. Allowed: {string.Join(", ", allowedExts)}"));

        if (type.ToLower() != "logo" && type.ToLower() != "favicon")
            return BadRequest(ApiResponse<string>.FailureResponse("Type must be 'logo' or 'favicon'."));

        // Ensure wwwroot/Organization/ exists
        var orgFolder = Path.Combine(_env.ContentRootPath, "wwwroot", "Organization");
        if (!Directory.Exists(orgFolder))
            Directory.CreateDirectory(orgFolder);

        // Generate filename: logo.png or favicon.ico
        var fileName = $"{type.ToLower()}{ext}";
        var filePath = Path.Combine(orgFolder, fileName);

        // Delete old files with same prefix (different extension)
        var oldFiles = Directory.GetFiles(orgFolder, $"{type.ToLower()}.*");
        foreach (var oldFile in oldFiles)
        {
            try { System.IO.File.Delete(oldFile); } catch { /* ignore */ }
        }

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Update DB
        var org = await GetOrCreateAsync();
        var relativePath = $"/organization/{fileName}";

        if (type.ToLower() == "logo")
            org.LogoPath = relativePath;
        else
            org.FaviconPath = relativePath;

        org.UpdatedDate = DateTime.UtcNow;
        org.UpdatedBy = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        await _db.SaveChangesAsync();

        return Ok(ApiResponse<OrganizationUploadResultDto>.SuccessResponse(
            new OrganizationUploadResultDto { Type = type.ToLower(), Path = relativePath },
            $"{type} uploaded successfully."
        ));
    }

    // ─── Public: Effective branding for candidate-facing UI ───────────
    [HttpGet("branding")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicBranding()
    {
        var org = await _db.OrganizationSettings.FirstOrDefaultAsync();
        var sys = await _db.SystemSettings.FirstOrDefaultAsync();

        var branding = new PublicBrandingDto
        {
            Name = GetEffective(org?.Name, sys?.BrandName, "SmartExam"),
            LogoUrl = GetEffective(org?.LogoPath, sys?.LogoUrl, ""),
            FaviconUrl = org?.FaviconPath ?? "",
            FooterText = GetEffective(org?.FooterText, sys?.FooterText, ""),
            SupportEmail = GetEffective(org?.SupportEmail, sys?.SupportEmail, ""),
            SupportUrl = GetEffective(org?.SupportUrl, sys?.SupportUrl, ""),
            MobileNumber = org?.MobileNumber ?? "",
            OfficeNumber = org?.OfficeNumber ?? "",
            PrimaryColor = GetEffective(org?.PrimaryColor, sys?.PrimaryColor, "#0d9488"),
            IsActive = org?.IsActive ?? false,
        };

        return Ok(ApiResponse<PublicBrandingDto>.SuccessResponse(branding));
    }

    // ─── Helpers ──────────────────────────────────────────────────────

    private async Task<OrganizationSettings> GetOrCreateAsync()
    {
        var entity = await _db.OrganizationSettings.FirstOrDefaultAsync();
        if (entity != null) return entity;

        entity = new OrganizationSettings
        {
            Name = "",
            IsActive = true,
        };
        _db.OrganizationSettings.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    private static string GetEffective(string? orgValue, string? sysValue, string fallback)
    {
        if (!string.IsNullOrWhiteSpace(orgValue)) return orgValue;
        if (!string.IsNullOrWhiteSpace(sysValue)) return sysValue;
        return fallback;
    }

    private static OrganizationSettingsDto MapToDto(OrganizationSettings org)
    {
        return new OrganizationSettingsDto
        {
            Id = org.Id,
            Name = org.Name,
            LogoPath = org.LogoPath,
            FaviconPath = org.FaviconPath,
            SupportEmail = org.SupportEmail,
            MobileNumber = org.MobileNumber,
            OfficeNumber = org.OfficeNumber,
            SupportUrl = org.SupportUrl,
            FooterText = org.FooterText,
            PrimaryColor = org.PrimaryColor,
            IsActive = org.IsActive,
            CreatedDate = org.CreatedDate,
            UpdatedDate = org.UpdatedDate,
        };
    }
}

// ─── DTOs ─────────────────────────────────────────────────────────────

public class OrganizationSettingsDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public string? FaviconPath { get; set; }
    public string? SupportEmail { get; set; }
    public string? MobileNumber { get; set; }
    public string? OfficeNumber { get; set; }
    public string? SupportUrl { get; set; }
    public string? FooterText { get; set; }
    public string? PrimaryColor { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

public class UpdateOrganizationDto
{
    public string? Name { get; set; }
    public string? SupportEmail { get; set; }
    public string? MobileNumber { get; set; }
    public string? OfficeNumber { get; set; }
    public string? SupportUrl { get; set; }
    public string? FooterText { get; set; }
    public string? PrimaryColor { get; set; }
    public bool IsActive { get; set; } = true;
}

public class OrganizationUploadResultDto
{
    public string Type { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
}

public class PublicBrandingDto
{
    public string Name { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string FaviconUrl { get; set; } = string.Empty;
    public string FooterText { get; set; } = string.Empty;
    public string SupportEmail { get; set; } = string.Empty;
    public string SupportUrl { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string OfficeNumber { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
