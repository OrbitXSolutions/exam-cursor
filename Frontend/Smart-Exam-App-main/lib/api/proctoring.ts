import { apiClient } from "@/lib/api-client";
import type { LiveSession, Incident } from "@/lib/types/proctoring";
import type {
  IdentityVerificationListItem,
  IdentityVerificationDetail,
  IdentityBulkActionResult,
  PagedResult,
} from "@/lib/types";

// Backend IncidentCaseListDto (camelCase from API)
interface IncidentCaseListDto {
  id: number;
  caseNumber: string;
  examId: number;
  examTitleEn: string;
  candidateName: string;
  status: number;
  statusName: string;
  severity: number;
  severityName: string;
  source: number;
  titleEn: string;
  riskScoreAtCreate?: number;
  assigneeName?: string;
  outcome?: number;
  createdAt: string;
  hasPendingAppeal: boolean;
}

function mapToIncident(dto: IncidentCaseListDto): Incident {
  const severity =
    dto.severityName === "Low"
      ? "Low"
      : dto.severityName === "Medium"
        ? "Medium"
        : dto.severityName === "High"
          ? "High"
          : "Critical";
  return {
    id: String(dto.id),
    sessionId: String(dto.id),
    candidateName: dto.candidateName ?? "",
    examTitle: dto.examTitleEn ?? "",
    type: "Other",
    severity,
    description: dto.titleEn ?? "",
    timestamp: dto.createdAt,
    reviewed: dto.outcome != null && dto.outcome !== undefined,
  };
}

// Backend ProctorSessionListDto shape (camelCase)
interface ProctorSessionListDto {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  candidateId: string;
  candidateName: string;
  status: number;
  statusName: string;
  startedAt: string;
  totalViolations: number;
  riskScore?: number;
  decisionStatus?: number;
  requiresReview: boolean;
  isFlagged?: boolean;
  isSample?: boolean;
  latestSnapshotUrl?: string;
  snapshotCount?: number;
  lastSnapshotAt?: string;
  countableViolationCount?: number;
  maxViolationWarnings?: number;
}

function mapToLiveSession(dto: ProctorSessionListDto): LiveSession {
  const status =
    dto.statusName === "Active"
      ? "Active"
      : dto.statusName === "Cancelled" || dto.statusName === "Terminated"
        ? "Terminated"
        : "Completed";
  return {
    id: String(dto.id),
    candidateId: dto.candidateId,
    candidateName: dto.candidateName ?? "",
    examTitle: dto.examTitleEn ?? "",
    startedAt: dto.startedAt,
    timeRemaining: 0,
    status,
    incidentCount: dto.totalViolations ?? 0,
    flagged: dto.isFlagged ?? false,
    lastActivity: dto.startedAt,
    isSample: dto.isSample ?? false,
    latestSnapshotUrl: dto.latestSnapshotUrl ?? undefined,
    snapshotCount: dto.snapshotCount ?? 0,
    lastSnapshotAt: dto.lastSnapshotAt ?? undefined,
    riskScore: dto.riskScore ?? undefined,
    totalViolations: dto.totalViolations ?? 0,
    countableViolationCount: dto.countableViolationCount ?? 0,
    maxViolationWarnings: dto.maxViolationWarnings ?? 0,
  };
}

/**
 * Get incident cases (GET /Incident/cases). Returns paginated shape { items, ... } for the incidents page.
 */
export async function getIncidents(params?: {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<{ items: Incident[]; totalCount: number }> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", String(params?.pageNumber ?? 1));
    query.set("PageSize", String(params?.pageSize ?? 50));
    if (params?.status && params.status !== "all") {
      query.set("Status", params.status);
    }
    const raw = await apiClient.get<{
      items?: IncidentCaseListDto[];
      totalCount?: number;
    }>(`/Incident/cases?${query}`);
    const items = raw?.items ?? [];
    return {
      items: items.map(mapToIncident),
      totalCount: raw?.totalCount ?? 0,
    };
  } catch (err) {
    console.warn("[Proctor] getIncidents failed:", err);
    return { items: [], totalCount: 0 };
  }
}

/**
 * Record a decision on an incident case (POST /Incident/decision).
 * action: dismiss -> Cleared, flag -> Suspicious, terminate -> Invalidated.
 */
export async function reviewIncident(
  caseId: string,
  options: { action: "dismiss" | "flag" | "terminate"; notes?: string },
): Promise<void> {
  const outcome =
    options.action === "dismiss" ? 1 : options.action === "flag" ? 2 : 3;
  const closeCase = options.action !== "flag";
  await apiClient.post("/Incident/decision", {
    caseId: Number(caseId),
    outcome,
    reasonEn: options.notes ?? undefined,
    internalNotes: options.notes ?? undefined,
    closeCase,
  });
}

/**
 * Get live proctor sessions (GET /Proctor/sessions)
 */
export async function getLiveSessions(
  includeSamples = false,
): Promise<LiveSession[]> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", "1");
    query.set("PageSize", "100");
    query.set("Status", "1");
    query.set("IncludeSamples", String(includeSamples));
    const raw = await apiClient.get<{ items?: ProctorSessionListDto[] }>(
      `/Proctor/sessions?${query}`,
    );
    const items = raw?.items ?? [];
    return items.map(mapToLiveSession);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Proctor] getLiveSessions failed:", msg, err);
    throw err; // let caller show toast instead of silently returning []
  }
}

// ── Triage / AI Assistant ────────────────────────────────────────────────────

export interface TriageRecommendation {
  sessionId: number;
  candidateName: string;
  examTitle: string;
  riskScore: number;
  riskLevel: string;
  totalViolations: number;
  reasonEn: string;
  reasonAr: string;
}

/**
 * Get top triage recommendations for the proctor AI assistant (GET /Proctor/triage)
 */
