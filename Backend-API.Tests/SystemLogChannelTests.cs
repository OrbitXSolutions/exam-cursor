using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Services.Logs;

namespace Backend_API.Tests;

public sealed class SystemLogChannelTests
{
    [Fact]
    public void FullQueueRejectsNewestRecordWithoutBlockingAndCountsDrops()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration(new()
        {
            ["SystemLogging:Capacity"] = "2"
        }));

        Assert.True(channel.TryWrite(new SystemLog { Action = "first" }));
        Assert.True(channel.TryWrite(new SystemLog { Action = "second" }));
        Assert.False(channel.TryWrite(new SystemLog { Action = "dropped" }));
        Assert.Equal(1, channel.DroppedCount);
        Assert.True(channel.Reader.TryRead(out var first));
        Assert.Equal("first", first.Action);
        Assert.True(channel.TryWrite(new SystemLog { Action = "replacement" }));
        Assert.True(channel.Reader.TryRead(out var second));
        Assert.Equal("second", second.Action);
        Assert.True(channel.Reader.TryRead(out var replacement));
        Assert.Equal("replacement", replacement.Action);
        Assert.False(channel.Reader.TryRead(out _));
    }

    [Fact]
    public async Task ConcurrentWritersCannotGrowQueueBeyondCapacity()
    {
        const int capacity = 16;
        var channel = new SystemLogChannel(TestEnvironment.Configuration(new()
        {
            ["SystemLogging:Capacity"] = capacity.ToString()
        }));
        var writes = await Task.WhenAll(Enumerable.Range(0, 256)
            .Select(i => Task.Run(() => channel.TryWrite(new SystemLog { Action = i.ToString() }))));

        Assert.Equal(capacity, writes.Count(accepted => accepted));
        Assert.Equal(256 - capacity, channel.DroppedCount);
        var readCount = 0;
        while (channel.Reader.TryRead(out _)) readCount++;
        Assert.Equal(capacity, readCount);
    }

    [Fact]
    public void EnqueueDetachesMetadataAndDiscardsPayloadsAndIdentifyingFields()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        var original = new SystemLog
        {
            Action = "POST Identity",
            Category = LogCategory.Candidate,
            UserId = "person@example.test",
            UserDisplayName = "Private Name",
            RequestBody = "private request",
            ResponseBody = "private response",
            ErrorMessage = "private error",
            StackTrace = "private stack",
            IpAddress = "192.0.2.1",
            UserAgent = "private user agent"
        };

        Assert.True(channel.TryWrite(original));
        original.Action = "mutated";
        original.Category = LogCategory.Developer;

        Assert.True(channel.Reader.TryRead(out var saved));
        Assert.NotSame(original, saved);
        Assert.Equal("POST Identity", saved.Action);
        Assert.Equal(LogCategory.Candidate, saved.Category);
        Assert.NotEqual(default, saved.Timestamp);
        Assert.Null(saved.UserId);
        Assert.Null(saved.UserDisplayName);
        Assert.Null(saved.RequestBody);
        Assert.Null(saved.ResponseBody);
        Assert.Null(saved.ErrorMessage);
        Assert.Null(saved.StackTrace);
        Assert.Null(saved.IpAddress);
        Assert.Null(saved.UserAgent);
    }

    [Fact]
    public void MetadataHasHardSizeLimitsAndNoControlCharacters()
    {
        var oversized = new string('x', 2048);
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        channel.TryWrite(new SystemLog
        {
            Action = "\r\n" + oversized,
            UserId = oversized,
            UserRole = oversized,
            Controller = oversized,
            Endpoint = oversized,
            HttpMethod = oversized,
            ExceptionType = oversized,
            TraceId = oversized
        });

        Assert.True(channel.Reader.TryRead(out var saved));
        Assert.Equal(256, saved.Action.Length);
        Assert.DoesNotContain(saved.Action, char.IsControl);
        Assert.Equal(450, saved.UserId!.Length);
        Assert.Equal(50, saved.UserRole!.Length);
        Assert.Equal(128, saved.Controller!.Length);
        Assert.Equal(512, saved.Endpoint!.Length);
        Assert.Equal(10, saved.HttpMethod!.Length);
        Assert.Equal(512, saved.ExceptionType!.Length);
        Assert.Equal(128, saved.TraceId!.Length);
    }

    [Fact]
    public async Task CompletingQueueDrainsExistingRecordsAndRejectsNewOnes()
    {
        var channel = new SystemLogChannel(TestEnvironment.Configuration());
        channel.TryWrite(new SystemLog { Action = "pending" });
        channel.Complete();
        channel.Complete();

        Assert.False(channel.TryWrite(new SystemLog()));
        Assert.True(channel.Reader.TryRead(out var pending));
        Assert.Equal("pending", pending.Action);
        Assert.False(await channel.Reader.WaitToReadAsync());
        await channel.Reader.Completion;
        Assert.Equal(1, channel.DroppedCount);
    }

    [Theory]
    [InlineData("Capacity", 1, 10000)]
    [InlineData("BatchSize", 1, 500)]
    [InlineData("FlushIntervalSeconds", 1, 30)]
    [InlineData("PersistenceTimeoutSeconds", 1, 30)]
    [InlineData("FailureBackoffSeconds", 1, 60)]
    [InlineData("RetentionDays", 1, 365)]
    public void LoggingOptionsClampUnsafeValues(string name, int minimum, int maximum)
    {
        var property = typeof(SystemLoggingOptions).GetProperty(name)!;
        var low = SystemLoggingOptions.FromConfiguration(TestEnvironment.Configuration(new()
        {
            [$"SystemLogging:{name}"] = "-100"
        }));
        var high = SystemLoggingOptions.FromConfiguration(TestEnvironment.Configuration(new()
        {
            [$"SystemLogging:{name}"] = int.MaxValue.ToString()
        }));

        Assert.Equal(minimum, property.GetValue(low));
        Assert.Equal(maximum, property.GetValue(high));
    }
}
