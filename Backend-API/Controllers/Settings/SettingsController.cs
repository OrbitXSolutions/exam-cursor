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
[Authorize(Roles = AppRoles.Admin)]
public class SettingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SettingsController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Get system settings (including brand info for white-label exam system)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var entity = await GetOrCreateEntityAsync();
        var dto = MapToDto(entity);
        return Ok(ApiResponse<SystemSettingsDto>.SuccessResponse(dto));
    }

    /// <summary>
    /// Update system settings (brand, general, etc.)
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] SystemSettingsDto dto)
    {
        var entity = await GetOrCreateEntityAsync();
        entity.MaintenanceMode = dto.MaintenanceMode;
        entity.AllowRegistration = dto.AllowRegistration;
        entity.DefaultProctorMode = dto.DefaultProctorMode ?? "Soft";
        entity.MaxFileUploadMb = dto.MaxFileUploadMb;
        entity.SessionTimeoutMinutes = dto.SessionTimeoutMinutes;
        if (dto.PasswordPolicy != null)
        {
            entity.PasswordPolicyMinLength = dto.PasswordPolicy.MinLength;
            entity.PasswordPolicyRequireUppercase = dto.PasswordPolicy.RequireUppercase;
            entity.PasswordPolicyRequireNumbers = dto.PasswordPolicy.RequireNumbers;
            entity.PasswordPolicyRequireSpecialChars = dto.PasswordPolicy.RequireSpecialChars;
        }
        if (dto.Brand != null)
        {
            entity.LogoUrl = dto.Brand.LogoUrl ?? "";
            entity.BrandName = dto.Brand.BrandName ?? "SmartExam";
            entity.FooterText = dto.Brand.FooterText ?? "";
            entity.SupportEmail = dto.Brand.SupportEmail ?? "";
            entity.SupportUrl = dto.Brand.SupportUrl ?? "";
            entity.PrimaryColor = dto.Brand.PrimaryColor ?? "#0d9488";
        }
        entity.UpdatedDate = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        var result = MapToDto(entity);
        return Ok(ApiResponse<SystemSettingsDto>.SuccessResponse(result));
    }

    private async Task<SystemSettings> GetOrCreateEntityAsync()
    {
        var entity = await _db.SystemSettings.FirstOrDefaultAsync();
        if (entity != null) return entity;
        entity = new SystemSettings
        {
            MaintenanceMode = false,
            AllowRegistration = true,
            DefaultProctorMode = "Soft",
            MaxFileUploadMb = 10,
            SessionTimeoutMinutes = 120,
            PasswordPolicyMinLength = 8,
            PasswordPolicyRequireUppercase = true,
            PasswordPolicyRequireNumbers = true,
            PasswordPolicyRequireSpecialChars = false,
            LogoUrl = "",
            BrandName = "SmartExam",
            FooterText = "© SmartExam. All rights reserved.",
            SupportEmail = "",
            SupportUrl = "",
            PrimaryColor = "#0d9488",
        };
        _db.SystemSettings.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    private static SystemSettingsDto MapToDto(SystemSettings e)
    {
        return new SystemSettingsDto
        {
            MaintenanceMode = e.MaintenanceMode,
            AllowRegistration = e.AllowRegistration,
            DefaultProctorMode = e.DefaultProctorMode,
            MaxFileUploadMb = e.MaxFileUploadMb,
            SessionTimeoutMinutes = e.SessionTimeoutMinutes,
            PasswordPolicy = new PasswordPolicyDto
            {
                MinLength = e.PasswordPolicyMinLength,
                RequireUppercase = e.PasswordPolicyRequireUppercase,
                RequireNumbers = e.PasswordPolicyRequireNumbers,
                RequireSpecialChars = e.PasswordPolicyRequireSpecialChars,
            },
            Brand = new BrandSettingsDto
            {
                LogoUrl = e.LogoUrl,
                BrandName = e.BrandName,
                FooterText = e.FooterText,
                SupportEmail = e.SupportEmail,
                SupportUrl = e.SupportUrl,
                PrimaryColor = e.PrimaryColor,
            },
        };
    }
}

public class SystemSettingsDto
{
    public bool MaintenanceMode { get; set; }
    public bool AllowRegistration { get; set; }
    public string? DefaultProctorMode { get; set; }
    public int MaxFileUploadMb { get; set; }
    public int SessionTimeoutMinutes { get; set; }
    public PasswordPolicyDto? PasswordPolicy { get; set; }
    public BrandSettingsDto? Brand { get; set; }
}

public class PasswordPolicyDto
{
    public int MinLength { get; set; }
    public bool RequireUppercase { get; set; }
    public bool RequireNumbers { get; set; }
    public bool RequireSpecialChars { get; set; }
}

public class BrandSettingsDto
{
    public string? LogoUrl { get; set; }
    public string? BrandName { get; set; }
    public string? FooterText { get; set; }
    public string? SupportEmail { get; set; }
    public string? SupportUrl { get; set; }
    public string? PrimaryColor { get; set; }
}
