using Smart_Core.Application.DTOs.Batch;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Batch;

public interface IBatchService
{
    Task<ApiResponse<PaginatedResponse<BatchListDto>>> GetBatchesAsync(BatchFilterDto filter);
    Task<ApiResponse<BatchDetailDto>> GetBatchByIdAsync(int id);
    Task<ApiResponse<BatchListDto>> CreateBatchAsync(CreateBatchDto dto, string createdBy);
    Task<ApiResponse<BatchListDto>> UpdateBatchAsync(int id, UpdateBatchDto dto, string updatedBy);
    Task<ApiResponse<bool>> DeleteBatchAsync(int id, string deletedBy);
    Task<ApiResponse<bool>> ToggleStatusAsync(int id, string updatedBy);
    Task<ApiResponse<BatchCandidateChangeResultDto>> AddCandidatesAsync(int batchId, BatchCandidateIdsDto dto, string addedBy);
    Task<ApiResponse<BatchCandidateChangeResultDto>> RemoveCandidatesAsync(int batchId, BatchCandidateIdsDto dto);
    Task<byte[]> ExportBatchCandidatesAsync(int batchId);
}
