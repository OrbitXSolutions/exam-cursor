using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OAuth;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace Smart_Core.Infrastructure.Authentication;

public static class ExternalAuthenticationExtensions
{
    public static IServiceCollection AddExternalAuthentication(this IServiceCollection services,
        IConfiguration configuration, IHostEnvironment environment)
    {
        var settings = configuration.GetSection(ExternalAuthenticationOptions.Section)
            .Get<ExternalAuthenticationOptions>() ?? new();
        settings.Validate(environment.IsDevelopment());
        services.AddSingleton(settings);
        services.AddScoped<ExternalAccountService>();
        var secure = environment.IsDevelopment() ? CookieSecurePolicy.SameAsRequest : CookieSecurePolicy.Always;
        services.AddAntiforgery(o =>
        {
            o.HeaderName = "X-SSO-CSRF";
            o.Cookie.Name = "SmartExam.SsoCsrf";
            o.Cookie.Path = "/api/sso";
            o.Cookie.SameSite = SameSiteMode.Strict;
            o.Cookie.SecurePolicy = secure;
        });
        var auth = services.AddAuthentication().AddCookie(ExternalIdentity.CookieScheme, o =>
        {
            o.Cookie.Name = "SmartExam.ExternalSso";
            o.Cookie.Path = "/api/sso";
            o.Cookie.HttpOnly = true;
            o.Cookie.SameSite = SameSiteMode.Lax;
            o.Cookie.SecurePolicy = secure;
            o.ExpireTimeSpan = TimeSpan.FromMinutes(5);
            o.SlidingExpiration = false;
        });
        if (settings.UaePass.Enabled)
            auth.AddOAuth<OAuthOptions, UaePassHandler>("uaepass", o =>
            {
                Common(o, "uaepass", secure);
                o.ClientId = settings.UaePass.ClientId;
                o.ClientSecret = settings.UaePass.ClientSecret;
                o.AuthorizationEndpoint = settings.UaePass.AuthorizationEndpoint;
                o.TokenEndpoint = settings.UaePass.TokenEndpoint;
                o.UserInformationEndpoint = settings.UaePass.UserInformationEndpoint;
                o.Scope.Clear();
                foreach (var scope in settings.UaePass.Scope.Split(' ', StringSplitOptions.RemoveEmptyEntries)) o.Scope.Add(scope);
                // The published UAE PASS web contract does not advertise PKCE support.
                // Use the documented confidential-client flow with protected state/correlation.
                o.UsePkce = false;
                o.Backchannel = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false })
                { Timeout = TimeSpan.FromSeconds(15), MaxResponseContentBufferSize = 64 * 1024 };
                o.Events.OnRemoteFailure = Failure;
                o.Events.OnTicketReceived = Ticket;
            });
        if (settings.Government.Enabled)
            auth.AddOpenIdConnect("government", o =>
            {
                Common(o, "government", secure);
                o.Authority = settings.Government.Authority;
                o.ClientId = settings.Government.ClientId;
                o.ClientSecret = settings.Government.ClientSecret;
                o.RequireHttpsMetadata = !environment.IsDevelopment();
                o.ResponseType = OpenIdConnectResponseType.Code;
                o.ResponseMode = OpenIdConnectResponseMode.Query;
                o.UsePkce = true;
                o.MapInboundClaims = false;
                o.GetClaimsFromUserInfoEndpoint = false;
                o.Scope.Clear();
                o.Scope.Add("openid");
                foreach (var scope in settings.Government.Scopes) o.Scope.Add(scope);
                o.NonceCookie.SameSite = SameSiteMode.Lax;
                o.NonceCookie.SecurePolicy = secure;
                o.Events.OnRedirectToIdentityProvider = c =>
                {
                    c.ProtocolMessage.RedirectUri = settings.Callback("government");
                    return Task.CompletedTask;
                };
                o.Events.OnAuthorizationCodeReceived = c =>
                {
                    c.TokenEndpointRequest!.RedirectUri = settings.Callback("government");
                    return Task.CompletedTask;
                };
                o.Events.OnTokenValidated = c =>
                {
                    // The handler validates discovery issuer, signature, audience, lifetime,
                    // nonce and PKCE. Only the validated subject identifies the account.
                    c.Principal = new ExternalIdentity("government", c.SecurityToken.Issuer,
                        c.Principal!.FindFirstValue("sub") ?? "", c.Principal!.FindFirstValue("name") ?? "",
                        c.Principal!.FindFirstValue("email") ?? "").Principal();
                    return Task.CompletedTask;
                };
                o.Events.OnRemoteFailure = Failure;
                o.Events.OnTicketReceived = Ticket;
            });
        return services;

        Task Failure(RemoteFailureContext c)
        {
            SsoAudit.Write(c.HttpContext, c.Scheme.Name, SsoEvent.CallbackFailed, failure: c.Failure);
            c.HandleResponse();
            c.Response.Headers.CacheControl = "no-store";
            c.Response.Headers["Referrer-Policy"] = "no-referrer";
            c.Response.Redirect(settings.Finish + "?error=provider_failed");
            return Task.CompletedTask;
        }
        Task Ticket(TicketReceivedContext c)
        {
            // Separate short-lived, protected login proof; never persist provider tokens.
            c.Properties!.ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(5);
            c.Properties.IsPersistent = false;
            c.Properties.AllowRefresh = false;
            c.ReturnUri = settings.Finish;
            c.Response.Headers.CacheControl = "no-store";
            c.Response.Headers["Referrer-Policy"] = "no-referrer";
            SsoAudit.Write(c.HttpContext, c.Scheme.Name, SsoEvent.CallbackAccepted);
            return Task.CompletedTask;
        }
    }

    private static void Common(RemoteAuthenticationOptions options, string provider,
        CookieSecurePolicy secure)
    {
        options.SignInScheme = ExternalIdentity.CookieScheme;
        options.CallbackPath = "/api/sso/callback/" + provider;
        options.RemoteAuthenticationTimeout = TimeSpan.FromMinutes(5);
        options.SaveTokens = false;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = secure;
    }
}
