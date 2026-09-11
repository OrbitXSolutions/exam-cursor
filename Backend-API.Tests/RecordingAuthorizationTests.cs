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
using Smart_Core.Controllers.Proctor;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.ExamAssignment;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Middleware;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Authorization;
using Smart_Core.Infrastructure.Storage;

namespace Backend_API.Tests;

public sealed class RecordingAuthorizationTests
{
    [SqlServerFact]
    public async Task RoleGateRejectsAnonymousOwnersSiblingCandidatesAndOtherRoles()
    {
        await using var fixture = await RecordingServer.StartAsync();
        foreach (var actor in new string?[] { null, "owner", "sibling", "instructor", "examiner" })
        {
            using var client = fixture.Client(actor);
            await AssertRoutesAsync(client, fixture.AttemptId,
                actor == null ? HttpStatusCode.Unauthorized : HttpStatusCode.Forbidden);
        }
        using var invalidToken = fixture.Client(null);
        invalidToken.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid");
        await AssertRoutesAsync(invalidToken, fixture.AttemptId, HttpStatusCode.Unauthorized);
    }

    [SqlServerFact]
    public async Task CrossDepartmentStaffAndDeletedAssignmentsCannotReadRecordings()
    {
        await using var fixture = await RecordingServer.StartAsync();
        var results = new List<(string Actor, string Route, HttpStatusCode Status)>();
        foreach (var actor in new[] { "cross-proctor", "cross-admin", "unassigned", "deleted-assignment" })
        {
            using var client = fixture.Client(actor);
            foreach (var route in Routes(fixture.AttemptId))
            {
                using var response = await client.GetAsync(route);
                results.Add((actor, route, response.StatusCode));
            }
            foreach (var route in new[] { $"video-stream/{fixture.AttemptId}", $"video-chunks/{fixture.AttemptId}/chunk_000000.webm" })
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, route);
                request.Headers.Range = new RangeHeaderValue(2, 5);
                using var response = await client.SendAsync(request);
                results.Add((actor, route + " Range: bytes=2-5", response.StatusCode));
            }
        }
        Assert.All(results, result => Assert.True(result.Status == HttpStatusCode.Forbidden,
            $"{result.Actor} GET {result.Route}: expected 403, actual {(int)result.Status}"));
    }

    [SqlServerFact]
    public async Task SameDepartmentAssignedAndSuperAdminStaffCanReadRecordings()
    {
        await using var fixture = await RecordingServer.StartAsync();
        foreach (var actor in new[]
                 { "same-proctor", "same-admin", "assigned-proctor", "assigned-admin", "assigned-no-department", "super" })
        {
            using var client = fixture.Client(actor);
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.OK);
            using var stream = await client.GetAsync($"video-stream/{fixture.AttemptId}");
            Assert.Equal(RecordingServer.VideoBytes, await stream.Content.ReadAsByteArrayAsync());
            using var chunk = await client.GetAsync($"video-chunks/{fixture.AttemptId}/chunk_000000.webm");
            Assert.Equal(RecordingServer.ChunkBytes, await chunk.Content.ReadAsByteArrayAsync());
        }
    }

    [SqlServerFact]
    public async Task EveryRequestRechecksDepartmentAssignmentAndDeletedUserEntitlements()
    {
        await using var fixture = await RecordingServer.StartAsync();
        await using var db = fixture.Database();
        foreach (var actor in new[] { "same-proctor", "assigned-proctor", "assigned-no-department", "same-admin" })
        {
            using var client = fixture.Client(actor);
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.OK);
            var userId = fixture.Actors[actor].User.Id;
            if (actor == "same-proctor")
                await db.Users.Where(u => u.Id == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.DepartmentId, (int?)null));
            else if (actor == "same-admin")
                await db.Users.Where(u => u.Id == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsDeleted, true));
            else
                await db.ExamProctors.Where(ep => ep.ProctorId == userId)
                    .ExecuteUpdateAsync(s => s.SetProperty(ep => ep.IsDeleted, true));
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.Forbidden);
        }
    }

    [SqlServerFact]
    public async Task MissingDeletedAttemptsAndExamsDenyReadsEvenWhenFilesRemain()
    {
        await using var fixture = await RecordingServer.StartAsync();
        await using var db = fixture.Database();
        using var super = fixture.Client("super");
        using var assigned = fixture.Client("assigned-proctor");
        using var sameDepartment = fixture.Client("same-admin");

        var missing = int.MaxValue;
        var orphanDirectory = Path.Combine(fixture.MediaPath, "video-chunks", missing.ToString());
        Directory.CreateDirectory(orphanDirectory);
        await File.WriteAllBytesAsync(Path.Combine(orphanDirectory, "chunk_000000.webm"), RecordingServer.ChunkBytes);
        await AssertRoutesAsync(super, missing, HttpStatusCode.NotFound);

        await db.Attempts.Where(a => a.Id == fixture.AttemptId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDeleted, true));
        foreach (var client in new[] { super, assigned, sameDepartment })
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.NotFound);
        await db.Attempts.IgnoreQueryFilters().Where(a => a.Id == fixture.AttemptId)
            .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDeleted, false));

        await db.Exams.Where(e => e.Id == fixture.ExamId)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.IsDeleted, true));
        foreach (var client in new[] { super, assigned, sameDepartment })
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.NotFound);
        await db.Exams.IgnoreQueryFilters().Where(e => e.Id == fixture.ExamId)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.IsDeleted, false));
        await AssertRoutesAsync(super, fixture.AttemptId, HttpStatusCode.OK);

        // SQL foreign keys prohibit a dangling exam; delete its dependents without deleting disk files.
        await db.ProctorEvidence.ExecuteDeleteAsync();
        await db.ProctorEvents.ExecuteDeleteAsync();
        await db.ProctorSessions.ExecuteDeleteAsync();
        await db.ExamAssignments.ExecuteDeleteAsync();
        await db.ExamProctors.ExecuteDeleteAsync();
        await db.Attempts.ExecuteDeleteAsync();
        await db.Exams.ExecuteDeleteAsync();
        Assert.False(await db.Exams.AnyAsync());
        Assert.True(File.Exists(Path.Combine(fixture.MediaPath, "recording.mp4")));
        Assert.True(File.Exists(Path.Combine(fixture.MediaPath, "video-chunks",
            fixture.AttemptId.ToString(), "chunk_000000.webm")));
        foreach (var client in new[] { super, assigned, sameDepartment })
            await AssertRoutesAsync(client, fixture.AttemptId, HttpStatusCode.NotFound);
    }

    [SqlServerFact]
    public async Task PlaybackPreservesMetadataChunkOrderBytesAndRangeResponses()
    {
        await using var fixture = await RecordingServer.StartAsync();
        using var client = fixture.Client("same-proctor");
        var metadata = await DataAsync(client, $"video-recording/{fixture.AttemptId}");
        Assert.Equal(fixture.AttemptId, metadata.GetProperty("attemptId").GetInt32());
        Assert.Equal("Recording exam", metadata.GetProperty("examTitle").GetString());
        Assert.Equal(fixture.Actors["owner"].User.Id, metadata.GetProperty("candidateName").GetString());
        Assert.Equal($"/api/Proctor/video-stream/{fixture.AttemptId}", metadata.GetProperty("videoUrl").GetString());
        Assert.Equal(JsonValueKind.Null, metadata.GetProperty("chunksUrl").ValueKind);
        Assert.Equal("TabSwitched", Assert.Single(metadata.GetProperty("events").EnumerateArray())
            .GetProperty("eventType").GetString());
        Assert.Equal("/media/screenshot.png", Assert.Single(metadata.GetProperty("screenshots").EnumerateArray())
            .GetProperty("url").GetString());

        var listing = await DataAsync(client, $"video-chunks/{fixture.AttemptId}");
        Assert.Equal(2, listing.GetProperty("totalChunks").GetInt32());
        Assert.Equal(2 * RecordingServer.ChunkBytes.Length, listing.GetProperty("totalSizeBytes").GetInt32());
        Assert.Equal("video/webm;codecs=vp8", listing.GetProperty("mimeType").GetString());
        Assert.Equal(new[] { "chunk_000000.webm", "chunk_000001.webm" },
            listing.GetProperty("chunks").EnumerateArray().Select(c => c.GetProperty("filename").GetString()));

        foreach (var (route, bytes, type) in new[]
                 {
                     ($"video-stream/{fixture.AttemptId}", RecordingServer.VideoBytes, "video/mp4"),
                     ($"video-chunks/{fixture.AttemptId}/chunk_000000.webm", RecordingServer.ChunkBytes, "video/webm")
                 })
        {
            foreach (var range in new RangeHeaderValue?[] { null, new(2, 5), new(null, 3), new(4, null) })
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, route);
                request.Headers.Range = range;
                using var response = await client.SendAsync(request);
                var start = range == null ? 0 : (int)(range.Ranges.Single().From ?? bytes.Length - 3);
                var end = range?.Ranges.Single().From == null ? bytes.Length - 1 :
                    (int)(range.Ranges.Single().To ?? bytes.Length - 1);
                Assert.Equal(range == null ? HttpStatusCode.OK : HttpStatusCode.PartialContent, response.StatusCode);
                Assert.Equal(bytes[start..(end + 1)], await response.Content.ReadAsByteArrayAsync());
                Assert.Equal(type, response.Content.Headers.ContentType?.MediaType);
                Assert.Equal(end - start + 1, response.Content.Headers.ContentLength);
                Assert.Contains("bytes", response.Headers.AcceptRanges);
                if (range != null)
                    Assert.Equal($"bytes {start}-{end}/{bytes.Length}", response.Content.Headers.ContentRange?.ToString());
            }
            using var unsatisfiable = new HttpRequestMessage(HttpMethod.Get, route);
            unsatisfiable.Headers.Range = new RangeHeaderValue(bytes.Length + 1, null);
            using var rejected = await client.SendAsync(unsatisfiable);
            Assert.Equal(HttpStatusCode.RequestedRangeNotSatisfiable, rejected.StatusCode);
            Assert.Empty(await rejected.Content.ReadAsByteArrayAsync());
        }

        await using var db = fixture.Database();
        await db.ProctorEvidence.Where(e => e.Type == EvidenceType.Video)
            .ExecuteUpdateAsync(s => s.SetProperty(e => e.FilePath, $"video-chunks/{fixture.AttemptId}")
                .SetProperty(e => e.ContentType, "video/webm"));
        metadata = await DataAsync(client, $"video-recording/{fixture.AttemptId}");
        Assert.Equal(JsonValueKind.Null, metadata.GetProperty("videoUrl").ValueKind);
        Assert.Equal($"/api/Proctor/video-chunks/{fixture.AttemptId}", metadata.GetProperty("chunksUrl").GetString());
        Assert.Equal("video/webm", metadata.GetProperty("contentType").GetString());
    }

    [SqlServerFact]
    public async Task ChunkFilenameValidationRejectsTraversalAndNonChunkFiles()
    {
        await using var fixture = await RecordingServer.StartAsync();
        using var allowed = fixture.Client("same-proctor");
        using var denied = fixture.Client("cross-proctor");
        foreach (var filename in new[]
                 { "metadata.json", "../recording.mp4", @"..\recording.mp4", "chunk_00000.webm",
                     "chunk_000000.mp4", "chunk_000000.webm.bak", "/recording.mp4", @"C:\recording.mp4" })
        {
            var route = $"video-chunks/{fixture.AttemptId}/{Uri.EscapeDataString(filename)}";
            using var response = await allowed.GetAsync(route);
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            using var unauthorized = await denied.GetAsync(route);
            Assert.Equal(HttpStatusCode.Forbidden, unauthorized.StatusCode);
        }
        using var missing = await allowed.GetAsync($"video-chunks/{fixture.AttemptId}/chunk_999999.webm");
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [SqlServerFact]
    public async Task EvidencePathsCannotEscapeMediaRootAndAuthorizationRunsFirst()
    {
        await using var fixture = await RecordingServer.StartAsync();
        using var allowed = fixture.Client("same-admin");
        using var denied = fixture.Client("cross-admin");
        await using var db = fixture.Database();
        var outsidePath = Path.Combine(fixture.Root, "outside.mp4");
        await File.WriteAllBytesAsync(outsidePath, RecordingServer.VideoBytes);
        foreach (var path in new[] { "../outside.mp4", @"..\outside.mp4", outsidePath, @"C:\outside.mp4" })
        {
            await db.ProctorEvidence.Where(e => e.Type == EvidenceType.Video)
                .ExecuteUpdateAsync(s => s.SetProperty(e => e.FilePath, path));
            foreach (var route in new[] { $"video-recording/{fixture.AttemptId}", $"video-stream/{fixture.AttemptId}" })
            {
                using var response = await allowed.GetAsync(route);
                // Metadata's existing catch returns 500; the exception middleware maps stream's ArgumentException to 400.
                Assert.Equal(route.StartsWith("video-recording/") ? HttpStatusCode.InternalServerError :
                    HttpStatusCode.BadRequest, response.StatusCode);
                Assert.DoesNotContain("synthetic-video-bytes", await response.Content.ReadAsStringAsync());
                using var unauthorized = await denied.GetAsync(route);
                Assert.Equal(HttpStatusCode.Forbidden, unauthorized.StatusCode);
            }
        }
    }

    [SqlServerFact]
    public async Task AuthorizedChunksRemainReadableBeforeFinalizationAndMissingAssetsStayNotFound()
    {
        await using var fixture = await RecordingServer.StartAsync();
        using var allowed = fixture.Client("same-proctor");
        using var denied = fixture.Client("cross-proctor");
        await using var db = fixture.Database();
        await db.ProctorEvidence.Where(e => e.Type == EvidenceType.Video).ExecuteDeleteAsync();
        foreach (var route in new[] { $"video-recording/{fixture.AttemptId}", $"video-stream/{fixture.AttemptId}" })
        {
            using var response = await allowed.GetAsync(route);
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
        foreach (var route in Routes(fixture.AttemptId).Skip(2))
        {
            using var response = await allowed.GetAsync(route);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
        Directory.Delete(Path.Combine(fixture.MediaPath, "video-chunks", fixture.AttemptId.ToString()), true);
        await AssertRoutesAsync(allowed, fixture.AttemptId, HttpStatusCode.NotFound);
        await AssertRoutesAsync(denied, fixture.AttemptId, HttpStatusCode.Forbidden);
    }

    private static string[] Routes(int attemptId) =>
    [
        $"video-recording/{attemptId}", $"video-stream/{attemptId}", $"video-chunks/{attemptId}",
        $"video-chunks/{attemptId}/chunk_000000.webm"
    ];

    private static async Task AssertRoutesAsync(HttpClient client, int attemptId, HttpStatusCode status)
    {
        foreach (var route in Routes(attemptId))
        {
            using var response = await client.GetAsync(route);
            Assert.True(status == response.StatusCode, $"GET {route}: expected {(int)status}, actual {(int)response.StatusCode}");
            if (status != HttpStatusCode.OK)
            {
                Assert.DoesNotContain("video/", response.Content.Headers.ContentType?.MediaType ?? "");
                Assert.DoesNotContain("synthetic-", await response.Content.ReadAsStringAsync());
            }
        }
    }

    private static async Task<JsonElement> DataAsync(HttpClient client, string route)
    {
        using var response = await client.GetAsync(route);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(envelope.GetProperty("success").GetBoolean());
        return envelope.GetProperty("data");
    }

    private sealed class RecordingServer : IAsyncDisposable
    {
        public static readonly byte[] VideoBytes = Encoding.UTF8.GetBytes("synthetic-video-bytes");
        public static readonly byte[] ChunkBytes = Encoding.UTF8.GetBytes("synthetic-chunk-bytes");
        private readonly string _connection = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        {
            InitialCatalog = "RegressionRecording_" + Guid.NewGuid().ToString("N")
        }.ConnectionString;
        private WebApplication? _app;
        public string Root { get; } = Path.GetFullPath(Path.Combine("recording-auth-tests", Guid.NewGuid().ToString("N")));
        public string MediaPath => Path.Combine(Root, "media");
        public int AttemptId { get; private set; }
        public int ExamId { get; private set; }
        public Dictionary<string, (ApplicationUser User, string Role)> Actors { get; } = new();
        private IConfiguration Configuration { get; } = TestEnvironment.Configuration(new()
        {
            ["JwtSettings:SecretKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ["JwtSettings:Issuer"] = "recording-regression",
            ["JwtSettings:Audience"] = "recording-regression",
            ["JwtSettings:AccessTokenExpirationHours"] = "1"
        });

        public ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connection).Options);

        public static async Task<RecordingServer> StartAsync()
        {
            var fixture = new RecordingServer();
            try
            {
                Directory.CreateDirectory(fixture.MediaPath);
                await using (var db = fixture.Database())
                    await db.Database.EnsureCreatedAsync();
                var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
                builder.Logging.ClearProviders();
                builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
                builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(fixture._connection));
                builder.Services.AddIdentityCore<ApplicationUser>().AddRoles<ApplicationRole>()
                    .AddEntityFrameworkStores<ApplicationDbContext>();
                builder.Services.AddHttpContextAccessor();
                builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
                builder.Services.AddScoped<ResourceAuthorizationService>();
                builder.Services.AddSingleton(new StoragePaths(TestEnvironment.Configuration(new()
                {
                    ["MediaStorage:Local:BasePath"] = fixture.MediaPath
                }), new TestEnvironment()));
                builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
                {
                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                            fixture.Configuration["JwtSettings:SecretKey"]!)),
                        ValidIssuer = fixture.Configuration["JwtSettings:Issuer"],
                        ValidAudience = fixture.Configuration["JwtSettings:Audience"],
                        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true
                    };
                });
                builder.Services.AddAuthorization();
                builder.Services.AddControllers().AddApplicationPart(typeof(VideoRecordingController).Assembly);
                fixture._app = builder.Build();
                fixture._app.UseGlobalExceptionMiddleware();
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

        public HttpClient Client(string? actor)
        {
            var address = _app!.Services.GetRequiredService<IServer>()
                .Features.Get<IServerAddressesFeature>()!.Addresses.Single();
            var client = new HttpClient
            {
                BaseAddress = new Uri(address + "/api/Proctor/"), Timeout = TimeSpan.FromSeconds(15)
            };
            if (actor != null)
            {
                var (user, role) = Actors[actor];
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
                    new TokenService(Configuration).GenerateAccessToken(user, [role]));
            }
            return client;
        }

        private async Task SeedAsync()
        {
            using var scope = _app!.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var department = new Department { NameEn = "Recording department", NameAr = "Recording department" };
            var other = new Department { NameEn = "Other department", NameAr = "Other department" };
            db.Departments.AddRange(department, other);
            foreach (var role in AppRoles.AllRoles)
                db.Roles.Add(new ApplicationRole { Name = role, NormalizedName = role.ToUpperInvariant() });
            await db.SaveChangesAsync();
            foreach (var (name, role, dept) in new[]
                     {
                         ("owner", AppRoles.Candidate, department), ("sibling", AppRoles.Candidate, department),
                         ("instructor", AppRoles.Instructor, department), ("examiner", AppRoles.Examiner, department),
                         ("same-proctor", AppRoles.Proctor, department), ("same-admin", AppRoles.Admin, department),
                         ("cross-proctor", AppRoles.Proctor, other), ("cross-admin", AppRoles.Admin, other),
                         ("assigned-proctor", AppRoles.Proctor, other), ("assigned-admin", AppRoles.Admin, other),
                         ("assigned-no-department", AppRoles.Proctor, (Department?)null),
                         ("deleted-assignment", AppRoles.Proctor, other),
                         ("unassigned", AppRoles.Proctor, (Department?)null), ("super", AppRoles.SuperAdmin, other)
                     })
            {
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString("N"), UserName = name, Email = name + "@example.invalid", Department = dept
                };
                Assert.True((await manager.CreateAsync(user)).Succeeded);
                Assert.True((await manager.AddToRoleAsync(user, role)).Succeeded);
                Actors.Add(name, (user, role));
            }
            var owner = Actors["owner"].User;
            var exam = new Exam { TitleEn = "Recording exam", TitleAr = "Recording exam", Department = department };
            var attempt = new Attempt { Exam = exam, Candidate = owner, AttemptNumber = 1, StartedAt = DateTimeOffset.UtcNow };
            db.Attempts.Add(attempt);
            db.ExamAssignments.Add(new ExamAssignment { Exam = exam, Candidate = Actors["sibling"].User, IsActive = true });
            foreach (var name in new[] { "assigned-proctor", "assigned-admin", "assigned-no-department", "deleted-assignment", "sibling" })
                db.ExamProctors.Add(new ExamProctor
                {
                    Exam = exam, Proctor = Actors[name].User, IsDeleted = name == "deleted-assignment"
                });
            var session = new ProctorSession { Attempt = attempt, Exam = exam, Candidate = owner, StartedAt = DateTimeOffset.UtcNow };
            db.ProctorSessions.Add(session);
            await db.SaveChangesAsync();
            AttemptId = attempt.Id;
            ExamId = exam.Id;
            db.ProctorEvidence.AddRange(new ProctorEvidence
            {
                ProctorSession = session, AttemptId = AttemptId, Type = EvidenceType.Video,
                FileName = "recording.mp4", FilePath = "recording.mp4", FileSize = VideoBytes.Length,
                ContentType = "video/mp4", IsUploaded = true, UploadedAt = DateTimeOffset.UtcNow
            }, new ProctorEvidence
            {
                ProctorSession = session, AttemptId = AttemptId, Type = EvidenceType.Image,
                FileName = "screenshot.png", FilePath = "screenshot.png", IsUploaded = true, UploadedAt = DateTimeOffset.UtcNow
            });
            db.ProctorEvents.Add(new ProctorEvent
            {
                ProctorSession = session, AttemptId = AttemptId, EventType = ProctorEventType.TabSwitched,
                OccurredAt = DateTimeOffset.UtcNow, ClientTimestamp = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync();
            await File.WriteAllBytesAsync(Path.Combine(MediaPath, "recording.mp4"), VideoBytes);
            var chunks = Path.Combine(MediaPath, "video-chunks", AttemptId.ToString());
            Directory.CreateDirectory(chunks);
            await File.WriteAllBytesAsync(Path.Combine(chunks, "chunk_000001.webm"), ChunkBytes);
            await File.WriteAllBytesAsync(Path.Combine(chunks, "chunk_000000.webm"), ChunkBytes);
            await File.WriteAllTextAsync(Path.Combine(chunks, "metadata.json"), """{"mimeType":"video/webm;codecs=vp8"}""");
        }

        public async ValueTask DisposeAsync()
        {
            try
            {
                if (_app != null)
                {
                    await _app.StopAsync();
                    await _app.DisposeAsync();
                }
                await using var db = Database();
                await db.Database.EnsureDeletedAsync();
            }
            finally
            {
                if (Directory.Exists(Root)) Directory.Delete(Root, true);
            }
        }
    }
}
