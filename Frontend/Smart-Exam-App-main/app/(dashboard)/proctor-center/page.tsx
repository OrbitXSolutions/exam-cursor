"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getLiveSessions, flagSession, sendWarning, terminateSession } from "@/lib/api/proctoring"
import type { LiveSession } from "@/lib/types/proctoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Video,
  Users,
  AlertTriangle,
  Flag,
  Search,
  MoreVertical,
  Eye,
  MessageSquare,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  Monitor,
  Camera,
} from "lucide-react"

export default function ProctorCenterPage() {
  const { t, dir, locale } = useI18n()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null)
  const [warningMessage, setWarningMessage] = useState("")
  const [terminateReason, setTerminateReason] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSessions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  async function loadSessions() {
    try {
      if (!loading) setRefreshing(true)
      const data = await getLiveSessions()
      setSessions(data)
    } catch (error) {
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleToggleFlag(session: LiveSession) {
    try {
      await flagSession(session.id, !session.flagged)
      toast.success(session.flagged ? t("proctor.unflagged") : t("proctor.flagged"))
      loadSessions()
    } catch (error) {
      toast.error("Failed to update flag")
    }
  }

  async function handleSendWarning() {
    if (!selectedSession || !warningMessage.trim()) return
    try {
      await sendWarning(selectedSession.id, warningMessage)
      toast.success(t("proctor.warningSent"))
      setWarningDialogOpen(false)
      setWarningMessage("")
      setSelectedSession(null)
    } catch (error) {
      toast.error("Failed to send warning")
    }
  }

  async function handleTerminate() {
    if (!selectedSession || !terminateReason.trim()) return
    try {
      await terminateSession(selectedSession.id, terminateReason)
      toast.success(t("proctor.sessionTerminated"))
      setTerminateDialogOpen(false)
      setTerminateReason("")
      setSelectedSession(null)
      loadSessions()
    } catch (error) {
      toast.error("Failed to terminate session")
    }
  }

  function formatTime(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  function getTimeSince(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime()
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return t("proctor.secondsAgo", { seconds })
    const minutes = Math.floor(seconds / 60)
    return t("proctor.minutesAgo", { minutes })
  }

  const filteredSessions = sessions.filter(
    (s) =>
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeSessions = filteredSessions.filter((s) => s.status === "Active")
  const flaggedSessions = filteredSessions.filter((s) => s.flagged)
  const totalIncidents = sessions.reduce((acc, s) => acc + s.incidentCount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("proctor.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("proctor.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadSessions} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 me-2 ${refreshing ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
          <Button asChild>
            <Link href="/proctor-center/incidents">
              <AlertTriangle className="h-4 w-4 me-2" />
              {t("proctor.viewAllIncidents")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <Monitor className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSessions.length}</p>
              <p className="text-sm text-muted-foreground">{t("proctor.activeSessions")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <Flag className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{flaggedSessions.length}</p>
              <p className="text-sm text-muted-foreground">{t("proctor.flaggedSessions")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalIncidents}</p>
              <p className="text-sm text-muted-foreground">{t("proctor.totalIncidents")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{new Set(sessions.map((s) => s.examTitle)).size}</p>
              <p className="text-sm text-muted-foreground">{t("proctor.activeExams")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("proctor.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <EmptyState icon={Video} title={t("proctor.noSessions")} description={t("proctor.noSessionsDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={`overflow-hidden transition-shadow hover:shadow-md ${
                session.flagged ? "border-amber-500/50 bg-amber-500/5" : ""
              }`}
            >
              {/* Snapshot Preview / Placeholder */}
              <div className="relative aspect-video bg-muted">
                {session.latestSnapshotUrl && !session.isSample ? (
                  <img
                    src={session.latestSnapshotUrl}
                    alt={session.candidateName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground text-xl font-semibold">
                      {session.candidateName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute top-2 start-2 flex items-center gap-2">
                  <Badge variant={session.status === "Active" ? "default" : "secondary"} className="gap-1">
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    {t("proctor.live")}
                  </Badge>
                  {session.isSample && (
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50 text-blue-600">
                      Sample
                    </Badge>
                  )}
                  {session.flagged && (
                    <Badge variant="outline" className="bg-amber-500/20 border-amber-500/50 text-amber-600">
                      <Flag className="h-3 w-3 me-1" />
                      {t("proctor.flagged")}
                    </Badge>
                  )}
                </div>
                {session.incidentCount > 0 && (
                  <div className="absolute top-2 end-2">
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {session.incidentCount}
                    </Badge>
                  </div>
                )}
                {!session.isSample && (session.snapshotCount ?? 0) > 0 && (
                  <div className="absolute bottom-2 start-2 flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-xs">
                    <Camera className="h-3 w-3" />
                    {session.snapshotCount}
                  </div>
                )}
                <div className="absolute bottom-2 end-2 flex items-center gap-1 px-2 py-1 rounded bg-black/70 text-white text-xs">
                  <Clock className="h-3 w-3" />
                  {formatTime(session.timeRemaining)}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{session.candidateName}</p>
                    <p className="text-sm text-muted-foreground truncate">{session.examTitle}</p>
                  </div>
                  {session.isSample ? (
                    <Badge variant="outline" className="text-xs shrink-0">Sample</Badge>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                        <DropdownMenuItem asChild>
                          <Link href={`/proctor-center/${session.id}`}>
                            <Eye className="h-4 w-4 me-2" />
                            {t("proctor.viewDetails")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFlag(session)}>
                          <Flag className="h-4 w-4 me-2" />
                          {session.flagged ? t("proctor.unflag") : t("proctor.flag")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSession(session)
                            setWarningDialogOpen(true)
                          }}
                        >
                          <MessageSquare className="h-4 w-4 me-2" />
                          {t("proctor.sendWarning")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSelectedSession(session)
                            setTerminateDialogOpen(true)
                          }}
                        >
                          <XCircle className="h-4 w-4 me-2" />
                          {t("proctor.terminateSession")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>
                    {t("proctor.lastActivity")}: {getTimeSince(session.lastActivity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Warning Dialog */}
      <Dialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("proctor.sendWarningTitle")}</DialogTitle>
            <DialogDescription>
              {t("proctor.sendWarningDesc", { name: selectedSession?.candidateName })}
            </DialogDescription>
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
            <DialogDescription>
              {t("proctor.terminateSessionDesc", { name: selectedSession?.candidateName })}
            </DialogDescription>
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
    </div>
  )
}
