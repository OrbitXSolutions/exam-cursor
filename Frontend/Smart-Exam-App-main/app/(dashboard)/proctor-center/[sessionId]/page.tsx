"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getSessionDetails, reviewIncident, flagSession, sendWarning, terminateSession } from "@/lib/api/proctoring"
import type { LiveSession, Incident } from "@/lib/types/proctoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

  useEffect(() => {
    loadSession()
  }, [sessionId])

  async function loadSession() {
    try {
      setLoading(true)
      const data = await getSessionDetails(sessionId)
      setSession(data.session)
      setIncidents(data.incidents)
      setScreenshots(data.screenshots)
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
      toast.success(t("proctor.sessionTerminated"))
      router.push("/proctor-center")
    } catch (error) {
      toast.error("Failed to terminate session")
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
          {/* Latest Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t("proctor.liveVideo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {screenshots.length > 0 ? (
                  <img
                    src={screenshots[0].url}
                    alt="Latest snapshot"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewImage(screenshots[0])}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-12 w-12 mb-2 opacity-30" />
                    <p className="text-sm">No snapshots captured yet</p>
                  </div>
                )}
                {screenshots.length > 0 && (
                  <div className="absolute bottom-4 end-4 flex items-center gap-2 px-3 py-1.5 rounded bg-black/70 text-white text-sm">
                    <Camera className="h-4 w-4" />
                    {screenshots.length} snapshots
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
