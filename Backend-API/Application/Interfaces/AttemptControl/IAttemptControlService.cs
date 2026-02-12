using Smart_Core.Application.DTOs.AttemptControl;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.AttemptControl;

public interface IAttemptControlService
{
    Task<ApiResponse<PaginatedResponse<AttemptControlItemDto>>> GetAttemptsAsync(AttemptControlFilterDto filter);
    Task<ApiResponse<ForceEndResultDto>> ForceEndAsync(ForceEndAttemptDto dto, string adminUserId);
    Task<ApiResponse<ResumeResultDto>> ResumeAsync(ResumeAttemptControlDto dto, string adminUserId);
    Task<ApiResponse<AddTimeResultDto>> AddTimeAsync(AddTimeDto dto, string adminUserId);
}
