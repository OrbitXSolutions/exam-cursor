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
            // 1. Load the session with all related entities
            var session = await _context.Set<ProctorSession>()
                .Include(s => s.Exam)
                .Include(s => s.Candidate).ThenInclude(c => c.Department)
                .Include(s => s.Events)
                .Include(s => s.Decision)
                .Include(s => s.Attempt)
                .Include(s => s.RiskSnapshots)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null)
                return ApiResponse<AiProctorAnalysisResponseDto>.FailureResponse("Session not found");

            // 2. Load attempt events for answer behavior analysis
            var attemptEvents = await _context.Set<AttemptEvent>()
                .Where(e => e.AttemptId == session.AttemptId)
                .OrderBy(e => e.OccurredAt)
                .ToListAsync();

            // 3. Load attempt questions with answers for progress analysis
            var attemptQuestions = await _context.Set<Domain.Entities.Attempt.AttemptQuestion>()
                .Include(q => q.Answers)
                .Include(q => q.Question)
                .Where(q => q.AttemptId == session.AttemptId)
                .OrderBy(q => q.Order)
                .ToListAsync();

            // 4. Load identity verification for this session (if exists)
            var idVerification = await _context.Set<IdentityVerification>()
                .Where(v => v.ProctorSessionId == sessionId || (v.AttemptId == session.AttemptId && v.CandidateId == session.CandidateId))
                .OrderByDescending(v => v.SubmittedAt)
                .FirstOrDefaultAsync();

            // 5. Build event summary for the AI prompt
            var eventSummary = BuildEventSummary(session, attemptEvents, attemptQuestions, idVerification);

            // 6. If no events at all, return a quick response without calling AI
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
                    GeneratedAt = DateTime.UtcNow,
                    ExecutiveSummary = "Clean session with no recorded events or violations.",
                    RiskScore = 0,
                    IntegrityVerdict = "No concerns — session has no activity to analyze.",
                    MitigatingFactors = new List<string> { "No violations detected", "No suspicious behavior recorded" },
                    AggravatingFactors = new List<string>(),
                    Recommendations = new List<string> { "No action required" },
                    RiskTimeline = new List<string>()
                }, "No events to analyze");
            }

            // 7. Build the analysis prompt
            var prompt = BuildAnalysisPrompt(session, eventSummary);

            // 8. Call OpenAI
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

    private static EventSummaryData BuildEventSummary(
        ProctorSession session,
        List<AttemptEvent> attemptEvents,
        List<Domain.Entities.Attempt.AttemptQuestion> attemptQuestions,
        IdentityVerification? idVerification)
    {
        var events = session.Events.OrderBy(e => e.OccurredAt).ToList();
        var violations = events.Where(e => e.IsViolation).ToList();

        // Group events by type with counts (exclude heartbeats)
        var eventCounts = events
            .Where(e => e.EventType != ProctorEventType.Heartbeat)
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
                break;
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
        var answerChangesCount = Math.Max(0, answerEvents.Count - totalQuestionsAnswered);

        // Time between consecutive answer saves
        var questionDurations = new List<(string QuestionId, double Seconds)>();
        var orderedAnswerTimes = answerEvents.Select(e => e.OccurredAt).ToList();
        for (int i = 1; i < orderedAnswerTimes.Count; i++)
        {
            var gap = (orderedAnswerTimes[i] - orderedAnswerTimes[i - 1]).TotalSeconds;
            if (gap > 0 && gap < 600)
                questionDurations.Add(("q" + i, gap));
        }

        double avgTimePerQuestion = questionDurations.Count > 0 ? questionDurations.Average(d => d.Seconds) : 0;
        double fastestAnswerSeconds = questionDurations.Count > 0 ? questionDurations.Min(d => d.Seconds) : 0;
        double slowestAnswerSeconds = questionDurations.Count > 0 ? questionDurations.Max(d => d.Seconds) : 0;
        var rapidAnswerCount = questionDurations.Count(d => d.Seconds < 3);

        // --- Attempt Event Breakdown ---
        var attemptEventCounts = attemptEvents
            .GroupBy(e => e.EventType)
            .ToDictionary(g => g.Key, g => g.Count());

        // --- Countable Violations ---
        var countableViolationCount = session.CountableViolationCount;
        var maxViolationWarnings = session.Exam?.MaxViolationWarnings ?? 0;

        // Answer-change patterns
        var questionsWithMultipleChanges = questionTimestamps.Where(q => q.Value.Count >= 3).ToList();
        if (questionsWithMultipleChanges.Count > 0)
            patterns.Add($"{questionsWithMultipleChanges.Count} question(s) had 3+ answer changes (possible indecision or answer-sharing)");
        if (rapidAnswerCount >= 3)
            patterns.Add($"{rapidAnswerCount} answers submitted in under 3 seconds each (possible guessing or pre-known answers)");

        // --- Exam & Attempt Progress ---
        var totalQuestionsInExam = attemptQuestions.Count;
        var questionsAnswered = attemptQuestions.Count(q => q.Answers != null && q.Answers.Any());
        var questionsWithCalculator = attemptQuestions.Count(q => q.Question?.IsCalculatorAllowed == true);

        // --- Navigation events: which question is current ---
        var lastNavEvent = attemptEvents
            .Where(e => e.EventType == AttemptEventType.Navigated)
            .OrderByDescending(e => e.OccurredAt)
            .FirstOrDefault();
        int? currentQuestionNumber = null;
        if (lastNavEvent?.MetadataJson != null)
        {
            try
            {
                using var doc = JsonDocument.Parse(lastNavEvent.MetadataJson);
                if (doc.RootElement.TryGetProperty("toQuestion", out var toQ))
                    currentQuestionNumber = toQ.GetInt32();
                else if (doc.RootElement.TryGetProperty("questionNumber", out var qNum))
                    currentQuestionNumber = qNum.GetInt32();
            }
            catch { /* ignore */ }
        }

        // --- Warnings sent & Disconnect analysis ---
        var warningsSent = events.Count(e => e.EventType == ProctorEventType.ProctorWarning);
        var disconnectEvents = events
            .Where(e => e.EventType == ProctorEventType.NetworkDisconnected || e.EventType == ProctorEventType.NetworkReconnected)
            .OrderBy(e => e.OccurredAt)
            .ToList();

        int disconnectCount = 0;
        double totalDisconnectSeconds = 0;
        DateTime? lastDisconnect = null;
        foreach (var de in disconnectEvents)
        {
            if (de.EventType == ProctorEventType.NetworkDisconnected)
            {
                disconnectCount++;
                lastDisconnect = de.OccurredAt;
            }
            else if (de.EventType == ProctorEventType.NetworkReconnected && lastDisconnect.HasValue)
            {
                totalDisconnectSeconds += (de.OccurredAt - lastDisconnect.Value).TotalSeconds;
                lastDisconnect = null;
            }
        }

        // --- Event Timeline (top 20 non-heartbeat events chronologically) ---
        var eventTimeline = events
            .Where(e => e.EventType != ProctorEventType.Heartbeat)
            .Take(20)
            .Select(e => $"[{e.OccurredAt:HH:mm:ss}] {e.EventType} (Severity: {e.Severity}, Violation: {(e.IsViolation ? "Yes" : "No")})")
            .ToList();

        // --- Risk Snapshots (progression) ---
        var riskSnapshots = session.RiskSnapshots?
            .OrderBy(r => r.CalculatedAt)
            .Select(r => $"[{r.CalculatedAt:HH:mm:ss}] Score: {r.RiskScore}/100 (Events: {r.TotalEvents}, Violations: {r.TotalViolations})")
            .ToList() ?? new List<string>();

        // --- Violation severity distribution ---
        var severityDistribution = violations
            .GroupBy(v => v.Severity)
            .OrderByDescending(g => g.Key)
            .ToDictionary(g => (int)g.Key, g => g.Count());

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
            DecisionReasonEn = session.Decision?.DecisionReasonEn,
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
            TerminationReason = session.TerminationReason,
            // Exam configuration
            ExamTitle = session.Exam?.TitleEn,
            ExamDurationMinutes = session.Exam?.DurationMinutes ?? 0,
            PassScore = session.Exam?.PassScore ?? 0,
            RequireProctoring = session.Exam?.RequireProctoring ?? false,
            RequireWebcam = session.Exam?.RequireWebcam ?? false,
            RequireIdVerification = session.Exam?.RequireIdVerification ?? false,
            PreventCopyPaste = session.Exam?.PreventCopyPaste ?? false,
            PreventScreenCapture = session.Exam?.PreventScreenCapture ?? false,
            RequireFullscreen = session.Exam?.RequireFullscreen ?? false,
            BrowserLockdown = session.Exam?.BrowserLockdown ?? false,
            ShuffleQuestions = session.Exam?.ShuffleQuestions ?? false,
            ShuffleOptions = session.Exam?.ShuffleOptions ?? false,
            MaxAttempts = session.Exam?.MaxAttempts ?? 1,
            // Candidate profile
            CandidateFullName = session.Candidate?.FullName ?? session.Candidate?.DisplayName,
            CandidateEmail = session.Candidate?.Email,
            CandidateRollNo = session.Candidate?.RollNo,
            CandidateDepartment = session.Candidate?.Department?.NameEn,
            // Candidate progress
            TotalQuestionsInExam = totalQuestionsInExam,
            QuestionsAnswered = questionsAnswered,
            QuestionsWithCalculatorAllowed = questionsWithCalculator,
            AttemptStatus = session.Attempt?.Status.ToString(),
            CurrentQuestionNumber = currentQuestionNumber,
            // Attempt details
            AttemptStartedAt = session.Attempt?.StartedAt,
            AttemptSubmittedAt = session.Attempt?.SubmittedAt,
            AttemptExpiresAt = session.Attempt?.ExpiresAt,
            AttemptTotalScore = session.Attempt?.TotalScore,
            AttemptIsPassed = session.Attempt?.IsPassed,
            AttemptNumber = session.Attempt?.AttemptNumber ?? 1,
            AttemptResumeCount = session.Attempt?.ResumeCount ?? 0,
            AttemptExtraTimeSeconds = session.Attempt?.ExtraTimeSeconds ?? 0,
            AttemptTotalDisconnectSeconds = session.Attempt?.TotalDisconnectSeconds ?? 0,
            // Warnings & disconnect
            WarningsSentCount = warningsSent,
            DisconnectCount = disconnectCount,
            TotalDisconnectSeconds = Math.Round(totalDisconnectSeconds, 1),
            // Identity verification
            IdVerificationStatus = idVerification?.Status.ToString(),
            FaceMatchScore = idVerification?.FaceMatchScore,
            LivenessResult = idVerification?.LivenessResult.ToString(),
            IdDocumentType = idVerification?.IdDocumentType,
            // Proctor mode
            ProctorMode = session.Mode.ToString(),
            // Timeline & progression
            EventTimeline = eventTimeline,
            RiskProgressionTimeline = riskSnapshots,
            SeverityDistribution = severityDistribution,
            // Session timing
            SessionStartedAt = session.StartedAt,
            SessionEndedAt = session.EndedAt
        };
    }

    private static string BuildAnalysisPrompt(ProctorSession session, EventSummaryData summary)
    {
        var sb = new StringBuilder();

        // ── System Role ──
        sb.AppendLine("You are a senior AI proctoring forensic analyst for a professional online examination system.");
        sb.AppendLine("Your task is to produce a COMPREHENSIVE, PRODUCTION-GRADE proctoring report analyzing every aspect of this exam session.");
        sb.AppendLine("This report will be reviewed by exam administrators and proctors to make official decisions.");
        sb.AppendLine();

        // ── Analysis Rules ──
        sb.AppendLine("ANALYSIS RULES:");
        sb.AppendLine("- Be objective and evidence-based — only reference events that actually occurred");
        sb.AppendLine("- Consider the frequency, timing, severity, and CORRELATION of violations");
        sb.AppendLine("- Distinguish between technical issues (network, browser) and intentional suspicious behavior");
        sb.AppendLine("- Provide specific, actionable recommendations — not generic advice");
        sb.AppendLine("- Support bilingual context (candidate may use Arabic or English)");
        sb.AppendLine("- Be professional and fair — avoid assumptions without evidence");
        sb.AppendLine("- Analyze temporal patterns: when violations cluster, what preceded them, what followed");
        sb.AppendLine("- Cross-correlate: e.g., disconnects + rapid answers after reconnect = possible outside help");
        sb.AppendLine("- Consider exam security settings when assessing violation severity");
        sb.AppendLine("- If session was auto-terminated (max violations reached), this is a CRITICAL indicator");
        sb.AppendLine();

        // ── 1. Candidate Identity ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 1: CANDIDATE IDENTITY");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Full Name: {summary.CandidateFullName ?? "Unknown"}");
        sb.AppendLine($"- Email: {summary.CandidateEmail ?? "N/A"}");
        sb.AppendLine($"- Roll Number: {summary.CandidateRollNo ?? "N/A"}");
        sb.AppendLine($"- Department: {summary.CandidateDepartment ?? "N/A"}");
        sb.AppendLine();

        // ── 2. Identity Verification ──
        sb.AppendLine("ID VERIFICATION:");
        if (summary.IdVerificationStatus != null)
        {
            sb.AppendLine($"- Verification Status: {summary.IdVerificationStatus}");
            sb.AppendLine($"- Document Type: {summary.IdDocumentType ?? "N/A"}");
            sb.AppendLine($"- Face Match Score: {(summary.FaceMatchScore.HasValue ? $"{summary.FaceMatchScore.Value:F1}%" : "N/A")}");
            sb.AppendLine($"- Liveness Check: {summary.LivenessResult ?? "N/A"}");
        }
        else
        {
            sb.AppendLine("- No identity verification record found for this session");
        }
        sb.AppendLine();

        // ── 3. Exam Configuration & Security ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 2: EXAM CONFIGURATION & SECURITY POLICY");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Exam Title: {summary.ExamTitle ?? "Unknown"}");
        sb.AppendLine($"- Exam Duration: {summary.ExamDurationMinutes} minutes");
        sb.AppendLine($"- Pass Score: {summary.PassScore}%");
        sb.AppendLine($"- Total Questions: {summary.TotalQuestionsInExam}");
        sb.AppendLine($"- Max Attempts Allowed: {summary.MaxAttempts}");
        sb.AppendLine($"- Current Attempt Number: {summary.AttemptNumber}");
        sb.AppendLine($"- Shuffle Questions: {(summary.ShuffleQuestions ? "Yes" : "No")}");
        sb.AppendLine($"- Shuffle Options: {(summary.ShuffleOptions ? "Yes" : "No")}");
        sb.AppendLine();
        sb.AppendLine("SECURITY SETTINGS:");
        sb.AppendLine($"- Proctoring Mode: {summary.ProctorMode} ({(summary.ProctorMode == "Advanced" ? "Camera + Mic + AI monitoring" : "Behavioral monitoring only")})");
        sb.AppendLine($"- Proctoring Required: {(summary.RequireProctoring ? "Yes" : "No")}");
        sb.AppendLine($"- Webcam Required: {(summary.RequireWebcam ? "Yes" : "No")}");
        sb.AppendLine($"- ID Verification Required: {(summary.RequireIdVerification ? "Yes" : "No")}");
        sb.AppendLine($"- Fullscreen Required: {(summary.RequireFullscreen ? "Yes" : "No")}");
        sb.AppendLine($"- Copy/Paste Prevented: {(summary.PreventCopyPaste ? "Yes" : "No")}");
        sb.AppendLine($"- Screen Capture Prevented: {(summary.PreventScreenCapture ? "Yes" : "No")}");
        sb.AppendLine($"- Browser Lockdown: {(summary.BrowserLockdown ? "Yes" : "No")}");
        sb.AppendLine();

        // ── 4. Session & Attempt Timing ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 3: SESSION & ATTEMPT TIMING");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Session Status: {summary.SessionStatus}");
        sb.AppendLine($"- Attempt Status: {summary.AttemptStatus ?? "Unknown"}");
        sb.AppendLine($"- Proctor Session Started: {summary.SessionStartedAt:yyyy-MM-dd HH:mm:ss} UTC");
        if (summary.SessionEndedAt.HasValue)
            sb.AppendLine($"- Proctor Session Ended: {summary.SessionEndedAt.Value:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine($"- Session Duration: {summary.SessionDurationMinutes} minutes");
        if (summary.AttemptStartedAt.HasValue)
            sb.AppendLine($"- Attempt Started: {summary.AttemptStartedAt.Value:yyyy-MM-dd HH:mm:ss} UTC");
        if (summary.AttemptSubmittedAt.HasValue)
            sb.AppendLine($"- Attempt Submitted: {summary.AttemptSubmittedAt.Value:yyyy-MM-dd HH:mm:ss} UTC");
        if (summary.AttemptExpiresAt.HasValue)
            sb.AppendLine($"- Attempt Expires At: {summary.AttemptExpiresAt.Value:yyyy-MM-dd HH:mm:ss} UTC");
        if (summary.ExamDurationMinutes > 0)
        {
            var timeUsagePct = summary.SessionDurationMinutes > 0
                ? Math.Min(100, (double)summary.SessionDurationMinutes / summary.ExamDurationMinutes * 100) : 0;
            sb.AppendLine($"- Time Usage: {timeUsagePct:F0}% of allowed exam duration");
        }
        if (summary.AttemptExtraTimeSeconds > 0)
            sb.AppendLine($"- Extra Time Added: {summary.AttemptExtraTimeSeconds / 60.0:F1} minutes");
        if (summary.AttemptResumeCount > 0)
            sb.AppendLine($"- Session Resume Count: {summary.AttemptResumeCount}");
        sb.AppendLine($"- Flagged by Proctor: {(summary.IsFlagged ? "YES ⚠️" : "No")}");
        sb.AppendLine($"- Terminated by Proctor: {(summary.IsTerminated ? "YES 🛑" : "No")}");
        if (!string.IsNullOrEmpty(summary.TerminationReason))
            sb.AppendLine($"- Termination Reason: {summary.TerminationReason}");
        if (summary.HasDecision)
        {
            sb.AppendLine($"- Proctor Decision: {summary.DecisionStatus}");
            if (!string.IsNullOrEmpty(summary.DecisionReasonEn))
                sb.AppendLine($"- Decision Reason: {summary.DecisionReasonEn}");
        }
        sb.AppendLine();

        // ── 5. Device & Environment ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 4: DEVICE & ENVIRONMENT");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- IP Address: {session.IpAddress ?? "N/A"}");
        sb.AppendLine($"- Browser: {session.BrowserName ?? "N/A"} {session.BrowserVersion ?? ""}".Trim());
        sb.AppendLine($"- Operating System: {session.OperatingSystem ?? "N/A"}");
        sb.AppendLine($"- Screen Resolution: {session.ScreenResolution ?? "N/A"}");
        sb.AppendLine($"- Device Fingerprint: {session.DeviceFingerprint ?? "N/A"}");
        sb.AppendLine($"- User Agent: {session.UserAgent ?? "N/A"}");
        if (session.Attempt != null)
        {
            if (!string.IsNullOrEmpty(session.Attempt.IPAddress) && session.Attempt.IPAddress != session.IpAddress)
                sb.AppendLine($"- ⚠️ Attempt IP Address DIFFERS from session: {session.Attempt.IPAddress}");
            if (!string.IsNullOrEmpty(session.Attempt.DeviceInfo))
                sb.AppendLine($"- Device Info: {session.Attempt.DeviceInfo}");
        }
        sb.AppendLine($"- Heartbeats Missed: {summary.HeartbeatMissedCount}");
        sb.AppendLine();

        // ── 6. Risk Metrics ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 5: RISK METRICS & VIOLATIONS");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Current Risk Score: {summary.RiskScore}/100");
        sb.AppendLine($"- Total Proctor Events: {summary.TotalEvents}");
        sb.AppendLine($"- Total Proctor Violations: {summary.TotalViolations}");
        sb.AppendLine($"- Total Attempt Events: {summary.TotalAttemptEvents}");
        sb.AppendLine();

        sb.AppendLine("VIOLATION THRESHOLD:");
        sb.AppendLine($"- Countable Violations: {summary.CountableViolationCount}");
        sb.AppendLine($"- Max Allowed Before Auto-Termination: {(summary.MaxViolationWarnings > 0 ? summary.MaxViolationWarnings.ToString() : "Disabled (no auto-termination)")}");
        if (summary.MaxViolationWarnings > 0)
        {
            var ratio = (double)summary.CountableViolationCount / summary.MaxViolationWarnings * 100;
            sb.AppendLine($"- Threshold Usage: {ratio:F0}% ({summary.CountableViolationCount}/{summary.MaxViolationWarnings})");
            if (ratio >= 100)
                sb.AppendLine("- ⚠️ THRESHOLD REACHED — Session was auto-terminated due to excessive violations");
        }
        sb.AppendLine();

        // Violation severity distribution
        if (summary.SeverityDistribution.Count > 0)
        {
            sb.AppendLine("VIOLATION SEVERITY DISTRIBUTION:");
            foreach (var sev in summary.SeverityDistribution.OrderByDescending(s => s.Key))
            {
                var label = sev.Key switch { 5 => "Critical(5)", 4 => "High(4)", 3 => "Medium(3)", 2 => "Low(2)", 1 => "Minor(1)", _ => $"Level({sev.Key})" };
                sb.AppendLine($"- {label}: {sev.Value} violation(s)");
            }
            sb.AppendLine();
        }

        // Event breakdown
        sb.AppendLine("PROCTOR EVENT BREAKDOWN:");
        if (summary.EventCounts.Count > 0)
        {
            foreach (var evt in summary.EventCounts.OrderByDescending(e => e.Value))
                sb.AppendLine($"- {evt.Key}: {evt.Value} occurrences");
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
                sb.AppendLine($"- {evt.Key}: {evt.Value} occurrences");
            sb.AppendLine();
        }

        // ── 7. Candidate Progress & Answer Behavior ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 6: CANDIDATE PROGRESS & ANSWER BEHAVIOR");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Total Questions in Exam: {summary.TotalQuestionsInExam}");
        sb.AppendLine($"- Questions Answered: {summary.QuestionsAnswered}/{summary.TotalQuestionsInExam}");
        var progressPct = summary.TotalQuestionsInExam > 0
            ? (double)summary.QuestionsAnswered / summary.TotalQuestionsInExam * 100 : 0;
        sb.AppendLine($"- Completion Rate: {progressPct:F0}%");
        if (summary.CurrentQuestionNumber.HasValue)
            sb.AppendLine($"- Last Active Question: #{summary.CurrentQuestionNumber}");
        sb.AppendLine($"- Answer Changes (re-submissions): {summary.AnswerChangesCount}");
        sb.AppendLine($"- Average Time per Question: {summary.AvgTimePerQuestionSeconds}s");
        sb.AppendLine($"- Fastest Answer: {summary.FastestAnswerSeconds}s");
        sb.AppendLine($"- Slowest Answer: {summary.SlowestAnswerSeconds}s");
        sb.AppendLine($"- Rapid Answers (<3s, potential guessing): {summary.RapidAnswerCount}");
        if (summary.AttemptTotalScore.HasValue)
        {
            sb.AppendLine($"- Score: {summary.AttemptTotalScore.Value:F1}");
            sb.AppendLine($"- Passed: {(summary.AttemptIsPassed == true ? "Yes ✓" : summary.AttemptIsPassed == false ? "No ✗" : "Pending")}");
        }
        sb.AppendLine();

        if (summary.QuestionsWithCalculatorAllowed > 0)
        {
            sb.AppendLine("CALCULATOR USAGE:");
            sb.AppendLine($"- Questions Allowing Calculator: {summary.QuestionsWithCalculatorAllowed}/{summary.TotalQuestionsInExam}");
            sb.AppendLine();
        }

        // ── 8. Warnings & Disconnects ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("SECTION 7: WARNINGS, DISCONNECTS & NETWORK");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine($"- Proctor Warnings Sent: {summary.WarningsSentCount}");
        sb.AppendLine($"- Network Disconnect Events: {summary.DisconnectCount}");
        sb.AppendLine($"- Total Disconnect Duration (proctor-tracked): {summary.TotalDisconnectSeconds}s ({summary.TotalDisconnectSeconds / 60.0:F1} min)");
        sb.AppendLine($"- Total Disconnect Duration (attempt-tracked): {summary.AttemptTotalDisconnectSeconds}s ({summary.AttemptTotalDisconnectSeconds / 60.0:F1} min)");
        sb.AppendLine();

        // ── 9. Event Timeline ──
        if (summary.EventTimeline.Count > 0)
        {
            sb.AppendLine("═══════════════════════════════════════");
            sb.AppendLine("SECTION 8: CHRONOLOGICAL EVENT TIMELINE (first 20 events)");
            sb.AppendLine("═══════════════════════════════════════");
            foreach (var evt in summary.EventTimeline)
                sb.AppendLine($"  {evt}");
            sb.AppendLine();
        }

        // ── 10. Risk Progression ──
        if (summary.RiskProgressionTimeline.Count > 0)
        {
            sb.AppendLine("RISK SCORE PROGRESSION:");
            foreach (var snap in summary.RiskProgressionTimeline)
                sb.AppendLine($"  {snap}");
            sb.AppendLine();
        }

        // ── 11. Detected Patterns ──
        if (summary.Patterns.Count > 0)
        {
            sb.AppendLine("═══════════════════════════════════════");
            sb.AppendLine("SECTION 9: DETECTED BEHAVIORAL PATTERNS");
            sb.AppendLine("═══════════════════════════════════════");
            foreach (var pattern in summary.Patterns)
                sb.AppendLine($"- ⚠️ {pattern}");
            sb.AppendLine();
        }

        // ── 12. Analysis Guidelines ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("ANALYSIS GUIDELINES FOR YOUR REPORT");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("- Analyze answer patterns: rapid answers after disconnects may indicate outside help or pre-known answers");
        sb.AppendLine("- Consider disconnect frequency and duration — multiple short disconnects are MORE suspicious than one long one");
        sb.AppendLine("- Factor in warnings sent relative to violations when assessing severity");
        sb.AppendLine("- Calculator context: note if violations occurred during calculator-allowed questions (less suspicious)");
        sb.AppendLine("- Cross-reference: if candidate was flagged/terminated AND has high violations, this is CRITICAL");
        sb.AppendLine("- If countable violations reached max threshold (auto-termination), the session integrity is severely compromised");
        sb.AppendLine("- Consider whether the exam security settings (fullscreen, lockdown) align with the violations seen");
        sb.AppendLine("- Assess if IP address mismatch between session & attempt could indicate proxy or VPN usage");
        sb.AppendLine("- The risk score (0-100) should reflect the OVERALL integrity risk of the entire session");
        sb.AppendLine("- Provide mitigating factors: things that REDUCE suspicion (e.g., consistent timing, no tab switches)");
        sb.AppendLine("- Provide aggravating factors: things that INCREASE suspicion (e.g., bursts, disconnects + rapid answers)");
        sb.AppendLine("- Write detailed, professional prose — this is an official forensic analysis report");
        sb.AppendLine();

        // ── 13. Response Format ──
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, just raw JSON):");
        sb.AppendLine("═══════════════════════════════════════");
        sb.AppendLine("{");
        sb.AppendLine("  \"riskLevel\": \"<Low|Medium|High|Critical>\",");
        sb.AppendLine("  \"riskExplanation\": \"<2-3 sentence executive summary of risk assessment>\",");
        sb.AppendLine("  \"suspiciousBehaviors\": [\"<specific behavior 1>\", \"<behavior 2>\"],");
        sb.AppendLine("  \"recommendation\": \"<primary actionable recommendation>\",");
        sb.AppendLine("  \"confidence\": <integer 0-100>,");
        sb.AppendLine("  \"detailedAnalysis\": \"<comprehensive paragraph analyzing session behavior, patterns, and integrity assessment>\",");
        sb.AppendLine("  \"executiveSummary\": \"<3-4 sentence professional overview covering who, what, when, and overall verdict>\",");
        sb.AppendLine("  \"candidateProfile\": {");
        sb.AppendLine("    \"name\": \"<candidate full name>\",");
        sb.AppendLine("    \"email\": \"<email or N/A>\",");
        sb.AppendLine("    \"rollNumber\": \"<roll number or N/A>\",");
        sb.AppendLine("    \"department\": \"<department or N/A>\",");
        sb.AppendLine("    \"identityVerificationStatus\": \"<Verified/Pending/Failed/Not Required>\",");
        sb.AppendLine("    \"deviceSummary\": \"<one-line summary: browser, OS, screen>\",");
        sb.AppendLine("    \"networkSummary\": \"<one-line: IP, disconnect count, stability assessment>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"sessionOverview\": {");
        sb.AppendLine("    \"examTitle\": \"<exam name>\",");
        sb.AppendLine("    \"sessionStatus\": \"<Active/Completed/Cancelled>\",");
        sb.AppendLine("    \"attemptStatus\": \"<Started/InProgress/Submitted/Expired/Terminated etc>\",");
        sb.AppendLine("    \"duration\": \"<X minutes of Y allowed>\",");
        sb.AppendLine("    \"timeUsage\": \"<percentage of allowed time used with context>\",");
        sb.AppendLine("    \"completionRate\": \"<X/Y questions answered (Z%)>\",");
        sb.AppendLine("    \"terminationInfo\": \"<reason if terminated, or 'N/A'>\",");
        sb.AppendLine("    \"proctorMode\": \"<Soft/Advanced with description>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"behaviorAnalysis\": {");
        sb.AppendLine("    \"answerPatternSummary\": \"<detailed analysis of answer timing, changes, rapid answers>\",");
        sb.AppendLine("    \"navigationBehavior\": \"<how candidate navigated: linear, jumping, revisiting>\",");
        sb.AppendLine("    \"focusBehavior\": \"<tab switches, window blurs, fullscreen exits analysis>\",");
        sb.AppendLine("    \"timingAnalysis\": \"<avg/fast/slow answer times, time distribution analysis>\",");
        sb.AppendLine("    \"suspiciousPatterns\": \"<any correlated suspicious patterns found>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"violationAnalysis\": {");
        sb.AppendLine("    \"totalViolations\": <number>,");
        sb.AppendLine("    \"countableViolations\": <number>,");
        sb.AppendLine("    \"thresholdStatus\": \"<X/Y violations used (Z%) — Safe/Warning/Critical>\",");
        sb.AppendLine("    \"violationBreakdown\": [");
        sb.AppendLine("      { \"type\": \"<violation type>\", \"count\": <number>, \"severity\": \"<Low/Medium/High/Critical>\", \"impact\": \"<what this means>\" }");
        sb.AppendLine("    ],");
        sb.AppendLine("    \"violationTrend\": \"<increasing/decreasing/steady/burst pattern description>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"environmentAssessment\": {");
        sb.AppendLine("    \"browserCompliance\": \"<supported browser? version adequate? any concerns?>\",");
        sb.AppendLine("    \"networkStability\": \"<stable/unstable — based on disconnects, heartbeats, duration>\",");
        sb.AppendLine("    \"webcamStatus\": \"<active/denied/blocked/not required>\",");
        sb.AppendLine("    \"fullscreenCompliance\": \"<maintained/exited X times/not required>\",");
        sb.AppendLine("    \"overallEnvironmentRisk\": \"<Low/Medium/High — overall environment risk>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"integrityVerdict\": \"<professional 2-3 sentence integrity verdict for the proctor's final review>\",");
        sb.AppendLine("  \"riskScore\": <integer 0-100>,");
        sb.AppendLine("  \"mitigatingFactors\": [\"<factor that reduces suspicion 1>\", \"<factor 2>\"],");
        sb.AppendLine("  \"aggravatingFactors\": [\"<factor that increases suspicion 1>\", \"<factor 2>\"],");
        sb.AppendLine("  \"recommendations\": [\"<specific action 1>\", \"<specific action 2>\"],");
        sb.AppendLine("  \"riskTimeline\": [\"<chronological risk event 1>\", \"<risk event 2>\"]");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private async Task<(AiProctorAnalysisResponseDto? Result, string? ErrorMessage)> CallOpenAiAsync(string prompt)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiSettings.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(60);

        var requestBody = new
        {
            model = _openAiSettings.Model,
            messages = new[]
            {
                new { role = "system", content = "You are a senior AI proctoring forensic analyst producing comprehensive, production-grade examination integrity reports. Always respond with valid JSON only. No markdown formatting. Every field in the requested schema must be populated with meaningful, evidence-based content." },
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
        public string? DecisionReasonEn { get; set; }
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
        // Exam configuration
        public string? ExamTitle { get; set; }
        public int ExamDurationMinutes { get; set; }
        public decimal PassScore { get; set; }
        public bool RequireProctoring { get; set; }
        public bool RequireWebcam { get; set; }
        public bool RequireIdVerification { get; set; }
        public bool PreventCopyPaste { get; set; }
        public bool PreventScreenCapture { get; set; }
        public bool RequireFullscreen { get; set; }
        public bool BrowserLockdown { get; set; }
        public bool ShuffleQuestions { get; set; }
        public bool ShuffleOptions { get; set; }
        public int MaxAttempts { get; set; }
        // Candidate profile
        public string? CandidateFullName { get; set; }
        public string? CandidateEmail { get; set; }
        public string? CandidateRollNo { get; set; }
        public string? CandidateDepartment { get; set; }
        // Candidate progress
        public int TotalQuestionsInExam { get; set; }
        public int QuestionsAnswered { get; set; }
        public int QuestionsWithCalculatorAllowed { get; set; }
        public string? AttemptStatus { get; set; }
        public int? CurrentQuestionNumber { get; set; }
        // Attempt details
        public DateTime? AttemptStartedAt { get; set; }
        public DateTime? AttemptSubmittedAt { get; set; }
        public DateTime? AttemptExpiresAt { get; set; }
        public decimal? AttemptTotalScore { get; set; }
        public bool? AttemptIsPassed { get; set; }
        public int AttemptNumber { get; set; }
        public int AttemptResumeCount { get; set; }
        public int AttemptExtraTimeSeconds { get; set; }
        public int AttemptTotalDisconnectSeconds { get; set; }
        // Warnings & disconnect
        public int WarningsSentCount { get; set; }
        public int DisconnectCount { get; set; }
        public double TotalDisconnectSeconds { get; set; }
        // Identity verification
        public string? IdVerificationStatus { get; set; }
        public decimal? FaceMatchScore { get; set; }
        public string? LivenessResult { get; set; }
        public string? IdDocumentType { get; set; }
        // Proctor mode
        public string ProctorMode { get; set; } = string.Empty;
        // Timeline & progression
        public List<string> EventTimeline { get; set; } = new();
        public List<string> RiskProgressionTimeline { get; set; } = new();
        public Dictionary<int, int> SeverityDistribution { get; set; } = new();
        // Session timing
        public DateTime SessionStartedAt { get; set; }
        public DateTime? SessionEndedAt { get; set; }
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
