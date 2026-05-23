using Smart_Core.Application.DTOs.Assessment;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.Assessment;

public interface IWalkInFieldService
{
    Task<ApiResponse<List<WalkInFieldDto>>> GetFieldsAsync(int examId);
    Task<ApiResponse<WalkInFieldDto>> SaveFieldAsync(int examId, int? fieldId, SaveWalkInFieldDto dto, string userId);
    Task<ApiResponse<bool>> DeleteFieldAsync(int examId, int fieldId, string userId);
    Task<ApiResponse<bool>> ReorderFieldsAsync(int examId, List<ReorderWalkInFieldDto> orders, string userId);
    Task<ApiResponse<List<WalkInAnswerDto>>> GetAnswersByExamAsync(int examId);
}
