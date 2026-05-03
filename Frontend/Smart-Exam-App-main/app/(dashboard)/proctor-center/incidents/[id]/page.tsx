"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getIncidentCase,
  getIncidentComments,
  addIncidentComment,
  recordIncidentDecision,
  closeIncidentCase,
  reopenIncidentCase,
  changeIncidentStatus,
  type IncidentCaseDetailDto,
  type IncidentCommentDto,
} from "@/lib/api/proctoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Shield,
  FileText,
  RotateCcw,
  Lock,
  Send,
  Scale,
  Activity,
  Eye,
  XCircle,
} from "lucide-react"

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, locale } = useI18n()

  const [caseDetail, setCaseDetail] = useState<IncidentCaseDetailDto | null>(null)
  const [comments, setComments] = useState<IncidentCommentDto[]>([])
  const [loading, setLoading] = useState(true)

  // Decision dialog
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false)
  const [decisionOutcome, setDecisionOutcome] = useState("1")
  const [decisionReason, setDecisionReason] = useState("")
  const [decisionCloseCase, setDecisionCloseCase] = useState(false)
  const [decisionLoading, setDecisionLoading] = useState(false)

  // Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("2")
  const [statusReason, setStatusReason] = useState("")

  // Reopen dialog
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false)
  const [reopenReason, setReopenReason] = useState("")

  // Comment
  const [commentBody, setCommentBody] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState<"timeline" | "evidence" | "decisions" | "comments">("timeline")

  useEffect(() => {
    loadCase()
  }, [id])

  async function loadCase() {
    try {
      setLoading(true)
      const caseId = parseInt(id)
      if (!caseId) return
      const [detail, cmts] = await Promise.all([
        getIncidentCase(caseId),
        getIncidentComments(caseId),
      ])
      setCaseDetail(detail)
      setComments(cmts)
    } catch (error) {
      toast.error(t("proctor.failedToLoadCase"))
    } finally {
      setLoading(false)
    }
  }

  async function handleRecordDecision() {
    if (!caseDetail) return
    try {
      setDecisionLoading(true)
      await recordIncidentDecision({
        caseId: caseDetail.id,
        outcome: parseInt(decisionOutcome),
        reasonEn: decisionReason || undefined,
        closeCase: decisionCloseCase,
      })
      toast.success(t("proctor.decisionRecorded"))
      setDecisionDialogOpen(false)
      setDecisionReason("")
      loadCase()
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToRecordDecision"))
    } finally {
      setDecisionLoading(false)
    }
  }

  async function handleCloseCase() {
    if (!caseDetail) return
    try {
      await closeIncidentCase(caseDetail.id)
      toast.success(t("proctor.caseClosed"))
      loadCase()
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToCloseCase"))
    }
  }

  async function handleReopenCase() {
    if (!caseDetail || !reopenReason.trim()) return
    try {
      await reopenIncidentCase(caseDetail.id, reopenReason.trim())
      toast.success(t("proctor.caseReopened"))
      setReopenDialogOpen(false)
      setReopenReason("")
      loadCase()
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToReopenCase"))
    }
  }

  async function handleChangeStatus() {
    if (!caseDetail) return
    try {
      await changeIncidentStatus(caseDetail.id, parseInt(newStatus), statusReason || undefined)
      toast.success(t("proctor.statusUpdated"))
      setStatusDialogOpen(false)
      setStatusReason("")
      loadCase()
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToChangeStatus"))
    }
  }

  async function handleAddComment() {
    if (!caseDetail || !commentBody.trim()) return
    try {
      setCommentLoading(true)
      await addIncidentComment({ caseId: caseDetail.id, body: commentBody.trim() })
      toast.success(t("proctor.commentAdded"))
      setCommentBody("")
      const cmts = await getIncidentComments(caseDetail.id)
      setComments(cmts)
    } catch (error: any) {
      toast.error(error?.message || t("proctor.failedToAddComment"))
    } finally {
      setCommentLoading(false)
    }
  }

  function formatDateTime(dateString: string | undefined) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      timeZone: "Asia/Dubai",
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getSeverityBadge(severity: number) {
    const labels: Record<number, string> = {
      1: t("proctor.severityLow"),
      2: t("proctor.severityMedium"),
      3: t("proctor.severityHigh"),
      4: t("proctor.severityCritical"),
    }
    const label = labels[severity] ?? t("common.unknown")
    switch (severity) {
      case 1:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">{label}</Badge>
      case 2:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{label}</Badge>
      case 3:
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">{label}</Badge>
      case 4:
        return <Badge variant="destructive">{label}</Badge>
      default:
        return <Badge variant="secondary">{label}</Badge>
    }
  }

  function getStatusBadge(status: number) {
    const labels: Record<number, string> = {
      1: t("proctor.statusOpen"),
      2: t("proctor.statusInReview"),
      3: t("proctor.statusResolved"),
      4: t("proctor.statusClosed"),
      5: t("proctor.statusEscalated"),
    }
    const label = labels[status] ?? t("common.unknown")
    switch (status) {
      case 1:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">{label}</Badge>
      case 2:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{label}</Badge>
      case 3:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{label}</Badge>
      case 4:
        return <Badge variant="secondary">{label}</Badge>
      case 5:
        return <Badge variant="destructive">{label}</Badge>
      default:
        return <Badge variant="secondary">{label}</Badge>
    }
  }

  function getOutcomeBadge(outcome: number | undefined) {
    if (outcome === undefined || outcome === null) return <span className="text-muted-foreground">{t("proctor.pendingOutcome")}</span>
    const labels: Record<number, string> = {
      1: t("proctor.cleared"),
      2: t("proctor.suspicious"),
      3: t("proctor.invalidated"),
      4: t("proctor.statusEscalated"),
    }
    const label = labels[outcome] ?? t("common.unknown")
    switch (outcome) {
      case 1:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{label}</Badge>
      case 2:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{label}</Badge>
      case 3:
        return <Badge variant="destructive">{label}</Badge>
      case 4:
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">{label}</Badge>
      default:
        return <Badge variant="secondary">{label}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/proctor-center/incidents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("proctor.incidentNotFound")}</h1>
            <p className="text-muted-foreground mt-1">{t("proctor.incidentNotFoundDesc")}</p>
          </div>
        </div>
      </div>
    )
  }

  const isClosed = caseDetail.status === 4
  const isResolved = caseDetail.status === 3

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/proctor-center/incidents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{caseDetail.caseNumber}</h1>
              {getStatusBadge(caseDetail.status)}
              {getSeverityBadge(caseDetail.severity)}
            </div>
            <p className="text-muted-foreground mt-1">{caseDetail.titleEn}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                <Activity className="h-4 w-4 me-2" />
                {t("proctor.changeStatus")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDecisionDialogOpen(true)}>
                <Scale className="h-4 w-4 me-2" />
                {t("proctor.recordDecision")}
              </Button>
              {isResolved && (
                <Button variant="outline" size="sm" onClick={handleCloseCase}>
                  <Lock className="h-4 w-4 me-2" />
                  {t("proctor.closeCase")}
                </Button>
              )}
            </>
          )}
          {isClosed && (
            <Button variant="outline" size="sm" onClick={() => setReopenDialogOpen(true)}>
              <RotateCcw className="h-4 w-4 me-2" />
              {t("proctor.reopenCase")}
            </Button>
          )}
        </div>
      </div>

      {/* Case Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Case Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("proctor.caseDetailsCard")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.sourceLabel")}</span>
              <span>{(() => {
                const src = caseDetail.source
                if (src === 1) return t("proctor.sourceProctor")
                if (src === 2) return t("proctor.sourceSystem")
                if (src === 3) return t("proctor.sourceManual")
                return t("common.unknown")
              })()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.createdLabel")}</span>
              <span>{formatDateTime(caseDetail.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.outcomeLabel")}</span>
              {getOutcomeBadge(caseDetail.outcome)}
            </div>
            {caseDetail.riskScoreAtCreate != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.riskScoreLabel")}</span>
                <span className="font-mono">{caseDetail.riskScoreAtCreate}</span>
              </div>
            )}
            {caseDetail.assigneeName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.assignedToLabel")}</span>
                <span>{caseDetail.assigneeName}</span>
              </div>
            )}
            {caseDetail.resolverName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.resolvedByLabel")}</span>
                <span>{caseDetail.resolverName}</span>
              </div>
            )}
            {caseDetail.resolvedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.resolvedAtLabel")}</span>
                <span>{formatDateTime(caseDetail.resolvedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("proctor.candidateCard")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.nameLabel")}</span>
              <span className="font-medium">{caseDetail.candidateName}</span>
            </div>
            {caseDetail.candidateEmail && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.emailLabel")}</span>
                <span className="text-xs">{caseDetail.candidateEmail}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.attemptLabel")}</span>
              <span>#{caseDetail.attemptNumber} (ID: {caseDetail.attemptId})</span>
            </div>
            {caseDetail.proctorSessionId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.sessionLabel")}</span>
                <Link href={`/proctor-center/${caseDetail.proctorSessionId}`} className="text-primary hover:underline">
                  {t("proctor.viewSession")}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("proctor.examCard")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.examLabel")}</span>
              <span className="font-medium text-end max-w-[180px] truncate" title={caseDetail.examTitleEn}>
                {caseDetail.examTitleEn}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("proctor.examIdLabel")}</span>
              <span>{caseDetail.examId}</span>
            </div>
            {caseDetail.totalViolationsAtCreate != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("proctor.violationsAtCreate")}</span>
                <span>{caseDetail.totalViolationsAtCreate}</span>
              </div>
            )}
            {caseDetail.summaryEn && (
              <>
                <Separator />
                <p className="text-muted-foreground">{caseDetail.summaryEn}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0">
        {(["timeline", "evidence", "decisions", "comments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "timeline" && t("proctor.tabTimeline")}
            {tab === "evidence" && `${t("proctor.tabEvidence")} (${caseDetail.evidenceLinks?.length ?? 0})`}
            {tab === "decisions" && `${t("proctor.tabDecisions")} (${caseDetail.decisions?.length ?? 0})`}
            {tab === "comments" && `${t("proctor.tabComments")} (${comments.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" && (
        <Card>
          <CardContent className="p-6">
            {caseDetail.timeline?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("proctor.noTimelineEvents")}</p>
            ) : (
              <div className="space-y-4">
                {caseDetail.timeline?.map((event) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="w-px flex-1 bg-border" />
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{event.eventTypeName}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</span>
                      </div>
                      {event.actorName && (
                          <p className="text-xs text-muted-foreground mt-0.5">{t("proctor.byActorLabel", { name: event.actorName })}</p>
                      )}
                      {event.descriptionEn && (
                        <p className="text-sm text-muted-foreground mt-1">{event.descriptionEn}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "evidence" && (
        <Card>
          <CardContent className="p-6">
            {caseDetail.evidenceLinks?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("proctor.noEvidenceLinked")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseDetail.evidenceLinks?.map((evidence) => (
                  <Card key={evidence.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{evidence.evidenceType}</p>
                          {evidence.evidenceDescription && (
                            <p className="text-xs text-muted-foreground mt-1">{evidence.evidenceDescription}</p>
                          )}
                          {evidence.noteEn && (
                            <p className="text-sm mt-2">{evidence.noteEn}</p>
                          )}
                        </div>
                        {evidence.previewUrl && (
                          <a
                            href={evidence.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            {t("proctor.viewEvidence")}
                          </a>
                        )}
                      </div>
                      {evidence.linkedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                            {t("proctor.linkedAt", { date: formatDateTime(evidence.linkedAt) })}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "decisions" && (
        <Card>
          <CardContent className="p-6">
            {caseDetail.decisions?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("proctor.noDecisionsRecorded")}</p>
            ) : (
              <div className="space-y-4">
                {caseDetail.decisions?.map((decision) => (
                  <div key={decision.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        {getOutcomeBadge(decision.outcome)}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(decision.decidedAt)}</span>
                    </div>
                    {decision.deciderName && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("proctor.decidedByLabel", { name: decision.deciderName })}
                      </p>
                    )}
                    {decision.reasonEn && (
                      <p className="text-sm mt-2">{decision.reasonEn}</p>
                    )}
                    {decision.riskScoreAtDecision != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("proctor.riskAtDecision", { score: decision.riskScoreAtDecision })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "comments" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Add comment */}
            <div className="flex gap-3">
              <Textarea
                placeholder={t("proctor.addCommentPlaceholder")}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={commentLoading || !commentBody.trim()}
                size="sm"
                className="self-end"
              >
                {commentLoading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <Separator />

            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t("proctor.noCommentsYet")}</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{comment.authorName ?? "Unknown"}</span>
                        {comment.isEdited && (
                          <span className="text-xs text-muted-foreground">{t("proctor.editedLabel")}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Record Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t("proctor.recordDecisionTitle")}</DialogTitle>
            <DialogDescription>
              {t("proctor.recordDecisionDesc", { caseNumber: caseDetail.caseNumber })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("proctor.outcomeField")}</Label>
              <Select value={decisionOutcome} onValueChange={setDecisionOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("proctor.outcomeCleared")}</SelectItem>
                  <SelectItem value="2">{t("proctor.outcomeSuspicious")}</SelectItem>
                  <SelectItem value="3">{t("proctor.outcomeInvalidated")}</SelectItem>
                  <SelectItem value="4">{t("proctor.outcomeEscalated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("proctor.reasonNotes")}</Label>
              <Textarea
                placeholder={t("proctor.explainDecision")}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="closeCase"
                checked={decisionCloseCase}
                onChange={(e) => setDecisionCloseCase(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="closeCase" className="cursor-pointer text-sm">
                {t("proctor.closeCaseAfterDecision")}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleRecordDecision} disabled={decisionLoading}>
              {decisionLoading ? <LoadingSpinner size="sm" className="me-2" /> : null}
              {t("proctor.recordDecision")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("proctor.changeStatusTitle")}</DialogTitle>
            <DialogDescription>
              {t("proctor.changeStatusDesc", { caseNumber: caseDetail.caseNumber })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("proctor.newStatusLabel")}</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("proctor.statusOpen")}</SelectItem>
                  <SelectItem value="2">{t("proctor.statusInReview")}</SelectItem>
                  <SelectItem value="3">{t("proctor.statusResolved")}</SelectItem>
                  <SelectItem value="5">{t("proctor.statusEscalated")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("proctor.reasonOptionalField")}</Label>
              <Input
                placeholder={t("proctor.whyChangingStatus")}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleChangeStatus}>{t("proctor.updateStatus")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Dialog */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("proctor.reopenCaseTitle")}</DialogTitle>
            <DialogDescription>
              {t("proctor.reopenCaseDesc", { caseNumber: caseDetail.caseNumber })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("proctor.reasonRequired")}</Label>
              <Textarea
                placeholder={t("proctor.whyReopening")}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleReopenCase} disabled={!reopenReason.trim()}>{t("proctor.reopenCase")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
