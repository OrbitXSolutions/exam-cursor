import { apiClient } from "@/lib/api-client"
import { getExams } from "@/lib/api/exams"
import { getManualGradingRequired } from "@/lib/api/grading"
import type { Exam } from "@/lib/types"

export interface DashboardStats {
  totalExams: number
  activeExams: number
  totalAttempts: number
  passRate: number
  pendingGrading: number
  openIncidents: number
  attemptsOverTime: { date: string; count: number }[]
  riskDistribution: { level: string; count: number }[]
}

export interface DashboardIncident {
  id: number
  titleEn?: string
  titleAr?: string
  candidateName?: string
  severityName?: string
}

const defaultAttemptsOverTime = [
  { date: "W1", count: 0 },
  { date: "W2", count: 0 },
  { date: "W3", count: 0 },
  { date: "W4", count: 0 },
  { date: "W5", count: 0 },
  { date: "W6", count: 0 },
  { date: "W7", count: 0 },
]

const defaultRiskDistribution = [
  { level: "Low", count: 0 },
  { level: "Medium", count: 0 },
  { level: "High", count: 0 },
  { level: "Critical", count: 0 },
]

/**
 * Fetch dashboard stats from real APIs: Assessment, Grading, Incident
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  let totalExams = 0
  let totalAttempts = 0
  let passRate = 0
  let pendingGrading = 0
  let openIncidents = 0

  try {
    const [examsRes, gradingRes, incidentRes] = await Promise.all([
      getExams({ pageNumber: 1, pageSize: 1 }).catch(() => ({ totalCount: 0, items: [] })),
      getManualGradingRequired({ pageNumber: 1, pageSize: 1 }).catch(() => ({ items: [], totalCount: 0 })),
      apiClient.get<{ openCount?: number; totalCount?: number; openCases?: unknown[] }>("/Incident/dashboard").catch(() => null),
    ])

    totalExams = examsRes?.totalCount ?? 0
    pendingGrading = gradingRes?.totalCount ?? gradingRes?.items?.length ?? 0
    if (incidentRes && typeof incidentRes === "object") {
      openIncidents = (incidentRes as { openCases?: number }).openCases ?? (incidentRes as { totalCases?: number }).totalCases ?? 0
    }
  } catch {
    // use defaults
  }

  return {
    totalExams,
    activeExams: totalExams,
    totalAttempts,
    passRate,
    pendingGrading,
    openIncidents,
    attemptsOverTime: defaultAttemptsOverTime,
    riskDistribution: defaultRiskDistribution,
  }
}

/**
 * Fetch upcoming exams (published, startAt in future) for dashboard
 */
export async function getUpcomingExams(limit = 5): Promise<Exam[]> {
  try {
    const res = await getExams({ pageNumber: 1, pageSize: 50 })
    const now = new Date()
    const upcoming = (res.items ?? [])
      .filter((e) => e.isPublished && e.startAt && new Date(e.startAt) > now)
      .sort((a, b) => (a.startAt && b.startAt ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime() : 0))
      .slice(0, limit)
    return upcoming
  } catch {
    return []
  }
}

/**
 * Fetch open incidents for dashboard (Admin) - GET /Incident/cases?Status=Open
 */
export async function getDashboardIncidents(limit = 5): Promise<DashboardIncident[]> {
  try {
    const raw = await apiClient.get<{ items?: Array<{ id: number; titleEn?: string; titleAr?: string; candidateName?: string; severityName?: string }> }>(
      `/Incident/cases?Status=Open&PageNumber=1&PageSize=${limit}`
    )
    const list = raw?.items ?? []
    return Array.isArray(list) ? list.slice(0, limit) : []
  } catch {
    return []
  }
}
