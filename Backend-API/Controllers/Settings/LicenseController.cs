using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.License;
using Smart_Core.Application.Interfaces.License;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Models;
using Smart_Core.Infrastructure.Services.License;

namespace Smart_Core.Controllers.Settings;

[ApiController]
[Route("api/[controller]")]
public class LicenseController : ControllerBase
{
    private readonly ILicenseValidationService _licenseService;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LicenseController> _logger;

    public LicenseController(
        ILicenseValidationService licenseService,
        IWebHostEnvironment env,
        ILogger<LicenseController> logger)
    {
        _licenseService = licenseService;
        _env = env;
        _logger = logger;
    }

    /// <summary>
    /// Get current license status. Available to all authenticated users.
    /// </summary>
    [HttpGet("status")]
    [Authorize]
    public IActionResult GetStatus()
    {
        var status = _licenseService.GetLicenseStatus();
        return Ok(ApiResponse<LicenseStatusResult>.SuccessResponse(status));
    }

    /// <summary>
    /// Upload a new license.json file. Admin only.
    /// </summary>
    [HttpPost("upload")]
    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.SuperDev}")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.FailureResponse("No file provided."));

        if (file.Length > 50 * 1024) // 50KB max for a license file
            return BadRequest(ApiResponse<object>.FailureResponse("File too large. License file should be under 50KB."));

        if (!file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            return BadRequest(ApiResponse<object>.FailureResponse("Only .json files are accepted."));

        try
        {
            // Read and validate JSON structure before saving
            using var reader = new StreamReader(file.OpenReadStream());
            var json = await reader.ReadToEndAsync();

            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var license = JsonSerializer.Deserialize<LicenseData>(json, options);

            if (license == null || string.IsNullOrEmpty(license.CustomerName) || string.IsNullOrEmpty(license.Signature))
            {
                return BadRequest(ApiResponse<object>.FailureResponse(
                    "Invalid license file structure. The file must contain CustomerName and Signature fields."));
            }

            // Save to License directory
            var licenseDir = Path.Combine(_env.ContentRootPath, "License");
            if (!Directory.Exists(licenseDir))
                Directory.CreateDirectory(licenseDir);

            var licensePath = Path.Combine(licenseDir, "license.json");
            await System.IO.File.WriteAllTextAsync(licensePath, json);

            _logger.LogInformation("License file uploaded by {User}. Customer={Customer}",
                User.Identity?.Name, license.CustomerName);

            // Reload the license service
            _licenseService.ReloadLicense();

            var status = _licenseService.GetLicenseStatus();
            return Ok(ApiResponse<LicenseStatusResult>.SuccessResponse(status, "License uploaded and validated."));
        }
        catch (JsonException)
        {
            return BadRequest(ApiResponse<object>.FailureResponse("The uploaded file is not valid JSON."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading license file");
            return StatusCode(500, ApiResponse<object>.FailureResponse("An error occurred while processing the license file."));
        }
    }
}
