"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
  FolderTree, Plus, Search, MoreHorizontal, Pencil, Trash2,
  ToggleLeft, ToggleRight, Eye, Download, Loader2,
  ChevronLeft, ChevronRight, Users,
} from "lucide-react"
import {
  getBatches, createBatch, updateBatch, deleteBatch, toggleBatchStatus,
  exportBatchCandidates, type BatchDto,
} from "@/lib/api/batch"

export default function BatchPage() {
  const { language } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const isAr = language === "ar"

  // ── Data state ─────────────────────────────────────────────
  const [batches, setBatches] = useState<BatchDto[]>([])
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
  const [selectedBatch, setSelectedBatch] = useState<BatchDto | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // ── Delete state ───────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BatchDto | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Export state ───────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState<number | null>(null)

  // ── Load data ──────────────────────────────────────────────
  const loadBatches = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBatches({ search, status: statusFilter, page, pageSize })
      setBatches(data.items)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل في تحميل الدفعات" : "Failed to load batches"))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, pageSize, isAr])

  useEffect(() => { loadBatches() }, [loadBatches])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300)
    return () => clearTimeout(t)
  }, [search, statusFilter])

  // ── Handlers ───────────────────────────────────────────────
  const openCreate = () => {
    setFormMode("create")
    setSelectedBatch(null)
    setFormData({ name: "", description: "", isActive: true })
    setFormErrors({})
    setFormOpen(true)
  }

  const openEdit = (batch: BatchDto) => {
    setFormMode("edit")
    setSelectedBatch(batch)
    setFormData({ name: batch.name, description: batch.description ?? "", isActive: batch.isActive })
    setFormErrors({})
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = isAr ? "الاسم مطلوب" : "Name is required"
    if (Object.keys(errors).length) { setFormErrors(errors); return }
    setFormLoading(true)
    try {
      if (formMode === "create") {
        await createBatch({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        })
        toast.success(isAr ? "تم إنشاء الدفعة بنجاح" : "Batch created successfully")
      } else if (selectedBatch) {
        await updateBatch(selectedBatch.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        })
        toast.success(isAr ? "تم تحديث الدفعة بنجاح" : "Batch updated successfully")
      }
      setFormOpen(false)
      loadBatches()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت العملية" : "Operation failed"))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteBatch(deleteTarget.id)
      toast.success(isAr ? "تم حذف الدفعة بنجاح" : "Batch deleted successfully")
      setDeleteOpen(false)
      setDeleteTarget(null)
      loadBatches()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل الحذف" : "Delete failed"))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleStatus = async (batch: BatchDto) => {
    try {
      await toggleBatchStatus(batch.id)
      toast.success(
        batch.isActive
          ? (isAr ? "تم تعطيل الدفعة" : "Batch deactivated")
          : (isAr ? "تم تفعيل الدفعة" : "Batch activated"),
      )
      loadBatches()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل تغيير الحالة" : "Status change failed"))
    }
  }

  const handleExport = async (batchId: number) => {
    setExportLoading(batchId)
    try {
      await exportBatchCandidates(batchId)
      toast.success(isAr ? "تم التصدير بنجاح" : "Export successful")
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل التصدير" : "Export failed"))
    } finally {
      setExportLoading(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-primary" />
            {isAr ? "إدارة الدفعات" : "Batch Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "إنشاء وإدارة دفعات المرشحين" : "Create and manage candidate batches"}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isAr ? "إنشاء دفعة" : "Create Batch"}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم أو الوصف..." : "Search by name or description..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isAr ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="Active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="Inactive">{isAr ? "غير نشط" : "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span>{isAr ? "الإجمالي" : "Total"}: <strong>{totalCount}</strong></span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <FolderTree className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-medium">{isAr ? "لا توجد دفعات" : "No batches found"}</p>
              <p className="text-sm">{isAr ? "أنشئ دفعة جديدة للبدء" : "Create a new batch to get started"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                  <TableHead className="text-center">{isAr ? "المرشحون" : "Candidates"}</TableHead>
                  <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "تاريخ الإنشاء" : "Created"}</TableHead>
                  <TableHead className="text-right">{isAr ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch, idx) => (
                  <TableRow key={batch.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/candidates/batch/${batch.id}`)}>
                    <TableCell className="font-mono text-muted-foreground">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {batch.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {batch.candidateCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={batch.isActive ? "default" : "outline"}>
                        {batch.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(batch.createdDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/candidates/batch/${batch.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {isAr ? "عرض التفاصيل" : "View Details"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(batch)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {isAr ? "تعديل" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(batch)}>
                            {batch.isActive
                              ? <><ToggleLeft className="h-4 w-4 mr-2" />{isAr ? "تعطيل" : "Deactivate"}</>
                              : <><ToggleRight className="h-4 w-4 mr-2" />{isAr ? "تفعيل" : "Activate"}</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExport(batch.id)}
                            disabled={exportLoading === batch.id}
                          >
                            {exportLoading === batch.id
                              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              : <Download className="h-4 w-4 mr-2" />}
                            {isAr ? "تصدير الأعضاء" : "Export Members"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setDeleteTarget(batch); setDeleteOpen(true) }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isAr ? "حذف" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? (isAr ? "إنشاء دفعة جديدة" : "Create New Batch")
                : (isAr ? "تعديل الدفعة" : "Edit Batch")}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? (isAr ? "أدخل بيانات الدفعة الجديدة" : "Enter the new batch details")
                : (isAr ? "عدّل بيانات الدفعة" : "Modify the batch details")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{isAr ? "اسم الدفعة" : "Batch Name"} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors({}) }}
                placeholder={isAr ? "مثال: دفعة 2025" : "e.g. Batch 2025"}
              />
              {formErrors.name && <p className="text-destructive text-sm mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label>{isAr ? "الوصف" : "Description"}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isAr ? "وصف اختياري" : "Optional description"}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label>{isAr ? "نشط" : "Active"}</Label>
              <Button
                type="button"
                variant={formData.isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              >
                {formData.isActive ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No")}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSubmit} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formMode === "create" ? (isAr ? "إنشاء" : "Create") : (isAr ? "تحديث" : "Update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف الدفعة" : "Delete Batch"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد أنك تريد حذف الدفعة "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete the batch "${deleteTarget?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
