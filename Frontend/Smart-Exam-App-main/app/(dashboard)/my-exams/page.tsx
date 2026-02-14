"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getAvailableExams, type CandidateExam, AttemptStatus, ExamType } from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Clock,
  Calendar,
  PlayCircle,
  CheckCircle2,
  Search,
  XCircle,
  AlertCircle,
  RotateCcw,
  Eye,
  FileText,
  Award,
  Target,
  User,
  ShieldPlus,
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

export type CandidateExamFilter =
  | "all"
  | "available"
  | "inProgress"
  | "submitted"
  | "completed"
  | "expired"
  | "terminated"
  | "resume"

type ExamStatusKey = Exclude<CandidateExamFilter, "all" | "resume">

export default function MyExamsPage() {
  const { t, language } = useI18n()
  const [exams, setExams] = useState<CandidateExam[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CandidateExamFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
      const examsResponse = await getAvailableExams()
      setExams(Array.isArray(examsResponse) ? examsResponse : [])
    } catch (error) {
      console.error("[my-exams] API error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load exams")
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()

  // Count exams with admin overrides for the resume tab
  const resumeExams = exams.filter((e) => e.hasAdminOverride === true)

  const statusLabels: Record<ExamStatusKey, string> = {
    available: t("candidateDashboard.available"),
    inProgress: t("candidateDashboard.inProgress"),
    submitted: t("candidateDashboard.submitted"),
    completed: t("candidateDashboard.completed"),
    expired: t("candidateDashboard.expired"),
    terminated: t("candidateDashboard.terminated"),
  }

  const statusStyles: Record<ExamStatusKey, string> = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inProgress: "border-sky-200 bg-sky-50 text-sky-700",
    submitted: "border-amber-200 bg-amber-50 text-amber-700",
    completed: "border-emerald-200 bg-emerald-100 text-emerald-700",
    expired: "border-rose-200 bg-rose-50 text-rose-700",
    terminated: "border-gray-200 bg-gray-100 text-gray-700",
  }

  function getExamStatusKey(exam: CandidateExam): ExamStatusKey {
    const latestStatus = exam.latestAttemptStatus ?? null
    const latestPublished = exam.latestAttemptIsResultPublished === true

    if (latestStatus === AttemptStatus.Started || latestStatus === AttemptStatus.InProgress) {
      return "inProgress"
    }
    if (latestStatus === AttemptStatus.Submitted) {
      return latestPublished ? "completed" : "submitted"
    }
    if (latestStatus === AttemptStatus.Cancelled) {
      return "terminated"
    }
    if (latestStatus === AttemptStatus.Expired) {
      return "expired"
    }
    if (exam.endAt && new Date(exam.endAt) < now) {
      return "expired"
    }
    return "available"
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  const examsWithStatus = exams.map((exam) => ({
    exam,
    status: getExamStatusKey(exam),
  }))

  const filterCounts = {
    all: exams.length,
    available: examsWithStatus.filter((e) => e.status === "available").length,
    inProgress: examsWithStatus.filter((e) => e.status === "inProgress").length,
    submitted: examsWithStatus.filter((e) => e.status === "submitted").length,
    completed: examsWithStatus.filter((e) => e.status === "completed").length,
    expired: examsWithStatus.filter((e) => e.status === "expired").length,
    terminated: examsWithStatus.filter((e) => e.status === "terminated").length,
    resume: resumeExams.length,
  }

  const filteredExams = (() => {
    let list: CandidateExam[]
    if (filter === "resume") {
      list = resumeExams
    } else {
      list = examsWithStatus
        .filter((e) => filter === "all" || e.status === filter)
        .map((e) => e.exam)
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
  })()

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
        <h1 className="text-2xl font-bold text-foreground">{t("myExams.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("myExams.subtitle")}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {(
          [
            { key: "all" as const, labelKey: "candidateDashboard.all" },
            { key: "available" as const, labelKey: "candidateDashboard.available" },
            { key: "inProgress" as const, labelKey: "candidateDashboard.inProgress" },
            { key: "submitted" as const, labelKey: "candidateDashboard.submitted" },
            { key: "completed" as const, labelKey: "candidateDashboard.completed" },
            { key: "expired" as const, labelKey: "candidateDashboard.expired" },
            { key: "terminated" as const, labelKey: "candidateDashboard.terminated" },
            { key: "resume" as const, labelKey: "examOperations.resumeTab" },
          ] as const
        ).map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent ${
              filter === key ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
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

      {filteredExams.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t("myExams.noExams")}
          description={t("myExams.noExamsDesc")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam) => {
            const statusKey = getExamStatusKey(exam)
            const statusLabel = statusLabels[statusKey]
            const statusClass = statusStyles[statusKey]
            const attemptsUsed = exam.myAttempts ?? 0
            const attemptsRemaining =
              exam.maxAttempts > 0 ? Math.max(0, exam.maxAttempts - attemptsUsed) : null
            const hasAttemptsRemaining = attemptsRemaining == null || attemptsRemaining > 0
            const startAt = exam.startAt ? new Date(exam.startAt) : null
            const endAt = exam.endAt ? new Date(exam.endAt) : null
            const isFixed = exam.examType === ExamType.Fixed
            const fixedGraceMinutes = 10
            // For Fixed: allowed start window is [StartAt, StartAt + grace]
            const fixedWindowEnd = isFixed && startAt
              ? new Date(Math.min(
                  startAt.getTime() + fixedGraceMinutes * 60_000,
                  endAt ? endAt.getTime() : Infinity
                ))
              : null
            const inWindow = isFixed
              ? (!!startAt && now >= startAt && (!fixedWindowEnd || now <= fixedWindowEnd) && (!endAt || now <= endAt))
              : ((!startAt || now >= startAt) && (!endAt || now <= endAt))
            const startsInFuture = !!startAt && now < startAt
            const pastGraceWindow = isFixed && fixedWindowEnd && now > fixedWindowEnd && (!endAt || now <= endAt)
            const latestAttemptId = exam.latestAttemptId ?? null
            const latestPublished = exam.latestAttemptIsResultPublished === true

            const canResume = statusKey === "inProgress" && latestAttemptId != null
            const canView = statusKey === "completed" && latestPublished && latestAttemptId != null
            // Use server-driven canRetake flag (falls back to FE logic for safety)
            const isPassedAndPublished = exam.myBestIsPassed === true && latestPublished
            const hasOverride = exam.hasAdminOverride === true
            const canRetake = hasOverride || (exam.canRetake ??
              ((statusKey === "completed" || statusKey === "expired" || statusKey === "terminated") &&
              hasAttemptsRemaining &&
              inWindow &&
              !isPassedAndPublished))
            const canStart = statusKey === "available" && inWindow && hasAttemptsRemaining

            let primaryAction: {
              label: string
              href?: string
              icon: React.ReactNode
              disabled?: boolean
            } | null = null
            let secondaryAction: {
              label: string
              href: string
              icon: React.ReactNode
            } | null = null

            if (canResume) {
              primaryAction = {
                label: t("myExams.continue"),
                href: `/take-exam/${latestAttemptId}`,
                icon: <PlayCircle className="mr-2 h-4 w-4" />,
              }
            } else if (statusKey === "submitted") {
              primaryAction = {
                label: t("myExams.underReview"),
                icon: <AlertCircle className="mr-2 h-4 w-4" />,
                disabled: true,
              }
            } else if (statusKey === "completed") {
              if (canRetake) {
                primaryAction = {
                  label: t("myExams.retake"),
                  href: `/take-exam/${exam.id}/instructions`,
                  icon: <RotateCcw className="mr-2 h-4 w-4" />,
                }
                if (canView) {
                  secondaryAction = {
                    label: t("myExams.viewResults"),
                    href: `/results/${latestAttemptId}`,
                    icon: <Eye className="mr-2 h-4 w-4" />,
                  }
                }
              } else if (canView) {
                primaryAction = {
                  label: t("myExams.viewResults"),
                  href: `/results/${latestAttemptId}`,
                  icon: <Eye className="mr-2 h-4 w-4" />,
                }
              }
            } else if (statusKey === "expired" || statusKey === "terminated") {
              if (canRetake) {
                primaryAction = {
                  label: t("myExams.retake"),
                  href: `/take-exam/${exam.id}/instructions`,
                  icon: <RotateCcw className="mr-2 h-4 w-4" />,
                }
              } else {
                primaryAction = {
                  label: statusLabel,
                  icon: <XCircle className="mr-2 h-4 w-4" />,
                  disabled: true,
                }
              }
            } else if (statusKey === "available") {
              if (canStart) {
                primaryAction = {
                  label: t("myExams.startExam"),
                  href: `/take-exam/${exam.id}/instructions`,
                  icon: <PlayCircle className="mr-2 h-4 w-4" />,
                }
              } else if (!hasAttemptsRemaining) {
                primaryAction = {
                  label: t("myExams.noAttemptsLeft"),
                  icon: <XCircle className="mr-2 h-4 w-4" />,
                  disabled: true,
                }
              } else if (startsInFuture) {
                primaryAction = {
                  label: t("myExams.notYetAvailable"),
                  icon: <Clock className="mr-2 h-4 w-4" />,
                  disabled: true,
                }
              } else {
                primaryAction = {
                  label: t("myExams.startExam"),
                  icon: <PlayCircle className="mr-2 h-4 w-4" />,
                  disabled: true,
                }
              }
            }

            return (
              <Card key={exam.id} className="overflow-hidden border-2 shadow-md hover:shadow-lg transition-shadow">
                {/* Header with Status Badge */}
                <div className="flex items-start justify-between gap-3 border-b bg-gradient-to-r from-muted/50 to-muted/30 px-5 py-4">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-xl font-bold leading-tight text-foreground">
                      {getLocalizedField(exam, "title", language)}
                    </h3>
                    {exam.descriptionEn || exam.descriptionAr ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getLocalizedField(exam, "description", language)}
                      </p>
                    ) : null}
                  </div>
                  <Badge className={`border text-sm px-3 py-1 ${statusClass}`}>{statusLabel}</Badge>
                  {hasOverride && (
                    <Badge className="border border-violet-200 bg-violet-50 text-violet-700 text-xs px-2 py-0.5">
                      <ShieldPlus className="mr-1 h-3 w-3" />
                      {t("examOperations.adminOverride") || "Admin Override"}
                    </Badge>
                  )}
                </div>

                <CardContent className="space-y-5 p-5">
                  {/* Main Stats Grid - 2x2 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("common.questions")}</p>
                        <p className="text-lg font-bold text-foreground">{exam.totalQuestions}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("common.points")}</p>
                        <p className="text-lg font-bold text-foreground">{exam.totalPoints}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("exams.passScore")}</p>
                        <p className="text-lg font-bold text-foreground">{exam.passScore}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("exams.duration")}</p>
                        <p className="text-lg font-bold text-foreground">{exam.durationMinutes} {t("common.min")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attempts Progress */}
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t("myExams.attempts")}
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {attemptsUsed} / {exam.maxAttempts === 0 ? "∞" : exam.maxAttempts}
                      </span>
                    </div>
                    {exam.maxAttempts > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            attemptsRemaining === 0 ? 'bg-red-500' : attemptsRemaining === 1 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (attemptsUsed / exam.maxAttempts) * 100)}%` }}
                        />
                      </div>
                    )}
                    {attemptsRemaining != null && attemptsRemaining > 0 && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {attemptsRemaining} {t("common.attemptsRemaining")}
                      </p>
                    )}
                    {attemptsRemaining === 0 && (
                      <p className="text-xs text-red-600 mt-1.5 font-medium">
                        {t("myExams.noAttemptsLeft")}
                      </p>
                    )}
                  </div>

                  {/* Schedule Info - Only show if scheduled */}
                  {(exam.startAt || exam.endAt) ? (
                    <div className="rounded-lg border p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("myExams.schedule")}
                      </p>
                      <div className="grid gap-2 text-sm">
                        {exam.startAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {t("candidateDashboard.start")}
                            </span>
                            <span className="font-medium text-foreground">{formatDateTime(exam.startAt)}</span>
                          </div>
                        )}
                        {exam.endAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {t("candidateDashboard.expired")}
                            </span>
                            <span className="font-medium text-foreground">{formatDateTime(exam.endAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-3">
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("myExams.flexExam")}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                        {t("myExams.flexExamDesc")}
                      </p>
                    </div>
                  )}

                  {/* Status Messages */}
                  {statusKey === "submitted" && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{t("results.pendingGrading")}</span>
                    </div>
                  )}

                  {startsInFuture && statusKey === "available" && (
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-blue-700 dark:text-blue-400">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{t("myExams.startsOn")} {formatDateTime(exam.startAt)}</span>
                    </div>
                  )}

                  {pastGraceWindow && statusKey === "available" && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {t("myExams.graceWindowPassed") || "The allowed start window has passed"}
                      </span>
                    </div>
                  )}

                  {statusKey === "completed" && exam.myBestIsPassed != null && (
                    <div className={`flex items-center gap-2 rounded-lg p-3 ${
                      exam.myBestIsPassed 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                    }`}>
                      {exam.myBestIsPassed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span className="text-base font-bold">
                        {exam.myBestIsPassed ? t("myExams.passed") : t("myExams.failed")}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {secondaryAction && (
                      <Button variant="outline" size="lg" asChild className="flex-1">
                        <Link href={secondaryAction.href}>
                          {secondaryAction.icon}
                          {secondaryAction.label}
                        </Link>
                      </Button>
                    )}
                    {primaryAction && primaryAction.href ? (
                      <Button size="lg" asChild className="flex-1">
                        <Link href={primaryAction.href}>
                          {primaryAction.icon}
                          {primaryAction.label}
                        </Link>
                      </Button>
                    ) : primaryAction ? (
                      <Button variant="secondary" size="lg" disabled className="flex-1">
                        {primaryAction.icon}
                        {primaryAction.label}
                      </Button>
                    ) : (
                      <Button variant="secondary" size="lg" disabled className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("common.notAvailable")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
