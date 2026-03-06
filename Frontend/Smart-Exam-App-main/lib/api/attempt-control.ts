import { apiClient } from "@/lib/api-client";

// ── Types ──────────────────────────────────────────────────────

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

export async function addTimeToAttempt(
  data: AddTimePayload,
): Promise<AddTimeResultDto> {
  return apiClient.post<AddTimeResultDto>("/attempt-control/add-time", data);
}
