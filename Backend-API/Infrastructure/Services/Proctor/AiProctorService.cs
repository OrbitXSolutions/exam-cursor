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

    public async Task<ApiResponse<AiProctorAnalysisResponseDto>> GetAiRiskAnalysisAsync(int sessionId, string lang = "en")
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

            // 6. Only skip AI if truly zero activity from ALL sources
            var hasProctorEvents = session.TotalEvents > 0 || (session.Events != null && session.Events.Any());
            var hasAttemptActivity = attemptEvents.Count > 0 || attemptQuestions.Any(q => q.Answers != null && q.Answers.Any());
            if (!hasProctorEvents && !hasAttemptActivity)
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
            var prompt = BuildAnalysisPrompt(session, eventSummary, lang);

            // 8. Call OpenAI
            var (aiResult, errorMessage) = await CallOpenAiAsync(prompt, lang);

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

        // --- AttemptEvent Timeline (non-routine events) ---
        var attemptEventTimeline = attemptEvents
            .Where(e => e.EventType != AttemptEventType.AnswerSaved
                     && e.EventType != AttemptEventType.Navigated
                     && e.EventType != AttemptEventType.WindowFocus)
            .OrderBy(e => e.OccurredAt)
            .Take(30)
            .Select(e =>
            {
                var meta = "";
                if (!string.IsNullOrEmpty(e.MetadataJson))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(e.MetadataJson);
                        if (doc.RootElement.TryGetProperty("source", out var src)) meta += $" source={src}";
                        if (doc.RootElement.TryGetProperty("avgBrightness", out var br)) meta += $" brightness={br}";
                        if (doc.RootElement.TryGetProperty("variance", out var va)) meta += $" variance={va}";
                        if (doc.RootElement.TryGetProperty("faceCount", out var fc)) meta += $" faceCount={fc}";
                    }
                    catch { /* ignore */ }
                }
                return $"[{e.OccurredAt:HH:mm:ss}] {e.EventType}{meta}";
            })
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

        // --- Suspicious reconnect → answer spike detection ---
        // Strong cheating signal: candidate disconnects, gets answers externally, reconnects and submits rapidly
        var reconnectSignals = events
            .Where(e => e.EventType == ProctorEventType.NetworkReconnected)
            .OrderBy(e => e.OccurredAt)
            .ToList();
        int suspiciousReconnectCount = 0;
        foreach (var reconnect in reconnectSignals)
        {
            int answerBurst = attemptEvents.Count(e =>
                e.EventType == AttemptEventType.AnswerSaved &&
                e.OccurredAt > reconnect.OccurredAt &&
                e.OccurredAt <= reconnect.OccurredAt.AddSeconds(90));
            if (answerBurst >= 4) suspiciousReconnectCount++;
        }
        if (suspiciousReconnectCount > 0)
            patterns.Add($"CRITICAL: {suspiciousReconnectCount} network reconnect(s) each followed by 4+ answer submissions within 90 seconds — strong behavioral indicator of offline assistance");

        // --- Late-phase violation concentration ---
        // Violations in the last 20% of the session carry elevated significance
        var latePhaseStart = session.StartedAt + TimeSpan.FromTicks((long)(sessionDuration.Ticks * 0.80));
        var latePhaseViolationCount = violations.Count(v => v.OccurredAt >= latePhaseStart);
        if (latePhaseViolationCount >= 3)
            patterns.Add($"{latePhaseViolationCount} violation(s) concentrated in the final 20% of the session — elevated risk, possible last-minute cheating attempt");

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
            AttemptEventTimeline = attemptEventTimeline,
            RiskProgressionTimeline = riskSnapshots,
            SeverityDistribution = severityDistribution,
            // Sub-scores from rule engine
            SubScoreFace = session.FaceScore,
            SubScoreEye = session.EyeScore,
            SubScoreBehavior = session.BehaviorScore,
            SubScoreEnvironment = session.EnvironmentScore,
            // Temporal risk signals
            SuspiciousReconnectCount = suspiciousReconnectCount,
            LatePhaseViolationCount = latePhaseViolationCount,
            // Session timing
            SessionStartedAt = session.StartedAt,
            SessionEndedAt = session.EndedAt
        };
    }

    private static string BuildAnalysisPrompt(ProctorSession session, EventSummaryData summary, string lang = "en")
    {
        var sb = new StringBuilder();

        // ── Language Instruction ──
        if (lang.Equals("ar", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("CRITICAL LANGUAGE INSTRUCTION: You MUST write ALL text values in the JSON response in Arabic (العربية). Every string field — summaries, explanations, recommendations, verdicts, behavior descriptions, factor lists, timeline entries — must be in Arabic. Only JSON keys and enum values (like 'Low', 'Medium', 'High', 'Critical', 'Verified', 'Failed') remain in English. Numbers and technical identifiers stay as-is.");
            sb.AppendLine();
        }

        // ── System Role ──
        sb.AppendLine("You are a senior AI proctoring forensic analyst for a professional online examination system.");
        sb.AppendLine("You produce LEGALLY AND PROFESSIONALLY DEFENSIBLE integrity reports that will drive official administrative decisions.");
        sb.AppendLine("Your verdicts will be reviewed by proctors and administrators. Inconsistency, vagueness, or evidence-free conclusions are unacceptable.");
        sb.AppendLine("Every output you produce must be STRONGLY ANCHORED to the specific evidence presented below.");
        sb.AppendLine();

        // ── Mandatory Reasoning Protocol ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("MANDATORY ANALYSIS PROTOCOL — YOU MUST FOLLOW THESE STEPS IN ORDER");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("STEP 1 — EVIDENCE INVENTORY: Enumerate only violations that ACTUALLY OCCURRED. Do not invent or assume events.");
        sb.AppendLine("STEP 2 — PATTERN RECOGNITION: Identify correlations explicitly — bursts, disconnect+answer spikes, camera-blocked+face-absent, late-phase clusters.");
        sb.AppendLine("STEP 3 — SECURITY CONTEXT: Weigh each violation against the exam's security settings.");
        sb.AppendLine("         For example: PasteAttempt on a copy/paste-BLOCKED exam is far more intentional than on an unrestricted exam.");
        sb.AppendLine("         FullscreenExited on a fullscreen-REQUIRED exam is a policy violation; on an unrestricted exam it is minor.");
        sb.AppendLine("STEP 4 — SUB-SCORE REVIEW: The rule engine has computed 4 objective sub-scores. Reference them explicitly to justify each category rating.");
        sb.AppendLine("STEP 5 — RISK SCORING: Apply the SCORING RUBRIC to arrive at your riskScore. You MUST anchor to the computed score (see SCORING ANCHOR below).");
        sb.AppendLine("STEP 6 — VERDICT: Write integrityVerdict following the required 3-part structure (see VERDICT FORMAT GUIDE below).");
        sb.AppendLine();

        // ── Scoring Rubric ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("RISK SCORING RUBRIC — MANDATORY");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("0–20 (Low):");
        sb.AppendLine("  • 0–2 isolated violations with no pattern");
        sb.AppendLine("  • No camera blocking, no face-absent events");
        sb.AppendLine("  • No bursts, no disconnect spikes, no termination");
        sb.AppendLine("  • Answer timing consistent with natural exam behavior");
        sb.AppendLine();
        sb.AppendLine("21–50 (Medium):");
        sb.AppendLine("  • 3–7 violations, at most one category showing concern");
        sb.AppendLine("  • Minor tab switches or window blurs, no persistent camera issues");
        sb.AppendLine("  • No disconnect+answer spike, no burst patterns");
        sb.AppendLine("  • Some anomalous timing but explainable");
        sb.AppendLine();
        sb.AppendLine("51–75 (High):");
        sb.AppendLine("  • 8+ violations OR camera blocked once OR face absent 3+ times OR a verified burst pattern");
        sb.AppendLine("  • Multiple violation categories affected");
        sb.AppendLine("  • Disconnect + rapid answers (but not confirmed spike)");
        sb.AppendLine("  • Session flagged by proctor, or repeated warnings sent");
        sb.AppendLine();
        sb.AppendLine("76–100 (Critical):");
        sb.AppendLine("  • Session terminated by proctor or auto-terminated (max violations reached)");
        sb.AppendLine("  • Camera blocked repeatedly OR face not detected 5+ times");
        sb.AppendLine("  • Confirmed disconnect+answer-spike pattern (4+ answers in 90s after reconnect)");
        sb.AppendLine("  • Multiple simultaneous critical violations across face, behavior, and environment categories");
        sb.AppendLine("  • Identity verification failed or strong impersonation signal");
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
        sb.AppendLine($"- Current Risk Score (Rule Engine): {summary.RiskScore}/100");
        sb.AppendLine($"  → This is computed by the rule-based risk engine. Your riskScore output MUST anchor to this value (see SCORING ANCHOR).");
        sb.AppendLine();
        sb.AppendLine("COMPUTED SUB-SCORES (from rule engine — ground truth for each category):");
        var faceScoreStr = summary.SubScoreFace.HasValue ? $"{summary.SubScoreFace.Value:F0}/100" : "Not yet computed (no risk calculation triggered)";
        var eyeScoreStr = summary.SubScoreEye.HasValue ? $"{summary.SubScoreEye.Value:F0}/100" : "Not yet computed";
        var behaviorScoreStr = summary.SubScoreBehavior.HasValue ? $"{summary.SubScoreBehavior.Value:F0}/100" : "Not yet computed";
        var envScoreStr = summary.SubScoreEnvironment.HasValue ? $"{summary.SubScoreEnvironment.Value:F0}/100" : "Not yet computed";
        sb.AppendLine($"- Face Detection Score:  {faceScoreStr}  (100 = face always visible; 0 = face never visible / camera blocked)");
        sb.AppendLine($"- Eye Tracking Score:    {eyeScoreStr}  (100 = eyes on screen; 0 = head turned away or camera blocked)");
        sb.AppendLine($"- Behavior Score:        {behaviorScoreStr}  (100 = no behavioral violations; 0 = maximum tab switches, copy/paste, etc.)");
        sb.AppendLine($"- Environment Score:     {envScoreStr}  (100 = stable environment; 0 = camera blocked, snapshot failures, fullscreen exits)");
        sb.AppendLine("These sub-scores are computed from real event timestamps and weights. In your analysis, explicitly reference these scores and EXPLAIN what drove each one low (or high).");
        sb.AppendLine();
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
        sb.AppendLine("DISCONNECT → ANSWER SPIKE CORRELATION:");
        if (summary.SuspiciousReconnectCount > 0)
        {
            sb.AppendLine($"⚠️  CRITICAL SIGNAL DETECTED: {summary.SuspiciousReconnectCount} network reconnect(s) were each followed by 4+ answer submissions within 90 seconds.");
            sb.AppendLine("    This is the strongest behavioral indicator of offline assistance (candidate disconnected to consult external materials,");
            sb.AppendLine("    returned with answers, and rapidly submitted them). Treat this as a HIGH-WEIGHT aggravating factor.");
        }
        else if (summary.DisconnectCount > 0)
        {
            sb.AppendLine($"- {summary.DisconnectCount} disconnect(s) detected but no suspicious answer burst followed — network instability is possible.");
            sb.AppendLine("  Consider whether disconnect timing correlates with difficult question clusters in your behavioral analysis.");
        }
        else
        {
            sb.AppendLine("- No network disconnects detected. Network was stable throughout the session.");
        }
        sb.AppendLine();
        if (summary.LatePhaseViolationCount > 0)
        {
            sb.AppendLine($"LATE-PHASE VIOLATIONS: {summary.LatePhaseViolationCount} violation(s) occurred in the FINAL 20% of the session.");
            sb.AppendLine("  Late-phase violations carry higher weight than early-phase ones — candidates are less likely to be setting up and more likely acting intentionally.");
        }
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

        // ── 9b. AttemptEvent Timeline (AI detections, tab switches, etc.) ──
        if (summary.AttemptEventTimeline.Count > 0)
        {
            sb.AppendLine("═══════════════════════════════════════");
            sb.AppendLine("ATTEMPT EVENT TIMELINE (AI detections, security violations, session lifecycle):");
            sb.AppendLine("═══════════════════════════════════════");
            sb.AppendLine("These events include CRITICAL AI monitoring detections (CameraBlocked, FaceNotDetected, MultipleFacesDetected, HeadTurnDetected, FaceOutOfFrame) sent from the client-side smart monitoring system:");
            foreach (var evt in summary.AttemptEventTimeline)
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

        // ── Scoring Anchor ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("SCORING ANCHOR — MANDATORY");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine($"The rule engine has computed: riskScore = {summary.RiskScore}/100");
        sb.AppendLine($"Your riskScore output MUST be within ±15 of this computed value.");
        sb.AppendLine("If you believe the score should deviate by more than 15 points, you MUST state your specific justification in detailedAnalysis.");
        sb.AppendLine("The riskLevel you output MUST match the riskScore band: 0-20=Low, 21-50=Medium, 51-75=High, 76-100=Critical.");
        sb.AppendLine("DO NOT set riskLevel=Low with riskScore=65. DO NOT set riskLevel=Critical with riskScore=40. They must be consistent.");
        sb.AppendLine();

        // ── Violation Interpretation Reference ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("VIOLATION WEIGHT REFERENCE (for per-violation impact assessment)");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("CRITICAL weight violations (each appearance is a serious integrity concern):");
        sb.AppendLine("  • CameraBlocked — entire webcam feed was dark/covered; face and eye detection IMPOSSIBLE during this time");
        sb.AppendLine("  • MultipleFacesDetected — another person may have assisted the candidate");
        sb.AppendLine("  • WebcamDenied — candidate refused camera access on a webcam-required exam");
        sb.AppendLine("  • Terminated by proctor / auto-terminated — proctor judgment or threshold reached");
        sb.AppendLine("HIGH weight violations:");
        sb.AppendLine("  • FaceNotDetected (3+ events) — candidate repeatedly absent from camera");
        sb.AppendLine("  • Disconnect+AnswerSpike — offline assistance strongly indicated");
        sb.AppendLine("  • HeadTurnDetected (5+ events) — candidate repeatedly averted gaze from screen");
        sb.AppendLine("MEDIUM weight violations:");
        sb.AppendLine("  • TabSwitched (3+ events) — possible external resource access");
        sb.AppendLine("  • CopyAttempt / PasteAttempt (on blocked exams) — deliberate policy violation");
        sb.AppendLine("  • WindowBlur (5+ events) — sustained focus loss");
        sb.AppendLine("LOW weight violations (context-dependent):");
        sb.AppendLine("  • FullscreenExited (1-2 events) — may be accidental; more significant on fullscreen-required exams");
        sb.AppendLine("  • SnapshotFailed — technical issue, not inherently suspicious");
        sb.AppendLine("  • RightClickAttempt — minor, may be habitual behavior");
        sb.AppendLine();

        // ── Temporal & Contextual Rules ──
        sb.AppendLine("TEMPORAL & CONTEXTUAL RULES:");
        sb.AppendLine("- Violations in the FINAL 20% of the session are more suspicious than early violations (setup issues are less likely at end)");
        sb.AppendLine("- If CameraBlocked and FaceNotDetected occur TOGETHER — the entire proctoring record is compromised; treat webcam data as unreliable");
        sb.AppendLine("- If disconnect occurred < 2 minutes before exam submission — evaluate whether this is a last-minute outside-help attempt");
        sb.AppendLine("- If candidate answered questions in <3 seconds each — consider whether they could have known answers in advance");
        sb.AppendLine("- AttemptEvents with source='smart_monitoring' metadata are AI-detected from the client-side face detection system — VERIFIED detections");
        sb.AppendLine("- Multiple short disconnects (3+) are MORE suspicious than one long disconnection (network instability can cause one but not repeated drops)");
        sb.AppendLine("- If exam has browser lockdown enabled and tabs were switched — this is a lockdown bypass, extremely serious");
        sb.AppendLine();

        // ── Verdict Format Guide ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("VERDICT FORMAT GUIDE — integrityVerdict MUST follow this 3-part structure");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("Part 1 — EVIDENCE LIST: State specifically what was found (e.g., '3 CameraBlocked events, 7 FaceNotDetected, 2 TabSwitched').");
        sb.AppendLine("Part 2 — INTERPRETATION: Classify the behavior — is it a technical issue, possible evasion, or strong evidence of cheating?");
        sb.AppendLine("         Use language like: 'This pattern is consistent with deliberate camera evasion' OR 'These events may indicate network instability'.");
        sb.AppendLine("Part 3 — ACTIONABLE CONCLUSION: End with a DECISIVE RECOMMENDATION, one of:");
        sb.AppendLine("         • 'This session should be INVALIDATED due to...'");
        sb.AppendLine("         • 'This session should be FLAGGED for mandatory manual review before results are finalized.'");
        sb.AppendLine("         • 'This session is CLEARED — violations are consistent with technical issues not intentional misconduct.'");
        sb.AppendLine("         DO NOT use vague language like 'may require review' or 'some concerns'. Be decisive.");
        sb.AppendLine();
        sb.AppendLine("CALIBRATION EXAMPLES:");
        sb.AppendLine("Critical verdict example: 'This session recorded 4 CameraBlocked events and 9 FaceNotDetected events, rendering the webcam monitoring data");
        sb.AppendLine("  unreliable for approximately 40% of session duration. The session was auto-terminated at threshold. This session should be INVALIDATED.");
        sb.AppendLine("  The candidate's score must not be finalized without a full manual investigation and re-examination.'");
        sb.AppendLine("Low verdict example: 'This session recorded 1 FullscreenExited event with no other violations. The event timing suggests an accidental");
        sb.AppendLine("  key press with immediate return to fullscreen. Answer timing is consistent and natural. This session is CLEARED — the single event");
        sb.AppendLine("  does not indicate any intentional misconduct.'");
        sb.AppendLine();

        // ── Response Format ──
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("RESPOND IN EXACTLY THIS JSON FORMAT (raw JSON only — no markdown, no code blocks, no backticks):");
        sb.AppendLine("Every field is REQUIRED. Empty strings or null values are NOT acceptable — every field must have meaningful content.");
        sb.AppendLine("════════════════════════════════════════════════════════");
        sb.AppendLine("{");
        sb.AppendLine("  \"riskLevel\": \"<MUST match riskScore band: 0-20=Low, 21-50=Medium, 51-75=High, 76-100=Critical>\",");
        sb.AppendLine($"  \"riskScore\": <integer 0-100. MUST be within ±15 of the rule-engine computed score of {summary.RiskScore}. Justify deviations in detailedAnalysis.>,");
        sb.AppendLine("  \"confidence\": <integer 0-100. Reflect how confident you are given the evidence quality. High confidence requires rich event data; low if data is sparse or contradictory.>,");
        sb.AppendLine("  \"riskExplanation\": \"<2-3 sentence executive summary citing SPECIFIC evidence: violation types, counts, and their direct impact on integrity assessment>\",");
        sb.AppendLine("  \"integrityVerdict\": \"<3-part structure: [1] what was found [2] what it indicates [3] decisive actionable conclusion — INVALIDATED / FLAGGED / CLEARED>\",");
        sb.AppendLine("  \"executiveSummary\": \"<3-4 sentence professional overview: candidate, exam, key violations, overall verdict. Must be standalone readable.>\",");
        sb.AppendLine("  \"detailedAnalysis\": \"<Comprehensive forensic paragraph. MUST: cite specific event counts, address each sub-score, explain temporal patterns, state why riskScore was set at its chosen value, and address any riskScore deviation from the rule-engine score>\",");
        sb.AppendLine("  \"suspiciousBehaviors\": [\"<specific observed behavior with count — e.g., 'Camera blocked 3 times (40% of session)'>\"],");
        sb.AppendLine("  \"mitigatingFactors\": [\"<specific evidence reducing suspicion — e.g., 'Consistent answer timing (avg 45s/question)' or 'Only 1 minor violation in final 80% of exam'>\"],");
        sb.AppendLine("  \"aggravatingFactors\": [\"<specific evidence increasing suspicion — e.g., 'Camera blocked during final 20% of session' or '4 answers submitted within 60s of reconnect'>\"],");
        sb.AppendLine("  \"recommendation\": \"<single primary action: e.g., Invalidate session and require re-examination / Flag for manual review / Clear — no action required>\",");
        sb.AppendLine("  \"recommendations\": [\"<action 1 with owner — e.g., 'Proctor: Review webcam footage between 14:22 and 14:45'>\", \"<action 2>\"],");
        sb.AppendLine("  \"candidateProfile\": {");
        sb.AppendLine("    \"name\": \"<candidate full name>\",");
        sb.AppendLine("    \"email\": \"<email or N/A>\",");
        sb.AppendLine("    \"rollNumber\": \"<roll number or N/A>\",");
        sb.AppendLine("    \"department\": \"<department or N/A>\",");
        sb.AppendLine("    \"identityVerificationStatus\": \"<Verified/Pending/Failed/Not Required — include face match score if available>\",");
        sb.AppendLine("    \"deviceSummary\": \"<browser name+version, OS, screen resolution in one line>\",");
        sb.AppendLine("    \"networkSummary\": \"<IP address, disconnect count, stability assessment in one line>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"sessionOverview\": {");
        sb.AppendLine("    \"examTitle\": \"<exam name>\",");
        sb.AppendLine("    \"sessionStatus\": \"<Active/Completed/Cancelled>\",");
        sb.AppendLine("    \"attemptStatus\": \"<Started/InProgress/Submitted/Expired/Terminated etc>\",");
        sb.AppendLine("    \"duration\": \"<X minutes of Y allowed>\",");
        sb.AppendLine("    \"timeUsage\": \"<percentage of allowed time with interpretation — e.g., '82% — reasonable for exam size'>\",");
        sb.AppendLine("    \"completionRate\": \"<X/Y questions answered (Z%) — note if unusually low>\",");
        sb.AppendLine("    \"terminationInfo\": \"<reason if terminated — must specify who terminated and why, or 'Session completed normally'>\",");
        sb.AppendLine("    \"proctorMode\": \"<Soft/Advanced with one-line description of what was monitored>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"behaviorAnalysis\": {");
        sb.AppendLine("    \"answerPatternSummary\": \"<Cite avg/fastest/slowest timings. Flag if fastest <3s. Note answer changes. Assess if pattern is consistent with natural exam behavior.>\",");
        sb.AppendLine("    \"navigationBehavior\": \"<Linear / jumped around / revisited many questions — with context on what this indicates>\",");
        sb.AppendLine("    \"focusBehavior\": \"<Specific counts: X tab switches, Y window blurs, Z fullscreen exits. Tie to exam security settings.>\",");
        sb.AppendLine("    \"timingAnalysis\": \"<Distribution analysis: were answers clustered in time? Were there pauses that align with disconnects?>\",");
        sb.AppendLine("    \"suspiciousPatterns\": \"<Specific correlated patterns found — or 'No suspicious behavioral patterns detected'>\"\n  },");
        sb.AppendLine("  \"violationAnalysis\": {");
        sb.AppendLine("    \"totalViolations\": <number>,");
        sb.AppendLine("    \"countableViolations\": <number>,");
        sb.AppendLine("    \"thresholdStatus\": \"<X/Y violations used (Z%) — Safe / At Warning Level / Threshold Reached>\",");
        sb.AppendLine("    \"violationBreakdown\": [");
        sb.AppendLine("      { \"type\": \"<exact violation type name>\", \"count\": <number>, \"severity\": \"<Low/Medium/High/Critical>\", \"impact\": \"<one sentence: what this violation means for integrity>\" }");
        sb.AppendLine("    ],");
        sb.AppendLine("    \"violationTrend\": \"<increasing toward end / burst at start / steady / isolated — cite timestamps from timeline if available>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"environmentAssessment\": {");
        sb.AppendLine("    \"browserCompliance\": \"<Browser name+version. Is this a supported browser? Any known proctoring issues with this browser?>\",");
        sb.AppendLine("    \"networkStability\": \"<Stable / Unstable — cite disconnect count and total duration. State if this is a concern.>\",");
        sb.AppendLine("    \"webcamStatus\": \"<Active throughout / Blocked X times / Denied / Not required — cite FaceScore from rule engine>\",");
        sb.AppendLine("    \"fullscreenCompliance\": \"<Maintained throughout / Exited X times / Not required by exam policy>\",");
        sb.AppendLine("    \"overallEnvironmentRisk\": \"<Low/Medium/High — one sentence justification citing the EnvironmentScore>\"");
        sb.AppendLine("  },");
        sb.AppendLine("  \"riskTimeline\": [\"<key risk event chronologically — e.g., '14:03:22 — CameraBlocked (first occurrence)'>\"]");
        sb.AppendLine("}");

        return sb.ToString();
    }

    private async Task<(AiProctorAnalysisResponseDto? Result, string? ErrorMessage)> CallOpenAiAsync(string prompt, string lang = "en")
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiSettings.ApiKey);
        client.Timeout = TimeSpan.FromSeconds(60);

        var systemMessage = lang.Equals("ar", StringComparison.OrdinalIgnoreCase)
            ? "You are a senior AI proctoring forensic analyst producing legally defensible, evidence-driven examination integrity reports. " +
              "CRITICAL RULES: (1) Respond with valid JSON only — no markdown, no code blocks. " +
              "(2) Every field in the requested schema must contain meaningful evidence-based content — no empty strings, no generic phrases. " +
              "(3) riskScore must be within ±15 of the rule-engine computed score unless explicitly justified. " +
              "(4) riskLevel must match the riskScore band exactly. " +
              "(5) integrityVerdict must follow the 3-part structure: [evidence found] + [interpretation] + [decisive conclusion: INVALIDATED/FLAGGED/CLEARED]. " +
              "IMPORTANT: All text values in the JSON must be written in Arabic (العربية). Only JSON keys and enum values remain in English."
            : "You are a senior AI proctoring forensic analyst producing legally defensible, evidence-driven examination integrity reports. " +
              "CRITICAL RULES: (1) Respond with valid JSON only — no markdown, no code blocks. " +
              "(2) Every field in the requested schema must contain meaningful evidence-based content — no empty strings, no generic phrases. " +
              "(3) riskScore must be within ±15 of the rule-engine computed score unless explicitly justified. " +
              "(4) riskLevel must match the riskScore band exactly: 0-20=Low, 21-50=Medium, 51-75=High, 76-100=Critical. " +
              "(5) integrityVerdict must follow the 3-part structure: [evidence found] + [interpretation] + [decisive conclusion: INVALIDATED/FLAGGED/CLEARED].";

        var requestBody = new
        {
            model = _openAiSettings.Model,
            messages = new[]
            {
                new { role = "system", content = systemMessage },
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
        public List<string> AttemptEventTimeline { get; set; } = new();
        public List<string> RiskProgressionTimeline { get; set; } = new();
        public Dictionary<int, int> SeverityDistribution { get; set; } = new();
        // Sub-scores from rule engine calculation (null until first risk recalculation)
        public decimal? SubScoreFace { get; set; }
        public decimal? SubScoreEye { get; set; }
        public decimal? SubScoreBehavior { get; set; }
        public decimal? SubScoreEnvironment { get; set; }
        // Temporal risk signals
        public int SuspiciousReconnectCount { get; set; }
        public int LatePhaseViolationCount { get; set; }
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
