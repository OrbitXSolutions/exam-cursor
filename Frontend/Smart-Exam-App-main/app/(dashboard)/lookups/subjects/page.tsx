"use client"

import { useState, useEffect, Suspense } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, BookOpen, Loader2 } from "lucide-react"
import {
  getQuestionSubjects,
  createQuestionSubject,
  updateQuestionSubject,
  deleteQuestionSubject,
  type QuestionSubject,
} from "@/lib/api/lookups"

function SubjectsContent() {
  const { t, language } = useI18n()

  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingSubject, setEditingSubject] = useState<QuestionSubject | null>(null)
  const [formData, setFormData] = useState({ nameEn: "", nameAr: "" })
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<QuestionSubject | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getQuestionSubjects({
      pageNumber: currentPage,
      pageSize,
      search: searchQuery.trim() || undefined,
    })
      .then((result) => {
        if (!cancelled) {
          setSubjects(result.items || [])
          setTotalCount(result.totalCount || 0)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(language === "ar" ? "فشل في تحميل المواد" : "Failed to load subjects")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentPage, pageSize, searchQuery, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSubjects = () => setRefreshKey((k) => k + 1)

  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1) }
  const handlePageSizeChange = (value: string) => { setPageSize(Number(value)); setCurrentPage(1) }

  const handleCreate = () => {
    setDialogMode("create")
    setEditingSubject(null)
    setFormData({ nameEn: "", nameAr: "" })
    setDialogOpen(true)
  }

  const handleEdit = (subject: QuestionSubject) => {
    setDialogMode("edit")
    setEditingSubject(subject)
    setFormData({ nameEn: subject.nameEn, nameAr: subject.nameAr })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      toast.error(language === "ar" ? "الاسمان بالإنجليزية والعربية مطلوبان" : "Both English and Arabic names are required")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "create") {
        await createQuestionSubject(formData)
        toast.success(language === "ar" ? "تم إنشاء المادة بنجاح" : "Subject created successfully")
        loadSubjects()
        setDialogOpen(false)
      } else if (editingSubject) {
        await updateQuestionSubject(editingSubject.id, formData)
        toast.success(language === "ar" ? "تم تحديث المادة بنجاح" : "Subject updated successfully")
        loadSubjects()
        setDialogOpen(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (language === "ar" ? "حدث خطأ" : "An error occurred")
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (subject: QuestionSubject) => {
    setSubjectToDelete(subject)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return

    setDeleting(true)
    try {
      await deleteQuestionSubject(subjectToDelete.id)
      toast.success(language === "ar" ? "تم حذف المادة بنجاح" : "Subject deleted successfully")
      loadSubjects()
    } catch (error) {
      const message = error instanceof Error ? error.message : (language === "ar" ? "حدث خطأ" : "An error occurred")
      toast.error(message)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{language === "ar" ? "المواد" : "Subjects"}</h1>
            <p className="text-muted-foreground">
              {language === "ar" ? "إدارة المواد الدراسية للأسئلة" : "Manage subjects for questions"}
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="me-2 h-4 w-4" />
            {language === "ar" ? "إضافة مادة" : "Add Subject"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", language === "ar" ? "right-3" : "left-3")} />
                <Input
                  placeholder={language === "ar" ? "البحث عن مادة..." : "Search subjects..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={language === "ar" ? "pr-10" : "pl-10"}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={language === "ar" ? "لا توجد مواد" : "No subjects found"}
                description={
                  searchQuery
                    ? language === "ar"
                      ? "لم يتم العثور على مواد تطابق بحثك"
                      : "No subjects match your search"
                    : language === "ar"
                      ? "ابدأ بإنشاء أول مادة"
                      : "Get started by creating your first subject"
                }
                action={
                  !searchQuery
                    ? {
                        label: language === "ar" ? "إضافة مادة" : "Add Subject",
                        onClick: handleCreate,
                      }
                    : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</TableHead>
                    <TableHead>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</TableHead>
                    <TableHead>{language === "ar" ? "عدد المواضيع" : "Topics"}</TableHead>
                    <TableHead className="w-[100px]">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.nameEn}</TableCell>
                      <TableCell>{subject.nameAr}</TableCell>
                      <TableCell>{subject.topicsCount ?? 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(subject)}>
                              <Edit className="me-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(subject)}
                              className="text-destructive focus:text-destructive"
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
            )}
          </CardContent>
          {/* Pagination */}
          {totalCount > 0 && (
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{language === "ar" ? "عرض" : "Show"}</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>{language === "ar" ? "سجل لكل صفحة" : "records per page"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground me-2">
                  {language === "ar"
                    ? `صفحة ${currentPage} من ${totalPages}`
                    : `Page ${currentPage} of ${totalPages}`}
                </span>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>›</Button>
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>»</Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogMode === "create"
                  ? language === "ar"
                    ? "إضافة مادة جديدة"
                    : "Add New Subject"
                  : language === "ar"
                    ? "تعديل المادة"
                    : "Edit Subject"}
              </DialogTitle>
              <DialogDescription>
                {language === "ar"
                  ? "أدخل اسم المادة بالإنجليزية والعربية"
                  : "Enter the subject name in English and Arabic"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nameEn">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder={language === "ar" ? "أدخل الاسم بالإنجليزية" : "Enter name in English"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder={language === "ar" ? "أدخل الاسم بالعربية" : "Enter name in Arabic"}
                  dir="rtl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {dialogMode === "create"
                  ? language === "ar"
                    ? "إنشاء"
                    : "Create"
                  : language === "ar"
                    ? "حفظ"
                    : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{language === "ar" ? "حذف المادة" : "Delete Subject"}</AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ar"
                  ? `هل أنت متأكد من حذف "${subjectToDelete?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete "${subjectToDelete?.nameEn}"? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {language === "ar" ? "حذف" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}

export default function SubjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SubjectsContent />
    </Suspense>
  )
}
