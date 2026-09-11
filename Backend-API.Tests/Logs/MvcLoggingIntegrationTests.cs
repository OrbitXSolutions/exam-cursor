using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Filters.Logs;
using Smart_Core.Infrastructure.Middleware;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests.Logs;

public sealed class MvcLoggingIntegrationTests
{
    [Theory]
    [InlineData("object", 200, 2)]
    [InlineData("json", 200, 0)]
    [InlineData("short-circuit", 403, 1)]
    public async Task MvcSerializesFailureTraceAndLogsOnlyMetadata(string route, int status, int errorCount)
    {
        await using var server = await LoggingServer.StartAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, route + "?token=private-query");
        request.Headers.Add("X-Trace-Id", "private-incoming-trace");
        request.Headers.Add("X-Correlation-ID", "private-incoming-correlation");
        using var response = await server.Client.SendAsync(request);
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.Equal(status, (int)response.StatusCode);
        Assert.False(envelope.GetProperty("success").GetBoolean());
        Assert.Equal("private-message", envelope.GetProperty("message").GetString());
        Assert.Equal(errorCount, envelope.GetProperty("errors").GetArrayLength());
        Assert.False(envelope.TryGetProperty("errorCount", out _));
        var trace = envelope.GetProperty("traceId").GetString();
        Assert.False(string.IsNullOrWhiteSpace(trace));
        Assert.Equal(trace, response.Headers.GetValues("X-Trace-Id").Single());
        Assert.Equal(trace, response.Headers.GetValues("X-Correlation-ID").Single());
        Assert.Equal(trace, completion.Properties["TraceId"]);
        Assert.Equal("Rejected", completion.Properties["Outcome"]);
        Assert.Equal(errorCount, completion.Properties["ErrorCount"]);
        Assert.Equal(status, completion.Properties["StatusCode"]);
        Assert.Equal(LogLevel.Warning, completion.Level);
        Assert.Null(completion.Exception);
        Assert.DoesNotContain("private-", completion.Message);
        Assert.Single(server.Logger.Entries);
        var metadata = Assert.Single(server.Drain());
        Assert.Equal(SystemLogLevel.Warning, metadata.Level);
        Assert.Equal(LogCategory.Developer, metadata.Category);
        Assert.Equal(status, metadata.ResponseStatusCode);
        Assert.Equal(trace, metadata.TraceId);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(metadata));
    }

    [Fact]
    public async Task SuccessfulEnvelopeDoesNotBecomeARejectionOrChangeItsPayload()
    {
        await using var server = await LoggingServer.StartAsync();
        using var response = await server.Client.GetAsync("success");
        var envelope = await response.Content.ReadFromJsonAsync<JsonElement>();
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(envelope.GetProperty("success").GetBoolean());
        Assert.Equal("private-data", envelope.GetProperty("data").GetString());
        Assert.Equal(JsonValueKind.Null, envelope.GetProperty("traceId").ValueKind);
        Assert.Equal("Succeeded", completion.Properties["Outcome"]);
        Assert.Equal(0, completion.Properties["ErrorCount"]);
        Assert.DoesNotContain("private-", completion.Message);
        Assert.Empty(server.Drain());
    }

    [Fact]
    public async Task AutomaticModelValidationRemainsProblemDetailsWithoutPayloadLogging()
    {
        await using var server = await LoggingServer.StartAsync();
        using var response = await server.Client.PostAsJsonAsync("validation", new { });
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(400, problem.GetProperty("status").GetInt32());
        Assert.True(problem.GetProperty("errors").TryGetProperty("Name", out _));
        Assert.Equal("Rejected", completion.Properties["Outcome"]);
        Assert.Equal(0, completion.Properties["ErrorCount"]);
        Assert.DoesNotContain("private-", completion.Message);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(Assert.Single(server.Drain())));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task FileResultsPreserveBytesRangeHeadersAndStreamDisposal(bool partial)
    {
        await using var server = await LoggingServer.StartAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "file");
        if (partial) request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(2, 5);
        using var response = await server.Client.SendAsync(request);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.Equal(partial ? HttpStatusCode.PartialContent : HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(partial ? LoggingProbeController.FileBytes[2..6] : LoggingProbeController.FileBytes, bytes);
        Assert.Equal("application/octet-stream", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("private-filename.bin", response.Content.Headers.ContentDisposition?.ToString());
        Assert.Equal(bytes.Length, response.Content.Headers.ContentLength);
        if (partial) Assert.Equal("bytes 2-5/8", response.Content.Headers.ContentRange?.ToString());
        Assert.True(server.State.FileDisposed);
        Assert.Equal("Succeeded", completion.Properties["Outcome"]);
        Assert.DoesNotContain("private-", completion.Message);
        Assert.Empty(server.Drain());
    }

    [Fact]
    public async Task UnhandledExceptionStillGetsSafeResponseAndMatchingTrace()
    {
        await using var server = await LoggingServer.StartAsync();
        using var response = await server.Client.GetAsync("exception");
        var body = await response.Content.ReadAsStringAsync();
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.DoesNotContain("private-", body);
        using var envelope = JsonDocument.Parse(body);
        Assert.Equal(envelope.RootElement.GetProperty("traceId").GetString(), completion.Properties["TraceId"]);
        Assert.Equal(completion.Properties["TraceId"], response.Headers.GetValues("X-Trace-Id").Single());
        Assert.Equal("Error", completion.Properties["Outcome"]);
        Assert.Equal(LogLevel.Error, completion.Level);
        Assert.Null(completion.Exception);
        Assert.DoesNotContain("private-", completion.Message);
        var metadata = Assert.Single(server.Drain());
        Assert.Equal(500, metadata.ResponseStatusCode);
        Assert.Equal(typeof(InvalidOperationException).FullName, metadata.ExceptionType);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(metadata));
    }

    [Fact]
    public async Task DisconnectDuringStreamingIsNotRewrittenAsServerFailure()
    {
        await using var server = await LoggingServer.StartAsync();
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var pending = server.Client.GetAsync("stream", cancellation.Token);
        await server.State.StreamStarted.Task.WaitAsync(TimeSpan.FromSeconds(10));
        await cancellation.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => pending);
        var completion = await server.Logger.Completion.Task.WaitAsync(TimeSpan.FromSeconds(10));
        Assert.Equal(499, completion.Properties["StatusCode"]);
        Assert.Equal("Disconnected", completion.Properties["Outcome"]);
        Assert.Equal(LogLevel.Warning, completion.Level);
        Assert.Null(completion.Exception);
        Assert.DoesNotContain("private-", completion.Message);
        var metadata = Assert.Single(server.Drain());
        Assert.Equal(499, metadata.ResponseStatusCode);
        Assert.Null(metadata.ExceptionType);
    }

    private sealed record Completion(LogLevel Level, string Message, Exception? Exception,
        Dictionary<string, object?> Properties);

    private sealed class CompletionLogger : ILogger<RequestResponseLoggingMiddleware>
    {
        public ConcurrentQueue<Completion> Entries { get; } = new();
        public TaskCompletionSource<Completion> Completion { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            var completion = new Completion(logLevel, formatter(state, exception), exception,
                ((IEnumerable<KeyValuePair<string, object?>>)state!).ToDictionary(pair => pair.Key, pair => pair.Value));
            Entries.Enqueue(completion);
            Completion.TrySetResult(completion);
        }
    }

    private sealed class LoggingServer(WebApplication app, HttpClient client, SystemLogChannel channel,
        CompletionLogger logger, LoggingProbeState state) : IAsyncDisposable
    {
        public HttpClient Client { get; } = client;
        public CompletionLogger Logger { get; } = logger;
        public LoggingProbeState State { get; } = state;

        public static async Task<LoggingServer> StartAsync()
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions
            {
                ApplicationName = typeof(MvcLoggingIntegrationTests).Assembly.FullName,
                EnvironmentName = Environments.Production
            });
            builder.WebHost.ConfigureKestrel(options => options.Listen(IPAddress.Loopback, 0));
            builder.Logging.ClearProviders();
            var channel = new SystemLogChannel(TestEnvironment.Configuration());
            var logger = new CompletionLogger();
            var state = new LoggingProbeState();
            builder.Services.AddSingleton(channel);
            builder.Services.AddSingleton<ILogger<RequestResponseLoggingMiddleware>>(logger);
            builder.Services.AddSingleton(state);
            builder.Services.AddControllers(options => options.Filters.Add<ApiResponseLoggingFilter>())
                .AddApplicationPart(typeof(LoggingProbeController).Assembly);
            var app = builder.Build();
            try
            {
                app.UseRouting();
                app.UseRequestResponseLogging();
                app.UseGlobalExceptionMiddleware();
                app.MapControllers();
                await app.StartAsync();
                var address = app.Services.GetRequiredService<IServer>().Features
                    .Get<IServerAddressesFeature>()!.Addresses.Single();
                return new LoggingServer(app, new HttpClient
                {
                    BaseAddress = new Uri(address + "/api/logging-probe/"),
                    Timeout = TimeSpan.FromSeconds(15)
                }, channel, logger, state);
            }
            catch
            {
                await app.DisposeAsync();
                throw;
            }
        }

        public List<SystemLog> Drain()
        {
            var logs = new List<SystemLog>();
            while (channel.Reader.TryRead(out var log)) logs.Add(log);
            return logs;
        }

        public async ValueTask DisposeAsync()
        {
            Client.Dispose();
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            try { await app.StopAsync(timeout.Token); }
            finally { await app.DisposeAsync(); }
        }
    }
}

