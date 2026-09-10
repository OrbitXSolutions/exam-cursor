using System.Globalization;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Logs;
using Smart_Core.Application.Interfaces.Logs;
using Smart_Core.Domain.Common;
using Smart_Core.Domain.Entities.Logs;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Logs;

public sealed class SystemLogService : ISystemLogService
{
    private readonly ApplicationDbContext _db;

    public SystemLogService(ApplicationDbContext db)
    {
        _db = db;
    }

    // Explicit projections also prevent returning historical payloads stored by older middleware.
    private static readonly Expression<Func<SystemLog, SystemLogDetailDto>> Metadata = log => new SystemLogDetailDto
    {
        Id = log.Id,
        Timestamp = log.Timestamp,
        Level = log.Level.ToString(),
        Category = log.Category.ToString(),
        UserId = log.UserId,
        UserRole = log.UserRole,
        Action = log.Action,
        Controller = log.Controller,
        Endpoint = log.Endpoint,
        HttpMethod = log.HttpMethod,
        ResponseStatusCode = log.ResponseStatusCode,
        ErrorMessage = log.ResponseStatusCode >= 400 || log.Level >= SystemLogLevel.Warning
            ? "Request did not complete successfully." : null,
        ExceptionType = log.ExceptionType,
        TraceId = log.TraceId,
        DurationMs = log.DurationMs
    };

