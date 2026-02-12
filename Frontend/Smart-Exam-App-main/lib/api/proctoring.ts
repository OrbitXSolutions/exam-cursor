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
  isSample?: boolean;
  latestSnapshotUrl?: string;
  snapshotCount?: number;
  lastSnapshotAt?: string;
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
    flagged: dto.requiresReview ?? false,
    lastActivity: dto.startedAt,
    isSample: dto.isSample ?? false,
    latestSnapshotUrl: dto.latestSnapshotUrl ?? undefined,
    snapshotCount: dto.snapshotCount ?? 0,
    lastSnapshotAt: dto.lastSnapshotAt ?? undefined,
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
export async function getLiveSessions(): Promise<LiveSession[]> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", "1");
    query.set("PageSize", "100");
    query.set("IncludeSamples", "true");
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
  totalViolations: number;
  riskScore?: number;
  lastHeartbeatAt?: string;
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
  const sessionRes = await apiClient.get<{
    success?: boolean;
    data?: ProctorSessionDetailDto;
    Data?: ProctorSessionDetailDto;
  }>(`/Proctor/session/${sessionId}`);
  const data =
    (
      sessionRes as {
        success?: boolean;
        data?: ProctorSessionDetailDto;
        Data?: ProctorSessionDetailDto;
      }
    ).data ?? (sessionRes as { Data?: ProctorSessionDetailDto }).Data;
  if (!data) {
    throw new Error("Session not found");
  }
  const session: LiveSession = {
    id: String(data.id),
    candidateId: data.candidateId ?? "",
    candidateName: data.candidateName ?? "",
    examTitle: data.examTitleEn ?? "",
    startedAt: data.startedAt,
    timeRemaining: 0,
    status:
      data.statusName === "Active"
        ? "Active"
        : data.statusName === "Cancelled" || data.statusName === "Terminated"
          ? "Terminated"
          : "Completed",
    incidentCount: data.totalViolations ?? 0,
    flagged: false,
    lastActivity: data.lastHeartbeatAt ?? data.startedAt,
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
 * Flag/unflag session (no backend endpoint - no-op for now)
 */
export async function flagSession(
  sessionId: string,
  _flagged: boolean,
): Promise<void> {
  await Promise.resolve();
  console.warn("[Proctor] flagSession not implemented for session", sessionId);
}

/**
 * Send warning to candidate (no backend endpoint - no-op for now)
 */
export async function sendWarning(
  sessionId: string,
  _message: string,
): Promise<void> {
  await Promise.resolve();
  console.warn("[Proctor] sendWarning not implemented for session", sessionId);
}

/**
 * Terminate session - POST /Proctor/session/{sessionId}/cancel
 */
export async function terminateSession(
  sessionId: string,
  _reason: string,
): Promise<void> {
  await apiClient.post(`/Proctor/session/${sessionId}/cancel`, {});
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
