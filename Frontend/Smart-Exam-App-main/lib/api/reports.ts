import { apiClient } from "@/lib/api-client"

export interface ResultDashboard {
  examId: number
  examTitleEn: string
  totalCandidates: number
  totalAttempts: number
  gradedCount: number
  pendingGradingCount: number
  publishedCount: number
  unpublishedCount: number
  passedCount: number
  failedCount: number
  passRate: number
  averageScore: number
  highestScore: number
  lowestScore: number
  scoreDistribution: { range: string; count: number }[]
}

export interface ResultListItem {
  id: number
  examId: number
  examTitleEn: string
  attemptId: number
  attemptNumber: number
  candidateId: string
  candidateName: string
  totalScore: number
  maxPossibleScore: number
  percentage: number
  isPassed: boolean
  gradeLabel: string | null
  isPublishedToCandidate: boolean
  finalizedAt: string
}

export interface ExamListItem {
  id: number
  titleEn: string
  titleAr: string
}

export async function getResultDashboard(examId: number): Promise<ResultDashboard | null> {
  try {
    const data = await apiClient.get<ResultDashboard>(`/ExamResult/dashboard/exam/${examId}`)
    return data
  } catch {
    return null
  }
}

export async function getExamResults(
  examId: number,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<{ items: ResultListItem[]; totalCount: number }> {
  try {
    const query = new URLSearchParams()
    query.set("PageNumber", String(params?.pageNumber ?? 1))
    query.set("PageSize", String(params?.pageSize ?? 50))
    const data = await apiClient.get<{ items: ResultListItem[]; totalCount: number }>(
      `/ExamResult/exam/${examId}?${query}`
    )
    return { items: data?.items ?? [], totalCount: data?.totalCount ?? 0 }
  } catch {
    return { items: [], totalCount: 0 }
  }
}

export async function getExamsForReports(): Promise<ExamListItem[]> {
  try {
    const data = await apiClient.get<{ items?: ExamListItem[] }>("/Assessment/exams?PageSize=100")
    return data?.items ?? []
  } catch {
    return []
  }
}
