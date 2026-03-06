using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Smart_Core.Application.DTOs.Common;
using Smart_Core.Application.DTOs.Proctor;
using Smart_Core.Application.Interfaces.Proctor;
using Smart_Core.Application.Settings;
using Smart_Core.Domain.Entities.Attempt;
using Smart_Core.Domain.Entities.Proctor;
using Smart_Core.Domain.Enums;
using Smart_Core.Infrastructure.Data;

namespace Smart_Core.Infrastructure.Services.Proctor;

/// <summary>
/// AI-powered proctor analysis using OpenAI GPT-4o.
/// Analyzes proctoring session events and violations to generate
/// risk explanations, suspicious behavior identification, and recommendations.
/// All results are advisory — the proctor always has final authority.
/// </summary>
public class AiProctorService : IAiProctorService
{
    private readonly ApplicationDbContext _context;
    private readonly OpenAISettings _openAiSettings;
    private readonly ILogger<AiProctorService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public AiProctorService(
        ApplicationDbContext context,
        IOptions<OpenAISettings> openAiSettings,
        ILogger<AiProctorService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _openAiSettings = openAiSettings.Value;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<ApiResponse<AiProctorAnalysisResponseDto>> GetAiRiskAnalysisAsync(int sessionId)
    {
        try
        {
            // 1. Load the session with all events
            var session = await _context.Set<ProctorSession>()
                .Include(s => s.Exam)
                .Include(s => s.Candidate)
                .Include(s => s.Events)
                .Include(s => s.Decision)
                .Include(s => s.Attempt)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
                return ApiResponse<AiProctorAnalysisResponseDto>.FailureResponse("Session not found");

            // 2. Load attempt events for answer behavior analysis
            var attemptEvents = await _context.Set<AttemptEvent>()
                .Where(e => e.AttemptId == session.AttemptId)
                .OrderBy(e => e.OccurredAt)
                .ToListAsync();

            // 3. Build event summary for the AI prompt
            var eventSummary = BuildEventSummary(session, attemptEvents);

            // 4. If no events at all, return a quick response without calling AI
            if (session.TotalEvents == 0)
            {
                return ApiResponse<AiProctorAnalysisResponseDto>.SuccessResponse(new AiProctorAnalysisResponseDto
                {
                    RiskLevel = "Low",
                    RiskExplanation = "No events have been recorded for this session yet.",
                    SuspiciousBehaviors = new List<string>(),
                    Recommendation = "No action required. Session has no recorded activity.",
                    Confidence = 100,
                    DetailedAnalysis = "The session has no recorded events or violations. This may indicate the session just started or the monitoring system has not captured any activity yet.",
                    Model = _openAiSettings.Model,
                    GeneratedAt = DateTime.UtcNow
                }, "No events to analyze");
            }

            // 5. Build the analysis prompt
            var prompt = BuildAnalysisPrompt(session, eventSummary);

            // 6. Call OpenAI
            var (aiResult, errorMessage) = await CallOpenAiAsync(prompt);

            if (aiResult == null)
                return ApiResponse<AiProctorAnalysisResponseDto>.FailureResponse(
                    errorMessage ?? "AI service is temporarily unavailable. Please review the session manually.");

            aiResult.Model = _openAiSettings.Model;
            aiResult.GeneratedAt = DateTime.UtcNow;

            _logger.LogInformation(
                "AI proctor analysis for Session {SessionId}: RiskLevel={RiskLevel}, Confidence={Confidence}%",
                sessionId, aiResult.RiskLevel, aiResult.Confidence);

            return ApiResponse<AiProctorAnalysisResponseDto>.SuccessResponse(aiResult, "AI analysis generated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating AI proctor analysis for Session {SessionId}", sessionId);
            return ApiResponse<AiProctorAnalysisResponseDto>.FailureResponse(
                "Failed to generate AI analysis. Please review the session manually.");
        }
    }

    #region Private Methods

    private static EventSummaryData BuildEventSummary(ProctorSession session, List<AttemptEvent> attemptEvents)
    {
        var events = session.Events.OrderBy(e => e.OccurredAt).ToList();
        var violations = events.Where(e => e.IsViolation).ToList();

        // Group events by type with counts
        var eventCounts = events
            .Where(e => e.EventType != ProctorEventType.Heartbeat) // Exclude heartbeats from analysis
            .GroupBy(e => e.EventType)
            .ToDictionary(g => g.Key, g => g.Count());

        // Detect time-based patterns
        var patterns = new List<string>();

        // Check for burst violations (3+ violations within 60 seconds)
        for (int i = 0; i < violations.Count - 2; i++)
        {
            var window = violations.Skip(i).Take(3).ToList();
            if ((window.Last().OccurredAt - window.First().OccurredAt).TotalSeconds <= 60)
            {
                patterns.Add($"Burst of {window.Count} violations within 60 seconds at {window.First().OccurredAt:HH:mm:ss}");
                break; // Report only the first burst to avoid noise
            }
        }

        // Check for repeated same-type violations
        foreach (var group in eventCounts.Where(g => g.Value >= 3))
        {
            patterns.Add($"Repeated {group.Key} events ({group.Value} times)");
        }

        // Calculate session duration
        var sessionDuration = session.EndedAt.HasValue
            ? session.EndedAt.Value - session.StartedAt
            : DateTime.UtcNow - session.StartedAt;

        // --- Answer Behavior Analysis from AttemptEvents ---
        var answerEvents = attemptEvents
            .Where(e => e.EventType == AttemptEventType.AnswerSaved)
            .OrderBy(e => e.OccurredAt)
            .ToList();

        // Track unique questions answered and answer changes
        var questionTimestamps = new Dictionary<string, List<DateTime>>();
        foreach (var ae in answerEvents)
        {
            var questionId = "unknown";
            if (!string.IsNullOrEmpty(ae.MetadataJson))
            {
                try
                {
                    using var doc = JsonDocument.Parse(ae.MetadataJson);
                    if (doc.RootElement.TryGetProperty("questionId", out var qIdProp))
                        questionId = qIdProp.ToString();
                }
                catch { /* ignore malformed metadata */ }
            }
            if (!questionTimestamps.ContainsKey(questionId))
                questionTimestamps[questionId] = new List<DateTime>();
            questionTimestamps[questionId].Add(ae.OccurredAt);
        }

        var totalQuestionsAnswered = questionTimestamps.Count;
        var answerChangesCount = answerEvents.Count - totalQuestionsAnswered; // re-saves = changes
        if (answerChangesCount < 0) answerChangesCount = 0;

        // Time between consecutive answer saves per question (rough "time spent")
        var questionDurations = new List<(string QuestionId, double Seconds)>();
        var orderedAnswerTimes = answerEvents.Select(e => e.OccurredAt).ToList();
        for (int i = 1; i < orderedAnswerTimes.Count; i++)
        {
            var gap = (orderedAnswerTimes[i] - orderedAnswerTimes[i - 1]).TotalSeconds;
            if (gap > 0 && gap < 600) // ignore gaps > 10 min (likely idle)
                questionDurations.Add(("q" + i, gap));
        }

        double avgTimePerQuestion = questionDurations.Count > 0 ? questionDurations.Average(d => d.Seconds) : 0;
        double fastestAnswerSeconds = questionDurations.Count > 0 ? questionDurations.Min(d => d.Seconds) : 0;
        double slowestAnswerSeconds = questionDurations.Count > 0 ? questionDurations.Max(d => d.Seconds) : 0;

        // Rapid-fire answers (< 3 seconds) — possible guessing
        var rapidAnswerCount = questionDurations.Count(d => d.Seconds < 3);

        // --- Attempt Event Breakdown (non-proctor events) ---
        var attemptEventCounts = attemptEvents
            .GroupBy(e => e.EventType)
            .ToDictionary(g => g.Key, g => g.Count());

        // --- Countable Violations ---
        var countableViolationCount = session.CountableViolationCount;
        var maxViolationWarnings = session.Exam?.MaxViolationWarnings ?? 0;

        // Check for answer-change patterns
        var questionsWithMultipleChanges = questionTimestamps.Where(q => q.Value.Count >= 3).ToList();
        if (questionsWithMultipleChanges.Count > 0)
            patterns.Add($"{questionsWithMultipleChanges.Count} question(s) had 3+ answer changes (possible indecision or answer-sharing)");

        if (rapidAnswerCount >= 3)
            patterns.Add($"{rapidAnswerCount} answers submitted in under 3 seconds each (possible guessing or pre-known answers)");

        return new EventSummaryData
        {
            TotalEvents = session.TotalEvents,
            TotalViolations = session.TotalViolations,
            RiskScore = session.RiskScore ?? 0,
            EventCounts = eventCounts,
            Patterns = patterns,
            SessionDurationMinutes = (int)sessionDuration.TotalMinutes,
            SessionStatus = session.Status.ToString(),
            IsFlagged = session.IsFlagged,
            IsTerminated = session.IsTerminatedByProctor,
            HeartbeatMissedCount = session.HeartbeatMissedCount,
            HasDecision = session.Decision != null,
            DecisionStatus = session.Decision?.Status.ToString(),
            // Answer behavior
            TotalQuestionsAnswered = totalQuestionsAnswered,
            AnswerChangesCount = answerChangesCount,
            AvgTimePerQuestionSeconds = Math.Round(avgTimePerQuestion, 1),
            FastestAnswerSeconds = Math.Round(fastestAnswerSeconds, 1),
            SlowestAnswerSeconds = Math.Round(slowestAnswerSeconds, 1),
            RapidAnswerCount = rapidAnswerCount,
            // Attempt events
            AttemptEventCounts = attemptEventCounts,
            TotalAttemptEvents = attemptEvents.Count,
            // Countable violations
            CountableViolationCount = countableViolationCount,
            MaxViolationWarnings = maxViolationWarnings,
            TerminationReason = session.TerminationReason
        };
    }

    private static string BuildAnalysisPrompt(ProctorSession session, EventSummaryData summary)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are an expert AI proctoring analyst for an online examination system.");
        sb.AppendLine("Your task is to analyze a proctoring session's events and violations to provide a risk assessment.");
        sb.AppendLine();
        sb.AppendLine("ANALYSIS RULES:");
        sb.AppendLine("- Be objective and evidence-based — only reference events that actually occurred");
        sb.AppendLine("- Consider the frequency, timing, and severity of violations");
        sb.AppendLine("- Distinguish between technical issues and suspicious behavior");
        sb.AppendLine("- Provide actionable recommendations for the proctor");
        sb.AppendLine("- Support bilingual context (candidate may use Arabic or English)");
        sb.AppendLine("- Be professional and fair — avoid assumptions without evidence");
        sb.AppendLine();

        sb.AppendLine("SESSION CONTEXT:");
        sb.AppendLine($"- Candidate: {session.Candidate?.FullName ?? session.Candidate?.DisplayName ?? "Unknown"}");
        sb.AppendLine($"- Exam: {session.Exam?.TitleEn ?? "Unknown"}");
        sb.AppendLine($"- Session Status: {summary.SessionStatus}");
        sb.AppendLine($"- Duration: {summary.SessionDurationMinutes} minutes");
        sb.AppendLine($"- Flagged by Proctor: {(summary.IsFlagged ? "Yes" : "No")}");
        sb.AppendLine($"- Terminated by Proctor: {(summary.IsTerminated ? "Yes" : "No")}");
        sb.AppendLine($"- Heartbeat Missed Count: {summary.HeartbeatMissedCount}");
        if (summary.HasDecision)
            sb.AppendLine($"- Current Decision: {summary.DecisionStatus}");
        sb.AppendLine();

        sb.AppendLine("DEVICE & ENVIRONMENT:");
        sb.AppendLine($"- IP Address: {session.IpAddress ?? "N/A"}");
        sb.AppendLine($"- Browser: {session.BrowserName ?? "N/A"} {session.BrowserVersion ?? ""}".Trim());
        sb.AppendLine($"- Operating System: {session.OperatingSystem ?? "N/A"}");
        sb.AppendLine($"- Screen Resolution: {session.ScreenResolution ?? "N/A"}");
        sb.AppendLine($"- Device Fingerprint: {session.DeviceFingerprint ?? "N/A"}");
        if (session.Attempt != null)
        {
            if (!string.IsNullOrEmpty(session.Attempt.IPAddress) && session.Attempt.IPAddress != session.IpAddress)
                sb.AppendLine($"- Attempt IP Address (differs from session): {session.Attempt.IPAddress}");
            if (!string.IsNullOrEmpty(session.Attempt.DeviceInfo))
                sb.AppendLine($"- Device Info: {session.Attempt.DeviceInfo}");
        }
        sb.AppendLine();

        sb.AppendLine("METRICS:");
        sb.AppendLine($"- Current Risk Score: {summary.RiskScore}/100");
        sb.AppendLine($"- Total Proctor Events: {summary.TotalEvents}");
        sb.AppendLine($"- Total Proctor Violations: {summary.TotalViolations}");
        sb.AppendLine($"- Total Attempt Events: {summary.TotalAttemptEvents}");
        sb.AppendLine();

        sb.AppendLine("VIOLATION THRESHOLD:");
        sb.AppendLine($"- Countable Violations: {summary.CountableViolationCount}");
        sb.AppendLine($"- Max Allowed Warnings: {(summary.MaxViolationWarnings > 0 ? summary.MaxViolationWarnings.ToString() : "Disabled (no auto-termination)")}");
        if (summary.MaxViolationWarnings > 0)
        {
            var ratio = (double)summary.CountableViolationCount / summary.MaxViolationWarnings * 100;
            sb.AppendLine($"- Threshold Usage: {ratio:F0}% ({summary.CountableViolationCount}/{summary.MaxViolationWarnings})");
        }
        if (!string.IsNullOrEmpty(summary.TerminationReason))
            sb.AppendLine($"- Termination Reason: {summary.TerminationReason}");
        sb.AppendLine();

        sb.AppendLine("EVENT BREAKDOWN:");
        if (summary.EventCounts.Count > 0)
        {
            foreach (var evt in summary.EventCounts.OrderByDescending(e => e.Value))
            {
                sb.AppendLine($"- {evt.Key}: {evt.Value} occurrences");
            }
        }
        else
        {
            sb.AppendLine("- No significant events recorded");
        }
        sb.AppendLine();

        // Attempt Event Breakdown
        if (summary.AttemptEventCounts.Count > 0)
        {
            sb.AppendLine("ATTEMPT EVENT BREAKDOWN:");
            foreach (var evt in summary.AttemptEventCounts.OrderByDescending(e => e.Value))
            {
                sb.AppendLine($"- {evt.Key}: {evt.Value} occurrences");
            }
            sb.AppendLine();
        }

        // Answer Behavior Section
        sb.AppendLine("ANSWER BEHAVIOR:");
        sb.AppendLine($"- Questions Answered: {summary.TotalQuestionsAnswered}");
        sb.AppendLine($"- Answer Changes (re-submissions): {summary.AnswerChangesCount}");
        sb.AppendLine($"- Average Time per Question: {summary.AvgTimePerQuestionSeconds}s");
        sb.AppendLine($"- Fastest Answer: {summary.FastestAnswerSeconds}s");
        sb.AppendLine($"- Slowest Answer: {summary.SlowestAnswerSeconds}s");
        sb.AppendLine($"- Rapid Answers (<3s, possible guessing): {summary.RapidAnswerCount}");
        sb.AppendLine();

        if (summary.Patterns.Count > 0)
        {
            sb.AppendLine("DETECTED PATTERNS:");
            foreach (var pattern in summary.Patterns)
            {
                sb.AppendLine($"- {pattern}");
            }
            sb.AppendLine();
        }

        sb.AppendLine("RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):");
        sb.AppendLine("{");
        sb.AppendLine("  \"riskLevel\": \"<Low|Medium|High|Critical>\",");
        sb.AppendLine("  \"riskExplanation\": \"<2-3 sentence summary of the risk assessment>\",");
        sb.AppendLine("  \"suspiciousBehaviors\": [\"<specific behavior 1>\", \"<specific behavior 2>\"],");
        sb.AppendLine("  \"recommendation\": \"<specific actionable recommendation for the proctor>\",");
        sb.AppendLine("  \"confidence\": <integer 0-100>,");
        sb.AppendLine("  \"detailedAnalysis\": \"<detailed paragraph analyzing the session behavior and patterns>\"");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private async Task<(AiProctorAnalysisResponseDto? Result, string? ErrorMessage)> CallOpenAiAsync(string prompt)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiSettings.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(30);

        var requestBody = new
        {
            model = _openAiSettings.Model,
            messages = new[]
            {
                new { role = "system", content = "You are a professional AI proctoring analyst. Always respond with valid JSON only. No markdown formatting." },
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
            _logger.LogWarning("OpenAI API request timed out for proctor analysis");
            return (null, "AI request timed out. Please try again or review manually.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "OpenAI API connection error for proctor analysis");
            return (null, "Cannot connect to AI service. Please check your internet connection.");
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("OpenAI API error for proctor analysis: {StatusCode} - {Body}", response.StatusCode, errorBody);

            var errorMessage = response.StatusCode switch
            {
                System.Net.HttpStatusCode.TooManyRequests => "OpenAI quota exceeded. Please check your billing or try again later.",
                System.Net.HttpStatusCode.Unauthorized => "Invalid OpenAI API key. Please update your API key in settings.",
                System.Net.HttpStatusCode.BadRequest => "Invalid request to AI service. Please contact support.",
                System.Net.HttpStatusCode.InternalServerError => "OpenAI service is experiencing issues. Please try again later.",
                _ => $"AI service error ({response.StatusCode}). Please try again or review manually."
            };

            return (null, errorMessage);
        }

        var responseJson = await response.Content.ReadAsStringAsync();
        var openAiResponse = JsonSerializer.Deserialize<OpenAiChatResponse>(responseJson, JsonOptions);

        var messageContent = openAiResponse?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(messageContent))
        {
            _logger.LogWarning("OpenAI returned empty response for proctor analysis");
            return (null, "AI returned an empty response. Please try again.");
        }

        // Parse the AI's JSON response
        try
        {
            var result = JsonSerializer.Deserialize<AiProctorAnalysisResponseDto>(messageContent, JsonOptions);
            return (result, null);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse OpenAI proctor analysis response: {Content}", messageContent);

            // Attempt graceful fallback: try to extract from possible markdown wrapper
            var cleaned = messageContent.Trim();
            if (cleaned.StartsWith("```"))
            {
                var lines = cleaned.Split('\n');
                cleaned = string.Join('\n', lines.Skip(1).TakeWhile(l => !l.StartsWith("```")));
                try
                {
                    return (JsonSerializer.Deserialize<AiProctorAnalysisResponseDto>(cleaned, JsonOptions), null);
                }
                catch
                {
                    // Final fallback
                }
            }

            return (null, "AI returned an unexpected format. Please try again or review manually.");
        }
    }

    #endregion

    #region Internal Models

    private class EventSummaryData
    {
        public int TotalEvents { get; set; }
        public int TotalViolations { get; set; }
        public decimal RiskScore { get; set; }
        public Dictionary<ProctorEventType, int> EventCounts { get; set; } = new();
        public List<string> Patterns { get; set; } = new();
        public int SessionDurationMinutes { get; set; }
        public string SessionStatus { get; set; } = string.Empty;
        public bool IsFlagged { get; set; }
        public bool IsTerminated { get; set; }
        public int HeartbeatMissedCount { get; set; }
        public bool HasDecision { get; set; }
        public string? DecisionStatus { get; set; }
        // Answer behavior
        public int TotalQuestionsAnswered { get; set; }
        public int AnswerChangesCount { get; set; }
        public double AvgTimePerQuestionSeconds { get; set; }
        public double FastestAnswerSeconds { get; set; }
        public double SlowestAnswerSeconds { get; set; }
        public int RapidAnswerCount { get; set; }
        // Attempt events
        public Dictionary<AttemptEventType, int> AttemptEventCounts { get; set; } = new();
        public int TotalAttemptEvents { get; set; }
        // Countable violations
        public int CountableViolationCount { get; set; }
        public int MaxViolationWarnings { get; set; }
        public string? TerminationReason { get; set; }
    }

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
