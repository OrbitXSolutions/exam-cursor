import { apiClient } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserNotificationDto {
  id: number;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  type: number;
  typeName: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  relatedExamId: number | null;
  relatedAttemptId: number | null;
}

export interface UserNotificationPagedResult {
  items: UserNotificationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface UnreadCountDto {
  count: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getUserNotifications(
  page = 1,
  pageSize = 20,
  isRead?: boolean,
): Promise<UserNotificationPagedResult> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (isRead !== undefined) params.set("isRead", String(isRead));
  return apiClient.get<UserNotificationPagedResult>(`/user-notifications?${params}`);
}

export async function getUnreadCount(): Promise<UnreadCountDto> {
  return apiClient.get<UnreadCountDto>("/user-notifications/unread-count");
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await apiClient.patch(`/user-notifications/${id}/read`, {});
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch("/user-notifications/read-all", {});
}
