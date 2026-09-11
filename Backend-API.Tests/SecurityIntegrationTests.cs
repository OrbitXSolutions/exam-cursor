using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Smart_Core.Application.DTOs.Auth;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Domain.Entities.Assessment;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.ExamAssignment;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Hubs;
using Smart_Core.Infrastructure.Services;
using Smart_Core.Infrastructure.Services.Authorization;
using StackExchange.Redis;
using IServer = Microsoft.AspNetCore.Hosting.Server.IServer;

namespace Backend_API.Tests;

public sealed class SecurityIntegrationTests
{
    [SqlServerFact]
    public async Task RefreshRejectsInvalidAccountsAndCredentialsAndRotatesActiveUser()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        foreach (var condition in new[]
                 { "inactive", "pending", "suspended", "blocked", "deleted", "no-expiry", "expired",
                     "no-token", "empty-token", "wrong-token", "missing-user", "bad-access" })
        {
            await using var services = fixture.IdentityServices();
            using var scope = services.CreateScope();
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await fixture.CreateUserAsync(manager, condition, AppRoles.Candidate);
            var request = fixture.RefreshRequest(user);
            switch (condition)
            {
                case "inactive": user.Status = UserStatus.Inactive; break;
                case "pending": user.Status = UserStatus.Pending; break;
                case "suspended": user.Status = UserStatus.Suspended; break;
                case "blocked": user.IsBlocked = true; break;
                case "deleted": user.IsDeleted = true; break;
                case "no-expiry": user.RefreshTokenExpiryTime = null; break;
                case "expired": user.RefreshTokenExpiryTime = DateTimeOffset.UtcNow.AddSeconds(-1); break;
                case "no-token": user.RefreshToken = null; request.RefreshToken = null!; break;
                case "empty-token": user.RefreshToken = ""; request.RefreshToken = ""; break;
                case "wrong-token": request.RefreshToken = "not-the-stored-token"; break;
                case "bad-access": request.AccessToken = "invalid"; break;
            }
            Assert.True((await manager.UpdateAsync(user)).Succeeded);
            if (condition == "missing-user")
                Assert.True((await manager.DeleteAsync(user)).Succeeded);
            var before = user.RefreshToken;
            var result = await fixture.Auth(manager).RefreshTokenAsync(request);
            Assert.False(result.Success, condition);
            Assert.Null(result.Data);
            Assert.Equal(before, user.RefreshToken);
        }

