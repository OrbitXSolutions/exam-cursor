import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────
export interface AssignmentCandidateDto {
  id: string;
  rollNo: string | null;
  fullName: string | null;
  fullNameAr: string | null;
  email: string;
  mobile: string | null;
  isActive: boolean;
  isBlocked: boolean;
  examAssigned: boolean;
  examStarted: boolean;
}

export interface AssignExamPayload {
  examId: number;
  scheduleFrom: string;
  scheduleTo: string;
  candidateIds?: string[];
  batchId?: number;
  applyToAllMatchingFilters?: boolean;
  search?: string;
  filterStatus?: string;
}

export interface UnassignExamPayload {
  examId: number;
  candidateIds: string[];
}

export interface AssignmentResultDto {
  totalTargeted: number;
  successCount: number;
  skippedCount: number;
  skippedDetails: { candidateId: string; candidateName: string | null; reason: string }[];
}

// ── API calls ──────────────────────────────────────────────────

export async function getAssignmentCandidates(params: {
  examId: number;
  scheduleFrom: string;
  scheduleTo: string;
  batchId?: number;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: AssignmentCandidateDto[];
  totalCount: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  query.set("ExamId", String(params.examId));
  query.set("ScheduleFrom", params.scheduleFrom);
  query.set("ScheduleTo", params.scheduleTo);
  query.set("PageNumber", String(params.page ?? 1));
  query.set("PageSize", String(params.pageSize ?? 20));
  if (params.batchId) query.set("BatchId", String(params.batchId));
  if (params.search) query.set("Search", params.search);
  if (params.status && params.status !== "all") query.set("Status", params.status);

  const raw = await apiClient.get<{
    items: AssignmentCandidateDto[];
    totalCount: number;
    totalPages: number;
  }>(`/Assignments/candidates?${query}`);
  return {
    items: raw?.items ?? [],
    totalCount: raw?.totalCount ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}

export async function assignExam(
  data: AssignExamPayload,
): Promise<AssignmentResultDto> {
  return apiClient.post<AssignmentResultDto>("/Assignments/assign", data);
}

export async function unassignExam(
  data: UnassignExamPayload,
): Promise<AssignmentResultDto> {
  return apiClient.post<AssignmentResultDto>("/Assignments/unassign", data);
}
