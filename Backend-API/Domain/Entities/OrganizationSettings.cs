using Smart_Core.Domain.Common;

namespace Smart_Core.Domain.Entities;

/// <summary>
/// Organization/authority branding settings (single row).
/// Overrides System Settings brand info for candidate-facing UI.
/// </summary>
public class OrganizationSettings : BaseEntity
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
    public bool IsActive { get; set; } = true;
}
