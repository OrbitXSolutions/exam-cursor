using System.Buffers;
using System.IO.Pipelines;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.AspNetCore.SignalR.StackExchangeRedis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using StackExchange.Redis;

namespace Backend_API.Tests;

public sealed class RedisBackplaneTests
{
    [RedisFact]
    [Trait("Category", "Redis")]
    public async Task GroupAndUserMessagesCrossServersButNeverCrossDeploymentPrefixes()
    {
        var prefix = "Regression:" + Guid.NewGuid().ToString("N");
        await using var firstServer = Services(prefix);
        await using var secondServer = Services(prefix);
        await using var isolatedServer = Services(prefix + ":isolated");
        var first = Assert.IsType<RedisHubLifetimeManager<TestHub>>(
            firstServer.GetRequiredService<HubLifetimeManager<TestHub>>());
        var second = Assert.IsType<RedisHubLifetimeManager<TestHub>>(
            secondServer.GetRequiredService<HubLifetimeManager<TestHub>>());
        var isolated = Assert.IsType<RedisHubLifetimeManager<TestHub>>(
            isolatedServer.GetRequiredService<HubLifetimeManager<TestHub>>());
        await using var firstClient = new Client("first");
        await using var secondClient = new Client("candidate");
        await using var isolatedClient = new Client("candidate");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(20));
        await first.OnConnectedAsync(firstClient.Connection).WaitAsync(timeout.Token);
        await second.OnConnectedAsync(secondClient.Connection).WaitAsync(timeout.Token);
        await isolated.OnConnectedAsync(isolatedClient.Connection).WaitAsync(timeout.Token);
        try
        {
            await first.AddToGroupAsync(firstClient.Connection.ConnectionId, "exam", timeout.Token);
            await second.AddToGroupAsync(secondClient.Connection.ConnectionId, "exam", timeout.Token);
            await isolated.AddToGroupAsync(isolatedClient.Connection.ConnectionId, "exam", timeout.Token);

            await first.SendGroupAsync("exam", "ExamUpdated", ["exam-1"], timeout.Token);
            Assert.Equal("ExamUpdated", await firstClient.ReadTargetAsync(timeout.Token));
            Assert.Equal("ExamUpdated", await secondClient.ReadTargetAsync(timeout.Token));

            await first.SendUserAsync("candidate", "CandidateNotification", ["notice-1"], timeout.Token);
            Assert.Equal("CandidateNotification", await secondClient.ReadTargetAsync(timeout.Token));

            await isolated.SendGroupAsync("exam", "IsolatedNotice", [], timeout.Token);
            Assert.Equal("IsolatedNotice", await isolatedClient.ReadTargetAsync(timeout.Token));
            Assert.False(firstClient.HasPendingMessage);
            Assert.False(secondClient.HasPendingMessage);
        }
        finally
        {
            await first.OnDisconnectedAsync(firstClient.Connection);
            await second.OnDisconnectedAsync(secondClient.Connection);
            await isolated.OnDisconnectedAsync(isolatedClient.Connection);
        }
    }

    private static ServiceProvider Services(string prefix)
    {
        var services = new ServiceCollection().AddLogging();
        services.AddSignalR().AddStackExchangeRedis(RedisFactAttribute.ConnectionString!, options =>
        {
            options.Configuration.ChannelPrefix = RedisChannel.Literal(prefix);
        });
        return services.BuildServiceProvider();
    }

    public sealed class TestHub : Hub;

    private sealed class Client : IAsyncDisposable
    {
        private readonly Pipe _input = new();
        private readonly Pipe _output = new();
        private readonly DefaultConnectionContext _transport;
        public HubConnectionContext Connection { get; }

        public Client(string userId)
        {
            _transport = new DefaultConnectionContext(Guid.NewGuid().ToString("N"))
            {
                Transport = new TransportPipe(_input.Reader, _output.Writer)
            };
            Connection = new HubConnectionContext(_transport, new HubConnectionContextOptions(),
                NullLoggerFactory.Instance)
            {
                Protocol = new JsonHubProtocol(),
                UserIdentifier = userId
            };
        }

        public bool HasPendingMessage
        {
            get
            {
                if (!_output.Reader.TryRead(out var read)) return false;
                var hasMessage = !read.Buffer.IsEmpty;
                _output.Reader.AdvanceTo(read.Buffer.End);
                return hasMessage;
            }
        }

        public async Task<string?> ReadTargetAsync(CancellationToken token)
        {
            var read = await _output.Reader.ReadAsync(token);
            var payload = Encoding.UTF8.GetString(read.Buffer.ToArray()).TrimEnd('\u001e');
            _output.Reader.AdvanceTo(read.Buffer.End);
            using var message = JsonDocument.Parse(payload);
            Assert.Equal(1, message.RootElement.GetProperty("type").GetInt32());
            return message.RootElement.GetProperty("target").GetString();
        }

        public async ValueTask DisposeAsync()
        {
            await _input.Writer.CompleteAsync();
            await _input.Reader.CompleteAsync();
            await _output.Writer.CompleteAsync();
            await _output.Reader.CompleteAsync();
            await _transport.DisposeAsync();
        }
    }

    private sealed class TransportPipe(PipeReader input, PipeWriter output) : IDuplexPipe
    {
        public PipeReader Input => input;
        public PipeWriter Output => output;
    }
}

public sealed class RedisFactAttribute : FactAttribute
{
    public static string? ConnectionString => Environment.GetEnvironmentVariable("TEST_REDIS_CONNECTION");

    public RedisFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(ConnectionString))
            Skip = "Set TEST_REDIS_CONNECTION to an isolated Redis instance to run backplane integration tests.";
    }
}
