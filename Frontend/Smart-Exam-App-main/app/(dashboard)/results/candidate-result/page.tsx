"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import { getCandidateSummaries, type CandidateExamSummaryItem } from "@/lib/api/results"
import { getManualGradingRequired } from "@/lib/api/grading"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import {
  BarChart3,
  BookOpen,
  Eye,
  Award,
  FileText,
  TrendingUp,
  Video,
  Monitor,
  Image,
  ClipboardCheck,
  Info,
  Search,
  RefreshCw,
} from "lucide-react"

const ALL_EXAMS_VALUE = "__all__"

export default function CandidateResultPage() {
  const { t, language } = useI18n()
  const searchParams = useSearchParams()
  const fromGrading = searchParams.get("fromGrading") === "1"
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>(ALL_EXAMS_VALUE)
  const [searchQuery, setSearchQuery] = useState("")
  const [candidates, setCandidates] = useState<CandidateExamSummaryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [candidateToAttemptId, setCandidateToAttemptId] = useState<Record<string, number>>({})
  const [refreshKey, setRefreshKey] = useState(0)
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
    const gradingPromise = examIdParam
      ? getManualGradingRequired({ examId: examIdParam, pageNumber: 1, pageSize: 500 }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] })
    Promise.all([
      getCandidateSummaries(examIdParam, { pageNumber: 1, pageSize: 200 }),
      gradingPromise,
    ])
      .then(([res, gradingRes]) => {
        if (cancelled) return
        const list = res?.items ?? []
        setCandidates(Array.isArray(list) ? list : [])
        setTotalCount(res?.totalCount ?? list?.length ?? 0)
        const map: Record<string, number> = {}
        if (examIdParam) {
          const gradingItems = gradingRes?.items ?? (gradingRes as { Items?: { attemptId: number; candidateId: string }[] })?.Items ?? []
            ; (Array.isArray(gradingItems) ? gradingItems : []).forEach((g: { attemptId: number; candidateId: string }) => {
              map[g.candidateId] = g.attemptId
            })
        }
        setCandidateToAttemptId(map)
        // If we came from Grading and got 0 candidates, retry once after 2s (backend may need a moment)
        if (fromGrading && list.length === 0 && !retryRef.current) {
          retryRef.current = true
          setTimeout(() => setRefreshKey((k) => k + 1), 2000)
        }
      })
      .catch(() => {
        if (!cancelled) setCandidates([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false)
      })
    return () => { cancelled = true }
  }, [selectedExamId, refreshKey, fromGrading])

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates
    const q = searchQuery.trim().toLowerCase()
    return candidates.filter(
      (row) =>
        (row.candidateName ?? "").toLowerCase().includes(q) ||
        (row.candidateId ?? "").toLowerCase().includes(q) ||
        (row.candidateEmail ?? "").toLowerCase().includes(q) ||
        (row.examTitleEn ?? "").toLowerCase().includes(q) ||
        (row.examTitleAr ?? "").includes(searchQuery.trim())
    )
  }, [candidates, searchQuery])

  const getExamTitle = (exam: ExamDropdownItem) => (language === "ar" ? exam.titleAr : exam.titleEn) || ""

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
            <Select
              value={selectedExamId}
              onValueChange={(v) => v && setSelectedExamId(v)}
            >
              <SelectTrigger id="exam-filter" className="w-[280px]">
                <SelectValue placeholder={language === "ar" ? "اختر اختباراً" : "Select exam"} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value={ALL_EXAMS_VALUE}>
                  {language === "ar" ? "جميع الاختبارات" : "All exams"}
                </SelectItem>
                {exams.length === 0 && !loading ? null : (
                  exams.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {getExamTitle(exam)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={loadCandidates} title={language === "ar" ? "تحديث القائمة" : "Refresh list"}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-candidates" className="text-sm font-medium">
            {language === "ar" ? "بحث" : "Search"}
          </Label>
          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-candidates"
              placeholder={language === "ar" ? "اسم، رقم، اختبار..." : "Name, roll no, exam..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {(selectedExamId === ALL_EXAMS_VALUE || selectedExamId) && (
        <>
          {selectedExamId !== ALL_EXAMS_VALUE && (
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="flex items-start gap-3 p-4">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">
                    {language === "ar" ? "أين أرى إجابات المرشح والدرجات؟" : "Where do I see a candidate's answers and grading?"}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>{language === "ar" ? "كشف الدرجات: كل الإجابات والنتيجة" : "Score Card: all answers and score"}</li>
                    <li>{language === "ar" ? "مراجعة الاختبار: مراجعة الإجابات" : "Exam Review: review answers"}</li>
                    <li>{language === "ar" ? "فيديو المرشح / بث الشاشة: تسجيلات المراقبة" : "Candidate Video / Screen Streaming: proctoring recordings"}</li>
                    <li>{language === "ar" ? "الدرجة (مقالي): تصحيح الأسئلة المقالية وتحديث النتيجة" : "Grade (essay): grade essay questions and update result"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{searchQuery.trim() ? filteredCandidates.length : totalCount}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "المرشحون" : searchQuery.trim() ? "Matching search" : "Total candidates"}
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
                searchQuery.trim()
                  ? (language === "ar" ? "لا توجد نتائج تطابق البحث" : "No results match your search")
                  : fromGrading
                    ? (language === "ar" ? "إذا كنت قد ضغطت «عرض النتيجة» من التصحيح، انقر فوق «تحديث» أعلاه. إن لم يظهر المرشح، تأكد من إكمال التصحيح ثم «عرض النتيجة» مرة أخرى." : "If you just clicked \"See result\" from Grading, click the Refresh button above. If the candidate still doesn't appear, open Grading again and click \"See result\" for that row.")
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
                        <TableHead>{language === "ar" ? "م" : "Sr. No."}</TableHead>
                        {selectedExamId === ALL_EXAMS_VALUE && (
                          <TableHead>{language === "ar" ? "الاختبار" : "Exam"}</TableHead>
                        )}
                        <TableHead>{language === "ar" ? "الاسم" : "Name"}</TableHead>
                        <TableHead>{language === "ar" ? "الرقم" : "Roll No"}</TableHead>
                        <TableHead>{language === "ar" ? "وقت الانتهاء" : "Finished Time"}</TableHead>
                        <TableHead>{language === "ar" ? "الدرجة" : "Score"}</TableHead>
                        <TableHead>{language === "ar" ? "كشف الدرجات" : "Score Card"}</TableHead>
                        <TableHead>{language === "ar" ? "الشهادة" : "Certificate"}</TableHead>
                        <TableHead>{language === "ar" ? "تحليل الاختبار" : "Exam Analysis"}</TableHead>
                        <TableHead>{language === "ar" ? "حالة الاختبار" : "Exam Status"}</TableHead>
                        <TableHead>{language === "ar" ? "مراجعة الاختبار" : "Exam Review"}</TableHead>
                        <TableHead>{language === "ar" ? "تقرير AI" : "AI Report"}</TableHead>
                        <TableHead>{language === "ar" ? "فيديو المرشح" : "Candidate Video"}</TableHead>
                        <TableHead>{language === "ar" ? "وقت الاختبار" : "Exam time"}</TableHead>
                        <TableHead>{language === "ar" ? "بث الشاشة" : "Screen Streaming"}</TableHead>
                        <TableHead>{language === "ar" ? "الدرجة (مقالي)" : "Grade (essay)"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCandidates.map((row, idx) => {
                        const effectiveExamId = selectedExamId !== ALL_EXAMS_VALUE ? selectedExamId : String(row.examId ?? "")
                        const attemptId = effectiveExamId ? candidateToAttemptId[row.candidateId] : undefined
                        const examTitle = row.examId != null ? (language === "ar" ? row.examTitleAr : row.examTitleEn) ?? "" : ""
                        return (
                          <TableRow key={row.examId != null ? `${row.examId}-${row.candidateId}` : row.candidateId}>
                            <TableCell>{idx + 1}</TableCell>
                            {selectedExamId === ALL_EXAMS_VALUE && (
                              <TableCell className="text-muted-foreground">{examTitle || "—"}</TableCell>
                            )}
                            <TableCell className="font-medium">{row.candidateName}</TableCell>
                            <TableCell>{row.candidateId}</TableCell>
                            <TableCell>
                              {row.lastAttemptAt
                                ? new Date(row.lastAttemptAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {row.bestPercentage != null ? `${row.bestPercentage.toFixed(2)}%` : row.bestScore ?? "0.00"}
                            </TableCell>
                            <TableCell>
                              {effectiveExamId ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                  <Link href={`/results/score-card/${effectiveExamId}/${row.candidateId}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {effectiveExamId ? (
                                <Button variant="link" className="text-primary p-0 h-auto" asChild>
                                  <Link href={`/results/certificate/${effectiveExamId}/${row.candidateId}`}>
                                    {language === "ar" ? "الشهادة" : "Certificate"}
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {effectiveExamId ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                  <Link href={`/results/exam-analytics?examId=${effectiveExamId}&candidateId=${row.candidateId}`}>
                                    <TrendingUp className="h-4 w-4" />
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.bestIsPassed == null ? "—" : row.bestIsPassed ? t("myExams.passed") : t("myExams.failed")}
                            </TableCell>
                            <TableCell>
                              {effectiveExamId ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                  <Link href={`/results/review/${effectiveExamId}/${row.candidateId}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {effectiveExamId ? (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                  <Link href={`/results/ai-report/${effectiveExamId}/${row.candidateId}`}>
                                    <Image className="h-4 w-4" />
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                <Link href={`/proctor-center/video/${row.candidateId}`}>
                                  <Video className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                            <TableCell className="text-muted-foreground">NA</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" asChild>
                                <Link href={`/proctor-center/stream/${row.candidateId}`}>
                                  <Monitor className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                            <TableCell>
                              {attemptId ? (
                                <Button variant="default" size="sm" className="gap-1" asChild>
                                  <Link href={`/grading/${attemptId}`}>
                                    <ClipboardCheck className="h-4 w-4" />
                                    {language === "ar" ? "الدرجة" : "Grade"}
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
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
        </>
      )}
    </div>
  )
}
