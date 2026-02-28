namespace Smart_Core.Application.DTOs.Grading;

/// <summary>
/// Request DTO for AI grading suggestion
/// </summary>
public class AiGradeSuggestRequestDto
{
    /// <summary>
    /// The grading session containing the answer
    /// </summary>
    public int GradingSessionId { get; set; }

    /// <summary>
    /// The question to get AI suggestion for
    /// </summary>
    public int QuestionId { get; set; }
}

/// <summary>
/// Response DTO with AI-suggested grade and feedback
/// </summary>
public class AiGradeSuggestResponseDto
{
    /// <summary>
    /// AI-suggested score (0 to MaxPoints)
    /// </summary>
    public decimal SuggestedScore { get; set; }

    /// <summary>
    /// AI-suggested feedback/comment for the examiner
    /// </summary>
    public string SuggestedComment { get; set; } = string.Empty;

    /// <summary>
    /// Confidence level (0-100%) of the AI suggestion
    /// </summary>
    public int Confidence { get; set; }

    /// <summary>
    /// The AI model used for this suggestion
    /// </summary>
    public string Model { get; set; } = string.Empty;
}
