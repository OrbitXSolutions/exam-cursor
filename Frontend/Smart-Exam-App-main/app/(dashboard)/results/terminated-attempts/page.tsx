"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"
import { getCandidateResultList, type CandidateResultListItem } from "@/lib/api/results"
import { allowNewAttempt } from "@/lib/api/exam-operations"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  ShieldAlert,
  Search,
  RefreshCw,
  MoreHorizontal,
  Video,
  Bot,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  MessageSquareWarning,
  Clock,
} from "lucide-react"

const ALL_EXAMS_VALUE = "__all__"

function formatDateTime(dateStr: string | undefined | null, lang: string): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export default function TerminatedAttemptsPage() {
  const { t, language } = useI18n()
  const isAr = language === "ar"

  // ── State ──
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>(ALL_EXAMS_VALUE)
  const [searchQuery, setSearchQuery] = useState("")
  const [allCandidates, setAllCandidates] = useState<CandidateResultListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Allow New Attempt dialog
  const [newAttemptOpen, setNewAttemptOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<CandidateResultListItem | null>(null)
  const [reason, setReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // Termination Reason dialog
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [terminationReason, setTerminationReason] = useState<string | null>(null)
  const [reasonLoading, setReasonLoading] = useState(false)
  const [reasonCandidateName, setReasonCandidateName] = useState("")

  const reload = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Load exams
  useEffect(() => {
    let cancelled = false
    getExamListForDropdown()
      .then((list) => { if (!cancelled) setExams(Array.isArray(list) ? list : []) })
      .catch(() => { if (!cancelled) setExams([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Load candidates
  useEffect(() => {
    let cancelled = false
    setLoadingData(true)
    const examIdParam = selectedExamId !== ALL_EXAMS_VALUE ? Number(selectedExamId) : undefined

    getCandidateResultList(examIdParam, { pageNumber: 1, pageSize: 500 })
      .then((res) => {
        if (!cancelled) {
          setAllCandidates(res?.items ?? [])
        }
      })
      .catch(() => { if (!cancelled) setAllCandidates([]) })
      .finally(() => { if (!cancelled) setLoadingData(false) })

    return () => { cancelled = true }
  }, [selectedExamId, refreshKey])

  // Filter to only terminated/force-submitted/expired
  const terminatedAttempts = useMemo(() => {
    return allCandidates.filter(
      (c) => c.attemptStatusName === "Terminated" || c.attemptStatusName === "ForceSubmitted" || c.attemptStatusName === "Expired"
    )
  }, [allCandidates])

  // Search filter
  const filteredAttempts = useMemo(() => {
    if (!searchQuery.trim()) return terminatedAttempts
    const q = searchQuery.trim().toLowerCase()
    return terminatedAttempts.filter(
      (row) =>
        (row.candidateName ?? "").toLowerCase().includes(q) ||
        (row.candidateEmail ?? "").toLowerCase().includes(q)
    )
  }, [terminatedAttempts, searchQuery])

  const getExamTitle = (exam: ExamDropdownItem) =>
    (isAr ? exam.titleAr : exam.titleEn) || ""

  const getRowExamTitle = (row: CandidateResultListItem) =>
    (isAr ? row.examTitleAr : row.examTitleEn) || ""

  // ── Allow New Attempt ──
  const handleAllowNewAttempt = async () => {
    if (!selectedRow || !reason.trim()) return
    try {
      setActionLoading(true)
      await allowNewAttempt({
        candidateId: selectedRow.candidateId,
        examId: selectedRow.examId,
        reason: reason.trim(),
      })
      toast.success(
        isAr
          ? "تم منح محاولة جديدة بنجاح"
          : "New attempt override granted successfully"
      )
      setNewAttemptOpen(false)
      setReason("")
      setSelectedRow(null)
      reload()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed"
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // ── Fetch Termination Reason ──
  const handleShowReason = async (row: CandidateResultListItem) => {
    setReasonCandidateName(row.candidateName ?? "")
    setTerminationReason(null)
    setReasonDialogOpen(true)

    // For Expired attempts, show the expiry sub-detail directly
    if (row.attemptStatusName === "Expired") {
      const reasonMap: Record<string, { en: string; ar: string }> = {
        TimerExpiredWhileActive: { en: "Timer ran out while the candidate was actively working on the exam.", ar: "انتهى الوقت أثناء عمل المرشح على الاختبار." },
        TimerExpiredWhileDisconnected: { en: "Timer ran out while the candidate was disconnected (no heartbeat detected).", ar: "انتهى الوقت أثناء انقطاع المرشح (لم يتم الكشف عن أي نبض اتصال)." },
        ExamWindowClosed: { en: "The exam availability window has closed.", ar: "انتهت فترة إتاحة الاختبار." },
      }
      const detail = row.expiryReasonName ? reasonMap[row.expiryReasonName] : null
      setTerminationReason(
        detail
          ? (isAr ? detail.ar : detail.en)
          : (isAr ? "انتهت صلاحية المحاولة (لا توجد تفاصيل إضافية)" : "Attempt expired (no additional details)")
      )
      setReasonLoading(false)
      return
    }

    // For Terminated/ForceSubmitted, fetch from proctor sessions
    setReasonLoading(true)
    try {
      const query = new URLSearchParams()
      query.set("CandidateId", String(row.candidateId))
      query.set("PageSize", "50")
      const res = await apiClient.get<unknown>(`/Proctor/sessions?${query}`)
      const sessions: { attemptId?: number; terminationReason?: string; isTerminatedByProctor?: boolean }[] =
        Array.isArray(res) ? res : (res as Record<string, unknown>)?.items as typeof sessions ?? []
      const match = sessions.find((s) => s.attemptId === row.attemptId)
      setTerminationReason(
        match?.terminationReason ||
        (isAr ? "لم يتم تسجيل سبب الإنهاء" : "No termination reason recorded")
      )
    } catch {
      setTerminationReason(isAr ? "فشل في تحميل السبب" : "Failed to load reason")
    } finally {
      setReasonLoading(false)
    }
  }

  const statusBadge = (status: string | undefined) => {
    if (status === "Terminated") {
      return (
        <Badge className="border border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 gap-1">
          <XCircle className="h-3 w-3" />
          {isAr ? "أُنهي بواسطة المراقب" : "Terminated"}
        </Badge>
      )
    }
    if (status === "Expired") {
      return (
        <Badge className="border border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 gap-1">
          <Clock className="h-3 w-3" />
          {isAr ? "منتهي الصلاحية" : "Expired"}
        </Badge>
      )
    }
    return (
      <Badge className="border border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 gap-1">
        <AlertTriangle className="h-3 w-3" />
        {isAr ? "أُنهي قسراً" : "Force Ended"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          {isAr ? "المحاولات المُنهاة" : "Terminated Attempts"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? "مراجعة المحاولات التي تم إنهاؤها بواسطة المراقب أو المشرف — عرض سجل الأحداث والفيديو والتقارير"
            : "Review attempts terminated by proctor or admin — view event logs, video recordings, and reports"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isAr ? "الاختبار" : "Exam"}
          </Label>
          <div className="flex items-center gap-2">
            <Select value={selectedExamId} onValueChange={(v) => v && setSelectedExamId(v)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder={isAr ? "اختر اختباراً" : "Select exam"} />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value={ALL_EXAMS_VALUE}>
                  {isAr ? "جميع الاختبارات" : "All exams"}
                </SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={String(exam.id)}>
                    {getExamTitle(exam)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={reload}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {isAr ? "بحث" : "Search"}
          </Label>
          <div className="relative w-[260px]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "الاسم أو البريد الإلكتروني..." : "Name or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {terminatedAttempts.filter((a) => a.attemptStatusName === "Terminated").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "أُنهي بواسطة المراقب" : "Terminated by Proctor"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {terminatedAttempts.filter((a) => a.attemptStatusName === "ForceSubmitted").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "أُنهي قسراً بواسطة المشرف" : "Force Ended by Admin"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900">
              <Clock className="h-5 w-5 text-rose-600 dark:text-rose-300" />
            </div>
            <div>
              <p className="text-xl font-bold">
                {terminatedAttempts.filter((a) => a.attemptStatusName === "Expired").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "منتهي الصلاحية" : "Expired"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <ShieldAlert className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-xl font-bold">{filteredAttempts.length}</p>
              <p className="text-xs text-muted-foreground">
                {isAr ? "إجمالي المحاولات المُنهاة" : "Total Terminated"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {loadingData ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredAttempts.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={isAr ? "لا توجد محاولات مُنهاة" : "No terminated attempts"}
          description={
            isAr
              ? "لم يتم إنهاء أي محاولة بواسطة المراقب أو المشرف"
              : "No attempts have been terminated by proctor or admin"
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{isAr ? "المرشح" : "Candidate"}</TableHead>
                    <TableHead>{isAr ? "الاختبار" : "Exam"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "تاريخ الإنهاء" : "Ended At"}</TableHead>
                    <TableHead>{isAr ? "المحاولة" : "Attempt"}</TableHead>
                    <TableHead className="text-right">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((row, idx) => {
                    const examId = String(row.examId ?? "")
                    const attemptQuery = row.attemptId ? `?attemptId=${row.attemptId}` : ""

                    return (
                      <TableRow key={`${row.examId}-${row.candidateId}-${row.attemptId}`}>
                        <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{row.candidateName}</span>
                            {row.candidateEmail && (
                              <span className="text-xs text-muted-foreground">{row.candidateEmail}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate" title={getRowExamTitle(row)}>
                          {getRowExamTitle(row)}
                        </TableCell>
                        <TableCell>{statusBadge(row.attemptStatusName)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(row.lastAttemptAt, language)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            #{row.attemptNumber ?? 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              {/* Investigation actions */}
                              {examId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/results/ai-report/${examId}/${row.candidateId}${attemptQuery}`}>
                                    <Bot className="h-4 w-4 mr-2" />
                                    {isAr ? "تقرير المراقبة" : "Proctor Report"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem asChild>
                                <Link href={`/proctor-center/video/${row.candidateId}${attemptQuery}`}>
                                  <Video className="h-4 w-4 mr-2" />
                                  {isAr ? "أدلة المراقبة" : "Proctoring Evidence"}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShowReason(row)}>
                                <MessageSquareWarning className="h-4 w-4 mr-2" />
                                {row.attemptStatusName === "Expired"
                                  ? (isAr ? "لماذا انتهت الصلاحية؟" : "Why Expired?")
                                  : (isAr ? "سبب الإنهاء" : "Termination Reason")}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              {examId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/candidates/exam-details?candidateId=${row.candidateId}&examId=${examId}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    {isAr ? "تفاصيل المحاولة" : "Attempt Details"}
                                  </Link>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Admin action */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRow(row)
                                  setReason("")
                                  setNewAttemptOpen(true)
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {isAr ? "منح محاولة جديدة" : "Allow New Attempt"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Termination Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-red-600" />
              {reasonCandidateName && terminationReason && !reasonLoading
                ? (terminationReason.includes("Timer") || terminationReason.includes("window") || terminationReason.includes("انتهى") || terminationReason.includes("انتهت") || terminationReason.includes("صلاحية")
                    ? (isAr ? "لماذا انتهت الصلاحية؟" : "Why Expired?")
                    : (isAr ? "سبب الإنهاء" : "Termination Reason"))
                : (isAr ? "التفاصيل" : "Details")}
            </DialogTitle>
            <DialogDescription>
              {reasonCandidateName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {reasonLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                  {terminationReason}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialogOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allow New Attempt Dialog */}
      <Dialog open={newAttemptOpen} onOpenChange={setNewAttemptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {isAr ? "منح محاولة جديدة" : "Allow New Attempt"}
            </DialogTitle>
            <DialogDescription>
              {isAr
                ? "سيتم منح المرشح محاولة جديدة لهذا الاختبار. المحاولة القديمة ستبقى كما هي."
                : "The candidate will be granted a new attempt for this exam. The old attempt remains unchanged."}
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "المرشح" : "Candidate"}</span>
                  <span className="font-medium">{selectedRow.candidateName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "الاختبار" : "Exam"}</span>
                  <span className="font-medium truncate max-w-[200px]">{getRowExamTitle(selectedRow)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isAr ? "الحالة السابقة" : "Previous Status"}</span>
                  {statusBadge(selectedRow.attemptStatusName)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  {isAr ? "السبب (مطلوب)" : "Reason (required)"}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    isAr
                      ? "اكتب سبب منح محاولة جديدة..."
                      : "Enter reason for granting a new attempt..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewAttemptOpen(false)} disabled={actionLoading}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleAllowNewAttempt}
              disabled={actionLoading || !reason.trim()}
            >
              {actionLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {isAr ? "تأكيد المنح" : "Confirm Grant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