export async function getTriageRecommendations(
  top = 5,
  includeSample = true,
): Promise<TriageRecommendation[]> {
  try {
    const raw = await apiClient.get<
      TriageRecommendation[] | { data?: TriageRecommendation[] }
    >(`/Proctor/triage?top=${top}&includeSample=${includeSample}`);
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object" && Array.isArray((raw as any).data))
      return (raw as any).data;
    if (raw && typeof raw === "object") {
      const record = raw as Record<string, unknown>;
      const items = (record.items ??
        record.Items ??
        record.data ??
        record.Data) as TriageRecommendation[] | undefined;
      if (Array.isArray(items)) return items;
    }
    return [];
  } catch (err) {
    console.warn("[Proctor] getTriageRecommendations failed:", err);
    return [];
  }
}

// Backend ApiResponse<ProctorSessionDto> and ProctorSessionDto shape (camelCase)
interface ProctorSessionDetailDto {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  candidateId: string;
  candidateName: string;
  status: number;
  statusName: string;
  startedAt: string;
  endedAt?: string;
  totalEvents: number;
  totalViolations: number;
  countableViolationCount: number;
  maxViolationWarnings: number;
  isTerminatedByProctor: boolean;
  terminationReason?: string;
  riskScore?: number;
  lastHeartbeatAt?: string;
  isFlagged?: boolean;
  // Device & Browser info
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  screenResolution?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  // Attempt-level fields
  remainingSeconds?: number;
  expiresAt?: string;
  attemptStatus?: string;
  attemptIpAddress?: string;
  attemptDeviceInfo?: string;
  // Enriched fields
  candidateEmail?: string;
  candidateNameAr?: string;
  candidateRollNo?: string;
  candidateDepartment?: string;
  candidatePhone?: string;
  examTitleAr?: string;
  examDurationMinutes?: number;
  examPassScore?: number;
  examMaxAttempts?: number;
  examTotalQuestions?: number;
  examRequireWebcam?: boolean;
  examEnableScreenMonitoring?: boolean;
  examRequireIdVerification?: boolean;
  examRequireFullscreen?: boolean;
  examPreventCopyPaste?: boolean;
  examBrowserLockdown?: boolean;
  attemptNumber?: number;
  attemptTotalScore?: number;
  attemptIsPassed?: boolean;
  attemptSubmittedAt?: string;
  attemptStartedAt?: string;
  attemptExtraTimeSeconds?: number;
  attemptTotalAnswered?: number;
  attemptTotalQuestions?: number;
  sessionDuration?: string;
  sessionDurationMinutes?: number;
  riskLevel?: string;
  modeName?: string;
  heartbeatMissedCount?: number;
  endedAt?: string;
  identityVerification?: {
    status: string;
    faceMatchScore?: number;
    livenessResult?: string;
    riskScore?: number;
    submittedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
    idDocumentType?: string;
    idDocumentUploaded: boolean;
  };
  violationBreakdown?: Array<{
    eventType: string;
    count: number;
    severity: string;
  }>;
  decision?: {
    id: number;
    status: number;
    statusName: string;
    decisionReasonEn?: string;
    decidedBy?: string;
    deciderName?: string;
    decidedAt?: string;
    isFinalized: boolean;
    wasOverridden: boolean;
  };
}

/**
 * Get session details for proctor center (GET /Proctor/session/{sessionId}).
 * Returns session, incidents for this exam, and evidence/screenshots.
 */
