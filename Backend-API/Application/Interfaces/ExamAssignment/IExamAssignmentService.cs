using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamAssignment;

namespace Smart_Core.Application.Interfaces.ExamAssignment;

public interface IExamAssignmentService
{
    Task<ApiResponse<PaginatedResponse<AssignmentCandidateDto>>> GetCandidatesAsync(AssignmentCandidateFilterDto filter);
    Task<ApiResponse<AssignmentResultDto>> AssignAsync(AssignExamDto dto, string assignedBy);
    Task<ApiResponse<AssignmentResultDto>> UnassignAsync(UnassignExamDto dto);
}
