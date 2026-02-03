import { apiClient } from "@/lib/api-client"

export interface CandidateExamSummaryItem {
  candidateId: string
  candidateName: string
  candidateEmail?: string
  totalAttempts: number
  bestScore?: number
  bestPercentage?: number
  bestIsPassed?: boolean
  lastAttemptAt?: string
  /** When loading "all candidates", each row has exam info */
  examId?: number
  examTitleEn?: string
  examTitleAr?: string
}

export interface PaginatedCandidates {
  items: CandidateExamSummaryItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
}

/**
 * Get candidate summaries for an exam or all exams.
 * Pass examId to filter by exam; omit (or pass undefined) to load all candidates across exams.
 */
export async function getCandidateSummaries(
  examId: number | undefined,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<PaginatedCandidates> {
  const query = new URLSearchParams()
  query.set("pageNumber", String(params?.pageNumber ?? 1))
  query.set("pageSize", String(params?.pageSize ?? 100))
  if (examId != null && examId > 0) query.set("examId", String(examId))
  const raw = await apiClient.get<unknown>(`/ExamResult/summary/candidates?${query}`)
  const inner = raw && typeof raw === "object"
    ? ((raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).Data ?? raw) as Record<string, unknown>
    : {}
  const items = (inner?.items ?? inner?.Items ?? []) as CandidateExamSummaryItem[]
  const list = Array.isArray(items) ? items : []
  return {
    items: list,
    pageNumber: (inner?.pageNumber ?? inner?.PageNumber ?? params?.pageNumber ?? 1) as number,
    pageSize: (inner?.pageSize ?? inner?.PageSize ?? params?.pageSize ?? 100) as number,
    totalCount: (inner?.totalCount ?? inner?.TotalCount ?? list.length) as number,
  }
}

/** Get candidate summaries for a single exam (uses path endpoint). */
export async function getExamCandidateSummaries(
  examId: number,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<PaginatedCandidates> {
  return getCandidateSummaries(examId, params)
}
