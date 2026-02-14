using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.ExamOperations;

namespace Smart_Core.Application.Interfaces.ExamOperations;

public interface IExamOperationsService
{
    /// <summary>List candidates with their attempt info for a given exam (admin view)</summary>
    Task<ApiResponse<PaginatedResponse<ExamOperationsCandidateDto>>> GetCandidatesAsync(
        ExamOperationsFilterDto filter);

    /// <summary>Grant a new attempt override for a candidate on a specific exam</summary>
    Task<ApiResponse<AllowNewAttemptResultDto>> AllowNewAttemptAsync(
        AllowNewAttemptDto dto, string adminUserId);

    /// <summary>Add extra time to an active attempt</summary>
    Task<ApiResponse<OperationAddTimeResultDto>> AddTimeAsync(
        OperationAddTimeDto dto, string adminUserId);

    /// <summary>Terminate (force-end) an active attempt</summary>
    Task<ApiResponse<TerminateAttemptResultDto>> TerminateAttemptAsync(
        TerminateAttemptDto dto, string adminUserId);

    /// <summary>Resume a paused attempt (hidden in UI but exists in code)</summary>
    Task<ApiResponse<ResumeAttemptOperationResultDto>> ResumeAttemptAsync(
        ResumeAttemptOperationDto dto, string adminUserId);

    /// <summary>Get admin operation audit logs for a candidate+exam</summary>
    Task<ApiResponse<List<AdminOperationLogDto>>> GetOperationLogsAsync(
        string candidateId, int examId);
}
