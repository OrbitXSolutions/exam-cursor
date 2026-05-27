"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getExams, getWalkInAnswers } from "@/lib/api/exams"
import type { Exam, WalkInAnswerValue } from "@/lib/types"
import { getCandidateResultList, type CandidateResultListItem } from "@/lib/api/results"
import { getGradingSessionByAttempt } from "@/lib/api/grading"
import { exportCandidateReportExcel, exportCandidateReportPdf, exportCandidateReportPdfAr } from "@/lib/export/candidate-report"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  FileSpreadsheet,
  Download,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
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
  
  const [examItems, setExamItems] = useState<Exam[]>([])
  const [examPage, setExamPage] = useState(0)
  const [examTotalPages, setExamTotalPages] = useState(0)
  const [examSearchLoading, setExamSearchLoading] = useState(false)
  const [examSearch, setExamSearch] = useState("")
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string>(ALL_EXAMS_VALUE)
  const [resultStatus, setResultStatus] = useState<string>(RESULT_STATUS_ALL)
  const [searchQuery, setSearchQuery] = useState("")
  const [candidates, setCandidates] = useState<EnrichedCandidate[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set())
  const [exportingIds, setExportingIds] = useState<Map<string, "excel" | "pdf" | "pdf-ar">>(new Map())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryRef = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Walk-In Registration Info modal
  const [walkInModal, setWalkInModal] = useState<{ candidateName: string; candidateId: string; examId: number } | null>(null)
  const [walkInAnswers, setWalkInAnswers] = useState<WalkInAnswerValue[]>([])
  const [loadingWalkIn, setLoadingWalkIn] = useState(false)

  function handleSelectExam(exam: Exam | null) {
    if (exam === null) {
      setSelectedExamId(ALL_EXAMS_VALUE)
      setSelectedExam(null)
    } else {
      setSelectedExamId(String(exam.id))
      setSelectedExam(exam)
    }
    setExamSearch("")
    setDropdownOpen(false)
    setCurrentPage(1)
  }

  const handleStatusChange = (v: string) => { setResultStatus(v); setCurrentPage(1) }
  const handleSearchChange = (v: string) => {
    setSearchQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setCurrentPage(1) }, 400)
  }
  const handlePageSizeChange = (v: string) => { setPageSize(Number(v)); setCurrentPage(1) }

  const loadCandidates = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  async function openWalkInModal(row: EnrichedCandidate) {
    setWalkInModal({ candidateName: row.candidateName, candidateId: row.candidateId, examId: row.examId })
    setWalkInAnswers([])
    setLoadingWalkIn(true)
    try {
      const all = await getWalkInAnswers(row.examId)
      const mine = all.find((a) => a.candidateId === row.candidateId)
      setWalkInAnswers(mine?.answers ?? [])
    } catch {
      setWalkInAnswers([])
    } finally {
      setLoadingWalkIn(false)
    }
  }

  const PAGE_SIZE_EXAM = 20
  async function loadExamsPage(search: string, page: number, replace: boolean) {
    setExamSearchLoading(true)
    try {
      const response = await getExams({ search: search || undefined, pageNumber: page, pageSize: PAGE_SIZE_EXAM })
      const items = response.items ?? []
      if (replace) {
        setExamItems(items)
      } else {
        setExamItems((prev) => [...prev, ...items])
      }
      setExamPage(page)
      setExamTotalPages(response.totalPages ?? 0)
    } catch {
      // silent
    } finally {
      setExamSearchLoading(false)
    }
  }

  // Load list when dropdown opens
  useEffect(() => {
    if (!dropdownOpen) return
    loadExamsPage(examSearch, 1, true)
  }, [dropdownOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced reload on search change
  useEffect(() => {
    if (!dropdownOpen) return
    const timer = setTimeout(() => { loadExamsPage(examSearch, 1, true) }, 300)
    return () => clearTimeout(timer)
  }, [examSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingCandidates(true)
    
    const examIdParam = selectedExamId && selectedExamId !== ALL_EXAMS_VALUE ? Number(selectedExamId) : undefined

    const fetchData = async () => {
      try {
        const res = await getCandidateResultList(examIdParam, { pageNumber: currentPage, pageSize, excludeTerminated: true, search: debouncedSearch.trim() || undefined, resultStatus: resultStatus !== RESULT_STATUS_ALL ? resultStatus : undefined })
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
  }, [selectedExamId, refreshKey, fromGrading, currentPage, pageSize, debouncedSearch, resultStatus])

  const getExamTitle = (exam: Exam) => (language === "ar" ? exam.titleAr : exam.titleEn) || ""

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

  const canExport = (row: EnrichedCandidate) => {
    return (
      !!row.attemptId &&
      (row.gradingStatusCode === GRADING_STATUS_AUTO_GRADED ||
        row.gradingStatusCode === GRADING_STATUS_COMPLETED)
    )
  }

  const handleExport = async (row: EnrichedCandidate, format: "excel" | "pdf" | "pdf-ar") => {
    if (!row.attemptId) {
      toast.error(language === "ar" ? "لا توجد محاولة" : "No attempt found")
      return
    }
    const key = `${row.candidateId}-${row.examId}-${format}`
    setExportingIds((prev) => new Map(prev).set(key, format))
    try {
      const session = await getGradingSessionByAttempt(row.attemptId)
      if (!session) {
        toast.error(
          language === "ar"
            ? "لم يتم العثور على بيانات التصحيح"
            : "Grading data not found. Please ensure grading is completed.",
        )
        return
      }
      if (format === "excel") {
        await exportCandidateReportExcel(session)
      } else if (format === "pdf-ar") {
        await exportCandidateReportPdfAr(session)
      } else {
        await exportCandidateReportPdf(session)
      }
    } catch (err) {
      console.error(`[Export ${format}] Failed:`, err)
      toast.error(language === "ar" ? "فشل تصدير التقرير" : "Failed to export report")
    } finally {
      setExportingIds((prev) => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.candidateResult")}</h1>
        <p className="text-muted-foreground mt-1">
          {language === "ar" ? "عرض نتائج المرشحين حسب الاختبار" : "View candidate results by exam"}
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-sm text-muted-foreground">
              {language === "ar" ? "إجمالي المرشحين" : "Total candidates"}
              {(searchQuery.trim() || resultStatus !== RESULT_STATUS_ALL) && (
                <span className="text-xs ms-1">({language === "ar" ? "بعد الفلترة" : "filtered"})</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 border-b">
          <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam-filter" className="text-sm font-medium">
                  {language === "ar" ? "الاختبار" : "Exam"}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-[240px] flex items-center justify-between px-3 py-2.5 h-10 text-sm rounded-md border bg-background hover:bg-accent/50 transition-colors"
                    >
                      <span className={selectedExam ? "text-foreground" : "text-muted-foreground"}>
                        {selectedExamId === ALL_EXAMS_VALUE
                          ? (language === "ar" ? "جميع الاختبارات" : "All exams")
                          : selectedExam ? getExamTitle(selectedExam) : (language === "ar" ? "اختر اختبارا" : "Select exam")}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute z-50 w-[300px] mt-1 rounded-md border bg-popover shadow-lg">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={language === "ar" ? "البحث عن اختبارات..." : "Search exams..."}
                              value={examSearch}
                              onChange={(e) => setExamSearch(e.target.value)}
                              className="ps-9 h-9 border"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y">
                          <button
                            type="button"
                            onClick={() => handleSelectExam(null)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${selectedExamId === ALL_EXAMS_VALUE ? "bg-primary/10 text-primary font-medium" : ""}`}
                          >
                            {selectedExamId === ALL_EXAMS_VALUE && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                            <span>{language === "ar" ? "جميع الاختبارات" : "All exams"}</span>
                          </button>
                          {examSearchLoading && examItems.length === 0 ? (
                            <div className="flex items-center justify-center py-6">
                              <LoadingSpinner size="sm" />
                            </div>
                          ) : examItems.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {language === "ar" ? "لم يتم العثور على اختبارات" : "No exams found"}
                            </div>
                          ) : (
                            <>
                              {examItems.map((exam) => (
                                <button
                                  key={exam.id}
                                  type="button"
                                  onClick={() => handleSelectExam(exam)}
                                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${selectedExamId === String(exam.id) ? "bg-primary/10 text-primary font-medium" : ""}`}
                                >
                                  {selectedExamId === String(exam.id) && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                  <span className="truncate">{getExamTitle(exam)}</span>
                                </button>
                              ))}
                              {examPage < examTotalPages && (
                                <button
                                  type="button"
                                  onClick={() => loadExamsPage(examSearch, examPage + 1, false)}
                                  disabled={examSearchLoading}
                                  className="w-full px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors text-center disabled:opacity-50"
                                >
                                  {examSearchLoading
                                    ? <LoadingSpinner size="sm" className="mx-auto" />
                                    : (language === "ar" ? "تحميل المزيد..." : "Load more...")}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={loadCandidates} title={language === "ar" ? "تحديث القائمة" : "Refresh list"}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  {language === "ar" ? "حالة النتيجة" : "Result Status"}
                </Label>
                <Select value={resultStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status-filter" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value={RESULT_STATUS_ALL}>{language === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value={RESULT_STATUS_PASSED}>{language === "ar" ? "ناجح" : "Passed"}</SelectItem>
                    <SelectItem value={RESULT_STATUS_FAILED}>{language === "ar" ? "غير ناجح" : "Failed"}</SelectItem>
                    <SelectItem value={RESULT_STATUS_UNDER_REVIEW}>{language === "ar" ? "قيد المراجعة" : "Under Review"}</SelectItem>
                    <SelectItem value={RESULT_STATUS_NOT_PUBLISHED}>{language === "ar" ? "غير منشور" : "Not Published"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label htmlFor="search-candidates" className="text-sm font-medium">
                  {language === "ar" ? "بحث" : "Search"}
                </Label>
                <div className="relative">
                  <Search className="absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-candidates"
                    placeholder={language === "ar" ? "الاسم أو البريد الإلكتروني..." : "Name or email..."}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="ps-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardContent className="p-0">
            {loadingCandidates ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : candidates.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title={language === "ar" ? "لا يوجد مرشحون" : "No candidates"}
                description={language === "ar" ? "لا توجد نتائج تطابق الفلاتر" : "No results match your filters"}
              />
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">{language === "ar" ? "م" : "Sr. No."}</TableHead>
                    <TableHead>{language === "ar" ? "الاختبار" : "Exam"}</TableHead>
                    <TableHead>{language === "ar" ? "المرشح" : "Candidate"}</TableHead>
                    <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                    <TableHead>{language === "ar" ? "حالة المحاولة" : "Attempt Status"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "حالة التصحيح" : "Grading Status"}</TableHead>
                    <TableHead>{language === "ar" ? "منشور" : "Published"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((row, idx) => {
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
                            {row.candidateRollNo && (
                              <span className="text-xs text-muted-foreground">{row.candidateRollNo}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{row.score != null ? `${row.score.toFixed(1)}/${row.maxPossibleScore ?? 100}` : "—"}</TableCell>
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
                            <Badge variant="destructive">{language === "ar" ? "غير ناجح" : "Fail"}</Badge>
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
                                    <Eye className="h-4 w-4 me-2" />{language === "ar" ? "عرض التفاصيل" : "View Details"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {effectiveExamId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/score-card/${effectiveExamId}/${row.candidateId}`}>
                                    <FileText className="h-4 w-4 me-2" />{language === "ar" ? "كشف الدرجات" : "Score Card"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePublish(row)} disabled={!canPublish(row) || isPublishing} className={!canPublish(row) ? "opacity-50" : ""}>
                                {isPublishing ? <LoadingSpinner size="sm" className="me-2" /> : <Send className="h-4 w-4 me-2" />}
                                {language === "ar" ? "نشر النتيجة" : "Publish Result"}
                              </DropdownMenuItem>
                
                              {row.attemptId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/grading/${row.attemptId}`}>
                                    <ClipboardCheck className="h-4 w-4 me-2" />{language === "ar" ? "عرض التصحيح" : "View Grading"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {effectiveExamId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/ai-report/${effectiveExamId}/${row.candidateId}${attemptQuery}`}>
                                    <Bot className="h-4 w-4 me-2" />{language === "ar" ? "تقرير الذكاء الاصطناعي" : "AI Report"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/proctor-center/video/${row.candidateId}${attemptQuery}`}>
                                  <Video className="h-4 w-4 me-2" />{language === "ar" ? "وسائط المحاولة" : "Attempt Media"}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openWalkInModal(row)}>
                                <ClipboardList className="h-4 w-4 me-2" />{language === "ar" ? "بيانات التسجيل المفتوح" : "Registration Info"}
                              </DropdownMenuItem>
                              {canExport(row) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleExport(row, "excel")}
                                    disabled={exportingIds.has(`${row.candidateId}-${row.examId}-excel`)}
                                  >
                                    {exportingIds.has(`${row.candidateId}-${row.examId}-excel`) ? (
                                      <LoadingSpinner size="sm" className="me-2" />
                                    ) : (
                                      <FileSpreadsheet className="h-4 w-4 me-2" />
                                    )}
                                    {language === "ar" ? "تصدير Excel" : "Export Excel"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExport(row, "pdf")}
                                    disabled={exportingIds.has(`${row.candidateId}-${row.examId}-pdf`)}
                                  >
                                    {exportingIds.has(`${row.candidateId}-${row.examId}-pdf`) ? (
                                      <LoadingSpinner size="sm" className="me-2" />
                                    ) : (
                                      <Download className="h-4 w-4 me-2" />
                                    )}
                                    {language === "ar" ? "تصدير PDF" : "Export PDF (EN)"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleExport(row, "pdf-ar")}
                                    disabled={exportingIds.has(`${row.candidateId}-${row.examId}-pdf-ar`)}
                                  >
                                    {exportingIds.has(`${row.candidateId}-${row.examId}-pdf-ar`) ? (
                                      <LoadingSpinner size="sm" className="me-2" />
                                    ) : (
                                      <Download className="h-4 w-4 me-2" />
                                    )}
                                    {language === "ar" ? "تصدير PDF عربي" : "Export PDF (AR)"}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
          {/* Pagination */}
          {candidates.length > 0 && (
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{language === "ar" ? "عرض" : "Show"}</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>{language === "ar" ? "سجل لكل صفحة" : "records per page"}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground me-2">
                {language === "ar"
                  ? `صفحة ${currentPage} من ${Math.ceil(totalCount / pageSize) || 1}`
                  : `Page ${currentPage} of ${Math.ceil(totalCount / pageSize) || 1}`}
              </span>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                {language === "ar" ? "«" : "«"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                {language === "ar" ? "›" : "‹"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCount / pageSize), p + 1))} disabled={currentPage >= Math.ceil(totalCount / pageSize)}>
                {language === "ar" ? "‹" : "›"}
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(Math.ceil(totalCount / pageSize))} disabled={currentPage >= Math.ceil(totalCount / pageSize)}>
                {language === "ar" ? "»" : "»"}
              </Button>
            </div>
          </CardContent>
          )}
        </Card>

      {/* Walk-In Registration Info Dialog */}
      <Dialog open={walkInModal !== null} onOpenChange={(open) => { if (!open) setWalkInModal(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {language === "ar" ? "بيانات التسجيل المفتوح" : "Registration Info"}
            </DialogTitle>
            <DialogDescription>{walkInModal?.candidateName}</DialogDescription>
          </DialogHeader>
          {loadingWalkIn ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
          ) : walkInAnswers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {language === "ar" ? "لا توجد بيانات تسجيل لهذا المرشح" : "No registration data was collected for this candidate."}
            </p>
          ) : (
            <div className="space-y-3 py-2">
              {walkInAnswers.map((a) => (
                <div key={a.fieldId} className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {language === "ar" ? a.labelAr : a.labelEn}
                  </span>
                  <span className="text-sm font-medium border rounded-md px-3 py-1.5 bg-muted/40">{a.value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
