import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────
export interface BatchDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  candidateCount: number;
  createdDate: string;
  createdBy: string | null;
  createdByName: string | null;
}

export interface BatchDetailDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  candidateCount: number;
  createdDate: string;
  createdBy: string | null;
  createdByName: string | null;
  candidates: BatchCandidateDto[];
}

export interface BatchCandidateDto {
  id: string;
  fullName: string | null;
  fullNameAr: string | null;
  email: string;
  rollNo: string | null;
  mobile: string | null;
  isBlocked: boolean;
  addedAt: string;
  addedBy: string | null;
  addedByName: string | null;
}

export interface CreateBatchPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateBatchPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface BatchCandidateChangeResult {
  totalRequested: number;
  affectedCount: number;
  skippedCount: number;
  errors: string[];
}

// ── API calls ──────────────────────────────────────────────────

export async function getBatches(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<{ items: BatchDto[]; totalCount: number; totalPages: number }> {
  const query = new URLSearchParams();
  query.set("PageNumber", String(params?.page ?? 1));
  query.set("PageSize", String(params?.pageSize ?? 20));
  if (params?.search) query.set("Search", params.search);
  if (params?.status && params.status !== "all")
    query.set("Status", params.status);
  if (params?.sortBy) query.set("SortBy", params.sortBy);
  if (params?.sortDir) query.set("SortDir", params.sortDir);

  const raw = await apiClient.get<{
    items: BatchDto[];
    totalCount: number;
    totalPages: number;
  }>(`/Batches?${query}`);
  return {
    items: raw?.items ?? [],
    totalCount: raw?.totalCount ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}

export async function getBatchById(id: number): Promise<BatchDetailDto> {
  return apiClient.get<BatchDetailDto>(`/Batches/${id}`);
}

export async function createBatch(
  data: CreateBatchPayload,
): Promise<BatchDto> {
  return apiClient.post<BatchDto>("/Batches", data);
}

export async function updateBatch(
  id: number,
  data: UpdateBatchPayload,
): Promise<BatchDto> {
  return apiClient.put<BatchDto>(`/Batches/${id}`, data);
}

export async function deleteBatch(id: number): Promise<boolean> {
  return apiClient.delete<boolean>(`/Batches/${id}`);
}

export async function toggleBatchStatus(id: number): Promise<boolean> {
  return apiClient.post<boolean>(`/Batches/${id}/toggle-status`);
}

export async function addCandidatesToBatch(
  batchId: number,
  candidateIds: string[],
): Promise<BatchCandidateChangeResult> {
  return apiClient.post<BatchCandidateChangeResult>(
    `/Batches/${batchId}/candidates`,
    { candidateIds },
  );
}

export async function removeCandidatesFromBatch(
  batchId: number,
  candidateIds: string[],
): Promise<BatchCandidateChangeResult> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`/api/proxy/Batches/${batchId}/candidates`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ candidateIds }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Remove failed");
  }
  return json.data ?? json;
}

export async function exportBatchCandidates(batchId: number): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`/api/proxy/Batches/${batchId}/export`, {
    method: "GET",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch_${batchId}_candidates_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
