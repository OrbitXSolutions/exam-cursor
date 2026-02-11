"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getManualGradingRequired, getGradingSessions, finalizeResult, GradingStatus, type GradingSessionListItem } from "@/lib/api/grading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Search, ClipboardCheck, Clock, User, FileText, ChevronRight, CheckCircle, BarChart3 } from "lucide-react"
import { toast } from "sonner"

function getLocalizedField(obj: GradingSessionListItem, fieldBase: string, language: string): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj as Record<string, string>)[field] || (obj as Record<string, string>)[fallback] || ""
}

type ListFilter = "pending" | "all"

export default function GradingPage() {
  const { t, dir, language } = useI18n()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<GradingSessionListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [examFilter, setExamFilter] = useState<string>("all")
  const [listFilter, setListFilter] = useState<ListFilter>("all")

  useEffect(() => {
    loadSubmissions()
  }, [listFilter])

  async function loadSubmissions() {
    try {
      setLoading(true)
      if (listFilter === "pending") {
        const response = await getManualGradingRequired({ pageNumber: 1, pageSize: 50 })
        setSubmissions(response.items || [])
        setTotalCount(response.totalCount || 0)
      } else {
        const response = await getGradingSessions({ pageNumber: 1, pageSize: 50 })
        setSubmissions(response.items || [])
        setTotalCount(response.totalCount || 0)
      }
    } catch (error) {
      console.error("Failed to load grading list:", error)
      setSubmissions([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.candidateId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.examTitleEn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.examTitleAr || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesExam = examFilter === "all" || String(sub.examId) === examFilter
    return matchesSearch && matchesExam
  })

  const examOptions = [...new Map(submissions.map((s) => [String(s.examId), getLocalizedField(s, "examTitle", language)])).entries()]

  if (loading) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("grading.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("grading.subtitle")}</p>
      </div>

      {/* Show: Pending only | All (including completed) */}
      <div className="flex flex-wrap items-center gap-4">
        <Label className="text-sm font-medium">{language === "ar" ? "عرض" : "Show"}</Label>
        <select
          value={listFilter}
          onChange={(e) => setListFilter(e.target.value as ListFilter)}
          className="flex h-10 w-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{language === "ar" ? "الكل (بما فيها المكتملة)" : "All (including completed)"}</option>
          <option value="pending">{language === "ar" ? "قيد الانتظار فقط" : "Pending only"}</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <ClipboardCheck className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-sm text-muted-foreground">
                {listFilter === "pending" ? t("grading.pendingGrading") : (language === "ar" ? "الجلسات" : "Sessions")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {submissions.reduce((acc, s) => acc + (s.manualGradingRequired ?? 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t("grading.questionsToGrade")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{examOptions.length}</p>
              <p className="text-sm text-muted-foreground">{t("grading.examsWithPending")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("grading.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="flex h-10 w-full sm:w-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">{t("common.all")}</option>
              {examOptions.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t("grading.noSubmissions")}
              description={
                listFilter === "all"
                  ? (language === "ar" ? "لا توجد جلسات تصحيح بعد. ستظهر هنا بعد تقديم المرشحين لاختبارات تحتوي أسئلة مقالية." : "No grading sessions yet. They will appear here after candidates submit exams with essay or open-ended questions.")
                  : t("grading.noSubmissionsDesc")
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("grading.candidate")}</TableHead>
                    <TableHead>{t("grading.exam")}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{t("grading.progress")}</TableHead>
                    <TableHead>{t("grading.autoScore")}</TableHead>
                    <TableHead>{t("grading.waiting")}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const autoScore =
                      sub.maxPossibleScore > 0 && sub.totalScore != null
                        ? Math.round((sub.totalScore / sub.maxPossibleScore) * 100)
                        : 0
                    const manualCount = sub.manualGradingRequired ?? 0
                    const isCompleted = sub.status === GradingStatus.Completed || sub.status === GradingStatus.AutoGraded
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{sub.candidateName}</p>
                              <p className="text-sm text-muted-foreground">{sub.candidateId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getLocalizedField(sub, "examTitle", language)}</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(sub.gradedAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isCompleted ? (
                            sub.isResultFinalized ? (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                {language === "ar" ? "مكتمل ومُنشر" : "Finalized"}
                              </Badge>
                            ) : (
                              <Badge variant="default" className="gap-1 bg-amber-500">
                                <Clock className="h-3.5 w-3.5" />
                                {language === "ar" ? "مكتمل - لم يُنشر" : "Pending Finalize"}
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary">{sub.statusName ?? (language === "ar" ? "قيد الانتظار" : "Pending")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {manualCount} {t("grading.questionsToGrade")}
                              </span>
                            </div>
                            <Progress value={manualCount > 0 ? 0 : 100} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {autoScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{formatDateTime(sub.gradedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={async () => {
                                  const ok = await finalizeResult(sub.id)
                                  if (ok) {
                                    toast.success(language === "ar" ? "تم تحديث النتيجة. جاري فتح صفحة النتائج." : "Result updated. Opening Candidate Result page.")
                                    router.push("/results/candidate-result?fromGrading=1")
                                  } else {
                                    toast.error(language === "ar" ? "تعذر تحديث النتيجة" : "Could not finalize result")
                                  }
                                }}
                              >
                                <BarChart3 className="h-4 w-4" />
                                {language === "ar" ? "عرض النتيجة" : "See result"}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/grading/${sub.attemptId}`}>
                                {isCompleted ? (language === "ar" ? "عرض" : "View") : t("grading.grade")}
                                <ChevronRight className={`h-4 w-4 ms-1 ${dir === "rtl" ? "rotate-180" : ""}`} />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
