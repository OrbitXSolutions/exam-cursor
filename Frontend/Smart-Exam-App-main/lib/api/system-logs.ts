import { apiClient } from "@/lib/api-client"

// ── Types ─────────────────────────────────────────────────────

export interface SystemLogDto {
  id: number
  timestamp: string
  level: string
  category: string
  userId: string | null
  userDisplayName: string | null
  userRole: string | null
  action: string
  controller: string | null
  endpoint: string | null
  httpMethod: string | null
  responseStatusCode: number | null
  errorMessage: string | null
  traceId: string | null
  ipAddress: string | null
  durationMs: number | null
}

export interface SystemLogDetailDto extends SystemLogDto {
  requestBody: string | null
  responseBody: string | null
  stackTrace: string | null
  exceptionType: string | null
  userAgent: string | null
}

export interface SystemLogFilter {
  level?: number
  search?: string
  action?: string
  endpoint?: string
  statusCode?: number
  userId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}

export interface SystemLogPagedResult {
  items: SystemLogDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface SystemLogStatsDto {
  candidateCount: number
  proctorCount: number
  userCount: number
  developerCount: number
  errorCount: number
  warningCount: number
  todayCount: number
}

// ── API Functions ─────────────────────────────────────────────

function buildQuery(filter?: SystemLogFilter): string {
  const query = new URLSearchParams()
  query.set("PageNumber", String(filter?.page ?? 1))
  query.set("PageSize", String(filter?.pageSize ?? 50))
  if (filter?.level != null) query.set("Level", String(filter.level))
  if (filter?.search) query.set("Search", filter.search)
  if (filter?.action) query.set("Action", filter.action)
  if (filter?.endpoint) query.set("Endpoint", filter.endpoint)
  if (filter?.statusCode != null) query.set("StatusCode", String(filter.statusCode))
  if (filter?.userId) query.set("UserId", filter.userId)
  if (filter?.dateFrom) query.set("DateFrom", filter.dateFrom)
  if (filter?.dateTo) query.set("DateTo", filter.dateTo)
  return query.toString()
}

export async function getCandidateLogs(filter?: SystemLogFilter): Promise<SystemLogPagedResult> {
  return apiClient.get<SystemLogPagedResult>(`/SystemLogs/candidate?${buildQuery(filter)}`)
}

export async function getProctorLogs(filter?: SystemLogFilter): Promise<SystemLogPagedResult> {
  return apiClient.get<SystemLogPagedResult>(`/SystemLogs/proctor?${buildQuery(filter)}`)
}

export async function getUserLogs(filter?: SystemLogFilter): Promise<SystemLogPagedResult> {
  return apiClient.get<SystemLogPagedResult>(`/SystemLogs/user?${buildQuery(filter)}`)
}

export async function getDeveloperLogs(filter?: SystemLogFilter): Promise<SystemLogPagedResult> {
  return apiClient.get<SystemLogPagedResult>(`/SystemLogs/developer?${buildQuery(filter)}`)
}

export async function getLogDetail(id: number): Promise<SystemLogDetailDto> {
  return apiClient.get<SystemLogDetailDto>(`/SystemLogs/${id}`)
}

export async function getLogStats(): Promise<SystemLogStatsDto> {
  return apiClient.get<SystemLogStatsDto>("/SystemLogs/stats")
}
