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
import { uploadProctorSnapshot, getCandidateSessionStatus, updateSessionDeviceInfo } from "@/lib/api/proctoring"
import { CandidatePublisher } from "@/lib/webrtc/candidate-publisher"
import { ScreenSharePublisher, type ScreenShareStatus } from "@/lib/webrtc/screen-share-publisher"
import { ChunkRecorder } from "@/lib/webrtc/chunk-recorder"
import { getVideoConfig } from "@/lib/webrtc/video-config"
import { SmartMonitoring, type ViolationType } from "@/lib/ai/smart-monitoring"
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
import { Flag, Clock, Send, Lock, BookOpen, XCircle, ArrowLeft, ArrowRight, RefreshCw, Camera, CameraOff, CheckCircle2, AlertTriangle, ListChecks, Calculator, Monitor } from "lucide-react"
import { QuestionRenderer } from "./question-renderer"
import { ImageZoomModal } from "./image-zoom-modal"
import { ExamCalculator, CalculatorButton } from "@/components/exam/exam-calculator"
import { SpreadsheetButton } from "@/components/exam/exam-spreadsheet"
import dynamic from "next/dynamic"
import { localizeText, translateServerMessage } from "@/lib/i18n/runtime"

// Dynamically import spreadsheet to avoid SSR issues
const ExamSpreadsheet = dynamic(
  () => import("@/components/exam/exam-spreadsheet").then(mod => ({ default: mod.ExamSpreadsheet })),
  { ssr: false, loading: () => null }
)
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

function isLastWarningMessage(message?: string | null): boolean {
  const value = message ?? ""
  return /LAST WARNING/i.test(value) || value.includes("Ø§Ù„ØªØ­Ø°ÙŠØ± Ø§Ù„Ø£Ø®ÙŠØ±")
}

function getQuestionTypeDisplayName(questionTypeName: string, language: string): string {
  const normalized = questionTypeName?.trim().toLowerCase()

  if (
    [
      "mcq_single",
      "mcq single choice",
      "singlechoice",
      "multiple choice",
      "mcq single",
    ].includes(normalized)
  ) {
    return localizeText("Multiple Choice", "اختيار من متعدد", language)
  }

  if (
    [
      "mcq_multi",
      "mcq multiple choice",
      "mcq_multiple",
      "multiplechoice",
      "multiple select",
      "mcq multiple",
    ].includes(normalized)
  ) {
    return localizeText("Multiple Select", "اختيار متعدد", language)
  }

  if (["truefalse", "true_false", "true/false"].includes(normalized)) {
    return localizeText("True/False", "صح أو خطأ", language)
  }

  if (
    [
      "subjective",
      "shortanswer",
      "short_answer",
      "short answer",
      "essay",
      "numeric",
    ].includes(normalized)
  ) {
    return localizeText("Subjective", "إجابة كتابية", language)
  }

  return questionTypeName
}

