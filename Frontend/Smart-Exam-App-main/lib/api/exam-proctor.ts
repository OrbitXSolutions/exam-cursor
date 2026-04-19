import { apiClient } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────

export interface ExamProctorItemDto {
  id: string;
  displayName: string | null;
  fullName: string | null;
  email: string;
  isAssigned: boolean;
  assignedAt: string | null;
}

export interface ExamProctorPageDto {
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  assignedProctors: ExamProctorItemDto[];
  availableProctors: ExamProctorItemDto[];
}

export interface ProctorAssignmentResultDto {
  totalTargeted: number;
  successCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

// ── API calls ─────────────────────────────────────────────────

export async function getExamProctors(examId: number): Promise<ExamProctorPageDto> {
  const raw = await apiClient.get<{ data: ExamProctorPageDto }>(`/ExamProctor/${examId}`);
  const data = (raw as any)?.data ?? raw;
  return data as ExamProctorPageDto;
}

export async function assignProctors(
  examId: number,
  proctorIds: string[],
): Promise<ProctorAssignmentResultDto> {
  const raw = await apiClient.post<{ data: ProctorAssignmentResultDto }>("/ExamProctor/assign", {
    examId,
    proctorIds,
  });
  const data = (raw as any)?.data ?? raw;
  return data as ProctorAssignmentResultDto;
}

export async function unassignProctors(
  examId: number,
  proctorIds: string[],
): Promise<ProctorAssignmentResultDto> {
  const raw = await apiClient.post<{ data: ProctorAssignmentResultDto }>("/ExamProctor/unassign", {
    examId,
    proctorIds,
  });
  const data = (raw as any)?.data ?? raw;
  return data as ProctorAssignmentResultDto;
}