public sealed class LoggingProbeState
{
    public bool FileDisposed { get; set; }
    public TaskCompletionSource StreamStarted { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
}

[ApiController]
[Route("api/logging-probe")]
public sealed class LoggingProbeController(LoggingProbeState state) : ControllerBase
{
    public static readonly byte[] FileBytes = [0, 128, 255, 64, 200, 13, 10, 42];

    [HttpGet("object")]
    public IActionResult ObjectFailure() => Ok(ApiResponse<object>.FailureResponse("private-message",
        ["private-error-one", "private-error-two"]));

    [HttpGet("json")]
    public IActionResult JsonFailure() => new JsonResult(ApiResponse<object>.FailureResponse("private-message"));

    [HttpGet("short-circuit")]
    [LoggingProbeRejection]
    public IActionResult ShortCircuit() => throw new InvalidOperationException("Action must not execute");

    [HttpGet("success")]
    public IActionResult Success() => Ok(ApiResponse<string>.SuccessResponse("private-data"));

    [HttpPost("validation")]
    public IActionResult Validation(LoggingProbeInput input) => throw new InvalidOperationException("Action must not execute");

    [HttpGet("file")]
    public IActionResult Download() => File(new TrackedFile(state), "application/octet-stream",
        "private-filename.bin", enableRangeProcessing: true);

