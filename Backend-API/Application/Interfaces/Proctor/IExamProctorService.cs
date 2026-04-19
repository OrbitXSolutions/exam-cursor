using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;

namespace Smart_Core.Application.Interfaces.Proctor;

public interface IExamProctorService
{
    /// <summary>
    /// Returns all proctors (assigned + available) for a given exam in one call.
    /// </summary>
    Task<ApiResponse<ExamProctorPageDto>> GetExamProctorsAsync(int examId);

    /// <summary>
    /// Assigns one or more proctors to an exam. Already-assigned proctors are skipped.
    /// </summary>
    Task<ApiResponse<ProctorAssignmentResultDto>> AssignAsync(AssignProctorToExamDto dto, string assignedBy);

    /// <summary>
    /// Removes one or more proctors from an exam.
    /// </summary>
    Task<ApiResponse<ProctorAssignmentResultDto>> UnassignAsync(UnassignProctorFromExamDto dto);
}
