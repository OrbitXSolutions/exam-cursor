using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Smart_Core.Infrastructure.Authentication;

public sealed record ExternalIdentity(string Provider, string Issuer, string Subject, string Name, string Email)
{
    public const string CookieScheme = "ExternalSso";
    public const string ProviderClaim = "sso:provider";
    public const string IssuerClaim = "sso:issuer";
    public const string SubjectClaim = "sso:subject";

    public static bool ValidIdentifier(string? value) => !string.IsNullOrWhiteSpace(value) &&
        value.Length <= 200 && value == value.Trim() && !value.Any(char.IsControl);

    public ClaimsPrincipal Principal()
    {
        if (Provider is not ("uaepass" or "government") || !ValidIdentifier(Issuer) || !ValidIdentifier(Subject))
            throw new InvalidOperationException("Provider returned an invalid identity.");
        return new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ProviderClaim, Provider), new Claim(IssuerClaim, Issuer),
            new Claim(SubjectClaim, Subject),
            // Antiforgery binds to NameIdentifier. Scope it to provider and issuer so
            // identical subject strings from different providers cannot share a proof.
            new Claim(ClaimTypes.NameIdentifier, Convert.ToHexString(SHA256.HashData(
                Encoding.UTF8.GetBytes(Provider + "\n" + Issuer + "\n" + Subject)))),
            new Claim(ClaimTypes.Name, Name.Length <= 200 ? Name : Name[..200]),
            new Claim(ClaimTypes.Email, Email.Length <= 254 ? Email : "")
        }, CookieScheme));
    }

    public static ExternalIdentity? FromPrincipal(ClaimsPrincipal? principal)
    {
        if (principal?.Identity?.IsAuthenticated != true) return null;
        var provider = principal.FindFirstValue(ProviderClaim);
        var issuer = principal.FindFirstValue(IssuerClaim);
        var subject = principal.FindFirstValue(SubjectClaim);
        if (provider is not ("uaepass" or "government") || !ValidIdentifier(issuer) || !ValidIdentifier(subject)) return null;
        return new(provider, issuer!, subject!, principal.FindFirstValue(ClaimTypes.Name) ?? "",
            principal.FindFirstValue(ClaimTypes.Email) ?? "");
    }
}
