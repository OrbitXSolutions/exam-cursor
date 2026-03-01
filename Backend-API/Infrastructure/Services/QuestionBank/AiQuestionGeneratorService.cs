using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.QuestionBank;
using Smart_Core.Application.Interfaces.QuestionBank;
using Smart_Core.Application.Settings;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.QuestionBank;

/// <summary>
/// AI-powered question generator using OpenAI GPT-4o.
/// Generates MCQ (single/multi answer) and True/False questions
/// based on subject, topic, difficulty, and optional custom instructions.
/// </summary>
public class AiQuestionGeneratorService : IAiQuestionGeneratorService
{
    private readonly ApplicationDbContext _context;
    private readonly OpenAISettings _openAiSettings;
    private readonly ILogger<AiQuestionGeneratorService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public AiQuestionGeneratorService(
        ApplicationDbContext context,
        IOptions<OpenAISettings> openAiSettings,
        ILogger<AiQuestionGeneratorService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _openAiSettings = openAiSettings.Value;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<ApiResponse<AiGenerateQuestionsResponseDto>> GenerateQuestionsAsync(AiGenerateQuestionsRequestDto request)
    {
        try
        {
            // Validate request
            if (request.NumberOfQuestions < 1 || request.NumberOfQuestions > 10)
                return ApiResponse<AiGenerateQuestionsResponseDto>.FailureResponse("Number of questions must be between 1 and 10");

            if (request.QuestionTypeId < 1 || request.QuestionTypeId > 3)
                return ApiResponse<AiGenerateQuestionsResponseDto>.FailureResponse("Only MCQ Single (1), MCQ Multi (2), and True/False (3) are supported");

            // 1. Load subject and topic names for context
            var subject = await _context.Set<Domain.Entities.Lookups.QuestionSubject>()
                .FirstOrDefaultAsync(s => s.Id == request.SubjectId);
            if (subject == null)
                return ApiResponse<AiGenerateQuestionsResponseDto>.FailureResponse("Subject not found");

            string? topicName = null;
            if (request.TopicId.HasValue)
            {
                var topic = await _context.Set<Domain.Entities.Lookups.QuestionTopic>()
                    .FirstOrDefaultAsync(t => t.Id == request.TopicId.Value);
                topicName = topic?.NameEn ?? topic?.NameAr;
            }

            // 2. Get question type name
            var questionType = await _context.Set<Domain.Entities.Lookups.QuestionType>()
                .FirstOrDefaultAsync(qt => qt.Id == request.QuestionTypeId);
            var questionTypeName = questionType?.NameEn ?? GetQuestionTypeName(request.QuestionTypeId);

            // 3. Build the prompt
            var subjectName = !string.IsNullOrWhiteSpace(subject.NameEn) ? subject.NameEn : subject.NameAr;
            var prompt = BuildGenerationPrompt(request, subjectName, topicName, questionTypeName);

            // 4. Call OpenAI
            var (aiResult, errorMessage) = await CallOpenAiAsync(prompt);

            if (aiResult == null)
                return ApiResponse<AiGenerateQuestionsResponseDto>.FailureResponse(
                    errorMessage ?? "AI service is temporarily unavailable. Please try again.");

            // 5. Post-process: set type, difficulty, and points on all generated questions
            foreach (var q in aiResult.Questions)
            {
                q.QuestionTypeId = request.QuestionTypeId;
                q.DifficultyLevel = request.DifficultyLevel;
                q.Points = request.Points;

                // Ensure option ordering
                for (int i = 0; i < q.Options.Count; i++)
                    q.Options[i].Order = i;
            }

            aiResult.TotalGenerated = aiResult.Questions.Count;
            aiResult.Model = _openAiSettings.Model;
            aiResult.SubjectName = subjectName;
            aiResult.TopicName = topicName;
            aiResult.QuestionTypeName = questionTypeName;

            _logger.LogInformation(
                "AI generated {Count} {Type} questions for Subject '{Subject}', Topic '{Topic}', Difficulty {Difficulty}",
                aiResult.TotalGenerated, questionTypeName, subjectName, topicName ?? "N/A", request.DifficultyLevel);

            return ApiResponse<AiGenerateQuestionsResponseDto>.SuccessResponse(aiResult,
                $"Successfully generated {aiResult.TotalGenerated} questions");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI questions for Subject {SubjectId}", request.SubjectId);
            return ApiResponse<AiGenerateQuestionsResponseDto>.FailureResponse(
                "Failed to generate questions. Please try again.");
        }
    }

    #region Private Methods

    private static string GetQuestionTypeName(int typeId) => typeId switch
    {
        1 => "Multiple Choice (Single Answer)",
        2 => "Multiple Choice (Multiple Answers)",
        3 => "True/False",
        _ => "Unknown"
    };

    private static string BuildGenerationPrompt(AiGenerateQuestionsRequestDto request, string subjectName, string? topicName, string questionTypeName)
    {
        var sb = new StringBuilder();
        sb.AppendLine("You are an expert exam question creator for a professional assessment system.");
        sb.AppendLine("Your task is to generate high-quality exam questions that are clear, unambiguous, and educationally sound.");
        sb.AppendLine();
        sb.AppendLine("GENERATION RULES:");
        sb.AppendLine($"- Generate exactly {request.NumberOfQuestions} questions");
        sb.AppendLine($"- Question type: {questionTypeName}");
        sb.AppendLine($"- Difficulty level: {request.DifficultyLevel}");
        sb.AppendLine($"- Subject: {subjectName}");

        if (!string.IsNullOrWhiteSpace(topicName))
            sb.AppendLine($"- Topic: {topicName}");

        if (!string.IsNullOrWhiteSpace(request.CustomTopic))
            sb.AppendLine($"- Additional instruction: {request.CustomTopic}");

        sb.AppendLine();
        sb.AppendLine("QUALITY GUIDELINES:");
        sb.AppendLine("- Questions must be professionally worded and clear");
        sb.AppendLine("- Each question must have ONE and ONLY ONE correct answer (for single-answer MCQ and True/False)");

        if (request.QuestionTypeId == 2)
        {
            sb.AppendLine("- For Multiple Choice (Multiple Answers): each question MUST have at least 2 correct answers (2-3 correct) out of 4-5 options");
        }

        sb.AppendLine("- Wrong options (distractors) should be plausible but clearly incorrect");
        sb.AppendLine("- Avoid trick questions or ambiguous wording");
        sb.AppendLine("- Include a brief explanation for the correct answer");
        sb.AppendLine("- Vary the position of the correct answer across questions");
        sb.AppendLine();

        // Language handling
        if (request.Language == "ar")
        {
            sb.AppendLine("LANGUAGE: Generate all content in Arabic only.");
            sb.AppendLine("- Set bodyEn to empty string, bodyAr to the Arabic question");
            sb.AppendLine("- Set option textEn to empty string, textAr to Arabic option");
        }
        else if (request.Language == "both")
        {
            sb.AppendLine("LANGUAGE: Generate all content in BOTH English and Arabic.");
            sb.AppendLine("- Provide both bodyEn (English) and bodyAr (Arabic translation)");
            sb.AppendLine("- Provide both textEn and textAr for each option");
        }
        else
        {
            sb.AppendLine("LANGUAGE: Generate all content in English only.");
            sb.AppendLine("- Set bodyAr to empty string, bodyEn to the English question");
            sb.AppendLine("- Set option textAr to empty string, textEn to English option");
        }

        sb.AppendLine();

        if (request.QuestionTypeId == 3) // True/False
        {
            sb.AppendLine("TRUE/FALSE FORMAT:");
            sb.AppendLine("- Each question must have exactly 2 options: True and False");
            sb.AppendLine("- Set exactly one as isCorrect: true");
            sb.AppendLine();
        }
        else // MCQ
        {
            sb.AppendLine("MCQ FORMAT:");
            sb.AppendLine("- Each question must have exactly 4 options");
            sb.AppendLine($"- For single answer: exactly 1 option with isCorrect: true");
            if (request.QuestionTypeId == 2)
                sb.AppendLine($"- For multiple answers: MUST have at least 2 options with isCorrect: true (2-3 correct answers required)");
            sb.AppendLine();
        }

        sb.AppendLine("RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):");
        sb.AppendLine("{");
        sb.AppendLine("  \"questions\": [");
        sb.AppendLine("    {");
        sb.AppendLine("      \"bodyEn\": \"<question text in English>\",");
        sb.AppendLine("      \"bodyAr\": \"<question text in Arabic or empty>\",");
        sb.AppendLine("      \"explanationEn\": \"<brief explanation of correct answer in English>\",");
        sb.AppendLine("      \"explanationAr\": \"<brief explanation in Arabic or empty>\",");
        sb.AppendLine("      \"options\": [");
        sb.AppendLine("        { \"textEn\": \"<option text>\", \"textAr\": \"<option text in Arabic or empty>\", \"isCorrect\": true },");
        sb.AppendLine("        { \"textEn\": \"<option text>\", \"textAr\": \"\", \"isCorrect\": false }");
        sb.AppendLine("      ]");
        sb.AppendLine("    }");
        sb.AppendLine("  ]");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private async Task<(AiGenerateQuestionsResponseDto? Result, string? ErrorMessage)> CallOpenAiAsync(string prompt)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiSettings.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(60); // Longer timeout for generating multiple questions

        var requestBody = new
        {
            model = _openAiSettings.Model,
            messages = new[]
            {
                new { role = "system", content = "You are a professional exam question generator. Always respond with valid JSON only. No markdown formatting." },
                new { role = "user", content = prompt }
            },
            max_tokens = 4096, // Need more tokens for multiple questions
            temperature = 0.7, // Slightly higher creativity for diverse questions
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
            _logger.LogWarning("OpenAI API request timed out during question generation");
            return (null, "AI request timed out. Please try again with fewer questions.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "OpenAI API connection error during question generation");
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
                _ => $"AI service error ({response.StatusCode}). Please try again."
            };

            return (null, errorMessage);
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        var openAiResponse = JsonSerializer.Deserialize<OpenAiChatResponse>(responseJson, JsonOptions);

        var messageContent = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(messageContent))
        {
            _logger.LogWarning("OpenAI returned empty response for question generation");
            return (null, "AI returned an empty response. Please try again.");
        }

        // Parse the AI's JSON response
        try
        {
            var result = JsonSerializer.Deserialize<AiGenerateQuestionsResponseDto>(messageContent, JsonOptions);
            return (result, null);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse OpenAI question generation response: {Content}", messageContent);

            // Attempt graceful fallback: try to extract from possible markdown wrapper
            var cleaned = messageContent.Trim();
            if (cleaned.StartsWith("```"))
            {
                var lines = cleaned.Split('\n');
                cleaned = string.Join('\n', lines.Skip(1).TakeWhile(l => !l.StartsWith("```")));
                try
                {
                    return (JsonSerializer.Deserialize<AiGenerateQuestionsResponseDto>(cleaned, JsonOptions), null);
                }
                catch
                {
                    // Final fallback
                }
            }

            return (null, "AI returned an unexpected format. Please try again.");
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