export async function getSessionDetails(
  sessionId: string | undefined,
): Promise<{
  session: LiveSession;
  incidents: Incident[];
  screenshots: Array<{ id: string; timestamp: string; url: string }>;
}> {
  if (!sessionId) {
    throw new Error("Session ID is required");
  }
  const sessionRes = await apiClient.get<ProctorSessionDetailDto>(
    `/Proctor/session/${sessionId}`,
  );
  // apiClient.get already unwraps ApiResponse.data, so sessionRes IS the DTO directly
  const data: ProctorSessionDetailDto | undefined =
    sessionRes && typeof sessionRes === "object" && "id" in sessionRes
      ? (sessionRes as ProctorSessionDetailDto)
      : (sessionRes as unknown as { data?: ProctorSessionDetailDto })?.data;
  if (!data) {
    throw new Error("Session not found");
  }
  const session: LiveSession = {
    id: String(data.id),
    attemptId: data.attemptId,
    examId: data.examId,
    candidateId: data.candidateId ?? "",
    candidateName: data.candidateName ?? "",
    examTitle: data.examTitleEn ?? "",
    startedAt: data.startedAt,
    timeRemaining:
      data.remainingSeconds != null ? Math.ceil(data.remainingSeconds / 60) : 0,
    status:
      data.statusName === "Active"
        ? "Active"
        : data.statusName === "Cancelled" || data.statusName === "Terminated"
          ? "Terminated"
          : "Completed",
    incidentCount: data.totalViolations ?? 0,
    flagged: data.isFlagged ?? false,
    lastActivity: data.lastHeartbeatAt ?? data.startedAt,
    totalViolations: data.totalViolations,
    countableViolationCount: data.countableViolationCount,
    maxViolationWarnings: data.maxViolationWarnings,
    isTerminatedByProctor: data.isTerminatedByProctor,
    terminationReason: data.terminationReason,
    riskScore: data.riskScore,
    // Device & Browser info
    browserName: data.browserName,
    browserVersion: data.browserVersion,
    operatingSystem: data.operatingSystem,
    screenResolution: data.screenResolution,
    ipAddress: data.ipAddress,
    deviceFingerprint: data.deviceFingerprint,
    userAgent: data.userAgent,
    // Attempt-level fields
    remainingSeconds: data.remainingSeconds,
    expiresAt: data.expiresAt,
    attemptStatus: data.attemptStatus,
    attemptIpAddress: data.attemptIpAddress,
    attemptDeviceInfo: data.attemptDeviceInfo,
    // Enriched: Candidate Profile
    candidateEmail: data.candidateEmail,
    candidateNameAr: data.candidateNameAr,
    candidateRollNo: data.candidateRollNo,
    candidateDepartment: data.candidateDepartment,
    candidatePhone: data.candidatePhone,
    // Enriched: Exam Details
    examTitleAr: data.examTitleAr,
    examDurationMinutes: data.examDurationMinutes,
    examPassScore: data.examPassScore,
    examMaxAttempts: data.examMaxAttempts,
    examTotalQuestions: data.examTotalQuestions,
    examRequireWebcam: data.examRequireWebcam,
    examEnableScreenMonitoring: data.examEnableScreenMonitoring,
    examRequireIdVerification: data.examRequireIdVerification,
    examRequireFullscreen: data.examRequireFullscreen,
    examPreventCopyPaste: data.examPreventCopyPaste,
    examBrowserLockdown: data.examBrowserLockdown,
    // Enriched: Attempt Progress
    attemptNumber: data.attemptNumber,
    attemptTotalScore: data.attemptTotalScore,
    attemptIsPassed: data.attemptIsPassed,
    attemptSubmittedAt: data.attemptSubmittedAt,
    attemptStartedAt: data.attemptStartedAt,
    attemptExtraTimeSeconds: data.attemptExtraTimeSeconds,
    attemptTotalAnswered: data.attemptTotalAnswered,
    attemptTotalQuestions: data.attemptTotalQuestions,
    // Enriched: Session Duration & Risk
    sessionDuration: data.sessionDuration,
    sessionDurationMinutes: data.sessionDurationMinutes,
    riskLevel: data.riskLevel,
    modeName: data.modeName,
    heartbeatMissedCount: data.heartbeatMissedCount,
    endedAt: data.endedAt,
    // Enriched: Identity Verification
    identityVerification: data.identityVerification,
    // Enriched: Violation Breakdown
    violationBreakdown: data.violationBreakdown,
    // Enriched: Decision
    decision: data.decision
      ? {
          status: data.decision.statusName,
          statusName: data.decision.statusName,
          decisionReasonEn: data.decision.decisionReasonEn,
          decidedBy: data.decision.decidedBy,
          deciderName: data.decision.deciderName,
          decidedAt: data.decision.decidedAt,
          isFinalized: data.decision.isFinalized,
          wasOverridden: data.decision.wasOverridden,
        }
      : undefined,
  };
  let incidents: Incident[] = [];
  try {
    const inc = await getIncidents({ pageNumber: 1, pageSize: 100 });
    incidents = inc.items.filter(
      (i) =>
        i.examTitle === session.examTitle &&
        i.candidateName === session.candidateName,
    );
  } catch {
    // ignore
  }
  let screenshots: Array<{ id: string; timestamp: string; url: string }> = [];
  try {
    // apiClient.get already unwraps ApiResponse.data, so result is the array directly
    const list = await apiClient.get<
      Array<{
        id: number;
        uploadedAt?: string;
        startAt?: string;
        previewUrl?: string;
        downloadUrl?: string;
      }>
    >(`/Proctor/session/${sessionId}/evidence`);
    const items = Array.isArray(list) ? list : [];
    screenshots = items
      .filter((e) => e.previewUrl || e.downloadUrl)
      .map((e) => ({
        id: String(e.id),
        timestamp: e.uploadedAt ?? e.startAt ?? "",
        url: e.previewUrl ?? e.downloadUrl ?? "",
      }))
      .reverse(); // latest first
  } catch {
    // ignore
  }
  return { session, incidents, screenshots };
}

/**
 * Lightweight refresh — fetches session + screenshots only (no incidents).
 * Used by polling to avoid repeated 403 noise on /Incident/cases.
 */
