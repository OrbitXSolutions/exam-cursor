using Smart_Core.Domain.Models;

namespace Smart_Core.Infrastructure.Services.License;

public static class LicenseCanonicalBuilder
{
    /// <summary>
    /// Builds a deterministic canonical payload from a LicenseData object.
    /// Used for both signing and verification. Field order is fixed.
    /// </summary>
    public static string BuildCanonicalPayload(LicenseData license)
    {
        var features = license.Features != null && license.Features.Length > 0
            ? string.Join(",", license.Features.OrderBy(f => f, StringComparer.OrdinalIgnoreCase))
            : "";

        return string.Join("|",
            $"CustomerName={license.CustomerName}",
            $"LicenseType={license.LicenseType}",
            $"IssuedAt={license.IssuedAt.ToUniversalTime():yyyy-MM-ddTHH:mm:ssZ}",
            $"ExpiresAt={license.ExpiresAt.ToUniversalTime():yyyy-MM-ddTHH:mm:ssZ}",
            $"GracePeriodDays={license.GracePeriodDays}",
            $"MaxUsers={license.MaxUsers}",
            $"LicensedDomain={license.LicensedDomain.ToLowerInvariant()}",
            $"Features={features}"
        );
    }
}
