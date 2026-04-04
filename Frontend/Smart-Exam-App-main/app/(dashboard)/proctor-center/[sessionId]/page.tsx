"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getSessionDetails, refreshSessionData, reviewIncident, flagSession, sendWarning, terminateSession, getAttemptEvents, getEventTypeName, isViolationEvent, getEventSeverity, createIncidentFromProctor, getAiProctorAnalysis, type AttemptEventDto, type AiProctorAnalysis } from "@/lib/api/proctoring"
import { addTimeToAttempt } from "@/lib/api/attempt-control"
import type { LiveSession, Incident } from "@/lib/types/proctoring"
import { ProctorViewer, type ViewerStatus } from "@/lib/webrtc/proctor-viewer"
import { ScreenShareViewer, type ScreenViewerStatus } from "@/lib/webrtc/screen-share-viewer"
import { getVideoConfig } from "@/lib/webrtc/video-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  ArrowLeft,
  Flag,
  MessageSquare,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  User,
  Camera,
  Activity,
  Video,
  Play,
  Clock,
  Plus,
  Shield,
  FileText,
  Maximize2,
  Minimize2,
  CheckCircle2 as CheckCircle2Icon,
  Brain,
  Sparkles,
  Loader2,
  Monitor,
  Globe,
  Zap,
} from "lucide-react"

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()

  const [session, setSession] = useState<LiveSession | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [screenshots, setScreenshots] = useState<Array<{ id: string; timestamp: string; url: string }>>([])
  const [loading, setLoading] = useState(true)

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [reviewAction, setReviewAction] = useState<"dismiss" | "flag" | "terminate">("dismiss")
  const [reviewNotes, setReviewNotes] = useState("")
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [terminateReason, setTerminateReason] = useState("")
  const [previewImage, setPreviewImage] = useState<{ url: string; timestamp: string } | null>(null)

  // Events log state
  const [events, setEvents] = useState<AttemptEventDto[]>([])
  const [eventsFilter, setEventsFilter] = useState<"all" | "violations">("violations")

  // Add Time dialog state
  const [addTimeDialogOpen, setAddTimeDialogOpen] = useState(false)
  const [addTimeMinutes, setAddTimeMinutes] = useState(10)
  const [addTimeReason, setAddTimeReason] = useState("")
  const [addTimeLoading, setAddTimeLoading] = useState(false)

  // WebRTC live video state
  const videoRef = useRef<HTMLVideoElement>(null)
  const viewerRef = useRef<ProctorViewer | null>(null)
  const sessionPollRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("offline")
  const [hasRemoteStream, setHasRemoteStream] = useState(false)
  const [signalRConnected, setSignalRConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sessionEnded, setSessionEnded] = useState<{ reason: "Submitted" | "Expired" | "Terminated" } | null>(null)

  // Screen share viewer state
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const screenViewerRef = useRef<ScreenShareViewer | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const [screenViewerStatus, setScreenViewerStatus] = useState<ScreenViewerStatus>("offline")
  const [hasScreenStream, setHasScreenStream] = useState(false)

  // AI Proctor Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<AiProctorAnalysis | null>(null)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  // ── Smart Polling: poll session data ONLY when SignalR is disconnected ──
  // When SignalR is connected, updates arrive via push events (ExamSubmitted, etc.).
  // When SignalR disconnects, start 15s fallback polling.
  // On reconnect, do one sync fetch then stop polling again.
  useEffect(() => {
    if (!session || session.status !== "Active") return

    if (signalRConnected) {
      // SignalR is healthy — stop polling, do one sync fetch
      if (sessionPollRef.current) {
        console.log("[SmartPoll] SignalR connected — stopping session fallback polling")
        clearInterval(sessionPollRef.current)
        sessionPollRef.current = undefined
      }
      // One-time sync fetch on reconnect
      refreshSessionData(sessionId).then((data) => {
        setSession(data.session)
        setScreenshots(data.screenshots)
      }).catch(() => {})
    } else {
      // SignalR is disconnected — start 15s fallback polling
      if (!sessionPollRef.current) {
        console.log("[SmartPoll] SignalR disconnected — starting 15s session fallback polling")
        sessionPollRef.current = setInterval(async () => {
          try {
            const data = await refreshSessionData(sessionId)
            setSession(data.session)
            setScreenshots(data.screenshots)
            // Detect session ended from polling (server already closed the session)
            if (data.session.status !== "Active" && !sessionEnded) {
              const reason = data.session.status === "Completed" ? "Submitted"
                : data.session.status === "Cancelled" ? "Terminated"
                : "Expired"
              setSessionEnded({ reason: reason as "Submitted" | "Expired" | "Terminated" })
              setHasRemoteStream(false)
              viewerRef.current?.disconnect()
              const reportUrl = `/results/ai-report/${data.session.examId}/${data.session.candidateId}`
              toast.info(
                `${t("proctor.sessionTerminatedTitle")}: ${reason}`,
                {
                  description: t("proctor.redirectingToReport", { seconds: "10" }),
                  duration: 10000,
                  action: {
                    label: t("proctor.viewReportNow"),
                    onClick: () => router.push(reportUrl),
                  },
                }
              )
              setTimeout(() => {
                router.push(reportUrl)
              }, 10000)
            }
          } catch {
            // silent — don't redirect on poll failure
          }
        }, 15_000)
      }
    }

    return () => {
      if (sessionPollRef.current) {
        clearInterval(sessionPollRef.current)
        sessionPollRef.current = undefined
      }
    }
  }, [sessionId, session?.status, signalRConnected])

  // WebRTC live video: connect viewer when session is active and live video is enabled
  useEffect(() => {
    console.log(`%c[ProctorPage] WebRTC effect: session=${session?.id}, status=${session?.status}, attemptId=${session?.attemptId}`, 'color: #e91e63; font-weight: bold')
    if (!session || session.status !== "Active" || !session.attemptId) {
      console.warn(`[ProctorPage] Skipping WebRTC: session=${!!session}, status=${session?.status}, attemptId=${session?.attemptId}`)
      return
    }
    let cancelled = false

    console.log(`%c[ProctorPage] Fetching video config for attempt ${session.attemptId}...`, 'color: #e91e63; font-weight: bold')
    getVideoConfig().then((cfg) => {
      console.log(`%c[ProctorPage] Video config: enableLiveVideo=${cfg.enableLiveVideo}, enableVideoRecording=${cfg.enableVideoRecording}`, 'color: #e91e63; font-weight: bold')
      if (cancelled) { console.warn('[ProctorPage] Cancelled, skipping viewer init'); return }
      if (!cfg.enableLiveVideo) { console.warn('[ProctorPage] enableLiveVideo=false, skipping viewer'); return }

      console.log(`%c[ProctorPage] ✅ Creating ProctorViewer for attempt ${session.attemptId}`, 'color: #4caf50; font-weight: bold')
      const viewer = new ProctorViewer(session.attemptId!, {
        onStatusChange: (status) => {
          console.log(`%c[ProctorPage] Viewer status changed: ${status}`, status === 'live' ? 'color: #4caf50; font-weight: bold' : 'color: #ff9800')
          setViewerStatus(status)
        },
        onRemoteStream: (stream) => {
          console.log(`%c[ProctorPage] ✅ Remote stream received! tracks=${stream.getTracks().length}`, 'color: #4caf50; font-weight: bold')
          setHasRemoteStream(true)
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
        },
        onExamSubmitted: (attemptId) => {
          // Show session-ended overlay and stop live video
          setSessionEnded({ reason: "Submitted" })
          setHasRemoteStream(false)
          viewerRef.current?.disconnect()
          // Refresh session data to reflect updated status
          refreshSessionData(sessionId).then((data) => {
            setSession(data.session)
            setScreenshots(data.screenshots)
          }).catch(() => {})

          // Build the redirect URL — recording page with all session evidence
          const reportUrl = `/results/ai-report/${session?.examId}/${session?.candidateId}`

          // Prominent toast with 15s duration + action button
          toast.success(
            t("proctor.candidateSubmittedExam", { id: String(attemptId) }),
            {
              description: t("proctor.redirectingToReport", { seconds: "15" }),
              duration: 15000,
              icon: "✅",
              action: {
                label: t("proctor.viewReportNow"),
                onClick: () => router.push(reportUrl),
              },
            }
          )

          // Auto-redirect after 15 seconds
          setTimeout(() => {
            router.push(reportUrl)
          }, 15000)
        },
        onExamTerminated: (termEvent) => {
          // Auto-termination (max violations) or proctor-initiated termination
          setSessionEnded({ reason: "Terminated" })
          setHasRemoteStream(false)
          viewerRef.current?.disconnect()
          // Refresh session data to reflect updated status
          refreshSessionData(sessionId).then((data) => {
            setSession(data.session)
            setScreenshots(data.screenshots)
          }).catch(() => {})

          const reportUrl = `/results/ai-report/${session?.examId}/${session?.candidateId}`

          toast.error(
            t("proctor.examTerminatedReason", { reason: termEvent.reason }),
            {
              description: t("proctor.redirectingToReport", { seconds: "10" }),
              duration: 10000,
              icon: "🚫",
              action: {
                label: t("proctor.viewReportNow"),
                onClick: () => router.push(reportUrl),
              },
            }
          )

          setTimeout(() => {
            router.push(reportUrl)
          }, 10000)
        },
        onSignalRStatusChange: (connected) => {
          console.log(`[SmartPoll] Proctor SignalR status changed: connected=${connected}`)
          setSignalRConnected(connected)
        },
        onViolationEventReceived: (event) => {
          // Real-time violation event from candidate — prepend to events log
          const newEvent: AttemptEventDto = {
            id: event.id,
            attemptId: event.attemptId,
            eventType: event.eventTypeId,
            eventTypeName: event.eventType,
            metadataJson: event.metadataJson,
            occurredAt: event.occurredAt,
          }
          setEvents((prev) => [newEvent, ...prev])
          // Show toast for critical events
          if (event.severity === "Critical" || event.severity === "High") {
            toast.warning(t("proctor.violationLabel", { type: event.eventType }), {
              description: t("proctor.severityLabel", { severity: event.severity }),
              duration: 5000,
            })
          }
        },
        onAttemptExpired: (expEvent) => {
          setSessionEnded({ reason: "Expired" })
          setHasRemoteStream(false)
          viewerRef.current?.disconnect()
          refreshSessionData(sessionId).then((data) => {
            setSession(data.session)
            setScreenshots(data.screenshots)
          }).catch(() => {})

          const reportUrl = `/results/ai-report/${session?.examId}/${session?.candidateId}`

          toast.warning(t("proctor.examExpiredAttempt", { id: String(expEvent.attemptId) }), {
            description: t("proctor.redirectingToReport", { seconds: "10" }),
            duration: 10000,
            icon: "⏰",
            action: {
              label: t("proctor.viewReportNow"),
              onClick: () => router.push(reportUrl),
            },
          })

          setTimeout(() => {
            router.push(reportUrl)
          }, 10000)
        },
      })

      viewerRef.current = viewer
      viewer.connect().catch((e) => console.error("[ProctorPage] WebRTC connect failed (non-fatal):", e))

      // Screen share viewer (only if exam has screen monitoring enabled)
      if (cfg.enableScreenMonitoring) {
        console.log(`%c[ProctorPage] Creating ScreenShareViewer for attempt ${session.attemptId}`, 'color: #9c27b0; font-weight: bold')
        const screenViewer = new ScreenShareViewer(session.attemptId!, {
          onStatusChange: (status) => {
            console.log(`%c[ProctorPage] Screen viewer status: ${status}`, status === 'live' ? 'color: #4caf50; font-weight: bold' : 'color: #ff9800')
            setScreenViewerStatus(status)
          },
          onRemoteStream: (stream) => {
            console.log(`%c[ProctorPage] ✅ Screen stream received! tracks=${stream.getTracks().length}`, 'color: #9c27b0; font-weight: bold')
            screenStreamRef.current = stream
            setHasScreenStream(true)
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = stream
              screenVideoRef.current.play().catch(() => {})
            }
          },
          onScreenShareStatusChanged: (status) => {
            console.log(`[ProctorPage] Screen share status changed: ${status}`)
            if (status === "stopped" || status === "lost") {
              setHasScreenStream(false)
            }
          },
        })
        screenViewerRef.current = screenViewer
        screenViewer.connect().catch((e) => console.error("[ProctorPage] Screen viewer connect failed (non-fatal):", e))
      }
    }).catch((e) => {
      console.warn("[ProctorPage] Video config fetch failed (non-fatal):", e)
    })

    return () => {
      cancelled = true
      viewerRef.current?.disconnect()
      viewerRef.current = null
      screenViewerRef.current?.disconnect()
      screenViewerRef.current = null
      screenStreamRef.current = null
      setHasRemoteStream(false)
      setHasScreenStream(false)
      setViewerStatus("offline")
      setScreenViewerStatus("offline")
    }
  }, [session?.attemptId, session?.status])

  // Ensure screen stream is assigned to video element after React makes it visible
  useEffect(() => {
    if (hasScreenStream && screenVideoRef.current && screenStreamRef.current) {
      if (screenVideoRef.current.srcObject !== screenStreamRef.current) {
        screenVideoRef.current.srcObject = screenStreamRef.current
      }
      screenVideoRef.current.play().catch(() => {})
    }
  }, [hasScreenStream])

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  // Detect session end from polling/refresh (status changed to non-Active)
  useEffect(() => {
    if (session && session.status !== "Active" && !sessionEnded) {
      const reason = session.status === "Terminated" ? "Terminated" : "Submitted"
      setSessionEnded({ reason })
      setHasRemoteStream(false)
      viewerRef.current?.disconnect()
    }
  }, [session?.status])

  async function loadSession() {
    try {
      setLoading(true)
      const data = await getSessionDetails(sessionId)
      setSession(data.session)
      setIncidents(data.incidents)
      setScreenshots(data.screenshots)

      // Detect if session is already ended (e.g. candidate submitted while proctor was away)
      if (data.session?.status && data.session.status !== "Active" && !sessionEnded) {
        const reason = data.session.status === "Completed" ? "Submitted"
          : data.session.status === "Cancelled" ? "Terminated"
          : "Expired"
        setSessionEnded({ reason: reason as "Submitted" | "Expired" | "Terminated" })
      }

      // Load attempt events for events log
      if (data.session?.attemptId) {
        const attemptEvents = await getAttemptEvents(data.session.attemptId)
        setEvents(attemptEvents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()))
      }
    } catch (error) {
      toast.error(t("proctor.failedToLoadSession"))
      router.push("/proctor-center")
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewIncident() {
    if (!selectedIncident) return
    try {
      await reviewIncident(selectedIncident.id, { action: reviewAction, notes: reviewNotes })
      toast.success(t("proctor.incidentReviewed"))
      setReviewDialogOpen(false)
      setSelectedIncident(null)
      setReviewNotes("")
      loadSession()
    } catch (error) {
      toast.error(t("proctor.failedToReviewIncident"))
    }
  }

  async function handleToggleFlag() {
    if (!session) return
    try {
      await flagSession(session.id, !session.flagged)
      toast.success(session.flagged ? t("proctor.unflagged") : t("proctor.flagged"))
      loadSession()
    } catch (error) {
      toast.error(t("proctor.failedToUpdateFlag"))
    }
  }

  async function handleSendWarning() {
    if (!session || !warningMessage.trim()) return
    try {
      await sendWarning(session.id, warningMessage)
      // Also send instantly via SignalR (best-effort, won't fail the operation)
      try {
        await viewerRef.current?.signalingConnection?.sendWarningToCandidate(warningMessage)
      } catch (e) {
        console.warn("[ProctorPage] SignalR instant warning failed (non-fatal):", e)
      }
      toast.success(t("proctor.warningSent"))
      setWarningDialogOpen(false)
      setWarningMessage("")
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to send warning"
      toast.error(errMsg, {
        description: t("proctor.sessionMayNotBeActive"),
        duration: 8000,
      })
    }
  }

  async function handleTerminate() {
    if (!session || !terminateReason.trim()) return
    try {
      await terminateSession(session.id, terminateReason)
      // Also notify candidate instantly via SignalR (best-effort)
      try {
        await viewerRef.current?.signalingConnection?.sendTerminationToCandidate(terminateReason)
      } catch (e) {
        console.warn("[ProctorPage] SignalR termination notification failed (non-fatal):", e)
      }
      toast.success(t("proctor.sessionTerminated"))
      setTerminateDialogOpen(false)
      setTerminateReason("")
      // Redirect to session report instead of the list
      if (session.attemptId) {
        router.push(`/results/ai-report/${session.examId}/${session.candidateId}`)
      } else {
        router.push("/proctor-center")
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : t("proctor.failedToCreateIncident")
      toast.error(errMsg, {
        description: t("proctor.sessionMayNotBeActive"),
        duration: 8000,
      })
    }
  }

  async function handleAddTime() {
    if (!session?.attemptId || addTimeMinutes <= 0) return
    try {
      setAddTimeLoading(true)
      await addTimeToAttempt({
        attemptId: session.attemptId,
        extraMinutes: addTimeMinutes,
        reason: addTimeReason || undefined,
      })
      toast.success(t("proctor.minutesAddedSuccess", { count: String(addTimeMinutes) }))
      setAddTimeDialogOpen(false)
      setAddTimeMinutes(10)
      setAddTimeReason("")
      // Refresh session data to show updated time
      loadSession()
    } catch (error) {
      toast.error(t("proctor.failedToAddTime"))
    } finally {
      setAddTimeLoading(false)
    }
  }

  async function handleCreateIncident() {
    if (!session) return
    try {
      const result = await createIncidentFromProctor(parseInt(session.id))
      toast.success(t("proctor.incidentCreatedNum", { num: result.caseNumber }))
      router.push(`/proctor-center/incidents/${result.id}`)
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToCreateIncident"))
    }
  }

  async function handleGenerateAiAnalysis() {
    if (!session) return
    try {
      setAiAnalysisLoading(true)
      setAiAnalysisError(null)
      const analysis = await getAiProctorAnalysis(session.id)
      setAiAnalysis(analysis)
      toast.success(t("proctor.aiAnalysisGenerated"))
    } catch (error: any) {
      const msg = error?.message || t("proctor.failedToGenerateAi")
      setAiAnalysisError(msg)
      toast.error(msg)
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    })
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case "Low":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30"
      case "Medium":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30"
      case "High":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30"
      case "Critical":
        return "bg-destructive/10 text-destructive border-destructive/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/proctor-center">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{session.candidateName}</h1>
              {session.flagged && (
                <Badge variant="outline" className="bg-amber-500/20 border-amber-500/50 text-amber-600">
                  <Flag className="h-3 w-3 me-1" />
                  {t("proctor.flagged")}
                </Badge>
              )}
              <Badge variant={session.status === "Active" ? "default" : "secondary"}>{session.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{session.examTitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {session.status === "Active" && (
            <Button variant="outline" onClick={() => setAddTimeDialogOpen(true)}>
              <Clock className="h-4 w-4 me-2" />
              {t("proctor.addTime")}
            </Button>
          )}
          <Button variant="outline" onClick={handleCreateIncident}>
            <AlertTriangle className="h-4 w-4 me-2" />
            {t("proctor.createIncident")}
          </Button>
          <Button variant="outline" onClick={handleToggleFlag}>
            <Flag className="h-4 w-4 me-2" />
            {session.flagged ? t("proctor.unflag") : t("proctor.flag")}
          </Button>
          {session.status === "Active" && (
            <Button variant="outline" onClick={() => setWarningDialogOpen(true)}>
              <MessageSquare className="h-4 w-4 me-2" />
              {t("proctor.sendWarning")}
            </Button>
          )}
          {session.status === "Active" && (
            <Button variant="destructive" onClick={() => setTerminateDialogOpen(true)}>
              <XCircle className="h-4 w-4 me-2" />
              {t("proctor.terminateSession")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Video / Latest Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  {t("proctor.liveVideo")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {session.status === "Active" && (
                    <Badge
                      variant="outline"
                      className={
                        viewerStatus === "live"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600"
                          : viewerStatus === "connecting" || viewerStatus === "reconnecting"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      <span className={`inline-block h-2 w-2 rounded-full me-1.5 ${
                        viewerStatus === "live" ? "bg-emerald-500 animate-pulse" :
                        viewerStatus === "connecting" || viewerStatus === "reconnecting" ? "bg-amber-500 animate-pulse" :
                        "bg-muted-foreground"
                      }`} />
                      {viewerStatus === "live" ? t("proctor.webcamLabel") + " " + "LIVE" :
                       viewerStatus === "connecting" ? t("proctor.connecting") :
                       viewerStatus === "reconnecting" ? t("proctor.reconnecting") :
                       t("proctor.offline")}
                    </Badge>
                  )}
                  {session.examEnableScreenMonitoring && session.status === "Active" && (
                    <Badge
                      variant="outline"
                      className={
                        screenViewerStatus === "live"
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-600"
                          : screenViewerStatus === "connecting" || screenViewerStatus === "reconnecting"
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-600"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      <Monitor className="h-3 w-3 me-1" />
                      {screenViewerStatus === "live" ? t("proctor.screenLive") :
                       screenViewerStatus === "connecting" ? t("proctor.screenConnecting") :
                       screenViewerStatus === "reconnecting" ? t("proctor.screenReconnecting") :
                       t("proctor.screenOff")}
                    </Badge>
                  )}
                  {session.attemptId && session.status !== "Active" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/results/ai-report/${session.examId}/${session.candidateId}`}>
                        <Play className="h-3.5 w-3.5 me-1.5" />
                        {t("proctor.viewAiReport")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={videoContainerRef} className={`${session.examEnableScreenMonitoring ? "grid grid-cols-2 gap-2" : ""} ${isFullscreen ? "" : ""}`}>
                {/* Webcam feed */}
                <div className={`aspect-video bg-muted rounded-lg overflow-hidden relative ${isFullscreen ? "rounded-none" : ""}`}>
                  {/* Live WebRTC video (shown when stream is active) */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${hasRemoteStream && !sessionEnded ? "" : "hidden"}`}
                  />
                  {/* Snapshot fallback (shown when no live stream and session not ended) */}
                  {!hasRemoteStream && !sessionEnded && (
                    <>
                      {screenshots.length > 0 ? (
                        <img
                          src={screenshots[0].url}
                          alt="Latest snapshot"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(screenshots[0])}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                          <Camera className="h-12 w-12 mb-2 opacity-30" />
                          <p className="text-sm">
                            {session.status === "Active" ? t("proctor.waitingForVideo") : t("proctor.noSnapshotsCapt")}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Session-Ended Overlay */}
                  {sessionEnded && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white z-10 animate-in fade-in duration-300">
                      {sessionEnded.reason === "Submitted" && <CheckCircle2Icon className="h-14 w-14 mb-3 text-emerald-400" />}
                      {sessionEnded.reason === "Expired" && <Clock className="h-14 w-14 mb-3 text-amber-400" />}
                      {sessionEnded.reason === "Terminated" && <XCircle className="h-14 w-14 mb-3 text-red-400" />}
                      <h3 className="text-xl font-semibold mb-1">
                        {sessionEnded.reason === "Submitted" ? t("proctor.examSubmitted") :
                         sessionEnded.reason === "Expired" ? t("proctor.examExpired") :
                         t("proctor.sessionTerminatedTitle")}
                      </h3>
                      <p className="text-sm text-white/70 mb-4">{t("proctor.liveStreamEnded")}</p>
                      {session.attemptId && (
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/results/ai-report/${session.examId}/${session.candidateId}`}>
                            <Play className="h-3.5 w-3.5 me-1.5" />
                            {t("proctor.viewAiReport")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Overlay badges */}
                  <div className="absolute bottom-4 end-4 flex items-center gap-2 z-20">
                    {screenshots.length > 0 && !sessionEnded && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/70 text-white text-sm">
                        <Camera className="h-4 w-4" />
                        {screenshots.length} {t("proctor.snapshotsLabel")}
                      </div>
                    )}
                    {hasRemoteStream && !sessionEnded && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-600/90 text-white text-sm">
                        <Video className="h-4 w-4" />
                        LIVE
                      </div>
                    )}
                  </div>

                  {/* Label for webcam when in split view */}
                  {session.examEnableScreenMonitoring && (
                    <div className="absolute top-3 start-3 px-2 py-1 rounded bg-black/60 text-white text-xs z-20 flex items-center gap-1">
                      <Camera className="h-3 w-3" /> {t("proctor.webcamLabel")}
                    </div>
                  )}

                  {/* Fullscreen toggle */}
                  <button
                    onClick={async () => {
                      if (!videoContainerRef.current) return
                      if (document.fullscreenElement) {
                        await document.exitFullscreen()
                      } else {
                        await videoContainerRef.current.requestFullscreen()
                      }
                    }}
                    className="absolute top-3 end-3 p-1.5 rounded bg-black/50 text-white hover:bg-black/70 transition-colors z-20"
                    title={t("proctor.toggleFullscreen")}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>

                {/* Screen share feed (only when screen monitoring enabled) */}
                {session.examEnableScreenMonitoring && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <video
                      ref={(el) => {
                        screenVideoRef.current = el
                        if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                          el.srcObject = screenStreamRef.current
                          el.play().catch(() => {})
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-contain ${hasScreenStream && !sessionEnded ? "" : "hidden"}`}
                    />
                    {!hasScreenStream && !sessionEnded && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Monitor className="h-12 w-12 mb-2 opacity-30" />
                        <p className="text-sm">
                          {session.status === "Active" ? t("proctor.waitingForScreen") : t("proctor.noScreenShare")}
                        </p>
                      </div>
                    )}
                    {sessionEnded && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white z-10">
                        <Monitor className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm text-white/70">{t("proctor.streamEnded")}</p>
                      </div>
                    )}
                    {/* Label */}
                    <div className="absolute top-3 start-3 px-2 py-1 rounded bg-black/60 text-white text-xs z-20 flex items-center gap-1">
                      <Monitor className="h-3 w-3" /> {t("proctor.screenLabel")}
                    </div>
                    {hasScreenStream && !sessionEnded && (
                      <div className="absolute bottom-4 end-4 flex items-center gap-2 px-3 py-1.5 rounded bg-purple-600/90 text-white text-sm z-20">
                        <Monitor className="h-4 w-4" />
                        LIVE
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Screenshots Gallery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t("proctor.screenshotTimeline")}
                <Badge variant="secondary" className="ms-auto">{screenshots.length}</Badge>
              </CardTitle>
              <CardDescription>{t("proctor.screenshotTimelineDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {screenshots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {t("proctor.noSnapshotsCapt")}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {screenshots.map((ss) => (
                    <div
                      key={ss.id}
                      className="space-y-1.5 cursor-pointer group"
                      onClick={() => setPreviewImage(ss)}
                    >
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden border group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                        <img
                          src={ss.url}
                          alt="Screenshot"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.opacity = '0.3';
                            img.alt = 'Image unavailable';
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center truncate">
                        {ss.timestamp ? formatDateTime(ss.timestamp) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Events Log
                  {events.filter(e => isViolationEvent(e.eventType)).length > 0 && (
                    <Badge variant="destructive" className="ms-1">
                      {events.filter(e => isViolationEvent(e.eventType)).length} {t("proctor.violationsOnly").toLowerCase()}
                    </Badge>
                  )}
                </CardTitle>
                <Select value={eventsFilter} onValueChange={(v) => setEventsFilter(v as "all" | "violations")}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violations">{t("proctor.violationsOnly")}</SelectItem>
                    <SelectItem value="all">{t("proctor.allEvents")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>{t("proctor.realTimeActivity")}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredEvents = eventsFilter === "violations"
                  ? events.filter(e => isViolationEvent(e.eventType))
                  : events
                if (filteredEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      {eventsFilter === "violations" ? t("proctor.noViolationsDetected") : t("proctor.noEventsRecorded")}
                    </div>
                  )
                }
                return (
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                    {filteredEvents.map((event) => {
                      const severity = getEventSeverity(event.eventType)
                      const isViolation = isViolationEvent(event.eventType)
                      return (
                        <div
                          key={event.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border ${
                            severity === "Critical" ? "bg-destructive/5 border-destructive/20" :
                            severity === "High" ? "bg-orange-500/5 border-orange-500/20" :
                            severity === "Medium" ? "bg-amber-500/5 border-amber-500/20" :
                            isViolation ? "bg-blue-500/5 border-blue-500/20" :
                            "bg-muted/30 border-transparent"
                          }`}
                        >
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            severity === "Critical" ? "bg-destructive" :
                            severity === "High" ? "bg-orange-500" :
                            severity === "Medium" ? "bg-amber-500" :
                            isViolation ? "bg-blue-500" :
                            "bg-muted-foreground"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{event.eventTypeName || getEventTypeName(event.eventType)}</span>
                            {(() => {
                              if (!event.metadataJson) return null
                              try {
                                const meta = JSON.parse(event.metadataJson)
                                if (meta.source === "smart_monitoring" && meta.detail) {
                                  return <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{meta.detail}</p>
                                }
                              } catch {}
                              return null
                            })()}
                          </div>
                          {isViolation && (
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                              severity === "Critical" ? "border-destructive/50 text-destructive" :
                              severity === "High" ? "border-orange-500/50 text-orange-600" :
                              severity === "Medium" ? "border-amber-500/50 text-amber-600" :
                              "border-blue-500/50 text-blue-600"
                            }`}>
                              {severity}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                            {new Date(event.occurredAt).toLocaleTimeString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Session Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("proctor.sessionInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.startedAt")}</span>
                <span className="font-medium">{formatDateTime(session.startedAt)}</span>
              </div>
              {session.endedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("proctor.endedAt")}</span>
                  <span className="font-medium">{formatDateTime(session.endedAt)}</span>
                </div>
              )}
              {session.sessionDuration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("proctor.durationLabel")}</span>
                  <span className="font-medium">{session.sessionDuration}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.timeRemaining")}</span>
                <span className="font-medium">
                  {session.remainingSeconds != null && session.remainingSeconds > 0
                    ? `${Math.ceil(session.remainingSeconds / 60)} min`
                    : "—"}
                </span>
              </div>
              {session.attemptStatus && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("proctor.attemptStatus")}</span>
                  <Badge variant={
                    session.attemptStatus === "Terminated" ? "destructive" :
                    session.attemptStatus === "Expired" ? "secondary" :
                    session.attemptStatus === "Submitted" ? "default" :
                    "outline"
                  }>{session.attemptStatus}</Badge>
                </div>
              )}
              {session.attemptNumber != null && session.attemptNumber > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("proctor.attemptNum")}</span>
                  <span className="font-medium">{session.attemptNumber}{session.examMaxAttempts ? ` / ${session.examMaxAttempts}` : ""}</span>
                </div>
              )}
              {session.riskLevel && session.riskLevel !== "Unknown" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("proctor.riskLevel")}</span>
                  <Badge variant="outline" className={
                    session.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                    session.riskLevel === "High" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                    session.riskLevel === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" :
                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                  }>{session.riskLevel}{session.riskScore != null ? ` (${session.riskScore})` : ""}</Badge>
                </div>
              )}
              {session.terminationReason && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">{t("proctor.terminationReason")}</span>
                  <span className="font-medium text-destructive text-xs text-end max-w-[60%]">{session.terminationReason}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("proctor.lastActivity")}</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">{formatDateTime(session.lastActivity)}</span>
                </div>
              </div>
              {session.heartbeatMissedCount != null && session.heartbeatMissedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.missedHeartbeats")}</span>
                  <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600 text-xs">
                    {session.heartbeatMissedCount}
                  </Badge>
                </div>
              )}

              {/* Decision Summary */}
              {session.decision && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {t("proctor.proctorDecision")}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.statusLabel")}</span>
                    <Badge variant={
                      session.decision.statusName === "Approved" ? "default" :
                      session.decision.statusName === "Invalidated" ? "destructive" :
                      session.decision.statusName === "Flagged" ? "outline" :
                      "secondary"
                    } className="text-xs">{session.decision.statusName}</Badge>
                  </div>
                  {session.decision.deciderName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{t("proctor.decidedBy")}</span>
                      <span className="text-xs font-medium">{session.decision.deciderName}</span>
                    </div>
                  )}
                  {session.decision.decidedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{t("proctor.decidedAt")}</span>
                      <span className="text-xs">{formatDateTime(session.decision.decidedAt)}</span>
                    </div>
                  )}
                  {session.decision.decisionReasonEn && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-1.5">{session.decision.decisionReasonEn}</p>
                  )}
                  {session.decision.wasOverridden && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-600">{t("proctor.overridden")}</Badge>
                  )}
                </div>
              )}

              {/* Browser & Device Info */}
              {(session.browserName || session.operatingSystem || session.ipAddress) && (
                <div className="pt-3 border-t space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5" />
                    {t("proctor.deviceBrowser")}
                  </p>
                  {session.browserName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{t("proctor.browser")}</span>
                      <span className="text-xs font-medium">{session.browserName}{session.browserVersion ? ` ${session.browserVersion}` : ""}</span>
                    </div>
                  )}
                  {session.operatingSystem && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{t("proctor.os")}</span>
                      <span className="text-xs font-medium">{session.operatingSystem}</span>
                    </div>
                  )}
                  {session.screenResolution && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">{t("proctor.screenRes")}</span>
                      <span className="text-xs font-medium">{session.screenResolution}</span>
                    </div>
                  )}
                  {(session.ipAddress || session.attemptIpAddress) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs flex items-center gap-1"><Globe className="h-3 w-3" />{t("proctor.ip")}</span>
                      <span className="text-xs font-medium">{session.ipAddress || session.attemptIpAddress}</span>
                    </div>
                  )}
                  {session.attemptDeviceInfo && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground text-xs">{t("proctor.device")}</span>
                      <span className="text-xs font-medium text-end max-w-[60%]">{session.attemptDeviceInfo}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Violations Summary */}
          <Card className={session.countableViolationCount && session.countableViolationCount > 0 ? "border-destructive/30" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-destructive" />
                {t("proctor.violationsOnly")}
                {session.countableViolationCount != null && session.countableViolationCount > 0 && (
                  <Badge variant="destructive" className="ms-auto">
                    {session.countableViolationCount}{session.maxViolationWarnings ? `/${session.maxViolationWarnings}` : ""}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {session.maxViolationWarnings
                  ? t("proctor.autoTerminationAt", { count: String(session.maxViolationWarnings) })
                  : t("proctor.noAutoTermination")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.countableViolations")}</span>
                <Badge variant={session.countableViolationCount && session.countableViolationCount > 0 ? "destructive" : "secondary"}>
                  {session.countableViolationCount ?? 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.totalViolations")}</span>
                <Badge variant="secondary">{session.totalViolations ?? 0}</Badge>
              </div>
              {session.maxViolationWarnings != null && session.maxViolationWarnings > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t("proctor.thresholdUsage")}</span>
                    <span className="font-medium">
                      {Math.round(((session.countableViolationCount ?? 0) / session.maxViolationWarnings) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (session.countableViolationCount ?? 0) >= session.maxViolationWarnings
                          ? "bg-destructive"
                          : (session.countableViolationCount ?? 0) >= session.maxViolationWarnings * 0.7
                            ? "bg-orange-500"
                            : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, ((session.countableViolationCount ?? 0) / session.maxViolationWarnings) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Violation events breakdown */}
              {(() => {
                const violationEvents = events.filter(e => isViolationEvent(e.eventType))
                if (violationEvents.length === 0) return (
                  <div className="text-center py-3 text-muted-foreground text-xs">
                    <Shield className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    {t("proctor.noViolationsDetected")}
                  </div>
                )
                // Group by event type
                const grouped = violationEvents.reduce<Record<string, { count: number; name: string; severity: string }>>((acc, e) => {
                  const name = e.eventTypeName || getEventTypeName(e.eventType)
                  if (!acc[name]) acc[name] = { count: 0, name, severity: getEventSeverity(e.eventType) }
                  acc[name].count++
                  return acc
                }, {})
                return (
                  <div className="pt-2 border-t space-y-1.5">
                    <p className="text-xs font-medium mb-1">{t("proctor.violationBreakdown")}</p>
                    {Object.values(grouped).sort((a, b) => b.count - a.count).map((group) => (
                      <div key={group.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${
                            group.severity === "Critical" ? "bg-destructive" :
                            group.severity === "High" ? "bg-orange-500" :
                            group.severity === "Medium" ? "bg-amber-500" :
                            "bg-blue-500"
                          }`} />
                          <span className="text-muted-foreground">{group.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5">{group.count}</Badge>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Candidate Profile */}
          {(session.candidateEmail || session.candidateRollNo || session.candidateDepartment) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("proctor.candidateProfile")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {session.candidateNameAr && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.nameAr")}</span>
                    <span className="text-xs font-medium" dir="rtl">{session.candidateNameAr}</span>
                  </div>
                )}
                {session.candidateEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.email")}</span>
                    <span className="text-xs font-medium truncate max-w-[60%]">{session.candidateEmail}</span>
                  </div>
                )}
                {session.candidateRollNo && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.rollNo")}</span>
                    <span className="text-xs font-medium">{session.candidateRollNo}</span>
                  </div>
                )}
                {session.candidateDepartment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.department")}</span>
                    <span className="text-xs font-medium">{session.candidateDepartment}</span>
                  </div>
                )}
                {session.candidatePhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.phone")}</span>
                    <span className="text-xs font-medium">{session.candidatePhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Exam Details */}
          {session.examDurationMinutes != null && session.examDurationMinutes > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("proctor.examDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {session.examTitleAr && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.titleAr")}</span>
                    <span className="text-xs font-medium" dir="rtl">{session.examTitleAr}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.durationLabel")}</span>
                  <span className="text-xs font-medium">{session.examDurationMinutes} min</span>
                </div>
                {session.examTotalQuestions != null && session.examTotalQuestions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.totalQuestions")}</span>
                    <span className="text-xs font-medium">{session.examTotalQuestions}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.passScore")}</span>
                  <span className="text-xs font-medium">{session.examPassScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.maxAttempts")}</span>
                  <span className="text-xs font-medium">{session.examMaxAttempts}</span>
                </div>
                {/* Security Settings */}
                <div className="pt-2 border-t space-y-1.5">
                  <p className="text-xs font-medium mb-1">{t("proctor.securitySettings")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {session.examRequireWebcam && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/5 border-blue-500/20 text-blue-600">{t("proctor.webcam")}</Badge>
                    )}
                    {session.examRequireIdVerification && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/5 border-blue-500/20 text-blue-600">{t("proctor.idVerification")}</Badge>
                    )}
                    {session.examRequireFullscreen && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/5 border-blue-500/20 text-blue-600">{t("proctor.fullscreen")}</Badge>
                    )}
                    {session.examPreventCopyPaste && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/5 border-blue-500/20 text-blue-600">{t("proctor.noCopyPaste")}</Badge>
                    )}
                    {session.examBrowserLockdown && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-500/5 border-blue-500/20 text-blue-600">{t("proctor.browserLock")}</Badge>
                    )}
                    {session.examEnableScreenMonitoring && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-purple-500/5 border-purple-500/20 text-purple-600">{t("proctor.screenMonitor")}</Badge>
                    )}
                    {!session.examRequireWebcam && !session.examRequireIdVerification && !session.examRequireFullscreen && !session.examPreventCopyPaste && !session.examBrowserLockdown && !session.examEnableScreenMonitoring && (
                      <span className="text-xs text-muted-foreground">{t("proctor.noSecurityReq")}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attempt Progress */}
          {session.attemptTotalQuestions != null && session.attemptTotalQuestions > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t("proctor.attemptProgress")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.questionsAnswered")}</span>
                  <span className="text-xs font-medium">
                    {session.attemptTotalAnswered ?? 0} / {session.attemptTotalQuestions}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, ((session.attemptTotalAnswered ?? 0) / session.attemptTotalQuestions) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{t("proctor.completion")}</span>
                  <span>{Math.round(((session.attemptTotalAnswered ?? 0) / session.attemptTotalQuestions) * 100)}%</span>
                </div>
                {session.attemptTotalScore != null && (
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-muted-foreground text-xs">{t("proctor.scoreLabel")}</span>
                    <span className={`text-xs font-bold ${session.attemptIsPassed ? "text-emerald-600" : session.attemptIsPassed === false ? "text-destructive" : ""}`}>
                      {session.attemptTotalScore}
                      {session.attemptIsPassed != null && (
                        <span className="ms-1">{session.attemptIsPassed ? t("proctor.passed") : t("proctor.failed")}</span>
                      )}
                    </span>
                  </div>
                )}
                {session.attemptExtraTimeSeconds != null && session.attemptExtraTimeSeconds > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.extraTimeAdded")}</span>
                    <span className="text-xs font-medium text-amber-600">+{Math.ceil(session.attemptExtraTimeSeconds / 60)} min</span>
                  </div>
                )}
                {session.attemptSubmittedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.submittedAt")}</span>
                    <span className="text-xs">{formatDateTime(session.attemptSubmittedAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Identity Verification */}
          {session.identityVerification && (
            <Card className={
              session.identityVerification.status === "Rejected" ? "border-destructive/30" :
              session.identityVerification.status === "Approved" ? "border-emerald-500/30" :
              ""
            }>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("proctor.identityVerificationTitle")}
                  <Badge variant="outline" className={`ms-auto text-[10px] ${
                    session.identityVerification.status === "Approved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" :
                    session.identityVerification.status === "Rejected" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                    "bg-amber-500/10 border-amber-500/30 text-amber-600"
                  }`}>{session.identityVerification.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {session.identityVerification.faceMatchScore != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.faceMatchScore")}</span>
                    <span className={`text-xs font-bold ${
                      session.identityVerification.faceMatchScore >= 80 ? "text-emerald-600" :
                      session.identityVerification.faceMatchScore >= 50 ? "text-amber-600" :
                      "text-destructive"
                    }`}>{session.identityVerification.faceMatchScore}%</span>
                  </div>
                )}
                {session.identityVerification.livenessResult && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.liveness")}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{session.identityVerification.livenessResult}</Badge>
                  </div>
                )}
                {session.identityVerification.idDocumentType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.documentType")}</span>
                    <span className="text-xs font-medium">{session.identityVerification.idDocumentType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.documentUploaded")}</span>
                  <span className="text-xs">{session.identityVerification.idDocumentUploaded ? t("proctor.yesLabel") : t("proctor.noLabel")}</span>
                </div>
                {session.identityVerification.riskScore != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{t("proctor.verificationRisk")}</span>
                    <Badge variant="outline" className={`text-[10px] h-5 ${
                      session.identityVerification.riskScore <= 20 ? "text-emerald-600 border-emerald-500/30" :
                      session.identityVerification.riskScore <= 50 ? "text-amber-600 border-amber-500/30" :
                      "text-destructive border-destructive/30"
                    }`}>{session.identityVerification.riskScore}</Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{t("proctor.submitted")}</span>
                  <span className="text-xs">{formatDateTime(session.identityVerification.submittedAt)}</span>
                </div>
                {session.identityVerification.reviewNotes && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-1.5 mt-1">{session.identityVerification.reviewNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Proctor Analysis */}
          <Card className="border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                {t("proctor.aiProctorReport")}
                <Badge variant="outline" className="ms-auto bg-purple-500/10 border-purple-500/30 text-purple-600 text-[10px]">
                  <Sparkles className="h-3 w-3 me-1" />
                  GPT-4o
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">{t("proctor.aiPoweredAdvisory")}</CardDescription>
            </CardHeader>
            <CardContent>
              {!aiAnalysis && !aiAnalysisLoading && (
                <div className="text-center py-4">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500/30" />
                  <p className="text-xs text-muted-foreground mb-3">{t("proctor.generateAiDesc")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAiAnalysis}
                    className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 me-1.5" />
                    {t("proctor.generateAiAnalysis")}
                  </Button>
                  {aiAnalysisError && (
                    <p className="text-xs text-destructive mt-2">{aiAnalysisError}</p>
                  )}
                </div>
              )}

              {aiAnalysisLoading && (
                <div className="text-center py-6">
                  <Loader2 className="h-6 w-6 mx-auto mb-2 text-purple-500 animate-spin" />
                  <p className="text-xs text-muted-foreground">{t("proctor.analyzingSession")}</p>
                </div>
              )}

              {aiAnalysis && !aiAnalysisLoading && (
                <div className="space-y-3">
                  {/* Executive Summary */}
                  {aiAnalysis.executiveSummary && (
                    <div className="p-2.5 rounded-md bg-purple-500/5 border border-purple-500/10">
                      <p className="text-xs leading-relaxed text-purple-700 dark:text-purple-300">{aiAnalysis.executiveSummary}</p>
                    </div>
                  )}

                  {/* Risk Level & Risk Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("proctor.riskLevel")}</span>
                    <Badge variant="outline" className={
                      aiAnalysis.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                      aiAnalysis.riskLevel === "High" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                      aiAnalysis.riskLevel === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    }>
                      {aiAnalysis.riskLevel}
                    </Badge>
                  </div>

                  {/* Risk Score + Confidence */}
                  <div className="grid grid-cols-2 gap-2">
                    {aiAnalysis.riskScore != null && (
                      <div className="p-2 rounded-md bg-muted/50 text-center">
                        <p className="text-lg font-bold">{aiAnalysis.riskScore}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
                        <p className="text-[10px] text-muted-foreground">{locale === "ar" ? "درجة المخاطرة" : "Risk Score"}</p>
                      </div>
                    )}
                    <div className="p-2 rounded-md bg-muted/50 text-center">
                      <p className="text-lg font-bold">{aiAnalysis.confidence}<span className="text-xs font-normal text-muted-foreground">%</span></p>
                      <p className="text-[10px] text-muted-foreground">{locale === "ar" ? "الثقة" : "Confidence"}</p>
                    </div>
                  </div>

                  {/* Risk Explanation */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">{t("proctor.riskExplanation")}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.riskExplanation}</p>
                  </div>

                  {/* Candidate Profile */}
                  {aiAnalysis.candidateProfile && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">{t("proctor.candidateProfile")}</summary>
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        {aiAnalysis.candidateProfile.name && <p><span className="font-medium text-foreground">Name:</span> {aiAnalysis.candidateProfile.name}</p>}
                        {aiAnalysis.candidateProfile.department && <p><span className="font-medium text-foreground">Dept:</span> {aiAnalysis.candidateProfile.department}</p>}
                        {aiAnalysis.candidateProfile.identityVerificationStatus && <p><span className="font-medium text-foreground">ID Status:</span> {aiAnalysis.candidateProfile.identityVerificationStatus}</p>}
                        {aiAnalysis.candidateProfile.deviceSummary && <p><span className="font-medium text-foreground">Device:</span> {aiAnalysis.candidateProfile.deviceSummary}</p>}
                        {aiAnalysis.candidateProfile.networkSummary && <p><span className="font-medium text-foreground">Network:</span> {aiAnalysis.candidateProfile.networkSummary}</p>}
                      </div>
                    </details>
                  )}

                  {/* Session Overview */}
                  {aiAnalysis.sessionOverview && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">{t("proctor.sessionOverview")}</summary>
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        {aiAnalysis.sessionOverview.examTitle && <p><span className="font-medium text-foreground">Exam:</span> {aiAnalysis.sessionOverview.examTitle}</p>}
                        {aiAnalysis.sessionOverview.duration && <p><span className="font-medium text-foreground">Duration:</span> {aiAnalysis.sessionOverview.duration}</p>}
                        {aiAnalysis.sessionOverview.timeUsage && <p><span className="font-medium text-foreground">Time Usage:</span> {aiAnalysis.sessionOverview.timeUsage}</p>}
                        {aiAnalysis.sessionOverview.completionRate && <p><span className="font-medium text-foreground">Completion:</span> {aiAnalysis.sessionOverview.completionRate}</p>}
                        {aiAnalysis.sessionOverview.attemptStatus && <p><span className="font-medium text-foreground">Status:</span> {aiAnalysis.sessionOverview.attemptStatus}</p>}
                        {aiAnalysis.sessionOverview.proctorMode && <p><span className="font-medium text-foreground">Proctor Mode:</span> {aiAnalysis.sessionOverview.proctorMode}</p>}
                        {aiAnalysis.sessionOverview.terminationInfo && aiAnalysis.sessionOverview.terminationInfo !== "N/A" && (
                          <p className="text-destructive"><span className="font-medium">Termination:</span> {aiAnalysis.sessionOverview.terminationInfo}</p>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Violation Analysis */}
                  {aiAnalysis.violationAnalysis && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">
                        {t("proctor.violationAnalysis")}
                        {aiAnalysis.violationAnalysis.totalViolations > 0 && (
                          <Badge variant="outline" className="ms-2 text-[10px] h-4 bg-destructive/10 border-destructive/30 text-destructive">
                            {aiAnalysis.violationAnalysis.totalViolations}
                          </Badge>
                        )}
                      </summary>
                      <div className="mt-1.5 space-y-1.5 text-xs text-muted-foreground">
                        {aiAnalysis.violationAnalysis.thresholdStatus && (
                          <p><span className="font-medium text-foreground">Threshold:</span> {aiAnalysis.violationAnalysis.thresholdStatus}</p>
                        )}
                        {aiAnalysis.violationAnalysis.violationTrend && (
                          <p><span className="font-medium text-foreground">Trend:</span> {aiAnalysis.violationAnalysis.violationTrend}</p>
                        )}
                        {aiAnalysis.violationAnalysis.violationBreakdown && aiAnalysis.violationAnalysis.violationBreakdown.length > 0 && (
                          <div className="space-y-1 mt-1">
                            {aiAnalysis.violationAnalysis.violationBreakdown.map((v: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-1.5 rounded bg-muted/50">
                                <span className="text-[11px]">{v.type}</span>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[9px] h-4">{v.severity}</Badge>
                                  <span className="text-[10px] font-medium">x{v.count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Behavior Analysis */}
                  {aiAnalysis.behaviorAnalysis && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">{t("proctor.behaviorAnalysis")}</summary>
                      <div className="mt-1.5 space-y-1.5 text-xs text-muted-foreground">
                        {aiAnalysis.behaviorAnalysis.answerPatternSummary && <p><span className="font-medium text-foreground">Answers:</span> {aiAnalysis.behaviorAnalysis.answerPatternSummary}</p>}
                        {aiAnalysis.behaviorAnalysis.timingAnalysis && <p><span className="font-medium text-foreground">Timing:</span> {aiAnalysis.behaviorAnalysis.timingAnalysis}</p>}
                        {aiAnalysis.behaviorAnalysis.focusBehavior && <p><span className="font-medium text-foreground">Focus:</span> {aiAnalysis.behaviorAnalysis.focusBehavior}</p>}
                        {aiAnalysis.behaviorAnalysis.navigationBehavior && <p><span className="font-medium text-foreground">Navigation:</span> {aiAnalysis.behaviorAnalysis.navigationBehavior}</p>}
                        {aiAnalysis.behaviorAnalysis.suspiciousPatterns && <p className="text-amber-600"><span className="font-medium">Suspicious:</span> {aiAnalysis.behaviorAnalysis.suspiciousPatterns}</p>}
                      </div>
                    </details>
                  )}

                  {/* Environment Assessment */}
                  {aiAnalysis.environmentAssessment && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">{t("proctor.environmentAssessment")}</summary>
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        {aiAnalysis.environmentAssessment.webcamStatus && <p><span className="font-medium text-foreground">Webcam:</span> {aiAnalysis.environmentAssessment.webcamStatus}</p>}
                        {aiAnalysis.environmentAssessment.networkStability && <p><span className="font-medium text-foreground">Network:</span> {aiAnalysis.environmentAssessment.networkStability}</p>}
                        {aiAnalysis.environmentAssessment.fullscreenCompliance && <p><span className="font-medium text-foreground">Fullscreen:</span> {aiAnalysis.environmentAssessment.fullscreenCompliance}</p>}
                        {aiAnalysis.environmentAssessment.browserCompliance && <p><span className="font-medium text-foreground">Browser:</span> {aiAnalysis.environmentAssessment.browserCompliance}</p>}
                        {aiAnalysis.environmentAssessment.overallEnvironmentRisk && (
                          <p><span className="font-medium text-foreground">Overall Risk:</span> {aiAnalysis.environmentAssessment.overallEnvironmentRisk}</p>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Suspicious Behaviors */}
                  {aiAnalysis.suspiciousBehaviors && aiAnalysis.suspiciousBehaviors.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-1.5">{t("proctor.suspiciousBehaviors")}</p>
                      <ul className="space-y-1">
                        {aiAnalysis.suspiciousBehaviors.map((behavior, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0 text-amber-500" />
                            <span>{behavior}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Aggravating & Mitigating Factors */}
                  {((aiAnalysis.aggravatingFactors && aiAnalysis.aggravatingFactors.length > 0) || (aiAnalysis.mitigatingFactors && aiAnalysis.mitigatingFactors.length > 0)) && (
                    <div className="pt-2 border-t grid grid-cols-1 gap-2">
                      {aiAnalysis.aggravatingFactors && aiAnalysis.aggravatingFactors.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-destructive mb-1">{t("proctor.aggravatingFactors")}</p>
                          <ul className="space-y-0.5">
                            {aiAnalysis.aggravatingFactors.map((f, i) => (
                              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                                <span className="text-destructive mt-0.5">▲</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiAnalysis.mitigatingFactors && aiAnalysis.mitigatingFactors.length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-emerald-600 mb-1">{t("proctor.mitigatingFactors")}</p>
                          <ul className="space-y-0.5">
                            {aiAnalysis.mitigatingFactors.map((f, i) => (
                              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                                <span className="text-emerald-500 mt-0.5">▼</span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium mb-1">{t("proctor.recommendation")}</p>
                    <div className="flex items-start gap-1.5 p-2 rounded-md bg-purple-500/5 border border-purple-500/10">
                      <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-purple-500" />
                      <p className="text-xs text-purple-700 dark:text-purple-300">{aiAnalysis.recommendation}</p>
                    </div>
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 1 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {aiAnalysis.recommendations.slice(1).map((r, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                            <span className="text-purple-500">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Integrity Verdict */}
                  {aiAnalysis.integrityVerdict && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-1">{t("proctor.integrityVerdict")}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">{aiAnalysis.integrityVerdict}</p>
                    </div>
                  )}

                  {/* Risk Timeline */}
                  {aiAnalysis.riskTimeline && aiAnalysis.riskTimeline.length > 0 && (
                    <details className="pt-2 border-t">
                      <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">{t("proctor.riskTimeline")}</summary>
                      <ul className="mt-1.5 space-y-0.5">
                        {aiAnalysis.riskTimeline.map((evt, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                            <span className="text-purple-400">→</span> {evt}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Detailed Analysis (collapsible) */}
                  <details className="pt-2 border-t">
                    <summary className="text-xs font-medium cursor-pointer hover:text-purple-600 transition-colors">
                      {t("proctor.detailedAnalysis")}
                    </summary>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{aiAnalysis.detailedAnalysis}</p>
                  </details>

                  {/* Regenerate button */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {aiAnalysis.generatedAt ? new Date(aiAnalysis.generatedAt).toLocaleTimeString() : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateAiAnalysis}
                      className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                    >
                      <Sparkles className="h-3 w-3 me-1" />
                      {t("proctor.regenerate")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incidents (manually created by proctor) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("proctor.incidents")} ({incidents.length})
              </CardTitle>
              <CardDescription className="text-xs">{t("proctor.manuallyCreatedIncidents")}</CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  {t("proctor.noIncidentsCreated")}
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-3 rounded-lg border ${incident.reviewed ? "bg-muted/30" : "bg-background"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                              {incident.severity}
                            </Badge>
                            {incident.reviewed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <p className="font-medium text-sm mt-1">{incident.type}</p>
                          <p className="text-xs text-muted-foreground">{incident.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(incident.timestamp)}</p>
                        </div>
                        {!incident.reviewed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIncident(incident)
                              setReviewDialogOpen(true)
                            }}
                          >
                            {t("proctor.review")}
                          </Button>
                        )}
                      </div>
                      {incident.reviewed && incident.reviewNotes && (
                        <div className="mt-2 pt-2 border-t text-xs">
                          <p className="text-muted-foreground">
                            <span className="font-medium">{incident.reviewedBy}:</span> {incident.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Incident Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proctor.reviewIncident")}</DialogTitle>
            <DialogDescription>
              {selectedIncident?.type} - {selectedIncident?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>{t("proctor.action")}</Label>
              <RadioGroup value={reviewAction} onValueChange={(v) => setReviewAction(v as typeof reviewAction)}>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <RadioGroupItem value="dismiss" id="dismiss" />
                  <Label htmlFor="dismiss" className="flex-1 cursor-pointer">
                    <p className="font-medium">{t("proctor.dismiss")}</p>
                    <p className="text-sm text-muted-foreground">{t("proctor.dismissDesc")}</p>
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <RadioGroupItem value="flag" id="flag" />
                  <Label htmlFor="flag" className="flex-1 cursor-pointer">
                    <p className="font-medium">{t("proctor.flagForReview")}</p>
                    <p className="text-sm text-muted-foreground">{t("proctor.flagForReviewDesc")}</p>
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30">
                  <RadioGroupItem value="terminate" id="terminate" />
                  <Label htmlFor="terminate" className="flex-1 cursor-pointer">
                    <p className="font-medium text-destructive">{t("proctor.terminateExam")}</p>
                    <p className="text-sm text-muted-foreground">{t("proctor.terminateExamDesc")}</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>{t("proctor.reviewNotes")}</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={t("proctor.reviewNotesPlaceholder")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleReviewIncident}>{t("proctor.submitReview")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proctor.sendWarningTitle")}</DialogTitle>
            <DialogDescription>{t("proctor.sendWarningDesc", { name: session.candidateName })}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={warningMessage}
            onChange={(e) => setWarningMessage(e.target.value)}
            placeholder={t("proctor.warningPlaceholder")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSendWarning} disabled={!warningMessage.trim()}>
              <MessageSquare className="h-4 w-4 me-2" />
              {t("proctor.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {t("proctor.terminateSessionTitle")}
            </DialogTitle>
            <DialogDescription>{t("proctor.terminateSessionDesc", { name: session.candidateName })}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
            placeholder={t("proctor.terminateReasonPlaceholder")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={!terminateReason.trim()}>
              <XCircle className="h-4 w-4 me-2" />
              {t("proctor.terminate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Dialog */}
      <Dialog open={addTimeDialogOpen} onOpenChange={setAddTimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("proctor.addTimeTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("proctor.addTimeDesc", { name: session.candidateName })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("proctor.minutesToAdd")}</Label>
              <div className="flex gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <Button
                    key={mins}
                    variant={addTimeMinutes === mins ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddTimeMinutes(mins)}
                  >
                    {mins} min
                  </Button>
                ))}
                <Input
                  type="number"
                  min={1}
                  max={480}
                  value={addTimeMinutes}
                  onChange={(e) => setAddTimeMinutes(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("proctor.reasonOptional")}</Label>
              <Textarea
                value={addTimeReason}
                onChange={(e) => setAddTimeReason(e.target.value)}
                placeholder={t("proctor.reasonPlaceholder")}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTimeDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleAddTime} disabled={addTimeLoading || addTimeMinutes <= 0}>
              <Plus className="h-4 w-4 me-2" />
              {addTimeLoading ? t("proctor.adding") : t("proctor.addMinutes", { count: String(addTimeMinutes) })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Screenshot Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t("proctor.screenshotPreview")}
            </DialogTitle>
            {previewImage?.timestamp && (
              <DialogDescription>{formatDateTime(previewImage.timestamp)}</DialogDescription>
            )}
          </DialogHeader>
          {previewImage && (
            <div className="rounded-lg overflow-hidden bg-muted">
              <img
                src={previewImage.url}
                alt="Screenshot preview"
                className="w-full h-auto"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
