"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Users, UserPlus, Search, MoreHorizontal, Pencil, Trash2, ShieldBan, ShieldCheck,
  Download, Upload, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react"
import {
  getCandidates, createCandidate, updateCandidate, blockCandidate, unblockCandidate,
  deleteCandidate, exportCandidates, downloadImportTemplate, importCandidates,
  type CandidateDto, type CandidateImportResult,
} from "@/lib/api/candidate-admin"

export default function CandidatesDataPage() {
  const { language } = useI18n()
  const { user } = useAuth()
  const isAr = language === "ar"

  // ── Data state ─────────────────────────────────────────────
  const [candidates, setCandidates] = useState<CandidateDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // ── Dialog state ───────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [formLoading, setFormLoading] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDto | null>(null)
  const [formData, setFormData] = useState({
    fullName: "", fullNameAr: "", email: "", password: "", rollNo: "", mobile: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Delete state ───────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CandidateDto | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Block/Unblock state ────────────────────────────────────
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockTarget, setBlockTarget] = useState<CandidateDto | null>(null)
  const [blockLoading, setBlockLoading] = useState(false)

  // ── Import state ───────────────────────────────────────────
  const [importLoading, setImportLoading] = useState(false)
  const [importResultOpen, setImportResultOpen] = useState(false)
  const [importResult, setImportResult] = useState<CandidateImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Export state ───────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false)

  // ── Load data ──────────────────────────────────────────────
  const loadCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCandidates({ search, status: statusFilter, page, pageSize })
      setCandidates(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (e: any) {
      toast.error(e.message || "Failed to load candidates")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, pageSize])

  useEffect(() => { loadCandidates() }, [loadCandidates])

  // Debounced search
  const [searchDebounce, setSearchDebounce] = useState("")
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchDebounce); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchDebounce])

  // ── Form helpers ───────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create")
    setFormData({ fullName: "", fullNameAr: "", email: "", password: "", rollNo: "", mobile: "" })
    setFormErrors({})
    setSelectedCandidate(null)
    setFormOpen(true)
  }
  const openEdit = (c: CandidateDto) => {
    setFormMode("edit")
    setFormData({
      fullName: c.fullName || "",
      fullNameAr: c.fullNameAr || "",
      email: c.email,
      password: "",
      rollNo: c.rollNo || "",
      mobile: c.mobile || "",
    })
    setFormErrors({})
    setSelectedCandidate(c)
    setFormOpen(true)
  }

  const validateForm = () => {
    const err: Record<string, string> = {}
    if (!formData.fullName.trim()) err.fullName = isAr ? "الاسم مطلوب" : "Full name is required"
    if (!formData.email.trim()) err.email = isAr ? "البريد مطلوب" : "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      err.email = isAr ? "بريد غير صالح" : "Invalid email format"
    if (!formData.rollNo.trim()) err.rollNo = isAr ? "رقم القيد مطلوب" : "Roll No is required"
    if (formMode === "create" && !formData.password.trim())
      err.password = isAr ? "كلمة المرور مطلوبة" : "Password is required"
    if (formData.password && formData.password.length < 6)
      err.password = isAr ? "6 أحرف على الأقل" : "At least 6 characters"
    setFormErrors(err)
    return Object.keys(err).length === 0
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return
    setFormLoading(true)
    try {
      if (formMode === "create") {
        await createCandidate({
          fullName: formData.fullName,
          fullNameAr: formData.fullNameAr || undefined,
          email: formData.email,
          password: formData.password || undefined,
          rollNo: formData.rollNo,
          mobile: formData.mobile || undefined,
        })
        toast.success(isAr ? "تم إنشاء المرشح بنجاح" : "Candidate created successfully")
      } else if (selectedCandidate) {
        await updateCandidate(selectedCandidate.id, {
          fullName: formData.fullName,
          fullNameAr: formData.fullNameAr || undefined,
          email: formData.email,
          password: formData.password || undefined,
          rollNo: formData.rollNo,
          mobile: formData.mobile || undefined,
        })
        toast.success(isAr ? "تم تحديث المرشح بنجاح" : "Candidate updated successfully")
      }
      setFormOpen(false)
      loadCandidates()
    } catch (e: any) {
      toast.error(e.message || "Operation failed")
    } finally {
      setFormLoading(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCandidate(deleteTarget.id)
      toast.success(isAr ? "تم حذف المرشح" : "Candidate deleted")
      setDeleteOpen(false)
      loadCandidates()
    } catch (e: any) {
      toast.error(e.message || "Delete failed")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Block / Unblock ────────────────────────────────────────
  const handleBlock = async () => {
    if (!blockTarget) return
    setBlockLoading(true)
    try {
      if (blockTarget.isBlocked) {
        await unblockCandidate(blockTarget.id)
        toast.success(isAr ? "تم إلغاء حظر المرشح" : "Candidate unblocked")
      } else {
        await blockCandidate(blockTarget.id)
        toast.success(isAr ? "تم حظر المرشح" : "Candidate blocked")
      }
      setBlockOpen(false)
      loadCandidates()
    } catch (e: any) {
      toast.error(e.message || "Operation failed")
    } finally {
      setBlockLoading(false)
    }
  }

  // ── Export ─────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true)
    try {
      await exportCandidates({ search, status: statusFilter })
      toast.success(isAr ? "تم تصدير البيانات" : "Export completed")
    } catch (e: any) {
      toast.error(e.message || "Export failed")
    } finally {
      setExportLoading(false)
    }
  }

  // ── Import ─────────────────────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click()
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    setImportLoading(true)
    try {
      const result = await importCandidates(file)
      setImportResult(result)
      setImportResultOpen(true)
      loadCandidates()
    } catch (e: any) {
      toast.error(e.message || "Import failed")
    } finally {
      setImportLoading(false)
    }
  }

  // ── Stats ──────────────────────────────────────────────────
  const activeCount = candidates.filter(c => !c.isBlocked).length
  const blockedCount = candidates.filter(c => c.isBlocked).length

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAr ? "بيانات المرشحين" : "Candidates Data"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إدارة وعرض جميع المرشحين المسجلين" : "Manage and view all registered candidates"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4 me-2" />
          {isAr ? "إضافة مرشح" : "Add Candidate"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "إجمالي المرشحين" : "Total Candidates"}</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "نشط" : "Active"}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <ShieldBan className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isAr ? "محظور" : "Blocked"}</p>
              <p className="text-2xl font-bold">{blockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">{isAr ? "قائمة المرشحين" : "Candidate List"}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="ps-9 w-64"
                  placeholder={isAr ? "بحث بالاسم، البريد، رقم القيد..." : "Search name, email, roll no..."}
                  value={searchDebounce}
                  onChange={(e) => setSearchDebounce(e.target.value)}
                />
              </div>
              {/* Status filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="Active">{isAr ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="Blocked">{isAr ? "محظور" : "Blocked"}</SelectItem>
                </SelectContent>
              </Select>
              {/* Actions */}
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
                {exportLoading ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Download className="h-4 w-4 me-1" />}
                {isAr ? "تصدير" : "Export"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadImportTemplate()}>
                <FileSpreadsheet className="h-4 w-4 me-1" />
                {isAr ? "القالب" : "Template"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importLoading}>
                {importLoading ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Upload className="h-4 w-4 me-1" />}
                {isAr ? "استيراد" : "Import"}
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelected} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">{isAr ? "لا يوجد مرشحون" : "No candidates found"}</p>
              <p className="text-sm">{isAr ? "ابدأ بإضافة مرشح جديد" : "Start by adding a new candidate"}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "الاسم الكامل" : "Full Name"}</TableHead>
                      <TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead>
                      <TableHead>{isAr ? "رقم القيد" : "Roll No"}</TableHead>
                      <TableHead>{isAr ? "الجوال" : "Mobile"}</TableHead>
                      <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isAr ? "تاريخ الإنشاء" : "Created"}</TableHead>
                      <TableHead>{isAr ? "أنشأ بواسطة" : "Created By"}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div>{isAr ? (c.fullNameAr || c.fullName) : c.fullName}</div>
                          {c.fullNameAr && !isAr && (
                            <div className="text-xs text-muted-foreground" dir="rtl">{c.fullNameAr}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{c.email}</TableCell>
                        <TableCell className="font-mono text-sm">{c.rollNo || "—"}</TableCell>
                        <TableCell className="text-sm">{c.mobile || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={c.isBlocked ? "destructive" : "default"} className={!c.isBlocked ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                            {c.isBlocked
                              ? (isAr ? "محظور" : "Blocked")
                              : (isAr ? "نشط" : "Active")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.createdDate).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.createdByName || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Pencil className="h-4 w-4 me-2" />
                                {isAr ? "تعديل" : "Edit"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setBlockTarget(c); setBlockOpen(true) }}>
                                {c.isBlocked
                                  ? <><ShieldCheck className="h-4 w-4 me-2" />{isAr ? "إلغاء الحظر" : "Unblock"}</>
                                  : <><ShieldBan className="h-4 w-4 me-2" />{isAr ? "حظر" : "Block"}</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => { setDeleteTarget(c); setDeleteOpen(true) }}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {isAr ? "حذف" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {isAr
                      ? `عرض ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} من ${totalCount}`
                      : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Create/Edit Dialog ────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? (isAr ? "إضافة مرشح جديد" : "Add New Candidate")
                : (isAr ? "تعديل المرشح" : "Edit Candidate")}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? (isAr ? "أدخل بيانات المرشح الجديد" : "Enter the new candidate details")
                : (isAr ? "عدّل بيانات المرشح" : "Update the candidate details")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>{isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (English)"} *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData(d => ({ ...d, fullName: e.target.value }))}
                placeholder={isAr ? "مثال: John Doe" : "e.g. John Doe"}
              />
              {formErrors.fullName && <p className="text-xs text-destructive">{formErrors.fullName}</p>}
            </div>
            <div className="grid gap-2">
              <Label>{isAr ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}</Label>
              <Input
                dir="rtl"
                value={formData.fullNameAr}
                onChange={(e) => setFormData(d => ({ ...d, fullNameAr: e.target.value }))}
                placeholder={isAr ? "مثال: جون دو" : "e.g. جون دو"}
              />
            </div>
            <div className="grid gap-2">
              <Label>{isAr ? "البريد الإلكتروني" : "Email"} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                placeholder="name@example.com"
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label>
                {isAr ? "كلمة المرور" : "Password"}
                {formMode === "create" ? " *" : ` (${isAr ? "اختياري" : "optional"})`}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
                placeholder={formMode === "edit" ? (isAr ? "اتركه فارغاً للإبقاء" : "Leave empty to keep current") : ""}
              />
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{isAr ? "رقم القيد" : "Roll No"} *</Label>
                <Input
                  value={formData.rollNo}
                  onChange={(e) => setFormData(d => ({ ...d, rollNo: e.target.value }))}
                  placeholder="ROLL-001"
                />
                {formErrors.rollNo && <p className="text-xs text-destructive">{formErrors.rollNo}</p>}
              </div>
              <div className="grid gap-2">
                <Label>{isAr ? "الجوال" : "Mobile"}</Label>
                <Input
                  value={formData.mobile}
                  onChange={(e) => setFormData(d => ({ ...d, mobile: e.target.value }))}
                  placeholder="+966500000000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleFormSubmit} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {formMode === "create"
                ? (isAr ? "إنشاء" : "Create")
                : (isAr ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Alert ──────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف المرشح" : "Delete Candidate"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.fullName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget?.fullName}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Block/Unblock Alert ───────────────────────────── */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockTarget?.isBlocked
                ? (isAr ? "إلغاء حظر المرشح" : "Unblock Candidate")
                : (isAr ? "حظر المرشح" : "Block Candidate")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget?.isBlocked
                ? (isAr
                  ? `هل تريد إلغاء حظر "${blockTarget?.fullName}"؟ سيتمكن من تسجيل الدخول والتقدم للاختبارات.`
                  : `Unblock "${blockTarget?.fullName}"? They will be able to login and take exams.`)
                : (isAr
                  ? `هل تريد حظر "${blockTarget?.fullName}"؟ لن يتمكن من تسجيل الدخول أو التقدم للاختبارات.`
                  : `Block "${blockTarget?.fullName}"? They will be unable to login or take exams.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockLoading}>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} disabled={blockLoading}>
              {blockLoading && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {blockTarget?.isBlocked
                ? (isAr ? "إلغاء الحظر" : "Unblock")
                : (isAr ? "حظر" : "Block")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Import Results Dialog ─────────────────────────── */}
      <Dialog open={importResultOpen} onOpenChange={setImportResultOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? "نتائج الاستيراد" : "Import Results"}</DialogTitle>
            <DialogDescription>
              {importResult && (
                isAr
                  ? `تمت معالجة ${importResult.totalRows} صف: ${importResult.insertedCount} تم إدخالهم، ${importResult.skippedCount} تم تخطيهم.`
                  : `Processed ${importResult.totalRows} rows: ${importResult.insertedCount} inserted, ${importResult.skippedCount} skipped.`
              )}
            </DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex gap-3">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {isAr ? "تم الإدخال" : "Inserted"}: {importResult.insertedCount}
                </Badge>
                {importResult.skippedCount > 0 && (
                  <Badge variant="destructive">
                    {isAr ? "تم التخطي" : "Skipped"}: {importResult.skippedCount}
                  </Badge>
                )}
              </div>

              {/* Created accounts */}
              {importResult.createdAccounts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{isAr ? "الحسابات المنشأة" : "Created Accounts"}</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isAr ? "صف" : "Row"}</TableHead>
                          <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                          <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                          <TableHead>{isAr ? "رقم القيد" : "Roll No"}</TableHead>
                          <TableHead>{isAr ? "كلمة المرور المؤقتة" : "Temp Password"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.createdAccounts.map((a) => (
                          <TableRow key={a.row}>
                            <TableCell>{a.row}</TableCell>
                            <TableCell>{a.fullName}</TableCell>
                            <TableCell>{a.email}</TableCell>
                            <TableCell className="font-mono">{a.rollNo}</TableCell>
                            <TableCell className="font-mono text-xs">{a.temporaryPassword}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-destructive">{isAr ? "أخطاء" : "Errors"}</h4>
                  <div className="overflow-x-auto border border-destructive/30 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isAr ? "صف" : "Row"}</TableHead>
                          <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                          <TableHead>{isAr ? "الأسباب" : "Reasons"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((err) => (
                          <TableRow key={err.row}>
                            <TableCell>{err.row}</TableCell>
                            <TableCell>{err.email || "—"}</TableCell>
                            <TableCell className="text-sm text-destructive">
                              {err.reasons.join("; ")}
                            </TableCell>
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
            <Button onClick={() => setImportResultOpen(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
