using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.Interfaces;
using Smart_Core.Controllers;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Infrastructure.Authentication;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests;

public sealed class ExternalAuthenticationTests
{
    [Theory]
    [InlineData("//evil.invalid")]
    [InlineData("/\\evil.invalid")]
    [InlineData("https://evil.invalid")]
    [InlineData("/%2fevil.invalid")]
    [InlineData("/\nevil")]
    public void ReturnUrlCannotLeaveApplication(string value) => Assert.Null(ExternalAuthController.SafeReturnUrl(value));

    [Fact]
    public void DisabledProvidersNeedNoCredentialsAndEnabledProvidersFailClosed()
    {
        var options = new ExternalAuthenticationOptions();
        options.Validate(false);
        options.UaePass.Enabled = true;
        Assert.Throws<InvalidOperationException>(() => options.Validate(false));
        options.PublicOrigin = "https://exam.example.test";
        options.UaePass.ClientId = "test-client";
        options.UaePass.ClientSecret = "test-secret";
        options.Validate(false);
        options.UaePass.TokenEndpoint = "http://provider.example.test/token";
        Assert.Throws<InvalidOperationException>(() => options.Validate(true));
        options.UaePass.TokenEndpoint = "http://127.0.0.1:9000/token";
        options.Validate(true);
        Assert.Throws<InvalidOperationException>(() => options.Validate(false));
    }

