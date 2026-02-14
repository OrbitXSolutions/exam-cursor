import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────

export interface ExamOperationsCandidateDto {
  candidateId: string;
  fullName: string | null;
  fullNameAr: string | null;
  email: string | null;
  rollNo: string | null;
  examId: number;
  examTitleEn: string | null;
  examTitleAr: string | null;
  totalAttempts: number;
  maxAttempts: number;
  latestAttemptStatus: string | null;
  latestAttemptId: number | null;
  latestAttemptStartedAt: string | null;
  hasActiveAttempt: boolean;
  pendingOverrides: number;
  canAllowNewAttempt: boolean;
  canAddTime: boolean;
  canTerminate: boolean;
}

export interface AllowNewAttemptPayload {
  candidateId: string;
  examId: number;
  reason: string;
}

export interface AllowNewAttemptResultDto {
  overrideId: number;
  candidateId: string;
  examId: number;
  message: string;
}

export interface OperationAddTimePayload {
  attemptId: number;
  extraMinutes: number;
  reason: string;
}

export interface OperationAddTimeResultDto {
  attemptId: number;
  remainingSeconds: number;
  totalExtraTimeSeconds: number;
}

export interface TerminateAttemptPayload {
  attemptId: number;
  reason: string;
}

export interface TerminateAttemptResultDto {
  attemptId: number;
  status: string;
  timestamp: string;
}

export interface AdminOperationLogDto {
  id: number;
  actionType: string;
  actorUserId: string;
  actorName: string | null;
  candidateId: string;
  candidateName: string | null;
  examId: number;
  examTitle: string | null;
  oldAttemptId: number | null;
  newAttemptId: number | null;
  reason: string;
  timestamp: string;
  traceId: string | null;
}

// ── API Functions ──────────────────────────────────────

export async function getExamOperationsCandidates(params: {
  examId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: ExamOperationsCandidateDto[];
  totalCount: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params.examId) query.set("ExamId", String(params.examId));
  if (params.search) query.set("Search", params.search);
  query.set("PageNumber", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 20));

  const raw = await apiClient.get<{
    items: ExamOperationsCandidateDto[];
    totalCount: number;
    totalPages: number;
  }>(`/exam-operations/candidates?${query}`);

  return {
    items: raw?.items ?? [],
    totalCount: raw?.totalCount ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}

export async function allowNewAttempt(
  data: AllowNewAttemptPayload,
): Promise<AllowNewAttemptResultDto> {
  return apiClient.post<AllowNewAttemptResultDto>(
    "/exam-operations/allow-new-attempt",
    data,
  );
}

export async function operationAddTime(
  data: OperationAddTimePayload,
): Promise<OperationAddTimeResultDto> {
  return apiClient.post<OperationAddTimeResultDto>(
    "/exam-operations/add-time",
    data,
  );
}

export async function terminateAttempt(
  data: TerminateAttemptPayload,
): Promise<TerminateAttemptResultDto> {
  return apiClient.post<TerminateAttemptResultDto>(
    "/exam-operations/terminate",
    data,
  );
}

export async function getOperationLogs(
  candidateId: string,
  examId: number,
): Promise<AdminOperationLogDto[]> {
  const raw = await apiClient.get<AdminOperationLogDto[]>(
    `/exam-operations/logs?candidateId=${candidateId}&examId=${examId}`,
  );
  return Array.isArray(raw) ? raw : [];
}
