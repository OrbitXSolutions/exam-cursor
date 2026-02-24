namespace Smart_Core.Domain.Entities;

/// <summary>
/// Global system settings (single row). Includes brand info for white-label exam system.
/// </summary>
public class SystemSettings
{
    public int Id { get; set; }
    public bool MaintenanceMode { get; set; }
    public bool AllowRegistration { get; set; } = true;
    public string DefaultProctorMode { get; set; } = "Soft";
    public int MaxFileUploadMb { get; set; } = 10;
    public int SessionTimeoutMinutes { get; set; } = 120;
    public int PasswordPolicyMinLength { get; set; } = 8;
    public bool PasswordPolicyRequireUppercase { get; set; } = true;
    public bool PasswordPolicyRequireNumbers { get; set; } = true;
    public bool PasswordPolicyRequireSpecialChars { get; set; }
    public string LogoUrl { get; set; } = "";
    public string BrandName { get; set; } = "SmartExam";
    public string FooterText { get; set; } = "";
    public string SupportEmail { get; set; } = "";
    public string SupportUrl { get; set; } = "";
    public string PrimaryColor { get; set; } = "#0d9488";
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedDate { get; set; }

    // Video Recording Retention
    public int VideoRetentionDays { get; set; } = 30;

    // Video Feature Flags (overrides appsettings at DB level if set)
    public bool EnableLiveVideo { get; set; } = true;
    public bool EnableVideoRecording { get; set; } = true;

    // Smart Monitoring (AI face detection)
    public bool EnableSmartMonitoring { get; set; } = true;
}