    [HttpGet("exception")]
    public IActionResult Exception() => throw new InvalidOperationException("private-exception-message");

    [HttpGet("stream")]
    public async Task Stream()
    {
        await Response.Body.WriteAsync(Encoding.UTF8.GetBytes("private-stream-payload"), HttpContext.RequestAborted);
        await Response.Body.FlushAsync(HttpContext.RequestAborted);
        state.StreamStarted.TrySetResult();
        await Task.Delay(Timeout.Infinite, HttpContext.RequestAborted);
    }

    private sealed class TrackedFile(LoggingProbeState state) : MemoryStream(FileBytes, writable: false)
    {
        protected override void Dispose(bool disposing)
        {
            state.FileDisposed = true;
            base.Dispose(disposing);
        }
    }
}

public sealed class LoggingProbeInput
{
    [Required(ErrorMessage = "private-validation-message")]
    public string? Name { get; set; }
}

public sealed class LoggingProbeRejectionAttribute : Attribute, IResourceFilter
{
    public void OnResourceExecuting(ResourceExecutingContext context) =>
        context.Result = new ObjectResult(ApiResponse<object>.FailureResponse("private-message", ["private-error"]))
        {
            StatusCode = StatusCodes.Status403Forbidden
        };

    public void OnResourceExecuted(ResourceExecutedContext context) { }
}
