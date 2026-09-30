using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Smart_Core.Infrastructure.Authentication;

public sealed class UaePassHandler : OAuthHandler<OAuthOptions>
{
    private readonly ExternalAuthenticationOptions _settings;
    public UaePassHandler(IOptionsMonitor<OAuthOptions> options, ILoggerFactory logger,
        UrlEncoder encoder, ExternalAuthenticationOptions settings)
        // Framework OAuth failure messages can contain raw remote payloads. Emit only
        // allowlisted SsoAudit events; do not send those messages to application sinks.
        : base(options, NullLoggerFactory.Instance, encoder) => _settings = settings;

    protected override string BuildChallengeUrl(AuthenticationProperties properties, string redirectUri)
    {
        var url = base.BuildChallengeUrl(properties, _settings.Callback("uaepass"));
        return QueryHelpers.AddQueryString(url, new Dictionary<string, string?>
        {
            ["acr_values"] = _settings.UaePass.AcrValues,
            ["ui_locales"] = properties.GetString("language") == "ar" ? "ar" : "en"
        });
    }

    protected override async Task<OAuthTokenResponse> ExchangeCodeAsync(OAuthCodeExchangeContext context)
    {
        // UAE PASS's documented contract uses Basic client authentication and query
        // parameters on this server-to-server POST. Never log the request URI.
        var url = QueryHelpers.AddQueryString(Options.TokenEndpoint, new Dictionary<string, string?>
        {
            ["grant_type"] = "authorization_code", ["code"] = context.Code,
            ["redirect_uri"] = _settings.Callback("uaepass")
        });
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{Options.ClientId}:{Options.ClientSecret}")));
        request.Content = new MultipartFormDataContent();
        using var response = await Backchannel.SendAsync(request, Context.RequestAborted);
        if (!response.IsSuccessStatusCode)
        {
            SsoAudit.Write(Context, "uaepass", SsoEvent.TokenFailed, (int)response.StatusCode);
            return OAuthTokenResponse.Failed(new InvalidOperationException("Provider token exchange failed."));
        }
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Context.RequestAborted));
        if (!json.RootElement.TryGetProperty("token_type", out var type) ||
            !string.Equals(type.GetString(), "Bearer", StringComparison.OrdinalIgnoreCase))
        {
            json.Dispose();
            return OAuthTokenResponse.Failed(new InvalidOperationException("Invalid provider token response."));
        }
        SsoAudit.Write(Context, "uaepass", SsoEvent.TokenAccepted, (int)response.StatusCode);
        return OAuthTokenResponse.Success(json);
    }

    protected override async Task<AuthenticationTicket> CreateTicketAsync(ClaimsIdentity identity,
        AuthenticationProperties properties, OAuthTokenResponse tokens)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, Options.UserInformationEndpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokens.AccessToken);
        using var response = await Backchannel.SendAsync(request, Context.RequestAborted);
        if (!response.IsSuccessStatusCode)
        {
            SsoAudit.Write(Context, "uaepass", SsoEvent.ProfileFailed, (int)response.StatusCode);
            throw new InvalidOperationException("Provider profile request failed.");
        }
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Context.RequestAborted));
        string Claim(string name) => json.RootElement.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString() ?? "" : "";
        if (!_settings.UaePass.AllowedUserTypes.Contains(Claim("userType"), StringComparer.Ordinal))
            throw new InvalidOperationException("Provider identity assurance is insufficient.");
        var name = Claim(properties.GetString("language") == "ar" ? "fullnameAR" : "fullnameEN");
        if (string.IsNullOrWhiteSpace(name)) name = Claim("fullnameEN");
        var principal = new ExternalIdentity("uaepass", _settings.UaePass.Issuer,
            Claim(_settings.UaePass.IdentityClaim), name, Claim("email")).Principal();
        SsoAudit.Write(Context, "uaepass", SsoEvent.ProfileAccepted, (int)response.StatusCode);
        return new AuthenticationTicket(principal, properties, Scheme.Name);
    }
}
