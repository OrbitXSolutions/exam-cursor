import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────

export interface AttemptControlItemDto {
  attemptId: number;
  candidateId: string;
  rollNo: string | null;
  fullName: string | null;
  fullNameAr: string | null;
  examId: number;
  examTitleEn: string | null;
  examTitleAr: string | null;
  startedAt: string;
  remainingSeconds: number;
  status: string;
  lastActivityAt: string | null;
  extraTimeSeconds: number;
  resumeCount: number;
  ipAddress: string | null;
  deviceInfo: string | null;
  canForceEnd: boolean;
  canResume: boolean;
  canAddTime: boolean;
}

export interface ForceEndPayload {
  attemptId: number;
  reason?: string;
}

export interface ForceEndResultDto {
  attemptId: number;
  status: string;
  timestamp: string;
}

export interface ResumePayload {
  attemptId: number;
}

export interface ResumeResultDto {
  attemptId: number;
  status: string;
  remainingSeconds: number;
  resumeCount: number;
}

export interface AddTimePayload {
  attemptId: number;
  extraMinutes: number;
  reason?: string;
}

export interface AddTimeResultDto {
  attemptId: number;
  remainingSeconds: number;
  totalExtraTimeSeconds: number;
}

// ── API calls ──────────────────────────────────────────────────

export async function getAttemptControlList(params: {
  examId?: number;
  batchId?: number;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AttemptControlItemDto[];
  totalCount: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params.examId) query.set("ExamId", String(params.examId));
  if (params.batchId) query.set("BatchId", String(params.batchId));
  if (params.search) query.set("Search", params.search);
  if (params.status && params.status !== "All")
    query.set("Status", params.status);
  query.set("PageNumber", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 20));

  const raw = await apiClient.get<{
    items: AttemptControlItemDto[];
    totalCount: number;
    totalPages: number;
  }>(`/attempt-control?${query}`);

  return {
    items: raw?.items ?? [],
    totalCount: raw?.totalCount ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}

export async function forceEndAttempt(
  data: ForceEndPayload,
): Promise<ForceEndResultDto> {
  return apiClient.post<ForceEndResultDto>("/attempt-control/force-end", data);
}

export async function resumeAttempt(
  data: ResumePayload,
): Promise<ResumeResultDto> {
  return apiClient.post<ResumeResultDto>("/attempt-control/resume", data);
}

export async function addTimeToAttempt(
  data: AddTimePayload,
): Promise<AddTimeResultDto> {
  return apiClient.post<AddTimeResultDto>("/attempt-control/add-time", data);
}
