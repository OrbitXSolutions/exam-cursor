using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Logs;
using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.Interfaces.Logs;

public interface ISystemLogService
{
    Task<PaginatedResponse<SystemLogDto>> GetLogsAsync(LogCategory category, SystemLogFilterDto filter, CancellationToken cancellationToken = default);
    Task<SystemLogDetailDto?> GetDetailAsync(long id, CancellationToken cancellationToken = default);
    Task<SystemLogStatsDto> GetStatsAsync(CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AppLogEntryDto>> GetAppLogsAsync(AppLogFilterDto filter, CancellationToken cancellationToken = default);
    Task<PaginatedResponse<AppErrorEntryDto>> GetAppErrorsAsync(AppLogFilterDto filter, CancellationToken cancellationToken = default);
}
