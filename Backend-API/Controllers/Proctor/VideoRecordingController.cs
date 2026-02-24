using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Domain.Constants;
using Smart_Core.Domain.Entities;
using Smart_Core.Infrastructure.Data;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Smart_Core.Controllers.Proctor;

/// <summary>
/// Handles video chunk upload, finalization (merge + FFmpeg), and recording retrieval.
/// Minimal endpoints for proctoring video MVP.
/// </summary>
[ApiController]
[Route("api/Proctor")]
[Authorize]
public class VideoRecordingController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<VideoRecordingController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string _mediaBasePath;

    public VideoRecordingController(
        ApplicationDbContext db,
        ICurrentUserService currentUser,
        IWebHostEnvironment env,
        ILogger<VideoRecordingController> logger,
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _currentUser = currentUser;
        _env = env;
        _logger = logger;
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _mediaBasePath = Path.IsPathRooted("MediaStorage")
            ? "MediaStorage"
            : Path.Combine(env.ContentRootPath, "MediaStorage");
    }

    /// <summary>
    /// Get proctoring video config for the frontend (STUN servers + feature flags).
    /// GET /api/Proctor/video-config
    /// </summary>
    [HttpGet("video-config")]
    public async Task<IActionResult> GetVideoConfig()
    {
        // STUN servers from appsettings (defaults to empty if not configured)
        var stunServers = _configuration.GetSection("Proctoring:StunServers")
            .Get<string[]>() ?? Array.Empty<string>();

        // Feature flags: DB SystemSettings override appsettings
        var settings = await _db.SystemSettings.AsNoTracking().FirstOrDefaultAsync();

        bool enableLiveVideo;
        bool enableVideoRecording;

        if (settings != null)
        {
            enableLiveVideo = settings.EnableLiveVideo;
            enableVideoRecording = settings.EnableVideoRecording;
        }
        else
        {
            enableLiveVideo = _configuration.GetValue("Proctoring:EnableLiveVideo", true);
            enableVideoRecording = _configuration.GetValue("Proctoring:EnableVideoRecording", true);
        }

        // Smart Monitoring flag
        bool enableSmartMonitoring;
        if (settings != null)
        {
            enableSmartMonitoring = settings.EnableSmartMonitoring;
        }
        else
        {
            enableSmartMonitoring = _configuration.GetValue("Proctoring:EnableSmartMonitoring", true);
        }

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            enableLiveVideo,
            enableVideoRecording,
            enableSmartMonitoring,
            stunServers
        }));
    }

    /// <summary>
    /// Accept a video chunk from the candidate's MediaRecorder.
    /// POST /api/Proctor/video-chunk/{attemptId}
    /// </summary>
    [HttpPost("video-chunk/{attemptId}")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB per chunk max
    public async Task<IActionResult> UploadVideoChunk(int attemptId, IFormFile chunk, [FromForm] int chunkIndex, [FromForm] long? timestamp)
    {
        // Feature flag check
        if (!await IsVideoRecordingEnabled())
            return Ok(ApiResponse<object>.SuccessResponse(new { skipped = true }, "Video recording is disabled"));

        var candidateId = _currentUser.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        if (chunk == null || chunk.Length == 0)
            return BadRequest(ApiResponse<object>.FailureResponse("No chunk data provided"));

        try
        {
            // Verify attempt exists and belongs to candidate
            var attempt = await _db.Attempts.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == attemptId && a.CandidateId == candidateId);
            if (attempt == null)
                return NotFound(ApiResponse<object>.FailureResponse("Attempt not found"));

            // Store chunk to disk
            var chunkDir = Path.Combine(_mediaBasePath, "video-chunks", attemptId.ToString());
            Directory.CreateDirectory(chunkDir);

            var chunkFileName = $"chunk_{chunkIndex:D6}.webm";
            var chunkPath = Path.Combine(chunkDir, chunkFileName);

            await using (var stream = new FileStream(chunkPath, FileMode.Create, FileAccess.Write))
            {
                await chunk.CopyToAsync(stream);
            }

            _logger.LogDebug("Video chunk {ChunkIndex} saved for attempt {AttemptId} ({Size}KB)",
                chunkIndex, attemptId, chunk.Length / 1024);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                chunkIndex,
                size = chunk.Length,
                stored = true
            }, "Chunk uploaded"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save video chunk {ChunkIndex} for attempt {AttemptId}", chunkIndex, attemptId);
            return StatusCode(500, ApiResponse<object>.FailureResponse("Failed to store chunk"));
        }
    }

    /// <summary>
    /// Finalize video recording: validates and returns 202 Accepted immediately.
    /// Actual merge + FFmpeg conversion runs in background — never blocks submit/result flows.
    /// POST /api/Proctor/video-finalize/{attemptId}
    /// </summary>
    [HttpPost("video-finalize/{attemptId}")]
    public async Task<IActionResult> FinalizeVideo(int attemptId)
    {
        // Feature flag check
        if (!await IsVideoRecordingEnabled())
            return Accepted(ApiResponse<object>.SuccessResponse(new { skipped = true }, "Video recording is disabled"));

        var candidateId = _currentUser.UserId;
        if (string.IsNullOrEmpty(candidateId))
            return Unauthorized();

        // Quick validation only — no heavy processing
        var attempt = await _db.Attempts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.CandidateId == candidateId);
        if (attempt == null)
            return NotFound(ApiResponse<object>.FailureResponse("Attempt not found"));

        var chunkDir = Path.Combine(_mediaBasePath, "video-chunks", attemptId.ToString());
        if (!Directory.Exists(chunkDir))
            return Accepted(ApiResponse<object>.SuccessResponse(new { skipped = true }, "No video chunks found"));

        var chunkCount = Directory.GetFiles(chunkDir, "chunk_*.webm").Length;
        if (chunkCount == 0)
            return Accepted(ApiResponse<object>.SuccessResponse(new { skipped = true }, "No video chunks found"));

        // Capture values needed by background task before returning
        var startedAt = attempt.StartedAt;
        var mediaBasePath = _mediaBasePath;
        var contentRootPath = _env.ContentRootPath;

        _logger.LogInformation("Video finalize accepted for attempt {AttemptId} ({Chunks} chunks). Processing in background.",
            attemptId, chunkCount);

        // Fire-and-forget: process in background with a new DI scope
        _ = Task.Run(async () =>
        {
            try
            {
                await ProcessVideoFinalization(attemptId, candidateId, startedAt, mediaBasePath, contentRootPath);
            }
            catch (Exception ex)
            {
                // Create a logger from the scope since controller logger may be disposed
                using var scope = _scopeFactory.CreateScope();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<VideoRecordingController>>();
                logger.LogError(ex, "Background video finalization failed for attempt {AttemptId}", attemptId);
            }
        });

        return Accepted(ApiResponse<object>.SuccessResponse(new
        {
            attemptId,
            chunkCount,
            status = "processing"
        }, "Video finalization accepted — processing in background"));
    }

    /// <summary>
    /// Background method: creates evidence record from chunks (no FFmpeg needed).
    /// The frontend uses MediaSource Extensions (MSE) to stitch WebM chunks in-browser.
    /// </summary>
    private async Task ProcessVideoFinalization(int attemptId, string candidateId, DateTime startedAt, string mediaBasePath, string contentRootPath)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<VideoRecordingController>>();

        var chunkDir = Path.Combine(mediaBasePath, "video-chunks", attemptId.ToString());
        var chunkFiles = Directory.GetFiles(chunkDir, "chunk_*.webm")
            .OrderBy(f => f)
            .ToArray();

        if (chunkFiles.Length == 0)
        {
            logger.LogWarning("Background finalize: no chunks found for attempt {AttemptId}", attemptId);
            return;
        }

        // Calculate total size from all chunks
        long totalSize = chunkFiles.Sum(f => new FileInfo(f).Length);

        // Find ProctorSession
        var proctorSession = await db.ProctorSessions
            .FirstOrDefaultAsync(s => s.AttemptId == attemptId);
        int sessionId = proctorSession?.Id ?? 0;

        // Create evidence record pointing to chunks directory
        // The frontend MSE player will fetch and stitch chunks in-browser
        var relativePath = $"video-chunks/{attemptId}";
        var evidence = new ProctorEvidence
        {
            ProctorSessionId = sessionId,
            AttemptId = attemptId,
            Type = EvidenceType.Video,
            FileName = $"chunks_{attemptId}",
            FilePath = relativePath,
            FileSize = totalSize,
            ContentType = "video/webm",
            StartAt = startedAt,
            EndAt = DateTime.UtcNow,
            DurationSeconds = (int)(DateTime.UtcNow - startedAt).TotalSeconds,
            IsUploaded = true,
            UploadedAt = DateTime.UtcNow,
            UploadAttempts = 1,
            MetadataJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                totalChunks = chunkFiles.Length,
                format = "webm-chunks",
                playbackMode = "mse"
            })
        };

        // Retention expiry
        var settings = await db.SystemSettings.FirstOrDefaultAsync();
        if (settings != null)
        {
            var retentionDays = settings.VideoRetentionDays > 0 ? settings.VideoRetentionDays : 30;
            evidence.ExpiresAt = DateTime.UtcNow.AddDays(retentionDays);
        }

        db.ProctorEvidence.Add(evidence);
        await db.SaveChangesAsync();

        logger.LogInformation("Video finalized (background) for attempt {AttemptId}: {Path} ({Size}KB, {Chunks} chunks)",
            attemptId, relativePath, totalSize / 1024, chunkFiles.Length);
    }

    /// <summary>
    /// Get video recording metadata for an attempt.
    /// GET /api/Proctor/video-recording/{attemptId}
    /// </summary>
    [HttpGet("video-recording/{attemptId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> GetVideoRecording(int attemptId)
    {
        try
        {
            var evidence = await _db.ProctorEvidence
                .Where(e => e.AttemptId == attemptId && e.Type == EvidenceType.Video && e.IsUploaded && !e.IsExpired)
                .OrderByDescending(e => e.UploadedAt)
                .FirstOrDefaultAsync();

            if (evidence == null)
                return NotFound(ApiResponse<object>.FailureResponse("No video recording found for this attempt"));

            // Check if file still exists on disk
            var fullPath = Path.Combine(_mediaBasePath, evidence.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (!System.IO.File.Exists(fullPath))
                return NotFound(ApiResponse<object>.FailureResponse("Recording file not found on disk"));

            // Get proctor events for timeline
            var session = await _db.ProctorSessions
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.AttemptId == attemptId);

            object events = new List<object>();
            object screenshots = new List<object>();

            if (session != null)
            {
                events = await _db.ProctorEvents
                    .Where(e => e.ProctorSessionId == session.Id)
                    .OrderBy(e => e.OccurredAt)
                    .Select(e => new
                    {
                        e.Id,
                        eventType = e.EventType.ToString(),
                        severity = e.Severity,
                        e.OccurredAt,
                        e.MetadataJson
                    })
                    .ToListAsync();

                screenshots = await _db.ProctorEvidence
                    .Where(e => e.ProctorSessionId == session.Id && e.Type == EvidenceType.Image && e.IsUploaded)
                    .OrderBy(e => e.UploadedAt)
                    .Select(e => new
                    {
                        e.Id,
                        timestamp = e.UploadedAt ?? e.StartAt,
                        url = "/media/" + e.FilePath
                    })
                    .ToListAsync();
            }

            // Attempt info
            var attempt = await _db.Attempts
                .AsNoTracking()
                .Include(a => a.Exam)
                .FirstOrDefaultAsync(a => a.Id == attemptId);

            var retentionDays = 0;
            var settings = await _db.SystemSettings.FirstOrDefaultAsync();
            if (settings != null)
            {
                retentionDays = GetRetentionDays(settings);
            }

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                evidenceId = evidence.Id,
                attemptId,
                videoUrl = $"/media/{evidence.FilePath}",
                contentType = evidence.ContentType,
                fileSize = evidence.FileSize,
                duration = evidence.DurationSeconds,
                startAt = evidence.StartAt,
                endAt = evidence.EndAt,
                expiresAt = evidence.ExpiresAt,
                retentionDays,
                retentionMessage = retentionDays > 0
                    ? $"This recording will be deleted after {retentionDays} days"
                    : null,
                candidateName = attempt?.CandidateId,
                examTitle = attempt?.Exam?.TitleEn,
                events,
                screenshots
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get video recording for attempt {AttemptId}", attemptId);
            return StatusCode(500, ApiResponse<object>.FailureResponse("Failed to retrieve recording"));
        }
    }

    /// <summary>
    /// Stream video file directly.
    /// GET /api/Proctor/video-stream/{attemptId}
    /// </summary>
    [HttpGet("video-stream/{attemptId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public async Task<IActionResult> StreamVideo(int attemptId)
    {
        var evidence = await _db.ProctorEvidence
            .Where(e => e.AttemptId == attemptId && e.Type == EvidenceType.Video && e.IsUploaded && !e.IsExpired)
            .OrderByDescending(e => e.UploadedAt)
            .FirstOrDefaultAsync();

        if (evidence == null)
            return NotFound("No recording found");

        var fullPath = Path.Combine(_mediaBasePath, evidence.FilePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        if (!System.IO.File.Exists(fullPath))
            return NotFound("File not found");

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, evidence.ContentType ?? "video/mp4", enableRangeProcessing: true);
    }

    /// <summary>
    /// List all video chunks for an attempt (for chunk-based playback).
    /// GET /api/Proctor/video-chunks/{attemptId}
    /// </summary>
    [HttpGet("video-chunks/{attemptId}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public IActionResult GetVideoChunks(int attemptId)
    {
        try
        {
            var chunkDir = Path.Combine(_mediaBasePath, "video-chunks", attemptId.ToString());
            if (!Directory.Exists(chunkDir))
                return NotFound(ApiResponse<object>.FailureResponse("No video chunks found for this attempt"));

            var chunkFiles = Directory.GetFiles(chunkDir, "chunk_*.webm")
                .OrderBy(f => f)
                .ToArray();

            if (chunkFiles.Length == 0)
                return NotFound(ApiResponse<object>.FailureResponse("No video chunks found for this attempt"));

            var chunks = chunkFiles.Select((f, i) =>
            {
                var fi = new FileInfo(f);
                return new
                {
                    index = i,
                    filename = fi.Name,
                    sizeBytes = fi.Length,
                };
            }).ToList();

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                attemptId,
                totalChunks = chunks.Count,
                totalSizeBytes = chunks.Sum(c => c.sizeBytes),
                chunkDurationMs = 3000,
                chunks,
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to list video chunks for attempt {AttemptId}", attemptId);
            return StatusCode(500, ApiResponse<object>.FailureResponse("Failed to list video chunks"));
        }
    }

    /// <summary>
    /// Serve an individual video chunk file.
    /// GET /api/Proctor/video-chunks/{attemptId}/{filename}
    /// </summary>
    [HttpGet("video-chunks/{attemptId}/{filename}")]
    [Authorize(Roles = $"{AppRoles.SuperDev},{AppRoles.Admin},{AppRoles.Instructor},ProctorReviewer,{AppRoles.Proctor}")]
    public IActionResult GetVideoChunkFile(int attemptId, string filename)
    {
        // Validate filename pattern to prevent path traversal
        if (!System.Text.RegularExpressions.Regex.IsMatch(filename, @"^chunk_\d{6}\.webm$"))
            return BadRequest(ApiResponse<object>.FailureResponse("Invalid chunk filename"));

        var chunkPath = Path.Combine(_mediaBasePath, "video-chunks", attemptId.ToString(), filename);
        if (!System.IO.File.Exists(chunkPath))
            return NotFound(ApiResponse<object>.FailureResponse("Chunk file not found"));

        var stream = new FileStream(chunkPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return File(stream, "video/webm", enableRangeProcessing: true);
    }

    // ── Helpers ──────────────────────────────────────────

    private async Task<bool> IsVideoRecordingEnabled()
    {
        var settings = await _db.SystemSettings.AsNoTracking().FirstOrDefaultAsync();
        if (settings != null) return settings.EnableVideoRecording;
        return _configuration.GetValue("Proctoring:EnableVideoRecording", true);
    }

    private int GetRetentionDays(SystemSettings settings)
    {
        try
        {
            var prop = settings.GetType().GetProperty("VideoRetentionDays");
            if (prop != null)
            {
                return (int)(prop.GetValue(settings) ?? 30);
            }
        }
        catch { }
        return 30; // Default 30 days
    }
}
