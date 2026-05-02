"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
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
import { UserCheck, UserMinus, UserPlus, Loader2, Search, ChevronDown, CheckCircle2, Info } from "lucide-react"
import {
  getExamProctors, assignProctors, unassignProctors,
  type ExamProctorItemDto, type ExamProctorPageDto,
} from "@/lib/api/exam-proctor"
import { getExamListForDropdown, type ExamDropdownItem } from "@/lib/api/exams"

export default function AssignToProctorPage() {
  const { language } = useI18n()
  const isAr = language === "ar"
  const searchParams = useSearchParams()

  // ── State ──────────────────────────────────────────────────
  const [exams, setExams] = useState<ExamDropdownItem[]>([])
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

  const filteredExamOptions = useMemo(() => {
    if (!examSearch) return exams
    const s = examSearch.toLowerCase()
    return exams.filter(e =>
      (e.titleEn || "").toLowerCase().includes(s) ||
      (e.titleAr || "").toLowerCase().includes(s)
    )
  }, [exams, examSearch])

  const selectedExamLabel = useMemo(
    () => exams.find(e => String(e.id) === selectedExamId),
    [exams, selectedExamId]
  )

  // ── Load exam dropdown once, then auto-select from ?examId ──
  useEffect(() => {
    getExamListForDropdown()
      .then((list) => {
        setExams(list)
        const paramId = searchParams.get("examId")
        if (paramId) {
          setSelectedExamId(paramId)
          loadPage(Number(paramId))
        }
      })
      .catch(() => setExams([]))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleExamChange = (value: string) => {
    setSelectedExamId(value)
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
                <span className={selectedExamLabel ? "text-foreground" : "text-muted-foreground"}>
                  {selectedExamLabel
                    ? (isAr ? selectedExamLabel.titleAr : selectedExamLabel.titleEn)
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
                    {filteredExamOptions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {isAr ? "لم يتم العثور على اختبارات" : "No exams found"}
                      </div>
                    ) : (
                      filteredExamOptions.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            handleExamChange(String(e.id))
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
                      ))
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