    public async Task<PaginatedResponse<SystemLogDto>> GetLogsAsync(LogCategory category,
        SystemLogFilterDto filter, CancellationToken cancellationToken = default)
    {
        var query = Filter(_db.SystemLogs.AsNoTracking().Where(log => log.Category == category), filter);
        var result = await PageAsync(query, filter, cancellationToken);
        return new PaginatedResponse<SystemLogDto>
        {
            Items = result.Items.Cast<SystemLogDto>().ToList(),
            PageNumber = result.PageNumber,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public Task<SystemLogDetailDto?> GetDetailAsync(long id, CancellationToken cancellationToken = default) =>
        _db.SystemLogs.AsNoTracking().Where(log => log.Id == id).Select(Metadata).SingleOrDefaultAsync(cancellationToken);

    public async Task<SystemLogStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var today = new DateTimeOffset(UaeTimeHelper.NowUae.Date, UaeTimeHelper.UaeOffset);
        var tomorrow = today.AddDays(1);
        return await _db.SystemLogs.AsNoTracking().GroupBy(log => 1).Select(group => new SystemLogStatsDto
        {
            CandidateCount = group.Count(log => log.Category == LogCategory.Candidate),
            ProctorCount = group.Count(log => log.Category == LogCategory.Proctor),
            UserCount = group.Count(log => log.Category == LogCategory.User),
            DeveloperCount = group.Count(log => log.Category == LogCategory.Developer),
            ErrorCount = group.Count(log => log.Level == SystemLogLevel.Error || log.Level == SystemLogLevel.Critical),
            WarningCount = group.Count(log => log.Level == SystemLogLevel.Warning),
            TodayCount = group.Count(log => log.Timestamp >= today && log.Timestamp < tomorrow)
        }).SingleOrDefaultAsync(cancellationToken) ?? new SystemLogStatsDto();
    }

    public async Task<PaginatedResponse<AppLogEntryDto>> GetAppLogsAsync(AppLogFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var systemFilter = ConvertFilter(filter);
        var page = await PageAsync(Filter(_db.SystemLogs.AsNoTracking(), systemFilter), systemFilter, cancellationToken);
        return new PaginatedResponse<AppLogEntryDto>
        {
            PageNumber = page.PageNumber,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = page.Items.Select(log => new AppLogEntryDto
            {
                Id = log.Id, TimeStamp = log.Timestamp, Level = AppLevel(log.Level),
                Message = log.Action, UserId = log.UserId, RequestPath = log.Endpoint,
                RequestMethod = log.HttpMethod, StatusCode = log.ResponseStatusCode?.ToString(CultureInfo.InvariantCulture),
                ElapsedMs = log.DurationMs?.ToString(CultureInfo.InvariantCulture)
            }).ToList()
        };
    }

    public async Task<PaginatedResponse<AppErrorEntryDto>> GetAppErrorsAsync(AppLogFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var systemFilter = ConvertFilter(filter);
        var query = _db.SystemLogs.AsNoTracking().Where(log => log.Category == LogCategory.Developer &&
            (log.ResponseStatusCode >= 400 || log.Level >= SystemLogLevel.Warning));
        var page = await PageAsync(Filter(query, systemFilter), systemFilter, cancellationToken);
        return new PaginatedResponse<AppErrorEntryDto>
        {
            PageNumber = page.PageNumber,
            PageSize = page.PageSize,
            TotalCount = page.TotalCount,
            Items = page.Items.Select(log => new AppErrorEntryDto
            {
                Id = log.Id, TimeStamp = log.Timestamp, Level = AppLevel(log.Level),
                Message = log.ErrorMessage ?? log.Action, UserId = log.UserId,
                ExceptionType = log.ExceptionType, Endpoint = log.Endpoint, RequestId = log.TraceId
            }).ToList()
        };
    }

    private static IQueryable<SystemLog> Filter(IQueryable<SystemLog> query, SystemLogFilterDto filter)
    {
        if (filter.Level.HasValue) query = query.Where(log => log.Level == filter.Level.Value);
        if (filter.StatusCode.HasValue) query = query.Where(log => log.ResponseStatusCode == filter.StatusCode.Value);
        if (!string.IsNullOrWhiteSpace(filter.UserId)) query = query.Where(log => log.UserId == filter.UserId);
        if (!string.IsNullOrWhiteSpace(filter.Action)) query = query.Where(log => log.Action.Contains(filter.Action));
        if (!string.IsNullOrWhiteSpace(filter.Endpoint)) query = query.Where(log => log.Endpoint != null && log.Endpoint.Contains(filter.Endpoint));
        if (filter.DateFrom.HasValue) query = query.Where(log => log.Timestamp >= filter.DateFrom.Value);
        if (filter.DateTo.HasValue)
        {
            var until = filter.DateTo.Value;
            if (until.TimeOfDay == TimeSpan.Zero && until.Date < DateTime.MaxValue.Date)
            {
                until = until.AddDays(1);
                query = query.Where(log => log.Timestamp < until);
            }
            else query = query.Where(log => log.Timestamp <= until);
        }
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search;
            query = query.Where(log => log.Action.Contains(search) ||
                (log.Endpoint != null && log.Endpoint.Contains(search)) ||
                (log.TraceId != null && log.TraceId.Contains(search)) ||
                (log.UserId != null && log.UserId.Contains(search)) ||
                (log.ExceptionType != null && log.ExceptionType.Contains(search)));
        }
        return query;
    }

    private static async Task<PaginatedResponse<SystemLogDetailDto>> PageAsync(IQueryable<SystemLog> query,
        SystemLogFilterDto filter, CancellationToken cancellationToken)
    {
        var pageNumber = Math.Clamp(filter.PageNumber, 1, 1000000);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);
        return new PaginatedResponse<SystemLogDetailDto>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = await query.CountAsync(cancellationToken),
            Items = await query.OrderByDescending(log => log.Timestamp).ThenByDescending(log => log.Id)
                .Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(Metadata).ToListAsync(cancellationToken)
        };
    }

    private static SystemLogFilterDto ConvertFilter(AppLogFilterDto filter) => new()
    {
        Level = filter.Level switch
        {
            "Info" or "Information" => SystemLogLevel.Info,
            "Warning" => SystemLogLevel.Warning,
            "Error" => SystemLogLevel.Error,
            "Fatal" or "Critical" => SystemLogLevel.Critical,
            _ => null
        },
        Search = filter.Search, DateFrom = filter.DateFrom, DateTo = filter.DateTo,
        PageNumber = filter.PageNumber, PageSize = filter.PageSize
    };

    private static string AppLevel(string level) => level switch
    {
        "Info" => "Information",
        "Critical" => "Fatal",
        _ => level
    };
}
