using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Linq.Expressions;
using System.Net;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Logs;
using Smart_Core.Controllers;
using Smart_Core.Controllers.Logs;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Middleware;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests.Logs;

public sealed class SystemLoggingTests
{
    [Fact]
    public void ChannelRejectsOverflowWithoutWaitingAndCopiesOnlyBoundedMetadata()
    {
        var channel = new SystemLogChannel(Configuration(capacity: 1));
        var input = new SystemLog
        {
            Action = new string('a', 500), Category = LogCategory.Candidate, UserId = "candidate-id",
            UserDisplayName = "private@example.invalid", UserAgent = "private-header",
            RequestBody = "******", ResponseBody = "exam-answer", ErrorMessage = "private-error",
            StackTrace = "private-stack", IpAddress = "private-ip", Endpoint = new string('p', 2000),
            TraceId = "trace\r\ninjection"
        };
        Assert.True(channel.TryWrite(input));
        input.UserId = "changed-after-enqueue";
        var stopwatch = Stopwatch.StartNew();
        for (var i = 0; i < 10000; i++) Assert.False(channel.TryWrite(input));
        Assert.True(stopwatch.Elapsed < TimeSpan.FromSeconds(5));
        Assert.Equal(10000, channel.DroppedCount);
        Assert.True(channel.Reader.TryRead(out var saved));
        Assert.Equal("candidate-id", saved.UserId);
        Assert.Equal(256, saved.Action.Length);
        Assert.Equal(512, saved.Endpoint!.Length);
        Assert.Equal("trace  injection", saved.TraceId);
        Assert.Null(saved.UserDisplayName);
        Assert.Null(saved.UserAgent);
        Assert.Null(saved.IpAddress);
        Assert.Null(saved.RequestBody);
        Assert.Null(saved.ResponseBody);
        Assert.Null(saved.ErrorMessage);
        Assert.Null(saved.StackTrace);
        Assert.False(channel.Reader.TryRead(out _));
        channel.Complete();
        Assert.False(channel.TryWrite(input));
    }

    [Fact]
    public async Task MiddlewareNeverReadsRequestOrReplacesStreamingResponse()
    {
        var channel = new SystemLogChannel(Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        context.Request.Body = new UnreadableBody();
        context.Request.ContentLength = 1024;
        context.Request.QueryString = new QueryString("?access_token=private-query");
        context.Request.Headers.Authorization = "******";
        context.User = User();
        var response = new MemoryStream();
        context.Response.Body = response;
        var bytes = new byte[2 * 1024 * 1024];
        Random.Shared.NextBytes(bytes);
        var middleware = new RequestResponseLoggingMiddleware(async ctx =>
        {
            Assert.Same(response, ctx.Response.Body);
            Assert.IsType<UnreadableBody>(ctx.Request.Body);
            ctx.Response.StatusCode = 201;
            await ctx.Response.Body.WriteAsync(bytes);
        });
        await middleware.InvokeAsync(context);
        Assert.Same(response, context.Response.Body);
        Assert.Equal(bytes, response.ToArray());
        Assert.True(channel.Reader.TryRead(out var log));
        Assert.Equal("/api/attempt/{token}/answers", log.Endpoint);
        Assert.Equal("candidate-id", log.UserId);
        Assert.Equal(LogCategory.Candidate, log.Category);
        Assert.Equal(201, log.ResponseStatusCode);
        Assert.Null(log.RequestBody);
        Assert.Null(log.ResponseBody);
        Assert.Null(log.UserDisplayName);
    }

    [Theory]
    [InlineData("/api/attempt/private-token", "GET", 200, false)]
    [InlineData("/api/attempt/private-token", "GET", 403, true)]
    [InlineData("/api/attempt/private-token", "POST", 200, true)]
    [InlineData("/hubs/proctor", "POST", 500, false)]
    [InlineData("/media/large-video", "GET", 500, false)]
    public async Task MiddlewareLogsOnlyApiMutationsAndFailures(string path, string method, int status, bool expected)
    {
        var channel = new SystemLogChannel(Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        context.Request.Path = path;
        context.Request.Method = method;
        await new RequestResponseLoggingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = status;
            return Task.CompletedTask;
        }).InvokeAsync(context);
        Assert.Equal(expected, channel.Reader.TryRead(out _));
    }

