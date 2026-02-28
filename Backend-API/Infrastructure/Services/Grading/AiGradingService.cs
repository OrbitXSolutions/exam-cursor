using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Grading;
using Smart_Core.Application.Interfaces.Grading;
using Smart_Core.Application.Settings;
using Smart_Core.Domain.Entities.Grading;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Grading;

/// <summary>
/// AI-powered grading assistant using OpenAI GPT-4o.
/// Provides suggested scores and professional feedback for subjective/essay questions.
/// All suggestions are advisory — examiner has final authority.
/// </summary>
public class AiGradingService : IAiGradingService
{
    private readonly ApplicationDbContext _context;
    private readonly OpenAISettings _openAiSettings;
    private readonly ILogger<AiGradingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public AiGradingService(
        ApplicationDbContext context,
        IOptions<OpenAISettings> openAiSettings,
        ILogger<AiGradingService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _openAiSettings = openAiSettings.Value;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<ApiResponse<AiGradeSuggestResponseDto>> GetAiGradeSuggestionAsync(AiGradeSuggestRequestDto request)
    {
        try
        {
            // 1. Load grading session with all needed data
            var session = await _context.Set<GradingSession>()
                .Include(gs => gs.Attempt)
                    .ThenInclude(a => a.Questions)
                .Include(gs => gs.Answers)
                    .ThenInclude(ga => ga.Question)
                        .ThenInclude(q => q.QuestionType)
                .Include(gs => gs.Answers)
                    .ThenInclude(ga => ga.Question)
                        .ThenInclude(q => q.AnswerKey)
                .FirstOrDefaultAsync(gs => gs.Id == request.GradingSessionId);

            if (session == null)
                return ApiResponse<AiGradeSuggestResponseDto>.FailureResponse("Grading session not found");

            // 2. Find the specific graded answer
            var gradedAnswer = session.Answers.FirstOrDefault(a => a.QuestionId == request.QuestionId);
            if (gradedAnswer == null)
                return ApiResponse<AiGradeSuggestResponseDto>.FailureResponse("Question not found in this grading session");

            // 3. Get max points for this question
            var attemptQuestion = session.Attempt.Questions.FirstOrDefault(q => q.QuestionId == request.QuestionId);
            var maxPoints = attemptQuestion?.Points ?? gradedAnswer.Question.Points;

            // 4. Build the prompt
            var question = gradedAnswer.Question;
            var studentAnswer = gradedAnswer.TextAnswer;

            if (string.IsNullOrWhiteSpace(studentAnswer))
            {
                return ApiResponse<AiGradeSuggestResponseDto>.SuccessResponse(new AiGradeSuggestResponseDto
                {
                    SuggestedScore = 0,
                    SuggestedComment = "No answer was provided by the candidate.",
                    Confidence = 100,
                    Model = _openAiSettings.Model
                }, "No answer to grade");
            }

            var rubric = question.AnswerKey?.RubricTextEn ?? question.AnswerKey?.RubricTextAr ?? "";
            var questionBody = !string.IsNullOrWhiteSpace(question.BodyEn) ? question.BodyEn : question.BodyAr;
            var questionType = question.QuestionType?.NameEn ?? "Essay";

            var prompt = BuildGradingPrompt(questionBody, studentAnswer, rubric, maxPoints, questionType);

            // 5. Call OpenAI
            var (aiResult, errorMessage) = await CallOpenAiAsync(prompt);

            if (aiResult == null)
                return ApiResponse<AiGradeSuggestResponseDto>.FailureResponse(
                    errorMessage ?? "AI service is temporarily unavailable. Please grade manually.");

            // 6. Clamp score to valid range
            aiResult.SuggestedScore = Math.Max(0, Math.Min(aiResult.SuggestedScore, maxPoints));
            aiResult.Model = _openAiSettings.Model;

            _logger.LogInformation(
                "AI grading suggestion for Session {SessionId}, Question {QuestionId}: Score={Score}/{Max}, Confidence={Confidence}%",
                request.GradingSessionId, request.QuestionId, aiResult.SuggestedScore, maxPoints, aiResult.Confidence);

            return ApiResponse<AiGradeSuggestResponseDto>.SuccessResponse(aiResult, "AI suggestion generated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI grading suggestion for Session {SessionId}, Question {QuestionId}",
                request.GradingSessionId, request.QuestionId);
            return ApiResponse<AiGradeSuggestResponseDto>.FailureResponse("Failed to generate AI suggestion. Please grade manually.");
        }
    }

    #region Private Methods

    private static string BuildGradingPrompt(string questionBody, string studentAnswer, string rubric, decimal maxPoints, string questionType)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are an expert exam grader for a professional assessment system.");
        sb.AppendLine("Your task is to evaluate a student's answer and provide a fair, detailed grade.");
        sb.AppendLine();
        sb.AppendLine("GRADING RULES:");
        sb.AppendLine($"- Maximum score is {maxPoints} points");
        sb.AppendLine("- Be fair and consistent in grading");
        sb.AppendLine("- Consider partial credit for partially correct answers");
        sb.AppendLine("- Focus on factual accuracy, completeness, and clarity");
        sb.AppendLine("- If the answer is in Arabic, evaluate it in its language context");
        sb.AppendLine();
        sb.AppendLine($"QUESTION TYPE: {questionType}");
        sb.AppendLine();
        sb.AppendLine("QUESTION:");
        sb.AppendLine(questionBody);
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(rubric))
        {
            sb.AppendLine("MODEL ANSWER / GRADING RUBRIC:");
            sb.AppendLine(rubric);
            sb.AppendLine();
        }
        else
        {
            sb.AppendLine("NOTE: No model answer or rubric was provided for this question.");
            sb.AppendLine("Grade based on the quality, accuracy, completeness, and clarity of the student's answer.");
            sb.AppendLine("Use your expert knowledge of the subject matter to evaluate.");
            sb.AppendLine();
        }

