namespace Smart_Core.Application.DTOs.Proctor;

/// <summary>
/// Response DTO for AI-powered proctor risk analysis.
/// Advisory only — the proctor always has final authority.
/// </summary>
public class AiProctorAnalysisResponseDto
{
    /// <summary>AI-assessed risk level: Low, Medium, High, Critical</summary>
    public string RiskLevel { get; set; } = string.Empty;

    /// <summary>Human-readable explanation of the risk assessment</summary>
    public string RiskExplanation { get; set; } = string.Empty;

    /// <summary>List of specific suspicious behaviors identified</summary>
    public List<string> SuspiciousBehaviors { get; set; } = new();

    /// <summary>AI recommendation for the proctor (e.g., "Flag for manual review")</summary>
    public string Recommendation { get; set; } = string.Empty;

    /// <summary>Confidence level (0-100%) of the AI analysis</summary>
    public int Confidence { get; set; }

    /// <summary>Detailed narrative analysis of the session</summary>
    public string DetailedAnalysis { get; set; } = string.Empty;

    /// <summary>The AI model used for this analysis</summary>
    public string Model { get; set; } = string.Empty;

    /// <summary>When the analysis was generated</summary>
    public DateTime GeneratedAt { get; set; }
}
