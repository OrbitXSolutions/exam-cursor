namespace Smart_Core.Infrastructure.Authentication;

public sealed class ExternalAuthenticationOptions
{
    public const string Section = "ExternalAuthentication";
    public string PublicOrigin { get; set; } = "";
    public UaePassOptions UaePass { get; set; } = new();
    public GovernmentOptions Government { get; set; } = new();
    public string Callback(string provider) => PublicOrigin.TrimEnd('/') + "/api/sso/callback/" + provider;
    public string Finish => PublicOrigin.TrimEnd('/') + "/external-login";
    public bool Enabled(string provider) => provider switch
    {
        "uaepass" => UaePass.Enabled, "government" => Government.Enabled, _ => false
    };

    public void Validate(bool development)
    {
        if (!UaePass.Enabled && !Government.Enabled) return;
        Url(PublicOrigin, development, "PublicOrigin");
        var origin = new Uri(PublicOrigin);
        if (origin.AbsolutePath != "/") Fail("PublicOrigin must be an origin without a path");
        if (UaePass.Enabled)
        {
            Credentials(UaePass.ClientId, UaePass.ClientSecret, "UaePass");
            Url(UaePass.AuthorizationEndpoint, development, "UaePass.AuthorizationEndpoint");
            Url(UaePass.TokenEndpoint, development, "UaePass.TokenEndpoint");
            Url(UaePass.UserInformationEndpoint, development, "UaePass.UserInformationEndpoint");
            Url(UaePass.Issuer, development, "UaePass.Issuer");
            if (UaePass.Issuer.Length > 200 || UaePass.IdentityClaim is not ("uuid" or "spuuid" or "sub") ||
                string.IsNullOrWhiteSpace(UaePass.Scope) || string.IsNullOrWhiteSpace(UaePass.AcrValues))
                Fail("UaePass identity, scope or assurance settings are invalid");
            if (UaePass.AllowedUserTypes.Length == 0 || UaePass.AllowedUserTypes.Any(t => t is not ("SOP1" or "SOP2" or "SOP3")))
                Fail("UaePass.AllowedUserTypes must contain supported assurance levels");
        }
        if (Government.Enabled)
        {
            Credentials(Government.ClientId, Government.ClientSecret, "Government");
            Url(Government.Authority, development, "Government.Authority");
        }
    }

    private static void Credentials(string id, string secret, string provider)
    {
        if (Placeholder(id) || Placeholder(secret)) Fail(provider + " requires registered client credentials");
    }
    private static bool Placeholder(string value) => string.IsNullOrWhiteSpace(value) ||
        value.Contains("REPLACE", StringComparison.OrdinalIgnoreCase) || value.Contains('<');
    private static void Url(string value, bool development, string name)
    {
        if (Placeholder(value) || !Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "https" && !(development && uri.Scheme == "http" && uri.IsLoopback)) ||
            !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
            Fail(name + " must be a trusted HTTPS URL (loopback HTTP is allowed only in Development)");
    }
    private static void Fail(string message) => throw new InvalidOperationException(Section + ": " + message + ".");
}

public sealed class UaePassOptions
{
    public bool Enabled { get; set; }
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string Issuer { get; set; } = "https://stg-id.uaepass.ae/idshub";
    public string AuthorizationEndpoint { get; set; } = "https://stg-id.uaepass.ae/idshub/authorize";
    public string TokenEndpoint { get; set; } = "https://stg-id.uaepass.ae/idshub/token";
    public string UserInformationEndpoint { get; set; } = "https://stg-id.uaepass.ae/idshub/userinfo";
    public string Scope { get; set; } = "urn:uae:digitalid:profile:general";
    public string AcrValues { get; set; } = "urn:safelayer:tws:policies:authentication:level:low";
    // Never silently switch identifiers when a claim is absent. Agree this claim at onboarding.
    public string IdentityClaim { get; set; } = "uuid";
    public string[] AllowedUserTypes { get; set; } = ["SOP2", "SOP3"];
}

public sealed class GovernmentOptions
{
    public bool Enabled { get; set; }
    public string Authority { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string[] Scopes { get; set; } = ["openid", "profile", "email"];
}
