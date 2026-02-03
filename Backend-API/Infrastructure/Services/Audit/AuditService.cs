using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Smart_Core.Application.DTOs.Audit;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.Interfaces;
using Smart_Core.Application.Interfaces.Audit;
using Smart_Core.Domain.Entities.Audit;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Audit;

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
 private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AuditService> _logger;
    private static readonly JsonSerializerOptions _jsonOptions = new()
 {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public AuditService(
      ApplicationDbContext context,
        ICurrentUserService currentUserService,
        ILogger<AuditService> logger)
    {
     _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    #region Audit Logging

    public async Task LogAsync(CreateAuditLogDto dto)
 {
        try
        {
       var auditLog = MapToAuditLog(dto);
            _context.Set<AuditLog>().Add(auditLog);
         await _context.SaveChangesAsync();
        }
        catch (Exception ex)
  {
 // Audit logging should not block business operations
            _logger.LogError(ex, "Failed to write audit log for action {Action} on {EntityName}:{EntityId}",
      dto.Action, dto.EntityName, dto.EntityId);
        }
    }

    public void Log(CreateAuditLogDto dto)
    {
  try
        {
            var auditLog = MapToAuditLog(dto);
            _context.Set<AuditLog>().Add(auditLog);
          _context.SaveChanges();
        }
        catch (Exception ex)
        {
   _logger.LogError(ex, "Failed to write audit log for action {Action} on {EntityName}:{EntityId}",
                dto.Action, dto.EntityName, dto.EntityId);
        }
    }

    public async Task LogSuccessAsync(
        string action,
 string entityName,
        string entityId,
        string? actorId = null,
 object? before = null,
        object? after = null,
        object? metadata = null)
    {
        var userId = actorId ?? _currentUserService.UserId;
        await LogAsync(new CreateAuditLogDto
      {
       Action = action,
    EntityName = entityName,
            EntityId = entityId,
            ActorId = userId,
ActorType = string.IsNullOrEmpty(userId) ? ActorType.System : ActorType.User,
   ActorDisplayName = _currentUserService.Email,
            Before = before,
       After = after,
      Metadata = metadata,
     Outcome = AuditOutcome.Success,
            Source = AuditSource.Api
        });
    }

    public async Task LogFailureAsync(
        string action,
        string entityName,
        string entityId,
 string errorMessage,
        string? actorId = null,
      object? metadata = null)
    {
        var userId = actorId ?? _currentUserService.UserId;
        await LogAsync(new CreateAuditLogDto
     {
          Action = action,
            EntityName = entityName,
     EntityId = entityId,
            ActorId = userId,
            ActorType = string.IsNullOrEmpty(userId) ? ActorType.System : ActorType.User,
      ActorDisplayName = _currentUserService.Email,
Metadata = metadata,
            Outcome = AuditOutcome.Failure,
       ErrorMessage = errorMessage,
   Source = AuditSource.Api
        });
    }

    public async Task LogSystemActionAsync(
        string action,
        string entityName,
        string entityId,
        AuditOutcome outcome,
        string? errorMessage = null,
        object? metadata = null)
    {
        await LogAsync(new CreateAuditLogDto
        {
      Action = action,
            EntityName = entityName,
         EntityId = entityId,
       ActorType = ActorType.System,
  ActorDisplayName = "System",
            Metadata = metadata,
     Outcome = outcome,
            ErrorMessage = errorMessage,
            Source = AuditSource.BackgroundJob
    });
    }

    #endregion

    #region Audit Log Queries

    public async Task<ApiResponse<AuditLogDto>> GetLogAsync(long logId)
    {
        var log = await _context.Set<AuditLog>()
     .FirstOrDefaultAsync(x => x.Id == logId);

        if (log == null)
        {
         return ApiResponse<AuditLogDto>.FailureResponse("Audit log not found");
        }

        return ApiResponse<AuditLogDto>.SuccessResponse(MapToLogDto(log));
    }

    public async Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> SearchLogsAsync(AuditLogSearchDto searchDto)
    {
        var query = _context.Set<AuditLog>().AsQueryable();

        query = ApplyFilters(query, searchDto);
        query = query.OrderByDescending(x => x.OccurredAt);

 var totalCount = await query.CountAsync();
        var items = await query
.Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        return ApiResponse<PaginatedResponse<AuditLogListDto>>.SuccessResponse(
     new PaginatedResponse<AuditLogListDto>
            {
        Items = items.Select(MapToLogListDto).ToList(),
           PageNumber = searchDto.PageNumber,
 PageSize = searchDto.PageSize,
      TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> GetEntityHistoryAsync(EntityHistoryRequestDto request)
    {
        var query = _context.Set<AuditLog>()
            .Where(x => x.EntityName == request.EntityName && x.EntityId == request.EntityId)
   .OrderByDescending(x => x.OccurredAt);

        var totalCount = await query.CountAsync();
var items = await query
        .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return ApiResponse<PaginatedResponse<AuditLogListDto>>.SuccessResponse(
            new PaginatedResponse<AuditLogListDto>
     {
         Items = items.Select(MapToLogListDto).ToList(),
     PageNumber = request.PageNumber,
      PageSize = request.PageSize,
 TotalCount = totalCount
          });
    }

    public async Task<ApiResponse<PaginatedResponse<AuditLogListDto>>> GetUserActivityAsync(UserActivityRequestDto request)
    {
        var query = _context.Set<AuditLog>()
        .Where(x => x.ActorId == request.UserId);

    if (request.FromDate.HasValue)
        query = query.Where(x => x.OccurredAt >= request.FromDate.Value);

        if (request.ToDate.HasValue)
     query = query.Where(x => x.OccurredAt <= request.ToDate.Value);

        query = query.OrderByDescending(x => x.OccurredAt);

   var totalCount = await query.CountAsync();
        var items = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
         .Take(request.PageSize)
            .ToListAsync();

        return ApiResponse<PaginatedResponse<AuditLogListDto>>.SuccessResponse(
       new PaginatedResponse<AuditLogListDto>
            {
Items = items.Select(MapToLogListDto).ToList(),
    PageNumber = request.PageNumber,
   PageSize = request.PageSize,
           TotalCount = totalCount
         });
    }

    public async Task<ApiResponse<List<AuditLogListDto>>> GetByCorrelationIdAsync(string correlationId)
    {
        var logs = await _context.Set<AuditLog>()
    .Where(x => x.CorrelationId == correlationId)
         .OrderBy(x => x.OccurredAt)
            .ToListAsync();

        return ApiResponse<List<AuditLogListDto>>.SuccessResponse(
          logs.Select(MapToLogListDto).ToList());
    }

    public async Task<ApiResponse<List<AuditLogListDto>>> GetRecentFailuresAsync(int count = 50)
    {
      var logs = await _context.Set<AuditLog>()
   .Where(x => x.Outcome == AuditOutcome.Failure)
    .OrderByDescending(x => x.OccurredAt)
            .Take(count)
          .ToListAsync();

        return ApiResponse<List<AuditLogListDto>>.SuccessResponse(
         logs.Select(MapToLogListDto).ToList());
    }

    #endregion

    #region Retention Policies

    public async Task<ApiResponse<List<AuditRetentionPolicyDto>>> GetRetentionPoliciesAsync()
    {
   var policies = await _context.Set<AuditRetentionPolicy>()
 .OrderBy(x => x.Priority)
  .ToListAsync();

  return ApiResponse<List<AuditRetentionPolicyDto>>.SuccessResponse(
        policies.Select(MapToPolicyDto).ToList());
    }

    public async Task<ApiResponse<AuditRetentionPolicyDto>> GetRetentionPolicyAsync(int policyId)
    {
      var policy = await _context.Set<AuditRetentionPolicy>()
            .FirstOrDefaultAsync(x => x.Id == policyId);

        if (policy == null)
     {
        return ApiResponse<AuditRetentionPolicyDto>.FailureResponse("Policy not found");
    }

 return ApiResponse<AuditRetentionPolicyDto>.SuccessResponse(MapToPolicyDto(policy));
  }

    public async Task<ApiResponse<AuditRetentionPolicyDto>> CreateRetentionPolicyAsync(
        CreateRetentionPolicyDto dto, string userId)
    {
  var now = DateTime.UtcNow;

  var policy = new AuditRetentionPolicy
        {
         NameEn = dto.NameEn,
            NameAr = dto.NameAr,
            DescriptionEn = dto.DescriptionEn,
          DescriptionAr = dto.DescriptionAr,
            IsActive = dto.IsActive,
       Priority = dto.Priority,
            RetentionDays = dto.RetentionDays,
  EntityName = dto.EntityName,
  ActionPrefix = dto.ActionPrefix,
            Channel = dto.Channel,
            ActorType = dto.ActorType,
      ArchiveBeforeDelete = dto.ArchiveBeforeDelete,
        ArchiveTarget = dto.ArchiveTarget,
     ArchivePathTemplate = dto.ArchivePathTemplate,
            CreatedDate = now,
  CreatedBy = userId
        };

      _context.Set<AuditRetentionPolicy>().Add(policy);
        await _context.SaveChangesAsync();

 await LogSuccessAsync(AuditActions.AuditRetentionExecuted, "AuditRetentionPolicy", policy.Id.ToString(),
      userId, after: new { policy.NameEn, policy.RetentionDays });

        return ApiResponse<AuditRetentionPolicyDto>.SuccessResponse(MapToPolicyDto(policy));
    }

    public async Task<ApiResponse<AuditRetentionPolicyDto>> UpdateRetentionPolicyAsync(
        UpdateRetentionPolicyDto dto, string userId)
    {
     var policy = await _context.Set<AuditRetentionPolicy>()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (policy == null)
        {
       return ApiResponse<AuditRetentionPolicyDto>.FailureResponse("Policy not found");
 }

    var now = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.NameEn)) policy.NameEn = dto.NameEn;
        if (!string.IsNullOrEmpty(dto.NameAr)) policy.NameAr = dto.NameAr;
        if (dto.DescriptionEn != null) policy.DescriptionEn = dto.DescriptionEn;
        if (dto.DescriptionAr != null) policy.DescriptionAr = dto.DescriptionAr;
        if (dto.IsActive.HasValue) policy.IsActive = dto.IsActive.Value;
        if (dto.Priority.HasValue) policy.Priority = dto.Priority.Value;
   if (dto.RetentionDays.HasValue) policy.RetentionDays = dto.RetentionDays.Value;
        if (dto.EntityName != null) policy.EntityName = dto.EntityName;
        if (dto.ActionPrefix != null) policy.ActionPrefix = dto.ActionPrefix;
        if (dto.Channel != null) policy.Channel = dto.Channel;
        if (dto.ActorType != null) policy.ActorType = dto.ActorType;
     if (dto.ArchiveBeforeDelete.HasValue) policy.ArchiveBeforeDelete = dto.ArchiveBeforeDelete.Value;
        if (dto.ArchiveTarget != null) policy.ArchiveTarget = dto.ArchiveTarget;
        if (dto.ArchivePathTemplate != null) policy.ArchivePathTemplate = dto.ArchivePathTemplate;

        policy.UpdatedDate = now;
        policy.UpdatedBy = userId;

   await _context.SaveChangesAsync();

  return ApiResponse<AuditRetentionPolicyDto>.SuccessResponse(MapToPolicyDto(policy));
    }

    public async Task<ApiResponse<bool>> DeleteRetentionPolicyAsync(int policyId, string userId)
    {
        var policy = await _context.Set<AuditRetentionPolicy>()
   .FirstOrDefaultAsync(x => x.Id == policyId);

        if (policy == null)
        {
            return ApiResponse<bool>.FailureResponse("Policy not found");
        }

        if (policy.IsDefault)
      {
      return ApiResponse<bool>.FailureResponse("Cannot delete the default policy");
 }

        policy.IsDeleted = true;
  policy.DeletedBy = userId;
    policy.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResponse(true, "Policy deleted");
    }

    public async Task<ApiResponse<AuditRetentionPolicyDto>> SetDefaultPolicyAsync(int policyId, string userId)
    {
      var policy = await _context.Set<AuditRetentionPolicy>()
    .FirstOrDefaultAsync(x => x.Id == policyId);

        if (policy == null)
 {
            return ApiResponse<AuditRetentionPolicyDto>.FailureResponse("Policy not found");
   }

        // Remove default from all other policies
        var currentDefault = await _context.Set<AuditRetentionPolicy>()
       .Where(x => x.IsDefault && x.Id != policyId)
    .ToListAsync();

        foreach (var p in currentDefault)
        {
 p.IsDefault = false;
            p.UpdatedDate = DateTime.UtcNow;
            p.UpdatedBy = userId;
        }

     policy.IsDefault = true;
        policy.UpdatedDate = DateTime.UtcNow;
        policy.UpdatedBy = userId;

        await _context.SaveChangesAsync();

return ApiResponse<AuditRetentionPolicyDto>.SuccessResponse(MapToPolicyDto(policy));
 }

    public async Task<ApiResponse<List<RetentionExecutionResultDto>>> ExecuteRetentionAsync(string userId)
    {
 var results = new List<RetentionExecutionResultDto>();
   var policies = await _context.Set<AuditRetentionPolicy>()
            .Where(x => x.IsActive)
      .OrderBy(x => x.Priority)
         .ToListAsync();

   foreach (var policy in policies)
    {
            var result = await ExecutePolicyAsync(policy, userId);
         results.Add(result);
        }

        await LogSystemActionAsync(AuditActions.AuditRetentionExecuted, "AuditLog", "batch",
      AuditOutcome.Success, metadata: new { policiesExecuted = policies.Count, totalDeleted = results.Sum(r => r.LogsDeleted) });

        return ApiResponse<List<RetentionExecutionResultDto>>.SuccessResponse(results);
    }

    public async Task<ApiResponse<int>> PreviewRetentionAsync(int policyId)
    {
        var policy = await _context.Set<AuditRetentionPolicy>()
  .FirstOrDefaultAsync(x => x.Id == policyId);

        if (policy == null)
        {
         return ApiResponse<int>.FailureResponse("Policy not found");
        }

        var cutoffDate = DateTime.UtcNow.AddDays(-policy.RetentionDays);
        var query = _context.Set<AuditLog>()
       .Where(x => x.OccurredAt < cutoffDate);

        query = ApplyPolicyFilters(query, policy);

 var count = await query.CountAsync();
        return ApiResponse<int>.SuccessResponse(count, $"{count} logs would be affected");
    }

    private async Task<RetentionExecutionResultDto> ExecutePolicyAsync(AuditRetentionPolicy policy, string userId)
    {
        var result = new RetentionExecutionResultDto
    {
      PolicyId = policy.Id,
PolicyName = policy.NameEn,
         ExecutedAt = DateTime.UtcNow
        };

   try
        {
        var cutoffDate = DateTime.UtcNow.AddDays(-policy.RetentionDays);
            var query = _context.Set<AuditLog>()
           .Where(x => x.OccurredAt < cutoffDate);

            query = ApplyPolicyFilters(query, policy);

            var logsToProcess = await query.ToListAsync();
     result.LogsProcessed = logsToProcess.Count;

            if (logsToProcess.Count == 0)
   {
           result.Success = true;
   return result;
            }

       // Archive if required
        if (policy.ArchiveBeforeDelete)
            {
        // TODO: Implement archiving to S3/Blob/FileShare
         result.LogsArchived = logsToProcess.Count;
    }

       // Delete logs
            _context.Set<AuditLog>().RemoveRange(logsToProcess);
      await _context.SaveChangesAsync();

            result.LogsDeleted = logsToProcess.Count;

            // Update policy execution stats
    policy.LastExecutedAt = DateTime.UtcNow;
      policy.LastExecutionCount = logsToProcess.Count;
       await _context.SaveChangesAsync();

    result.Success = true;
        }
    catch (Exception ex)
        {
            result.Success = false;
          result.ErrorMessage = ex.Message;
          _logger.LogError(ex, "Failed to execute retention policy {PolicyId}", policy.Id);
        }

        return result;
    }

    private IQueryable<AuditLog> ApplyPolicyFilters(IQueryable<AuditLog> query, AuditRetentionPolicy policy)
    {
        if (!string.IsNullOrEmpty(policy.EntityName))
   query = query.Where(x => x.EntityName == policy.EntityName);

        if (!string.IsNullOrEmpty(policy.ActionPrefix))
            query = query.Where(x => x.Action.StartsWith(policy.ActionPrefix));

        if (!string.IsNullOrEmpty(policy.Channel))
 query = query.Where(x => x.Channel.ToString() == policy.Channel);

      if (!string.IsNullOrEmpty(policy.ActorType))
            query = query.Where(x => x.ActorType.ToString() == policy.ActorType);

        return query;
    }

    #endregion

    #region Export Jobs

    public async Task<ApiResponse<AuditExportJobDto>> CreateExportJobAsync(CreateExportJobDto dto, string userId)
    {
        var now = DateTime.UtcNow;

     var job = new AuditExportJob
        {
      FromDate = dto.FromDate,
 ToDate = dto.ToDate,
  TenantId = dto.TenantId,
          EntityName = dto.EntityName,
     ActionPrefix = dto.ActionPrefix,
    ActorId = dto.ActorId,
            Outcome = dto.Outcome,
    Format = dto.Format,
            Status = ExportStatus.Pending,
      RequestedBy = userId,
       RequestedAt = now,
            CreatedDate = now,
    CreatedBy = userId
        };

     _context.Set<AuditExportJob>().Add(job);
      await _context.SaveChangesAsync();

        await LogSuccessAsync(AuditActions.AuditExportRequested, "AuditExportJob", job.Id.ToString(),
            userId, after: new { job.FromDate, job.ToDate, job.Format });

      return await GetExportJobAsync(job.Id);
    }

    public async Task<ApiResponse<AuditExportJobDto>> GetExportJobAsync(int jobId)
    {
        var job = await _context.Set<AuditExportJob>()
            .Include(x => x.Requester)
            .FirstOrDefaultAsync(x => x.Id == jobId);

        if (job == null)
        {
  return ApiResponse<AuditExportJobDto>.FailureResponse("Export job not found");
        }

        return ApiResponse<AuditExportJobDto>.SuccessResponse(MapToExportJobDto(job));
    }

    public async Task<ApiResponse<PaginatedResponse<AuditExportJobListDto>>> GetExportJobsAsync(ExportJobSearchDto searchDto)
    {
     var query = _context.Set<AuditExportJob>()
            .Include(x => x.Requester)
.AsQueryable();

      if (searchDto.Status.HasValue)
            query = query.Where(x => x.Status == searchDto.Status.Value);

      if (!string.IsNullOrEmpty(searchDto.RequestedBy))
        query = query.Where(x => x.RequestedBy == searchDto.RequestedBy);

        if (searchDto.FromDate.HasValue)
            query = query.Where(x => x.RequestedAt >= searchDto.FromDate.Value);

        if (searchDto.ToDate.HasValue)
      query = query.Where(x => x.RequestedAt <= searchDto.ToDate.Value);

        query = query.OrderByDescending(x => x.RequestedAt);

        var totalCount = await query.CountAsync();
   var items = await query
            .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
.Take(searchDto.PageSize)
    .ToListAsync();

        return ApiResponse<PaginatedResponse<AuditExportJobListDto>>.SuccessResponse(
 new PaginatedResponse<AuditExportJobListDto>
       {
            Items = items.Select(MapToExportJobListDto).ToList(),
         PageNumber = searchDto.PageNumber,
          PageSize = searchDto.PageSize,
        TotalCount = totalCount
            });
    }

    public async Task<ApiResponse<List<AuditExportJobListDto>>> GetMyExportJobsAsync(string userId)
    {
        var jobs = await _context.Set<AuditExportJob>()
         .Include(x => x.Requester)
 .Where(x => x.RequestedBy == userId)
          .OrderByDescending(x => x.RequestedAt)
            .Take(20)
            .ToListAsync();

        return ApiResponse<List<AuditExportJobListDto>>.SuccessResponse(
            jobs.Select(MapToExportJobListDto).ToList());
  }

    public async Task<ApiResponse<bool>> CancelExportJobAsync(int jobId, string userId)
    {
      var job = await _context.Set<AuditExportJob>()
    .FirstOrDefaultAsync(x => x.Id == jobId);

    if (job == null)
        {
            return ApiResponse<bool>.FailureResponse("Export job not found");
        }

        if (job.Status != ExportStatus.Pending)
     {
        return ApiResponse<bool>.FailureResponse("Can only cancel pending jobs");
        }

     job.Status = ExportStatus.Failed;
        job.ErrorMessage = "Cancelled by user";
        job.UpdatedDate = DateTime.UtcNow;
     job.UpdatedBy = userId;

await _context.SaveChangesAsync();

      return ApiResponse<bool>.SuccessResponse(true, "Export job cancelled");
    }

    public async Task<ApiResponse<string>> GetExportDownloadUrlAsync(int jobId, string userId)
    {
        var job = await _context.Set<AuditExportJob>()
     .FirstOrDefaultAsync(x => x.Id == jobId);

        if (job == null)
    {
          return ApiResponse<string>.FailureResponse("Export job not found");
        }

        if (job.Status != ExportStatus.Completed)
        {
     return ApiResponse<string>.FailureResponse("Export not completed");
        }

  if (string.IsNullOrEmpty(job.FilePath))
        {
    return ApiResponse<string>.FailureResponse("Export file not available");
  }

     if (job.ExpiresAt.HasValue && job.ExpiresAt.Value < DateTime.UtcNow)
        {
            return ApiResponse<string>.FailureResponse("Export file has expired");
      }

        // TODO: Generate signed URL for S3/Blob storage
        // For now, return the file path
        return ApiResponse<string>.SuccessResponse(job.FilePath);
}

    public async Task ProcessPendingExportsAsync()
    {
        var pendingJobs = await _context.Set<AuditExportJob>()
        .Where(x => x.Status == ExportStatus.Pending)
            .OrderBy(x => x.RequestedAt)
  .Take(5)
       .ToListAsync();

        foreach (var job in pendingJobs)
        {
 await ProcessExportJobAsync(job);
        }
  }

    private async Task ProcessExportJobAsync(AuditExportJob job)
    {
        try
     {
       job.Status = ExportStatus.Processing;
    job.StartedAt = DateTime.UtcNow;
     await _context.SaveChangesAsync();

        // Build query
          var query = _context.Set<AuditLog>()
       .Where(x => x.OccurredAt >= job.FromDate && x.OccurredAt <= job.ToDate);

        if (!string.IsNullOrEmpty(job.EntityName))
           query = query.Where(x => x.EntityName == job.EntityName);

   if (!string.IsNullOrEmpty(job.ActionPrefix))
      query = query.Where(x => x.Action.StartsWith(job.ActionPrefix));

            if (!string.IsNullOrEmpty(job.ActorId))
 query = query.Where(x => x.ActorId == job.ActorId);

            if (job.Outcome.HasValue)
        query = query.Where(x => x.Outcome == job.Outcome.Value);

 var logs = await query.OrderBy(x => x.OccurredAt).ToListAsync();

     // Generate file
      var fileName = $"audit_export_{job.Id}_{DateTime.UtcNow:yyyyMMddHHmmss}";
          string filePath;
            long fileSize;

            switch (job.Format)
      {
         case ExportFormat.Csv:
      (filePath, fileSize) = await ExportToCsvAsync(logs, fileName);
      break;
        case ExportFormat.Json:
      (filePath, fileSize) = await ExportToJsonAsync(logs, fileName);
         break;
            default:
      throw new NotSupportedException($"Export format {job.Format} not yet implemented");
    }

            job.Status = ExportStatus.Completed;
            job.FilePath = filePath;
            job.FileName = Path.GetFileName(filePath);
     job.FileSize = fileSize;
          job.TotalRecords = logs.Count;
            job.CompletedAt = DateTime.UtcNow;
            job.ExpiresAt = DateTime.UtcNow.AddDays(7); // Files expire after 7 days

        await _context.SaveChangesAsync();

            await LogSystemActionAsync(AuditActions.AuditExportCompleted, "AuditExportJob", job.Id.ToString(),
     AuditOutcome.Success, metadata: new { job.TotalRecords, job.FileSize });
      }
        catch (Exception ex)
        {
       job.Status = ExportStatus.Failed;
          job.ErrorMessage = ex.Message;
     job.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

         _logger.LogError(ex, "Failed to process export job {JobId}", job.Id);
        }
    }

  private async Task<(string filePath, long fileSize)> ExportToCsvAsync(List<AuditLog> logs, string fileName)
    {
        var exportDir = Path.Combine(Directory.GetCurrentDirectory(), "Exports", "Audit");
    Directory.CreateDirectory(exportDir);

        var filePath = Path.Combine(exportDir, $"{fileName}.csv");

        using var writer = new StreamWriter(filePath);

        // Header
   await writer.WriteLineAsync("Id,OccurredAt,ActorType,ActorId,ActorDisplayName,Action,EntityName,EntityId,Outcome,ErrorMessage,Source,Channel,IpAddress,CorrelationId");

  // Data
      foreach (var log in logs)
        {
     var line = $"{log.Id}," +
          $"{log.OccurredAt:O}," +
  $"\"{log.ActorType}\"," +
       $"\"{EscapeCsv(log.ActorId)}\"," +
              $"\"{EscapeCsv(log.ActorDisplayName)}\"," +
    $"\"{EscapeCsv(log.Action)}\"," +
            $"\"{EscapeCsv(log.EntityName)}\"," +
  $"\"{EscapeCsv(log.EntityId)}\"," +
           $"\"{log.Outcome}\"," +
         $"\"{EscapeCsv(log.ErrorMessage)}\"," +
      $"\"{log.Source}\"," +
 $"\"{log.Channel}\"," +
        $"\"{EscapeCsv(log.IpAddress)}\"," +
   $"\"{EscapeCsv(log.CorrelationId)}\"";
            await writer.WriteLineAsync(line);
        }

     var fileInfo = new FileInfo(filePath);
        return (filePath, fileInfo.Length);
    }

  private async Task<(string filePath, long fileSize)> ExportToJsonAsync(List<AuditLog> logs, string fileName)
    {
        var exportDir = Path.Combine(Directory.GetCurrentDirectory(), "Exports", "Audit");
        Directory.CreateDirectory(exportDir);

        var filePath = Path.Combine(exportDir, $"{fileName}.json");

        var dtos = logs.Select(MapToLogDto).ToList();
        var json = JsonSerializer.Serialize(dtos, new JsonSerializerOptions { WriteIndented = true });

        await File.WriteAllTextAsync(filePath, json);

        var fileInfo = new FileInfo(filePath);
        return (filePath, fileInfo.Length);
  }

    private static string EscapeCsv(string? value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        return value.Replace("\"", "\"\"").Replace("\n", " ").Replace("\r", "");
 }

  #endregion

    #region Dashboard

    public async Task<ApiResponse<AuditDashboardDto>> GetDashboardAsync(DateTime? fromDate = null, DateTime? toDate = null)
    {
        var now = DateTime.UtcNow;
        var from = fromDate ?? now.AddDays(-30);
        var to = toDate ?? now;

   var query = _context.Set<AuditLog>()
            .Where(x => x.OccurredAt >= from && x.OccurredAt <= to);

        var logs = await query.ToListAsync();

        var dashboard = new AuditDashboardDto
        {
            TotalLogs = logs.Count,
            LogsToday = logs.Count(x => x.OccurredAt.Date == now.Date),
            LogsThisWeek = logs.Count(x => x.OccurredAt >= now.AddDays(-7)),
         LogsThisMonth = logs.Count(x => x.OccurredAt >= now.AddDays(-30)),
        SuccessCount = logs.Count(x => x.Outcome == AuditOutcome.Success),
     FailureCount = logs.Count(x => x.Outcome == AuditOutcome.Failure),
     SuccessRate = logs.Count > 0 ? (decimal)logs.Count(x => x.Outcome == AuditOutcome.Success) / logs.Count * 100 : 0,
            TopActions = logs
 .GroupBy(x => x.Action)
   .Select(g => new AuditActionSummaryDto
            {
    Action = g.Key,
          Count = g.Count(),
      SuccessCount = g.Count(x => x.Outcome == AuditOutcome.Success),
        FailureCount = g.Count(x => x.Outcome == AuditOutcome.Failure)
              })
    .OrderByDescending(x => x.Count)
  .Take(10)
                .ToList(),
   TopEntities = logs
      .GroupBy(x => x.EntityName)
                .Select(g => new AuditEntitySummaryDto
      {
     EntityName = g.Key,
   Count = g.Count()
           })
       .OrderByDescending(x => x.Count)
     .Take(10)
      .ToList(),
         TopActors = logs
        .Where(x => x.ActorId != null)
    .GroupBy(x => new { x.ActorId, x.ActorDisplayName, x.ActorType })
        .Select(g => new AuditActorSummaryDto
             {
         ActorId = g.Key.ActorId,
      ActorDisplayName = g.Key.ActorDisplayName,
   ActorType = g.Key.ActorType,
    Count = g.Count()
             })
       .OrderByDescending(x => x.Count)
             .Take(10)
     .ToList(),
         ChannelDistribution = logs
.GroupBy(x => x.Channel)
             .Select(g => new AuditChannelSummaryDto
     {
           Channel = g.Key,
           Count = g.Count(),
            Percentage = logs.Count > 0 ? (decimal)g.Count() / logs.Count * 100 : 0
     })
            .OrderByDescending(x => x.Count)
   .ToList(),
    HourlyDistribution = logs
       .GroupBy(x => new DateTime(x.OccurredAt.Year, x.OccurredAt.Month, x.OccurredAt.Day, x.OccurredAt.Hour, 0, 0))
       .Select(g => new AuditTimeSeriesDto
          {
 Timestamp = g.Key,
        Count = g.Count(),
          SuccessCount = g.Count(x => x.Outcome == AuditOutcome.Success),
 FailureCount = g.Count(x => x.Outcome == AuditOutcome.Failure)
     })
      .OrderBy(x => x.Timestamp)
                .ToList(),
       ActiveRetentionPolicies = await _context.Set<AuditRetentionPolicy>().CountAsync(x => x.IsActive),
            PendingExportJobs = await _context.Set<AuditExportJob>().CountAsync(x => x.Status == ExportStatus.Pending)
    };

        return ApiResponse<AuditDashboardDto>.SuccessResponse(dashboard);
    }

    public async Task<ApiResponse<AuditDashboardDto>> GetEntityDashboardAsync(string entityName)
  {
        var now = DateTime.UtcNow;
        var from = now.AddDays(-30);

        var query = _context.Set<AuditLog>()
     .Where(x => x.EntityName == entityName && x.OccurredAt >= from);

        var logs = await query.ToListAsync();

        var dashboard = new AuditDashboardDto
    {
            TotalLogs = logs.Count,
    LogsToday = logs.Count(x => x.OccurredAt.Date == now.Date),
 LogsThisWeek = logs.Count(x => x.OccurredAt >= now.AddDays(-7)),
   LogsThisMonth = logs.Count,
      SuccessCount = logs.Count(x => x.Outcome == AuditOutcome.Success),
         FailureCount = logs.Count(x => x.Outcome == AuditOutcome.Failure),
       SuccessRate = logs.Count > 0 ? (decimal)logs.Count(x => x.Outcome == AuditOutcome.Success) / logs.Count * 100 : 0,
      TopActions = logs
        .GroupBy(x => x.Action)
        .Select(g => new AuditActionSummaryDto
       {
         Action = g.Key,
     Count = g.Count(),
    SuccessCount = g.Count(x => x.Outcome == AuditOutcome.Success),
FailureCount = g.Count(x => x.Outcome == AuditOutcome.Failure)
                })
        .OrderByDescending(x => x.Count)
 .Take(10)
          .ToList()
        };

        return ApiResponse<AuditDashboardDto>.SuccessResponse(dashboard);
    }

  #endregion

    #region Private Helper Methods

    private IQueryable<AuditLog> ApplyFilters(IQueryable<AuditLog> query, AuditLogSearchDto searchDto)
    {
        if (!string.IsNullOrEmpty(searchDto.ActorId))
            query = query.Where(x => x.ActorId == searchDto.ActorId);

        if (searchDto.ActorType.HasValue)
       query = query.Where(x => x.ActorType == searchDto.ActorType.Value);

        if (!string.IsNullOrEmpty(searchDto.Action))
            query = query.Where(x => x.Action == searchDto.Action);

        if (!string.IsNullOrEmpty(searchDto.ActionPrefix))
            query = query.Where(x => x.Action.StartsWith(searchDto.ActionPrefix));

if (!string.IsNullOrEmpty(searchDto.EntityName))
      query = query.Where(x => x.EntityName == searchDto.EntityName);

        if (!string.IsNullOrEmpty(searchDto.EntityId))
        query = query.Where(x => x.EntityId == searchDto.EntityId);

  if (!string.IsNullOrEmpty(searchDto.CorrelationId))
          query = query.Where(x => x.CorrelationId == searchDto.CorrelationId);

        if (!string.IsNullOrEmpty(searchDto.TenantId))
         query = query.Where(x => x.TenantId == searchDto.TenantId);

        if (searchDto.Source.HasValue)
            query = query.Where(x => x.Source == searchDto.Source.Value);

        if (searchDto.Channel.HasValue)
        query = query.Where(x => x.Channel == searchDto.Channel.Value);

    if (searchDto.Outcome.HasValue)
      query = query.Where(x => x.Outcome == searchDto.Outcome.Value);

     if (searchDto.FromDate.HasValue)
            query = query.Where(x => x.OccurredAt >= searchDto.FromDate.Value);

  if (searchDto.ToDate.HasValue)
            query = query.Where(x => x.OccurredAt <= searchDto.ToDate.Value);

        if (!string.IsNullOrEmpty(searchDto.Search))
        {
      var search = searchDto.Search.ToLower();
      query = query.Where(x =>
    x.Action.ToLower().Contains(search) ||
            x.EntityName.ToLower().Contains(search) ||
      (x.ActorDisplayName != null && x.ActorDisplayName.ToLower().Contains(search)));
        }

        return query;
    }

    private AuditLog MapToAuditLog(CreateAuditLogDto dto)
    {
        return new AuditLog
        {
            ActorId = dto.ActorId,
       ActorType = dto.ActorType,
         ActorDisplayName = dto.ActorDisplayName,
       Action = dto.Action,
        EntityName = dto.EntityName,
            EntityId = dto.EntityId,
   CorrelationId = dto.CorrelationId,
   TenantId = dto.TenantId,
   Source = dto.Source,
            Channel = dto.Channel,
            IpAddress = dto.IpAddress,
            UserAgent = dto.UserAgent,
         BeforeJson = dto.Before != null ? JsonSerializer.Serialize(dto.Before, _jsonOptions) : null,
     AfterJson = dto.After != null ? JsonSerializer.Serialize(dto.After, _jsonOptions) : null,
  MetadataJson = dto.Metadata != null ? JsonSerializer.Serialize(dto.Metadata, _jsonOptions) : null,
   Outcome = dto.Outcome,
 ErrorMessage = dto.ErrorMessage,
          DurationMs = dto.DurationMs,
       OccurredAt = DateTime.UtcNow,
CreatedDate = DateTime.UtcNow,
            CreatedBy = dto.ActorId
      };
    }

    private AuditLogDto MapToLogDto(AuditLog log)
    {
      return new AuditLogDto
        {
            Id = log.Id,
            ActorId = log.ActorId,
         ActorType = log.ActorType,
ActorDisplayName = log.ActorDisplayName,
            Action = log.Action,
         EntityName = log.EntityName,
            EntityId = log.EntityId,
   CorrelationId = log.CorrelationId,
 TenantId = log.TenantId,
            Source = log.Source,
       Channel = log.Channel,
            IpAddress = log.IpAddress,
            UserAgent = log.UserAgent,
      BeforeJson = log.BeforeJson,
     AfterJson = log.AfterJson,
     MetadataJson = log.MetadataJson,
    Outcome = log.Outcome,
            ErrorMessage = log.ErrorMessage,
        OccurredAt = log.OccurredAt,
        DurationMs = log.DurationMs
   };
    }

    private AuditLogListDto MapToLogListDto(AuditLog log)
    {
        return new AuditLogListDto
   {
       Id = log.Id,
   ActorDisplayName = log.ActorDisplayName,
 ActorType = log.ActorType,
          Action = log.Action,
            EntityName = log.EntityName,
            EntityId = log.EntityId,
            Outcome = log.Outcome,
        Source = log.Source,
            Channel = log.Channel,
      OccurredAt = log.OccurredAt,
       BeforeJson = log.BeforeJson,
AfterJson = log.AfterJson
        };
    }

    private AuditRetentionPolicyDto MapToPolicyDto(AuditRetentionPolicy policy)
    {
        return new AuditRetentionPolicyDto
        {
            Id = policy.Id,
         NameEn = policy.NameEn,
  NameAr = policy.NameAr,
            DescriptionEn = policy.DescriptionEn,
            DescriptionAr = policy.DescriptionAr,
         IsActive = policy.IsActive,
            IsDefault = policy.IsDefault,
     Priority = policy.Priority,
            RetentionDays = policy.RetentionDays,
            EntityName = policy.EntityName,
   ActionPrefix = policy.ActionPrefix,
 Channel = policy.Channel,
         ActorType = policy.ActorType,
  ArchiveBeforeDelete = policy.ArchiveBeforeDelete,
 ArchiveTarget = policy.ArchiveTarget,
     ArchivePathTemplate = policy.ArchivePathTemplate,
            LastExecutedAt = policy.LastExecutedAt,
            LastExecutionCount = policy.LastExecutionCount,
        CreatedAt = policy.CreatedDate
        };
    }

    private AuditExportJobDto MapToExportJobDto(AuditExportJob job)
    {
        return new AuditExportJobDto
        {
    Id = job.Id,
        FromDate = job.FromDate,
   ToDate = job.ToDate,
         TenantId = job.TenantId,
    EntityName = job.EntityName,
     ActionPrefix = job.ActionPrefix,
        ActorId = job.ActorId,
            Outcome = job.Outcome,
 FilterJson = job.FilterJson,
            Format = job.Format,
      Status = job.Status,
         RequestedBy = job.RequestedBy,
         RequesterName = job.Requester?.FullName ?? job.Requester?.UserName,
        RequestedAt = job.RequestedAt,
 StartedAt = job.StartedAt,
     FileName = job.FileName,
            FileSize = job.FileSize,
            TotalRecords = job.TotalRecords,
 CompletedAt = job.CompletedAt,
       ExpiresAt = job.ExpiresAt,
ErrorMessage = job.ErrorMessage
   };
    }

    private AuditExportJobListDto MapToExportJobListDto(AuditExportJob job)
    {
      return new AuditExportJobListDto
     {
       Id = job.Id,
       FromDate = job.FromDate,
            ToDate = job.ToDate,
            Format = job.Format,
  Status = job.Status,
 RequesterName = job.Requester?.FullName ?? job.Requester?.UserName,
       RequestedAt = job.RequestedAt,
       TotalRecords = job.TotalRecords,
    CompletedAt = job.CompletedAt,
          ExpiresAt = job.ExpiresAt
        };
    }

    #endregion
}
