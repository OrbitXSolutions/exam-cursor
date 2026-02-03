"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
  getAttemptSession,
  saveAnswer,
  submitAttempt,
  type AttemptSession,
  type SaveAnswerRequest,
  type ExamSection,
  type ExamTopic,
  type AttemptQuestionDto,
  logAttemptEvent,
  AttemptEventType,
  getAttemptTimer,
} from "@/lib/api/candidate"
import { uploadProctorSnapshot } from "@/lib/api/proctoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { Flag, Clock, Send, Lock, BookOpen } from "lucide-react"
import { QuestionRenderer } from "./question-renderer"
import { cn } from "@/lib/utils"

// Helper function to get localized field
function getLocalizedField(
  obj: any,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

const EXAM_LANGUAGE_KEY = "examLanguage"

export default function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { t, dir, language, setLanguage } = useI18n()
  const router = useRouter()

  // Core state
  const [session, setSession] = useState<AttemptSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, SaveAnswerRequest>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())

  // Section navigation state
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null)

  // Timer state
  const [examTimeRemaining, setExamTimeRemaining] = useState(0)
  const [sectionTimers, setSectionTimers] = useState<Record<number, number>>({})

  // UI state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingAnswers, setSavingAnswers] = useState<Set<number>>(new Set())

  // Refs
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const snapshotIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Computed values
  const sections = session?.sections || []
  const hasSections = sections.length > 0

  // Get current section
  const currentSection = hasSections
    ? sections.find(s => s.sectionId === currentSectionId) || sections[0]
    : null

  const totalQuestions = session?.totalQuestions || 0
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // For flat question list (no sections/topics)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const flatQuestions = session?.questions || []
  const currentFlatQuestion = flatQuestions[currentQuestionIndex]

  // Check if can navigate back
  const canNavigateBack = useCallback(() => {
    if (!session?.examSettings) return true

    // If lock previous sections is enabled, cannot go back
    if (session.examSettings.lockPreviousSections) {
      return false
    }

    // If exam prevents back navigation entirely
    if (session.examSettings.preventBackNavigation) {
      return false
    }

    return true
  }, [session])

  // Apply exam language from instructions and force full screen as soon as page loads
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(EXAM_LANGUAGE_KEY) as "en" | "ar" | null
    if (saved && (saved === "en" || saved === "ar")) {
      setLanguage(saved)
    }
    const requestFullScreen = async () => {
      try {
        const el = document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
      } catch {
        // ignore
      }
    }
    requestFullScreen()
  }, [setLanguage])

  useEffect(() => {
    initializeExam()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (syncTimerRef.current) clearInterval(syncTimerRef.current)
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
    }
  }, [attemptId])

  useEffect(() => {
    if (!session) return

    // Security features
    const setupSecurityFeatures = async () => {
      // Request fullscreen mode
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch (error) {
        console.log("[v0] Fullscreen request failed:", error)
      }

      // Monitor fullscreen changes
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.FullscreenExited,
            metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
          }).catch(() => { })
          toast.warning(t("exam.tabSwitchWarning"))
        }
      }

      // Tab visibility detection
      const handleVisibilityChange = () => {
        if (document.hidden) {
          logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.TabSwitched,
            metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
          }).catch(() => { })
          toast.warning(t("exam.tabSwitchWarning"))
        }
      }

      // Copy/paste prevention
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.CopyAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => { })
        toast.warning(t("exam.copyPasteBlocked"))
      }

      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.PasteAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => { })
        toast.warning(t("exam.copyPasteBlocked"))
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange)
      document.addEventListener("visibilitychange", handleVisibilityChange)
      document.addEventListener("copy", handleCopy)
      document.addEventListener("paste", handlePaste)

      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        document.removeEventListener("copy", handleCopy)
        document.removeEventListener("paste", handlePaste)

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => { })
        }
      }
    }

    const cleanup = setupSecurityFeatures()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [session, t])

  // Proctoring: periodic webcam snapshot upload (when exam may require it)
  useEffect(() => {
    if (!session?.attemptId) return

    const captureAndUpload = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        const video = document.createElement("video")
        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        await video.play()

        const canvas = document.createElement("canvas")
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        ctx.drawImage(video, 0, 0)
        stream.getTracks().forEach((t) => t.stop())

        canvas.toBlob(
          async (blob) => {
            if (blob) await uploadProctorSnapshot(session.attemptId, blob, "snapshot.jpg")
          },
          "image/jpeg",
          0.6
        )
      } catch {
        // Silently fail - webcam may not be required or permitted
      }
    }

    snapshotIntervalRef.current = setInterval(captureAndUpload, 90000) // every 90 seconds
    captureAndUpload() // initial capture after 5s
    const initialTimeout = setTimeout(captureAndUpload, 5000)

    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
      clearTimeout(initialTimeout)
    }
  }, [session?.attemptId])

  async function initializeExam() {
    try {
      const attemptIdNum = Number.parseInt(attemptId, 10)
      if (Number.isNaN(attemptIdNum)) {
        throw new Error("Invalid attempt ID")
      }

      const sessionData = await getAttemptSession(attemptIdNum)
      setSession(sessionData)

      // Initialize current section (first section or null if no sections)
      if (sessionData.sections && sessionData.sections.length > 0) {
        setCurrentSectionId(sessionData.sections[0].sectionId)
      }

      // Initialize answers from currentAnswer on each question
      const initialAnswers: Record<number, SaveAnswerRequest> = {}

      // Get all questions (from sections/topics or flat list)
      const allQuestions: AttemptQuestionDto[] = []
      if (sessionData.sections && sessionData.sections.length > 0) {
        for (const section of sessionData.sections) {
          for (const topic of section.topics || []) {
            allQuestions.push(...(topic.questions || []))
          }
          allQuestions.push(...(section.questions || []))
        }
      } else {
        allQuestions.push(...(sessionData.questions || []))
      }

      for (const question of allQuestions) {
        if (question.currentAnswer) {
          initialAnswers[question.questionId] = {
            questionId: question.questionId,
            selectedOptionIds: question.currentAnswer.selectedOptionIds,
            textAnswer: question.currentAnswer.textAnswer,
          }
        }
      }
      setAnswers(initialAnswers)

      // Set exam timer
      setExamTimeRemaining(sessionData.remainingSeconds)

      // Initialize section timers
      if (sessionData.sections) {
        const sectionTimerState: Record<number, number> = {}
        for (const section of sessionData.sections) {
          if (section.durationMinutes && section.remainingSeconds !== null && section.remainingSeconds !== undefined) {
            sectionTimerState[section.sectionId] = section.remainingSeconds
          }
        }
        setSectionTimers(sectionTimerState)
      }

      // Start countdown timer
      timerRef.current = setInterval(() => {
        // Update exam timer
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })

        // Update section timers
        setSectionTimers((prev) => {
          const updated = { ...prev }
          for (const sectionId of Object.keys(updated)) {
            const id = Number(sectionId)
            if (updated[id] > 0) {
              updated[id] = updated[id] - 1
              // Check if section time expired
              if (updated[id] <= 0) {
                handleSectionTimeExpired(id)
              }
            }
          }
          return updated
        })
      }, 1000)

      // Sync timer with server every 60 seconds
      syncTimerRef.current = setInterval(async () => {
        try {
          const timerData = await getAttemptTimer(sessionData.attemptId)
          if (timerData.isExpired) {
            handleAutoSubmit()
          } else {
            setExamTimeRemaining(timerData.remainingSeconds)
          }
        } catch {
          // Silent fail
        }
      }, 60000)

      // Log exam started event
      await logAttemptEvent(sessionData.attemptId, {
        eventType: AttemptEventType.Started,
      }).catch(() => { })
    } catch (error) {
      console.error("[v0] Failed to start exam:", error)
      toast.error(t("common.error"))
      router.push("/my-exams")
    } finally {
      setLoading(false)
    }
  }

  function handleSectionTimeExpired(sectionId: number) {
    // Find next section
    const currentIndex = sections.findIndex(s => s.sectionId === sectionId)
    if (currentIndex !== -1 && currentIndex < sections.length - 1) {
      toast.warning(t("exam.sectionTimeExpired"))
      setCurrentSectionId(sections[currentIndex + 1].sectionId)
    }
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = useCallback(
    async (questionId: number, answer: SaveAnswerRequest) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))

      if (session) {
        try {
          setSavingAnswers(prev => new Set(prev).add(questionId))
          await saveAnswer(session.attemptId, answer)

          await logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.AnswerSaved,
            metadataJson: JSON.stringify({ questionId }),
          }).catch(() => { })
        } catch (error) {
          console.error("[v0] Failed to save answer:", error)
        } finally {
          setSavingAnswers(prev => {
            const newSet = new Set(prev)
            newSet.delete(questionId)
            return newSet
          })
        }
      }
    },
    [session]
  )

  const handleToggleFlag = useCallback((questionId: number) => {
    setFlagged((prev) => {
      const newFlagged = new Set(prev)
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId)
      } else {
        newFlagged.add(questionId)
      }
      return newFlagged
    })
  }, [])

  async function handleAutoSubmit() {
    if (!session) return
    toast.warning(t("exam.timeExpired"))

    await logAttemptEvent(session.attemptId, {
      eventType: AttemptEventType.TimedOut,
    }).catch(() => { })

    await handleSubmit()
  }

  async function handleSubmit() {
    if (!session) return
    try {
      setSubmitting(true)

      await logAttemptEvent(session.attemptId, {
        eventType: AttemptEventType.Submitted,
      }).catch(() => { })

      const result = await submitAttempt(session.attemptId)

      toast.success(t("exam.submitted"))
      router.push(`/results/${session.attemptId}`)
    } catch (error) {
      console.error("[v0] Failed to submit exam:", error)
      toast.error(t("common.error"))
    } finally {
      setSubmitting(false)
      setSubmitDialogOpen(false)
    }
  }

  function getSectionQuestionsCount(section: ExamSection): number {
    let count = (section.questions || []).length
    for (const topic of section.topics || []) {
      count += (topic.questions || []).length
    }
    return count
  }

  function getAnsweredInSection(section: ExamSection): number {
    let count = 0

    // Count answered questions in topics
    for (const topic of section.topics || []) {
      for (const question of topic.questions || []) {
        if (answers[question.questionId]) {
          count++
        }
      }
    }

    // Count answered section-level questions
    for (const question of section.questions || []) {
      if (answers[question.questionId]) {
        count++
      }
    }

    return count
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t("common.error")}</p>
      </div>
    )
  }

  const examTitle = getLocalizedField(session, "examTitle", language)

  // Get section timer if exists
  const sectionTimeRemaining = currentSection && sectionTimers[currentSection.sectionId]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header with timer and submit button */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{examTitle}</h1>
            <p className="text-xs text-muted-foreground">
              {t("exam.progress")}: {answeredCount}/{totalQuestions} — {Math.round(progress)}%
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Section Timer */}
            {sectionTimeRemaining !== undefined && sectionTimeRemaining !== null && (
              <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 dark:border-orange-900 dark:bg-orange-950">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  {t("exam.sectionTime") === "exam.sectionTime" ? "Section time" : t("exam.sectionTime")}: {formatTime(sectionTimeRemaining)}
                </p>
              </div>
            )}

            {/* Exam Timer */}
            <div className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-1.5",
              examTimeRemaining < 300
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
            )}>
              <p className={cn(
                "text-xs font-medium",
                examTimeRemaining < 300
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              )}>
                {t("exam.timeRemaining") === "exam.timeRemaining" ? "Time remaining" : t("exam.timeRemaining")}: {formatTime(examTimeRemaining)}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={() => setSubmitDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {t("common.submit")}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {hasSections ? (
          // Exam with sections as tabs - show ALL questions in scrollable list
          <Tabs
            value={currentSectionId?.toString()}
            onValueChange={(value) => {
              const newSectionId = Number(value)
              const newIndex = sections.findIndex(s => s.sectionId === newSectionId)
              const currentIndex = sections.findIndex(s => s.sectionId === currentSectionId)

              // Check if trying to go back to previous section
              if (newIndex < currentIndex && !canNavigateBack()) {
                toast.warning(t("exam.cannotGoBack"))
                return
              }

              setCurrentSectionId(newSectionId)
            }}
            className="flex h-full flex-col"
          >
            <div className="border-b bg-muted/30 px-6">
              <TabsList className="h-auto gap-2 bg-transparent p-0">
                {sections.map((section, index) => {
                  const sectionQuestions = getSectionQuestionsCount(section)
                  const answeredInSection = getAnsweredInSection(section)
                  const isLocked = index < sections.findIndex(s => s.sectionId === currentSectionId) &&
                    session?.examSettings?.lockPreviousSections

                  return (
                    <TabsTrigger
                      key={section.sectionId}
                      value={section.sectionId.toString()}
                      className="relative gap-2 data-[state=active]:bg-background"
                      disabled={isLocked}
                    >
                      {isLocked && <Lock className="h-3 w-3" />}
                      <span>{getLocalizedField(section, "title", language)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {answeredInSection}/{sectionQuestions}
                      </Badge>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {sections.map((section) => (
              <TabsContent
                key={section.sectionId}
                value={section.sectionId.toString()}
                className="m-0 flex-1 overflow-hidden"
              >
                <SectionContent
                  section={section}
                  answers={answers}
                  flagged={flagged}
                  savingAnswers={savingAnswers}
                  language={language}
                  totalQuestionsInExam={totalQuestions}
                  onAnswerChange={handleAnswerChange}
                  onToggleFlag={handleToggleFlag}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // No sections/topics - show ONE question at a time
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-auto">
              <div className="mx-auto max-w-5xl p-6">
                {currentFlatQuestion && (
                  <QuestionCard
                    question={currentFlatQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={flatQuestions.length}
                    answer={answers[currentFlatQuestion.questionId]}
                    isFlagged={flagged.has(currentFlatQuestion.questionId)}
                    isSaving={savingAnswers.has(currentFlatQuestion.questionId)}
                    language={language}
                    onAnswerChange={handleAnswerChange}
                    onToggleFlag={handleToggleFlag}
                  />
                )}
              </div>
            </div>

            {/* Navigation footer for flat questions */}
            <div className="border-t bg-card px-6 py-4">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  variant="outline"
                  disabled={currentQuestionIndex === 0 || !canNavigateBack()}
                  className="gap-2"
                >
                  {t("common.previous")}
                </Button>

                <div className="text-center">
                  <p className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} {t("exam.of")} {flatQuestions.length}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (currentQuestionIndex < flatQuestions.length - 1) {
                      setCurrentQuestionIndex(prev => prev + 1)
                    } else {
                      setSubmitDialogOpen(true)
                    }
                  }}
                  variant={currentQuestionIndex === flatQuestions.length - 1 ? "default" : "outline"}
                  className="gap-2"
                >
                  {currentQuestionIndex === flatQuestions.length - 1 ? (
                    <>
                      <Send className="h-4 w-4" />
                      {t("common.submit")}
                    </>
                  ) : (
                    t("common.next")
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exam.confirmSubmit")}</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount} {t("exam.of")} {totalQuestions} {t("common.questions")} {t("exam.answered")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : t("common.submit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Section content component - shows ALL questions in the section
function SectionContent({
  section,
  answers,
  flagged,
  savingAnswers,
  language,
  totalQuestionsInExam,
  onAnswerChange,
  onToggleFlag,
}: {
  section: ExamSection
  answers: Record<number, SaveAnswerRequest>
  flagged: Set<number>
  savingAnswers: Set<number>
  language: string
  totalQuestionsInExam: number
  onAnswerChange: (questionId: number, answer: SaveAnswerRequest) => void
  onToggleFlag: (questionId: number) => void
}) {
  const hasTopic = section.topics && section.topics.length > 0

  // Counter for question numbering
  let questionCounter = 1

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Section description */}
        {(section.descriptionEn || section.descriptionAr) && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                {getLocalizedField(section, "description", language)}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Topics with their questions */}
        {hasTopic ? (
          <>
            {(section.topics || []).sort((a, b) => a.order - b.order).map((topic) => {
              const topicQuestions = (topic.questions || []).sort((a, b) => a.order - b.order)
              const answeredInTopic = topicQuestions.filter(q => answers[q.questionId]).length

              return (
                <div key={topic.topicId} className="space-y-4">
                  {/* Topic header */}
                  <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">
                          {getLocalizedField(topic, "title", language)}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {answeredInTopic}/{topicQuestions.length}
                        </Badge>
                      </div>
                      {(topic.descriptionEn || topic.descriptionAr) && (
                        <p className="text-sm text-muted-foreground">
                          {getLocalizedField(topic, "description", language)}
                        </p>
                      )}
                    </CardHeader>
                  </Card>

                  {/* Topic questions */}
                  {topicQuestions.map((question) => {
                    const currentNumber = questionCounter++
                    return (
                      <QuestionCard
                        key={question.attemptQuestionId}
                        question={question}
                        questionNumber={currentNumber}
                        totalQuestions={totalQuestionsInExam}
                        answer={answers[question.questionId]}
                        isFlagged={flagged.has(question.questionId)}
                        isSaving={savingAnswers.has(question.questionId)}
                        language={language}
                        onAnswerChange={onAnswerChange}
                        onToggleFlag={onToggleFlag}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* Section-level questions (not in any topic) */}
            {section.questions && section.questions.length > 0 && (
              <div className="space-y-4">
                {(section.questions || []).sort((a, b) => a.order - b.order).map((question) => {
                  const currentNumber = questionCounter++
                  return (
                    <QuestionCard
                      key={question.attemptQuestionId}
                      question={question}
                      questionNumber={currentNumber}
                      totalQuestions={totalQuestionsInExam}
                      answer={answers[question.questionId]}
                      isFlagged={flagged.has(question.questionId)}
                      isSaving={savingAnswers.has(question.questionId)}
                      language={language}
                      onAnswerChange={onAnswerChange}
                      onToggleFlag={onToggleFlag}
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          // No topics - just list all section questions
          <div className="space-y-4">
            {(section.questions || []).sort((a, b) => a.order - b.order).map((question) => {
              const currentNumber = questionCounter++
              return (
                <QuestionCard
                  key={question.attemptQuestionId}
                  question={question}
                  questionNumber={currentNumber}
                  totalQuestions={totalQuestionsInExam}
                  answer={answers[question.questionId]}
                  isFlagged={flagged.has(question.questionId)}
                  isSaving={savingAnswers.has(question.questionId)}
                  language={language}
                  onAnswerChange={onAnswerChange}
                  onToggleFlag={onToggleFlag}
                />
              )
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

// Question card component
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  answer,
  isFlagged,
  isSaving,
  language,
  onAnswerChange,
  onToggleFlag,
}: {
  question: AttemptQuestionDto
  questionNumber: number
  totalQuestions: number
  answer?: SaveAnswerRequest
  isFlagged: boolean
  isSaving: boolean
  language: string
  onAnswerChange: (questionId: number, answer: SaveAnswerRequest) => void
  onToggleFlag: (questionId: number) => void
}) {
  const questionBody = getLocalizedField(question, "body", language)

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                Question {questionNumber} {language === "ar" ? "من" : "of"} {totalQuestions}
              </Badge>
              <Badge variant="outline" className="text-xs">{question.questionTypeName}</Badge>
              <Badge variant="secondary" className="text-xs">{question.points} Points</Badge>
              {isSaving && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <LoadingSpinner size="sm" /> Saving...
                </Badge>
              )}
            </div>
            <h3 className="text-base font-medium leading-relaxed">{questionBody}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onToggleFlag(question.questionId)}
          >
            <Flag className={cn("h-4 w-4", isFlagged && "fill-orange-600 text-orange-600")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="py-4">
        <QuestionRenderer
          question={question}
          answer={answer}
          language={language}
          onAnswerChange={onAnswerChange}
        />
      </CardContent>
    </Card>
  )
}
