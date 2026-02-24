"use client"

import { useEffect, useState, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Search,
  UserPlus,
  Clock,
  XCircle,
  Shield,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import {
  getExamOperationsCandidates,
  allowNewAttempt,
  operationAddTime,
  terminateAttempt,
  type ExamOperationsCandidateDto,
} from "@/lib/api/exam-operations"

function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

export default function ExamOperationsPage() {
  const { t, language } = useI18n()

  // Filters
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  // Data
  const [candidates, setCandidates] = useState<ExamOperationsCandidateDto[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Dialogs
  const [allowNewAttemptOpen, setAllowNewAttemptOpen] = useState(false)
  const [addTimeOpen, setAddTimeOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] =
    useState<ExamOperationsCandidateDto | null>(null)
  const [reason, setReason] = useState("")
  const [extraMinutes, setExtraMinutes] = useState(10)
  const [actionLoading, setActionLoading] = useState(false)

  // Load exams dropdown
  useEffect(() => {
    getExamListForDropdown()
      .then(setExams)
      .catch(() => toast.error("Failed to load exams"))
  }, [])

  // Load candidates when exam changes
  const loadCandidates = useCallback(async () => {
    if (!selectedExamId) {
      setCandidates([])
      setTotalCount(0)
      return
    }

    try {
      setLoading(true)
      const result = await getExamOperationsCandidates({
        examId: selectedExamId,
        search: search || undefined,
        page,
        pageSize,
      })
      setCandidates(result.items)
      setTotalCount(result.totalCount)
    } catch (error) {
      toast.error("Failed to load candidates")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [selectedExamId, search, page])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  // ── Actions ──────────────────────────────────────────

  const handleAllowNewAttempt = async () => {
    if (!selectedCandidate || !reason.trim()) return
    try {
      setActionLoading(true)
      await allowNewAttempt({
        candidateId: selectedCandidate.candidateId,
        examId: selectedCandidate.examId,
        reason: reason.trim(),
      })
      toast.success("New attempt override granted successfully")
      setAllowNewAttemptOpen(false)
      setReason("")
      loadCandidates()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to grant override"
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddTime = async () => {
    if (!selectedCandidate?.latestAttemptId || !reason.trim()) return
    try {
      setActionLoading(true)
      await operationAddTime({
        attemptId: selectedCandidate.latestAttemptId,
        extraMinutes,
        reason: reason.trim(),
      })
      toast.success(`${extraMinutes} minutes added successfully`)
      setAddTimeOpen(false)
      setReason("")
      loadCandidates()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add time"
      )
    } finally {
      setActionLoading(false)
    }
  }

  const handleTerminate = async () => {
    if (!selectedCandidate?.latestAttemptId || !reason.trim()) return
    try {
      setActionLoading(true)
      await terminateAttempt({
        attemptId: selectedCandidate.latestAttemptId,
        reason: reason.trim(),
      })
      toast.success("Attempt terminated successfully")
      setTerminateOpen(false)
      setReason("")
      loadCandidates()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to terminate"
      )
    } finally {
      setActionLoading(false)
    }
  }

  const openDialog = (
    candidate: ExamOperationsCandidateDto,
    type: "allow" | "addTime" | "terminate"
  ) => {
    setSelectedCandidate(candidate)
    setReason("")
    setExtraMinutes(10)
    if (type === "allow") setAllowNewAttemptOpen(true)
    if (type === "addTime") setAddTimeOpen(true)
    if (type === "terminate") setTerminateOpen(true)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const statusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">No Attempt</Badge>
    const map: Record<string, string> = {
      Started: "border-sky-200 bg-sky-50 text-sky-700",
      InProgress: "border-sky-200 bg-sky-50 text-sky-700",
      Submitted: "border-amber-200 bg-amber-50 text-amber-700",
      Expired: "border-rose-200 bg-rose-50 text-rose-700",
      Cancelled: "border-gray-200 bg-gray-100 text-gray-700",
      ForceSubmitted: "border-red-200 bg-red-50 text-red-700",
      Terminated: "border-red-200 bg-red-50 text-red-700",
      Paused: "border-purple-200 bg-purple-50 text-purple-700",
    }
    return (
      <Badge className={`border ${map[status] || ""}`}>{status}</Badge>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t("examOperations.title") || "Exam Operations"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("examOperations.subtitle") || "Admin override actions: grant new attempts, add time, terminate"}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-72">
            <Label className="mb-1.5 block text-sm font-medium">
              {t("examOperations.selectExam") || "Select Exam"}
            </Label>
            <Select
              value={selectedExamId?.toString() ?? ""}
              onValueChange={(v) => {
                setSelectedExamId(v ? Number(v) : null)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("examOperations.selectExamPlaceholder") || "Choose an exam..."} />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id.toString()}>
                    {language === "ar" ? exam.titleAr || exam.titleEn : exam.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("common.search") || "Search..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {!selectedExamId ? (
        <EmptyState
          icon={Users}
          title={t("examOperations.selectExamFirst") || "Select an Exam"}
          description={t("examOperations.selectExamFirstDesc") || "Choose an exam from the dropdown to see candidates."}
        />
      ) : loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("examOperations.noCandidates") || "No Candidates"}
          description={t("examOperations.noCandidatesDesc") || "No candidates found for this exam."}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("examOperations.candidate") || "Candidate"}</TableHead>
                  <TableHead>{t("examOperations.rollNo") || "Roll No"}</TableHead>
                  <TableHead>{t("examOperations.attempts") || "Attempts"}</TableHead>
                  <TableHead>{t("examOperations.latestStatus") || "Latest Status"}</TableHead>
                  <TableHead>{t("examOperations.overrides") || "Overrides"}</TableHead>
                  <TableHead className="text-right">{t("examOperations.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.candidateId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {language === "ar" ? c.fullNameAr || c.fullName : c.fullName || c.fullNameAr}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{c.rollNo || "-"}</TableCell>
                    <TableCell>
                      <span className="font-medium">{c.totalAttempts}</span>
                      <span className="text-muted-foreground"> / {c.maxAttempts === 0 ? "∞" : c.maxAttempts}</span>
                    </TableCell>
                    <TableCell>{statusBadge(c.latestAttemptStatus)}</TableCell>
                    <TableCell>
                      {c.pendingOverrides > 0 ? (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          {c.pendingOverrides} pending
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {c.canAllowNewAttempt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(c, "allow")}
                          >
                            <UserPlus className="mr-1 h-3.5 w-3.5" />
                            {t("examOperations.allowNewAttempt") || "New Attempt"}
                          </Button>
                        )}
                        {c.canAddTime && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(c, "addTime")}
                          >
                            <Clock className="mr-1 h-3.5 w-3.5" />
                            {t("examOperations.addTime") || "Add Time"}
                          </Button>
                        )}
                        {c.canTerminate && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openDialog(c, "terminate")}
                          >
                            <XCircle className="mr-1 h-3.5 w-3.5" />
                            {t("examOperations.terminate") || "Terminate"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {t("common.showing") || "Showing"} {(page - 1) * pageSize + 1}–
                  {Math.min(page * pageSize, totalCount)} {t("common.of") || "of"} {totalCount}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Allow New Attempt Dialog ─────────────────────── */}
      <Dialog open={allowNewAttemptOpen} onOpenChange={setAllowNewAttemptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("examOperations.allowNewAttemptTitle") || "Allow New Attempt"}</DialogTitle>
            <DialogDescription>
              {t("examOperations.allowNewAttemptDesc") || "Grant an admin override so this candidate can take an additional attempt."}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>{t("examOperations.candidate") || "Candidate"}:</strong>{" "}
                  {language === "ar" ? selectedCandidate.fullNameAr || selectedCandidate.fullName : selectedCandidate.fullName}
                </p>
                <p><strong>{t("examOperations.attempts") || "Attempts"}:</strong>{" "}
                  {selectedCandidate.totalAttempts} / {selectedCandidate.maxAttempts === 0 ? "∞" : selectedCandidate.maxAttempts}
                </p>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  {t("examOperations.reason") || "Reason"} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("examOperations.reasonPlaceholder") || "Enter reason for granting new attempt..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllowNewAttemptOpen(false)} disabled={actionLoading}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleAllowNewAttempt} disabled={actionLoading || !reason.trim()}>
              {actionLoading ? <LoadingSpinner size="sm" /> : (t("examOperations.confirm") || "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Time Dialog ──────────────────────────────── */}
      <Dialog open={addTimeOpen} onOpenChange={setAddTimeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("examOperations.addTimeTitle") || "Add Extra Time"}</DialogTitle>
            <DialogDescription>
              {t("examOperations.addTimeDesc") || "Add extra time to the candidate's active attempt."}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>{t("examOperations.candidate") || "Candidate"}:</strong>{" "}
                  {language === "ar" ? selectedCandidate.fullNameAr || selectedCandidate.fullName : selectedCandidate.fullName}
                </p>
                <p><strong>{t("examOperations.attemptId") || "Attempt ID"}:</strong>{" "}
                  #{selectedCandidate.latestAttemptId}
                </p>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  {t("examOperations.extraMinutes") || "Extra Minutes"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={480}
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  {t("examOperations.reason") || "Reason"} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("examOperations.reasonPlaceholder") || "Enter reason..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTimeOpen(false)} disabled={actionLoading}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleAddTime} disabled={actionLoading || !reason.trim()}>
              {actionLoading ? <LoadingSpinner size="sm" /> : (t("examOperations.confirm") || "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Terminate Dialog ─────────────────────────────── */}
      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("examOperations.terminateTitle") || "Terminate Attempt"}</DialogTitle>
            <DialogDescription>
              {t("examOperations.terminateDesc") || "This will force-end the candidate's active attempt. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
                <p><strong>{t("examOperations.candidate") || "Candidate"}:</strong>{" "}
                  {language === "ar" ? selectedCandidate.fullNameAr || selectedCandidate.fullName : selectedCandidate.fullName}
                </p>
                <p><strong>{t("examOperations.attemptId") || "Attempt ID"}:</strong>{" "}
                  #{selectedCandidate.latestAttemptId}
                </p>
                <p><strong>{t("examOperations.status") || "Status"}:</strong>{" "}
                  {selectedCandidate.latestAttemptStatus}
                </p>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  {t("examOperations.reason") || "Reason"} <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("examOperations.reasonPlaceholder") || "Enter reason for termination..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateOpen(false)} disabled={actionLoading}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleTerminate} disabled={actionLoading || !reason.trim()}>
              {actionLoading ? <LoadingSpinner size="sm" /> : (t("examOperations.confirmTerminate") || "Terminate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
