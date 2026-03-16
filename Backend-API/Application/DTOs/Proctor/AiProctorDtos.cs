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

    // ── Enhanced Report Sections (backward-compatible, all nullable) ──

    /// <summary>Executive summary — 2-3 sentence overview of the entire session</summary>
    public string? ExecutiveSummary { get; set; }

    /// <summary>Candidate profile section — identity, device, environment</summary>
    public AiReportCandidateProfile? CandidateProfile { get; set; }

    /// <summary>Exam & session overview — timing, progress, completion</summary>
    public AiReportSessionOverview? SessionOverview { get; set; }

    /// <summary>Behavior analysis — answer patterns, navigation, focus</summary>
    public AiReportBehaviorAnalysis? BehaviorAnalysis { get; set; }

    /// <summary>Violation breakdown — each violation type with severity/impact</summary>
    public AiReportViolationAnalysis? ViolationAnalysis { get; set; }

    /// <summary>Environment & device assessment</summary>
    public AiReportEnvironmentAssessment? EnvironmentAssessment { get; set; }

    /// <summary>Overall integrity verdict</summary>
    public string? IntegrityVerdict { get; set; }

    /// <summary>AI-computed risk score 0-100</summary>
    public int? RiskScore { get; set; }

    /// <summary>Factors that reduce suspicion</summary>
    public List<string>? MitigatingFactors { get; set; }

    /// <summary>Factors that increase suspicion</summary>
    public List<string>? AggravatingFactors { get; set; }

    /// <summary>Actionable recommendations list</summary>
    public List<string>? Recommendations { get; set; }

    /// <summary>Risk timeline — how risk evolved during session</summary>
    public List<string>? RiskTimeline { get; set; }
}

public class AiReportCandidateProfile
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? RollNumber { get; set; }
    public string? Department { get; set; }
    public string? IdentityVerificationStatus { get; set; }
    public string? DeviceSummary { get; set; }
    public string? NetworkSummary { get; set; }
}

public class AiReportSessionOverview
{
    public string? ExamTitle { get; set; }
    public string? SessionStatus { get; set; }
    public string? AttemptStatus { get; set; }
    public string? Duration { get; set; }
    public string? TimeUsage { get; set; }
    public string? CompletionRate { get; set; }
    public string? TerminationInfo { get; set; }
    public string? ProctorMode { get; set; }
}

public class AiReportBehaviorAnalysis
{
    public string? AnswerPatternSummary { get; set; }
    public string? NavigationBehavior { get; set; }
    public string? FocusBehavior { get; set; }
    public string? TimingAnalysis { get; set; }
    public string? SuspiciousPatterns { get; set; }
}

public class AiReportViolationAnalysis
{
    public int TotalViolations { get; set; }
    public int CountableViolations { get; set; }
    public string? ThresholdStatus { get; set; }
    public List<AiReportViolationItem>? ViolationBreakdown { get; set; }
    public string? ViolationTrend { get; set; }
}

public class AiReportViolationItem
{
    public string? Type { get; set; }
    public int Count { get; set; }
    public string? Severity { get; set; }
    public string? Impact { get; set; }
}

public class AiReportEnvironmentAssessment
{
    public string? BrowserCompliance { get; set; }
    public string? NetworkStability { get; set; }
    public string? WebcamStatus { get; set; }
    public string? FullscreenCompliance { get; set; }
    public string? OverallEnvironmentRisk { get; set; }
}
