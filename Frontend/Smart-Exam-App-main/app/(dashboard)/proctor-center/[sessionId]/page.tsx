"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getSessionDetails, refreshSessionData, reviewIncident, flagSession, sendWarning, terminateSession, getAttemptEvents, getEventTypeName, isViolationEvent, getEventSeverity, createIncidentFromProctor, type AttemptEventDto } from "@/lib/api/proctoring"
import { addTimeToAttempt } from "@/lib/api/attempt-control"
import type { LiveSession, Incident } from "@/lib/types/proctoring"
import { ProctorViewer, type ViewerStatus } from "@/lib/webrtc/proctor-viewer"
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
          toast.info(`Candidate has submitted the exam (Attempt #${attemptId})`, {
            duration: 10000,
            icon: "\u2705",
          })
          // Show session-ended overlay and stop live video
          setSessionEnded({ reason: "Submitted" })
          setHasRemoteStream(false)
          viewerRef.current?.disconnect()
          // Refresh session data to reflect updated status
          refreshSessionData(sessionId).then((data) => {
            setSession(data.session)
            setScreenshots(data.screenshots)
          }).catch(() => {})
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
            toast.warning(`Violation: ${event.eventType}`, {
              description: `Severity: ${event.severity}`,
              duration: 5000,
            })
          }
        },
        onAttemptExpired: (expEvent) => {
          toast.warning(`Exam has expired (Attempt #${expEvent.attemptId})`, {
            duration: 10000,
            icon: "⏰",
          })
          setSessionEnded({ reason: "Expired" })
          setHasRemoteStream(false)
          viewerRef.current?.disconnect()
          refreshSessionData(sessionId).then((data) => {
            setSession(data.session)
            setScreenshots(data.screenshots)
          }).catch(() => {})
        },
      })

      viewerRef.current = viewer
      viewer.connect().catch((e) => console.error("[ProctorPage] WebRTC connect failed (non-fatal):", e))
    }).catch((e) => {
      console.warn("[ProctorPage] Video config fetch failed (non-fatal):", e)
    })

    return () => {
      cancelled = true
      viewerRef.current?.disconnect()
      viewerRef.current = null
      setHasRemoteStream(false)
      setViewerStatus("offline")
    }
  }, [session?.attemptId, session?.status])

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
      // Load attempt events for events log
      if (data.session?.attemptId) {
        const attemptEvents = await getAttemptEvents(data.session.attemptId)
        setEvents(attemptEvents.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()))
      }
    } catch (error) {
      toast.error("Failed to load session")
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
      toast.error("Failed to review incident")
    }
  }

  async function handleToggleFlag() {
    if (!session) return
    try {
      await flagSession(session.id, !session.flagged)
      toast.success(session.flagged ? t("proctor.unflagged") : t("proctor.flagged"))
      loadSession()
    } catch (error) {
      toast.error("Failed to update flag")
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
      toast.error("Failed to send warning")
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
      router.push("/proctor-center")
    } catch (error) {
      toast.error("Failed to terminate session")
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
      toast.success(`${addTimeMinutes} minutes added successfully`)
      setAddTimeDialogOpen(false)
      setAddTimeMinutes(10)
      setAddTimeReason("")
      // Refresh session data to show updated time
      loadSession()
    } catch (error) {
      toast.error("Failed to add time")
    } finally {
      setAddTimeLoading(false)
    }
  }

  async function handleCreateIncident() {
    if (!session) return
    try {
      const result = await createIncidentFromProctor(parseInt(session.id))
      toast.success(`Incident ${result.caseNumber} created`)
      router.push(`/proctor-center/incidents/${result.id}`)
    } catch (error: any) {
      toast.error(error?.message || "Failed to create incident")
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
              Add Time
            </Button>
          )}
          <Button variant="outline" onClick={handleCreateIncident}>
            <AlertTriangle className="h-4 w-4 me-2" />
            Create Incident
          </Button>
          <Button variant="outline" onClick={handleToggleFlag}>
            <Flag className="h-4 w-4 me-2" />
            {session.flagged ? t("proctor.unflag") : t("proctor.flag")}
          </Button>
          <Button variant="outline" onClick={() => setWarningDialogOpen(true)}>
            <MessageSquare className="h-4 w-4 me-2" />
            {t("proctor.sendWarning")}
          </Button>
          <Button variant="destructive" onClick={() => setTerminateDialogOpen(true)}>
            <XCircle className="h-4 w-4 me-2" />
            {t("proctor.terminateSession")}
          </Button>
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
                      {viewerStatus === "live" ? "LIVE" :
                       viewerStatus === "connecting" ? "Connecting…" :
                       viewerStatus === "reconnecting" ? "Reconnecting…" :
                       "Offline"}
                    </Badge>
                  )}
                  {session.attemptId && session.status !== "Active" && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/proctor-center/recording/${session.attemptId}`}>
                        <Play className="h-3.5 w-3.5 me-1.5" />
                        View Recording
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={videoContainerRef} className={`aspect-video bg-muted rounded-lg overflow-hidden relative ${isFullscreen ? "rounded-none" : ""}`}>
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
                          {session.status === "Active" ? "Waiting for candidate video…" : "No snapshots captured"}
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
                      {sessionEnded.reason === "Submitted" ? "Exam Submitted" :
                       sessionEnded.reason === "Expired" ? "Exam Expired" :
                       "Session Terminated"}
                    </h3>
                    <p className="text-sm text-white/70 mb-4">The live video stream has ended</p>
                    {session.attemptId && (
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/proctor-center/recording/${session.attemptId}`}>
                          <Play className="h-3.5 w-3.5 me-1.5" />
                          View Recording
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
                      {screenshots.length} snapshots
                    </div>
                  )}
                  {hasRemoteStream && !sessionEnded && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-600/90 text-white text-sm">
                      <Video className="h-4 w-4" />
                      LIVE
                    </div>
                  )}
                </div>

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
                  title="Toggle fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
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
                  No screenshots available yet
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
                      {events.filter(e => isViolationEvent(e.eventType)).length} violations
                    </Badge>
                  )}
                </CardTitle>
                <Select value={eventsFilter} onValueChange={(v) => setEventsFilter(v as "all" | "violations")}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="violations">Violations Only</SelectItem>
                    <SelectItem value="all">All Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>Real-time activity from candidate's exam session</CardDescription>
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
                      {eventsFilter === "violations" ? "No violations detected" : "No events recorded yet"}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.timeRemaining")}</span>
                <span className="font-medium">{session.timeRemaining} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.incidentCount")}</span>
                <Badge variant={session.incidentCount > 0 ? "destructive" : "secondary"}>{session.incidentCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("proctor.lastActivity")}</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Activity className="h-3 w-3" />
                  <span className="text-xs">{formatDateTime(session.lastActivity)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incidents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t("proctor.incidents")} ({incidents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  {t("proctor.noIncidents")}
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
              Add Time to Exam
            </DialogTitle>
            <DialogDescription>
              Extend exam time for {session.candidateName}. The candidate will be notified instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Minutes to Add</Label>
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
              <Label>Reason (optional)</Label>
              <Textarea
                value={addTimeReason}
                onChange={(e) => setAddTimeReason(e.target.value)}
                placeholder="e.g. Technical issue, accommodation request..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTimeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTime} disabled={addTimeLoading || addTimeMinutes <= 0}>
              <Plus className="h-4 w-4 me-2" />
              {addTimeLoading ? "Adding..." : `Add ${addTimeMinutes} Minutes`}
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
              Screenshot Preview
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
