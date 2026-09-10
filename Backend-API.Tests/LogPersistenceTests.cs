using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests;

public sealed class LogPersistenceTests
{
    private static IConfiguration Configuration() => TestEnvironment.Configuration(new()
    {
        ["SystemLogging:BatchSize"] = "1",
        ["SystemLogging:Capacity"] = "4",
        ["SystemLogging:FlushIntervalSeconds"] = "1",
        ["SystemLogging:FailureBackoffSeconds"] = "1",
        ["SystemLogging:PersistenceTimeoutSeconds"] = "2"
    });

    [Fact]
    public async Task FailedSqlBatchIsDroppedAndNextBatchCanPersistWithoutSensitiveDiagnostics()
    {
        var configuration = Configuration();
        var channel = new SystemLogChannel(configuration);
        var failed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var recovered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var attempted = new ConcurrentQueue<string>();
        var contextsCreated = 0;

        await using var services = new ServiceCollection()
            .AddScoped<ApplicationDbContext>(_ =>
            {
                Interlocked.Increment(ref contextsCreated);
                return new ControlledDbContext((db, _) =>
                {
                    var action = Assert.Single(db.ChangeTracker.Entries<SystemLog>()).Entity.Action;
                    attempted.Enqueue(action);
                    if (action == "failed-batch")
                    {
                        failed.TrySetResult();
                        throw new InvalidOperationException("private-sql-connection-and-payload");
                    }
                    recovered.TrySetResult();
                    return Task.FromResult(1);
                });
            })
            .BuildServiceProvider();
        var logger = new RecordingLogger<LogPersistenceService>();
        using var worker = new LogPersistenceService(channel, services.GetRequiredService<IServiceScopeFactory>(),
            configuration, logger);
        channel.TryWrite(new SystemLog { Action = "failed-batch" });
        await worker.StartAsync(CancellationToken.None);
        try
        {
            await failed.Task.WaitAsync(TimeSpan.FromSeconds(15));
            Assert.True(channel.TryWrite(new SystemLog { Action = "recovered-batch" }));
            await recovered.Task.WaitAsync(TimeSpan.FromSeconds(15));
        }
        finally
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await worker.StopAsync(timeout.Token);
        }

        Assert.Equal(new[] { "failed-batch", "recovered-batch" }, attempted);
        Assert.Equal(2, contextsCreated);
        Assert.All(logger.Entries, entry =>
        {
            Assert.Null(entry.Exception);
            Assert.DoesNotContain("private-", entry.Message);
        });
        Assert.Contains(logger.Entries, entry => entry.Message.Contains("discarded 1 records"));
    }

    [Fact]
    public async Task ShutdownCancelsInFlightPersistenceAndClosesQueue()
    {
        var configuration = Configuration();
        var channel = new SystemLogChannel(configuration);
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var canceled = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var services = new ServiceCollection()
            .AddScoped<ApplicationDbContext>(_ => new ControlledDbContext(async (_, token) =>
            {
                started.SetResult();
                try
                {
                    await Task.Delay(Timeout.InfiniteTimeSpan, token);
                    return 0;
                }
                catch (OperationCanceledException)
                {
                    canceled.SetResult();
                    throw;
                }
            }))
            .BuildServiceProvider();
        using var worker = new LogPersistenceService(channel, services.GetRequiredService<IServiceScopeFactory>(),
            configuration, new RecordingLogger<LogPersistenceService>());
        channel.TryWrite(new SystemLog { Action = "pending" });
        await worker.StartAsync(CancellationToken.None);
        try
        {
            await started.Task.WaitAsync(TimeSpan.FromSeconds(15));
        }
        finally
        {
            using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await worker.StopAsync(timeout.Token);
        }

        Assert.True(canceled.Task.IsCompletedSuccessfully);
        Assert.False(channel.TryWrite(new SystemLog()));
        Assert.NotNull(worker.ExecuteTask);
        Assert.True(worker.ExecuteTask.IsCompletedSuccessfully);
    }

    private sealed class ControlledDbContext(
        Func<ControlledDbContext, CancellationToken, Task<int>> save) : ApplicationDbContext(
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer("Server=unused.invalid;Database=regression;Integrated Security=true")
            .Options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            save(this, cancellationToken);
    }
}