        await using var activeServices = fixture.IdentityServices();
        using var activeScope = activeServices.CreateScope();
        var activeManager = activeScope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var active = await fixture.CreateUserAsync(activeManager, "active", AppRoles.Candidate);
        var original = fixture.RefreshRequest(active);
        var rotated = await fixture.Auth(activeManager).RefreshTokenAsync(original);
        Assert.True(rotated.Success, rotated.Message);
        Assert.NotEqual(original.RefreshToken, rotated.Data!.RefreshToken);
        Assert.NotEqual(original.AccessToken, rotated.Data.AccessToken);
        Assert.Contains(AppRoles.Candidate, rotated.Data.User.Roles);
        Assert.True(active.RefreshTokenExpiryTime > DateTimeOffset.UtcNow);
        Assert.False((await fixture.Auth(activeManager).RefreshTokenAsync(original)).Success);
        await using var verify = fixture.Database();
        Assert.Equal(rotated.Data.RefreshToken,
            (await verify.Users.SingleAsync(u => u.Id == active.Id)).RefreshToken);
    }

    [SqlServerFact]
    public async Task DeactivationClearsRefreshCredentialsAndReactivationCannotRestoreThem()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        await using var services = fixture.IdentityServices();
        using var scope = services.CreateScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await fixture.CreateUserAsync(manager, "deactivate", AppRoles.Candidate);
        var request = fixture.RefreshRequest(user);
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var authorization = new ResourceAuthorizationService(db, manager, new CurrentUser(user.Id));
        var users = new UserService(manager, new CacheService(), db, authorization);
        Assert.True((await users.DeactivateUserAsync(user.Id, user.Id)).Success);
        await using (var verify = fixture.Database())
        {
            var persisted = await verify.Users.SingleAsync(u => u.Id == user.Id);
            Assert.Equal(UserStatus.Inactive, persisted.Status);
            Assert.Null(persisted.RefreshToken);
            Assert.Null(persisted.RefreshTokenExpiryTime);
        }
        Assert.False((await fixture.Auth(manager).RefreshTokenAsync(request)).Success);
        Assert.True((await users.ActivateUserAsync(user.Id, user.Id)).Success);
        Assert.False((await fixture.Auth(manager).RefreshTokenAsync(request)).Success);
        // Existing JWTs remain cryptographically valid; this is not instant access-token revocation.
        Assert.Equal(user.Id, (await fixture.Tokens.ValidateAccessTokenAsync(request.AccessToken)).userId);
    }

    [SqlServerFact]
    public async Task FailedIdentityWritesCannotReportSuccessfulRefreshOrDeactivation()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        await using var services = fixture.IdentityServices();
        using var scope = services.CreateScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await fixture.CreateUserAsync(manager, "stale", AppRoles.Candidate);
        var request = fixture.RefreshRequest(user);
        await using (var concurrent = fixture.Database())
            await concurrent.Users.Where(u => u.Id == user.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.ConcurrencyStamp, Guid.NewGuid().ToString()));
        Assert.False((await fixture.Auth(manager).RefreshTokenAsync(request)).Success);
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var users = new UserService(manager, new CacheService(), db,
            new ResourceAuthorizationService(db, manager, new CurrentUser(user.Id)));
        Assert.False((await users.DeactivateUserAsync(user.Id, user.Id)).Success);
        await using var verify = fixture.Database();
        var persisted = await verify.Users.SingleAsync(u => u.Id == user.Id);
        Assert.Equal(UserStatus.Active, persisted.Status);
        Assert.Equal(request.RefreshToken, persisted.RefreshToken);
    }

    [SecurityHubFact]
    public async Task RealHubRejectsUnjoinedSiblingCrossDepartmentAndSpoofedRoleCalls()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        var seed = await fixture.SeedHubAsync();
        await using var first = await HubServer.StartAsync(fixture);
        await using var second = await HubServer.StartAsync(fixture);
        using var anonymous = new HttpClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.PostAsync(
            first.Address + "/hubs/proctor/negotiate?negotiateVersion=1", null)).StatusCode);
        await using var owner = await first.ConnectAsync(seed.Owner, AppRoles.Candidate);
        await using var monitor = await second.ConnectAsync(seed.SameDepartment, AppRoles.Proctor);
        await owner.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await monitor.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await owner.InvokeAsync("JoinScreenRoom", seed.AttemptId, "candidate");
        await monitor.InvokeAsync("JoinScreenRoom", seed.AttemptId, "proctor");
        await owner.ClearAsync();
        await monitor.ClearAsync();

        foreach (var (id, role) in new[]
                 { (seed.Sibling, AppRoles.Candidate), (seed.CrossDepartment, AppRoles.Proctor),
                     (seed.CrossDepartmentAdmin, AppRoles.Admin), (seed.Owner, AppRoles.Candidate),
                     (seed.SameDepartment, AppRoles.Proctor) })
        {
            await using var attacker = await first.ConnectAsync(id, role);
            if (id != seed.Owner && id != seed.SameDepartment)
            {
                foreach (var room in new[] { "JoinAttemptRoom", "JoinScreenRoom" })
                {
                    await attacker.RejectAsync(room, seed.AttemptId, "candidate");
                    await attacker.RejectAsync(room, seed.AttemptId, "proctor");
                }
            }
            foreach (var (method, args) in AllCalls(seed.AttemptId, owner.ConnectionId))
                await attacker.RejectAsync(method, args);
        }
        await owner.RejectAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await owner.RejectAsync("JoinScreenRoom", seed.AttemptId, "proctor");
        await monitor.RejectAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await monitor.RejectAsync("JoinScreenRoom", seed.AttemptId, "invalid");
        await owner.RejectAsync("SendAnswer", seed.AttemptId, "sdp", monitor.ConnectionId);
        await owner.RejectAsync("SendScreenAnswer", seed.AttemptId, "sdp", monitor.ConnectionId);
        await owner.RejectAsync("SendWarningToCandidate", seed.AttemptId, "warning");
        await owner.RejectAsync("SendTerminationToCandidate", seed.AttemptId, "reason");
        await owner.RejectAsync("NotifyTimeExtended", seed.AttemptId, 5, 600);
        await owner.RejectAsync("RequestRenegotiation", seed.AttemptId);
        await monitor.RejectAsync("SendOffer", seed.AttemptId, "sdp");
        await monitor.RejectAsync("SendScreenOffer", seed.AttemptId, "sdp");
        await monitor.RejectAsync("NotifyExamSubmitted", seed.AttemptId);
        await monitor.RejectAsync("NotifyConnectionStatus", seed.AttemptId, "connected");
        await monitor.RejectAsync("NotifyScreenShareStatus", seed.AttemptId, "started");
        await owner.AssertNoEventsAsync();
        await monitor.AssertNoEventsAsync();
    }

    [SecurityHubFact]
    public async Task RealHubPreservesEntitledStaffAndFrontendDualRoomFlowsAcrossRedisNodes()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        var seed = await fixture.SeedHubAsync();
        await using var first = await HubServer.StartAsync(fixture);
        await using var second = await HubServer.StartAsync(fixture);
        await using var owner = await first.ConnectAsync(seed.Owner, AppRoles.Candidate);
        await owner.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await owner.InvokeAsync("JoinScreenRoom", seed.AttemptId, "candidate");

        foreach (var (id, role) in new[]
                 { (seed.SameDepartment, AppRoles.Proctor), (seed.SameDepartmentAdmin, AppRoles.Admin),
                     (seed.Assigned, AppRoles.Proctor), (seed.NoDepartmentAssigned, AppRoles.Proctor),
                     (seed.SuperAdmin, AppRoles.SuperAdmin) })
        {
            await using var monitor = await second.ConnectAsync(id, role);
            await monitor.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
            Assert.Equal("proctor", (await owner.EventAsync("PeerJoined")).GetProperty("role").GetString());
            await monitor.InvokeAsync("JoinScreenRoom", seed.AttemptId, "proctor");
            Assert.Equal("proctor", (await owner.EventAsync("ScreenPeerJoined")).GetProperty("role").GetString());
            foreach (var screen in new[] { false, true })
            {
                var suffix = screen ? "Screen" : "";
                await owner.InvokeAsync($"Send{suffix}Offer", seed.AttemptId, "offer-sdp");
                Assert.Equal(owner.ConnectionId,
                    (await monitor.EventAsync($"Receive{suffix}Offer")).GetProperty("fromConnectionId").GetString());
                await monitor.InvokeAsync($"Send{suffix}Answer", seed.AttemptId, "answer-sdp", owner.ConnectionId);
                Assert.Equal("answer-sdp",
                    (await owner.EventAsync($"Receive{suffix}Answer")).GetProperty("sdp").GetString());
                await owner.InvokeAsync($"Send{suffix}IceCandidate", seed.AttemptId, "owner-ice", monitor.ConnectionId);
                await monitor.EventAsync($"Receive{suffix}IceCandidate");
                await monitor.InvokeAsync($"Send{suffix}IceCandidate", seed.AttemptId, "monitor-ice", owner.ConnectionId);
                await owner.EventAsync($"Receive{suffix}IceCandidate");
                await owner.InvokeAsync($"Send{suffix}IceCandidate", seed.AttemptId, "broadcast-ice", null);
                await monitor.EventAsync($"Receive{suffix}IceCandidate");
            }
            await monitor.InvokeAsync("RequestRenegotiation", seed.AttemptId);
            await owner.EventAsync("RenegotiationRequested");
            await monitor.InvokeAsync("SendWarningToCandidate", seed.AttemptId, "warning");
            await owner.EventAsync("ReceiveWarning");
            await monitor.InvokeAsync("SendTerminationToCandidate", seed.AttemptId, "reason");
            await owner.EventAsync("SessionTerminated");
            await monitor.InvokeAsync("NotifyTimeExtended", seed.AttemptId, 5, 600);
            await owner.EventAsync("TimeExtended");
            await monitor.EventAsync("TimeExtended");
            await owner.InvokeAsync("NotifyExamSubmitted", seed.AttemptId);
            await monitor.EventAsync("ExamSubmitted");
            await owner.InvokeAsync("NotifyConnectionStatus", seed.AttemptId, "connected");
            await monitor.EventAsync("ConnectionStatusChanged");
            await owner.InvokeAsync("NotifyScreenShareStatus", seed.AttemptId, "started");
            await monitor.EventAsync("ScreenShareStatusChanged");
            await monitor.InvokeAsync("LeaveScreenRoom", seed.AttemptId);
            await owner.EventAsync("ScreenPeerLeft");
            await monitor.InvokeAsync("LeaveAttemptRoom", seed.AttemptId);
            await owner.EventAsync("PeerLeft");
            await owner.AssertNoEventsAsync();
            await monitor.AssertNoEventsAsync();
        }
    }

    [SecurityHubFact]
    public async Task DirectedSignalsCannotCrossAttemptMediaRoleOrDepartedConnection()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        var seed = await fixture.SeedHubAsync();
        await using var first = await HubServer.StartAsync(fixture);
        await using var second = await HubServer.StartAsync(fixture);
        await using var owner = await first.ConnectAsync(seed.Owner, AppRoles.Candidate);
        await using var sibling = await first.ConnectAsync(seed.Sibling, AppRoles.Candidate);
        await using var camera = await second.ConnectAsync(seed.SameDepartment, AppRoles.Proctor);
        await using var screen = await second.ConnectAsync(seed.Assigned, AppRoles.Proctor);
        await owner.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await owner.InvokeAsync("JoinScreenRoom", seed.AttemptId, "candidate");
        await sibling.InvokeAsync("JoinAttemptRoom", seed.SiblingAttemptId, "candidate");
        await sibling.InvokeAsync("JoinScreenRoom", seed.SiblingAttemptId, "candidate");
        await camera.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await screen.InvokeAsync("JoinScreenRoom", seed.AttemptId, "proctor");
        await owner.ClearAsync();
        await camera.ClearAsync();
        await screen.ClearAsync();
        await sibling.ClearAsync();

        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "wrong-attempt", sibling.ConnectionId);
        await screen.InvokeAsync("SendScreenAnswer", seed.AttemptId, "wrong-attempt", sibling.ConnectionId);
        await camera.InvokeAsync("SendIceCandidate", seed.AttemptId, "wrong-attempt", sibling.ConnectionId);
        await screen.InvokeAsync("SendScreenIceCandidate", seed.AttemptId, "wrong-attempt", sibling.ConnectionId);
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "same-role", screen.ConnectionId);
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "self-target", camera.ConnectionId);
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "absent", "not-a-connection");
        await camera.RejectAsync("SendAnswer", seed.AttemptId, "empty-target", "");
        await screen.RejectAsync("SendScreenAnswer", seed.AttemptId, "empty-target", " ");
        await owner.InvokeAsync("SendIceCandidate", seed.AttemptId, "wrong-media", screen.ConnectionId);
        await owner.InvokeAsync("SendScreenIceCandidate", seed.AttemptId, "wrong-media", camera.ConnectionId);
        await owner.InvokeAsync("SendIceCandidate", seed.AttemptId, "same-role", owner.ConnectionId);
        await owner.InvokeAsync("SendScreenIceCandidate", seed.AttemptId, "same-role", owner.ConnectionId);
        await camera.RejectAsync("SendScreenOffer", seed.AttemptId, "not-joined");
        await screen.RejectAsync("SendAnswer", seed.AttemptId, "not-joined", owner.ConnectionId);
        foreach (var client in new[] { owner, sibling, camera, screen })
            await client.AssertNoEventsAsync();

        await owner.InvokeAsync("SendOffer", seed.AttemptId, "camera-only");
        await camera.EventAsync("ReceiveOffer");
        await screen.AssertNoEventsAsync();
        await owner.InvokeAsync("SendScreenOffer", seed.AttemptId, "screen-only");
        await screen.EventAsync("ReceiveScreenOffer");
        await camera.AssertNoEventsAsync();
        await owner.InvokeAsync("NotifyScreenShareStatus", seed.AttemptId, "started");
        await camera.EventAsync("ScreenShareStatusChanged");
        await screen.AssertNoEventsAsync();

        await owner.InvokeAsync("LeaveScreenRoom", seed.AttemptId);
        await screen.EventAsync("ScreenPeerLeft");
        await screen.InvokeAsync("SendScreenAnswer", seed.AttemptId, "left", owner.ConnectionId);
        await screen.InvokeAsync("SendScreenIceCandidate", seed.AttemptId, "left", owner.ConnectionId);
        await owner.RejectAsync("SendScreenOffer", seed.AttemptId, "left");
        await owner.AssertNoEventsAsync();
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "camera-still-joined", owner.ConnectionId);
        await owner.EventAsync("ReceiveAnswer");
        await owner.InvokeAsync("LeaveAttemptRoom", seed.AttemptId);
        await camera.EventAsync("PeerLeft");
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "left", owner.ConnectionId);
        await camera.InvokeAsync("SendIceCandidate", seed.AttemptId, "left", owner.ConnectionId);
        await owner.RejectAsync("SendOffer", seed.AttemptId, "left");
        await owner.AssertNoEventsAsync();

        await owner.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await camera.EventAsync("PeerJoined");
        var disconnectedId = owner.ConnectionId;
        await owner.DisconnectAsync();
        await using var replacement = await first.ConnectAsync(seed.Owner, AppRoles.Candidate);
        Assert.NotEqual(disconnectedId, replacement.ConnectionId);
        await replacement.RejectAsync("SendOffer", seed.AttemptId, "must-rejoin");
        await replacement.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await camera.EventAsync("PeerJoined");
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "old-connection", disconnectedId);
        await replacement.AssertNoEventsAsync();
        await camera.InvokeAsync("SendAnswer", seed.AttemptId, "rejoined", replacement.ConnectionId);
        await replacement.EventAsync("ReceiveAnswer");
    }

    [SecurityHubFact]
    public async Task HubRechecksStaffEntitlementsAfterJoiningAndRejectsDeletedAttempts()
    {
        await using var fixture = await SecurityDatabase.CreateAsync();
        var seed = await fixture.SeedHubAsync();
        await using var first = await HubServer.StartAsync(fixture);
        await using var second = await HubServer.StartAsync(fixture);
        await using var owner = await first.ConnectAsync(seed.Owner, AppRoles.Candidate);
        await using var monitor = await second.ConnectAsync(seed.Assigned, AppRoles.Proctor);
        await owner.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "candidate");
        await owner.InvokeAsync("JoinScreenRoom", seed.AttemptId, "candidate");
        await monitor.InvokeAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await monitor.InvokeAsync("JoinScreenRoom", seed.AttemptId, "proctor");
        await owner.ClearAsync();
        await using (var db = fixture.Database())
            await db.ExamProctors.Where(p => p.ProctorId == seed.Assigned)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsDeleted, true));

        // No administrative push-eviction exists: idle recipients retain join-time membership.
        await owner.InvokeAsync("SendOffer", seed.AttemptId, "idle-receiver");
        await monitor.EventAsync("ReceiveOffer");

        // Even a publisher-only invocation by the revoked monitor must evict both channels,
        // without relying on a cooperative Leave call or a client disconnect.
        await monitor.RejectAsync("SendOffer", seed.AttemptId, "revoked");
        await owner.InvokeAsync("SendOffer", seed.AttemptId, "after-eviction");
        await owner.InvokeAsync("SendScreenOffer", seed.AttemptId, "after-eviction");
        await owner.InvokeAsync("SendIceCandidate", seed.AttemptId, "after-eviction", monitor.ConnectionId);
        await owner.InvokeAsync("SendScreenIceCandidate", seed.AttemptId, "after-eviction", monitor.ConnectionId);
        await first.BroadcastAsync($"attempt_{seed.AttemptId}", "BackendMainNotice");
        await owner.EventAsync("BackendMainNotice");
        await first.BroadcastAsync($"attempt_{seed.AttemptId}_screen", "BackendScreenNotice");
        await owner.EventAsync("BackendScreenNotice");
        await monitor.AssertNoEventsAsync();

        foreach (var (method, args) in AllCalls(seed.AttemptId, owner.ConnectionId))
            await monitor.RejectAsync(method, args);
        await monitor.RejectAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await monitor.RejectAsync("JoinScreenRoom", seed.AttemptId, "proctor");
        await owner.AssertNoEventsAsync();
        await using (var db = fixture.Database())
            await db.Attempts.Where(a => a.Id == seed.AttemptId)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDeleted, true));
        await owner.RejectAsync("SendOffer", seed.AttemptId, "deleted");
        await owner.RejectAsync("JoinScreenRoom", seed.AttemptId, "candidate");
        await using var super = await second.ConnectAsync(seed.SuperAdmin, AppRoles.SuperAdmin);
        await super.RejectAsync("JoinAttemptRoom", seed.AttemptId, "proctor");
        await super.RejectAsync("JoinScreenRoom", int.MaxValue, "proctor");
    }

    private static IEnumerable<(string Method, object?[] Args)> AllCalls(int attempt, string target)
    {
        yield return ("SendOffer", [attempt, "sdp"]);
        yield return ("SendAnswer", [attempt, "sdp", target]);
        yield return ("SendIceCandidate", [attempt, "ice", target]);
        yield return ("SendIceCandidate", [attempt, "ice", null]);
        yield return ("RequestRenegotiation", [attempt]);
        yield return ("NotifyExamSubmitted", [attempt]);
        yield return ("NotifyConnectionStatus", [attempt, "connected"]);
        yield return ("SendWarningToCandidate", [attempt, "warning"]);
        yield return ("SendTerminationToCandidate", [attempt, "reason"]);
        yield return ("NotifyTimeExtended", [attempt, 5, 600]);
        yield return ("SendScreenOffer", [attempt, "sdp"]);
        yield return ("SendScreenAnswer", [attempt, "sdp", target]);
        yield return ("SendScreenIceCandidate", [attempt, "ice", target]);
        yield return ("SendScreenIceCandidate", [attempt, "ice", null]);
        yield return ("NotifyScreenShareStatus", [attempt, "started"]);
        yield return ("LeaveAttemptRoom", [attempt]);
        yield return ("LeaveScreenRoom", [attempt]);
    }

    private sealed class CurrentUser(string id) : ICurrentUserService
    {
        public string? UserId => id;
        public string? Email => null;
        public bool IsAuthenticated => true;
    }

    private sealed class SecurityDatabase : IAsyncDisposable
    {
        private readonly string _connection = new SqlConnectionStringBuilder(SqlServerFactAttribute.ConnectionString)
        {
            InitialCatalog = "RegressionSecurity_" + Guid.NewGuid().ToString("N")
        }.ConnectionString;
        public string Prefix { get; } = "Security:" + Guid.NewGuid().ToString("N");
        public IConfiguration Configuration { get; } = TestEnvironment.Configuration(new()
        {
            ["JwtSettings:SecretKey"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ["JwtSettings:Issuer"] = "security-regression",
            ["JwtSettings:Audience"] = "security-regression",
            ["JwtSettings:AccessTokenExpirationHours"] = "1",
            ["JwtSettings:RefreshTokenExpirationHours"] = "20"
        });
        public TokenService Tokens => new(Configuration);
        public ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(_connection).Options);

        public static async Task<SecurityDatabase> CreateAsync()
        {
            var fixture = new SecurityDatabase();
            await using var db = fixture.Database();
            try { await db.Database.EnsureCreatedAsync(); }
            catch { await db.Database.EnsureDeletedAsync(); throw; }
            return fixture;
        }

        public void AddIdentity(IServiceCollection services)
        {
            services.AddDbContext<ApplicationDbContext>(o => o.UseSqlServer(_connection));
            services.AddIdentityCore<ApplicationUser>().AddRoles<ApplicationRole>()
                .AddEntityFrameworkStores<ApplicationDbContext>();
        }

        public ServiceProvider IdentityServices()
        {
            var services = new ServiceCollection().AddLogging();
            AddIdentity(services);
            return services.BuildServiceProvider();
        }

        public AuthService Auth(UserManager<ApplicationUser> manager)
            => new(manager, null!, Tokens, null!, Configuration);
        public RefreshTokenDto RefreshRequest(ApplicationUser user) => new()
        {
            AccessToken = Tokens.GenerateAccessToken(user, [AppRoles.Candidate]),
            RefreshToken = user.RefreshToken!
        };

        public async Task<ApplicationUser> CreateUserAsync(UserManager<ApplicationUser> manager,
            string name, string role, Department? department = null)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid().ToString("N"), UserName = name, Email = name + "@example.invalid",
                Department = department, RefreshToken = Tokens.GenerateRefreshToken(),
                RefreshTokenExpiryTime = DateTimeOffset.UtcNow.AddHours(1)
            };
            Assert.True((await manager.CreateAsync(user)).Succeeded);
            await using var db = Database();
            if (!await db.Roles.AnyAsync(r => r.Name == role))
            {
                db.Roles.Add(new ApplicationRole { Name = role, NormalizedName = role.ToUpperInvariant() });
                await db.SaveChangesAsync();
            }
            Assert.True((await manager.AddToRoleAsync(user, role)).Succeeded);
            return user;
        }

        public async Task<HubSeed> SeedHubAsync()
        {
            await using var services = IdentityServices();
            using var scope = services.CreateScope();
            var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var department = new Department { NameEn = "Exam department", NameAr = "Exam department" };
            var other = new Department { NameEn = "Other department", NameAr = "Other department" };
            db.Departments.AddRange(department, other);
            await db.SaveChangesAsync();
            var owner = await CreateUserAsync(manager, "owner", AppRoles.Candidate, department);
            var sibling = await CreateUserAsync(manager, "sibling", AppRoles.Candidate, department);
            var same = await CreateUserAsync(manager, "same", AppRoles.Proctor, department);
            var sameAdmin = await CreateUserAsync(manager, "same-admin", AppRoles.Admin, department);
            var cross = await CreateUserAsync(manager, "cross", AppRoles.Proctor, other);
            var crossAdmin = await CreateUserAsync(manager, "cross-admin", AppRoles.Admin, other);
            var assigned = await CreateUserAsync(manager, "assigned", AppRoles.Proctor, other);
            var noDepartment = await CreateUserAsync(manager, "no-department", AppRoles.Proctor);
            var super = await CreateUserAsync(manager, "super", AppRoles.SuperAdmin);
            var exam = new Exam { TitleEn = "Security exam", TitleAr = "Security exam", Department = department };
            var attempt = new Attempt { Exam = exam, Candidate = owner, AttemptNumber = 1 };
            var siblingAttempt = new Attempt { Exam = exam, Candidate = sibling, AttemptNumber = 1 };
            db.Attempts.AddRange(attempt, siblingAttempt);
            db.ExamAssignments.Add(new ExamAssignment { Exam = exam, Candidate = sibling });
            db.ExamProctors.AddRange(new ExamProctor { Exam = exam, Proctor = assigned },
                new ExamProctor { Exam = exam, Proctor = noDepartment });
            await db.SaveChangesAsync();
            return new(attempt.Id, siblingAttempt.Id, owner.Id, sibling.Id, same.Id, sameAdmin.Id,
                cross.Id, crossAdmin.Id, assigned.Id, noDepartment.Id, super.Id);
        }

        public async ValueTask DisposeAsync()
        {
            await using var db = Database();
            await db.Database.EnsureDeletedAsync();
        }
    }

    private sealed record HubSeed(int AttemptId, int SiblingAttemptId, string Owner, string Sibling,
        string SameDepartment, string SameDepartmentAdmin, string CrossDepartment, string CrossDepartmentAdmin,
        string Assigned, string NoDepartmentAssigned, string SuperAdmin);

    private sealed class HubServer(WebApplication app, SecurityDatabase fixture) : IAsyncDisposable
    {
        public string Address => app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses.Single();

        public static async Task<HubServer> StartAsync(SecurityDatabase fixture)
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
            builder.Logging.ClearProviders();
            builder.WebHost.ConfigureKestrel(o => o.Listen(IPAddress.Loopback, 0));
            fixture.AddIdentity(builder.Services);
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
            builder.Services.AddSignalR().AddStackExchangeRedis(RedisFactAttribute.ConnectionString!, o =>
                o.Configuration.ChannelPrefix = RedisChannel.Literal(fixture.Prefix));
            var app = builder.Build();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapHub<ProctorHub>("/hubs/proctor");
            await app.StartAsync();
            return new(app, fixture);
        }

        public Task<HubClient> ConnectAsync(string id, string role) => HubClient.ConnectAsync(this,
            fixture.Tokens.GenerateAccessToken(new ApplicationUser { Id = id, Email = id + "@example.invalid" }, [role]));

        public Task BarrierAsync(string id) => app.Services.GetRequiredService<IHubContext<ProctorHub>>()
            .Clients.Client(id).SendAsync("TestBarrier", new { });

        public Task BroadcastAsync(string group, string target) => app.Services.GetRequiredService<IHubContext<ProctorHub>>()
            .Clients.Group(group).SendAsync(target, new { });

        public async ValueTask DisposeAsync()
        {
            await app.StopAsync();
            await app.DisposeAsync();
        }
    }

    // BCL WebSocket client exercises negotiation, JWT authentication, the actual hub dispatcher,
    // per-connection state, group lifecycle and Redis routing without another test dependency.
    private sealed class HubClient(HubServer server) : IAsyncDisposable
    {
        private readonly ClientWebSocket _socket = new();
        private readonly CancellationTokenSource _stop = new();
        private readonly Channel<JsonElement> _events = Channel.CreateUnbounded<JsonElement>();
        private readonly ConcurrentDictionary<string, TaskCompletionSource<JsonElement>> _pending = new();
        private readonly TaskCompletionSource _handshake = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private Task? _receiving;
        private int _invocation;
        public string ConnectionId { get; private set; } = "";

        public static async Task<HubClient> ConnectAsync(HubServer server, string token)
        {
            var client = new HubClient(server);
            using var http = new HttpClient();
            http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await http.PostAsync(server.Address + "/hubs/proctor/negotiate?negotiateVersion=1", null);
            response.EnsureSuccessStatusCode();
            using var negotiation = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            client.ConnectionId = negotiation.RootElement.GetProperty("connectionId").GetString()!;
            var connectionToken = negotiation.RootElement.GetProperty("connectionToken").GetString()!;
            client._socket.Options.SetRequestHeader("Authorization", "Bearer " + token);
            await client._socket.ConnectAsync(new Uri(server.Address.Replace("http://", "ws://") +
                "/hubs/proctor?id=" + Uri.EscapeDataString(connectionToken)), CancellationToken.None);
            client._receiving = client.ReceiveAsync();
            await client.SendAsync(new { protocol = "json", version = 1 });
            await client._handshake.Task.WaitAsync(TimeSpan.FromSeconds(15));
            return client;
        }

        public async Task InvokeAsync(string method, params object?[] args)
        {
            var result = await InvokeCoreAsync(method, args);
            Assert.False(result.TryGetProperty("error", out var error), $"{method}: {error}");
        }

        public async Task RejectAsync(string method, params object?[] args)
        {
            var result = await InvokeCoreAsync(method, args);
            Assert.True(result.TryGetProperty("error", out _), $"{method} unexpectedly succeeded.");
        }

        private async Task<JsonElement> InvokeCoreAsync(string method, object?[] args)
        {
            var id = Interlocked.Increment(ref _invocation).ToString();
            var completion = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
            Assert.True(_pending.TryAdd(id, completion));
            await SendAsync(new { type = 1, invocationId = id, target = method, arguments = args });
            return await completion.Task.WaitAsync(TimeSpan.FromSeconds(15));
        }

        public async Task<JsonElement> EventAsync(string target)
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            var message = await _events.Reader.ReadAsync(timeout.Token);
            Assert.Equal(target, message.GetProperty("target").GetString());
            return message.GetProperty("arguments")[0];
        }

        public async Task ClearAsync()
        {
            await server.BarrierAsync(ConnectionId);
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
            while ((await _events.Reader.ReadAsync(timeout.Token)).GetProperty("target").GetString() != "TestBarrier") { }
        }

        public async Task AssertNoEventsAsync()
        {
            // Bounded silence check plus an actual round-trip barrier, not an empty local queue check.
            await Task.Delay(150);
            await server.BarrierAsync(ConnectionId);
            await EventAsync("TestBarrier");
        }

        private Task SendAsync(object value) => _socket.SendAsync(
            new ArraySegment<byte>(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value) + "\u001e")),
            WebSocketMessageType.Text, true, _stop.Token);

        private async Task ReceiveAsync()
        {
            var buffer = new byte[8192];
            var text = new StringBuilder();
            try
            {
                while (!_stop.IsCancellationRequested)
                {
                    var result = await _socket.ReceiveAsync(buffer, _stop.Token);
                    if (result.MessageType == WebSocketMessageType.Close) break;
                    text.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
                    var frames = text.ToString().Split('\u001e');
                    text.Clear().Append(frames[^1]);
                    foreach (var frame in frames[..^1])
                    {
                        using var document = JsonDocument.Parse(frame);
                        var message = document.RootElement.Clone();
                        if (!message.TryGetProperty("type", out var type)) _handshake.TrySetResult();
                        else if (type.GetInt32() == 1) await _events.Writer.WriteAsync(message);
                        else if (type.GetInt32() == 3 &&
                                 _pending.TryRemove(message.GetProperty("invocationId").GetString()!, out var pending))
                            pending.TrySetResult(message);
                    }
                }
            }
            catch (OperationCanceledException) when (_stop.IsCancellationRequested) { }
            catch (WebSocketException) when (_stop.IsCancellationRequested) { }
            finally { _events.Writer.TryComplete(); }
        }

        public async Task DisconnectAsync()
        {
            if (_socket.State == WebSocketState.Open)
                await _socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "test complete", CancellationToken.None);
            if (_receiving != null)
                await _receiving.WaitAsync(TimeSpan.FromSeconds(15));
        }

        public async ValueTask DisposeAsync()
        {
            await _stop.CancelAsync();
            _socket.Abort();
            if (_receiving != null) await _receiving;
            _socket.Dispose();
            _stop.Dispose();
        }
    }
}

public sealed class SecurityHubFactAttribute : FactAttribute
{
    public SecurityHubFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(SqlServerFactAttribute.ConnectionString) ||
            string.IsNullOrWhiteSpace(RedisFactAttribute.ConnectionString))
            Skip = "Set TEST_SQLSERVER_CONNECTION and TEST_REDIS_CONNECTION to run real hub security integration tests.";
    }
}