    [SqlServerFact]
    public async Task UaePassLinksOnlyAfterOwnershipProofAndRetainsCorporateAuthorizationAndRelationships()
    {
        await using var f = await Fixture.StartAsync();
        using var client = f.Client();
        var callback = await f.AuthenticateAsync(client, "uaepass", "ar");
        Assert.Equal("/external-login", callback.Headers.Location!.AbsolutePath);
        Assert.DoesNotContain("token", callback.Headers.Location.ToString());
        var session = await f.SessionAsync(client);
        Assert.False(session.GetProperty("linked").GetBoolean());
        Assert.Equal("personal@example.invalid", session.GetProperty("email").GetString());
        Assert.Equal("Personal Identity", session.GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/sso/link", new { account = "corporate@example.invalid", password = Fixture.Password })).StatusCode);
        var missing = await f.PostAsync(client, "link", session, new { account = "absent@example.invalid", password = Fixture.Password });
        Assert.Contains("No matching corporate account", await missing.Content.ReadAsStringAsync());
        var wrong = await f.PostAsync(client, "link", session, new { account = "corporate@example.invalid", password = "incorrect" });
        Assert.Equal(HttpStatusCode.BadRequest, wrong.StatusCode);
        await using (var db = f.Database()) Assert.Null((await db.Users.FindAsync(f.UserId))!.UaePassSubject);
        var linked = await f.PostAsync(client, "link", session, new { account = "corporate@example.invalid", password = Fixture.Password });
        var json = await JsonAsync(linked);
        var data = json.GetProperty("data");
        Assert.Equal(f.UserId, data.GetProperty("user").GetProperty("id").GetString());
        Assert.Equal("corporate@example.invalid", data.GetProperty("user").GetProperty("email").GetString());
        Assert.Contains(AppRoles.Candidate, data.GetProperty("user").GetProperty("roles").EnumerateArray().Select(v => v.GetString()));
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(data.GetProperty("accessToken").GetString());
        Assert.Contains(jwt.Claims, c => c.Value == f.UserId);
        Assert.DoesNotContain(jwt.Claims, c => c.Value == "personal@example.invalid");
        client.DefaultRequestHeaders.Authorization = new("Bearer", data.GetProperty("accessToken").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/candidate-only")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.GetAsync("/admin-only")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sso/session")).StatusCode);
        await using (var db = f.Database())
        {
            var user = (await db.Users.FindAsync(f.UserId))!;
            Assert.Equal("personal-subject", user.UaePassSubject);
            Assert.NotNull(user.UaePassLinkedAt);
            Assert.Equal(f.UserId, (await db.Attempts.SingleAsync()).CandidateId);
            Assert.Equal(2, await db.Users.CountAsync());
        }
        // Returning login tolerates a changed personal email but preserves the same subject.
        f.PersonalEmail = "changed@example.invalid";
        await f.AuthenticateAsync(client, "uaepass");
        session = await f.SessionAsync(client);
        Assert.True(session.GetProperty("linked").GetBoolean());
        Assert.True((await JsonAsync(await f.PostAsync(client, "complete", session, new { }))).GetProperty("success").GetBoolean());
        // Existing development/password sign-in and refresh still work for that same user.
        await using var scope = f.App.Services.CreateAsyncScope();
        var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
        var local = await auth.LoginAsync(new LoginDto { Email = "corporate@example.invalid", Password = Fixture.Password });
        Assert.True(local.Success);
        Assert.Equal(f.UserId, local.Data!.User.Id);
        Assert.True((await auth.RefreshTokenAsync(new RefreshTokenDto { AccessToken = local.Data.AccessToken, RefreshToken = local.Data.RefreshToken })).Success);
        f.AssertSafeLogs();
    }

    [SqlServerFact]
    public async Task GovernmentUsesSignedOidcCodeNonceAndPkceThenExistingAccountLinking()
    {
        await using var f = await Fixture.StartAsync();
        using var client = f.Client();
        await f.AuthenticateAsync(client, "government");
        var session = await f.SessionAsync(client);
        Assert.False(session.GetProperty("linked").GetBoolean());
        var linked = await JsonAsync(await f.PostAsync(client, "link", session,
            new { account = "corporate@example.invalid", password = Fixture.Password }));
        Assert.Equal(f.UserId, linked.GetProperty("data").GetProperty("user").GetProperty("id").GetString());
        await using var db = f.Database();
        var user = (await db.Users.FindAsync(f.UserId))!;
        Assert.Equal("government-subject", user.GovernmentSubject);
        Assert.Null(user.UaePassSubject);
        foreach (var fault in new[] { "bad-nonce", "bad-audience", "bad-issuer", "expired", "bad-signature" })
        {
            f.Fault = fault;
            var response = await f.AuthenticateAsync(client, "government");
            Assert.Contains("error=provider_failed", response.Headers.Location!.ToString());
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sso/session")).StatusCode);
        }
        f.AssertSafeLogs();
    }

    [SqlServerFact]
    public async Task ProviderFailuresTamperingReplayAndUnverifiedProfilesNeverCreateApplicationSessions()
    {
        await using var f = await Fixture.StartAsync();
        using var client = f.Client();
        foreach (var fault in new[] { "denied", "token-error", "userinfo-error", "missing-subject", "SOP1", "malformed-json" })
        {
            f.Fault = fault;
            var response = await f.AuthenticateAsync(client, "uaepass");
            Assert.Contains("error=provider_failed", response.Headers.Location!.ToString());
            Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sso/session")).StatusCode);
        }
        f.Fault = "";
        var start = await client.GetAsync("/api/sso/start/uaepass?returnUrl=//evil.invalid");
        var authorization = QueryHelpers.ParseQuery(start.Headers.Location!.Query);
        Assert.Equal(f.Settings.Callback("uaepass"), authorization["redirect_uri"]);
        Assert.Equal("urn:safelayer:tws:policies:authentication:level:low", authorization["acr_values"]);
        var redirected = await client.GetAsync(start.Headers.Location);
        var callback = redirected.Headers.Location!;
        using (var differentBrowser = f.Client())
            Assert.Contains("error=provider_failed", (await differentBrowser.GetAsync(callback)).Headers.Location!.ToString());
        Assert.Contains("error=provider_failed", (await client.GetAsync("/api/sso/callback/uaepass?code=secret-code&state=tampered")).Headers.Location!.ToString());
        Assert.DoesNotContain("error=", (await client.GetAsync(callback)).Headers.Location!.ToString());
        var session = await f.SessionAsync(client);
        Assert.Equal(JsonValueKind.Null, session.GetProperty("returnUrl").ValueKind);
        Assert.Contains("error=provider_failed", (await client.GetAsync(callback)).Headers.Location!.ToString());
        Assert.Equal(HttpStatusCode.NoContent, (await f.PostAsync(client, "cancel", session, new { })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sso/session")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/sso/start/unknown")).StatusCode);
        f.AssertSafeLogs();
    }

    [SqlServerFact]
    public async Task LockoutBlockedDeletedAndConflictingAccountsCannotBeLinkedOrSignedIn()
    {
        await using var f = await Fixture.StartAsync();
        using var client = f.Client();
        await f.AuthenticateAsync(client, "uaepass");
        var session = await f.SessionAsync(client);
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.BadRequest, (await f.PostAsync(client, "link", session,
                new { account = "corporate@example.invalid", password = "wrong" })).StatusCode);
        Assert.Contains("locked out", await (await f.PostAsync(client, "link", session,
            new { account = "corporate@example.invalid", password = Fixture.Password })).Content.ReadAsStringAsync());
        await using (var db = f.Database())
            await db.Users.Where(u => u.Id == f.UserId).ExecuteUpdateAsync(s => s.SetProperty(u => u.LockoutEnd, (DateTimeOffset?)null));
        Assert.Equal(HttpStatusCode.OK, (await f.PostAsync(client, "link", session,
            new { account = "corporate@example.invalid", password = Fixture.Password })).StatusCode);
        f.Subject = "different-person";
        await f.AuthenticateAsync(client, "uaepass");
        session = await f.SessionAsync(client);
        Assert.Contains("already linked", await (await f.PostAsync(client, "link", session,
            new { account = "corporate@example.invalid", password = Fixture.Password })).Content.ReadAsStringAsync());
        f.Subject = "personal-subject";
        foreach (var state in new[] { "blocked", "inactive", "deleted" })
        {
            await using (var db = f.Database())
                await db.Users.IgnoreQueryFilters().Where(u => u.Id == f.UserId).ExecuteUpdateAsync(s => s
                    .SetProperty(u => u.IsBlocked, state == "blocked").SetProperty(u => u.IsDeleted, state == "deleted")
                    .SetProperty(u => u.Status, state == "inactive" ? UserStatus.Inactive : UserStatus.Active));
            await f.AuthenticateAsync(client, "uaepass");
            session = await f.SessionAsync(client);
            Assert.True(session.GetProperty("linked").GetBoolean());
            Assert.Equal(HttpStatusCode.BadRequest, (await f.PostAsync(client, "complete", session, new { })).StatusCode);
            Assert.Equal(HttpStatusCode.BadRequest, (await f.PostAsync(client, "link", session,
                new { account = "other@example.invalid", password = Fixture.Password })).StatusCode);
        }
    }

    [SqlServerFact]
    public async Task ExternalProofCookiesRejectTamperingAndExpireAfterFiveMinutes()
    {
        await using var f = await Fixture.StartAsync();
        using var client = f.Client();
        var response = await f.AuthenticateAsync(client, "uaepass");
        var cookie = response.Headers.GetValues("Set-Cookie").Single(v => v.StartsWith("SmartExam.ExternalSso="));
        using var attacker = f.Client();
        attacker.DefaultRequestHeaders.Add("Cookie", cookie.Split(';')[0] + "tampered");
        Assert.Equal(HttpStatusCode.Unauthorized, (await attacker.GetAsync("/api/sso/session")).StatusCode);
        var session = await f.SessionAsync(client);
        f.Clock.Advance = TimeSpan.FromMinutes(6);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/sso/session")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await f.PostAsync(client, "link", session,
            new { account = "corporate@example.invalid", password = Fixture.Password })).StatusCode);
    }

    [SqlServerFact]
    public async Task ConcurrentLinksCannotAssignOneIdentityToTwoCorporateAccounts()
    {
        await using var f = await Fixture.StartAsync();
        using var first = f.Client(); using var second = f.Client();
        await f.AuthenticateAsync(first, "uaepass"); await f.AuthenticateAsync(second, "uaepass");
        var firstSession = await f.SessionAsync(first); var secondSession = await f.SessionAsync(second);
        var results = await Task.WhenAll(
            f.PostAsync(first, "link", firstSession, new { account = "corporate@example.invalid", password = Fixture.Password }),
            f.PostAsync(second, "link", secondSession, new { account = "other@example.invalid", password = Fixture.Password }));
        Assert.Single(results, r => r.IsSuccessStatusCode);
        Assert.Single(results, r => r.StatusCode == HttpStatusCode.BadRequest);
        await using var db = f.Database();
        Assert.Equal(1, await db.Users.CountAsync(u => u.UaePassSubject == "personal-subject"));
    }

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.Clone();
    }

    private sealed class Fixture : IAsyncDisposable
    {
        public const string Password = "Local-test!123456";
        private readonly string _connection = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        { InitialCatalog = "RegressionSso_" + Guid.NewGuid().ToString("N") }.ConnectionString;
        private readonly RSA _rsa = RSA.Create(2048);
        private readonly ConcurrentDictionary<string, Dictionary<string, string>> _codes = new();
        private WebApplication _provider = null!;
        public WebApplication App { get; private set; } = null!;
        public ExternalAuthenticationOptions Settings { get; private set; } = null!;
        public string UserId { get; private set; } = "";
        public string Subject { get; set; } = "personal-subject";
        public string PersonalEmail { get; set; } = "personal@example.invalid";
        public string Fault { get; set; } = "";
        public AdjustableClock Clock { get; } = new();
        private string ProviderUrl => Address(_provider);
        private static string Address(WebApplication app) => app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses.Single();
        public ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseSqlServer(_connection).Options);
        public HttpClient Client() => new(new HttpClientHandler { AllowAutoRedirect = false }) { BaseAddress = new Uri(Address(App)) };

        public static async Task<Fixture> StartAsync()
        {
            var f = new Fixture();
            try { await f.StartProviderAsync(); await f.StartAppAsync(); return f; }
            catch { await f.DisposeAsync(); throw; }
        }
        private async Task StartProviderAsync()
        {
            var builder = WebApplication.CreateBuilder();
            builder.Logging.ClearProviders();
            builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
            _provider = builder.Build();
            _provider.MapGet("/.well-known/openid-configuration", () => new
            {
                issuer = ProviderUrl, authorization_endpoint = ProviderUrl + "/authorize-government",
                token_endpoint = ProviderUrl + "/token-government", jwks_uri = ProviderUrl + "/keys",
                response_types_supported = new[] { "code" }, subject_types_supported = new[] { "public" },
                id_token_signing_alg_values_supported = new[] { "RS256" }, code_challenge_methods_supported = new[] { "S256" }
            });
            _provider.MapGet("/keys", () => new { keys = new[] { JsonWebKeyConverter.ConvertFromRSASecurityKey(new RsaSecurityKey(_rsa) { KeyId = "test-key" }) } });
            foreach (var path in new[] { "/authorize", "/authorize-government" })
                _provider.MapGet(path, (HttpContext c) =>
                {
                    var q = c.Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
                    var code = "secret-code-" + Guid.NewGuid().ToString("N");
                    _codes[code] = q;
                    return Results.Redirect(QueryHelpers.AddQueryString(q["redirect_uri"], new Dictionary<string, string?>
                    { [Fault == "denied" ? "error" : "code"] = Fault == "denied" ? "access_denied" : code, ["state"] = q["state"] }));
                });
            _provider.MapPost("/token", (HttpContext c) =>
            {
                Assert.Equal("Basic " + Convert.ToBase64String(Encoding.UTF8.GetBytes("test-client:test-secret")), c.Request.Headers.Authorization);
                Assert.Equal("authorization_code", c.Request.Query["grant_type"]);
                Assert.Equal(Settings.Callback("uaepass"), c.Request.Query["redirect_uri"]);
                if (Fault == "token-error" || !_codes.TryRemove(c.Request.Query["code"].ToString(), out _))
                    return Results.Json(new { error = "invalid_grant", error_description = "secret-remote-response" }, statusCode: 400);
                return Results.Json(new { access_token = "secret-provider-token", token_type = "Bearer", expires_in = 300 });
            });
            _provider.MapGet("/userinfo", (HttpContext c) =>
            {
                Assert.Equal("Bearer secret-provider-token", c.Request.Headers.Authorization);
                if (Fault == "userinfo-error") return Results.Json(new { error = "secret-profile-response" }, statusCode: 503);
                if (Fault == "malformed-json") return Results.Text("secret-malformed-provider-response", "application/json");
                return Results.Json(new { uuid = Fault == "missing-subject" ? "" : Subject, fullnameEN = "Personal Identity",
                    email = PersonalEmail, userType = Fault == "SOP1" ? "SOP1" : "SOP3" });
            });
            _provider.MapPost("/token-government", async (HttpContext c) =>
            {
                var form = await c.Request.ReadFormAsync();
                Assert.True(_codes.TryRemove(form["code"].ToString(), out var q));
                Assert.Equal(Settings.Callback("government"), form["redirect_uri"]);
                Assert.Equal("S256", q!["code_challenge_method"]);
                Assert.Equal(q["code_challenge"], Base64UrlEncoder.Encode(SHA256.HashData(Encoding.ASCII.GetBytes(form["code_verifier"].ToString()))));
                var key = Fault == "bad-signature" ? new RsaSecurityKey(RSA.Create(2048)) : new RsaSecurityKey(_rsa);
                key.KeyId = "test-key";
                var now = DateTime.UtcNow;
                var jwt = new JwtSecurityToken(Fault == "bad-issuer" ? "https://untrusted.invalid" : ProviderUrl,
                    Fault == "bad-audience" ? "different-client" : "government-client",
                    new[] { new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64), new Claim("sub", "government-subject"), new Claim("nonce", Fault == "bad-nonce" ? "wrong" : q["nonce"]),
                        new Claim("name", "Government Identity"), new Claim("email", "government-personal@example.invalid") },
                    now.AddHours(-1), Fault == "expired" ? now.AddMinutes(-30) : now.AddMinutes(5),
                    new SigningCredentials(key, SecurityAlgorithms.RsaSha256));
                return Results.Json(new { access_token = "secret-government-token", token_type = "Bearer",
                    id_token = new JwtSecurityTokenHandler().WriteToken(jwt), expires_in = 300 });
            });
            await _provider.StartAsync();
        }

        private async Task StartAppAsync()
        {
            await using (var db = Database()) await db.Database.EnsureCreatedAsync();
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Development" });
            builder.Logging.ClearProviders();
            builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
            var config = TestEnvironment.Configuration(new()
            {
                ["ExternalAuthentication:PublicOrigin"] = "http://127.0.0.1:1",
                ["ExternalAuthentication:UaePass:Enabled"] = "true",
                ["ExternalAuthentication:UaePass:ClientId"] = "test-client",
                ["ExternalAuthentication:UaePass:ClientSecret"] = "test-secret",
                ["ExternalAuthentication:UaePass:Issuer"] = ProviderUrl,
                ["ExternalAuthentication:UaePass:AuthorizationEndpoint"] = ProviderUrl + "/authorize",
                ["ExternalAuthentication:UaePass:TokenEndpoint"] = ProviderUrl + "/token",
                ["ExternalAuthentication:UaePass:UserInformationEndpoint"] = ProviderUrl + "/userinfo",
                ["ExternalAuthentication:Government:Enabled"] = "true",
                ["ExternalAuthentication:Government:Authority"] = ProviderUrl,
                ["ExternalAuthentication:Government:ClientId"] = "government-client",
                ["ExternalAuthentication:Government:ClientSecret"] = "test-government-secret",
                ["JwtSettings:Issuer"] = "sso-tests", ["JwtSettings:Audience"] = "sso-tests",
                ["JwtSettings:SecretKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            });
            builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(_connection));
            builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(o => o.User.RequireUniqueEmail = true)
                .AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();
            builder.Services.AddAuthentication(o =>
            {
                o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(o =>
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = "sso-tests", ValidAudience = "sso-tests",
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["JwtSettings:SecretKey"]!))
                });
            builder.Services.AddAuthorization();
            builder.Services.AddSingleton(new SystemLogChannel(config));
            builder.Services.AddScoped<IAuthService>(p => new AuthService(p.GetRequiredService<UserManager<ApplicationUser>>(),
                p.GetRequiredService<SignInManager<ApplicationUser>>(), new TokenService(config), null!, config));
            builder.Services.AddExternalAuthentication(config, builder.Environment);
            builder.Services.Configure<CookieAuthenticationOptions>(ExternalIdentity.CookieScheme, o => o.TimeProvider = Clock);
            builder.Services.AddControllers().AddApplicationPart(typeof(ExternalAuthController).Assembly);
            App = builder.Build();
            App.UseAuthentication(); App.UseAuthorization(); App.MapControllers();
            App.MapGet("/candidate-only", () => Results.Ok()).RequireAuthorization(p => p.RequireRole(AppRoles.Candidate));
            App.MapGet("/admin-only", () => Results.Ok()).RequireAuthorization(p => p.RequireRole(AppRoles.Admin));
            await App.StartAsync();
            Settings = App.Services.GetRequiredService<ExternalAuthenticationOptions>();
            Settings.PublicOrigin = Address(App);
            await using var scope = App.Services.CreateAsyncScope();
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
            Assert.True((await roles.CreateAsync(new ApplicationRole { Name = AppRoles.Candidate })).Succeeded);
            foreach (var email in new[] { "corporate@example.invalid", "other@example.invalid" })
            {
                var user = new ApplicationUser { Email = email, UserName = email, FullName = "Corporate Candidate" };
                Assert.True((await manager.CreateAsync(user, Password)).Succeeded);
                Assert.True((await manager.AddToRoleAsync(user, AppRoles.Candidate)).Succeeded);
                if (UserId == "") UserId = user.Id;
            }
            await using var database = Database();
            database.Attempts.Add(new Attempt { CandidateId = UserId, AttemptNumber = 1,
                Exam = new Exam { TitleEn = "Existing exam", TitleAr = "Existing exam", Department = new Department { NameEn = "SSO Department", NameAr = "SSO Department" } } });
            await database.SaveChangesAsync();
        }
        public async Task<HttpResponseMessage> AuthenticateAsync(HttpClient client, string provider, string language = "en")
        {
            var start = await client.GetAsync("/api/sso/start/" + provider + "?language=" + language);
            Assert.Equal(HttpStatusCode.Redirect, start.StatusCode);
            var authorize = await client.GetAsync(start.Headers.Location);
            Assert.Equal(HttpStatusCode.Redirect, authorize.StatusCode);
            var callback = await client.GetAsync(authorize.Headers.Location);
            Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
            return callback;
        }
        public Task<JsonElement> SessionAsync(HttpClient client) => ReadSessionAsync(client);
        private static async Task<JsonElement> ReadSessionAsync(HttpClient client) => await JsonAsync(await client.GetAsync("/api/sso/session"));
        public async Task<HttpResponseMessage> PostAsync(HttpClient client, string action, JsonElement session, object body)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/api/sso/" + action) { Content = JsonContent.Create(body) };
            request.Headers.Add("X-SSO-CSRF", session.GetProperty("csrfToken").GetString());
            return await client.SendAsync(request);
        }
        public void AssertSafeLogs()
        {
            var logs = new List<string>();
            var channel = App.Services.GetRequiredService<SystemLogChannel>();
            while (channel.Reader.TryRead(out var log)) logs.Add(JsonSerializer.Serialize(log));
            Assert.Contains(logs, s => s.Contains("SSO."));
            var text = string.Join('\n', logs);
            foreach (var secret in new[] { "secret-provider-token", "secret-code", "test-secret", Password,
                         "secret-remote-response", "secret-profile-response", "personal@example.invalid", "secret-government-token" })
                Assert.DoesNotContain(secret, text);
        }
        public async ValueTask DisposeAsync()
        {
            if (App != null) { await App.StopAsync(); await App.DisposeAsync(); }
            if (_provider != null) { await _provider.StopAsync(); await _provider.DisposeAsync(); }
            await using var db = Database(); await db.Database.EnsureDeletedAsync();
            _rsa.Dispose();
        }
    }

    private sealed class AdjustableClock : TimeProvider
    {
        public TimeSpan Advance { get; set; }
        public override DateTimeOffset GetUtcNow() => DateTimeOffset.UtcNow + Advance;
    }
}
