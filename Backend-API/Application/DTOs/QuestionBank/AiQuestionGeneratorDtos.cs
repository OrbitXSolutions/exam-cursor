using Smart_Core.Domain.Enums;

namespace Smart_Core.Application.DTOs.QuestionBank;

/// <summary>
/// Request DTO for AI question generation
/// </summary>
public class AiGenerateQuestionsRequestDto
{
    /// <summary>
    /// Subject ID for context
    /// </summary>
    public int SubjectId { get; set; }

    /// <summary>
    /// Optional Topic ID for more specific questions
    /// </summary>
    public int? TopicId { get; set; }

    /// <summary>
    /// Question type: 1=MCQ Single, 2=MCQ Multi, 3=True/False
    /// </summary>
    public int QuestionTypeId { get; set; }

    /// <summary>
    /// Difficulty level (Easy=1, Medium=2, Hard=3)
    /// </summary>
    public DifficultyLevel DifficultyLevel { get; set; }

    /// <summary>
    /// Number of questions to generate (1-10)
    /// </summary>
    public int NumberOfQuestions { get; set; } = 5;

    /// <summary>
    /// Points per question
    /// </summary>
    public decimal Points { get; set; } = 1;

    /// <summary>
    /// Optional custom topic/instruction for the AI
    /// </summary>
    public string? CustomTopic { get; set; }

    /// <summary>
    /// Language: "en", "ar", or "both"
    /// </summary>
    public string Language { get; set; } = "en";
}

/// <summary>
/// A single AI-generated question with its options
/// </summary>
public class AiGeneratedQuestionDto
{
    public string BodyEn { get; set; } = string.Empty;
    public string BodyAr { get; set; } = string.Empty;
    public string? ExplanationEn { get; set; }
    public string? ExplanationAr { get; set; }
    public int QuestionTypeId { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public decimal Points { get; set; }
    public List<AiGeneratedOptionDto> Options { get; set; } = new();
}

/// <summary>
/// A single AI-generated option
/// </summary>
public class AiGeneratedOptionDto
{
    public string TextEn { get; set; } = string.Empty;
    public string TextAr { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Response DTO containing all AI-generated questions
/// </summary>
public class AiGenerateQuestionsResponseDto
{
    public List<AiGeneratedQuestionDto> Questions { get; set; } = new();
    public int TotalGenerated { get; set; }
    public string Model { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string? TopicName { get; set; }
    public string QuestionTypeName { get; set; } = string.Empty;
}
