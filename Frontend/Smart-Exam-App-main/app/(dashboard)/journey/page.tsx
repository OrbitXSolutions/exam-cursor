"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
  getExamJourney,
  type ExamJourney,
  type JourneyExamCard,
  type PrimaryAction,
  JourneyStage,
  PrimaryActionType,
} from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Play,
  RotateCcw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Timer,
  Award,
  Target,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Hourglass,
  History,
  ArrowRight,
  Sparkles,
} from "lucide-react"

// ============================================
// HELPERS
// ============================================

function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

function formatDuration(minutes: number): string {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }
  return `${mins}m`
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function JourneyPage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const [journey, setJourney] = useState<ExamJourney | null>(null)
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    loadJourney()
  }, [])

  async function loadJourney() {
    try {
      setLoading(true)
      const data = await getExamJourney()
      setJourney(data)
    } catch (error) {
      console.error("[journey] API error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load journey")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={XCircle}
          title={t("journey.loadError") || "Failed to load"}
          description={t("journey.tryAgain") || "Please try again later"}
          action={{
            label: t("common.retry") || "Retry",
            onClick: loadJourney,
          }}
        />
      </div>
    )
  }

  const { primaryAction, groups } = journey

  // Check if there are any active sections
  const hasInProgress = groups.inProgress.length > 0
  const hasReadyToStart = groups.readyToStart.length > 0
  const hasFinished = groups.finished.length > 0
  const hasWaitingResult = groups.waitingResult.length > 0
  const hasLocked = groups.locked.length > 0
  const hasHistory = groups.history.length > 0

  const hasAnySections =
    hasInProgress || hasReadyToStart || hasFinished || hasWaitingResult || hasLocked

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container max-w-6xl py-8 space-y-8">
        {/* ============================================
            ZONE 1: PRIMARY ACTION
        ============================================ */}
        {primaryAction && (
          <PrimaryActionCard action={primaryAction} language={language} t={t} />
        )}

        {/* Welcome if no primary action */}
        {!primaryAction && (
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm">
            <CardContent className="py-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/60" />
              <h2 className="text-2xl font-semibold mb-2">
                {t("journey.welcome") || "Welcome to Your Exam Journey"}
              </h2>
              <p className="text-muted-foreground">
                {t("journey.noExamsYet") ||
                  "You don't have any exams available yet. Check back later."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ============================================
            ZONE 2: JOURNEY SECTIONS
        ============================================ */}
        {hasAnySections && (
          <div className="space-y-6">
            {/* IN PROGRESS */}
            {hasInProgress && (
              <JourneySection
                title={t("journey.inProgress") || "In Progress"}
                subtitle={t("journey.inProgressDesc") || "Continue where you left off"}
                icon={Timer}
                iconColor="text-blue-500"
                bgColor="bg-blue-50 dark:bg-blue-950/30"
                borderColor="border-blue-200 dark:border-blue-800"
                cards={groups.inProgress}
                language={language}
                t={t}
              />
            )}

            {/* READY TO START */}
            {hasReadyToStart && (
              <JourneySection
                title={t("journey.readyToStart") || "Ready to Start"}
                subtitle={t("journey.readyToStartDesc") || "Exams you can begin now"}
                icon={Play}
                iconColor="text-emerald-500"
                bgColor="bg-emerald-50 dark:bg-emerald-950/30"
                borderColor="border-emerald-200 dark:border-emerald-800"
                cards={groups.readyToStart}
                language={language}
                t={t}
              />
            )}

            {/* WAITING RESULT */}
            {hasWaitingResult && (
              <JourneySection
                title={t("journey.waitingResult") || "Waiting for Results"}
                subtitle={t("journey.waitingResultDesc") || "Pending grading or publication"}
                icon={Hourglass}
                iconColor="text-amber-500"
                bgColor="bg-amber-50 dark:bg-amber-950/30"
                borderColor="border-amber-200 dark:border-amber-800"
                cards={groups.waitingResult}
                language={language}
                t={t}
              />
            )}

            {/* FINISHED */}
            {hasFinished && (
              <JourneySection
                title={t("journey.finished") || "Completed"}
                subtitle={t("journey.finishedDesc") || "View your results"}
                icon={CheckCircle2}
                iconColor="text-green-500"
                bgColor="bg-green-50 dark:bg-green-950/30"
                borderColor="border-green-200 dark:border-green-800"
                cards={groups.finished}
                language={language}
                t={t}
              />
            )}

            {/* LOCKED */}
            {hasLocked && (
              <JourneySection
                title={t("journey.locked") || "Not Available"}
                subtitle={t("journey.lockedDesc") || "These exams are currently unavailable"}
                icon={Lock}
                iconColor="text-slate-400"
                bgColor="bg-slate-100 dark:bg-slate-900/50"
                borderColor="border-slate-200 dark:border-slate-700"
                cards={groups.locked}
                language={language}
                t={t}
              />
            )}
          </div>
        )}

        {/* ============================================
            ZONE 3: HISTORY (Collapsible)
        ============================================ */}
        {hasHistory && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <Card className="border-slate-200 dark:border-slate-700">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <History className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {t("journey.history") || "History"}
                        </CardTitle>
                        <CardDescription>
                          {t("journey.historyDesc") || "Past attempts and expired exams"} (
                          {groups.history.length})
                        </CardDescription>
                      </div>
                    </div>
                    {historyOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.history.map((card) => (
                      <JourneyCard key={card.examId} card={card} language={language} t={t} />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Empty state */}
        {!hasAnySections && !hasHistory && !primaryAction && (
          <EmptyState
            icon={FileText}
            title={t("journey.noExams") || "No Exams Found"}
            description={
              t("journey.noExamsDesc") ||
              "There are no exams available for you at this time."
            }
          />
        )}
      </div>
    </div>
  )
}

// ============================================
// PRIMARY ACTION CARD COMPONENT
// ============================================

interface PrimaryActionCardProps {
  action: PrimaryAction
  language: string
  t: (key: string) => string
}

function PrimaryActionCard({ action, language, t }: PrimaryActionCardProps) {
  const router = useRouter()
  const title = getLocalizedField(action, "title", language)

  const getActionConfig = () => {
    switch (action.actionType) {
      case PrimaryActionType.Resume:
        return {
          icon: RotateCcw,
          label: t("journey.resumeExam") || "Resume Exam",
          bg: "bg-gradient-to-br from-blue-500 to-blue-600",
          hoverBg: "hover:from-blue-600 hover:to-blue-700",
          href: `/take-exam/${action.attemptId}`,
        }
      case PrimaryActionType.Start:
        return {
          icon: Play,
          label: t("journey.startExam") || "Start Exam",
          bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
          hoverBg: "hover:from-emerald-600 hover:to-emerald-700",
          href: `/exams/${action.examId}/preview`,
        }
      case PrimaryActionType.ViewResult:
        return {
          icon: Eye,
          label: t("journey.viewResult") || "View Result",
          bg: "bg-gradient-to-br from-violet-500 to-violet-600",
          hoverBg: "hover:from-violet-600 hover:to-violet-700",
          href: `/results/my-result/${action.attemptId}`,
        }
      default:
        return {
          icon: ArrowRight,
          label: t("journey.continue") || "Continue",
          bg: "bg-gradient-to-br from-primary to-primary/80",
          hoverBg: "hover:from-primary/90 hover:to-primary/70",
          href: "/my-exams",
        }
    }
  }

  const config = getActionConfig()
  const Icon = config.icon

  return (
    <Card
      className={cn(
        "border-0 shadow-xl overflow-hidden text-white",
        config.bg,
        "transition-all duration-300 transform hover:scale-[1.01] hover:shadow-2xl cursor-pointer"
      )}
      onClick={() => router.push(config.href)}
    >
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left side: Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {action.statusLabel}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-white/70 mb-1">
                {action.actionType === PrimaryActionType.Resume
                  ? t("journey.yourTopPriority") || "Your Top Priority"
                  : action.actionType === PrimaryActionType.Start
                  ? t("journey.readyForYou") || "Ready For You"
                  : t("journey.resultAvailable") || "Result Available"}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {action.actionType === PrimaryActionType.Resume && (
                <>
                  {action.remainingSeconds != null && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(action.remainingSeconds)} {t("journey.remaining") || "remaining"}
                      </span>
                    </div>
                  )}
                  {action.answeredQuestions != null && action.totalQuestions != null && (
                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4" />
                      <span>
                        {action.answeredQuestions}/{action.totalQuestions}{" "}
                        {t("journey.answered") || "answered"}
                      </span>
                    </div>
                  )}
                </>
              )}

              {action.actionType === PrimaryActionType.Start && action.totalQuestions && (
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>
                    {action.totalQuestions} {t("journey.questions") || "questions"}
                  </span>
                </div>
              )}

              {action.actionType === PrimaryActionType.ViewResult && (
                <>
                  {action.score != null && action.maxScore != null && (
                    <div className="flex items-center gap-1.5">
                      <Award className="h-4 w-4" />
                      <span>
                        {action.score}/{action.maxScore} {t("journey.points") || "points"}
                      </span>
                    </div>
                  )}
                  {action.isPassed != null && (
                    <div className="flex items-center gap-1.5">
                      {action.isPassed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span>
                        {action.isPassed
                          ? t("journey.passed") || "Passed"
                          : t("journey.failed") || "Failed"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right side: CTA Button */}
          <div className="flex-shrink-0">
            <Button
              size="lg"
              variant="secondary"
              className="w-full md:w-auto text-lg font-semibold px-8 py-6 bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
            >
              <Icon className="h-5 w-5 me-2" />
              {config.label}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// JOURNEY SECTION COMPONENT
// ============================================

interface JourneySectionProps {
  title: string
  subtitle: string
  icon: React.ElementType
  iconColor: string
  bgColor: string
  borderColor: string
  cards: JourneyExamCard[]
  language: string
  t: (key: string) => string
}

function JourneySection({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  cards,
  language,
  t,
}: JourneySectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", bgColor)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {cards.length}
        </Badge>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <JourneyCard key={card.examId} card={card} language={language} t={t} />
        ))}
      </div>
    </div>
  )
}

// ============================================
// JOURNEY CARD COMPONENT
// ============================================

interface JourneyCardProps {
  card: JourneyExamCard
  language: string
  t: (key: string) => string
}

function JourneyCard({ card, language, t }: JourneyCardProps) {
  const title = getLocalizedField(card, "title", language)
  const description = getLocalizedField(card, "description", language)

  const getCtaConfig = () => {
    switch (card.ctaType) {
      case "resume":
        return { icon: RotateCcw, label: t("journey.resume") || "Resume", variant: "default" as const }
      case "start":
        return { icon: Play, label: t("journey.start") || "Start", variant: "default" as const }
      case "view-result":
        return { icon: Eye, label: t("journey.viewResult") || "View Result", variant: "outline" as const }
      case "waiting":
        return { icon: Hourglass, label: t("journey.pending") || "Pending", variant: "secondary" as const }
      case "locked":
        return { icon: Lock, label: t("journey.unavailable") || "Unavailable", variant: "ghost" as const }
      default:
        return { icon: ArrowRight, label: t("journey.view") || "View", variant: "outline" as const }
    }
  }

  const ctaConfig = getCtaConfig()
  const CtaIcon = ctaConfig.icon
  const isActionable = card.ctaType === "resume" || card.ctaType === "start" || card.ctaType === "view-result"

  const stageStyles: Record<JourneyStage, { border: string; badge: string; badgeText: string }> = {
    [JourneyStage.InProgress]: {
      border: "border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
      badgeText: t("journey.inProgress") || "In Progress",
    },
    [JourneyStage.ReadyToStart]: {
      border: "border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
      badgeText: t("journey.ready") || "Ready",
    },
    [JourneyStage.Finished]: {
      border: "border-green-200 dark:border-green-800",
      badge: card.isPassed
        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
        : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
      badgeText: card.isPassed ? t("journey.passed") || "Passed" : t("journey.failed") || "Failed",
    },
    [JourneyStage.WaitingResult]: {
      border: "border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
      badgeText: t("journey.pending") || "Pending",
    },
    [JourneyStage.Locked]: {
      border: "border-slate-200 dark:border-slate-700",
      badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
      badgeText: t("journey.locked") || "Locked",
    },
    [JourneyStage.History]: {
      border: "border-slate-200 dark:border-slate-700",
      badge: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
      badgeText: t("journey.history") || "History",
    },
  }

  const style = stageStyles[card.stage]

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        style.border,
        isActionable && "hover:border-primary cursor-pointer"
      )}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate">{title}</h4>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
              )}
            </div>
            <Badge className={cn("shrink-0 border-0", style.badge)}>{style.badgeText}</Badge>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(card.durationMinutes)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>
                {card.totalQuestions} {t("journey.questions") || "questions"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              <span>
                {card.attemptsUsed}/{card.maxAttempts || "∞"}
              </span>
            </div>
          </div>

          {/* In Progress: Time & Progress */}
          {card.stage === JourneyStage.InProgress && (
            <div className="space-y-2">
              {card.remainingSeconds != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatTime(card.remainingSeconds)} {t("journey.left") || "left"}
                  </span>
                </div>
              )}
              {card.answeredQuestions != null && card.totalQuestions > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (card.answeredQuestions / card.totalQuestions) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Finished: Score */}
          {card.stage === JourneyStage.Finished && card.score != null && card.maxScore != null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <Award className={cn("h-5 w-5", card.isPassed ? "text-green-500" : "text-red-500")} />
              <div>
                <p className="text-sm font-medium">
                  {card.score}/{card.maxScore} ({card.percentage?.toFixed(0)}%)
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("journey.passScore") || "Pass"}: {card.passScore}%
                </p>
              </div>
            </div>
          )}

          {/* Locked: Reasons */}
          {card.stage === JourneyStage.Locked && card.lockReasons && card.lockReasons.length > 0 && (
            <div className="text-sm text-muted-foreground space-y-1">
              {card.lockReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          {isActionable && card.ctaTarget && (
            <Link href={card.ctaTarget} className="block">
              <Button variant={ctaConfig.variant} className="w-full" size="sm">
                <CtaIcon className="h-4 w-4 me-2" />
                {ctaConfig.label}
              </Button>
            </Link>
          )}

          {!isActionable && (
            <Button variant={ctaConfig.variant} className="w-full" size="sm" disabled>
              <CtaIcon className="h-4 w-4 me-2" />
              {ctaConfig.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
