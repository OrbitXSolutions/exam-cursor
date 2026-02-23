"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getIncidents,
  reviewIncident,
  createIncidentCase,
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_OUTCOME_LABELS,
} from "@/lib/api/proctoring"
import type { Incident } from "@/lib/types/proctoring"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
import { DataTable, type Column } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { ArrowLeft, Search, AlertTriangle, CheckCircle2, Clock, Eye, Plus, FileText } from "lucide-react"

export default function IncidentsPage() {
  const { t, dir, locale } = useI18n()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [reviewedFilter, setReviewedFilter] = useState<string>("all")

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [reviewAction, setReviewAction] = useState<"dismiss" | "flag" | "terminate">("dismiss")
  const [reviewNotes, setReviewNotes] = useState("")

  // Create Incident state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newIncident, setNewIncident] = useState({
    attemptId: "",
    severity: "2",
    titleEn: "",
    summaryEn: "",
  })

  useEffect(() => {
    loadIncidents()
  }, [])

  async function loadIncidents() {
    try {
      setLoading(true)
      const data = await getIncidents()
      setIncidents(data.items)
    } catch (error) {
      toast.error("Failed to load incidents")
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
      loadIncidents()
    } catch (error) {
      toast.error("Failed to review incident")
    }
  }

  async function handleCreateIncident() {
    const attemptId = parseInt(newIncident.attemptId)
    if (!attemptId || !newIncident.titleEn.trim()) {
      toast.error("Attempt ID and title are required")
      return
    }
    try {
      setCreateLoading(true)
      const result = await createIncidentCase({
        attemptId,
        severity: parseInt(newIncident.severity),
        titleEn: newIncident.titleEn.trim(),
        summaryEn: newIncident.summaryEn.trim() || undefined,
      })
      toast.success(`Incident ${result.caseNumber} created`)
      setCreateDialogOpen(false)
      setNewIncident({ attemptId: "", severity: "2", titleEn: "", summaryEn: "" })
      loadIncidents()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create incident")
    } finally {
      setCreateLoading(false)
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "Low":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
            Low
          </Badge>
        )
      case "Medium":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            Medium
          </Badge>
        )
      case "High":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
            High
          </Badge>
        )
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.examTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSeverity = severityFilter === "all" || inc.severity === severityFilter
    const matchesReviewed =
      reviewedFilter === "all" ||
      (reviewedFilter === "reviewed" && inc.reviewed) ||
      (reviewedFilter === "pending" && !inc.reviewed)
    return matchesSearch && matchesSeverity && matchesReviewed
  })

  const columns: Column<Incident>[] = [
    {
      key: "type",
      header: t("proctor.incidentType"),
      render: (inc) => (
        <div>
          <p className="font-medium">{inc.type}</p>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{inc.description}</p>
        </div>
      ),
    },
    {
      key: "candidate",
      header: t("grading.candidate"),
      render: (inc) => (
        <div>
          <p className="font-medium">{inc.candidateName}</p>
          <p className="text-sm text-muted-foreground">{inc.examTitle}</p>
        </div>
      ),
    },
    {
      key: "severity",
      header: t("proctor.severity"),
      render: (inc) => getSeverityBadge(inc.severity),
    },
    {
      key: "timestamp",
      header: t("proctor.timestamp"),
      render: (inc) => (
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Clock className="h-4 w-4" />
          {formatDateTime(inc.timestamp)}
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (inc) =>
        inc.reviewed ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">{t("proctor.reviewed")}</span>
          </div>
        ) : (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 me-1" />
            {t("proctor.pendingReview")}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (inc) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild title="View Details">
            <Link href={`/proctor-center/incidents/${inc.id}`}>
              <FileText className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild title="View Session">
            <Link href={`/proctor-center/${inc.sessionId}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {!inc.reviewed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedIncident(inc)
                setReviewDialogOpen(true)
              }}
            >
              {t("proctor.review")}
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/proctor-center">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("proctor.allIncidents")}</h1>
            <p className="text-muted-foreground mt-1">{t("proctor.allIncidentsDesc")}</p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          Create Incident
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("proctor.searchIncidents")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t("proctor.severity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="pending">{t("proctor.pendingReview")}</SelectItem>
                <SelectItem value="reviewed">{t("proctor.reviewed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredIncidents.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title={t("proctor.noIncidentsFound")}
              description={t("proctor.noIncidentsFoundDesc")}
            />
          ) : (
            <DataTable columns={columns} data={filteredIncidents} />
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
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

      {/* Create Incident Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Incident Case</DialogTitle>
            <DialogDescription>
              Manually create an incident case for investigation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Attempt ID *</Label>
              <Input
                type="number"
                placeholder="Enter attempt ID"
                value={newIncident.attemptId}
                onChange={(e) => setNewIncident(prev => ({ ...prev, attemptId: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={newIncident.severity}
                onValueChange={(v) => setNewIncident(prev => ({ ...prev, severity: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                  <SelectItem value="4">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Brief incident title"
                value={newIncident.titleEn}
                onChange={(e) => setNewIncident(prev => ({ ...prev, titleEn: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                placeholder="Describe what happened..."
                value={newIncident.summaryEn}
                onChange={(e) => setNewIncident(prev => ({ ...prev, summaryEn: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleCreateIncident} disabled={createLoading}>
              {createLoading ? <LoadingSpinner size="sm" className="me-2" /> : null}
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
