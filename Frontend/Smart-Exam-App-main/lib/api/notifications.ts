import { apiClient } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────

export interface NotificationSettingsDto {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword?: string | null;
  smtpFromEmail: string;
  smtpFromName: string;
  smtpEnableSsl: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  smsProvider: number; // 1=Twilio, 2=Vonage, 3=Custom
  smsAccountSid: string;
  smsAuthToken?: string | null;
  smsFromNumber: string;
  customSmsApiUrl?: string | null;
  customSmsApiKey?: string | null;
  emailBatchSize: number;
  smsBatchSize: number;
  batchDelayMs: number;
  loginUrl: string;
}

export interface NotificationTemplateDto {
  id: number;
  eventType: number; // 1=ExamPublished, 2=ResultPublished, 3=ExamExpired
  eventName: string;
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
  isActive: boolean;
}

export interface UpdateNotificationTemplateDto {
  subjectEn: string;
  subjectAr: string;
  bodyEn: string;
  bodyAr: string;
  isActive: boolean;
}

export interface NotificationLogDto {
  id: number;
  candidateId: string;
  candidateName: string;
  examId?: number | null;
  examTitle?: string | null;
  eventType: number;
  eventName: string;
  channel: number;
  channelName: string;
  status: number;
  statusName: string;
  recipientEmail: string;
  recipientPhone?: string | null;
  subject?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdDate: string;
  retryCount: number;
}

export interface NotificationLogFilter {
  status?: number;
  channel?: number;
  eventType?: number;
  examId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ── Settings ──────────────────────────────────────────────────

export async function getNotificationSettings(): Promise<NotificationSettingsDto> {
  return apiClient.get<NotificationSettingsDto>("/Notification/settings");
}

export async function updateNotificationSettings(
  data: NotificationSettingsDto,
): Promise<void> {
  await apiClient.put("/Notification/settings", data);
}

// ── Templates ─────────────────────────────────────────────────

export async function getNotificationTemplates(): Promise<
  NotificationTemplateDto[]
> {
  return apiClient.get<NotificationTemplateDto[]>("/Notification/templates");
}

export async function getNotificationTemplate(
  eventType: number,
): Promise<NotificationTemplateDto> {
  return apiClient.get<NotificationTemplateDto>(
    `/Notification/templates/${eventType}`,
  );
}

export async function updateNotificationTemplate(
  eventType: number,
  data: UpdateNotificationTemplateDto,
): Promise<void> {
  await apiClient.put(`/Notification/templates/${eventType}`, data);
}

// ── Logs ──────────────────────────────────────────────────────

export async function getNotificationLogs(
  filter?: NotificationLogFilter,
): Promise<{ items: NotificationLogDto[]; totalCount: number }> {
  try {
    const query = new URLSearchParams();
    query.set("PageNumber", String(filter?.page ?? 1));
    query.set("PageSize", String(filter?.pageSize ?? 50));
    if (filter?.status != null) query.set("Status", String(filter.status));
    if (filter?.channel != null) query.set("Channel", String(filter.channel));
    if (filter?.eventType != null)
      query.set("EventType", String(filter.eventType));
    if (filter?.examId != null) query.set("ExamId", String(filter.examId));
    if (filter?.dateFrom) query.set("DateFrom", filter.dateFrom);
    if (filter?.dateTo) query.set("DateTo", filter.dateTo);
    if (filter?.search) query.set("Search", filter.search);

    const raw = await apiClient.get<{
      items?: NotificationLogDto[];
      totalCount?: number;
    }>(`/Notification/logs?${query}`);

    return {
      items: raw?.items ?? [],
      totalCount: raw?.totalCount ?? 0,
    };
  } catch {
    return { items: [], totalCount: 0 };
  }
}

export async function retryNotification(logId: number): Promise<void> {
  await apiClient.post(`/Notification/logs/${logId}/retry`);
}

// ── Test ──────────────────────────────────────────────────────

export async function sendTestEmail(toEmail: string): Promise<void> {
  await apiClient.post("/Notification/test-email", { toEmail });
}

export async function sendTestSms(toPhone: string): Promise<void> {
  await apiClient.post("/Notification/test-sms", { toPhone });
}