export async function refreshSessionData(sessionId: string): Promise<{
  session: LiveSession;
  screenshots: Array<{ id: string; timestamp: string; url: string }>;
}> {
  const sessionRes = await apiClient.get<ProctorSessionDetailDto>(
    `/Proctor/session/${sessionId}`,
  );
  const data: ProctorSessionDetailDto | undefined =
    sessionRes && typeof sessionRes === "object" && "id" in sessionRes
      ? (sessionRes as ProctorSessionDetailDto)
      : (sessionRes as unknown as { data?: ProctorSessionDetailDto })?.data;
  if (!data) throw new Error("Session not found");
  const session: LiveSession = {
    id: String(data.id),
    attemptId: data.attemptId,
    examId: data.examId,
    candidateId: data.candidateId ?? "",
    candidateName: data.candidateName ?? "",
    examTitle: data.examTitleEn ?? "",
    startedAt: data.startedAt,
    timeRemaining:
      data.remainingSeconds != null ? Math.ceil(data.remainingSeconds / 60) : 0,
    status:
      data.statusName === "Active"
        ? "Active"
        : data.statusName === "Cancelled" || data.statusName === "Terminated"
          ? "Terminated"
          : "Completed",
    incidentCount: data.totalViolations ?? 0,
    flagged: data.isFlagged ?? false,
    lastActivity: data.lastHeartbeatAt ?? data.startedAt,
    totalViolations: data.totalViolations,
    countableViolationCount: data.countableViolationCount,
    maxViolationWarnings: data.maxViolationWarnings,
    isTerminatedByProctor: data.isTerminatedByProctor,
    terminationReason: data.terminationReason,
    riskScore: data.riskScore,
    browserName: data.browserName,
    browserVersion: data.browserVersion,
    operatingSystem: data.operatingSystem,
    screenResolution: data.screenResolution,
    ipAddress: data.ipAddress,
    deviceFingerprint: data.deviceFingerprint,
    userAgent: data.userAgent,
    remainingSeconds: data.remainingSeconds,
    expiresAt: data.expiresAt,
    attemptStatus: data.attemptStatus,
    attemptIpAddress: data.attemptIpAddress,
    attemptDeviceInfo: data.attemptDeviceInfo,
    // Enriched fields (also populated on refresh)
    candidateEmail: data.candidateEmail,
    candidateNameAr: data.candidateNameAr,
    candidateRollNo: data.candidateRollNo,
    candidateDepartment: data.candidateDepartment,
    candidatePhone: data.candidatePhone,
    examTitleAr: data.examTitleAr,
    examDurationMinutes: data.examDurationMinutes,
    examPassScore: data.examPassScore,
    examMaxAttempts: data.examMaxAttempts,
    examTotalQuestions: data.examTotalQuestions,
    examRequireWebcam: data.examRequireWebcam,
    examEnableScreenMonitoring: data.examEnableScreenMonitoring,
    examRequireIdVerification: data.examRequireIdVerification,
    examRequireFullscreen: data.examRequireFullscreen,
    examPreventCopyPaste: data.examPreventCopyPaste,
    examBrowserLockdown: data.examBrowserLockdown,
    attemptNumber: data.attemptNumber,
    attemptTotalScore: data.attemptTotalScore,
    attemptIsPassed: data.attemptIsPassed,
    attemptSubmittedAt: data.attemptSubmittedAt,
    attemptStartedAt: data.attemptStartedAt,
    attemptExtraTimeSeconds: data.attemptExtraTimeSeconds,
    attemptTotalAnswered: data.attemptTotalAnswered,
    attemptTotalQuestions: data.attemptTotalQuestions,
    sessionDuration: data.sessionDuration,
    sessionDurationMinutes: data.sessionDurationMinutes,
    riskLevel: data.riskLevel,
    modeName: data.modeName,
    heartbeatMissedCount: data.heartbeatMissedCount,
    endedAt: data.endedAt,
    identityVerification: data.identityVerification,
    violationBreakdown: data.violationBreakdown,
    decision: data.decision
      ? {
          status: data.decision.statusName,
          statusName: data.decision.statusName,
          decisionReasonEn: data.decision.decisionReasonEn,
          decidedBy: data.decision.decidedBy,
          deciderName: data.decision.deciderName,
          decidedAt: data.decision.decidedAt,
          isFinalized: data.decision.isFinalized,
          wasOverridden: data.decision.wasOverridden,
        }
      : undefined,
  };
  let screenshots: Array<{ id: string; timestamp: string; url: string }> = [];
  try {
    const list = await apiClient.get<
      Array<{
        id: number;
        uploadedAt?: string;
        startAt?: string;
        previewUrl?: string;
        downloadUrl?: string;
      }>
    >(`/Proctor/session/${sessionId}/evidence`);
    const items = Array.isArray(list) ? list : [];
    screenshots = items
      .filter((e) => e.previewUrl || e.downloadUrl)
      .map((e) => ({
        id: String(e.id),
        timestamp: e.uploadedAt ?? e.startAt ?? "",
        url: e.previewUrl ?? e.downloadUrl ?? "",
      }))
      .reverse();
  } catch {
    // ignore
  }
  return { session, screenshots };
}

/**
 * Flag/unflag session — POST /Proctor/session/{sessionId}/flag
 */
export async function flagSession(
  sessionId: string,
  flagged: boolean,
): Promise<void> {
  await apiClient.post(`/Proctor/session/${sessionId}/flag`, { flagged });
}

/**
 * Send warning to candidate — POST /Proctor/session/{sessionId}/warning
 */
export async function sendWarning(
  sessionId: string,
  message: string,
): Promise<void> {
  await apiClient.post(`/Proctor/session/${sessionId}/warning`, { message });
}

/**
 * Terminate session — POST /Proctor/session/{sessionId}/terminate
 * This also force-ends the candidate's attempt.
 */
export async function terminateSession(
  sessionId: string,
  reason: string,
): Promise<void> {
  await apiClient.post(`/Proctor/session/${sessionId}/terminate`, { reason });
}

// ============ AI PROCTOR ANALYSIS ============

export interface AiReportCandidateProfile {
  name?: string;
  email?: string;
  rollNumber?: string;
  department?: string;
  identityVerificationStatus?: string;
  deviceSummary?: string;
  networkSummary?: string;
}

export interface AiReportSessionOverview {
  examTitle?: string;
  sessionStatus?: string;
  attemptStatus?: string;
  duration?: string;
  timeUsage?: string;
  completionRate?: string;
  terminationInfo?: string;
  proctorMode?: string;
}

export interface AiReportBehaviorAnalysis {
  answerPatternSummary?: string;
  navigationBehavior?: string;
  focusBehavior?: string;
  timingAnalysis?: string;
  suspiciousPatterns?: string;
}

export interface AiReportViolationItem {
  type?: string;
  count?: number;
  severity?: string;
  impact?: string;
}

export interface AiReportViolationAnalysis {
  totalViolations?: number;
  countableViolations?: number;
  thresholdStatus?: string;
  violationBreakdown?: AiReportViolationItem[];
  violationTrend?: string;
}

export interface AiReportEnvironmentAssessment {
  browserCompliance?: string;
  networkStability?: string;
  webcamStatus?: string;
  fullscreenCompliance?: string;
  overallEnvironmentRisk?: string;
}

export interface AiProctorAnalysis {
  riskLevel: string;
  riskExplanation: string;
  suspiciousBehaviors: string[];
  recommendation: string;
  confidence: number;
  detailedAnalysis: string;
  model: string;
  generatedAt: string;
  // Enhanced report sections
  executiveSummary?: string;
  candidateProfile?: AiReportCandidateProfile;
  sessionOverview?: AiReportSessionOverview;
  behaviorAnalysis?: AiReportBehaviorAnalysis;
  violationAnalysis?: AiReportViolationAnalysis;
  environmentAssessment?: AiReportEnvironmentAssessment;
  integrityVerdict?: string;
  riskScore?: number;
  mitigatingFactors?: string[];
  aggravatingFactors?: string[];
  recommendations?: string[];
  riskTimeline?: string[];
}

/**
 * Generate AI-powered risk analysis for a proctoring session.
 * Uses GPT-4o to analyze events, violations, and patterns.
 * Advisory only — the proctor always has final authority.
 * GET /Proctor/session/{sessionId}/ai-analysis
 */
