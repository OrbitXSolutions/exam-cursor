import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────
export interface CandidateDto {
  id: string;
  fullName: string | null;
  fullNameAr: string | null;
  email: string;
  rollNo: string | null;
  mobile: string | null;
  status: string;
  isBlocked: boolean;
  createdDate: string;
  createdBy: string | null;
  createdByName: string | null;
}

export interface CreateCandidatePayload {
  fullName: string;
  fullNameAr?: string;
  email: string;
  password?: string;
  rollNo: string;
  mobile?: string;
}

export interface UpdateCandidatePayload {
  fullName?: string;
  fullNameAr?: string;
  email?: string;
  password?: string;
  rollNo?: string;
  mobile?: string;
}

export interface CandidateImportResult {
  totalRows: number;
  insertedCount: number;
  skippedCount: number;
  errors: { row: number; email: string; reasons: string[] }[];
  createdAccounts: {
    row: number;
    fullName: string;
    email: string;
    rollNo: string;
    temporaryPassword: string;
  }[];
}

// ── API calls ──────────────────────────────────────────────────

export async function getCandidates(params?: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}): Promise<{ items: CandidateDto[]; totalCount: number; totalPages: number }> {
  const query = new URLSearchParams();
  query.set("PageNumber", String(params?.page ?? 1));
  query.set("PageSize", String(params?.pageSize ?? 20));
  if (params?.search) query.set("Search", params.search);
  if (params?.status && params.status !== "all")
    query.set("Status", params.status);
  if (params?.sortBy) query.set("SortBy", params.sortBy);
  if (params?.sortDir) query.set("SortDir", params.sortDir);

  const raw = await apiClient.get<{
    items: CandidateDto[];
    totalCount: number;
    totalPages: number;
  }>(`/Candidates?${query}`);
  return {
    items: raw?.items ?? [],
    totalCount: raw?.totalCount ?? 0,
    totalPages: raw?.totalPages ?? 0,
  };
}

export async function getCandidateById(id: string): Promise<CandidateDto> {
  return apiClient.get<CandidateDto>(`/Candidates/${id}`);
}

export async function createCandidate(
  data: CreateCandidatePayload,
): Promise<CandidateDto> {
  return apiClient.post<CandidateDto>("/Candidates", data);
}

export async function updateCandidate(
  id: string,
  data: UpdateCandidatePayload,
): Promise<CandidateDto> {
  return apiClient.put<CandidateDto>(`/Candidates/${id}`, data);
}

export async function blockCandidate(id: string): Promise<boolean> {
  return apiClient.post<boolean>(`/Candidates/${id}/block`);
}

export async function unblockCandidate(id: string): Promise<boolean> {
  return apiClient.post<boolean>(`/Candidates/${id}/unblock`);
}

export async function deleteCandidate(id: string): Promise<boolean> {
  return apiClient.delete<boolean>(`/Candidates/${id}`);
}

export async function importCandidates(
  file: File,
): Promise<CandidateImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch("/api/proxy/Candidates/import", {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Import failed");
  }
  return json.data ?? json;
}

export async function exportCandidates(params?: {
  search?: string;
  status?: string;
}): Promise<void> {
  const query = new URLSearchParams();
  query.set("PageNumber", "1");
  query.set("PageSize", "100000");
  if (params?.search) query.set("Search", params.search);
  if (params?.status && params.status !== "all")
    query.set("Status", params.status);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`/api/proxy/Candidates/export?${query}`, {
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
  a.download = `candidates_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadImportTemplate(): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch("/api/proxy/Candidates/import-template", {
    method: "GET",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!res.ok) throw new Error("Failed to download template");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "candidates_import_template.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
