using Microsoft.Data.SqlClient;

namespace Smart_Core.Infrastructure.Services;

public class LogCleanupService : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<LogCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(24);

    public LogCleanupService(IConfiguration configuration, ILogger<LogCleanupService> logger)
    {
        _configuration = configuration;
        _logger = logger;
 }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
     {
     try
       {
         await CleanupOldLogsAsync();
            }
          catch (Exception ex)
       {
         _logger.LogError(ex, "Error occurred while cleaning up old logs");
            }

     await Task.Delay(_cleanupInterval, stoppingToken);
        }
    }

private async Task CleanupOldLogsAsync()
    {
    var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var retentionDays = 30;

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

   var command = new SqlCommand(
 $"DELETE FROM Logs WHERE TimeStamp < DATEADD(day, -{retentionDays}, GETUTCDATE())",
        connection);

  var deletedRows = await command.ExecuteNonQueryAsync();
        
 if (deletedRows > 0)
    {
      _logger.LogInformation("Cleaned up {DeletedRows} old log entries", deletedRows);
      }
    }
}