export async function getAiProctorAnalysis(
  sessionId: string,
  lang: string = "en",
): Promise<AiProctorAnalysis> {
  const res = await apiClient.get(
    `/Proctor/session/${sessionId}/ai-analysis?lang=${lang}`,
  );
  return res;
}

/**
 * Update device info for a proctor session (client-side fields).
 * PATCH /Proctor/session/device-info
 */
export async function updateSessionDeviceInfo(data: {
  attemptId: number;
  browserName?: string;
  browserVersion?: string;
  operatingSystem?: string;
  screenResolution?: string;
  deviceFingerprint?: string;
}): Promise<void> {
  await apiClient.patch("/Proctor/session/device-info", data);
}

/**
 * Upload webcam snapshot during exam (for proctoring).
 * Returns { success, error? } — does NOT swallow errors.
 * Retries up to `maxRetries` times with `retryDelayMs` between attempts.
 */
export async function uploadProctorSnapshot(
  attemptId: number,
  blob: Blob,
  fileName = "snapshot.jpg",
  maxRetries = 2,
  retryDelayMs = 2000,
): Promise<{ success: boolean; error?: string }> {
  const file = new File([blob], fileName, { type: blob.type });
  let lastError = "";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await apiClient.uploadFile(`/Proctor/snapshot/${attemptId}`, file);
      return { success: true };
    } catch (err: any) {
      lastError = err?.message ?? String(err);
      console.warn(
        `[Proctor] Snapshot upload attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        lastError,
      );
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }
  }
  return { success: false, error: lastError };
}

// ============ IDENTITY VERIFICATION API ============

/**
 * Fetch paginated identity verifications with filters.
 * GET /proctor/authentication/verifications
 */
export async function getIdentityVerifications(params?: {
  status?: number;
  examId?: number;
  riskLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  assignedProctorId?: string;
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedResult<IdentityVerificationListItem>> {
  const query = new URLSearchParams();
  query.set("PageNumber", String(params?.pageNumber ?? 1));
  query.set("PageSize", String(params?.pageSize ?? 20));
  if (params?.status !== undefined && params.status !== -1)
    query.set("Status", String(params.status));
  if (params?.examId) query.set("ExamId", String(params.examId));
  if (params?.riskLevel && params.riskLevel !== "all")
    query.set("RiskLevel", params.riskLevel);
  if (params?.dateFrom) query.set("DateFrom", params.dateFrom);
  if (params?.dateTo) query.set("DateTo", params.dateTo);
  if (params?.assignedProctorId)
    query.set("AssignedProctorId", params.assignedProctorId);
  if (params?.search) query.set("Search", params.search);

  try {
    const raw = await apiClient.get<PagedResult<IdentityVerificationListItem>>(
      `/proctor/authentication/verifications?${query}`,
    );
    return (
      raw ?? {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 0,
      }
    );
  } catch (err) {
    console.warn("[Proctor] getIdentityVerifications failed:", err);
    return {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 20,
      totalPages: 0,
    };
  }
}

/**
 * Fetch full detail for a single identity verification.
 * GET /proctor/authentication/verifications/{id}
 */
export async function getIdentityVerificationDetail(
  id: number,
): Promise<IdentityVerificationDetail | null> {
  try {
    return await apiClient.get<IdentityVerificationDetail>(
      `/proctor/authentication/verifications/${id}`,
    );
  } catch (err) {
    console.warn("[Proctor] getIdentityVerificationDetail failed:", err);
    return null;
  }
}

/**
 * Apply a single action (Approve / Reject / Flag) on one verification.
 * POST /proctor/authentication/verifications/{id}/action
 */
export async function applyVerificationAction(
  id: number,
  action: string,
  reason?: string,
): Promise<void> {
  await apiClient.post(`/proctor/authentication/verifications/${id}/action`, {
    id,
    action,
    reason: reason ?? undefined,
  });
}

/**
 * Apply a bulk action on multiple verifications.
 * POST /proctor/authentication/bulk-action
 */
export async function applyBulkVerificationAction(
  ids: number[],
  action: string,
  reason?: string,
): Promise<IdentityBulkActionResult> {
  return await apiClient.post<IdentityBulkActionResult>(
    `/proctor/authentication/bulk-action`,
    { ids, action, reason: reason ?? undefined },
  );
}

// ============ CANDIDATE IDENTITY VERIFICATION ============

export interface CandidateVerificationStatus {
  hasSubmitted: boolean;
  status: string; // "None" | "Pending" | "Approved" | "Rejected" | "Flagged"
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface CandidateVerificationSubmitResult {
  verificationId: number;
  status: string;
  message: string;
}

/**
 * Get verification status for the current candidate.
 * GET /proctor/authentication/status
 */
export async function getCandidateVerificationStatus(): Promise<CandidateVerificationStatus> {
  try {
    const res = await apiClient.get<CandidateVerificationStatus>(
      `/proctor/authentication/status`,
    );
    return res ?? { hasSubmitted: false, status: "None" };
  } catch {
    return { hasSubmitted: false, status: "None" };
  }
}

/**
 * Submit candidate identity verification (selfie + ID photo + info).
 * POST /proctor/authentication/submit (multipart/form-data)
 */
export async function submitCandidateVerification(
  selfiePhoto: File,
  idPhoto: File,
  idDocumentType?: string,
  idNumber?: string,
): Promise<CandidateVerificationSubmitResult> {
  const formData = new FormData();
  formData.append("selfiePhoto", selfiePhoto);
  formData.append("idPhoto", idPhoto);
  if (idDocumentType) formData.append("idDocumentType", idDocumentType);
  if (idNumber) formData.append("idNumber", idNumber);

  const token = localStorage.getItem("auth_token");
  const baseUrl = "/api/proxy/proctor/authentication/submit";

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const responseText = await res.text();
  let result: any;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      res.ok
        ? "Verification submission failed"
        : `Server error (${res.status}). Please try again.`,
    );
  }

  if (result.success && result.data) {
    return result.data;
  }
  throw new Error(result.message || "Verification submission failed");
}

// ============ CANDIDATE SESSION STATUS (POLLING) ============

export interface CandidateSessionStatus {
  hasWarning: boolean;
  warningMessage?: string;
  isTerminated: boolean;
  terminationReason?: string;
}

/**
 * Candidate polls this for pending proctor warnings or termination.
 * GET /Proctor/candidate-status/{attemptId}
 * Warning is cleared from backend after delivery.
 */
export async function getCandidateSessionStatus(
  attemptId: number,
): Promise<CandidateSessionStatus> {
  try {
    const res = await apiClient.get<CandidateSessionStatus>(
      `/Proctor/candidate-status/${attemptId}`,
    );
    return res ?? { hasWarning: false, isTerminated: false };
  } catch {
    // Silent fail — don't disrupt exam if poll fails
    return { hasWarning: false, isTerminated: false };
  }
}

// ============ INCIDENT CASE MANAGEMENT ============

/** Full incident case detail (from GET /Incident/case/{id}) */
export interface IncidentCaseDetailDto {
  id: number;
  caseNumber: string;
  examId: number;
  examTitleEn: string;
  attemptId: number;
  attemptNumber: number;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  proctorSessionId?: number;
  status: number;
  statusName: string;
  severity: number;
  severityName: string;
  source: number;
  sourceName: string;
  titleEn: string;
  titleAr: string;
  summaryEn?: string;
  summaryAr?: string;
  riskScoreAtCreate?: number;
  totalViolationsAtCreate?: number;
  assignedTo?: string;
  assigneeName?: string;
  assignedAt?: string;
  outcome?: number;
  outcomeName?: string;
  resolutionNoteEn?: string;
  resolvedBy?: string;
  resolverName?: string;
  resolvedAt?: string;
  createdAt: string;
  timeline: IncidentTimelineEventDto[];
  evidenceLinks: IncidentEvidenceLinkDto[];
  decisions: IncidentDecisionDto[];
  commentCount: number;
}

export interface IncidentTimelineEventDto {
  id: number;
  eventType: number;
  eventTypeName: string;
  actorId?: string;
  actorName?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  metadataJson?: string;
  occurredAt: string;
}

export interface IncidentEvidenceLinkDto {
  id: number;
  proctorEvidenceId?: number;
  proctorEventId?: number;
  evidenceType: string;
  evidenceDescription?: string;
  previewUrl?: string;
  noteEn?: string;
  noteAr?: string;
  order: number;
  linkedBy?: string;
  linkedAt?: string;
}

export interface IncidentDecisionDto {
  id: number;
  outcome: number;
  outcomeName: string;
  reasonEn?: string;
  reasonAr?: string;
  decidedBy: string;
  deciderName?: string;
  decidedAt: string;
  riskScoreAtDecision?: number;
}

export interface IncidentCommentDto {
  id: number;
  authorId: string;
  authorName?: string;
  body: string;
  isEdited: boolean;
  createdAt: string;
  editedAt?: string;
}

export interface IncidentDashboardDto {
  examId: number;
  examTitleEn: string;
  totalCases: number;
  openCases: number;
  inReviewCases: number;
  resolvedCases: number;
  closedCases: number;
  unassignedCases: number;
  criticalSeverityCases: number;
  highSeverityCases: number;
  clearedCount: number;
  suspiciousCount: number;
  invalidatedCount: number;
  escalatedCount: number;
}

/** Create an incident case manually (POST /Incident/case) */
export async function createIncidentCase(dto: {
  attemptId: number;
  proctorSessionId?: number;
  source?: number; // 1=Proctor, 2=System, 3=Manual
  severity: number; // 1=Low, 2=Medium, 3=High, 4=Critical
  titleEn: string;
  titleAr?: string;
  summaryEn?: string;
  summaryAr?: string;
}): Promise<{ id: number; caseNumber: string }> {
  const res = await apiClient.post<{ id: number; caseNumber: string }>(
    "/Incident/case",
    {
      ...dto,
      source: dto.source ?? 3, // Manual by default
      titleAr: dto.titleAr ?? dto.titleEn,
    },
  );
  return res;
}

/** Create case from proctor session (POST /Incident/case/from-proctor/{id}) */
export async function createIncidentFromProctor(
  proctorSessionId: number,
): Promise<{ id: number; caseNumber: string }> {
  return await apiClient.post<{ id: number; caseNumber: string }>(
    `/Incident/case/from-proctor/${proctorSessionId}`,
    {},
  );
}

/** Get incident case detail (GET /Incident/case/{id}) */
export async function getIncidentCase(
  caseId: number,
): Promise<IncidentCaseDetailDto | null> {
  try {
    const res = await apiClient.get<IncidentCaseDetailDto>(
      `/Incident/case/${caseId}`,
    );
    return res ?? null;
  } catch (err) {
    console.warn("[Incident] getIncidentCase failed:", err);
    return null;
  }
}

/** Get case by attempt (GET /Incident/case/by-attempt/{attemptId}) */
export async function getIncidentByAttempt(
  attemptId: number,
): Promise<IncidentCaseDetailDto | null> {
  try {
    const res = await apiClient.get<IncidentCaseDetailDto>(
      `/Incident/case/by-attempt/${attemptId}`,
    );
    return res ?? null;
  } catch (err) {
    return null;
  }
}

/** Get timeline (GET /Incident/case/{id}/timeline) */
export async function getIncidentTimeline(
  caseId: number,
): Promise<IncidentTimelineEventDto[]> {
  try {
    const res = await apiClient.get<IncidentTimelineEventDto[]>(
      `/Incident/case/${caseId}/timeline`,
    );
    return Array.isArray(res) ? res : ((res as any)?.data ?? []);
  } catch {
    return [];
  }
}

/** Get evidence (GET /Incident/case/{id}/evidence) */
export async function getIncidentEvidence(
  caseId: number,
): Promise<IncidentEvidenceLinkDto[]> {
  try {
    const res = await apiClient.get<IncidentEvidenceLinkDto[]>(
      `/Incident/case/${caseId}/evidence`,
    );
    return Array.isArray(res) ? res : ((res as any)?.data ?? []);
  } catch {
    return [];
  }
}

/** Link evidence to a case (POST /Incident/evidence/link) */
export async function linkIncidentEvidence(dto: {
  caseId: number;
  proctorEvidenceId?: number;
  proctorEventId?: number;
  noteEn?: string;
  noteAr?: string;
}): Promise<void> {
  await apiClient.post("/Incident/evidence/link", dto);
}

/** Record a decision (POST /Incident/decision) */
export async function recordIncidentDecision(dto: {
  caseId: number;
  outcome: number; // 1=Cleared, 2=Suspicious, 3=Invalidated, 4=Escalated
  reasonEn?: string;
  reasonAr?: string;
  internalNotes?: string;
  closeCase?: boolean;
}): Promise<void> {
  await apiClient.post("/Incident/decision", dto);
}

/** Get decision history (GET /Incident/case/{id}/decisions) */
export async function getIncidentDecisions(
  caseId: number,
): Promise<IncidentDecisionDto[]> {
  try {
    const res = await apiClient.get<IncidentDecisionDto[]>(
      `/Incident/case/${caseId}/decisions`,
    );
    return Array.isArray(res) ? res : ((res as any)?.data ?? []);
  } catch {
    return [];
  }
}

/** Add comment (POST /Incident/comment) */
export async function addIncidentComment(dto: {
  caseId: number;
  body: string;
  isVisibleToCandidate?: boolean;
}): Promise<void> {
  await apiClient.post("/Incident/comment", {
    ...dto,
    isVisibleToCandidate: false, // never visible to candidate
  });
}

/** Get comments (GET /Incident/case/{id}/comments) */
export async function getIncidentComments(
  caseId: number,
): Promise<IncidentCommentDto[]> {
  try {
    const res = await apiClient.get<IncidentCommentDto[]>(
      `/Incident/case/${caseId}/comments`,
    );
    return Array.isArray(res) ? res : ((res as any)?.data ?? []);
  } catch {
    return [];
  }
}

/** Close case (POST /Incident/case/{id}/close) */
export async function closeIncidentCase(caseId: number): Promise<void> {
  await apiClient.post(`/Incident/case/${caseId}/close`, {});
}

/** Reopen case (POST /Incident/case/{id}/reopen) */
export async function reopenIncidentCase(
  caseId: number,
  reason: string,
): Promise<void> {
  await apiClient.post(
    `/Incident/case/${caseId}/reopen?reason=${encodeURIComponent(reason)}`,
    {},
  );
}

/** Assign case (POST /Incident/case/assign) */
export async function assignIncidentCase(
  caseId: number,
  assigneeId: string,
): Promise<void> {
  await apiClient.post("/Incident/case/assign", { caseId, assigneeId });
}

/** Change status (POST /Incident/case/status) */
export async function changeIncidentStatus(
  caseId: number,
  newStatus: number,
  reason?: string,
): Promise<void> {
  await apiClient.post("/Incident/case/status", { caseId, newStatus, reason });
}

/** Get dashboard (GET /Incident/dashboard or /Incident/dashboard/exam/{id}) */
export async function getIncidentDashboard(
  examId?: number,
): Promise<IncidentDashboardDto | null> {
  try {
    const url = examId
      ? `/Incident/dashboard/exam/${examId}`
      : "/Incident/dashboard";
    return await apiClient.get<IncidentDashboardDto>(url);
  } catch {
    return null;
  }
}

// Incident status/severity/outcome label helpers
export const INCIDENT_STATUS_LABELS: Record<number, string> = {
  1: "Open",
  2: "In Review",
  3: "Resolved",
  4: "Closed",
  5: "Escalated",
};

export const INCIDENT_SEVERITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

export const INCIDENT_OUTCOME_LABELS: Record<number, string> = {
  1: "Cleared",
  2: "Suspicious",
  3: "Invalidated",
  4: "Escalated",
};

export const INCIDENT_SOURCE_LABELS: Record<number, string> = {
  1: "Proctor",
  2: "System",
  3: "Manual",
};

// ============ ATTEMPT EVENTS (VIOLATIONS LOG) ============

export interface AttemptEventDto {
  id: number;
  attemptId: number;
  eventType: number;
  eventTypeName?: string;
  metadataJson?: string;
  occurredAt: string;
}

const EVENT_TYPE_NAMES: Record<number, { en: string; ar: string }> = {
  1: { en: "Started", ar: "بدأ" },
  2: { en: "Answer Saved", ar: "تم حفظ الإجابة" },
  3: { en: "Navigated", ar: "انتقل" },
  4: { en: "Tab Switched", ar: "تبديل علامة التبويب" },
  5: { en: "Fullscreen Exited", ar: "خروج من ملء الشاشة" },
  6: { en: "Submitted", ar: "تم التقديم" },
  7: { en: "Timed Out", ar: "انتهى الوقت" },
  8: { en: "Window Blur", ar: "فقدان تركيز النافذة" },
  9: { en: "Window Focus", ar: "تركيز النافذة" },
  10: { en: "Copy Attempt", ar: "محاولة نسخ" },
  11: { en: "Paste Attempt", ar: "محاولة لصق" },
  12: { en: "Right Click Attempt", ar: "محاولة نقر يمين" },
  13: { en: "Force Ended", ar: "إنهاء إجباري" },
  14: { en: "Admin Resumed", ar: "استئناف من المسؤول" },
  15: { en: "Time Added", ar: "إضافة وقت" },
  16: { en: "Webcam Denied", ar: "رفض الكاميرا" },
  17: { en: "Snapshot Failed", ar: "فشل اللقطة" },
  18: { en: "Face Not Detected", ar: "لم يتم اكتشاف الوجه" },
  19: { en: "Multiple Faces", ar: "وجوه متعددة" },
  20: { en: "Face Out of Frame", ar: "الوجه خارج الإطار" },
  21: { en: "Camera Blocked", ar: "الكاميرا محجوبة" },
  22: { en: "Head Turned Away", ar: "تحويل الرأس بعيداً" },
  // Screen monitoring events
  57: { en: "Screen Share Started", ar: "بدء مشاركة الشاشة" },
  58: { en: "Screen Share Ended", ar: "انتهاء مشاركة الشاشة" },
  70: { en: "Screen Share Requested", ar: "طلب مشاركة الشاشة" },
  71: { en: "Screen Share Denied", ar: "رفض مشاركة الشاشة" },
  72: { en: "Screen Share Lost", ar: "فقدان مشاركة الشاشة" },
  73: { en: "Screen Share Resumed", ar: "استئناف مشاركة الشاشة" },
  74: { en: "Screen Share Revoked", ar: "سحب إذن مشاركة الشاشة" },
  75: { en: "Screen Share Track Ended", ar: "إيقاف مسار مشاركة الشاشة" },
};

const VIOLATION_TYPES = new Set([
  4,
  5,
  8,
  10,
  11,
  12,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  71,
  72,
  74,
  75, // Screen share violations
]);

export function getEventTypeName(eventType: number, locale?: string): string {
  const entry = EVENT_TYPE_NAMES[eventType];
  if (!entry)
    return locale === "ar" ? `حدث ${eventType}` : `Event ${eventType}`;
  return locale === "ar" ? entry.ar : entry.en;
}

export function isViolationEvent(eventType: number): boolean {
  return VIOLATION_TYPES.has(eventType);
}

const SEVERITY_LABELS: Record<string, { en: string; ar: string }> = {
  Critical: { en: "Critical", ar: "حرج" },
  High: { en: "High", ar: "مرتفع" },
  Medium: { en: "Medium", ar: "متوسط" },
  Low: { en: "Low", ar: "منخفض" },
  Info: { en: "Info", ar: "معلومات" },
};

export function getEventSeverity(eventType: number, locale?: string): string {
  let key: string;
  switch (eventType) {
    case 16:
    case 19:
      key = "Critical";
      break;
    case 4:
    case 5:
    case 18:
    case 21:
    case 71: // Screen Share Denied
    case 74: // Screen Share Revoked
      key = "High";
      break;
    case 8:
    case 10:
    case 11:
    case 17:
    case 20:
    case 22:
    case 72: // Screen Share Lost
    case 75: // Screen Share Track Ended
      key = "Medium";
      break;
    case 12:
      key = "Low";
      break;
    default:
      key = "Info";
  }
  if (!locale) return key;
  return SEVERITY_LABELS[key]?.[locale === "ar" ? "ar" : "en"] ?? key;
}

/** Translate violation type names from AI report (e.g. "FaceNotDetected" → Arabic) */
const VIOLATION_TYPE_NAMES: Record<string, { en: string; ar: string }> = {
  FaceNotDetected: { en: "Face Not Detected", ar: "لم يتم اكتشاف الوجه" },
  TabSwitched: { en: "Tab Switched", ar: "تبديل علامة التبويب" },
  FullscreenExited: { en: "Fullscreen Exited", ar: "خروج من ملء الشاشة" },
  MultipleFaces: { en: "Multiple Faces", ar: "وجوه متعددة" },
  WindowBlur: { en: "Window Blur", ar: "فقدان تركيز النافذة" },
  CopyAttempt: { en: "Copy Attempt", ar: "محاولة نسخ" },
  PasteAttempt: { en: "Paste Attempt", ar: "محاولة لصق" },
  RightClickAttempt: { en: "Right Click Attempt", ar: "محاولة نقر يمين" },
  WebcamDenied: { en: "Webcam Denied", ar: "رفض الكاميرا" },
  SnapshotFailed: { en: "Snapshot Failed", ar: "فشل اللقطة" },
  FaceOutOfFrame: { en: "Face Out of Frame", ar: "الوجه خارج الإطار" },
  CameraBlocked: { en: "Camera Blocked", ar: "الكاميرا محجوبة" },
  HeadTurnedAway: { en: "Head Turned Away", ar: "تحويل الرأس بعيداً" },
  ScreenShareDenied: { en: "Screen Share Denied", ar: "رفض مشاركة الشاشة" },
  ScreenShareLost: { en: "Screen Share Lost", ar: "فقدان مشاركة الشاشة" },
  ScreenShareRevoked: {
    en: "Screen Share Revoked",
    ar: "سحب إذن مشاركة الشاشة",
  },
  ScreenShareTrackEnded: {
    en: "Screen Share Track Ended",
    ar: "إيقاف مسار مشاركة الشاشة",
  },
};

export function translateViolationType(type: string, locale?: string): string {
  const entry = VIOLATION_TYPE_NAMES[type];
  if (entry) return locale === "ar" ? entry.ar : entry.en;
  return type;
}

export function translateSeverity(severity: string, locale?: string): string {
  if (!locale) return severity;
  return SEVERITY_LABELS[severity]?.[locale === "ar" ? "ar" : "en"] ?? severity;
}

/**
 * Fetch all attempt events (admin/proctor).
 * GET /Attempt/{attemptId}/events
 */
export async function getAttemptEvents(
  attemptId: number,
): Promise<AttemptEventDto[]> {
  try {
    const res = await apiClient.get<{ data: AttemptEventDto[] }>(
      `/Attempt/${attemptId}/events`,
    );
    const events = (res as any)?.data ?? res ?? [];
    return (Array.isArray(events) ? events : []).map((e: any) => ({
      ...e,
      eventTypeName: getEventTypeName(e.eventType),
    }));
  } catch {
    return [];
  }
}
