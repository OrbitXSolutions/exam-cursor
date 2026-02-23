import { apiClient } from "@/lib/api-client";

// ============================================
// TYPES (matching backend DTOs)
// ============================================

export interface GradingSessionListItem {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  status: number;
  statusName: string;
  totalScore: number | null;
  maxPossibleScore: number;
  isPassed: boolean | null;
  gradedAt: string | null;
  manualGradingRequired: number;
  isResultFinalized: boolean;
}

export interface PaginatedGradingResponse {
  items: GradingSessionListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SelectedOptionItem {
  id: number;
  textEn: string;
  textAr: string;
  isCorrect: boolean;
}

export interface GradedAnswerItem {
  id: number;
  gradingSessionId: number;
  questionId: number;
  questionBodyEn: string;
  questionBodyAr: string;
  questionTypeName: string;
  questionTypeId: number;
  maxPoints: number;
  selectedOptionIds: number[] | null;
  selectedOptions: SelectedOptionItem[] | null;
  textAnswer: string | null;
  score: number;
  isCorrect: boolean;
  isManuallyGraded: boolean;
  graderComment: string | null;
  modelAnswerEn: string | null;
  modelAnswerAr: string | null;
}

export interface GradingSessionDetail {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  gradedBy: string | null;
  graderName: string | null;
  status: number;
  statusName: string;
  totalScore: number | null;
  maxPossibleScore: number;
  passScore: number;
  isPassed: boolean | null;
  gradedAt: string | null;
  totalQuestions: number;
  gradedQuestions: number;
  manualGradingRequired: number;
  answers: GradedAnswerItem[];
}

export interface ManualGradeRequest {
  gradingSessionId: number;
  questionId: number;
  score: number;
  isCorrect: boolean;
  graderComment?: string;
}

// ============================================
// API FUNCTIONS
// ============================================

/** Backend GradingStatus: Pending=1, AutoGraded=2, ManualRequired=3, Completed=4 */
export const GradingStatus = {
  Pending: 1,
  AutoGraded: 2,
  ManualRequired: 3,
  Completed: 4,
} as const;

/**
 * Get all grading sessions (pending and completed). Use for "list all grading" view.
 */
export async function getGradingSessions(params?: {
  status?: number;
  examId?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedGradingResponse> {
  const query = new URLSearchParams();
  if (params?.status != null) query.set("Status", String(params.status));
  if (params?.examId) query.set("ExamId", String(params.examId));
  query.set("PageNumber", String(params?.pageNumber ?? 1));
  query.set("PageSize", String(params?.pageSize ?? 50));

  const url = `/Grading?${query.toString()}`;
  const raw = await apiClient.get<unknown>(url);
  const inner =
    raw && typeof raw === "object"
      ? (((raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).Data ??
          raw) as Record<string, unknown>)
      : {};
  const items = (inner?.items ??
    inner?.Items ??
    []) as GradingSessionListItem[];
  return {
    items: Array.isArray(items) ? items : [],
    pageNumber: (inner?.pageNumber ?? inner?.PageNumber ?? 1) as number,
    pageSize: (inner?.pageSize ?? inner?.PageSize ?? 50) as number,
    totalCount: (inner?.totalCount ?? inner?.TotalCount ?? 0) as number,
    totalPages: (inner?.totalPages ?? inner?.TotalPages ?? 0) as number,
    hasPreviousPage: (inner?.hasPreviousPage ??
      inner?.HasPreviousPage ??
      false) as boolean,
    hasNextPage: (inner?.hasNextPage ?? inner?.HasNextPage ?? false) as boolean,
  };
}

/**
 * Get grading sessions requiring manual grading (pending only)
 */
export async function getManualGradingRequired(params?: {
  examId?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PaginatedGradingResponse> {
  const query = new URLSearchParams();
  if (params?.examId) query.set("ExamId", String(params.examId));
  if (params?.pageNumber) query.set("PageNumber", String(params.pageNumber));
  if (params?.pageSize) query.set("PageSize", String(params.pageSize));
  query.set("RequiresManualGrading", "true");

  const url = `/Grading/manual-required?${query.toString()}`;
  const raw = await apiClient.get<unknown>(url);
  const inner =
    raw && typeof raw === "object"
      ? (((raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).Data ??
          raw) as Record<string, unknown>)
      : {};
  const items = (inner?.items ??
    inner?.Items ??
    []) as GradingSessionListItem[];
  return {
    items: Array.isArray(items) ? items : [],
    pageNumber: (inner?.pageNumber ?? inner?.PageNumber ?? 1) as number,
    pageSize: (inner?.pageSize ?? inner?.PageSize ?? 50) as number,
    totalCount: (inner?.totalCount ?? inner?.TotalCount ?? 0) as number,
    totalPages: (inner?.totalPages ?? inner?.TotalPages ?? 0) as number,
    hasPreviousPage: (inner?.hasPreviousPage ??
      inner?.HasPreviousPage ??
      false) as boolean,
    hasNextPage: (inner?.hasNextPage ?? inner?.HasNextPage ?? false) as boolean,
  };
}

/**
 * Get grading session by attempt ID (for grading detail page)
 */
export async function getGradingSessionByAttempt(
  attemptId: number,
): Promise<GradingSessionDetail | null> {
  try {
    return await apiClient.get<GradingSessionDetail>(
      `/Grading/attempt/${attemptId}`,
    );
  } catch {
    return null;
  }
}

/**
 * Initiate grading for a submitted/expired attempt (creates grading session + auto-grades)
 */
export async function initiateGrading(attemptId: number): Promise<boolean> {
  try {
    await apiClient.post("/Grading/initiate", { attemptId });
    return true;
  } catch (err) {
    console.warn("[initiateGrading] Failed:", err);
    return false;
  }
}

/**
 * Get questions requiring manual grading for a session
 */
export async function getManualGradingQueue(
  gradingSessionId: number,
): Promise<GradedAnswerItem[]> {
  const response = await apiClient.get<GradedAnswerItem[]>(
    `/Grading/${gradingSessionId}/manual-queue`,
  );
  return response || [];
}

/**
 * Submit manual grade for a single question
 */
export async function submitManualGrade(
  grade: ManualGradeRequest,
): Promise<void> {
  await apiClient.post("/Grading/manual-grade", {
    gradingSessionId: grade.gradingSessionId,
    questionId: grade.questionId,
    score: grade.score,
    isCorrect: grade.isCorrect,
    graderComment: grade.graderComment || null,
  });
}

/**
 * Complete grading session (finalize)
 */
export async function completeGrading(gradingSessionId: number): Promise<{
  gradingSessionId: number;
  attemptId: number;
  totalScore: number;
  maxPossibleScore: number;
  passScore: number;
  isPassed: boolean;
  gradedAt: string;
}> {
  const result = await apiClient.post<{
    gradingSessionId: number;
    attemptId: number;
    totalScore: number;
    maxPossibleScore: number;
    passScore: number;
    isPassed: boolean;
    gradedAt: string;
  }>("/Grading/complete", { gradingSessionId });
  if (!result) throw new Error("Failed to complete grading");

  // Backend already finalizes on Complete; this is just a safety fallback
  // Ignore "already exists" errors since that means finalization already happened
  try {
    await apiClient.post(`/ExamResult/finalize/${gradingSessionId}`);
  } catch {
    // Ignore - backend already finalized on complete
  }
  return result;
}

/**
 * Finalize result for a completed grading session so the candidate appears on Candidate Result page.
 * Safe to call multiple times (backend returns "already exists" if result exists).
 */
export async function finalizeResult(
  gradingSessionId: number,
): Promise<boolean> {
  try {
    await apiClient.post(`/ExamResult/finalize/${gradingSessionId}`);
    return true;
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    if (msg.includes("already exists")) return true;
    console.warn("[finalizeResult] Failed:", err);
    return false;
  }
}
