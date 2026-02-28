using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.QuestionBank;

namespace Smart_Core.Application.Interfaces.QuestionBank;

/// <summary>
/// Service interface for AI-powered question generation using OpenAI GPT-4o.
/// Generates MCQ (single/multi) and True/False questions for the Question Bank.
/// All generated questions are reviewed by admin/instructor before saving.
/// </summary>
public interface IAiQuestionGeneratorService
{
    /// <summary>
    /// Generate questions using AI based on subject, topic, type and difficulty.
    /// </summary>
    /// <param name="request">Generation parameters</param>
    /// <returns>List of generated questions with options</returns>
    Task<ApiResponse<AiGenerateQuestionsResponseDto>> GenerateQuestionsAsync(AiGenerateQuestionsRequestDto request);
}
