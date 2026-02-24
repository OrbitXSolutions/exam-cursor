"use client"

import { useEffect, useState, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
  Search, ChevronLeft, ChevronRight, Loader2, Shield,
  StopCircle, PlayCircle, Clock, RefreshCw,
} from "lucide-react"
import {
  getAttemptControlList, forceEndAttempt, resumeAttempt, addTimeToAttempt,
  type AttemptControlItemDto,
} from "@/lib/api/attempt-control"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import { getBatches, type BatchDto } from "@/lib/api/batch"

// ── Helpers ──────────────────────────────────────────────────
function formatSeconds(s: number): string {
  if (s <= 0) return "00:00:00"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function formatExtraTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—"
  const m = Math.floor(totalSeconds / 60)
  return `+${m} min`
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "InProgress": return "default"
    case "Started": return "secondary"
    case "Paused": return "outline"
    case "ForceSubmitted": return "destructive"
    case "Terminated": return "destructive"
    default: return "outline"
  }
}

export default function ExamControlPage() {
  const { language } = useI18n()
  const isAr = language === "ar"

  // ── Dropdowns ──────────────────────────────────────────────
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [batches, setBatches] = useState<BatchDto[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("all")
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState("All")
  const [search, setSearch] = useState("")

  // ── Data ───────────────────────────────────────────────────
  const [attempts, setAttempts] = useState<AttemptControlItemDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // ── Force End dialog ───────────────────────────────────────
  const [forceEndOpen, setForceEndOpen] = useState(false)
  const [forceEndTarget, setForceEndTarget] = useState<AttemptControlItemDto | null>(null)
  const [forceEndReason, setForceEndReason] = useState("")
  const [forceEndLoading, setForceEndLoading] = useState(false)

  // ── Resume dialog ──────────────────────────────────────────
  const [resumeOpen, setResumeOpen] = useState(false)
  const [resumeTarget, setResumeTarget] = useState<AttemptControlItemDto | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)

  // ── Add Time dialog ────────────────────────────────────────
  const [addTimeOpen, setAddTimeOpen] = useState(false)
  const [addTimeTarget, setAddTimeTarget] = useState<AttemptControlItemDto | null>(null)
  const [extraMinutes, setExtraMinutes] = useState("")
  const [addTimeReason, setAddTimeReason] = useState("")
  const [addTimeLoading, setAddTimeLoading] = useState(false)

  // ── Load dropdowns ─────────────────────────────────────────
  useEffect(() => {
    getExamListForDropdown().then(setExams).catch(() => setExams([]))
    getBatches({ pageSize: 200 }).then((r) => setBatches(r.items)).catch(() => setBatches([]))
  }, [])

  // ── Load attempts ──────────────────────────────────────────
  const loadAttempts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAttemptControlList({
        examId: selectedExamId !== "all" ? Number(selectedExamId) : undefined,
        batchId: selectedBatchId !== "all" ? Number(selectedBatchId) : undefined,
        search,
        status: statusFilter,
        page,
        pageSize,
      })
      setAttempts(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل تحميل المحاولات" : "Failed to load attempts"))
    } finally {
      setLoading(false)
    }
  }, [selectedExamId, selectedBatchId, search, statusFilter, page, pageSize, isAr])

  useEffect(() => { loadAttempts() }, [loadAttempts])

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Force End handler ──────────────────────────────────────
  const handleForceEnd = async () => {
    if (!forceEndTarget) return
    setForceEndLoading(true)
    try {
      await forceEndAttempt({ attemptId: forceEndTarget.attemptId, reason: forceEndReason || undefined })
      toast.success(isAr ? "تم إنهاء المحاولة بنجاح" : "Attempt force-ended successfully")
      setForceEndOpen(false)
      setForceEndReason("")
      loadAttempts()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل إنهاء المحاولة" : "Failed to force-end attempt"))
    } finally {
      setForceEndLoading(false)
    }
  }

  // ── Resume handler ─────────────────────────────────────────
  const handleResume = async () => {
    if (!resumeTarget) return
    setResumeLoading(true)
    try {
      const res = await resumeAttempt({ attemptId: resumeTarget.attemptId })
      toast.success(
        isAr
          ? `تم استئناف المحاولة — ${formatSeconds(res.remainingSeconds)} متبقي`
          : `Attempt resumed — ${formatSeconds(res.remainingSeconds)} remaining`,
      )
      setResumeOpen(false)
      loadAttempts()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل استئناف المحاولة" : "Failed to resume attempt"))
    } finally {
      setResumeLoading(false)
    }
  }

  // ── Add Time handler ───────────────────────────────────────
  const handleAddTime = async () => {
    if (!addTimeTarget) return
    const mins = parseInt(extraMinutes, 10)
    if (!mins || mins <= 0) {
      toast.error(isAr ? "يرجى إدخال عدد دقائق صحيح" : "Please enter a valid number of minutes")
      return
    }
    setAddTimeLoading(true)
    try {
      const res = await addTimeToAttempt({
        attemptId: addTimeTarget.attemptId,
        extraMinutes: mins,
        reason: addTimeReason || undefined,
      })
      toast.success(
        isAr
          ? `تمت إضافة ${mins} دقيقة — ${formatSeconds(res.remainingSeconds)} متبقي`
          : `${mins} minute(s) added — ${formatSeconds(res.remainingSeconds)} remaining`,
      )
      setAddTimeOpen(false)
      setExtraMinutes("")
      setAddTimeReason("")
      loadAttempts()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل إضافة الوقت" : "Failed to add time"))
    } finally {
      setAddTimeLoading(false)
    }
  }

  // ── Status label ───────────────────────────────────────────
  const statusLabel = (s: string) => {
    const map: Record<string, { en: string; ar: string }> = {
      Started: { en: "Started", ar: "بدأ" },
      InProgress: { en: "In Progress", ar: "قيد التنفيذ" },
      Paused: { en: "Paused", ar: "متوقف" },
      ForceSubmitted: { en: "Force Ended", ar: "أُنهي قسراً" },
      Terminated: { en: "Terminated", ar: "أُنهي بواسطة المراقب" },
      Submitted: { en: "Submitted", ar: "مُقدَّم" },
      Expired: { en: "Expired", ar: "منتهي" },
      Cancelled: { en: "Cancelled", ar: "ملغي" },
    }
    const entry = map[s] ?? { en: s, ar: s }
    return isAr ? entry.ar : entry.en
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          {isAr ? "التحكم بالاختبارات" : "Exam Control"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? "إدارة محاولات الاختبار النشطة — إنهاء، استئناف، إضافة وقت"
            : "Manage active exam attempts — Force End, Resume, Add Time"}
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Exam */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "الاختبار" : "Exam"}</Label>
              <Select value={selectedExamId} onValueChange={(v) => { setSelectedExamId(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "الكل" : "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الاختبارات" : "All Exams"}</SelectItem>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {isAr ? e.titleAr : e.titleEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "الدفعة" : "Batch"}</Label>
              <Select value={selectedBatchId} onValueChange={(v) => { setSelectedBatchId(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "الكل" : "All"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "جميع الدفعات" : "All Batches"}</SelectItem>
                  {batches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} ({b.candidateCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "الحالة" : "Status"}</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{isAr ? "نشط (الكل)" : "Active (All)"}</SelectItem>
                  <SelectItem value="InProgress">{isAr ? "قيد التنفيذ" : "In Progress"}</SelectItem>
                  <SelectItem value="Paused">{isAr ? "متوقف" : "Paused"}</SelectItem>
                  <SelectItem value="Started">{isAr ? "بدأ" : "Started"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label className="mb-1.5 block">{isAr ? "بحث" : "Search"}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "اسم، بريد، رقم..." : "Name, email, roll no..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {isAr ? "الإجمالي" : "Total"}: <strong>{totalCount}</strong>
        </span>
        <Button variant="outline" size="sm" onClick={loadAttempts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {isAr ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Shield className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">
                {isAr ? "لا توجد محاولات نشطة" : "No active attempts found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{isAr ? "الرقم التسلسلي" : "Roll No"}</TableHead>
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "الاختبار" : "Exam"}</TableHead>
                    <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "بدأ في" : "Started At"}</TableHead>
                    <TableHead className="text-center">{isAr ? "متبقي" : "Remaining"}</TableHead>
                    <TableHead className="text-center">{isAr ? "وقت إضافي" : "Extra Time"}</TableHead>
                    <TableHead className="text-center">{isAr ? "استئنافات" : "Resumes"}</TableHead>
                    <TableHead>{isAr ? "آخر نشاط" : "Last Activity"}</TableHead>
                    <TableHead className="text-center">{isAr ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((a, idx) => (
                    <TableRow key={a.attemptId}>
                      <TableCell className="font-mono text-muted-foreground">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell>{a.rollNo || "—"}</TableCell>
                      <TableCell className="font-medium">
                        {isAr ? (a.fullNameAr || a.fullName || "—") : (a.fullName || "—")}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {isAr ? (a.examTitleAr || a.examTitleEn || "—") : (a.examTitleEn || "—")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusVariant(a.status)}>
                          {statusLabel(a.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(a.startedAt).toLocaleString(isAr ? "ar-EG" : "en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <span className={a.remainingSeconds <= 300 && a.remainingSeconds > 0 ? "text-destructive font-bold" : ""}>
                          {formatSeconds(a.remainingSeconds)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatExtraTime(a.extraTimeSeconds)}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.resumeCount > 0 ? a.resumeCount : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {a.lastActivityAt
                          ? new Date(a.lastActivityAt).toLocaleString(isAr ? "ar-EG" : "en-US", {
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {/* Force End */}
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!a.canForceEnd}
                            onClick={() => { setForceEndTarget(a); setForceEndOpen(true) }}
                            title={isAr ? "إنهاء قسري" : "Force End"}
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>

                          {/* Resume */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!a.canResume}
                            onClick={() => { setResumeTarget(a); setResumeOpen(true) }}
                            title={isAr ? "استئناف" : "Resume"}
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>

                          {/* Add Time */}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!a.canAddTime}
                            onClick={() => { setAddTimeTarget(a); setAddTimeOpen(true) }}
                            title={isAr ? "إضافة وقت" : "Add Time"}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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

      {/* ═══════════ Force End Dialog ═══════════ */}
      <AlertDialog open={forceEndOpen} onOpenChange={setForceEndOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "تأكيد الإنهاء القسري" : "Confirm Force End"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                {isAr
                  ? `سيتم إنهاء محاولة ${forceEndTarget?.fullName ?? forceEndTarget?.rollNo ?? ""} قسراً. لا يمكن التراجع عن هذا الإجراء.`
                  : `This will force-end the attempt for ${forceEndTarget?.fullName ?? forceEndTarget?.rollNo ?? "this candidate"}. This action cannot be undone.`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label className="mb-1.5 block text-sm">{isAr ? "السبب (اختياري)" : "Reason (optional)"}</Label>
            <Input
              value={forceEndReason}
              onChange={(e) => setForceEndReason(e.target.value)}
              placeholder={isAr ? "أدخل السبب..." : "Enter reason..."}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setForceEndReason("")}>
              {isAr ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceEnd}
              disabled={forceEndLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {forceEndLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "إنهاء قسري" : "Force End"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════ Resume Dialog ═══════════ */}
      <AlertDialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAr ? "تأكيد الاستئناف" : "Confirm Resume"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `سيتم استئناف محاولة ${resumeTarget?.fullName ?? resumeTarget?.rollNo ?? ""}.`
                : `This will resume the attempt for ${resumeTarget?.fullName ?? resumeTarget?.rollNo ?? "this candidate"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} disabled={resumeLoading}>
              {resumeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "استئناف" : "Resume"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════ Add Time Dialog ═══════════ */}
      <Dialog open={addTimeOpen} onOpenChange={setAddTimeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة وقت إضافي" : "Add Extra Time"}</DialogTitle>
            <DialogDescription>
              {isAr
                ? `إضافة وقت لمحاولة ${addTimeTarget?.fullName ?? addTimeTarget?.rollNo ?? ""}`
                : `Add time for ${addTimeTarget?.fullName ?? addTimeTarget?.rollNo ?? "this candidate"}`}
              {addTimeTarget && (
                <span className="block mt-1 font-mono">
                  {isAr ? "الوقت المتبقي الحالي" : "Current remaining"}: {formatSeconds(addTimeTarget.remainingSeconds)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-1.5 block">{isAr ? "الدقائق الإضافية" : "Extra Minutes"} *</Label>
              <Input
                type="number"
                min={1}
                max={480}
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(e.target.value)}
                placeholder={isAr ? "مثال: 15" : "e.g. 15"}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">{isAr ? "السبب (اختياري)" : "Reason (optional)"}</Label>
              <Input
                value={addTimeReason}
                onChange={(e) => setAddTimeReason(e.target.value)}
                placeholder={isAr ? "أدخل السبب..." : "Enter reason..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddTimeOpen(false); setExtraMinutes(""); setAddTimeReason("") }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleAddTime} disabled={addTimeLoading}>
              {addTimeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Clock className="h-4 w-4 mr-2" />
              {isAr ? "إضافة الوقت" : "Add Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
