using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Assessment;

public interface IExamShareService
{
    // ========== Admin endpoints (authenticated) ==========
    Task<ApiResponse<ExamShareLinkDto>> GenerateShareLinkAsync(int examId, GenerateShareLinkDto? dto, string createdBy, string baseUrl);
    Task<ApiResponse<ExamShareLinkDto>> GetShareLinkAsync(int examId, string baseUrl);
    Task<ApiResponse<bool>> RevokeShareLinkAsync(int examId, string updatedBy);

    // ========== Public endpoints (no auth) ==========
    Task<ApiResponse<PublicExamInfoDto>> GetExamByShareTokenAsync(string shareToken);
    Task<ApiResponse<List<ShareCandidateDto>>> GetCandidatesByShareTokenAsync(string shareToken, string? search);
    Task<ApiResponse<SelectCandidateResponseDto>> SelectCandidateAsync(string shareToken, SelectCandidateDto dto);
}
