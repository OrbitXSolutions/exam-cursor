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
import { Flag, Clock, Send, Lock, BookOpen, XCircle, ArrowLeft, ArrowRight, RefreshCw, Camera, CameraOff } from "lucide-react"
import { QuestionRenderer } from "./question-renderer"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, SaveAnswerRequest>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())

  // Section navigation state
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null)

  // Timer state
  const [examTimeRemaining, setExamTimeRemaining] = useState(0)
  const [sectionTimers, setSectionTimers] = useState<Record<number, number>>({})
  // Track which sections have been activated (entered by candidate) - only activated sections count down
  const [activatedSections, setActivatedSections] = useState<Set<number>>(new Set())

  // UI state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingAnswers, setSavingAnswers] = useState<Set<number>>(new Set())
  const [sectionChangeConfirmOpen, setSectionChangeConfirmOpen] = useState(false)
  const [pendingSectionId, setPendingSectionId] = useState<number | null>(null)

  // Proctoring state
  const [webcamStatus, setWebcamStatus] = useState<"pending" | "active" | "denied" | "error">("pending")
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null)
  const [lastSnapshotOk, setLastSnapshotOk] = useState<boolean | null>(null)
  const [snapshotFailStreak, setSnapshotFailStreak] = useState(0)

  // Refs
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const sectionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const snapshotIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const expiredSectionsRef = useRef<Set<number>>(new Set())
  const activatedSectionsRef = useRef<Set<number>>(new Set()) // Track activated sections for interval callback
  const webcamStreamRef = useRef<MediaStream | null>(null) // Persistent webcam stream
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null) // Video element for webcam

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
    
    // Request fullscreen with cross-browser support
    const requestFullScreen = async () => {
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        }
        if (!document.fullscreenElement) {
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen()
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen()
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen()
          } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen()
          }
        }
      } catch (error) {
        console.log("[v0] Fullscreen request failed:", error)
      }
    }
    
    // Request fullscreen immediately and also after a short delay (for browser focus issues)
    requestFullScreen()
    const retryTimeout = setTimeout(requestFullScreen, 500)
    
    return () => clearTimeout(retryTimeout)
  }, [setLanguage])

  useEffect(() => {
    initializeExam()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (sectionTimerRef.current) clearInterval(sectionTimerRef.current)
      if (syncTimerRef.current) clearInterval(syncTimerRef.current)
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
    }
  }, [attemptId])

  // Watch for section time expiration and auto-navigate
  useEffect(() => {
    if (!currentSectionId || !sections.length) return
    
    const currentTime = sectionTimers[currentSectionId]
    if (currentTime !== undefined && currentTime <= 0 && !expiredSectionsRef.current.has(currentSectionId)) {
      expiredSectionsRef.current.add(currentSectionId)
      handleSectionTimeExpired(currentSectionId)
    }
  }, [sectionTimers, currentSectionId, sections])

  // Activate section timer when candidate enters a new section
  useEffect(() => {
    if (!currentSectionId) return
    // Mark this section as activated - its timer will now start counting down
    if (!activatedSectionsRef.current.has(currentSectionId)) {
      activatedSectionsRef.current.add(currentSectionId)
      setActivatedSections(prev => new Set([...prev, currentSectionId]))
    }
  }, [currentSectionId])

  useEffect(() => {
    if (!session) return

    // Security features
    const setupSecurityFeatures = async () => {
      // Request fullscreen mode with cross-browser support
      try {
        const docEl = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          mozRequestFullScreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        }
        if (!document.fullscreenElement) {
          if (docEl.requestFullscreen) {
            await docEl.requestFullscreen()
          } else if (docEl.webkitRequestFullscreen) {
            await docEl.webkitRequestFullscreen()
          } else if (docEl.mozRequestFullScreen) {
            await docEl.mozRequestFullScreen()
          } else if (docEl.msRequestFullscreen) {
            await docEl.msRequestFullscreen()
          }
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

  // Proctoring: Keep webcam stream alive and take periodic snapshots
  useEffect(() => {
    if (!session?.attemptId) return

    let isActive = true

    // Initialize webcam stream once and keep it alive
    const initWebcam = async (): Promise<boolean> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        })
        if (!isActive) {
          stream.getTracks().forEach((t) => t.stop())
          return false
        }
        webcamStreamRef.current = stream

        // Create persistent video element
        const video = document.createElement("video")
        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        await video.play()
        webcamVideoRef.current = video

        setWebcamStatus("active")
        setWebcamError(null)
        console.log("[Proctor] Webcam stream initialized successfully")
        return true
      } catch (error: any) {
        console.warn("[Proctor] Could not initialize webcam:", error)
        const msg = error?.message ?? String(error)
        setWebcamStatus(msg.includes("Permission") || msg.includes("NotAllowed") ? "denied" : "error")
        setWebcamError(msg)

        // Log event
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.WebcamDenied,
          metadataJson: JSON.stringify({ error: msg }),
        }).catch(() => {})

        return false
      }
    }

    // Capture snapshot from the persistent stream
    const captureSnapshot = async () => {
      if (!webcamVideoRef.current || !webcamStreamRef.current) return

      try {
        const canvas = document.createElement("canvas")
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(webcamVideoRef.current, 0, 0)

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7),
        )
        if (!blob || !session?.attemptId) return

        const result = await uploadProctorSnapshot(
          session.attemptId,
          blob,
          `snapshot_${Date.now()}.jpg`,
        )

        if (result.success) {
          setLastSnapshotTime(new Date().toLocaleTimeString())
          setLastSnapshotOk(true)
          setSnapshotFailStreak(0)
        } else {
          setLastSnapshotOk(false)
          setSnapshotFailStreak((prev) => {
            const next = prev + 1
            if (next === 1) {
              toast.error("Snapshot upload failed — retrying next cycle")
            }
            if (next >= 3) {
              toast.error("Proctor snapshots are not uploading", {
                duration: Infinity,
                id: "snapshot-fail-persist",
              })
            }
            return next
          })
          // Log failure event
          logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.SnapshotFailed,
            metadataJson: JSON.stringify({ error: result.error }),
          }).catch(() => {})
        }
      } catch (error) {
        console.warn("[Proctor] Snapshot capture failed:", error)
      }
    }

    // Initialize webcam and start snapshot interval
    initWebcam().then((ok) => {
      if (ok && isActive) {
        // Take first snapshot immediately after webcam is ready
        captureSnapshot()
        // Then take snapshots every 60 seconds
        snapshotIntervalRef.current = setInterval(captureSnapshot, 60000)
      }
    })

    return () => {
      isActive = false
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
      // Stop webcam stream on cleanup
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop())
        webcamStreamRef.current = null
      }
      webcamVideoRef.current = null
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

      // Start exam countdown timer
      timerRef.current = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Activate the first section - its timer starts now
      if (sessionData.sections && sessionData.sections.length > 0) {
        const firstSectionId = sessionData.sections[0].sectionId
        setActivatedSections(new Set([firstSectionId]))
        activatedSectionsRef.current = new Set([firstSectionId])
      }

      // Start separate section timer - only counts down ACTIVATED sections
      sectionTimerRef.current = setInterval(() => {
        setSectionTimers((prev) => {
          const updated = { ...prev }
          for (const sectionId of Object.keys(updated)) {
            const id = Number(sectionId)
            // Only countdown if this section has been activated (entered by candidate)
            if (activatedSectionsRef.current.has(id) && updated[id] > 0) {
              updated[id] = updated[id] - 1
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
    } catch (error: unknown) {
      console.error("[v0] Failed to start exam:", error)
      // Extract error message from API response
      let errorMessage = t("common.error")
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setError(errorMessage)
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
    } else if (currentIndex === sections.length - 1) {
      // Last section expired - auto submit
      toast.warning(t("exam.sectionTimeExpired"))
      setSubmitDialogOpen(true)
    }
  }

  // Navigate to next section
  function handleNextSection() {
    if (!currentSectionId) return
    const currentIndex = sections.findIndex(s => s.sectionId === currentSectionId)
    if (currentIndex !== -1 && currentIndex < sections.length - 1) {
      const nextSectionId = sections[currentIndex + 1].sectionId
      if (session?.examSettings?.lockPreviousSections) {
        setPendingSectionId(nextSectionId)
        setSectionChangeConfirmOpen(true)
      } else {
        setCurrentSectionId(nextSectionId)
      }
    } else {
      // Last section - show submit dialog
      setSubmitDialogOpen(true)
    }
  }

  // Check if this is the last section
  const isLastSection = currentSectionId ? sections.findIndex(s => s.sectionId === currentSectionId) === sections.length - 1 : false

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

  // Stop all background timers/intervals/webcam to prevent 400s on closed attempt
  function stopAllBackgroundActivity() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined }
    if (sectionTimerRef.current) { clearInterval(sectionTimerRef.current); sectionTimerRef.current = undefined }
    if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = undefined }
    if (snapshotIntervalRef.current) { clearInterval(snapshotIntervalRef.current); snapshotIntervalRef.current = undefined }
    // Stop webcam stream
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop())
      webcamStreamRef.current = null
    }
  }

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

      // Stop all background calls BEFORE submit to prevent race conditions
      stopAllBackgroundActivity()

      await logAttemptEvent(session.attemptId, {
        eventType: AttemptEventType.Submitted,
      }).catch(() => { })

      const result = await submitAttempt(session.attemptId)

      toast.success(t("exam.submitted"))

      // If grading completed synchronously and result exists, go to score-card
      if (result && result.resultId && result.resultId > 0) {
        router.push(`/results/${session.attemptId}?submitted=true`)
      } else {
        // Grading is async / pending — go back to my-exams safely
        router.push("/my-exams")
      }
    } catch (error: unknown) {
      console.error("[v0] Failed to submit exam:", error)
      // Show meaningful error with traceId reference if available
      const errMsg = error instanceof Error ? error.message : ""
      if (errMsg && errMsg !== "An error occurred") {
        toast.error(errMsg)
      } else {
        toast.error(t("common.errorOccurred") || "Submission failed. Please try again.")
      }
    } finally {
      setSubmitting(false)
      setSubmitDialogOpen(false)
    }
  }

  // Retry webcam initialization
  async function handleRetryWebcam() {
    setWebcamStatus("pending")
    setWebcamError(null)
    try {
      // Stop existing stream if any
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop())
        webcamStreamRef.current = null
      }
      webcamVideoRef.current = null

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      })
      webcamStreamRef.current = stream
      const video = document.createElement("video")
      video.srcObject = stream
      video.muted = true
      video.playsInline = true
      await video.play()
      webcamVideoRef.current = video
      setWebcamStatus("active")
      setWebcamError(null)
      toast.success("Camera connected")

      // Take immediate snapshot and restart interval
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
      // Trigger first snapshot
      if (session?.attemptId) {
        const canvas = document.createElement("canvas")
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          canvas.toBlob(async (blob) => {
            if (blob && session?.attemptId) {
              const result = await uploadProctorSnapshot(session.attemptId, blob, `snapshot_${Date.now()}.jpg`)
              if (result.success) {
                setLastSnapshotTime(new Date().toLocaleTimeString())
                setLastSnapshotOk(true)
                setSnapshotFailStreak(0)
              }
            }
          }, "image/jpeg", 0.7)
        }
      }
    } catch (error: any) {
      const msg = error?.message ?? String(error)
      setWebcamStatus(msg.includes("Permission") || msg.includes("NotAllowed") ? "denied" : "error")
      setWebcamError(msg)
      toast.error("Camera access failed")
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

  // Show friendly error screen
  if (error || !session) {
    const isExpired = error?.toLowerCase().includes("expired")
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">
              {isExpired ? t("exam.attemptExpired") : t("exam.cannotLoadExam")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || t("exam.sessionLoadError")}
            </p>
            {isExpired && (
              <p className="text-sm text-muted-foreground">
                {t("exam.attemptExpiredDesc")}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href="/my-exams">
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {t("exam.backToMyExams")}
                </Link>
              </Button>
              {!isExpired && (
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 me-2" />
                  {t("common.retry")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const examTitle = getLocalizedField(session, "examTitle", language)

  // Get section timer if exists
  const sectionTimeRemaining = currentSection && sectionTimers[currentSection.sectionId]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Webcam denial / snapshot persistent error banner */}
      {(webcamStatus === "denied" || webcamStatus === "error") && (
        <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <CameraOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {webcamStatus === "denied"
              ? "Camera permission is required for proctoring snapshots. Please allow camera access in your browser settings."
              : `Camera error: ${webcamError ?? "Unknown"}`}
          </span>
          <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={handleRetryWebcam}>
            <RefreshCw className="h-3 w-3 me-1" />
            Retry Camera
          </Button>
        </div>
      )}
      {snapshotFailStreak >= 3 && webcamStatus === "active" && (
        <div className="flex items-center gap-3 border-b bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          <CameraOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">Proctor snapshots are not uploading. Your exam will continue but proctoring evidence may be incomplete.</span>
        </div>
      )}

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

            {/* Proctoring indicator */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                webcamStatus === "active" && lastSnapshotOk !== false
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
              )}
              title={lastSnapshotTime ? `Last snapshot: ${lastSnapshotTime}` : "Waiting for first snapshot"}
            >
              {webcamStatus === "active" ? (
                <Camera className="h-3 w-3" />
              ) : (
                <CameraOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {webcamStatus === "active"
                  ? lastSnapshotTime
                    ? `${lastSnapshotTime}`
                    : "..."
                  : "Off"}
              </span>
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

              // If moving forward, show confirmation modal
              if (newIndex > currentIndex && session?.examSettings?.lockPreviousSections) {
                setPendingSectionId(newSectionId)
                setSectionChangeConfirmOpen(true)
                return
              }

              setCurrentSectionId(newSectionId)
            }}
            className="flex h-full flex-col"
          >
            <div className="border-b bg-muted/30 px-4">
              <TabsList className="w-full h-auto gap-1 bg-transparent p-2 flex-wrap justify-start">
                {sections.map((section, index) => {
                  const sectionQuestions = getSectionQuestionsCount(section)
                  const answeredInSection = getAnsweredInSection(section)
                  const isLocked = index < sections.findIndex(s => s.sectionId === currentSectionId) &&
                    session?.examSettings?.lockPreviousSections

                  return (
                    <TabsTrigger
                      key={section.sectionId}
                      value={section.sectionId.toString()}
                      className="relative gap-2 px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md"
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
                  sections={sections}
                  answers={answers}
                  flagged={flagged}
                  savingAnswers={savingAnswers}
                  language={language}
                  totalQuestionsInExam={totalQuestions}
                  sectionTimeRemaining={sectionTimers[section.sectionId]}
                  isLastSection={sections.findIndex(s => s.sectionId === section.sectionId) === sections.length - 1}
                  onAnswerChange={handleAnswerChange}
                  onToggleFlag={handleToggleFlag}
                  onNextSection={handleNextSection}
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

      {/* Section change confirmation dialog */}
      <AlertDialog open={sectionChangeConfirmOpen} onOpenChange={setSectionChangeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exam.confirmSectionChange") || "Move to Next Section?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exam.sectionChangeLocked") || "If you continue, you will not be able to return to this section again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSectionId(null)}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSectionId !== null) {
                  setCurrentSectionId(pendingSectionId)
                  setPendingSectionId(null)
                }
                setSectionChangeConfirmOpen(false)
              }}
            >
              {t("exam.continueToSection") || "Continue"}
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
  sections,
  answers,
  flagged,
  savingAnswers,
  language,
  totalQuestionsInExam,
  sectionTimeRemaining,
  isLastSection,
  onAnswerChange,
  onToggleFlag,
  onNextSection,
}: {
  section: ExamSection
  sections: ExamSection[]
  answers: Record<number, SaveAnswerRequest>
  flagged: Set<number>
  savingAnswers: Set<number>
  language: string
  totalQuestionsInExam: number
  sectionTimeRemaining?: number | null
  isLastSection: boolean
  onAnswerChange: (questionId: number, answer: SaveAnswerRequest) => void
  onToggleFlag: (questionId: number) => void
  onNextSection: () => void
}) {
  const { t } = useI18n()
  const hasTopic = section.topics && section.topics.length > 0

  // Check if this is a Builder section
  const isBuilderSection = section.sourceType !== null && section.sourceType !== undefined
  const isSubjectMode = section.sourceType === 1 // Subject = 1
  const isTopicMode = section.sourceType === 2 // Topic = 2

  // Get subject/topic titles for display
  const subjectTitle = language === "ar" ? section.subjectTitleAr : section.subjectTitleEn
  const topicTitle = language === "ar" ? section.topicTitleAr : section.topicTitleEn

  // Counter for question numbering
  let questionCounter = 1

  // Show section timer warning when 30 seconds or less
  const showTimeWarning = sectionTimeRemaining !== undefined && sectionTimeRemaining !== null && sectionTimeRemaining <= 30

  // Get warning text with actual seconds
  const warningDescText = (t("exam.sectionTimeWarningDesc") || "Only {seconds} seconds remaining in this section.")
    .replace("{seconds}", String(sectionTimeRemaining || 0))

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Section Time Warning Alert */}
        {showTimeWarning && (
          <div className="animate-pulse rounded-lg border-2 border-red-500 bg-red-50 p-4 dark:bg-red-950/40">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">
                  {t("exam.sectionTimeWarning") || "Time is running out!"}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {warningDescText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Builder Section Header - Subject Mode */}
        {isBuilderSection && isSubjectMode && subjectTitle && (
          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader className="py-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t("exam.subject") || "Subject"}
                </Badge>
                <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {subjectTitle}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Builder Section Header - Topic Mode */}
        {isBuilderSection && isTopicMode && (
          <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardHeader className="py-2">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {subjectTitle && (
                  <span className="text-sm text-muted-foreground">
                    {subjectTitle} /
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {t("exam.topic") || "Topic"}
                </Badge>
                <CardTitle className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                  {topicTitle || getLocalizedField(section, "title", language)}
                </CardTitle>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Section description (for non-Builder sections) */}
        {!isBuilderSection && (section.descriptionEn || section.descriptionAr) && (
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

        {/* Next Section / Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onNextSection} className="gap-2">
            {isLastSection ? (
              <>
                <Send className="h-4 w-4" />
                {t("common.submit")}
              </>
            ) : (
              <>
                {t("exam.nextSection") || "Next Section"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
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