    [Fact]
    public async Task ExceptionLogsContainTypeAndFramesButNoMessagesBodiesOrSecrets()
    {
        var channel = new SystemLogChannel(Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var logger = new RecordingLogger<GlobalExceptionMiddleware>();
        var context = Context(services);
        context.User = User();
        context.Request.RouteValues["attemptId"] = 123;
        context.Response.Body = new MemoryStream();
        var errors = new GlobalExceptionMiddleware(_ => throw new InvalidOperationException(
            "******", new Exception("nested-secret-marker")), logger);
        await new RequestResponseLoggingMiddleware(errors.InvokeAsync).InvokeAsync(context);
        Assert.Equal(500, context.Response.StatusCode);
        var json = Encoding.UTF8.GetString(((MemoryStream)context.Response.Body).ToArray());
        Assert.Contains("trace-test", json);
        Assert.DoesNotContain("secret-marker", json);
        Assert.Single(logger.Messages);
        Assert.Contains(nameof(InvalidOperationException), logger.Messages[0]);
        Assert.Contains("attemptId=123", logger.Messages[0]);
        Assert.Contains("Cause[1] Type=System.Exception", logger.Messages[0]);
        Assert.Contains(nameof(ExceptionLogsContainTypeAndFramesButNoMessagesBodiesOrSecrets), logger.Messages[0]);
        Assert.DoesNotContain("secret-marker", logger.Messages[0]);
        Assert.DoesNotContain("private-token", logger.Messages[0]);
        Assert.DoesNotContain("private@example.invalid", logger.Messages[0]);
        Assert.All(logger.Exceptions, Assert.Null);
        Assert.True(channel.Reader.TryRead(out var candidate));
        Assert.True(channel.Reader.TryRead(out var developer));
        Assert.Equal(LogCategory.Candidate, candidate.Category);
        Assert.Equal(LogCategory.Developer, developer.Category);
        Assert.Equal("System.InvalidOperationException", developer.ExceptionType);
        Assert.Equal(500, developer.ResponseStatusCode);
        Assert.Null(developer.ErrorMessage);
        Assert.Null(developer.StackTrace);
    }

    [Fact]
    public async Task ClientDisconnectDoesNotWriteErrorResponseOrLogServerError()
    {
        var channel = new SystemLogChannel(Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        var logger = new RecordingLogger<GlobalExceptionMiddleware>();
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        context.RequestAborted = cancelled.Token;
        context.Response.Body = new UnreadableBody();
        var middleware = new GlobalExceptionMiddleware(_ => throw new OperationCanceledException(cancelled.Token), logger);
        await new RequestResponseLoggingMiddleware(middleware.InvokeAsync).InvokeAsync(context);
        Assert.Equal(499, context.Response.StatusCode);
        Assert.Empty(logger.Messages);
        Assert.True(channel.Reader.TryRead(out var record));
        Assert.Equal(499, record.ResponseStatusCode);
        Assert.Equal(SystemLogLevel.Warning, record.Level);
        Assert.Null(record.ExceptionType);
    }

    [Fact]
    public async Task StartedResponseIsAbortedWithoutRewritingHeadersOrBody()
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        var context = Context(services);
        var response = new StartedResponseFeature();
        var lifetime = new TrackingLifetimeFeature();
        context.Features.Set<IHttpResponseFeature>(response);
        context.Features.Set<IHttpRequestLifetimeFeature>(lifetime);
        var middleware = new GlobalExceptionMiddleware(_ => throw new IOException("secret-marker"),
            new RecordingLogger<GlobalExceptionMiddleware>());
        await middleware.InvokeAsync(context);
        Assert.True(lifetime.Aborted);
        Assert.Equal(206, response.StatusCode);
        Assert.Null(response.Headers.ContentType.FirstOrDefault());
    }

    [Fact]
    public async Task DisconnectDuringErrorWriteIsHandled()
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        var context = Context(services);
        var lifetime = new TrackingLifetimeFeature();
        context.Features.Set<IHttpRequestLifetimeFeature>(lifetime);
        context.Response.Body = new DisconnectingBody();
        await new GlobalExceptionMiddleware(_ => throw new InvalidOperationException(),
            new RecordingLogger<GlobalExceptionMiddleware>()).InvokeAsync(context);
        Assert.True(lifetime.Aborted);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(false, true)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task CorrelationHeadersSurviveErrorsWithoutReflectingIncomingValues(bool fail, bool loggingEnabled)
    {
        var serviceCollection = new ServiceCollection();
        if (loggingEnabled) serviceCollection.AddSingleton(new SystemLogChannel(Configuration()));
        using var services = serviceCollection.BuildServiceProvider();
        var context = Context(services);
        context.Request.Headers["X-Correlation-ID"] = "private-incoming-value";
        context.Request.Headers["X-Trace-Id"] = "private-incoming-value";
        var response = new StartingResponseFeature();
        context.Features.Set<IHttpResponseFeature>(response);
        var errors = new GlobalExceptionMiddleware(_ => fail
            ? throw new InvalidOperationException("private-error-value")
            : Task.CompletedTask, new RecordingLogger<GlobalExceptionMiddleware>());
        await new RequestResponseLoggingMiddleware(errors.InvokeAsync).InvokeAsync(context);
        await response.StartAsync();
        Assert.Equal("trace-test", response.Headers["X-Correlation-ID"]);
        Assert.Equal("trace-test", response.Headers["X-Trace-Id"]);
        Assert.Equal(fail ? 500 : 200, response.StatusCode);
    }

    [Theory]
    [InlineData(200)]
    [InlineData(201)]
    [InlineData(204)]
    [InlineData(302)]
    [InlineData(400)]
    [InlineData(401)]
    [InlineData(403)]
    [InlineData(404)]
    [InlineData(429)]
    [InlineData(500)]
    [InlineData(503)]
    public async Task CorrelationHeaderIsAvailableOnEveryApiStatus(int status)
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        var context = Context(services);
        var response = new StartingResponseFeature();
        context.Features.Set<IHttpResponseFeature>(response);
        await new RequestResponseLoggingMiddleware(ctx =>
        {
            ctx.Response.StatusCode = status;
            return Task.CompletedTask;
        }).InvokeAsync(context);
        await response.StartAsync();
        Assert.Equal("trace-test", response.Headers["X-Trace-Id"]);
        Assert.Equal(status, response.StatusCode);
    }

