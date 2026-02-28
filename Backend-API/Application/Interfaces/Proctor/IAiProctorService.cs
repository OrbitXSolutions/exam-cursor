using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;

namespace Smart_Core.Application.Interfaces.Proctor;

/// <summary>
/// AI-powered proctor analysis service using OpenAI GPT-4o.
/// Provides risk explanations and behavioral analysis for proctoring sessions.
/// All analysis results are advisory — the proctor always has final authority.
/// </summary>
public interface IAiProctorService
{
    /// <summary>
    /// Generate an AI-powered risk analysis for a proctoring session.
    /// Analyzes events, violations, and behavioral patterns to produce
    /// a human-readable risk explanation and recommendation.
    /// </summary>
    /// <param name="sessionId">The proctor session to analyze</param>
    /// <returns>AI risk analysis with explanation, suspicious behaviors, and recommendation</returns>
    Task<ApiResponse<AiProctorAnalysisResponseDto>> GetAiRiskAnalysisAsync(int sessionId);
}
