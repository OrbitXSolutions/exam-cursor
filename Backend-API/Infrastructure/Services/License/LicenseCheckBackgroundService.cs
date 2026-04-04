using Smart_Core.Application.Interfaces.License;

namespace Smart_Core.Infrastructure.Services.License;

/// <summary>
/// Background service that periodically reloads the license file from disk.
/// Runs every 10 days as a safety net. The middleware handles real-time validation
/// on every authenticated request and auto-refreshes if cache is older than 24 hours.
/// </summary>
public class LicenseCheckBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<LicenseCheckBackgroundService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromDays(10);

    public LicenseCheckBackgroundService(IServiceProvider serviceProvider, ILogger<LicenseCheckBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait 2 minutes after startup to let the app fully initialize
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var licenseService = _serviceProvider.GetRequiredService<ILicenseValidationService>();
                licenseService.ReloadLicense();
                _logger.LogInformation("License background check completed. State={State}",
                    licenseService.GetCurrentState());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during license background check");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