export default function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const { t, dir, language, setLanguage } = useI18n()
  const router = useRouter()
  const translateCandidateMessage = useCallback(
    (message?: string | null) => {
      return message ? translateServerMessage(message, language) : undefined
    },
    [language],
  )
  const showWarningMessage = useCallback(
    (message: string, isLastWarningOverride?: boolean) => {
      playWarningBeep()
      const localizedMessage =
        translateCandidateMessage(message) ?? t("exam.proctorWarningNote")

      if (isLastWarningOverride ?? isLastWarningMessage(message)) {
        setLastWarningMessage(localizedMessage)
        setLastWarningOpen(true)
        return
      }

      setProctorWarningMessage(localizedMessage)
      setProctorWarningOpen(true)
    },
    [t, translateCandidateMessage],
  )

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

  // Summary panel state
  const [showSummary, setShowSummary] = useState(false)

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false)

  // Spreadsheet state
  const [showSpreadsheet, setShowSpreadsheet] = useState(false)

  // Auto-save indicator state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const saveStatusTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Proctoring state
  const [webcamStatus, setWebcamStatus] = useState<"pending" | "active" | "denied" | "error">("pending")
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null)
  const [lastSnapshotOk, setLastSnapshotOk] = useState<boolean | null>(null)
  const [snapshotFailStreak, setSnapshotFailStreak] = useState(0)

  // Proctor warning state
  const [proctorWarningOpen, setProctorWarningOpen] = useState(false)
  const [proctorWarningMessage, setProctorWarningMessage] = useState("")
  const [lastWarningOpen, setLastWarningOpen] = useState(false)
  const [lastWarningMessage, setLastWarningMessage] = useState("")

  // SignalR connection state â€” drives smart polling
  const [signalRConnected, setSignalRConnected] = useState(false)

  // Refs
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const sectionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const syncTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const snapshotIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const expiredSectionsRef = useRef<Set<number>>(new Set())
  const activatedSectionsRef = useRef<Set<number>>(new Set()) // Track activated sections for interval callback
  const webcamStreamRef = useRef<MediaStream | null>(null) // Persistent webcam stream
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null) // Video element for webcam
  const proctorPollRef = useRef<NodeJS.Timeout | undefined>(undefined) // Proctor warning poll
  const publisherRef = useRef<CandidatePublisher | null>(null) // WebRTC live video publisher
  const chunkRecorderRef = useRef<ChunkRecorder | null>(null) // Video chunk recorder
  const smartMonitoringRef = useRef<SmartMonitoring | null>(null) // AI face detection
  const screenSharePublisherRef = useRef<ScreenSharePublisher | null>(null) // Screen share publisher
  const screenShareGraceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined) // Strict mode grace timer
  const suppressFullscreenExitRef = useRef(false) // Suppress fullscreen-exit violations while starting screen share
  const deviceInfoSentRef = useRef(false) // Track if device info has been sent to proctor session

  // Screen share state
  const [screenShareStatus, setScreenShareStatus] = useState<ScreenShareStatus>("idle")
  const [screenShareConsentOpen, setScreenShareConsentOpen] = useState(false)
  const [screenShareConsentMode, setScreenShareConsentMode] = useState<"optional" | "required" | "strict">("optional")

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

  // Calculator context: check if calculator is allowed in the current view
  const isCalculatorAllowedInContext = hasSections
    ? !!(currentSection && (
        currentSection.questions?.some(q => q.isCalculatorAllowed) ||
        currentSection.topics?.some(t => t.questions?.some(q => q.isCalculatorAllowed))
      ))
    : !!(currentFlatQuestion?.isCalculatorAllowed)

  // Auto-hide calculator & spreadsheet when navigating to context that doesn't allow it
  useEffect(() => {
    if (!isCalculatorAllowedInContext && showCalculator) {
      setShowCalculator(false)
    }
    if (!isCalculatorAllowedInContext && showSpreadsheet) {
      setShowSpreadsheet(false)
    }
  }, [isCalculatorAllowedInContext, currentSectionId, currentQuestionIndex])

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

  // Apply exam language from instructions
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = window.localStorage.getItem(EXAM_LANGUAGE_KEY) as "en" | "ar" | null
    if (saved && (saved === "en" || saved === "ar")) {
      setLanguage(saved)
    }
  }, [setLanguage])

  // Request fullscreen only when session is loaded AND requireFullscreen is enabled
  useEffect(() => {
    if (!session?.examSettings?.requireFullscreen) return
    
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
    
    requestFullScreen()
    const retryTimeout = setTimeout(requestFullScreen, 500)
    
    return () => clearTimeout(retryTimeout)
  }, [session?.examSettings?.requireFullscreen])

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
      const settings = session.examSettings

      // Request fullscreen mode only if required
      if (settings?.requireFullscreen) {
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

      // Monitor fullscreen changes only if fullscreen is required
      const handleFullscreenChange = settings?.requireFullscreen ? () => {
        if (suppressFullscreenExitRef.current) return // Skip during screen share start
        if (!document.fullscreenElement) {
          logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.FullscreenExited,
            metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
          }).catch(() => { })
          playWarningBeep()
          toast.warning(t("exam.tabSwitchWarning"))
        }
      } : null

      // Tab visibility detection only if fullscreen is required
      const handleVisibilityChange = settings?.requireFullscreen ? () => {
        if (document.hidden) {
          logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.TabSwitched,
            metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
          }).catch(() => { })
          playWarningBeep()
          toast.warning(t("exam.tabSwitchWarning"))
        }
      } : null

      // Copy/paste prevention only if required
      const handleCopy = settings?.preventCopyPaste ? (e: ClipboardEvent) => {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.CopyAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => { })
        playWarningBeep()
        toast.warning(t("exam.copyPasteBlocked"))
      } : null

      const handlePaste = settings?.preventCopyPaste ? (e: ClipboardEvent) => {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.PasteAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => { })
        playWarningBeep()
        toast.warning(t("exam.copyPasteBlocked"))
      } : null

      if (handleFullscreenChange) document.addEventListener("fullscreenchange", handleFullscreenChange)
      if (handleVisibilityChange) document.addEventListener("visibilitychange", handleVisibilityChange)
      if (handleCopy) document.addEventListener("copy", handleCopy)
      if (handlePaste) document.addEventListener("paste", handlePaste)

      return () => {
        if (handleFullscreenChange) document.removeEventListener("fullscreenchange", handleFullscreenChange)
        if (handleVisibilityChange) document.removeEventListener("visibilitychange", handleVisibilityChange)
        if (handleCopy) document.removeEventListener("copy", handleCopy)
        if (handlePaste) document.removeEventListener("paste", handlePaste)

        if (settings?.requireFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => { })
        }
      }
    }

    const cleanup = setupSecurityFeatures()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [session, t])

  // Proctoring: Keep webcam stream alive and take periodic snapshots (only if webcam is required)
  useEffect(() => {
    if (!session?.attemptId) return
    // Skip webcam initialization entirely if webcam is not required
    if (!session.examSettings?.requireWebcam) {
      setWebcamStatus("active") // Mark as OK so UI doesn't show errors
      return
    }

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
          setLastSnapshotTime(new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dubai" }))
          setLastSnapshotOk(true)
          setSnapshotFailStreak(0)
          // First successful snapshot means the proctor session now exists — send device info once
          if (!deviceInfoSentRef.current && session?.attemptId) {
            deviceInfoSentRef.current = true
            try {
              const ua = navigator.userAgent
              let browserName = "Unknown"
              let browserVersion = ""
              if (ua.includes("Edg/")) { browserName = "Edge"; browserVersion = ua.match(/Edg\/(\S+)/)?.[1] ?? "" }
              else if (ua.includes("Chrome/")) { browserName = "Chrome"; browserVersion = ua.match(/Chrome\/(\S+)/)?.[1] ?? "" }
              else if (ua.includes("Firefox/")) { browserName = "Firefox"; browserVersion = ua.match(/Firefox\/(\S+)/)?.[1] ?? "" }
              else if (ua.includes("Safari/") && !ua.includes("Chrome")) { browserName = "Safari"; browserVersion = ua.match(/Version\/(\S+)/)?.[1] ?? "" }
              let os = "Unknown"
              if (ua.includes("Windows NT 10")) os = "Windows 10/11"
              else if (ua.includes("Windows")) os = "Windows"
              else if (ua.includes("Mac OS X")) os = "macOS " + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "")
              else if (ua.includes("Linux")) os = "Linux"
              else if (ua.includes("Android")) os = "Android"
              else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
              await updateSessionDeviceInfo({
                attemptId: session.attemptId,
                browserName: browserName.trim(),
                browserVersion: browserVersion.split(" ")[0],
                operatingSystem: os.trim(),
                screenResolution: `${screen.width}x${screen.height}`,
              })
            } catch { /* silent fail — never block exam */ }
          }
        } else {
          setLastSnapshotOk(false)
          setSnapshotFailStreak((prev) => {
            const next = prev + 1
            if (next === 1) {
              toast.error(t("exam.snapshotUploadRetry"))
            }
            if (next >= 3) {
              toast.error(t("exam.snapshotUploadFailedPersistent"), {
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

        // Start WebRTC live video publisher (share existing stream)
        // Guarded by feature flags â€” failures never block the exam
        if (webcamStreamRef.current && session?.attemptId) {
          console.log(`%c[ExamPage] Fetching video config for attempt ${session.attemptId}...`, 'color: #2196f3; font-weight: bold')
          getVideoConfig().then((cfg) => {
            console.log(`%c[ExamPage] Video config received: enableLiveVideo=${cfg.enableLiveVideo}, enableVideoRecording=${cfg.enableVideoRecording}, stunServers=${JSON.stringify(cfg.stunServers)}`, 'color: #2196f3; font-weight: bold')
            if (!isActive || !webcamStreamRef.current || !session?.attemptId) {
              console.warn('[ExamPage] Skipping video init: isActive=', isActive, 'stream=', !!webcamStreamRef.current, 'attemptId=', session?.attemptId)
              return
            }

            // Live video publisher
            if (cfg.enableLiveVideo) {
              console.log(`%c[ExamPage] âœ… enableLiveVideo=true, starting CandidatePublisher for attempt ${session.attemptId}`, 'color: #4caf50; font-weight: bold')
              try {
                const publisher = new CandidatePublisher(session.attemptId, {
                  onStatusChange: (status) => {
                    console.log("[Proctor] WebRTC publisher status:", status)
                  },
                  onWarningReceived: (message, isLastWarning) => {
                    showWarningMessage(message, isLastWarning)
                  },
                  onSignalRStatusChange: (connected) => {
                    console.log(`[SmartPoll] SignalR status changed: connected=${connected}`)
                    setSignalRConnected(connected)
                  },
                  onTerminationReceived: (reason) => {
                    console.log(`[SmartPoll] Termination received via SignalR: "${reason}"`)
                    stopAllBackgroundActivity()
                    toast.error(
                      translateCandidateMessage(reason) ?? t("exam.terminatedByProctor"),
                      { duration: 10000 }
                    )
                    router.push("/my-exams")
                  },
                  onTimeExtended: (event) => {
                    console.log(`[SmartPoll] Time extended via SignalR: +${event.extraMinutes}min, new remaining=${event.newRemainingSeconds}s`)
                    // Update the exam timer with new remaining seconds
                    setExamTimeRemaining(event.newRemainingSeconds)
                    // Play a gentle notification sound (different from warning beep)
                    try {
                      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
                      const osc = audioCtx.createOscillator()
                      const gain = audioCtx.createGain()
                      osc.connect(gain)
                      gain.connect(audioCtx.destination)
                      osc.frequency.value = 523.25 // C5 - pleasant tone
                      gain.gain.value = 0.15
                      osc.start()
                      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
                      osc.stop(audioCtx.currentTime + 0.5)
                    } catch {}
                    // Show notification toast
                    toast.success(
                      t("exam.timeExtendedByMinutes", { minutes: event.extraMinutes }),
                      { duration: 8000, icon: "⏰" }
                    )
                  },
                  onAttemptExpired: (event) => {
                    console.log(`[SmartPoll] Attempt expired via SignalR: type=${event.eventType}, reason=${event.reason}`)
                    stopAllBackgroundActivity()
                    const message = event.eventType === "ExamWindowClosed"
                      ? t("exam.examWindowClosed")
                      : t("exam.timeExpired")
                    toast.error(message, { duration: 10000 })
                    router.push("/my-exams")
                  },
                })
                publisher.start(webcamStreamRef.current).catch((err) => {
                  console.warn("[Proctor] WebRTC publisher failed to start (non-fatal):", err)
                })
                publisherRef.current = publisher
              } catch (err) {
                console.warn("[Proctor] WebRTC publisher init failed (non-fatal):", err)
              }
            } else {
              console.warn('[ExamPage] enableLiveVideo=false, skipping WebRTC publisher')
            }

            // Chunk recording
            if (cfg.enableVideoRecording) {
              console.log(`[ExamPage] enableVideoRecording=true, starting ChunkRecorder`)
              try {
                const recorder = new ChunkRecorder(session.attemptId, {
                  onChunkUploaded: (idx) => {
                    console.log(`[Proctor] Chunk ${idx} uploaded`)
                  },
                  onChunkFailed: (idx, err) => {
                    console.warn(`[Proctor] Chunk ${idx} failed: ${err}`)
                  },
                  onError: (err) => {
                    console.error("[Proctor] ChunkRecorder error (non-fatal):", err)
                  },
                })
                recorder.start(webcamStreamRef.current!)
                chunkRecorderRef.current = recorder
              } catch (err) {
                console.warn("[Proctor] ChunkRecorder init failed (non-fatal):", err)
              }
            }

            // Smart Monitoring (AI face detection)
            if (cfg.enableSmartMonitoring && webcamVideoRef.current) {
              console.log(`%c[ExamPage] âœ… enableSmartMonitoring=true, starting AI detection`, 'color: #9c27b0; font-weight: bold')
              try {
                // Map ViolationType â†’ AttemptEventType
                const violationToEventType: Record<ViolationType, AttemptEventType> = {
                  FaceNotDetected: AttemptEventType.FaceNotDetected,
                  MultipleFacesDetected: AttemptEventType.MultipleFacesDetected,
                  FaceOutOfFrame: AttemptEventType.FaceOutOfFrame,
                  CameraBlocked: AttemptEventType.CameraBlocked,
                  HeadTurnDetected: AttemptEventType.HeadTurnDetected,
                }

                const monitor = new SmartMonitoring({
                  onViolation: (event) => {
                    console.log(`%c[SmartMonitoring] ðŸš¨ Violation: ${event.type} â€” ${event.message}`, 'color: #f44336; font-weight: bold')

                    // Play a single soft alert beep (not the aggressive 3-beep used for proctor warnings)
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      osc.type = "sine"
                      osc.frequency.value = 660
                      gain.gain.value = 0.2
                      osc.connect(gain)
                      gain.connect(ctx.destination)
                      osc.start(ctx.currentTime)
                      osc.stop(ctx.currentTime + 0.2)
                      setTimeout(() => ctx.close().catch(() => {}), 500)
                    } catch {}

                    // Show styled non-blocking toast for AI-detected violations
                    // (the full "Warning from Proctor" popup is reserved for real proctor warnings)
                    toast.warning(translateCandidateMessage(event.message) ?? event.message, {
                      duration: 8000,
                      id: `smart-monitoring-${event.type}`,
                      icon: "⚠️",
                      style: {
                        fontSize: "15px",
                        fontWeight: 500,
                        padding: "14px 18px",
                        borderLeft: "4px solid #f59e0b",
                        background: "#fffbeb",
                        color: "#92400e",
                      },
                      description: t("exam.proctorWarningNote"),
                    })

                    // Log event to backend (auto-pushes to proctor via SignalR)
                    const eventType = violationToEventType[event.type]
                    if (eventType !== undefined) {
                      logAttemptEvent(session.attemptId, {
                        eventType,
                        metadataJson: JSON.stringify({
                          ...event.metadata,
                          source: "smart_monitoring",
                          timestamp: new Date().toISOString(),
                        }),
                      }).catch(() => {})
                    }
                  },
                })

                monitor.start(webcamVideoRef.current).then((ok) => {
                  if (ok) {
                    console.log(`%c[ExamPage] âœ… SmartMonitoring started successfully`, 'color: #4caf50; font-weight: bold')
                  } else {
                    console.warn('[ExamPage] SmartMonitoring failed to start (non-fatal)')
                  }
                })
                smartMonitoringRef.current = monitor
              } catch (err) {
                console.warn("[SmartMonitoring] Init failed (non-fatal):", err)
              }
            } else if (!cfg.enableSmartMonitoring) {
              console.log('[ExamPage] enableSmartMonitoring=false, skipping AI detection')
            }

            // Screen share initialization (guarded by per-exam settings)
            const screenSettings = session?.examSettings
            if (cfg.enableScreenMonitoring && screenSettings?.enableScreenMonitoring && screenSettings.screenMonitoringMode > 0) {
              const modeMap = { 1: "optional", 2: "required", 3: "strict" } as const
              const mode = modeMap[screenSettings.screenMonitoringMode as 1 | 2 | 3] ?? "optional"
              console.log(`%c[ExamPage] Screen monitoring enabled, mode=${mode}`, 'color: #9c27b0; font-weight: bold')
              setScreenShareConsentMode(mode)
              // Auto-start screen share (candidate already tested on instructions page)
              autoStartScreenShare()
            }
          }).catch((err) => {
            console.warn("[Proctor] Video config fetch failed (non-fatal):", err)
          })
        }
      }
    })

    return () => {
      isActive = false
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current)
      // Stop WebRTC publisher
      publisherRef.current?.stop().catch(() => {})
      publisherRef.current = null
      // Stop chunk recorder
      chunkRecorderRef.current?.dispose()
      chunkRecorderRef.current = null
      // Stop smart monitoring
      smartMonitoringRef.current?.dispose()
      smartMonitoringRef.current = null
      // Stop screen share
      screenSharePublisherRef.current?.stop().catch(() => {})
      screenSharePublisherRef.current = null
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
        throw new Error(localizeText("Invalid attempt ID", "معرف المحاولة غير صالح", language))
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

      // Initial proctor status check (one-time HTTP snapshot â€” source of truth)
      try {
        const status = await getCandidateSessionStatus(sessionData.attemptId)
        if (status.isTerminated) {
          stopAllBackgroundActivity()
          toast.error(
            translateCandidateMessage(status.terminationReason) ?? t("exam.terminatedByProctor"),
            { duration: 10000 }
          )
          router.push("/my-exams")
          return
        }
        if (status.hasWarning && status.warningMessage) {
          showWarningMessage(status.warningMessage)
        }
      } catch {
        // Silent fail â€” don't disrupt exam start
      }
      // Note: Continuous polling is managed by the smart-poll useEffect below,
      // which only polls when SignalR is disconnected (signalRConnected === false).

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
          setSaveStatus("saving")
          await saveAnswer(session.attemptId, answer)

          // Show saved indicator briefly
          setSaveStatus("saved")
          if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current)
          saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 3000)

          await logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.AnswerSaved,
            metadataJson: JSON.stringify({ questionId }),
          }).catch(() => { })
        } catch (error) {
          console.error("[v0] Failed to save answer:", error)
          setSaveStatus("error")
          if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current)
          saveStatusTimerRef.current = setTimeout(() => setSaveStatus("idle"), 5000)
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

  // Play a short beep sound to alert the candidate of a proctor warning
  function playWarningBeep() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      // First beep
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sine"
      osc1.frequency.value = 880 // A5 note
      gain1.gain.value = 0.3
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.15)
      // Second beep after gap
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.value = 880
      gain2.gain.value = 0.3
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(ctx.currentTime + 0.25)
      osc2.stop(ctx.currentTime + 0.4)
      // Third beep
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = "sine"
      osc3.frequency.value = 1046.5 // C6 note
      gain3.gain.value = 0.3
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(ctx.currentTime + 0.5)
      osc3.stop(ctx.currentTime + 0.8)
      // Cleanup
      setTimeout(() => ctx.close().catch(() => {}), 1500)
    } catch {
      // Silent fail â€” audio not critical
    }
  }

  // ── Screen Share Handlers ──────────────────────────────────────────

  async function startScreenSharePublisher() {
    if (!session) return
    // Clean up previous publisher if any
    if (screenSharePublisherRef.current) {
      await screenSharePublisherRef.current.stop().catch(() => {})
      screenSharePublisherRef.current = null
    }
    const publisher = new ScreenSharePublisher(session.attemptId, {
      onStatusChange: (status) => {
        console.log(`%c[ExamPage] Screen share status: ${status}`, "color: #9c27b0; font-weight: bold")
        setScreenShareStatus(status)

        // Log events for key status changes
        if (status === "active") {
          logAttemptEvent(session.attemptId, { eventType: "ScreenShareStarted" }).catch(() => {})
        } else if (status === "stopped" || status === "failed") {
          logAttemptEvent(session.attemptId, { eventType: "ScreenShareEnded" }).catch(() => {})
          handleScreenShareStopped()
        } else if (status === "lost") {
          logAttemptEvent(session.attemptId, { eventType: "ScreenShareLost" }).catch(() => {})
          handleScreenShareStopped()
        } else if (status === "denied") {
          logAttemptEvent(session.attemptId, { eventType: "ScreenShareDenied" }).catch(() => {})
        }
      },
      onTrackEnded: () => {
        logAttemptEvent(session.attemptId, { eventType: "ScreenShareTrackEnded" }).catch(() => {})
      },
      onError: (error) => {
        console.warn("[ExamPage] Screen share error:", error.message)
      },
    })
    screenSharePublisherRef.current = publisher
    const started = await publisher.start()
    if (!started) {
      setScreenShareStatus("denied")
    }
    return started
  }

  /** Auto-start screen share without consent dialog, suppress fullscreen-exit violations during getDisplayMedia() */
  async function autoStartScreenShare() {
    if (!session) return
    suppressFullscreenExitRef.current = true
    logAttemptEvent(session.attemptId, { eventType: "ScreenShareRequested" }).catch(() => {})
    if (screenShareGraceTimerRef.current) { clearTimeout(screenShareGraceTimerRef.current); screenShareGraceTimerRef.current = undefined }
    try {
      const started = await startScreenSharePublisher()
      if (!started && (screenShareConsentMode === "required" || screenShareConsentMode === "strict")) {
        toast.error(
          localizeText("Screen sharing is required", "مشاركة الشاشة مطلوبة", language),
          { description: localizeText("Please allow screen sharing to continue.", "يرجى السماح بمشاركة الشاشة للمتابعة.", language) }
        )
        setTimeout(() => autoStartScreenShare(), 1500)
      }
    } finally {
      suppressFullscreenExitRef.current = false
      if (session?.examSettings?.requireFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {})
      }
    }
  }

  function handleScreenShareStopped() {
    if (!session) return
    const mode = screenShareConsentMode

    if (mode === "optional") {
      // Just log, no enforcement
      return
    }

    if (mode === "required") {
      // Warn and auto-restart screen share
      toast.warning(
        localizeText("Screen sharing stopped", "توقفت مشاركة الشاشة", language),
        {
          description: localizeText(
            "Please re-share your screen to continue.",
            "يرجى إعادة مشاركة شاشتك للمتابعة.",
            language
          ),
          duration: 10000,
        }
      )
      autoStartScreenShare()
      return
    }

    if (mode === "strict") {
      const gracePeriod = session?.examSettings?.screenShareGracePeriod ?? 20
      toast.warning(
        localizeText("Screen sharing stopped!", "توقفت مشاركة الشاشة!", language),
        {
          description: localizeText(
            `You have ${gracePeriod} seconds to resume screen sharing before an action is taken.`,
            `لديك ${gracePeriod} ثانية لاستئناف مشاركة الشاشة قبل اتخاذ إجراء.`,
            language
          ),
          duration: gracePeriod * 1000,
        }
      )
      // Start grace period timer
      if (screenShareGraceTimerRef.current) clearTimeout(screenShareGraceTimerRef.current)
      screenShareGraceTimerRef.current = setTimeout(() => {
        // Check if screen share resumed during grace period
        if (screenSharePublisherRef.current?.currentStatus === "active") return
        // Grace period expired — log violation (counts toward MaxViolationWarnings)
        logAttemptEvent(session.attemptId, {
          eventType: "ScreenSharePermissionRevoked",
          metadataJson: JSON.stringify({ reason: "grace_period_expired", gracePeriodSeconds: gracePeriod }),
        }).catch(() => {})
        // Auto-restart screen share
        autoStartScreenShare()
      }, gracePeriod * 1000)
      return
    }
  }

  async function handleScreenShareAccept() {
    setScreenShareConsentOpen(false)
    await autoStartScreenShare()
  }

  function handleScreenShareSkip() {
    setScreenShareConsentOpen(false)
    logAttemptEvent(session!.attemptId, { eventType: "ScreenShareDenied", metadataJson: JSON.stringify({ reason: "user_skipped" }) }).catch(() => {})
  }

  // Stop all background timers/intervals/webcam to prevent 400s on closed attempt
  function stopAllBackgroundActivity() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = undefined }
    if (sectionTimerRef.current) { clearInterval(sectionTimerRef.current); sectionTimerRef.current = undefined }
    if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = undefined }
    if (snapshotIntervalRef.current) { clearInterval(snapshotIntervalRef.current); snapshotIntervalRef.current = undefined }
    if (proctorPollRef.current) { clearInterval(proctorPollRef.current); proctorPollRef.current = undefined }
    // Stop WebRTC publisher
    publisherRef.current?.stop().catch(() => {})
    publisherRef.current = null
    // Stop smart monitoring
    smartMonitoringRef.current?.dispose()
    smartMonitoringRef.current = null
    // Stop screen share publisher
    screenSharePublisherRef.current?.stop().catch(() => {})
    screenSharePublisherRef.current = null
    if (screenShareGraceTimerRef.current) { clearTimeout(screenShareGraceTimerRef.current); screenShareGraceTimerRef.current = undefined }
    // Stop webcam stream
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop())
      webcamStreamRef.current = null
    }
  }

  // â”€â”€ Smart Polling: poll proctor status ONLY when SignalR is disconnected â”€â”€
  // When SignalR is connected, warnings + termination arrive instantly via push.
  // When SignalR disconnects, start 15s fallback polling.
  // On reconnect, do one sync fetch then stop polling again.
  useEffect(() => {
    if (!session) return

    if (signalRConnected) {
      // SignalR is healthy â€” stop polling, do one sync fetch to catch anything missed
      if (proctorPollRef.current) {
        console.log("[SmartPoll] SignalR connected â€” stopping fallback polling")
        clearInterval(proctorPollRef.current)
        proctorPollRef.current = undefined
      }
      // One-time sync fetch on reconnect
      getCandidateSessionStatus(session.attemptId).then((status) => {
        if (status.isTerminated) {
          stopAllBackgroundActivity()
          toast.error(
            translateCandidateMessage(status.terminationReason) ?? t("exam.terminatedByProctor"),
            { duration: 10000 }
          )
          router.push("/my-exams")
          return
        }
        if (status.hasWarning && status.warningMessage) {
          showWarningMessage(status.warningMessage)
        }
      }).catch(() => {})
    } else {
      // SignalR is disconnected â€” start 15s fallback polling
      if (!proctorPollRef.current) {
        console.log("[SmartPoll] SignalR disconnected â€” starting 15s fallback polling")
        proctorPollRef.current = setInterval(async () => {
          try {
            const status = await getCandidateSessionStatus(session.attemptId)
            if (status.isTerminated) {
              stopAllBackgroundActivity()
              toast.error(
                translateCandidateMessage(status.terminationReason) ?? t("exam.terminatedByProctor"),
                { duration: 10000 }
              )
              router.push("/my-exams")
              return
            }
            if (status.hasWarning && status.warningMessage) {
          showWarningMessage(status.warningMessage)
        }
          } catch {
            // Silent fail â€” don't disrupt exam
          }
        }, 15000)
      }
    }

    return () => {
      if (proctorPollRef.current) {
        clearInterval(proctorPollRef.current)
        proctorPollRef.current = undefined
      }
    }
  }, [session?.attemptId, signalRConnected])

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

      // Stop chunk recorder and flush pending uploads
      if (chunkRecorderRef.current) {
        try {
          await chunkRecorderRef.current.stop()
        } catch (e) {
          console.warn("[Proctor] ChunkRecorder stop failed:", e)
        }
        chunkRecorderRef.current = null
      }

      // Notify proctor via SignalR BEFORE stopping background activity (connection is still alive)
      if (publisherRef.current?.signalingConnection) {
        try {
          await publisherRef.current.signalingConnection.notifyExamSubmitted()
          console.log('[ExamPage] Proctor notified of exam submission via SignalR')
        } catch (e) {
          console.warn('[ExamPage] Failed to notify proctor of submission (non-fatal):', e)
        }
      }

      // Stop all background calls BEFORE submit to prevent race conditions
      stopAllBackgroundActivity()

      await logAttemptEvent(session.attemptId, {
        eventType: AttemptEventType.Submitted,
      }).catch(() => { })

      // Finalize video recording in background (fire-and-forget â€” never delays submit)
      // Backend returns 202 Accepted and processes FFmpeg in background
      if (session.attemptId) {
        try {
          const token = localStorage.getItem("auth_token")
          fetch(`/api/proxy/Proctor/video-finalize/${session.attemptId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }).then(() => {
            console.log("[Proctor] Video finalize request sent (202 accepted)")
          }).catch((e) => {
            console.warn("[Proctor] Video finalize request failed (non-fatal):", e)
          })
        } catch (e) {
          console.warn("[Proctor] Video finalize setup failed (non-fatal):", e)
        }
      }

      const result = await submitAttempt(session.attemptId)

      toast.success(t("exam.submitted"))

      // If grading completed synchronously and result exists, go to score-card
      if (result && result.resultId && result.resultId > 0) {
        router.push(`/results/${session.attemptId}?submitted=true`)
      } else {
        // Grading is async / pending â€” go back to my-exams safely
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
      toast.success(t("exam.cameraConnected"))

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
                setLastSnapshotTime(new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dubai" }))
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
      toast.error(t("exam.cameraAccessFailed"))
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

  function getFlaggedInSection(section: ExamSection): number {
    let count = 0
    for (const topic of section.topics || []) {
      for (const q of topic.questions || []) {
        if (flagged.has(q.questionId)) count++
      }
    }
    for (const q of section.questions || []) {
      if (flagged.has(q.questionId)) count++
    }
    return count
  }

  function getAllSectionQuestions(section: ExamSection): AttemptQuestionDto[] {
    const questions: AttemptQuestionDto[] = []
    for (const topic of section.topics || []) {
      questions.push(...(topic.questions || []).sort((a, b) => a.order - b.order))
    }
    questions.push(...(section.questions || []).sort((a, b) => a.order - b.order))
    return questions
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
                  {dir === "rtl" ? <ArrowRight className="h-4 w-4 me-2" /> : <ArrowLeft className="h-4 w-4 me-2" />}
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
    <div className="flex h-screen flex-col bg-background" dir={dir}>
      {/* Webcam denial / snapshot persistent error banner (only if webcam required) */}
      {session?.examSettings?.requireWebcam && (webcamStatus === "denied" || webcamStatus === "error") && (
        <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <CameraOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {webcamStatus === "denied"
              ? t("exam.cameraPermissionRequired")
              : t("exam.cameraError", { error: webcamError ?? t("common.unknown") })}
          </span>
          <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={handleRetryWebcam}>
            <RefreshCw className="h-3 w-3 me-1" />
            {t("exam.retryCamera")}
          </Button>
        </div>
      )}
      {session?.examSettings?.requireWebcam && snapshotFailStreak >= 3 && webcamStatus === "active" && (
        <div className="flex items-center gap-3 border-b bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          <CameraOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t("exam.snapshotUploadIncompleteWarning")}</span>
        </div>
      )}

      {/* Header with timer and submit button */}
      <div className="border-b bg-card px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{examTitle}</h1>
            <p className="text-xs text-muted-foreground">
              {t("exam.progress")}: {answeredCount}/{totalQuestions} - {Math.round(progress)}%
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Section Timer */}
            {sectionTimeRemaining !== undefined && sectionTimeRemaining !== null && (
              <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 dark:border-orange-900 dark:bg-orange-950">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  {t("exam.sectionTime")}: {formatTime(sectionTimeRemaining)}
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
                {t("exam.timeRemaining")}: {formatTime(examTimeRemaining)}
              </p>
            </div>

            {/* Auto-save indicator */}
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground animate-pulse">
                {t("exam.saving")}
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("exam.saved")}
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("exam.saveFailed")}
              </span>
            )}

            {/* Proctoring indicator (only if webcam required) */}
            {session?.examSettings?.requireWebcam && (
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                webcamStatus === "active" && lastSnapshotOk !== false
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
              )}
              title={lastSnapshotTime ? t("exam.lastSnapshotAt", { time: lastSnapshotTime }) : t("exam.waitingForFirstSnapshot")}
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
                  : t("common.off")}
              </span>
            </div>
            )}

            {/* Screen share indicator (only if screen monitoring enabled) */}
            {session?.examSettings?.enableScreenMonitoring && (
            <div
              role={screenShareStatus !== "active" ? "button" : undefined}
              tabIndex={screenShareStatus !== "active" ? 0 : undefined}
              onClick={screenShareStatus !== "active" ? () => autoStartScreenShare() : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                screenShareStatus === "active"
                  ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300"
                  : screenShareStatus === "lost" || screenShareStatus === "failed"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900",
              )}
              title={screenShareStatus !== "active" ? localizeText("Click to share screen", "اضغط لمشاركة الشاشة", language) : undefined}
            >
              <Monitor className="h-3 w-3" />
              <span className="hidden sm:inline">
                {screenShareStatus === "active"
                  ? t("exam.screenSharing")
                  : screenShareStatus === "lost"
                    ? t("exam.screenLost")
                    : screenShareStatus === "failed"
                      ? t("exam.screenFailed")
                      : t("exam.screenOff")}
              </span>
            </div>
            )}

            {/* Calculator Toggle - shown only when current section/question allows it */}
            {isCalculatorAllowedInContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculator(!showCalculator)}
                className={cn("gap-1.5", showCalculator && "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900")}
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">{t("exam.calculator")}</span>
              </Button>
            )}

            {/* Spreadsheet Toggle - shown only when calculator is allowed */}
            {isCalculatorAllowedInContext && (
              <SpreadsheetButton
                isOpen={showSpreadsheet}
                onClick={() => setShowSpreadsheet(!showSpreadsheet)}
                label={t("exam.spreadsheet")}
              />
            )}

            {/* Summary Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className={cn("gap-1.5", showSummary && "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900")}
            >
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">{t("exam.summary")}</span>
            </Button>

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
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden min-w-0">
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

                <div className="flex items-center gap-3">
                  {/* Calculator button â€” only if current question allows it */}
                  {currentFlatQuestion?.isCalculatorAllowed && (
                    <CalculatorButton
                      isOpen={showCalculator}
                      onClick={() => setShowCalculator(prev => !prev)}
                    />
                  )}
                  <p className="text-sm font-medium">
                    {t("exam.question")} {currentQuestionIndex + 1} {t("exam.of")} {flatQuestions.length}
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

        {/* Summary Panel */}
        {showSummary && (
          <div className={cn("w-72 bg-muted/20 flex flex-col overflow-hidden shrink-0", dir === "rtl" ? "border-r" : "border-l")}>
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                {t("exam.summaryTitle")}
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSummary(false)}>
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {/* Overall Stats */}
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    {t("exam.summaryOverall")}
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        {t("exam.answered")}
                      </span>
                      <span className="font-semibold">{answeredCount}/{totalQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        {t("exam.unanswered")}
                      </span>
                      <span className="font-semibold">{totalQuestions - answeredCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                        {t("exam.flagged")}
                      </span>
                      <span className="font-semibold">{flagged.size}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-0.5 text-[10px] text-end text-muted-foreground">{Math.round(progress)}%</p>
                  </div>
                </div>

                {/* Per-Section Stats */}
                {hasSections && sections.map((section) => {
                  const sectionTotal = getSectionQuestionsCount(section)
                  const sectionAnswered = getAnsweredInSection(section)
                  const sectionFlaggedCount = getFlaggedInSection(section)
                  const sectionProgress = sectionTotal > 0 ? (sectionAnswered / sectionTotal) * 100 : 0
                  const sectionQuestions = getAllSectionQuestions(section)
                  const isActive = section.sectionId === currentSectionId
                  const sectionIndex = sections.findIndex(s => s.sectionId === section.sectionId)
                  const currentIdx = sections.findIndex(s => s.sectionId === currentSectionId)
                  const isPrevLocked = sectionIndex < currentIdx && session?.examSettings?.lockPreviousSections
                  const isExpired = sectionTimers[section.sectionId] !== undefined && sectionTimers[section.sectionId] <= 0
                  const isDisabled = (isPrevLocked || isExpired) && !isActive

                  return (
                    <div
                      key={section.sectionId}
                      className={cn(
                        "rounded-lg border p-3 space-y-2 transition-colors",
                        isActive ? "border-primary bg-primary/5" : "",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"
                      )}
                      onClick={() => {
                        if (isDisabled) {
                          toast.warning(isExpired
                            ? t("exam.thisSectionExpired")
                            : t("exam.cannotGoBack"))
                          return
                        }
                        if (sectionIndex > currentIdx && session?.examSettings?.lockPreviousSections) {
                          setPendingSectionId(section.sectionId)
                          setSectionChangeConfirmOpen(true)
                          return
                        }
                        setCurrentSectionId(section.sectionId)
                      }}
                    >
                      <h3 className="text-xs font-semibold truncate flex items-center gap-1.5" title={getLocalizedField(section, "title", language)}>
                        {(isPrevLocked || isExpired) && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        {getLocalizedField(section, "title", language)}
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {t("exam.answered")}
                          </span>
                          <span className="font-medium">{sectionAnswered}/{sectionTotal}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {t("exam.unanswered")}
                          </span>
                          <span className="font-medium">{sectionTotal - sectionAnswered}</span>
                        </div>
                        {sectionFlaggedCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-orange-500" />
                              {t("exam.flagged")}
                            </span>
                            <span className="font-medium">{sectionFlaggedCount}</span>
                          </div>
                        )}
                      </div>
                      {/* Section progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${sectionProgress}%` }} />
                      </div>
                      {/* Question number grid */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {sectionQuestions.map((q, i) => {
                          const isAnswered = !!answers[q.questionId]
                          const isQFlagged = flagged.has(q.questionId)
                          return (
                            <div
                              key={q.questionId}
                              className={cn(
                                "h-6 w-6 rounded text-[10px] font-medium flex items-center justify-center",
                                isAnswered && !isQFlagged && "bg-emerald-500 text-white",
                                isAnswered && isQFlagged && "bg-emerald-500 text-white ring-2 ring-orange-400",
                                !isAnswered && isQFlagged && "bg-orange-100 text-orange-700 ring-2 ring-orange-400 dark:bg-orange-950 dark:text-orange-300",
                                !isAnswered && !isQFlagged && "bg-muted text-muted-foreground"
                              )}
                              title={[
                                `${t("exam.question")} ${i + 1}`,
                                isAnswered ? t("exam.answered") : t("exam.unanswered"),
                                isQFlagged ? t("exam.flagged") : null,
                              ].filter(Boolean).join(" - ")}
                            >
                              {i + 1}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Flat question grid */}
                {!hasSections && flatQuestions.length > 0 && (
                  <div className="rounded-lg border bg-card p-3 space-y-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                      {t("common.questions")}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {flatQuestions.map((q, i) => {
                        const isAnswered = !!answers[q.questionId]
                        const isQFlagged = flagged.has(q.questionId)
                        const isCurrent = i === currentQuestionIndex
                        return (
                          <button
                            key={q.questionId}
                            onClick={() => setCurrentQuestionIndex(i)}
                            className={cn(
                              "h-7 w-7 rounded text-xs font-medium flex items-center justify-center transition-colors cursor-pointer",
                              isAnswered && !isQFlagged && "bg-emerald-500 text-white",
                              isAnswered && isQFlagged && "bg-emerald-500 text-white ring-2 ring-orange-400",
                              !isAnswered && isQFlagged && "bg-orange-100 text-orange-700 ring-2 ring-orange-400 dark:bg-orange-950 dark:text-orange-300",
                              !isAnswered && !isQFlagged && "bg-muted text-muted-foreground",
                              isCurrent && "ring-2 ring-primary"
                            )}
                            title={[
                              `${t("exam.question")} ${i + 1}`,
                              isAnswered ? t("exam.answered") : t("exam.unanswered"),
                              isQFlagged ? t("exam.flagged") : null,
                            ].filter(Boolean).join(" - ")}
                          >
                            {i + 1}
                          </button>
                        )
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-emerald-500" />
                        {t("exam.answered")}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-muted border" />
                        {t("exam.unanswered")}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded bg-orange-100 ring-1 ring-orange-400" />
                        {t("exam.flagged")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Floating Calculator */}
      {showCalculator && (
        <ExamCalculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Floating Spreadsheet */}
      {showSpreadsheet && (
        <ExamSpreadsheet onClose={() => setShowSpreadsheet(false)} />
      )}

      {/* Submit confirmation dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exam.confirmSubmit")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("exam.confirmSubmitDesc")}</p>
                <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>{t("exam.answered") || "Answered"}</span>
                    <span className="font-medium text-foreground">{answeredCount} / {totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("exam.unanswered") || "Unanswered"}</span>
                    <span className="font-medium text-foreground">{totalQuestions - answeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("exam.flagged") || "Flagged"}</span>
                    <span className="font-medium text-foreground">{flagged.size}</span>
                  </div>
                </div>
                {totalQuestions - answeredCount > 0 && (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{(t("exam.unansweredWarning") || "{count} unanswered questions").replace("{count}", String(totalQuestions - answeredCount))}</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : (t("exam.confirmAndSubmit") || t("common.submit"))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section change confirmation dialog */}
      <AlertDialog open={sectionChangeConfirmOpen} onOpenChange={setSectionChangeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exam.confirmSectionChange") || "Move to Next Section?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("exam.sectionChangeLocked") || "If you continue, you will not be able to return to this section again."}</p>
                {currentSection && (() => {
                  const sectionTotal = getSectionQuestionsCount(currentSection)
                  const sectionAnswered = getAnsweredInSection(currentSection)
                  const sectionUnanswered = sectionTotal - sectionAnswered
                  const sectionFlagged = (() => {
                    let count = 0
                    for (const topic of currentSection.topics || []) {
                      for (const q of topic.questions || []) {
                        if (flagged.has(q.questionId)) count++
                      }
                    }
                    for (const q of currentSection.questions || []) {
                      if (flagged.has(q.questionId)) count++
                    }
                    return count
                  })()
                  return (
                    <>
                      <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span>{t("exam.answered") || "Answered"}</span>
                          <span className="font-medium text-foreground">{sectionAnswered} / {sectionTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("exam.unanswered") || "Unanswered"}</span>
                          <span className="font-medium text-foreground">{sectionUnanswered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t("exam.flagged") || "Flagged"}</span>
                          <span className="font-medium text-foreground">{sectionFlagged}</span>
                        </div>
                      </div>
                      {sectionUnanswered > 0 && (
                        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>{(t("exam.unansweredWarning") || "{count} unanswered questions").replace("{count}", String(sectionUnanswered))}</span>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
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

      {/* Proctor Warning Dialog */}
      <AlertDialog open={proctorWarningOpen} onOpenChange={setProctorWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t("exam.proctorWarningTitle") || "Warning from Proctor"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  {proctorWarningMessage}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("exam.proctorWarningNote") || "Please follow the proctor's instructions. Continued violations may result in session termination."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setProctorWarningOpen(false)}>
              {t("exam.understood") || "I Understand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Last Warning Dialog â€” blocking modal before auto-termination */}
      <AlertDialog open={lastWarningOpen}>
        <AlertDialogContent className="border-red-300 dark:border-red-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              {t("exam.lastWarningTitle") || "âš  FINAL WARNING"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {lastWarningMessage}
                </div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {t("exam.lastWarningNote") || "The next violation will automatically terminate your exam. Please correct your behavior immediately."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setLastWarningOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("exam.understood") || "I Understand"}
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
  const { t, dir } = useI18n()
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
          <Card className="border-s-4 border-s-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
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
          <Card className="border-s-4 border-s-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20">
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
          <Card className="border-s-4 border-s-primary">
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
                  <Card className="border-s-4 border-s-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
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
                {dir === "rtl" ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
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
  const { t } = useI18n()
  const questionBody = getLocalizedField(question, "body", language)

  // Find primary image attachment for the question
  const primaryImage = question.attachments?.find((a: any) => a.isPrimary && a.fileType?.toLowerCase().includes('image'))
  const anyImage = !primaryImage ? question.attachments?.find((a: any) => a.fileType?.toLowerCase().includes('image')) : null
  const questionImage = primaryImage || anyImage

  return (
    <Card className="shadow-sm" dir={language === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="border-b bg-muted/20 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {t("exam.question")} {questionNumber} {t("exam.of")} {totalQuestions}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getQuestionTypeDisplayName(question.questionTypeName, language)}
              </Badge>
              <Badge variant="secondary" className="text-xs">{question.points} {t("common.points")}</Badge>
              {isSaving && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <LoadingSpinner size="sm" /> {t("exam.saving")}
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

        {/* Question Image â€” shown inside the question area, above options */}
        {questionImage && (
          <div className="mt-3 flex justify-center overflow-hidden rounded-lg border bg-muted/30">
            <ImageZoomModal
              src={questionImage.filePath}
              alt={t("exam.questionImageAlt")}
              thumbnailClassName="max-h-64 w-auto object-contain"
            />
          </div>
        )}
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



