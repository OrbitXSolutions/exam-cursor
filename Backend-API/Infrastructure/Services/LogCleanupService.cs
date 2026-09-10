using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Common;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Infrastructure.Services.Logs;

namespace Smart_Core.Infrastructure.Services;

public sealed class LogCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LogCleanupService> _logger;
    private readonly SystemLoggingOptions _options;

    public LogCleanupService(IServiceScopeFactory scopeFactory, IConfiguration configuration,
        ILogger<LogCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = SystemLoggingOptions.FromConfiguration(configuration);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            // Do not compete with migrations or startup checks.
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    db.Database.SetCommandTimeout(_options.PersistenceTimeoutSeconds);
                    var cutoff = UaeTimeHelper.NowUae.AddDays(-_options.RetentionDays);
                    // Bound each delete and each sweep; concurrent replicas may safely delete the same range.
                    for (var batch = 0; batch < 10 && !stoppingToken.IsCancellationRequested; batch++)
                    {
                        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                        timeout.CancelAfter(TimeSpan.FromSeconds(_options.PersistenceTimeoutSeconds));
                        var deleted = await db.SystemLogs.Where(log => log.Timestamp < cutoff)
                            .OrderBy(log => log.Timestamp).ThenBy(log => log.Id).Take(1000)
                            .ExecuteDeleteAsync(timeout.Token);
                        if (deleted < 1000) break;
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception exception)
                {
                    _logger.LogWarning("System log cleanup failed. ExceptionType={ExceptionType} Diagnostics={Diagnostics}",
                        SafeLogMetadata.ExceptionType(exception), SafeLogMetadata.Diagnostics(exception));
                }
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }
}
