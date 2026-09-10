using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Middleware;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests;

public sealed class RequestLoggingTests
{
    private static DefaultHttpContext Context(IServiceProvider services, string method = "POST", string? role = null)
    {
        var context = new DefaultHttpContext { RequestServices = services, TraceIdentifier = "test-trace" };
        context.Request.Method = method;
        context.Request.Path = "/api/identity/private-person";
        context.Request.QueryString = new QueryString("?token=private-query");
        context.Request.Headers.Authorization = "******";
        context.Request.Headers.Cookie = "session=private-cookie";
        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, "opaque-user-id") };
        if (role != null) claims.Add(new Claim(ClaimTypes.Role, role));
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "tests"));
        context.SetEndpoint(new RouteEndpoint(_ => Task.CompletedTask,
            RoutePatternFactory.Parse("api/identity/{id}"), 0,
            new EndpointMetadataCollection(new ControllerActionDescriptor { ControllerName = "Identity" }),
            "Identity"));
        return context;
    }

    [Fact]
    public async Task MiddlewareNeverReadsOrReplacesRequestAndResponseStreams()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        using var request = new UnreadableRequestStream();
        using var response = new DirectResponseStream();
        context.Request.Body = request;
        context.Request.ContentLength = 100_000_000;
        context.Response.Body = response;
        var expected = Encoding.UTF8.GetBytes("private-response");
        var middleware = new RequestResponseLoggingMiddleware(async current =>
        {
            Assert.Same(request, current.Request.Body);
            Assert.Same(response, current.Response.Body);
            await current.Response.Body.WriteAsync(expected);
            Assert.Equal(expected.Length, response.WrittenBytes);
            await current.Response.Body.FlushAsync();
        });

        await middleware.InvokeAsync(context);

        Assert.Same(request, context.Request.Body);
        Assert.Same(response, context.Response.Body);
        Assert.Equal(expected.Length, response.WrittenBytes);
        Assert.Equal(1, response.Flushes);
        Assert.True(channel.Reader.TryRead(out var log));
        Assert.Equal("/api/identity/{id}", log.Endpoint);
        Assert.Equal("POST Identity", log.Action);
        Assert.Null(log.RequestBody);
        Assert.Null(log.ResponseBody);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(log));
    }

    [Theory]
    [InlineData("GET", 200, 0)]
    [InlineData("HEAD", 200, 0)]
    [InlineData("OPTIONS", 204, 0)]
    [InlineData("POST", 201, 1)]
    [InlineData("GET", 403, 1)]
    public async Task OnlyMutationsAndFailuresAreEnqueued(string method, int status, int expectedCount)
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services, method);
        var middleware = new RequestResponseLoggingMiddleware(current =>
        {
            current.Response.StatusCode = status;
            return Task.CompletedTask;
        });

        await middleware.InvokeAsync(context);

        var logs = Drain(channel);
        Assert.Equal(expectedCount, logs.Count);
        Assert.All(logs, log => Assert.Equal(status, log.ResponseStatusCode));
    }

    [Fact]
    public async Task FullLogQueueDoesNotPreventApplicationResponse()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration(new() { ["SystemLogging:Capacity"] = "1" }));
        channel.TryWrite(new SystemLog { Action = "already full" });
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        using var body = new MemoryStream();
        context.Response.Body = body;
        var middleware = new RequestResponseLoggingMiddleware(current => current.Response.WriteAsync("success"));

        await middleware.InvokeAsync(context).WaitAsync(TimeSpan.FromSeconds(5));

        Assert.Equal("success", Encoding.UTF8.GetString(body.ToArray()));
        Assert.Equal(1, channel.DroppedCount);
    }

    [Fact]
    public async Task CandidateFailureProducesDetachedCandidateAndDeveloperMetadata()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services, role: AppRoles.Candidate);
        var failure = new InvalidOperationException("private-exception-message");
        var middleware = new RequestResponseLoggingMiddleware(_ => Task.FromException(failure));

        Assert.Same(failure, await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.InvokeAsync(context)));

        var logs = Drain(channel);
        Assert.Equal(new[] { LogCategory.Candidate, LogCategory.Developer }, logs.Select(log => log.Category));
        Assert.NotSame(logs[0], logs[1]);
        Assert.All(logs, log =>
        {
            Assert.Equal(500, log.ResponseStatusCode);
            Assert.Equal("System.InvalidOperationException", log.ExceptionType);
            Assert.Null(log.ErrorMessage);
            Assert.Null(log.StackTrace);
        });
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(logs));
    }

    [Fact]
    public async Task GlobalHandlerAndRequestLoggerDoNotLeakExceptionPayloads()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services);
        using var response = new MemoryStream();
        context.Response.Body = response;
        var logger = new RecordingLogger<GlobalExceptionMiddleware>();
        var failure = new InvalidOperationException("private-database-value",
            new Exception("private-inner-value"));
        failure.Data["private-key"] = "private-data-value";
        var handler = new GlobalExceptionMiddleware(_ => Task.FromException(failure), logger);
        var middleware = new RequestResponseLoggingMiddleware(handler.InvokeAsync);

        await middleware.InvokeAsync(context);

        Assert.Equal(500, context.Response.StatusCode);
        var output = Encoding.UTF8.GetString(response.ToArray());
        Assert.DoesNotContain("private-", output);
        Assert.Contains("test-trace", output);
        var log = Assert.Single(Drain(channel));
        Assert.Equal(500, log.ResponseStatusCode);
        Assert.Equal("System.InvalidOperationException", log.ExceptionType);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(log));
        var diagnostic = Assert.Single(logger.Entries);
        Assert.Null(diagnostic.Exception);
        Assert.DoesNotContain("private-", diagnostic.Message);
    }

    [Fact]
    public async Task ClientDisconnectIsRecordedAs499WithoutExceptionDetails()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        using var services = new ServiceCollection().AddSingleton(channel).BuildServiceProvider();
        var context = Context(services, role: AppRoles.Candidate);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        context.RequestAborted = cancellation.Token;
        var middleware = new RequestResponseLoggingMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        var log = Assert.Single(Drain(channel));
        Assert.Equal(499, log.ResponseStatusCode);
        Assert.Equal(LogCategory.Candidate, log.Category);
        Assert.Null(log.ExceptionType);
    }

    private static List<SystemLog> Drain(SystemLogChannel channel)
    {
        var logs = new List<SystemLog>();
        while (channel.Reader.TryRead(out var log)) logs.Add(log);
        return logs;
    }

    private sealed class UnreadableRequestStream : Stream
    {
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
        public override int Read(byte[] buffer, int offset, int count) => throw new InvalidOperationException("Request payload was read");
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Request payload was read");
        public override void Flush() => throw new NotSupportedException();
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    }

    private sealed class DirectResponseStream : Stream
    {
        public int WrittenBytes { get; private set; }
        public int Flushes { get; private set; }
        public override bool CanRead => false;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => throw new NotSupportedException();
        public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
        public override void Flush() => Flushes++;
        public override int Read(byte[] buffer, int offset, int count) => throw new InvalidOperationException("Response payload was read");
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => WrittenBytes += count;
        public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            WrittenBytes += buffer.Length;
            return ValueTask.CompletedTask;
        }
    }
}

internal sealed class RecordingLogger<T> : ILogger<T>
{
    public System.Collections.Concurrent.ConcurrentQueue<(string Message, Exception? Exception)> Entries { get; } = new();
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
        Func<TState, Exception?, string> formatter) => Entries.Enqueue((formatter(state, exception), exception));
}
