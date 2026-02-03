import { apiClient } from "@/lib/api-client";
import { AttemptStatus } from "@/lib/types";

export interface CandidateExamSummaryItem {
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  totalAttempts: number;
  bestScore?: number;
  bestPercentage?: number;
  bestIsPassed?: boolean;
  lastAttemptAt?: string;
  /** When loading "all candidates", each row has exam info */
  examId?: number;
  examTitleEn?: string;
  examTitleAr?: string;
}

export interface PaginatedCandidates {
  items: CandidateExamSummaryItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

/**
 * Get candidate summaries for an exam or all exams.
 * Pass examId to filter by exam; omit (or pass undefined) to load all candidates across exams.
 */
export async function getCandidateSummaries(
  examId: number | undefined,
  params?: { pageNumber?: number; pageSize?: number },
): Promise<PaginatedCandidates> {
  const query = new URLSearchParams();
  query.set("pageNumber", String(params?.pageNumber ?? 1));
  query.set("pageSize", String(params?.pageSize ?? 100));
  if (examId != null && examId > 0) query.set("examId", String(examId));
  const raw = await apiClient.get<unknown>(
    `/ExamResult/summary/candidates?${query}`,
  );
  const inner =
    raw && typeof raw === "object"
      ? (((raw as Record<string, unknown>).data ??
          (raw as Record<string, unknown>).Data ??
          raw) as Record<string, unknown>)
      : {};
  const items = (inner?.items ??
    inner?.Items ??
    []) as CandidateExamSummaryItem[];
  const list = Array.isArray(items) ? items : [];
  return {
    items: list,
    pageNumber: (inner?.pageNumber ??
      inner?.PageNumber ??
      params?.pageNumber ??
      1) as number,
    pageSize: (inner?.pageSize ??
      inner?.PageSize ??
      params?.pageSize ??
      100) as number,
    totalCount: (inner?.totalCount ??
      inner?.TotalCount ??
      list.length) as number,
  };
}

/** Get candidate summaries for a single exam (uses path endpoint). */
export async function getExamCandidateSummaries(
  examId: number,
  params?: { pageNumber?: number; pageSize?: number },
): Promise<PaginatedCandidates> {
  return getCandidateSummaries(examId, params);
}

/** Attempt search result type */
export interface AttemptListItem {
  id: number;
  attemptId: number;
  examId: number;
  examTitleEn: string;
  examTitleAr: string;
  candidateId: string;
  candidateName: string;
  status: number;
  statusName: string;
  startedAt: string;
  submittedAt?: string;
}

/** Search for attempts by exam and candidate to get attemptId */
export async function getAttemptIdForCandidate(
  examId: number,
  candidateId: string,
): Promise<number | null> {
  try {
    // 1) Prefer grading sessions (most reliable for score card/review/grade)
    try {
      const gradingQuery = new URLSearchParams();
      gradingQuery.set("ExamId", String(examId));
      gradingQuery.set("CandidateId", candidateId);
      gradingQuery.set("PageSize", "1");

      const gradingRaw = await apiClient.get<unknown>(`/Grading?${gradingQuery}`);
      const gradingInner =
        gradingRaw && typeof gradingRaw === "object"
          ? (((gradingRaw as Record<string, unknown>).data ??
              (gradingRaw as Record<string, unknown>).Data ??
              gradingRaw) as Record<string, unknown>)
          : {};
      const gradingItems = (gradingInner?.items ?? gradingInner?.Items ?? []) as { attemptId?: number; id?: number }[];

      if (Array.isArray(gradingItems) && gradingItems.length > 0) {
        return gradingItems[0].attemptId ?? gradingItems[0].id ?? null;
      }
    } catch (err) {
      console.warn("[getAttemptIdForCandidate] Grading lookup failed:", err);
    }

    // 2) Fall back to latest submitted/expired attempt
    const statusesToTry = [AttemptStatus.Submitted, AttemptStatus.Expired];
    for (const status of statusesToTry) {
      const query = new URLSearchParams();
      query.set("ExamId", String(examId));
      query.set("CandidateId", candidateId);
      query.set("Status", String(status));
      query.set("PageSize", "1");

      const raw = await apiClient.get<unknown>(`/Attempt?${query}`);
      const inner =
        raw && typeof raw === "object"
          ? (((raw as Record<string, unknown>).data ??
              (raw as Record<string, unknown>).Data ??
              raw) as Record<string, unknown>)
          : {};
      const items = (inner?.items ?? inner?.Items ?? []) as AttemptListItem[];

      if (Array.isArray(items) && items.length > 0) {
        return items[0].id ?? items[0].attemptId ?? null;
      }
    }

    // 3) Final fallback: latest attempt regardless of status
    const query = new URLSearchParams();
    query.set("ExamId", String(examId));
    query.set("CandidateId", candidateId);
    query.set("PageSize", "1");

    const raw = await apiClient.get<unknown>(`/Attempt?${query}`);
    const inner =
      raw && typeof raw === "object"
        ? (((raw as Record<string, unknown>).data ??
            (raw as Record<string, unknown>).Data ??
            raw) as Record<string, unknown>)
        : {};
    const items = (inner?.items ?? inner?.Items ?? []) as AttemptListItem[];

    if (Array.isArray(items) && items.length > 0) {
      return items[0].id ?? items[0].attemptId ?? null;
    }

    return null;
  } catch (err) {
    console.warn("[getAttemptIdForCandidate] Failed:", err);
    return null;
  }
}
