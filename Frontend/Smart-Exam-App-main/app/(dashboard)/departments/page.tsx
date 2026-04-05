"use client"

import { useState, useEffect, Suspense } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building2, Loader2, Power, PowerOff, Users, ChevronLeft, ChevronRight } from "lucide-react"
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  activateDepartment,
  deactivateDepartment,
  type DepartmentListItem,
} from "@/lib/api/departments"

function DepartmentsContent() {
  const { language } = useI18n()

  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingDepartment, setEditingDepartment] = useState<DepartmentListItem | null>(null)
  const [formData, setFormData] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    code: "",
    isActive: true,
  })
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<DepartmentListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadDepartments()
  }, [currentPage, pageSize, searchQuery, showInactive])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const result = await getDepartments({
        includeInactive: showInactive,
        search: searchQuery || undefined,
        pageNumber: currentPage,
        pageSize,
      })
      setDepartments(result.items || [])
      setTotalCount(result.totalCount || 0)
      setTotalPages(result.totalPages || 0)
    } catch (error) {
      toast.error(language === "ar" ? "فشل تحميل الأقسام" : "Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  const handleShowInactiveChange = (checked: boolean) => {
    setShowInactive(checked)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    setDialogMode("create")
    setEditingDepartment(null)
    setFormData({ nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", code: "", isActive: true })
    setDialogOpen(true)
  }

  const handleEdit = (department: DepartmentListItem) => {
    setDialogMode("edit")
    setEditingDepartment(department)
    setFormData({
      nameEn: department.nameEn,
      nameAr: department.nameAr,
      descriptionEn: "",
      descriptionAr: "",
      code: department.code || "",
      isActive: department.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      toast.error(language === "ar" ? "الاسم بالعربي والإنجليزي مطلوب" : "Both English and Arabic names are required")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "create") {
        await createDepartment({
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          descriptionEn: formData.descriptionEn || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          code: formData.code || undefined,
          isActive: formData.isActive,
        })
        toast.success(language === "ar" ? "تم إنشاء القسم بنجاح" : "Department created successfully")
      } else if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          nameEn: formData.nameEn,
          nameAr: formData.nameAr,
          descriptionEn: formData.descriptionEn || undefined,
          descriptionAr: formData.descriptionAr || undefined,
          code: formData.code || undefined,
          isActive: formData.isActive,
        })
        toast.success(language === "ar" ? "تم تحديث القسم بنجاح" : "Department updated successfully")
      }
      setDialogOpen(false)
          loadDepartments()
    } catch (error: any) {
      toast.error(error?.message || (language === "ar" ? "حدث خطأ" : "An error occurred"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!departmentToDelete) return

    setDeleting(true)
    try {
      await deleteDepartment(departmentToDelete.id)
      toast.success(language === "ar" ? "تم حذف القسم بنجاح" : "Department deleted successfully")
      setDeleteDialogOpen(false)
      setDepartmentToDelete(null)
      loadDepartments()
    } catch (error: any) {
      toast.error(error?.message || (language === "ar" ? "فشل حذف القسم" : "Failed to delete department"))
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleActive = async (department: DepartmentListItem) => {
    try {
      if (department.isActive) {
        await deactivateDepartment(department.id)
        toast.success(language === "ar" ? "تم تعطيل القسم" : "Department deactivated")
      } else {
        await activateDepartment(department.id)
        toast.success(language === "ar" ? "تم تفعيل القسم" : "Department activated")
      }
      loadDepartments()
    } catch (error: any) {
      toast.error(error?.message || (language === "ar" ? "حدث خطأ" : "An error occurred"))
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">{language === "ar" ? "الأقسام" : "Departments"}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة أقسام المنظمة" : "Manage organization departments"}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "بحث في الأقسام..." : "Search departments..."}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="ps-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={showInactive} onCheckedChange={handleShowInactiveChange} id="show-inactive" />
              <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                {language === "ar" ? "عرض المعطلة" : "Show Inactive"}
              </Label>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="me-2 h-4 w-4" />
              {language === "ar" ? "إضافة قسم" : "Add Department"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={searchQuery ? (language === "ar" ? "لا توجد نتائج" : "No departments found") : (language === "ar" ? "لا توجد أقسام" : "No departments yet")}
            description={searchQuery ? (language === "ar" ? "حاول تعديل البحث" : "Try adjusting your search") : (language === "ar" ? "أنشئ أول قسم" : "Create your first department")}
            action={
              !searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="me-2 h-4 w-4" />
                  {language === "ar" ? "إضافة قسم" : "Add Department"}
                </Button>
              )
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</TableHead>
                    <TableHead>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</TableHead>
                    <TableHead>{language === "ar" ? "الرمز" : "Code"}</TableHead>
                    <TableHead>{language === "ar" ? "المستخدمون" : "Users"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((department, index) => (
                    <TableRow key={department.id}>
                      <TableCell className="text-muted-foreground">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{department.nameEn}</TableCell>
                      <TableCell dir="rtl">{department.nameAr}</TableCell>
                      <TableCell className="text-muted-foreground">{department.code || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{department.userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={department.isActive ? "default" : "secondary"}>
                          {department.isActive
                            ? (language === "ar" ? "مفعّل" : "Active")
                            : (language === "ar" ? "معطّل" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(department)}>
                              <Edit className="me-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(department)}>
                              {department.isActive ? (
                                <>
                                  <PowerOff className="me-2 h-4 w-4" />
                                  {language === "ar" ? "تعطيل" : "Deactivate"}
                                </>
                              ) : (
                                <>
                                  <Power className="me-2 h-4 w-4" />
                                  {language === "ar" ? "تفعيل" : "Activate"}
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setDepartmentToDelete(department)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? `عرض ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} من ${totalCount}`
                        : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} of ${totalCount}`}
                    </p>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? (language === "ar" ? "إضافة قسم جديد" : "Add New Department")
                : (language === "ar" ? "تعديل القسم" : "Edit Department")}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "أدخل بيانات القسم باللغتين العربية والإنجليزية"
                : "Enter department details in both English and Arabic"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="e.g. Information Technology"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"} *</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="مثال: تقنية المعلومات"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">{language === "ar" ? "الرمز" : "Code"}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. IT"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="وصف اختياري"
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>
            {dialogMode === "edit" && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  id="isActive"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {language === "ar" ? "مفعّل" : "Active"}
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {dialogMode === "create"
                ? (language === "ar" ? "إنشاء" : "Create")
                : (language === "ar" ? "حفظ" : "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "ar" ? "حذف القسم؟" : "Delete Department?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? `هل أنت متأكد من حذف "${departmentToDelete?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${departmentToDelete?.nameEn}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function DepartmentsPage() {
  return (
    <Suspense fallback={null}>
      <DepartmentsContent />
    </Suspense>
  )
}
