"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import { getCandidateResultList, type CandidateResultListItem } from "@/lib/api/results"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  BarChart3,
  BookOpen,
  Eye,
  Award,
  FileText,
  Video,
  Monitor,
  Search,
  RefreshCw,
  MoreHorizontal,
  Send,
  ClipboardCheck,
  Bot,
} from "lucide-react"

const ALL_EXAMS_VALUE = "__all__"
const RESULT_STATUS_ALL = "all"
const RESULT_STATUS_PASSED = "passed"
const RESULT_STATUS_FAILED = "failed"
const RESULT_STATUS_UNDER_REVIEW = "under_review"
const RESULT_STATUS_NOT_PUBLISHED = "not_published"
const GRADING_STATUS_PENDING = 1
const GRADING_STATUS_AUTO_GRADED = 2
const GRADING_STATUS_MANUAL_REQUIRED = 3
const GRADING_STATUS_COMPLETED = 4

type EnrichedCandidate = CandidateResultListItem

export default function CandidateResultPage() {
  const { t, language } = useI18n()
  const searchParams = useSearchParams()
  const fromGrading = searchParams.get("fromGrading") === "1"
  
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>(ALL_EXAMS_VALUE)
  const [resultStatus, setResultStatus] = useState<string>(RESULT_STATUS_ALL)
  const [searchQuery, setSearchQuery] = useState("")
  const [candidates, setCandidates] = useState<EnrichedCandidate[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set())
  const retryRef = useRef(false)

  const loadCandidates = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    getExamListForDropdown()
      .then((list) => {
        if (!cancelled) setExams(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        console.warn("[CandidateResult] Failed to load exams:", err)
        if (!cancelled) setExams([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingCandidates(true)
    
    const examIdParam = selectedExamId && selectedExamId !== ALL_EXAMS_VALUE ? Number(selectedExamId) : undefined

    const fetchData = async () => {
      try {
        const res = await getCandidateResultList(examIdParam, { pageNumber: 1, pageSize: 200 })
        if (cancelled) return

        const list = res?.items ?? []
        setCandidates(list)
        setTotalCount(res?.totalCount ?? list.length)

        if (fromGrading && list.length === 0 && !retryRef.current) {
          retryRef.current = true
          setTimeout(() => setRefreshKey((k) => k + 1), 2000)
        }
      } catch (err) {
        console.error("[CandidateResult] Failed to load candidates:", err)
        if (!cancelled) setCandidates([])
      } finally {
        if (!cancelled) setLoadingCandidates(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [selectedExamId, refreshKey, fromGrading])

  // Hide expired/terminated/force-submitted (shown on Terminated Attempts page)
  const nonTerminatedCandidates = useMemo(() => {
    return candidates.filter(
      (c) => c.attemptStatusName !== "Terminated" && c.attemptStatusName !== "ForceSubmitted" && c.attemptStatusName !== "Expired"
    )
  }, [candidates])

  const statusFilteredCandidates = useMemo(() => {
    if (resultStatus === RESULT_STATUS_ALL) return nonTerminatedCandidates
    
    return nonTerminatedCandidates.filter((c) => {
      switch (resultStatus) {
        case RESULT_STATUS_PASSED:
          return c.isPassed === true
        case RESULT_STATUS_FAILED:
          return c.isPassed === false
        case RESULT_STATUS_UNDER_REVIEW:
          return (
            c.gradingStatusCode === GRADING_STATUS_MANUAL_REQUIRED ||
            c.gradingStatusCode === GRADING_STATUS_PENDING ||
            !c.isResultFinalized
          )
        case RESULT_STATUS_NOT_PUBLISHED:
          return c.isResultFinalized && !c.isPublished
        default:
          return true
      }
    })
  }, [nonTerminatedCandidates, resultStatus])

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return statusFilteredCandidates
    const q = searchQuery.trim().toLowerCase()
    return statusFilteredCandidates.filter(
      (row) =>
        (row.candidateName ?? "").toLowerCase().includes(q) ||
        (row.candidateEmail ?? "").toLowerCase().includes(q)
    )
  }, [statusFilteredCandidates, searchQuery])

  const getExamTitle = (exam: ExamDropdownItem) => (language === "ar" ? exam.titleAr : exam.titleEn) || ""

  const getResultIdFromPayload = (payload: unknown) => {
    if (!payload || typeof payload !== "object") return undefined
    const record = payload as Record<string, unknown>
    const data = record.data as Record<string, unknown> | undefined
    const Data = record.Data as Record<string, unknown> | undefined
    return (
      (record.id as number | undefined) ??
      (record.Id as number | undefined) ??
      (record.resultId as number | undefined) ??
      (record.ResultId as number | undefined) ??
      (data?.id as number | undefined) ??
      (data?.Id as number | undefined) ??
      (Data?.id as number | undefined) ??
      (Data?.Id as number | undefined)
    )
  }

  const handlePublish = async (row: EnrichedCandidate) => {
    if (!row.attemptId) {
      toast.error(language === "ar" ? "لا يوجد محاولة للنشر" : "No attempt to publish")
      return
    }
    
    const key = `${row.candidateId}-${row.examId}`
    setPublishingIds((prev) => new Set(prev).add(key))
    
    try {
      let resultId = row.resultId

      if (!resultId && !row.isResultFinalized && row.gradingSessionId) {
        try {
          const finalized = await apiClient.post<unknown>(`/ExamResult/finalize/${row.gradingSessionId}`)
          resultId = getResultIdFromPayload(finalized)
        } catch {
          // Ignore if already finalized in backend
        }
      }

      if (!resultId) {
        const resultRes = await apiClient.get<unknown>(`/ExamResult/attempt/${row.attemptId}`)
        resultId = getResultIdFromPayload(resultRes)
      }

      if (!resultId) {
        toast.error(language === "ar" ? "لم يتم العثور على النتيجة" : "Result not found")
        return
      }

      await apiClient.post(`/ExamResult/${resultId}/publish`)
      toast.success(language === "ar" ? "تم نشر النتيجة" : "Result published successfully")
      loadCandidates()
    } catch (err) {
      console.error("Failed to publish:", err)
      toast.error(language === "ar" ? "فشل في نشر النتيجة" : "Failed to publish result")
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const getGradingStatusBadge = (status?: string) => {
    switch (status) {
      case "Auto Graded":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{language === "ar" ? "تصحيح تلقائي" : "Auto Graded"}</Badge>
      case "Completed":
      case "Manual Graded":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{language === "ar" ? "تصحيح يدوي" : "Manual Graded"}</Badge>
      case "In Review":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{language === "ar" ? "قيد المراجعة" : "In Review"}</Badge>
      default:
        return <Badge variant="outline" className="text-muted-foreground">{language === "ar" ? "معلق" : "Pending"}</Badge>
    }
  }

  const canPublish = (row: EnrichedCandidate) => {
    const gradingCompleted =
      row.gradingStatusCode === GRADING_STATUS_AUTO_GRADED ||
      row.gradingStatusCode === GRADING_STATUS_COMPLETED
    return gradingCompleted && !row.isPublished
  }

  const canGenerateCertificate = (row: EnrichedCandidate) => {
    const gradingCompleted =
      row.gradingStatusCode === GRADING_STATUS_AUTO_GRADED ||
      row.gradingStatusCode === GRADING_STATUS_COMPLETED
    return gradingCompleted && row.isPassed === true
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.candidateResult")}</h1>
        <p className="text-muted-foreground mt-1">
          {language === "ar" ? "عرض نتائج المرشحين حسب الاختبار" : "View candidate results by exam"}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="exam-filter" className="text-sm font-medium">
            {language === "ar" ? "الاختبار" : "Exam"}
          </Label>
          <div className="flex items-center gap-2">
            <Select value={selectedExamId} onValueChange={(v) => v && setSelectedExamId(v)}>
              <SelectTrigger id="exam-filter" className="w-[240px]">
                <SelectValue placeholder={language === "ar" ? "اختر اختبارا" : "Select exam"} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value={ALL_EXAMS_VALUE}>
                  {language === "ar" ? "جميع الاختبارات" : "All exams"}
                </SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={String(exam.id)}>
                    {getExamTitle(exam)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={loadCandidates} title={language === "ar" ? "تحديث القائمة" : "Refresh list"}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            {language === "ar" ? "حالة النتيجة" : "Result Status"}
          </Label>
          <Select value={resultStatus} onValueChange={setResultStatus}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4}>
              <SelectItem value={RESULT_STATUS_ALL}>{language === "ar" ? "الكل" : "All"}</SelectItem>
              <SelectItem value={RESULT_STATUS_PASSED}>{language === "ar" ? "ناجح" : "Passed"}</SelectItem>
              <SelectItem value={RESULT_STATUS_FAILED}>{language === "ar" ? "راسب" : "Failed"}</SelectItem>
              <SelectItem value={RESULT_STATUS_UNDER_REVIEW}>{language === "ar" ? "قيد المراجعة" : "Under Review"}</SelectItem>
              <SelectItem value={RESULT_STATUS_NOT_PUBLISHED}>{language === "ar" ? "غير منشور" : "Not Published"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="search-candidates" className="text-sm font-medium">
            {language === "ar" ? "بحث" : "Search"}
          </Label>
          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-candidates"
              placeholder={language === "ar" ? "الاسم أو البريد الإلكتروني..." : "Name or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{filteredCandidates.length}</p>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "إجمالي المرشحين" : "Total candidates"}
              {(searchQuery.trim() || resultStatus !== RESULT_STATUS_ALL) && (
                <span className="text-xs ml-1">({language === "ar" ? "بعد الفلترة" : "filtered"})</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {loadingCandidates ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={language === "ar" ? "لا يوجد مرشحون" : "No candidates"}
          description={
            searchQuery.trim() || resultStatus !== RESULT_STATUS_ALL
              ? (language === "ar" ? "لا توجد نتائج تطابق الفلاتر" : "No results match your filters")
              : fromGrading
                ? (language === "ar" ? "انقر على زر التحديث أعلاه" : "Click refresh button above")
                : (language === "ar" ? "لم يتم تعيين مرشحين بعد" : "No candidates yet")
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">{language === "ar" ? "م" : "Sr. No."}</TableHead>
                    <TableHead>{language === "ar" ? "الاختبار" : "Exam"}</TableHead>
                    <TableHead>{language === "ar" ? "المرشح" : "Candidate"}</TableHead>
                    <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                    <TableHead>{language === "ar" ? "النسبة" : "Percentage"}</TableHead>
                    <TableHead>{language === "ar" ? "حالة المحاولة" : "Attempt Status"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "حالة التصحيح" : "Grading Status"}</TableHead>
                    <TableHead>{language === "ar" ? "منشور" : "Published"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((row, idx) => {
                    const effectiveExamId = selectedExamId !== ALL_EXAMS_VALUE ? selectedExamId : String(row.examId ?? "")
                    const examTitle = row.examId != null
                      ? (language === "ar" ? row.examTitleAr : row.examTitleEn) ?? ""
                      : exams.find((e) => String(e.id) === selectedExamId)
                        ? (language === "ar" ? exams.find((e) => String(e.id) === selectedExamId)?.titleAr : exams.find((e) => String(e.id) === selectedExamId)?.titleEn) ?? ""
                        : ""
                    const publishKey = `${row.candidateId}-${row.examId}`
                    const isPublishing = publishingIds.has(publishKey)
                    const attemptQuery = row.attemptId ? `?attemptId=${row.attemptId}` : ""

                    return (
                      <TableRow key={row.examId != null ? `${row.examId}-${row.candidateId}` : row.candidateId}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={examTitle}>{examTitle || ""}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{row.candidateName}</span>
                            <span className="text-xs text-muted-foreground">
                              {language === "ar" ? `المحاولة #${row.attemptNumber ?? 1}` : `Attempt #${row.attemptNumber ?? 1}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{row.score != null ? `${row.score.toFixed(1)}/${row.maxPossibleScore ?? 100}` : "—"}</TableCell>
                        <TableCell>{row.percentage != null ? `${row.percentage.toFixed(2)}%` : "—"}</TableCell>
                        <TableCell>
                          {(() => {
                            const s = row.attemptStatusName ?? "Submitted"
                            const map: Record<string, { label: string; labelAr: string; cls: string }> = {
                              Submitted: { label: "Submitted", labelAr: "مُقدَّم", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                              Expired: { label: "Expired", labelAr: "منتهي", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                              ForceSubmitted: { label: "Force Ended", labelAr: "أُنهي قسراً", cls: "bg-red-50 text-red-700 border-red-200" },
                              Terminated: { label: "Terminated", labelAr: "أُنهي بواسطة المراقب", cls: "bg-red-50 text-red-700 border-red-200" },
                            }
                            const entry = map[s] ?? { label: s, labelAr: s, cls: "" }
                            return <Badge className={`border ${entry.cls}`}>{language === "ar" ? entry.labelAr : entry.label}</Badge>
                          })()}
                        </TableCell>
                        <TableCell>
                          {row.isPassed == null ? (
                            <Badge variant="outline" className="text-muted-foreground">—</Badge>
                          ) : row.isPassed ? (
                            <Badge className="bg-green-600 hover:bg-green-700">{language === "ar" ? "ناجح" : "Pass"}</Badge>
                          ) : (
                            <Badge variant="destructive">{language === "ar" ? "راسب" : "Fail"}</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getGradingStatusBadge(row.gradingStatus)}</TableCell>
                        <TableCell>
                          {row.isPublished ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300">{language === "ar" ? "نعم" : "Yes"}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">{language === "ar" ? "لا" : "No"}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {effectiveExamId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/review/${effectiveExamId}/${row.candidateId}`}>
                                    <Eye className="h-4 w-4 mr-2" />{language === "ar" ? "عرض التفاصيل" : "View Details"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {effectiveExamId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/score-card/${effectiveExamId}/${row.candidateId}`}>
                                    <FileText className="h-4 w-4 mr-2" />{language === "ar" ? "كشف الدرجات" : "Score Card"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePublish(row)} disabled={!canPublish(row) || isPublishing} className={!canPublish(row) ? "opacity-50" : ""}>
                                {isPublishing ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                {language === "ar" ? "نشر النتيجة" : "Publish Result"}
                              </DropdownMenuItem>
                              {effectiveExamId && (
                                <DropdownMenuItem asChild disabled={!canGenerateCertificate(row)} className={!canGenerateCertificate(row) ? "opacity-50" : ""}>
                                  <Link href={canGenerateCertificate(row) ? `/results/certificate/${effectiveExamId}/${row.candidateId}` : "#"} onClick={(e) => !canGenerateCertificate(row) && e.preventDefault()}>
                                    <Award className="h-4 w-4 mr-2" />{language === "ar" ? "إنشاء شهادة" : "Generate Certificate"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {row.attemptId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/grading/${row.attemptId}`}>
                                    <ClipboardCheck className="h-4 w-4 mr-2" />{language === "ar" ? "عرض المحاولة" : "View Attempt"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {effectiveExamId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/ai-report/${effectiveExamId}/${row.candidateId}${attemptQuery}`}>
                                    <Bot className="h-4 w-4 mr-2" />{language === "ar" ? "تقرير المراقبة" : "Proctor Report"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/proctor-center/video/${row.candidateId}${attemptQuery}`}>
                                  <Video className="h-4 w-4 mr-2" />{language === "ar" ? "فيديو المرشح" : "Candidate Video"}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/proctor-center/stream/${row.candidateId}${attemptQuery}`}>
                                  <Monitor className="h-4 w-4 mr-2" />{language === "ar" ? "بث الشاشة" : "Screen Streaming"}
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
