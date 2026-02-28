"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getLiveSessions, flagSession, sendWarning, terminateSession, getTriageRecommendations } from "@/lib/api/proctoring"
import type { LiveSession } from "@/lib/types/proctoring"
import type { TriageRecommendation } from "@/lib/api/proctoring"
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
  ArrowUpDown,
  Shield,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [sortMode, setSortMode] = useState<"default" | "risk-desc" | "risk-asc">("default")
  const [filterMode, setFilterMode] = useState<"all" | "flagged">("all")
  const [triageItems, setTriageItems] = useState<TriageRecommendation[]>([])
  const [triageOpen, setTriageOpen] = useState(false)
  const [triageLoading, setTriageLoading] = useState(false)
  const [useSampleData, setUseSampleData] = useState(true)
  // Risk level helper — matches backend GetRiskLevel thresholds
  function getRiskBadge(score?: number) {
    if (score == null) return null
    if (score <= 20) return { label: "Low", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" }
    if (score <= 50) return { label: "Medium", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" }
    if (score <= 75) return { label: "High", color: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30" }
    return { label: "Critical", color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" }
  }

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
      // Auto-flag sessions with > 5 violations
      const flagged = data.map((s) => {
        if ((s.totalViolations ?? 0) > 5 && !s.flagged) {
          return { ...s, flagged: true }
        }
        return s
      })
      setSessions(flagged)
    } catch (error) {
      toast.error("Failed to load sessions")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function loadTriage() {
    setTriageLoading(true)
    setTriageItems([])
    try {
      // Simulate AI thinking delay for better UX
      await new Promise(r => setTimeout(r, 1500))
      const triage = await getTriageRecommendations(3, useSampleData)
      setTriageItems(triage)
    } catch {
      // silent — keep existing items
    } finally {
      setTriageLoading(false)
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

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterMode === "all" || s.flagged
    return matchesSearch && matchesFilter
  })

  // Apply user-selected sort (only when explicitly chosen — no auto-reorder)
  const sortedSessions = (() => {
    if (sortMode === "default") return filteredSessions
    const sorted = [...filteredSessions]
    sorted.sort((a, b) => {
      const aScore = a.riskScore ?? 0
      const bScore = b.riskScore ?? 0
      return sortMode === "risk-desc" ? bScore - aScore : aScore - bScore
    })
    return sorted
  })()

  const activeSessions = sessions.filter((s) => s.status === "Active")
  const flaggedSessions = sessions.filter((s) => s.flagged)
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

      {/* Stats + AI Assistant */}
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
        {/* AI Proctor Assistant — compact card, same height as KPIs */}
        <Card className="sm:col-span-2 border-purple-200/60 dark:border-purple-800/40 bg-white dark:bg-card">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-purple-800 dark:text-purple-300">{locale === "ar" ? "مساعد المراقب الذكي" : "AI Proctor Assistant"}</p>
              <p className="text-xs text-muted-foreground">{locale === "ar" ? "من يحتاج مراجعة الآن؟" : "Who needs review now?"}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="useSampleData"
                  checked={useSampleData}
                  onCheckedChange={(checked) => setUseSampleData(!!checked)}
                  className="h-3.5 w-3.5"
                />
                <label htmlFor="useSampleData" className="text-[10px] text-muted-foreground cursor-pointer select-none">
                  {locale === "ar" ? "تجريبي" : "Demo"}
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setTriageOpen(true); loadTriage() }}
                disabled={triageLoading}
                className="h-8 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-950/50 dark:hover:to-indigo-950/50 text-purple-700 dark:text-purple-300 transition-all duration-300 px-3"
              >
                {triageLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="me-1.5" />
                    <span className="animate-pulse text-xs">{locale === "ar" ? "يفكر..." : "Thinking..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 me-1.5" />
                    <span className="text-xs">{locale === "ar" ? "اسأل" : "Ask AI"}</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Response — full-width panel below stats, slides in when open */}
      {triageOpen && !triageLoading && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-white dark:bg-card p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              {locale === "ar" ? "توصيات الذكاء الاصطناعي" : "AI Recommendations"}
            </span>
            <div className="flex items-center gap-3">
              {useSampleData && triageItems.some(i => i.sessionId < 0) && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse inline-block" />
                  <span className="text-[10px] text-purple-500 font-medium">{locale === "ar" ? "بيانات تجريبية" : "Sample data"}</span>
                </span>
              )}
              <button
                type="button"
                onClick={() => setTriageOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          {triageItems.length === 0 ? (
            <div className="text-sm text-muted-foreground py-3 text-center">
              {locale === "ar" ? "لا توجد جلسات تحتاج مراجعة عاجلة" : "All clear — no sessions need urgent review"}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {triageItems.map((item) => {
                const levelColor = item.riskLevel === "Critical"
                  ? "text-red-600 bg-red-500/10 border-red-500/30"
                  : item.riskLevel === "High"
                    ? "text-orange-600 bg-orange-500/10 border-orange-500/30"
                    : item.riskLevel === "Medium"
                      ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
                      : "text-emerald-600 bg-emerald-500/10 border-emerald-500/30"
                return (
                  <div key={item.sessionId} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                    <Badge variant="outline" className={`shrink-0 text-sm font-bold mt-0.5 px-2.5 py-0.5 ${levelColor}`}>
                      {Math.round(item.riskScore)}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{item.candidateName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "ar" ? item.reasonAr : item.reasonEn}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 px-3"
                      asChild
                    >
                      <Link href={`/proctor-center/${item.sessionId}`}>
                        <Eye className="h-3.5 w-3.5 me-1" />
                        {locale === "ar" ? "مراجعة" : "Review"}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-md flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("proctor.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {sortMode === "default"
                ? (locale === "ar" ? "الترتيب الافتراضي" : "Default Order")
                : sortMode === "risk-desc"
                  ? (locale === "ar" ? "المخاطر: الأعلى أولاً" : "Risk: High → Low")
                  : (locale === "ar" ? "المخاطر: الأدنى أولاً" : "Risk: Low → High")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
            <DropdownMenuItem onClick={() => setSortMode("default")}>
              {locale === "ar" ? "الترتيب الافتراضي" : "Default Order"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode("risk-desc")}>
              <Shield className="h-4 w-4 me-2 text-red-500" />
              {locale === "ar" ? "المخاطر: الأعلى أولاً" : "Risk: High → Low"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortMode("risk-asc")}>
              <Shield className="h-4 w-4 me-2 text-emerald-500" />
              {locale === "ar" ? "المخاطر: الأدنى أولاً" : "Risk: Low → High"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Flagged Filter */}
        <Button
          variant={filterMode === "flagged" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setFilterMode(filterMode === "flagged" ? "all" : "flagged")}
        >
          <Flag className="h-4 w-4" />
          {locale === "ar" ? `المُعلَّمة (${flaggedSessions.length})` : `Flagged (${flaggedSessions.length})`}
        </Button>
      </div>

      {/* Sessions Grid */}
      {sortedSessions.length === 0 ? (
        <EmptyState icon={Video} title={t("proctor.noSessions")} description={t("proctor.noSessionsDesc")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedSessions.map((session) => {
            const risk = getRiskBadge(session.riskScore)
            return (
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
                {/* Risk Score Badge */}
                {risk && (
                  <div className={`absolute ${session.incidentCount > 0 ? "top-9" : "top-2"} end-2`}>
                    <Badge variant="outline" className={`gap-1 text-xs font-semibold ${risk.color}`}>
                      <Shield className="h-3 w-3" />
                      {Math.round(session.riskScore!)} · {risk.label}
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
                {/* Violations Count */}
                {(session.totalViolations ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="text-destructive font-medium">
                      {locale === "ar" ? `المخالفات: ${session.totalViolations}` : `Violations: ${session.totalViolations}`}
                    </span>
                  </div>
                )}
                {/* Card Actions */}
                {!session.isSample && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                      <Link href={`/proctor-center/${session.id}`}>
                        <Eye className="h-3.5 w-3.5 me-1.5" />
                        {t("proctor.viewDetails")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                      onClick={() => {
                        setSelectedSession(session)
                        setWarningDialogOpen(true)
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 me-1.5" />
                      {t("proctor.sendWarning")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
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
