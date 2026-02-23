using Microsoft.EntityFrameworkCore;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services;

/// <summary>
/// Background service that deletes expired video recordings (MP4 + leftover chunks).
/// Runs once every 24 hours. Respects VideoRetentionDays from SystemSettings.
/// </summary>
public class VideoRetentionService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VideoRetentionService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    public VideoRetentionService(IServiceProvider serviceProvider, ILogger<VideoRetentionService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait 5 minutes after startup to let the app fully initialize
        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredRecordingsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during video retention cleanup");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task CleanupExpiredRecordingsAsync(CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();

        var mediaBasePath = Path.IsPathRooted("MediaStorage")
            ? "MediaStorage"
            : Path.Combine(env.ContentRootPath, "MediaStorage");

        // Get retention days from settings
        var settings = await db.SystemSettings.FirstOrDefaultAsync(ct);
        var retentionDays = settings?.VideoRetentionDays ?? 30;

        if (retentionDays <= 0)
        {
            _logger.LogInformation("Video retention disabled (RetentionDays = {Days})", retentionDays);
            return;
        }

        var cutoff = DateTime.UtcNow.AddDays(-retentionDays);

        // Find expired video evidence
        var expiredRecordings = await db.ProctorEvidence
            .Where(e => e.Type == EvidenceType.Video && !e.IsExpired)
            .Where(e => (e.ExpiresAt != null && e.ExpiresAt <= DateTime.UtcNow) ||
                        (e.ExpiresAt == null && e.UploadedAt != null && e.UploadedAt <= cutoff))
            .ToListAsync(ct);

        var deletedFiles = 0;
        var deletedChunkDirs = 0;

        foreach (var recording in expiredRecordings)
        {
            try
            {
                // Delete the MP4/WebM file
                var fullPath = Path.Combine(mediaBasePath, recording.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    deletedFiles++;
                }

                // Delete the recording directory if empty
                var dir = Path.GetDirectoryName(fullPath);
                if (dir != null && Directory.Exists(dir) && !Directory.EnumerateFileSystemEntries(dir).Any())
                {
                    Directory.Delete(dir);
                }

                // Delete corresponding chunk directory
                var chunkDir = Path.Combine(mediaBasePath, "video-chunks", recording.AttemptId.ToString());
                if (Directory.Exists(chunkDir))
                {
                    Directory.Delete(chunkDir, recursive: true);
                    deletedChunkDirs++;
                }

                // Mark as expired in DB
                recording.IsExpired = true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete expired recording {EvidenceId} for attempt {AttemptId}",
                    recording.Id, recording.AttemptId);
            }
        }

        if (expiredRecordings.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "Video retention cleanup: {Total} records processed, {Files} files deleted, {ChunkDirs} chunk dirs removed (retention={Days} days)",
                expiredRecordings.Count, deletedFiles, deletedChunkDirs, retentionDays);
        }

        // Also clean up orphaned chunk directories (chunks with no evidence record, older than retention)
        var chunkBasePath = Path.Combine(mediaBasePath, "video-chunks");
        if (Directory.Exists(chunkBasePath))
        {
            foreach (var chunkDir in Directory.GetDirectories(chunkBasePath))
            {
                try
                {
                    var dirInfo = new DirectoryInfo(chunkDir);
                    if (dirInfo.CreationTimeUtc < cutoff)
                    {
                        Directory.Delete(chunkDir, recursive: true);
                        _logger.LogInformation("Deleted orphaned chunk directory: {Dir}", chunkDir);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete orphaned chunk directory: {Dir}", chunkDir);
                }
            }
        }
    }
}
