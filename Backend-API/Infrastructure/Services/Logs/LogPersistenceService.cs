using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Logs;

public sealed class LogPersistenceService : BackgroundService
{
    private readonly SystemLogChannel _channel;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LogPersistenceService> _logger;
    private readonly SystemLoggingOptions _options;
    private long _reportedDrops;

    public LogPersistenceService(SystemLogChannel channel, IServiceScopeFactory scopeFactory,
        IConfiguration configuration, ILogger<LogPersistenceService> logger)
    {
        _channel = channel;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = SystemLoggingOptions.FromConfiguration(configuration);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (await _channel.Reader.WaitToReadAsync(stoppingToken))
            {
                await Task.Delay(TimeSpan.FromSeconds(_options.FlushIntervalSeconds), stoppingToken);
                var batch = new List<SystemLog>(_options.BatchSize);
                while (batch.Count < _options.BatchSize && _channel.Reader.TryRead(out var log))
                    batch.Add(log);
                if (batch.Count == 0) continue;

                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                timeout.CancelAfter(TimeSpan.FromSeconds(_options.PersistenceTimeoutSeconds));
                try
                {
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    db.Database.SetCommandTimeout(_options.PersistenceTimeoutSeconds);
                    db.SystemLogs.AddRange(batch);
                    await db.SaveChangesAsync(timeout.Token);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    // Drop the failed batch. Never retain/retry records indefinitely during an outage.
                    _logger.LogWarning("System log persistence failed; discarded {Count} records. ExceptionType={ExceptionType} Diagnostics={Diagnostics}",
                        batch.Count, SafeLogMetadata.ExceptionType(exception), SafeLogMetadata.Diagnostics(exception));
                    await Task.Delay(TimeSpan.FromSeconds(_options.FailureBackoffSeconds), stoppingToken);
                }
                ReportDroppedRecords();
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        finally
        {
            _channel.Complete();
            ReportDroppedRecords();
        }
    }

    private void ReportDroppedRecords()
    {
        var dropped = _channel.DroppedCount;
        if (dropped == _reportedDrops) return;
        _logger.LogWarning("System log queue full; dropped {Count} records since last report", dropped - _reportedDrops);
        _reportedDrops = dropped;
    }
}
