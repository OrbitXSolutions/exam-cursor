"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  UserPlus, UserMinus, Search, ChevronLeft, ChevronRight, Loader2,
  Users, CheckCircle2, XCircle, AlertTriangle, ClipboardList,
} from "lucide-react"
import {
  getAssignmentCandidates, assignExam, unassignExam,
  type AssignmentCandidateDto, type AssignmentResultDto,
} from "@/lib/api/exam-assignment"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import { getBatches, type BatchDto } from "@/lib/api/batch"

export default function AssignToExamPage() {
  const { language } = useI18n()
  const { user } = useAuth()
  const isAr = language === "ar"

  // ── Top controls ───────────────────────────────────────────
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [batches, setBatches] = useState<BatchDto[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [scheduleFrom, setScheduleFrom] = useState("")
  const [scheduleTo, setScheduleTo] = useState("")

  // ── Data state ─────────────────────────────────────────────
  const [candidates, setCandidates] = useState<AssignmentCandidateDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // ── Selection ──────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // ── Action state ───────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"assign" | "unassign">("assign")
  const [confirmMode, setConfirmMode] = useState<"selected" | "all">("selected")
  const [actionLoading, setActionLoading] = useState(false)

  // ── Result dialog ──────────────────────────────────────────
  const [resultOpen, setResultOpen] = useState(false)
  const [result, setResult] = useState<AssignmentResultDto | null>(null)

  const isReady = useMemo(() => {
    return !!selectedExamId && !!scheduleFrom && !!scheduleTo && scheduleFrom < scheduleTo
  }, [selectedExamId, scheduleFrom, scheduleTo])

  // ── Load dropdowns ─────────────────────────────────────────
  useEffect(() => {
    getExamListForDropdown().then(setExams).catch(() => setExams([]))
    getBatches({ pageSize: 200 }).then((r) => setBatches(r.items)).catch(() => setBatches([]))
  }, [])

  // ── Load candidates ────────────────────────────────────────
  const loadCandidates = useCallback(async () => {
    if (!isReady) return
    setLoading(true)
    try {
      const data = await getAssignmentCandidates({
        examId: Number(selectedExamId),
        scheduleFrom,
        scheduleTo,
        batchId: selectedBatchId !== "all" ? Number(selectedBatchId) : undefined,
        search,
        status: statusFilter,
        page,
        pageSize,
      })
      setCandidates(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل تحميل المرشحين" : "Failed to load candidates"))
    } finally {
      setLoading(false)
    }
  }, [isReady, selectedExamId, scheduleFrom, scheduleTo, selectedBatchId, search, statusFilter, page, pageSize, isAr])

  useEffect(() => { loadCandidates() }, [loadCandidates])

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(t)
  }, [search, statusFilter])

  // Reset selection when exam/schedule changes
  useEffect(() => { setSelected(new Set()) }, [selectedExamId, scheduleFrom, scheduleTo, selectedBatchId])

  // ── Selection helpers ──────────────────────────────────────
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePage = () => {
    const pageIds = candidates.map((c) => c.id)
    const allSelected = pageIds.every((id) => selected.has(id))
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.delete(id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        pageIds.forEach((id) => next.add(id))
        return next
      })
    }
  }

  const allPageSelected = candidates.length > 0 && candidates.every((c) => selected.has(c.id))

  // ── Confirm action ─────────────────────────────────────────
  const openConfirm = (action: "assign" | "unassign", mode: "selected" | "all") => {
    setConfirmAction(action)
    setConfirmMode(mode)
    setConfirmOpen(true)
  }

  const executeAction = async () => {
    setActionLoading(true)
    try {
      const examId = Number(selectedExamId)
      let res: AssignmentResultDto

      if (confirmAction === "assign") {
        const payload: any = { examId, scheduleFrom, scheduleTo }
        if (confirmMode === "all") {
          // Batch mode or filter-all
          if (selectedBatchId !== "all") {
            payload.batchId = Number(selectedBatchId)
          } else {
            payload.applyToAllMatchingFilters = true
            if (search) payload.search = search
            if (statusFilter !== "all") payload.filterStatus = statusFilter
          }
        } else {
          payload.candidateIds = Array.from(selected)
        }
        res = await assignExam(payload)
      } else {
        res = await unassignExam({ examId, candidateIds: Array.from(selected) })
      }

      setResult(res)
      setResultOpen(true)
      setConfirmOpen(false)
      setSelected(new Set())
      loadCandidates()

      if (res.successCount > 0) {
        toast.success(
          confirmAction === "assign"
            ? (isAr ? `تم تعيين ${res.successCount} مرشح(ين)` : `${res.successCount} candidate(s) assigned`)
            : (isAr ? `تم إلغاء تعيين ${res.successCount} مرشح(ين)` : `${res.successCount} candidate(s) unassigned`),
        )
      }
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت العملية" : "Operation failed"))
    } finally {
      setActionLoading(false)
    }
  }

  // ── Get confirm count/label ────────────────────────────────
  const confirmCount = confirmMode === "all" ? totalCount : selected.size
  const confirmLabel = confirmAction === "assign"
    ? (isAr ? "تعيين" : "Assign")
    : (isAr ? "إلغاء التعيين" : "Unassign")

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          {isAr ? "تعيين للاختبار" : "Assign to Exam"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr ? "تعيين المرشحين للاختبارات المنشورة" : "Assign candidates to published exams"}
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Exam */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "الاختبار" : "Exam"} *</Label>
              <Select value={selectedExamId} onValueChange={(v) => { setSelectedExamId(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر اختبار..." : "Select exam..."} />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {isAr ? e.titleAr : e.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule From */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "من" : "Schedule From"} *</Label>
              <Input
                type="datetime-local"
                value={scheduleFrom}
                onChange={(e) => setScheduleFrom(e.target.value)}
              />
            </div>

            {/* Schedule To */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "إلى" : "Schedule To"} *</Label>
              <Input
                type="datetime-local"
                value={scheduleTo}
                onChange={(e) => setScheduleTo(e.target.value)}
              />
            </div>

            {/* Batch (optional) */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "الدفعة" : "Batch"}</Label>
              <Select value={selectedBatchId} onValueChange={(v) => { setSelectedBatchId(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "الكل" : "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع المرشحين" : "All Candidates"}</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.candidateCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isReady && selectedExamId && (
            <p className="text-sm text-destructive mt-3">
              {isAr ? "يرجى تحديد جدول زمني صحيح (إلى > من)" : "Please set a valid schedule (To must be after From)"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Search + Filters + Actions */}
      {isReady && (
        <>
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث بالاسم أو البريد أو الرقم..." : "Search name, email, roll no..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="Active">{isAr ? "نشط" : "Active"}</SelectItem>
                    <SelectItem value="Blocked">{isAr ? "محظور" : "Blocked"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">
              {isAr ? "الإجمالي" : "Total"}: <strong>{totalCount}</strong>
              {selected.size > 0 && (
                <> &nbsp;|&nbsp; {isAr ? "محدد" : "Selected"}: <strong>{selected.size}</strong></>
              )}
            </span>
            <div className="ml-auto flex gap-2">
              {selected.size > 0 && (
                <>
                  <Button size="sm" onClick={() => openConfirm("assign", "selected")}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isAr ? `تعيين (${selected.size})` : `Assign (${selected.size})`}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => openConfirm("unassign", "selected")}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    {isAr ? `إلغاء (${selected.size})` : `Unassign (${selected.size})`}
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => openConfirm("assign", "all")} disabled={totalCount === 0}>
                <Users className="h-4 w-4 mr-2" />
                {isAr ? "تعيين الكل" : "Assign All Matching"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-16"><LoadingSpinner /></div>
              ) : candidates.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <Users className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-medium">{isAr ? "لا يوجد مرشحون" : "No candidates found"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox checked={allPageSelected} onCheckedChange={togglePage} />
                      </TableHead>
                      <TableHead>#</TableHead>
                      <TableHead>{isAr ? "الرقم التسلسلي" : "Roll No"}</TableHead>
                      <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                      <TableHead>{isAr ? "الجوال" : "Mobile"}</TableHead>
                      <TableHead className="text-center">{isAr ? "معيّن؟" : "Assigned"}</TableHead>
                      <TableHead className="text-center">{isAr ? "بدأ؟" : "Started"}</TableHead>
                      <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c, idx) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => toggleOne(c.id)}>
                        <TableCell>
                          <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>{c.rollNo || "—"}</TableCell>
                        <TableCell className="font-medium">
                          {isAr ? (c.fullNameAr || c.fullName || "—") : (c.fullName || "—")}
                        </TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.mobile || "—"}</TableCell>
                        <TableCell className="text-center">
                          {c.examAssigned ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {isAr ? "نعم" : "Yes"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <XCircle className="h-3 w-3" />
                              {isAr ? "لا" : "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {c.examStarted ? (
                            <Badge variant="secondary" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {isAr ? "نعم" : "Yes"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              {isAr ? "لا" : "No"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={c.isBlocked ? "destructive" : "default"}>
                            {c.isBlocked ? (isAr ? "محظور" : "Blocked") : (isAr ? "نشط" : "Active")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Not ready prompt */}
      {!isReady && !selectedExamId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-4 opacity-40" />
            <p className="font-medium text-lg">
              {isAr ? "اختر اختباراً وحدد الجدول الزمني للبدء" : "Select an exam and set the schedule to begin"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "assign"
                ? (isAr ? "تأكيد التعيين" : "Confirm Assignment")
                : (isAr ? "تأكيد إلغاء التعيين" : "Confirm Unassignment")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "assign"
                ? (isAr
                    ? `سيتم تعيين الاختبار لـ ${confirmMode === "all" ? totalCount : selected.size} مرشح(ين). سيتم تخطي المحظورين والمعيّنين مسبقاً.`
                    : `This will assign the exam to ${confirmMode === "all" ? totalCount : selected.size} candidate(s). Blocked and already-assigned candidates will be skipped.`)
                : (isAr
                    ? `سيتم إلغاء تعيين الاختبار من ${selected.size} مرشح(ين). لا يمكن إلغاء التعيين إذا بدأ المرشح الاختبار.`
                    : `This will unassign the exam from ${selected.size} candidate(s). Candidates who already started cannot be unassigned.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={actionLoading}
              className={confirmAction === "unassign" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmLabel} ({confirmMode === "all" ? totalCount : selected.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result Summary Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAr ? "نتيجة العملية" : "Operation Result"}</DialogTitle>
            <DialogDescription>
              {isAr ? "ملخص عملية التعيين" : "Assignment operation summary"}
            </DialogDescription>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold">{result.totalTargeted}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "المستهدف" : "Targeted"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "نجح" : "Success"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-orange-500">{result.skippedCount}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "تخطي" : "Skipped"}</p>
                </div>
              </div>
              {result.skippedDetails.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{isAr ? "تفاصيل التخطي" : "Skipped Details"}</p>
                  <div className="max-h-48 overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isAr ? "المرشح" : "Candidate"}</TableHead>
                          <TableHead>{isAr ? "السبب" : "Reason"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.skippedDetails.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{s.candidateName || s.candidateId}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{s.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setResultOpen(false)}>{isAr ? "إغلاق" : "Close"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
