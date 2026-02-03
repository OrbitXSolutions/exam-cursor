"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getAvailableExams,
  getDashboard,
  type CandidateExam,
  type QuickAction,
} from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Clock,
  Calendar,
  PlayCircle,
  CheckCircle2,
  Search,
  XCircle,
  AlertCircle,
} from "lucide-react"

function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

export type CandidateExamFilter = "all" | "yetToStart" | "resume" | "completed" | "expired" | "terminated"

export default function MyExamsPage() {
  const { t, language } = useI18n()
  const [exams, setExams] = useState<CandidateExam[]>([])
  const [activeAttempts, setActiveAttempts] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CandidateExamFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
      const [examsResponse, dashboardResponse] = await Promise.all([
        getAvailableExams(),
        getDashboard().catch(() => null),
      ])
      setExams(Array.isArray(examsResponse) ? examsResponse : [])
      setActiveAttempts(dashboardResponse?.quickActions ?? [])
    } catch (error) {
      console.error("[my-exams] API error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load exams")
      setExams([])
      setActiveAttempts([])
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  // Exams that haven't started yet (future start date) - for display only
  const upcomingExams = exams.filter((exam) => {
    if (!exam.startAt) return false
    return new Date(exam.startAt) > now
  })

  const activeExams = exams.filter((exam) => {
    const start = exam.startAt ? new Date(exam.startAt) : new Date(0)
    const end = exam.endAt ? new Date(exam.endAt) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    return now >= start && now <= end
  })

  const resumeExamIds = new Set(activeAttempts.map((a) => a.examId))
  const resumeExams = exams.filter((e) => resumeExamIds.has(e.id))

  // Yet To Start: exams currently in window that the candidate hasn't started (no attempts)
  const yetToStartExams = exams.filter((exam) => {
    const hasStarted = exam.myAttempts != null && exam.myAttempts > 0
    if (hasStarted) return false
    const start = exam.startAt ? new Date(exam.startAt) : new Date(0)
    const end = exam.endAt ? new Date(exam.endAt) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    return now >= start && now <= end
  })

  const completedExams = exams.filter((exam) => exam.myAttempts != null && exam.myAttempts > 0 && exam.myBestIsPassed != null)

  const expiredExams = exams.filter((exam) => {
    if (!exam.endAt) return false
    const end = new Date(exam.endAt)
    if (end <= now && !(exam.myAttempts != null && exam.myAttempts > 0)) return true
    return false
  })

  const filterCounts = {
    all: exams.length,
    yetToStart: yetToStartExams.length,
    resume: resumeExams.length,
    completed: completedExams.length,
    expired: expiredExams.length,
    terminated: 0,
  }

  const getFilteredExams = (): CandidateExam[] => {
    let list: CandidateExam[] = []
    switch (filter) {
      case "all":
        list = [...exams]
        break
      case "yetToStart":
        list = yetToStartExams
        break
      case "resume":
        list = resumeExams
        break
      case "completed":
        list = completedExams
        break
      case "expired":
        list = expiredExams
        break
      case "terminated":
        list = []
        break
      default:
        list = [...exams]
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (e) =>
          getLocalizedField(e, "title", language).toLowerCase().includes(q) ||
          (e.descriptionEn ?? "").toLowerCase().includes(q) ||
          (e.descriptionAr ?? "").toLowerCase().includes(q)
      )
    }
    return list
  }

  const filteredExams = getFilteredExams()

  function getExamStatus(exam: CandidateExam): { label: string; variant: "completed" | "expired" | "yetToStart" | "resume" } {
    if (resumeExamIds.has(exam.id)) return { label: t("myExams.continue"), variant: "resume" }
    if (exam.myAttempts != null && exam.myAttempts > 0 && exam.myBestIsPassed != null) {
      return { label: exam.myBestIsPassed ? t("myExams.passed") : t("myExams.failed"), variant: "completed" }
    }
    if (exam.endAt && new Date(exam.endAt) <= now) return { label: t("candidateDashboard.expired"), variant: "expired" }
    if (yetToStartExams.some((e) => e.id === exam.id)) return { label: t("candidateDashboard.yetToStart"), variant: "yetToStart" }
    return { label: t("myExams.availableNow"), variant: "resume" }
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const filterColors: Record<CandidateExamFilter, string> = {
    all: "bg-amber-600 text-white",
    yetToStart: "bg-emerald-600 text-white",
    resume: "bg-sky-500 text-white",
    completed: "bg-emerald-500 text-white",
    expired: "bg-rose-500 text-white",
    terminated: "bg-red-600 text-white",
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
      {/* Filter bar (image 1 style) */}
      <div className="flex flex-wrap items-center gap-3">
        {(
          [
            { key: "all" as const, labelKey: "candidateDashboard.all" },
            { key: "yetToStart" as const, labelKey: "candidateDashboard.yetToStart" },
            { key: "resume" as const, labelKey: "candidateDashboard.resume" },
            { key: "completed" as const, labelKey: "candidateDashboard.completed" },
            { key: "expired" as const, labelKey: "candidateDashboard.expired" },
            { key: "terminated" as const, labelKey: "candidateDashboard.terminated" },
          ] as const
        ).map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent ${filter === key ? "ring-2 ring-primary" : ""}`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${filterColors[key]}`}>
              {filterCounts[key]}
            </span>
            <span>{t(labelKey)}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 pl-9"
            />
          </div>
        </div>
      </div>

      {/* Exam cards grid */}
      {filteredExams.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t("myExams.noUpcoming")}
          description={t("myExams.noUpcomingDesc")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => {
            const status = getExamStatus(exam)
            const isResume = resumeExamIds.has(exam.id)
            const attempt = activeAttempts.find((a) => a.examId === exam.id)

            return (
              <Card key={exam.id} className="overflow-hidden border shadow-sm">
                <div
                  className={`rounded-t-lg px-4 py-3 text-white ${status.variant === "completed"
                    ? "bg-emerald-600"
                    : status.variant === "expired"
                      ? "bg-rose-500"
                      : "bg-primary"
                    }`}
                >
                  <h3 className="font-semibold leading-tight">
                    {getLocalizedField(exam, "title", language)}
                  </h3>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">{t("candidateDashboard.start")}: </span>
                      {formatDateTime(exam.startAt)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">{t("candidateDashboard.expired")}: </span>
                      {formatDateTime(exam.endAt)}
                    </p>
                    <p>
                      {t("candidateDashboard.noOfQuestions")}: {exam.totalQuestions}
                    </p>
                    <p>
                      {t("candidateDashboard.testDuration")}: {exam.durationMinutes} {t("common.minutes")}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    variant={status.variant === "expired" ? "secondary" : "default"}
                    disabled={status.variant === "expired"}
                    asChild={isResume || status.variant === "yetToStart" || (status.variant !== "yetToStart" && status.variant !== "expired")}
                  >
                    {isResume && attempt ? (
                      <Link href={`/take-exam/${attempt.attemptId}`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {t("myExams.continue")}
                      </Link>
                    ) : status.variant === "completed" ? (
                      <Link href="/my-results">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {status.label}
                      </Link>
                    ) : status.variant === "expired" ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        {status.label}
                      </>
                    ) : status.variant === "yetToStart" ? (
                      <Link href={`/take-exam/${exam.id}/instructions`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {t("myExams.startExam")}
                      </Link>
                    ) : (
                      <Link href={`/take-exam/${exam.id}/instructions`}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        {t("myExams.startExam")}
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