    [Theory]
    [InlineData(53, 0, 20)]
    [InlineData(208, 1, 16)]
    [InlineData(-2, 0, 11)]
    [InlineData(18456, 1, 14)]
    public void SqlDiagnosticsDistinguishConnectivitySchemaAndAuthenticationWithoutProviderMessages(int number, byte state, byte severity)
    {
        var sql = SqlFailure(number, state, severity);
        var wrapper = new DbUpdateException("private-wrapper-message", CaptureCause(sql));
        var diagnostics = SafeLogMetadata.Diagnostics(wrapper);
        Assert.Contains("Cause[0] Type=Microsoft.EntityFrameworkCore.DbUpdateException", diagnostics);
        Assert.Contains("Cause[1] Type=Microsoft.Data.SqlClient.SqlException", diagnostics);
        Assert.Contains($"SqlNumber={number} SqlState={state} SqlClass={severity}", diagnostics);
        Assert.Contains(nameof(CaptureCause), diagnostics);
        Assert.DoesNotContain("private-", diagnostics);
    }

    [Fact]
    public void HttpAndIoDiagnosticsIncludeSafeCodesAndInnerMethodFramesOnly()
    {
        var io = CaptureCause(new IOException("private-io-message", unchecked((int)0x80070020)));
        var http = new HttpRequestException("private-url-and-token", io, HttpStatusCode.ServiceUnavailable);
        var diagnostics = SafeLogMetadata.Diagnostics(http);
        Assert.Contains("HttpStatus=503", diagnostics);
        Assert.Contains("Cause[1] Type=System.IO.IOException", diagnostics);
        Assert.Contains("HResult=0x80070020", diagnostics);
        Assert.Contains(nameof(CaptureCause), diagnostics);
        Assert.DoesNotContain("private-", diagnostics);
    }

