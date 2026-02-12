using Smart_Core.Application.DTOs.CandidateExamDetails;
using Smart_Core.Application.DTOs.Common;

namespace Smart_Core.Application.Interfaces.CandidateExamDetails;

public interface ICandidateExamDetailsService
{
    /// <summary>
    /// Get enriched exam details for a candidate — ONE call, all data.
    /// </summary>
    Task<ApiResponse<CandidateExamDetailsDto>> GetExamDetailsAsync(CandidateExamDetailsQueryDto query);

    /// <summary>
    /// Get list of exams that a candidate has attempts for (for dropdown).
    /// </summary>
    Task<ApiResponse<List<CandidateExamBriefDto>>> GetCandidateExamsAsync(string candidateId);
}
