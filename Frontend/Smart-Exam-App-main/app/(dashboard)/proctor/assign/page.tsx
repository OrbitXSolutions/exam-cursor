"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { UserCheck, UserMinus, UserPlus, Loader2, Search, ChevronDown, CheckCircle2, Info, HelpCircle, ChevronUp, ShieldCheck, Zap, X } from "lucide-react"
import {
  getExamProctors, assignProctors, unassignProctors,
  type ExamProctorItemDto, type ExamProctorPageDto,
} from "@/lib/api/exam-proctor"
import { getExams } from "@/lib/api/exams"

export default function AssignToProctorPage() {
  const { language } = useI18n()
  const isAr = language === "ar"
  const searchParams = useSearchParams()

  // ── State ──────────────────────────────────────────────────
  const [examItems, setExamItems] = useState<Array<{id: number; titleEn: string; titleAr: string}>>([])
  const [examPage, setExamPage] = useState(0)
  const [examTotalPages, setExamTotalPages] = useState(0)
  const [examSearchLoading, setExamSearchLoading] = useState(false)
  const [selectedExamObj, setSelectedExamObj] = useState<{id: number; titleEn: string; titleAr: string} | null>(null)
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [pageData, setPageData] = useState<ExamProctorPageDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Selection sets: "assign" tab = available, "remove" tab = assigned
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set())
  const [removeSelected, setRemoveSelected] = useState<Set<string>>(new Set())

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<"assign" | "unassign">("assign")

  // How it works panel
  const [infoOpen, setInfoOpen] = useState(false)

  // ── Exam searchable dropdown ───────────────────────────────
  const [examSearch, setExamSearch] = useState("")
  const [examDropdownOpen, setExamDropdownOpen] = useState(false)
  const examDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (examDropdownRef.current && !examDropdownRef.current.contains(e.target as Node)) {
        setExamDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const PAGE_SIZE = 20

  async function loadExamsPage(search: string, page: number, replace: boolean) {
    setExamSearchLoading(true)
    try {
      const response = await getExams({ search: search || undefined, pageNumber: page, pageSize: PAGE_SIZE })
      const items = (response.items ?? []).map(e => ({ id: e.id, titleEn: e.titleEn, titleAr: e.titleAr }))
      if (replace) {
        setExamItems(items)
      } else {
        setExamItems((prev) => [...prev, ...items])
      }
      setExamPage(page)
      setExamTotalPages(response.totalPages ?? 0)
    } catch {
      // silent
    } finally {
      setExamSearchLoading(false)
    }
  }

  // Auto-select from ?examId URL param on mount
  useEffect(() => {
    const paramId = searchParams.get("examId")
    if (paramId) {
      setSelectedExamId(paramId)
      loadPage(Number(paramId))
      loadExamsPage("", 1, true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When examItems loads and a selectedExamId is set (from URL param), resolve the label
  useEffect(() => {
    if (selectedExamId && !selectedExamObj && examItems.length > 0) {
      const found = examItems.find(e => String(e.id) === selectedExamId)
      if (found) setSelectedExamObj(found)
    }
  }, [examItems, selectedExamId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load first page when dropdown opens
  useEffect(() => {
    if (!examDropdownOpen) return
    loadExamsPage(examSearch, 1, true)
  }, [examDropdownOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced reload on search change while dropdown is open
  useEffect(() => {
    if (!examDropdownOpen) return
    const timer = setTimeout(() => {
      loadExamsPage(examSearch, 1, true)
    }, 300)
    return () => clearTimeout(timer)
  }, [examSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load proctor page data when exam changes ───────────────
  const loadPage = useCallback(async (examId: number) => {
    setLoading(true)
    setAssignSelected(new Set())
    setRemoveSelected(new Set())
    try {
      const data = await getExamProctors(examId)
      setPageData(data)
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل التحميل" : "Failed to load"))
    } finally {
      setLoading(false)
    }
  }, [isAr])

  const handleExamChange = (value: string, obj?: {id: number; titleEn: string; titleAr: string}) => {
    setSelectedExamId(value)
    setSelectedExamObj(obj ?? null)
    setPageData(null)
    if (value) loadPage(Number(value))
  }

  // ── Confirm action ─────────────────────────────────────────
  const openConfirm = (action: "assign" | "unassign") => {
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const executeAction = async () => {
    if (!selectedExamId) return
    setActionLoading(true)
    try {
      if (confirmAction === "assign") {
        const res = await assignProctors(Number(selectedExamId), Array.from(assignSelected))
        toast.success(isAr
          ? `تم تعيين ${res.successCount} مراقب(ين)`
          : `${res.successCount} proctor(s) assigned`)
      } else {
        const res = await unassignProctors(Number(selectedExamId), Array.from(removeSelected))
        toast.success(isAr
          ? `تم إزالة ${res.successCount} مراقب(ين)`
          : `${res.successCount} proctor(s) removed`)
      }
      setConfirmOpen(false)
      loadPage(Number(selectedExamId))
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت العملية" : "Operation failed"))
    } finally {
      setActionLoading(false)
    }
  }

  // ── Selection helpers ──────────────────────────────────────
  const toggleAssign = (id: string) => {
    setAssignSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleRemove = (id: string) => {
    setRemoveSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllAssign = () => {
    const ids = pageData?.availableProctors.map(p => p.id) ?? []
    const allSelected = ids.every(id => assignSelected.has(id))
    setAssignSelected(allSelected ? new Set() : new Set(ids))
  }

  const toggleAllRemove = () => {
    const ids = pageData?.assignedProctors.map(p => p.id) ?? []
    const allSelected = ids.every(id => removeSelected.has(id))
    setRemoveSelected(allSelected ? new Set() : new Set(ids))
  }

  const allAssignSelected = (pageData?.availableProctors?.length ?? 0) > 0
    && pageData!.availableProctors.every(p => assignSelected.has(p.id))
  const allRemoveSelected = (pageData?.assignedProctors?.length ?? 0) > 0
    && pageData!.assignedProctors.every(p => removeSelected.has(p.id))

  const confirmCount = confirmAction === "assign" ? assignSelected.size : removeSelected.size

  // ── Proctor display name helper ────────────────────────────
  const displayName = (p: ExamProctorItemDto) =>
    p.displayName || p.fullName || p.email

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            {isAr ? "تعيين مراقبين للاختبار" : "Assign Proctor to Exam"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr
              ? "تعيين وإدارة المراقبين لكل اختبار"
              : "Assign and manage proctors per exam"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInfoOpen(o => !o)}
          className="flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span>{isAr ? "كيف تعمل المراقبة؟" : "How Proctoring Works?"}</span>
          {infoOpen
            ? <ChevronUp className="h-3.5 w-3.5 opacity-60" />
            : <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
        </button>
      </div>

      {/* Exam selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-2xl" ref={examDropdownRef}>
            <Label className="mb-1.5 block">{isAr ? "الاختبار" : "Exam"} *</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExamDropdownOpen(!examDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 h-10 text-sm rounded-md border bg-background hover:bg-accent/50 transition-colors"
              >
                <span className={selectedExamObj ? "text-foreground" : "text-muted-foreground"}>
                  {selectedExamObj
                    ? (isAr ? selectedExamObj.titleAr : selectedExamObj.titleEn)
                    : (isAr ? "اختر اختبار..." : "Select exam...")}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${examDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {examDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={isAr ? "ابحث عن اختبار..." : "Search exams..."}
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                        className="ps-9 h-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y">
                    {examSearchLoading && examItems.length === 0 ? (
                      <div className="flex items-center justify-center py-6">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : examItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {isAr ? "لم يتم العثور على اختبارات" : "No exams found"}
                      </div>
                    ) : (
                      <>
                        {examItems.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              handleExamChange(String(e.id), e)
                              setExamDropdownOpen(false)
                              setExamSearch("")
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${
                              selectedExamId === String(e.id) ? "bg-primary/10 text-primary font-medium" : ""
                            }`}
                          >
                            {selectedExamId === String(e.id) && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                            <span className="truncate">{isAr ? e.titleAr : e.titleEn}</span>
                          </button>
                        ))}
                        {examPage < examTotalPages && (
                          <button
                            type="button"
                            onClick={() => loadExamsPage(examSearch, examPage + 1, false)}
                            disabled={examSearchLoading}
                            className="w-full px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors text-center disabled:opacity-50"
                          >
                            {examSearchLoading
                              ? <LoadingSpinner size="sm" className="mx-auto" />
                              : (isAr ? "تحميل المزيد..." : "Load more...")}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {/* Content — only when data loaded */}
      {!loading && pageData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ── Assigned Proctors ───────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  {isAr ? "المراقبون المعيّنون" : "Assigned Proctors"}
                  <Badge variant="secondary">{pageData.assignedProctors.length}</Badge>
                </CardTitle>
                {removeSelected.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openConfirm("unassign")}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    {isAr
                      ? `إزالة (${removeSelected.size})`
                      : `Remove (${removeSelected.size})`}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pageData.assignedProctors.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {isAr ? "لا يوجد مراقبون معيّنون" : "No proctors assigned yet"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allRemoveSelected}
                          onCheckedChange={toggleAllRemove}
                        />
                      </TableHead>
                      <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead>
                      <TableHead>{isAr ? "تاريخ التعيين" : "Assigned At"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.assignedProctors.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            checked={removeSelected.has(p.id)}
                            onCheckedChange={() => toggleRemove(p.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{displayName(p)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.assignedAt
                            ? new Date(p.assignedAt).toLocaleDateString()
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── Available Proctors ──────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  {isAr ? "المراقبون المتاحون" : "Available Proctors"}
                  <Badge variant="secondary">{pageData.availableProctors.length}</Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm">
                      {isAr
                        ? "مراقبون من نفس القسم وغير معيّنين لهذا الاختبار بعد. يمكن تعيين نفس المراقب لعدة اختبارات."
                        : "Proctors from the same department who are not yet assigned to this exam. A proctor can be assigned to multiple exams."}
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                {assignSelected.size > 0 && (
                  <Button
                    size="sm"
                    onClick={() => openConfirm("assign")}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {isAr
                      ? `تعيين (${assignSelected.size})`
                      : `Assign (${assignSelected.size})`}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr
                  ? "حدد مراقباً أو أكثر من القائمة أدناه ثم اضغط على زر تعيين."
                  : "Select one or more proctors from the list below, then click the Assign button."}
              </p>
            </CardHeader>
            <CardContent>
              {pageData.availableProctors.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {isAr ? "جميع المراقبون معيّنون بالفعل" : "All proctors are already assigned"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allAssignSelected}
                          onCheckedChange={toggleAllAssign}
                        />
                      </TableHead>
                      <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                      <TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.availableProctors.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Checkbox
                            checked={assignSelected.has(p.id)}
                            onCheckedChange={() => toggleAssign(p.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{displayName(p)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </div>
      )}

      {/* No exam selected placeholder */}
      {!loading && !pageData && !selectedExamId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isAr ? "اختر اختبار لعرض المراقبين" : "Select an exam to manage proctors"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── How Proctoring Works panel ───────────────────────── */}
      {infoOpen && (
        <div className="rounded-xl border bg-muted/40 p-5 space-y-5 relative">
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="absolute top-3 end-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Section title */}
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{isAr ? "كيف تعمل المراقبة البشرية؟" : "How Does Human Proctoring Work?"}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

            {/* Block 1 — Who can proctor */}
            <div className="rounded-lg border bg-background p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                {isAr ? "من يستطيع المراقبة؟" : "Who Can Proctor?"}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <strong className="text-foreground">{isAr ? "المشرف العام / المسؤول" : "SuperAdmin / Admin"}</strong>
                    {isAr ? " — صلاحية كاملة تلقائياً" : " — full access automatically"}
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <strong className="text-foreground">{isAr ? "المراقب (Proctor)" : "Proctor role"}</strong>
                    {isAr ? " — فقط للاختبارات المعيّنة له" : " — only for exams they're assigned to"}
                  </span>
                </li>
              </ul>
            </div>

            {/* Block 2 — Auto-assign on publish */}
            <div className="rounded-lg border bg-background p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold dark:bg-emerald-900/40 dark:text-emerald-300">2</span>
                {isAr ? "التعيين التلقائي" : "Auto-Assignment"}
              </p>
              <p className="text-muted-foreground">
                {isAr
                  ? <>عند <strong className="text-foreground">نشر الاختبار</strong>، يتم تعيين <strong className="text-foreground">جميع المراقبين النشطين</strong> تلقائياً. المراقبون المُزالون مسبقاً لن يُعادوا.</>
                  : <>When an exam is <strong className="text-foreground">published</strong>, all <strong className="text-foreground">active Proctor-role users</strong> are automatically assigned. Previously removed proctors are not re-added.</>
                }
              </p>
            </div>

            {/* Block 3 — Unassigning */}
            <div className="rounded-lg border bg-background p-4 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold dark:bg-amber-900/40 dark:text-amber-300">3</span>
                {isAr ? "إزالة مراقب" : "Removing a Proctor"}
              </p>
              <ol className="space-y-1 text-muted-foreground list-none">
                <li className="flex gap-1.5">
                  <span className="text-foreground font-medium shrink-0">1.</span>
                  {isAr ? "اختر المراقب من قائمة \"المعيّنون\"" : "Select proctor from \"Assigned\" list"}
                </li>
                <li className="flex gap-1.5">
                  <span className="text-foreground font-medium shrink-0">2.</span>
                  {isAr ? "اضغط \"إزالة\" — يسري فوراً" : "Click Remove — takes effect immediately"}
                </li>
                <li className="flex gap-1.5">
                  <span className="text-foreground font-medium shrink-0">3.</span>
                  <strong className="text-foreground">{isAr ? "لا حاجة لإلغاء نشر الاختبار" : "No unpublish required"}</strong>
                </li>
              </ol>
            </div>

          </div>

          <p className="text-xs text-muted-foreground border-t pt-3">
            <Zap className="inline h-3 w-3 me-1 text-amber-500" />
            {isAr
              ? "ملاحظة: تفعيل خيار \"تتطلب المراقبة\" في إعدادات الاختبار هو المصدر الوحيد للحقيقة — إذا كان مغلقاً، لا يمكن للمراقبين رؤية الجلسات."
              : "Note: The \"Require Proctoring\" toggle in exam settings is the source of truth — if off, proctors cannot see live sessions even if assigned."}
          </p>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "assign"
                ? (isAr ? "تأكيد التعيين" : "Confirm Assignment")
                : (isAr ? "تأكيد الإزالة" : "Confirm Removal")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "assign"
                ? (isAr
                  ? `هل تريد تعيين ${confirmCount} مراقب(ين) لهذا الاختبار؟`
                  : `Assign ${confirmCount} proctor(s) to this exam?`)
                : (isAr
                  ? `هل تريد إزالة ${confirmCount} مراقب(ين) من هذا الاختبار؟`
                  : `Remove ${confirmCount} proctor(s) from this exam?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {isAr ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={actionLoading}
              className={confirmAction === "unassign" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {actionLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (confirmAction === "assign"
                  ? (isAr ? "تعيين" : "Assign")
                  : (isAr ? "إزالة" : "Remove"))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
