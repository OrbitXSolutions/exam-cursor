using Smart_Core.Application.DTOs.CandidateAdmin;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.CandidateAdmin;

public interface ICandidateAdminService
{
    Task<ApiResponse<PaginatedResponse<CandidateListDto>>> GetCandidatesAsync(CandidateFilterDto filter);
    Task<ApiResponse<CandidateListDto>> GetCandidateByIdAsync(string id);
    Task<ApiResponse<CandidateListDto>> CreateCandidateAsync(CreateCandidateDto dto, string createdBy);
    Task<ApiResponse<CandidateListDto>> UpdateCandidateAsync(string id, UpdateCandidateDto dto, string updatedBy);
    Task<ApiResponse<bool>> BlockCandidateAsync(string id, string blockedBy);
    Task<ApiResponse<bool>> UnblockCandidateAsync(string id, string updatedBy);
    Task<ApiResponse<bool>> DeleteCandidateAsync(string id, string deletedBy);
    Task<ApiResponse<CandidateImportResultDto>> ImportCandidatesAsync(Stream fileStream, string createdBy);
    Task<byte[]> ExportCandidatesAsync(CandidateFilterDto filter);
    Task<byte[]> GetImportTemplateAsync();
}
