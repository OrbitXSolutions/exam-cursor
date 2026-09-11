using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Controllers.Proctor;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.ExamAssignment;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Authorization;
using Smart_Core.Infrastructure.Services.Proctor;
using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

public sealed class IdentityAuthorizationTests
{
    private const string Api = "/api/proctor/authentication";
    private static readonly byte[] Png =
        Convert.FromBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=");

    [Fact]
    public void ApplicationDoesNotRegisterAnonymousIdentityStaticFiles()
    {
        var source = File.ReadAllText(Path.GetFullPath(
            "../../../../Backend-API/Program.cs", AppContext.BaseDirectory));
        Assert.DoesNotContain("RequestPath = \"/candidateIDs\"", source);
        Assert.DoesNotContain("app.UseStaticFiles();", source);
        Assert.DoesNotContain("PhysicalFileProvider(candidateIDsPath)", source);
    }

    [SqlServerFact]
    public async Task HttpImagesAndReviewResourcesHonorOwnerDepartmentExplicitAssignmentAndSuperAdmin()
    {
        await using var fixture = await Fixture.StartAsync();
        using var anonymous = fixture.Client();
        foreach (var path in new[] { $"/verifications/{fixture.VerificationId}",
                     $"/verifications/{fixture.VerificationId}/images/document", "/verifications", "/status" })
            Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync(Api + path)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await anonymous.GetAsync($"/candidateIDs/{fixture.OwnerId}/id.png")).StatusCode);

        foreach (var actor in new[] { "owner", "same", "same-admin", "assigned", "no-dept-assigned", "super" })
        {
            using var client = fixture.Client(actor);
            foreach (var kind in new[] { "document", "selfie" })
            {
                using var response = await client.GetAsync($"{Api}/verifications/{fixture.VerificationId}/images/{kind}");
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
                Assert.Equal(Png, await response.Content.ReadAsByteArrayAsync());
                Assert.Equal("image/png", response.Content.Headers.ContentType!.MediaType);
                Assert.True(response.Headers.CacheControl!.NoStore);
                Assert.True(response.Headers.CacheControl.Private);
                Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
            }
            if (actor == "owner")
            {
                Assert.Equal(HttpStatusCode.Forbidden,
                    (await client.GetAsync($"{Api}/verifications/{fixture.VerificationId}")).StatusCode);
                continue;
            }
            using var detail = await client.GetAsync($"{Api}/verifications/{fixture.VerificationId}");
            Assert.Equal(HttpStatusCode.OK, detail.StatusCode);
            var data = (await JsonAsync(detail)).GetProperty("data");
            Assert.Equal($"{Api}/verifications/{fixture.VerificationId}/images/document",
                data.GetProperty("idDocumentUrl").GetString());
            var list = await JsonAsync(await client.GetAsync($"{Api}/verifications"));
            Assert.Contains(list.GetProperty("data").GetProperty("items").EnumerateArray(),
                item => item.GetProperty("id").GetInt32() == fixture.VerificationId);
            Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync(
                $"{Api}/verifications/{fixture.VerificationId}/action", new { action = "Flag", reason = "review" })).StatusCode);
        }

        foreach (var actor in new[] { "sibling", "cross", "cross-admin", "no-dept" })
        {
            using var client = fixture.Client(actor);
            Assert.Equal(HttpStatusCode.NotFound,
                (await client.GetAsync($"{Api}/verifications/{fixture.VerificationId}/images/document")).StatusCode);
            var expected = actor == "sibling" ? HttpStatusCode.Forbidden : HttpStatusCode.NotFound;
            Assert.Equal(expected, (await client.GetAsync($"{Api}/verifications/{fixture.VerificationId}")).StatusCode);
            var action = await client.PostAsJsonAsync($"{Api}/verifications/{fixture.VerificationId}/action",
                new { action = "Reject" });
            Assert.Equal(actor == "sibling" ? HttpStatusCode.Forbidden : HttpStatusCode.BadRequest, action.StatusCode);
            if (actor == "sibling") continue;
            var list = await JsonAsync(await client.GetAsync($"{Api}/verifications?PageSize=1"));
            Assert.DoesNotContain(list.GetProperty("data").GetProperty("items").EnumerateArray(),
                item => item.GetProperty("id").GetInt32() == fixture.VerificationId);
        }

        using var monitor = fixture.Client("same");
        var bulk = await JsonAsync(await monitor.PostAsJsonAsync($"{Api}/bulk-action", new
        {
            ids = new[] { fixture.VerificationId, fixture.OtherVerificationId, int.MaxValue }, action = "Approve"
        }));
        Assert.Equal(1, bulk.GetProperty("data").GetProperty("succeeded").GetInt32());
        Assert.Equal(2, bulk.GetProperty("data").GetProperty("failed").GetInt32());
        await using var db = fixture.Database();
        Assert.Equal(IdentityVerificationStatus.Approved,
            (await db.IdentityVerifications.SingleAsync(v => v.Id == fixture.VerificationId)).Status);
        Assert.Equal(IdentityVerificationStatus.Pending,
            (await db.IdentityVerifications.SingleAsync(v => v.Id == fixture.OtherVerificationId)).Status);
    }

    [SqlServerFact]
    public async Task HttpRechecksRevokedEntitlementsAndConcealsDeletedOrMissingResources()
    {
        await using var fixture = await Fixture.StartAsync();
        using var assigned = fixture.Client("assigned");
        var image = $"{Api}/verifications/{fixture.VerificationId}/images/document";
        Assert.Equal(HttpStatusCode.OK, (await assigned.GetAsync(image)).StatusCode);
        await using (var db = fixture.Database())
            await db.ExamProctors.Where(ep => ep.ProctorId == fixture.UserId("assigned"))
                .ExecuteUpdateAsync(s => s.SetProperty(ep => ep.IsDeleted, true));
        Assert.Equal(HttpStatusCode.NotFound, (await assigned.GetAsync(image)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound,
            (await assigned.GetAsync($"{Api}/verifications/{fixture.VerificationId}")).StatusCode);
        var list = await JsonAsync(await assigned.GetAsync($"{Api}/verifications"));
        Assert.DoesNotContain(list.GetProperty("data").GetProperty("items").EnumerateArray(),
            item => item.GetProperty("id").GetInt32() == fixture.VerificationId);
        var bulk = await JsonAsync(await assigned.PostAsJsonAsync($"{Api}/bulk-action",
            new { ids = new[] { fixture.VerificationId }, action = "Reject" }));
        Assert.Equal(0, bulk.GetProperty("data").GetProperty("succeeded").GetInt32());

        await using (var db = fixture.Database())
            await db.IdentityVerifications.Where(v => v.Id == fixture.VerificationId)
                .ExecuteUpdateAsync(s => s.SetProperty(v => v.IsDeleted, true));
        foreach (var actor in new[] { "owner", "super" })
        {
            using var client = fixture.Client(actor);
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(image)).StatusCode);
            Assert.Equal(HttpStatusCode.NotFound,
                (await client.GetAsync($"{Api}/verifications/{int.MaxValue}/images/document")).StatusCode);
        }
    }

    [SqlServerFact]
    public async Task HttpSupportsStoredLegacyIdentityPathsButRejectsTraversalForeignDocumentsAndUnsafeImages()
    {
        await using var fixture = await Fixture.StartAsync();
        using var owner = fixture.Client("owner");
        var image = $"{Api}/verifications/{fixture.VerificationId}/images/document";
        foreach (var path in new[]
        {
            "id.png", $"{fixture.OwnerId}/id.png", $"candidateIDs/{fixture.OwnerId}/id.png",
            $"/candidateIDs/{fixture.OwnerId}/id.png", $"candidateIDs\\{fixture.OwnerId}\\id.png",
            $"https://old.example.invalid/candidateIDs/{fixture.OwnerId}/id.png"
        })
        {
            await fixture.SetDocumentAsync(path);
            using var response = await owner.GetAsync(image);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(Png, await response.Content.ReadAsByteArrayAsync());
        }
        foreach (var path in new[]
        {
            "../outside.png", $"candidateIDs/{fixture.OwnerId}/../../outside.png",
            $"candidateIDs/{fixture.OwnerId}/../{fixture.UserId("other")}/id.png",
            $"candidateIDs/{fixture.UserId("other")}/id.png",
            $"https://old.example.invalid/candidateIDs/{fixture.OwnerId}/%2e%2e%2foutside.png",
            $"https://old.example.invalid/candidateIDs/{fixture.OwnerId}/id.png?token=forbidden",
            "https://outside.example.invalid/private.png", "file:///outside.png",
            "/media/private.png", "id.png:stream", "malicious.svg", "invalid.png", "missing.png"
        })
        {
            await fixture.SetDocumentAsync(path);
            Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(image)).StatusCode);
        }
        var directory = Path.Combine(fixture.Paths.IdentityPath, fixture.OwnerId);
        File.CreateSymbolicLink(Path.Combine(directory, "linked.png"), Path.Combine(fixture.Root, "outside.png"));
        await fixture.SetDocumentAsync("linked.png");
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(image)).StatusCode);
        Directory.CreateSymbolicLink(Path.Combine(directory, "linked-dir"), fixture.Root);
        await fixture.SetDocumentAsync($"{fixture.OwnerId}/linked-dir/outside.png");
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(image)).StatusCode);

        foreach (var (name, type, bytes) in new[]
        {
            ("legacy.jpeg", "image/jpeg", new byte[] { 255, 216, 255, 224, 0, 1 }),
            ("legacy.webp", "image/webp", Encoding.ASCII.GetBytes("RIFF1234WEBP"))
        })
        {
            await File.WriteAllBytesAsync(Path.Combine(directory, name), bytes);
            await fixture.SetDocumentAsync(name);
            using var response = await owner.GetAsync(image);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(type, response.Content.Headers.ContentType!.MediaType);
            Assert.Equal(bytes, await response.Content.ReadAsByteArrayAsync());
        }
    }

    [SqlServerFact]
    public async Task CandidateSubmitRemainsValidatedAndPrivateAndCanReloadOwnImages()
    {
        await using var fixture = await Fixture.StartAsync();
        using var owner = fixture.Client("owner");
        using (var bad = Upload(Encoding.UTF8.GetBytes("<script>invalid image</script>")))
            Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsync($"{Api}/submit", bad)).StatusCode);
        using (var good = Upload(Png))
            Assert.Equal(HttpStatusCode.OK, (await owner.PostAsync($"{Api}/submit", good)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"{Api}/status")).StatusCode);
        using var image = await owner.GetAsync($"{Api}/verifications/{fixture.VerificationId}/images/selfie");
        Assert.Equal(HttpStatusCode.OK, image.StatusCode);
        Assert.Equal(Png, await image.Content.ReadAsByteArrayAsync());
        await using var db = fixture.Database();
        var stored = await db.IdentityVerifications.SingleAsync(v => v.Id == fixture.VerificationId);
        Assert.StartsWith($"candidateIDs/{fixture.OwnerId}/selfie_", stored.SelfiePath);
        using var anonymous = fixture.Client();
        Assert.Equal(HttpStatusCode.NotFound, (await anonymous.GetAsync("/" + stored.SelfiePath)).StatusCode);
    }

    private static MultipartFormDataContent Upload(byte[] bytes)
    {
        var content = new MultipartFormDataContent();
        foreach (var name in new[] { "selfiePhoto", "idPhoto" })
        {
            var file = new ByteArrayContent(bytes);
            file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
            content.Add(file, name, "id.png");
        }
        content.Add(new StringContent("Emirates ID"), "idDocumentType");
        return content;
    }

    private static async Task<JsonElement> JsonAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.Clone();
    }

    private sealed class Fixture : IAsyncDisposable
    {
        private readonly string _connection = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        {
            InitialCatalog = "RegressionIdentity_" + Guid.NewGuid().ToString("N")
        }.ConnectionString;
        private readonly Dictionary<string, (ApplicationUser User, string Role)> _users = [];
        private readonly IConfiguration _configuration = TestEnvironment.Configuration(new()
        {
            ["JwtSettings:SecretKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ["JwtSettings:Issuer"] = "identity-regression",
            ["JwtSettings:Audience"] = "identity-regression",
            ["JwtSettings:AccessTokenExpirationHours"] = "1"
        });
        private WebApplication _app = null!;
        public string Root { get; } = Path.GetFullPath(Path.Combine("identity-authorization-fixtures",
            Guid.NewGuid().ToString("N")));
        public StoragePaths Paths { get; private set; } = null!;
        public int VerificationId { get; private set; }
        public int OtherVerificationId { get; private set; }
        public string OwnerId => UserId("owner");
        public string UserId(string name) => _users[name].User.Id;
        public ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connection).Options);

        public static async Task<Fixture> StartAsync()
        {
            var fixture = new Fixture();
            try
            {
                await using (var db = fixture.Database())
                    await db.Database.EnsureCreatedAsync();
                Directory.CreateDirectory(fixture.Root);
                var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
                builder.Logging.ClearProviders();
                builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
                builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(fixture._connection));
                builder.Services.AddIdentityCore<ApplicationUser>().AddRoles<ApplicationRole>()
                    .AddEntityFrameworkStores<ApplicationDbContext>();
                builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
                {
                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                            fixture._configuration["JwtSettings:SecretKey"]!)),
                        ValidIssuer = fixture._configuration["JwtSettings:Issuer"],
                        ValidAudience = fixture._configuration["JwtSettings:Audience"],
                        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true
                    };
                });
                builder.Services.AddAuthorization();
                builder.Services.AddHttpContextAccessor();
                builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
                builder.Services.AddScoped<ResourceAuthorizationService>();
                builder.Services.AddScoped<IIdentityVerificationService, IdentityVerificationService>();
                fixture.Paths = new StoragePaths(TestEnvironment.Configuration(), new TestEnvironment
                {
                    ContentRootPath = fixture.Root
                });
                builder.Services.AddSingleton(fixture.Paths);
                builder.Services.AddControllers().AddApplicationPart(typeof(IdentityVerificationController).Assembly);
                fixture._app = builder.Build();
                fixture._app.UseAuthentication();
                fixture._app.UseAuthorization();
                fixture._app.MapControllers();
                await fixture.SeedAsync();
                await fixture._app.StartAsync();
                return fixture;
            }
            catch
            {
                await fixture.DisposeAsync();
                throw;
            }
        }

        private async Task SeedAsync()
        {
            await using var scope = _app.Services.CreateAsyncScope();
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var department = new Department { NameEn = "Identity department", NameAr = "Identity department" };
            var other = new Department { NameEn = "Other department", NameAr = "Other department" };
            db.Departments.AddRange(department, other);
            await db.SaveChangesAsync();
            foreach (var (name, role, dept) in new[]
            {
                ("owner", AppRoles.Candidate, department), ("sibling", AppRoles.Candidate, department),
                ("same", AppRoles.Proctor, department), ("same-admin", AppRoles.Admin, department),
                ("cross", AppRoles.Proctor, other), ("cross-admin", AppRoles.Admin, other),
                ("assigned", AppRoles.Proctor, other), ("no-dept-assigned", AppRoles.Proctor, (Department?)null),
                ("no-dept", AppRoles.Proctor, (Department?)null), ("super", AppRoles.SuperAdmin, (Department?)null),
                ("other", AppRoles.Candidate, other)
            })
            {
                if (!await db.Roles.AnyAsync(r => r.Name == role))
                {
                    db.Roles.Add(new ApplicationRole { Name = role, NormalizedName = role.ToUpperInvariant() });
                    await db.SaveChangesAsync();
                }
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString("N"), UserName = name, Email = name + "@example.invalid",
                    Department = dept
                };
                Assert.True((await manager.CreateAsync(user)).Succeeded);
                Assert.True((await manager.AddToRoleAsync(user, role)).Succeeded);
                _users.Add(name, (user, role));
            }
            var exam = new Exam { TitleEn = "Identity exam", TitleAr = "Identity exam", Department = department };
            db.Attempts.Add(new Attempt { Exam = exam, CandidateId = OwnerId, AttemptNumber = 1 });
            db.ExamAssignments.Add(new ExamAssignment { Exam = exam, CandidateId = UserId("sibling") });
            db.ExamProctors.AddRange(new ExamProctor { Exam = exam, ProctorId = UserId("assigned") },
                new ExamProctor { Exam = exam, ProctorId = UserId("no-dept-assigned") });
            var verification = new IdentityVerification
            {
                CandidateId = OwnerId, IdDocumentPath = $"candidateIDs/{OwnerId}/id.png",
                SelfiePath = $"candidateIDs/{OwnerId}/selfie.png", IdDocumentUploaded = true
            };
            var otherVerification = new IdentityVerification
            {
                CandidateId = UserId("other"), IdDocumentPath = $"candidateIDs/{UserId("other")}/id.png"
            };
            db.IdentityVerifications.AddRange(verification, otherVerification);
            await db.SaveChangesAsync();
            VerificationId = verification.Id;
            OtherVerificationId = otherVerification.Id;
            foreach (var id in new[] { OwnerId, UserId("other") })
            {
                var directory = Path.Combine(Paths.IdentityPath, id);
                Directory.CreateDirectory(directory);
                await File.WriteAllBytesAsync(Path.Combine(directory, "id.png"), Png);
                await File.WriteAllBytesAsync(Path.Combine(directory, "selfie.png"), Png);
                await File.WriteAllTextAsync(Path.Combine(directory, "invalid.png"), "<html>not an image</html>");
                await File.WriteAllTextAsync(Path.Combine(directory, "malicious.svg"), "<svg/>");
            }
            await File.WriteAllBytesAsync(Path.Combine(Root, "outside.png"), Png);
        }

        public HttpClient Client(string? name = null)
        {
            var client = new HttpClient { BaseAddress = new Uri(_app.Services.GetRequiredService<IServer>()
                .Features.Get<IServerAddressesFeature>()!.Addresses.Single()) };
            if (name != null)
            {
                var (user, role) = _users[name];
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
                    new TokenService(_configuration).GenerateAccessToken(user, [role]));
            }
            return client;
        }

        public async Task SetDocumentAsync(string path)
        {
            await using var db = Database();
            await db.IdentityVerifications.Where(v => v.Id == VerificationId)
                .ExecuteUpdateAsync(s => s.SetProperty(v => v.IdDocumentPath, path));
        }

        public async ValueTask DisposeAsync()
        {
            if (_app != null)
            {
                await _app.StopAsync();
                await _app.DisposeAsync();
            }
            await using var db = Database();
            await db.Database.EnsureDeletedAsync();
            if (Directory.Exists(Root))
                Directory.Delete(Root, recursive: true);
        }
    }
}
