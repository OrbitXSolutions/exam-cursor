using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.License;

public class LicenseStatusResult
{
    public LicenseState State { get; set; }
    public string StateText => State.ToString();
    public int? DaysRemaining { get; set; }
    public int? GracePeriodDays { get; set; }
    public int? GraceDaysRemaining { get; set; }
    public string? CustomerName { get; set; }
    public string? LicenseType { get; set; }
    public DateTime? IssuedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUsers { get; set; }
    public string? LicensedDomain { get; set; }
    public string Message { get; set; } = string.Empty;
}