        sb.AppendLine("STUDENT'S ANSWER:");
        sb.AppendLine(studentAnswer);
        sb.AppendLine();
        sb.AppendLine("RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):");
        sb.AppendLine("{");
        sb.AppendLine($"  \"suggestedScore\": <number between 0 and {maxPoints}>,");
        sb.AppendLine("  \"suggestedComment\": \"<professional feedback explaining the grade, strengths and areas for improvement>\",");
        sb.AppendLine("  \"confidence\": <integer 0-100 representing how confident you are in this grade>");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private async Task<(AiGradeSuggestResponseDto? Result, string? ErrorMessage)> CallOpenAiAsync(string prompt)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiSettings.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(30);

        var requestBody = new
        {
            model = _openAiSettings.Model,
            messages = new[]
            {
                new { role = "system", content = "You are a professional exam grading assistant. Always respond with valid JSON only. No markdown formatting." },
                new { role = "user", content = prompt }
            },
            max_tokens = _openAiSettings.MaxTokens,
            temperature = _openAiSettings.Temperature,
            response_format = new { type = "json_object" }
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync("https://api.openai.com/v1/chat/completions", content);
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("OpenAI API request timed out");
            return (null, "AI request timed out. Please try again or grade manually.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "OpenAI API connection error");
            return (null, "Cannot connect to AI service. Please check your internet connection.");
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("OpenAI API error: {StatusCode} - {Body}", response.StatusCode, errorBody);

            var errorMessage = response.StatusCode switch
            {
                System.Net.HttpStatusCode.TooManyRequests => "OpenAI quota exceeded. Please check your billing at platform.openai.com or try again later.",
                System.Net.HttpStatusCode.Unauthorized => "Invalid OpenAI API key. Please update your API key in settings.",
                System.Net.HttpStatusCode.BadRequest => "Invalid request to AI service. Please contact support.",
                System.Net.HttpStatusCode.InternalServerError => "OpenAI service is experiencing issues. Please try again later.",
                _ => $"AI service error ({response.StatusCode}). Please try again or grade manually."
            };

            return (null, errorMessage);
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        var openAiResponse = JsonSerializer.Deserialize<OpenAiChatResponse>(responseJson, JsonOptions);

        var messageContent = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(messageContent))
        {
            _logger.LogWarning("OpenAI returned empty response");
            return (null, "AI returned an empty response. Please try again.");
        }

        // Parse the AI's JSON response
        try
        {
            var result = JsonSerializer.Deserialize<AiGradeSuggestResponseDto>(messageContent, JsonOptions);
            return (result, null);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse OpenAI response: {Content}", messageContent);

            // Attempt graceful fallback: try to extract from possible markdown wrapper
            var cleaned = messageContent.Trim();
            if (cleaned.StartsWith("```"))
            {
                var lines = cleaned.Split('\n');
                cleaned = string.Join('\n', lines.Skip(1).TakeWhile(l => !l.StartsWith("```")));
                try
                {
                    return (JsonSerializer.Deserialize<AiGradeSuggestResponseDto>(cleaned, JsonOptions), null);
                }
                catch
                {
                    // Final fallback
                }
            }

            return (null, "AI returned an unexpected format. Please try again or grade manually.");
        }
    }

    #endregion

    #region OpenAI Response Models

    private class OpenAiChatResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenAiChoice>? Choices { get; set; }
    }

    private class OpenAiChoice
    {
        [JsonPropertyName("message")]
        public OpenAiMessage? Message { get; set; }
    }

    private class OpenAiMessage
    {
        [JsonPropertyName("content")]
        public string? Content { get; set; }
    }

    #endregion
}