    [Fact]
    public void ExceptionDiagnosticsBoundDepthAndAggregateBreadth()
    {
        Exception cause = new IOException("private-deepest");
        for (var index = 0; index < 20; index++) cause = new Exception("private-wrapper", cause);
        var deep = SafeLogMetadata.Diagnostics(cause);
        Assert.Contains("Cause[3]", deep);
        Assert.DoesNotContain("Cause[4]", deep);
        var aggregate = new AggregateException(Enumerable.Range(0, 100)
            .Select(_ => new IOException("private-aggregate-message")));
        var broad = SafeLogMetadata.Diagnostics(aggregate);
        Assert.Contains("Cause[3]", broad);
        Assert.DoesNotContain("Cause[4]", broad);
        Assert.True(broad.Length <= 16384);
        Assert.DoesNotContain("private-", deep + broad);
    }

    [Fact]
    public void RouteIdentifiersAllowOnlyNamedNumericEntityIds()
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        var context = Context(services);
        context.Request.RouteValues["id"] = "000123";
        context.Request.RouteValues["attemptId"] = 456;
        context.Request.RouteValues["examId"] = 789L;
        context.Request.RouteValues["token"] = "999999";
        context.Request.RouteValues["userId"] = "123456";
        context.Request.RouteValues["email"] = "private@example.invalid";
        Assert.Equal("id=123 attemptId=456 examId=789", SafeLogMetadata.RouteIdentifiers(context));
    }

    [Theory]
    [InlineData("private-token")]
    [InlineData("+123")]
    [InlineData("-123")]
    [InlineData("1.23")]
    [InlineData("123456789012345678901")]
    public void RouteIdentifiersRejectNonnumericAndOutOfRangeValues(string value)
    {
        using var services = new ServiceCollection().BuildServiceProvider();
        var context = Context(services);
        context.Request.RouteValues["id"] = value;
        Assert.Empty(SafeLogMetadata.RouteIdentifiers(context));
    }

    [Fact]
    public void OptionsAreBoundedAndInvalidConfigurationFallsBack()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SystemLogging:Capacity"] = "-1",
            ["SystemLogging:BatchSize"] = "999999",
            ["SystemLogging:FlushIntervalSeconds"] = "invalid",
            ["SystemLogging:PersistenceTimeoutSeconds"] = "0"
        }).Build();
        var options = SystemLoggingOptions.FromConfiguration(config);
        Assert.Equal(1, options.Capacity);
        Assert.Equal(500, options.BatchSize);
        Assert.Equal(2, options.FlushIntervalSeconds);
        Assert.Equal(1, options.PersistenceTimeoutSeconds);
    }

    [Fact]
    public void MappingMatchesExistingSnapshotWithoutMigration()
    {
        using var db = Database();
        var actual = db.Model.FindEntityType(typeof(SystemLog))!;
        var snapshotType = typeof(ApplicationDbContext).Assembly.GetType("Smart_Core.Migrations.ApplicationDbContextModelSnapshot")!;
        var snapshot = (ModelSnapshot)Activator.CreateInstance(snapshotType, nonPublic: true)!;
        var expected = snapshot.Model.FindEntityType(typeof(SystemLog).FullName!)!;
        Assert.Equal(expected.GetTableName(), actual.GetTableName());
        Assert.Equal(expected.GetProperties().Select(p => p.Name), actual.GetProperties().Select(p => p.Name));
        foreach (var property in expected.GetProperties())
        {
            var mapped = actual.FindProperty(property.Name)!;
            Assert.Equal(property.GetColumnType(), mapped.GetColumnType());
            Assert.Equal(property.IsNullable, mapped.IsNullable);
            Assert.Equal(property.GetMaxLength(), mapped.GetMaxLength());
            Assert.Equal(property.ValueGenerated, mapped.ValueGenerated);
        }
        Assert.Equal(typeof(DateTimeOffset), actual.FindProperty("Timestamp")!.ClrType);
        Assert.Equal(expected.GetIndexes().Select(i => i.GetDatabaseName()).Order(),
            actual.GetIndexes().Select(i => i.GetDatabaseName()).Order());
        Assert.Empty(actual.GetForeignKeys());
    }

    [Fact]
    public void SqlProjectionFiltersAndOrdersWithoutSelectingHistoricalSensitiveColumns()
    {
        using var db = Database();
        var filter = new SystemLogFilterDto
        {
            Level = SystemLogLevel.Error, Search = "search", Action = "POST", Endpoint = "attempt",
            StatusCode = 500, UserId = "candidate-id", DateFrom = DateTimeOffset.UtcNow.AddDays(-2),
            DateTo = DateTimeOffset.UtcNow, PageNumber = 2, PageSize = 20
        };
        var filterMethod = typeof(SystemLogService).GetMethod("Filter", BindingFlags.NonPublic | BindingFlags.Static)!;
        var metadataField = typeof(SystemLogService).GetField("Metadata", BindingFlags.NonPublic | BindingFlags.Static)!;
        var query = (IQueryable<SystemLog>)filterMethod.Invoke(null, [db.SystemLogs.AsNoTracking(), filter])!;
        var projection = (Expression<Func<SystemLog, SystemLogDetailDto>>)metadataField.GetValue(null)!;
        var sql = query.OrderByDescending(log => log.Timestamp).ThenByDescending(log => log.Id)
            .Skip(20).Take(20).Select(projection).ToQueryString();
        Assert.Contains("ORDER BY", sql);
        Assert.Contains("[Timestamp] DESC", sql);
        Assert.Contains("[Id] DESC", sql);
        Assert.Contains("OFFSET", sql);
        Assert.Contains("[ResponseStatusCode]", sql);
        foreach (var column in new[] { "RequestBody", "ResponseBody", "StackTrace", "UserDisplayName", "UserAgent", "IpAddress" })
            Assert.DoesNotContain($"[{column}]", sql);
    }

    [Fact]
    public void ApiRoutesRequireSuperAdminAndKeepSeedAnonymous()
    {
        var controller = typeof(SystemLogsController);
        var auth = controller.GetCustomAttribute<AuthorizeAttribute>()!;
        Assert.Equal(AppRoles.SuperAdmin, auth.Roles);
        Assert.Null(controller.GetCustomAttribute<AllowAnonymousAttribute>());
        var routes = controller.GetMethods().SelectMany(method => method.GetCustomAttributes<HttpGetAttribute>())
            .Select(attribute => attribute.Template).Order().ToArray();
        Assert.Equal(new[] { "candidate", "proctor", "user", "developer", "{id:long}", "stats", "app-logs", "app-errors" }.Order(), routes);
        Assert.NotNull(typeof(SeedController).GetMethod(nameof(SeedController.SeedData))!
            .GetCustomAttribute<AllowAnonymousAttribute>());
        var invalid = new SystemLogFilterDto { PageNumber = int.MaxValue, PageSize = int.MaxValue };
        Assert.False(Validator.TryValidateObject(invalid, new ValidationContext(invalid), [], true));
    }

    [Fact]
    public async Task PersistenceUsesBoundedBatchesAndFreshScopes()
    {
        var configuration = Configuration(capacity: 10, batchSize: 2);
        var channel = new SystemLogChannel(configuration);
        var calls = new List<int>();
        var contexts = new HashSet<ApplicationDbContext>();
        var done = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var services = new ServiceCollection().AddScoped<ApplicationDbContext>(_ =>
            new TestDatabase((db, _) =>
            {
                lock (calls)
                {
                    calls.Add(db.SystemLogs.Local.Count);
                    contexts.Add(db);
                    if (calls.Count == 2) done.TrySetResult();
                }
                return Task.FromResult(1);
            })).BuildServiceProvider();
        for (var i = 0; i < 4; i++) channel.TryWrite(new SystemLog { Action = "POST API" });
        using var worker = new LogPersistenceService(channel, services.GetRequiredService<IServiceScopeFactory>(),
            configuration, new RecordingLogger<LogPersistenceService>());
        await worker.StartAsync(CancellationToken.None);
        await done.Task.WaitAsync(TimeSpan.FromSeconds(10));
        await worker.StopAsync(CancellationToken.None);
        Assert.Equal([2, 2], calls);
        Assert.Equal(2, contexts.Count);
    }

    [Fact]
    public async Task PersistenceOutageCannotBlockRequestsAndDiagnosticsContainNoSqlSecrets()
    {
        var configuration = Configuration(capacity: 2, batchSize: 1);
        var channel = new SystemLogChannel(configuration);
        var saving = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var logger = new RecordingLogger<LogPersistenceService>();
        using var services = new ServiceCollection().AddSingleton(channel).AddScoped<ApplicationDbContext>(_ =>
            new TestDatabase(async (_, token) =>
            {
                saving.TrySetResult();
                await Task.Delay(Timeout.Infinite, token);
                return 0;
            })).BuildServiceProvider();
        channel.TryWrite(new SystemLog { Action = "trigger-persistence" });
        using var worker = new LogPersistenceService(channel, services.GetRequiredService<IServiceScopeFactory>(), configuration, logger);
        await worker.StartAsync(CancellationToken.None);
        await saving.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var stopwatch = Stopwatch.StartNew();
        var middleware = new RequestResponseLoggingMiddleware(_ => Task.CompletedTask);
        for (var i = 0; i < 500; i++) await middleware.InvokeAsync(Context(services));
        Assert.True(stopwatch.Elapsed < TimeSpan.FromSeconds(2), "Exam requests waited for persistence.");
        Assert.True(channel.DroppedCount >= 498);
        await Task.Delay(TimeSpan.FromMilliseconds(1200));
        await worker.StopAsync(CancellationToken.None);
        Assert.Contains(logger.Messages, message => message.Contains("persistence failed"));
        Assert.All(logger.Exceptions, Assert.Null);
    }

    [Fact]
    public async Task FailedBatchesAreDiscardedAndDatabaseExceptionsAreNotRendered()
    {
        var configuration = Configuration(capacity: 2, batchSize: 2);
        var channel = new SystemLogChannel(configuration);
        var logger = new RecordingLogger<LogPersistenceService>();
        var attempts = 0;
        using var services = new ServiceCollection().AddScoped<ApplicationDbContext>(_ =>
            new TestDatabase((_, _) =>
            {
                Interlocked.Increment(ref attempts);
                throw new DbUpdateException("private-provider-message", SqlFailure(208, 1, 16));
            })).BuildServiceProvider();
        channel.TryWrite(new SystemLog { Action = "first" });
        channel.TryWrite(new SystemLog { Action = "second" });
        using var worker = new LogPersistenceService(channel, services.GetRequiredService<IServiceScopeFactory>(), configuration, logger);
        await worker.StartAsync(CancellationToken.None);
        await Task.Delay(TimeSpan.FromMilliseconds(2400));
        await worker.StopAsync(CancellationToken.None);
        Assert.Equal(1, attempts);
        Assert.Contains(logger.Messages, message => message.Contains("discarded 2"));
        Assert.Contains(logger.Messages, message => message.Contains("SqlNumber=208"));
        Assert.DoesNotContain(logger.Messages, message => message.Contains("secret-marker"));
        Assert.DoesNotContain(logger.Messages, message => message.Contains("private-"));
        Assert.All(logger.Exceptions, Assert.Null);
        Assert.False(channel.Reader.TryRead(out _));
    }

    private static IConfiguration Configuration(int capacity = 8, int batchSize = 2) =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["SystemLogging:Capacity"] = capacity.ToString(),
            ["SystemLogging:BatchSize"] = batchSize.ToString(),
            ["SystemLogging:FlushIntervalSeconds"] = "1",
            ["SystemLogging:PersistenceTimeoutSeconds"] = "1",
            ["SystemLogging:FailureBackoffSeconds"] = "1"
        }).Build();

    private static Exception CaptureCause(Exception exception)
    {
        try { throw exception; }
        catch (Exception captured) { return captured; }
    }

    private static SqlException SqlFailure(int number, byte state, byte severity)
    {
        var constructor = typeof(SqlError).GetConstructors(BindingFlags.Instance | BindingFlags.NonPublic)
            .OrderBy(candidate => candidate.GetParameters().Length)
            .First(candidate => candidate.GetParameters().Length >= 7);
        var arguments = constructor.GetParameters().Select((parameter, index) => index switch
        {
            0 => (object)number,
            1 => state,
            2 => severity,
            3 => "private-server",
            4 => "private-sql-message",
            5 => "private-procedure",
            6 => 1,
            _ => parameter.ParameterType.IsValueType ? Activator.CreateInstance(parameter.ParameterType) : null
        }).ToArray();
        var error = (SqlError)constructor.Invoke(arguments);
        var errors = (SqlErrorCollection)Activator.CreateInstance(typeof(SqlErrorCollection), nonPublic: true)!;
        typeof(SqlErrorCollection).GetMethod("Add", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(errors, [error]);
        var factory = typeof(SqlException).GetMethod("CreateException", BindingFlags.Static | BindingFlags.NonPublic,
            binder: null, types: [typeof(SqlErrorCollection), typeof(string)], modifiers: null)!;
        return (SqlException)factory.Invoke(null, [errors, "private-server-version"])!;
    }

    private static DefaultHttpContext Context(IServiceProvider services)
    {
        var context = new DefaultHttpContext { RequestServices = services, TraceIdentifier = "trace-test" };
        context.Request.Path = "/api/attempt/private-token/answers";
        context.Request.Method = "POST";
        context.SetEndpoint(new RouteEndpoint(_ => Task.CompletedTask,
            RoutePatternFactory.Parse("api/attempt/{token}/answers"), 0,
            new EndpointMetadataCollection(new ControllerActionDescriptor { ControllerName = "Attempt" }), "test"));
        return context;
    }

    private static ClaimsPrincipal User() => new(new ClaimsIdentity(
    [
        new Claim(ClaimTypes.NameIdentifier, "candidate-id"),
        new Claim(ClaimTypes.Email, "private@example.invalid"),
        new Claim(ClaimTypes.Role, AppRoles.Candidate)
    ], "test"));

    private static ApplicationDbContext Database() => new(new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseSqlServer("Server=127.0.0.1;Database=MetadataOnly;Integrated Security=true;Connect Timeout=1").Options);

    private sealed class TestDatabase(Func<TestDatabase, CancellationToken, Task<int>> save) : ApplicationDbContext(
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=127.0.0.1;Database=MetadataOnly;Integrated Security=true;Connect Timeout=1").Options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => save(this, cancellationToken);
    }

    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<string> Messages { get; } = [];
        public List<Exception?> Exceptions { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            lock (Messages)
            {
                Messages.Add(formatter(state, exception));
                Exceptions.Add(exception);
            }
        }
    }

    private sealed class UnreadableBody : Stream
    {
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new InvalidOperationException("Body inspection forbidden");
        public override long Position { get => throw new InvalidOperationException(); set => throw new InvalidOperationException(); }
        public override int Read(byte[] buffer, int offset, int count) => throw new InvalidOperationException("Body capture forbidden");
        public override void Write(byte[] buffer, int offset, int count) => throw new InvalidOperationException("Body write forbidden");
        public override void Flush() => throw new InvalidOperationException();
        public override long Seek(long offset, SeekOrigin origin) => throw new InvalidOperationException();
        public override void SetLength(long value) => throw new InvalidOperationException();
    }

    private sealed class DisconnectingBody : MemoryStream
    {
        public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default) =>
            ValueTask.FromException(new IOException("client disconnected"));
        public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            Task.FromException(new IOException("client disconnected"));
    }

    private sealed class StartedResponseFeature : IHttpResponseFeature
    {
        public int StatusCode { get; set; } = 206;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = new UnreadableBody();
        public bool HasStarted => true;
        public void OnStarting(Func<object, Task> callback, object state) { }
        public void OnCompleted(Func<object, Task> callback, object state) { }
    }

    private sealed class StartingResponseFeature : IHttpResponseFeature
    {
        private readonly List<(Func<object, Task> Callback, object State)> _callbacks = [];
        public int StatusCode { get; set; } = 200;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = new MemoryStream();
        public bool HasStarted { get; private set; }
        public void OnStarting(Func<object, Task> callback, object state) => _callbacks.Add((callback, state));
        public void OnCompleted(Func<object, Task> callback, object state) { }
        public async Task StartAsync()
        {
            foreach (var (callback, state) in _callbacks.AsEnumerable().Reverse())
                await callback(state);
            HasStarted = true;
        }
    }

    private sealed class TrackingLifetimeFeature : IHttpRequestLifetimeFeature
    {
        public CancellationToken RequestAborted { get; set; }
        public bool Aborted { get; private set; }
        public void Abort() => Aborted = true;
    }
}
