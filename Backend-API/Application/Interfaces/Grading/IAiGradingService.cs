using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Grading;

namespace Smart_Core.Application.Interfaces.Grading;

/// <summary>
/// Service interface for AI-powered grading suggestions using OpenAI GPT-4o.
/// Provides suggested scores and feedback for subjective/essay questions
/// to assist examiners — the examiner always has final decision.
/// </summary>
public interface IAiGradingService
{
    /// <summary>
    /// Get AI-suggested grade and comment for a subjective question answer.
    /// </summary>
    /// <param name="request">The grading session and question identifiers</param>
    /// <returns>Suggested score, comment, and confidence from AI</returns>
    Task<ApiResponse<AiGradeSuggestResponseDto>> GetAiGradeSuggestionAsync(AiGradeSuggestRequestDto request);
}
