namespace Smart_Core.Domain.Models;

public class LicenseData
{
    public string CustomerName { get; set; } = string.Empty;
    public string LicenseType { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int GracePeriodDays { get; set; }
    public int MaxUsers { get; set; }
    public string LicensedDomain { get; set; } = string.Empty;
    public string[]? Features { get; set; }
    public string Signature { get; set; } = string.Empty;
}
