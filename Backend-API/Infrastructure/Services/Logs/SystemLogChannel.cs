using System.Threading.Channels;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Logs;

namespace Smart_Core.Infrastructure.Services.Logs;

public sealed class SystemLogChannel
{
    private readonly Channel<SystemLog> _channel;
    private long _droppedCount;
    public long DroppedCount => Interlocked.Read(ref _droppedCount);
    public ChannelReader<SystemLog> Reader => _channel.Reader;

    public SystemLogChannel(IConfiguration configuration)
    {
        _channel = Channel.CreateBounded<SystemLog>(new BoundedChannelOptions(
            SystemLoggingOptions.FromConfiguration(configuration).Capacity)
        {
            // TryWrite only: a full queue rejects the newest item instead of waiting on SQL.
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false
        });
    }

    public bool TryWrite(SystemLog log)
    {
        // Queue a bounded, detached metadata copy; callers cannot mutate buffered records.
        var metadata = new SystemLog
        {
            Timestamp = log.Timestamp == default ? UaeTimeHelper.NowUae : log.Timestamp,
            Level = log.Level,
            Category = log.Category,
            UserId = log.UserId?.Contains('@') == true ? null : SafeLogMetadata.Limit(log.UserId, 450),
            UserRole = SafeLogMetadata.Limit(log.UserRole, 50),
            Action = SafeLogMetadata.Limit(log.Action, 256) ?? string.Empty,
            Controller = SafeLogMetadata.Limit(log.Controller, 128),
            Endpoint = SafeLogMetadata.Limit(log.Endpoint, 512),
            HttpMethod = SafeLogMetadata.Limit(log.HttpMethod, 10),
            ResponseStatusCode = log.ResponseStatusCode,
            ExceptionType = SafeLogMetadata.Limit(log.ExceptionType, 512),
            TraceId = SafeLogMetadata.Limit(log.TraceId, 128),
            DurationMs = log.DurationMs
        };
        if (_channel.Writer.TryWrite(metadata)) return true;
        Interlocked.Increment(ref _droppedCount);
        return false;
    }

    public void Complete() => _channel.Writer.TryComplete();
}
