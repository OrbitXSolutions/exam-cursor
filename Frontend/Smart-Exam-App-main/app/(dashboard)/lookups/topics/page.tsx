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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Hash, Loader2, Filter } from "lucide-react"
import {
  getQuestionTopics,
  createQuestionTopic,
  updateQuestionTopic,
  deleteQuestionTopic,
  getQuestionSubjects,
  type QuestionTopic,
  type QuestionSubject,
} from "@/lib/api/lookups"

function TopicsContent() {
  const { language } = useI18n()

  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null)
  const [formData, setFormData] = useState({ nameEn: "", nameAr: "", subjectId: 0 })
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [topicToDelete, setTopicToDelete] = useState<QuestionTopic | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Load subjects once for dropdown
  useEffect(() => {
    getQuestionSubjects({ pageSize: 1000 })
      .then((res) => setSubjects(res.items || []))
      .catch(() => {})
  }, [])

  // Load topics with server-side pagination
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const subjectId = filterSubjectId !== "all" ? Number(filterSubjectId) : undefined
    getQuestionTopics({
      pageNumber: currentPage,
      pageSize,
      search: searchQuery.trim() || undefined,
      subjectId,
    })
      .then((result) => {
        if (!cancelled) {
          setTopics(result.items || [])
          setTotalCount(result.totalCount || 0)
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(language === "ar" ? "فشل في تحميل المواضيع" : "Failed to load topics")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [currentPage, pageSize, searchQuery, filterSubjectId, refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTopics = () => setRefreshKey((k) => k + 1)

  const handleSearchChange = (value: string) => { setSearchQuery(value); setCurrentPage(1) }
  const handleFilterSubjectChange = (value: string) => { setFilterSubjectId(value); setCurrentPage(1) }
  const handlePageSizeChange = (value: string) => { setPageSize(Number(value)); setCurrentPage(1) }

  const handleCreate = () => {
    setDialogMode("create")
    setEditingTopic(null)
    setFormData({ nameEn: "", nameAr: "", subjectId: subjects[0]?.id || 0 })
    setDialogOpen(true)
  }

  const handleEdit = (topic: QuestionTopic) => {
    setDialogMode("edit")
    setEditingTopic(topic)
    setFormData({ nameEn: topic.nameEn, nameAr: topic.nameAr, subjectId: topic.subjectId })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      toast.error(language === "ar" ? "الاسمان بالإنجليزية والعربية مطلوبان" : "Both English and Arabic names are required")
      return
    }
    if (!formData.subjectId) {
      toast.error(language === "ar" ? "المادة مطلوبة" : "Subject is required")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "create") {
        await createQuestionTopic(formData)
        toast.success(language === "ar" ? "تم إنشاء الموضوع بنجاح" : "Topic created successfully")
        loadTopics()
        setDialogOpen(false)
      } else if (editingTopic) {
        await updateQuestionTopic(editingTopic.id, formData)
        toast.success(language === "ar" ? "تم تحديث الموضوع بنجاح" : "Topic updated successfully")
        loadTopics()
        setDialogOpen(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (language === "ar" ? "حدث خطأ" : "An error occurred")
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (topic: QuestionTopic) => {
    setTopicToDelete(topic)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return

    setDeleting(true)
    try {
      await deleteQuestionTopic(topicToDelete.id)
      toast.success(language === "ar" ? "تم حذف الموضوع بنجاح" : "Topic deleted successfully")
      loadTopics()
    } catch (error) {
      const message = error instanceof Error ? error.message : (language === "ar" ? "حدث خطأ" : "An error occurred")
      toast.error(message)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setTopicToDelete(null)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{language === "ar" ? "المواضيع" : "Topics"}</h1>
            <p className="text-muted-foreground">
              {language === "ar" ? "إدارة مواضيع الأسئلة ضمن كل مادة" : "Manage question topics within each subject"}
            </p>
          </div>
          <Button onClick={handleCreate} disabled={subjects.length === 0}>
            <Plus className="me-2 h-4 w-4" />
            {language === "ar" ? "إضافة موضوع" : "Add Topic"}
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", language === "ar" ? "right-3" : "left-3")} />
                <Input
                  placeholder={language === "ar" ? "البحث عن موضوع..." : "Search topics..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={language === "ar" ? "pr-10" : "pl-10"}
                />
              </div>
              <div className="w-[200px]">
                <Select value={filterSubjectId} onValueChange={handleFilterSubjectChange}>
                  <SelectTrigger>
                    <Filter className="me-2 h-4 w-4" />
                    <SelectValue placeholder={language === "ar" ? "جميع المواد" : "All Subjects"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === "ar" ? "جميع المواد" : "All Subjects"}</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {language === "ar" ? subject.nameAr : subject.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState
                icon={Hash}
                title={language === "ar" ? "لا توجد مواد" : "No subjects found"}
                description={
                  language === "ar"
                    ? "يجب إنشاء مادة أولاً قبل إضافة المواضيع"
                    : "You need to create a subject first before adding topics"
                }
              />
            ) : topics.length === 0 ? (
              <EmptyState
                icon={Hash}
                title={language === "ar" ? "لا توجد مواضيع" : "No topics found"}
                description={
                  searchQuery
                    ? language === "ar"
                      ? "لم يتم العثور على مواضيع تطابق بحثك"
                      : "No topics match your search"
                    : language === "ar"
                      ? "ابدأ بإنشاء أول موضوع"
                      : "Get started by creating your first topic"
                }
                action={
                  !searchQuery
                    ? {
                        label: language === "ar" ? "إضافة موضوع" : "Add Topic",
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
                    <TableHead>{language === "ar" ? "المادة" : "Subject"}</TableHead>
                    <TableHead className="w-[100px]">{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell className="font-medium">{topic.nameEn}</TableCell>
                      <TableCell>{topic.nameAr}</TableCell>
                      <TableCell>{language === "ar" ? topic.subjectNameAr : topic.subjectNameEn}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(topic)}>
                              <Edit className="me-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(topic)}
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
                    ? "إضافة موضوع جديد"
                    : "Add New Topic"
                  : language === "ar"
                    ? "تعديل الموضوع"
                    : "Edit Topic"}
              </DialogTitle>
              <DialogDescription>
                {language === "ar"
                  ? "أدخل اسم الموضوع بالإنجليزية والعربية واختر المادة"
                  : "Enter the topic name in English and Arabic and select the subject"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subjectId">{language === "ar" ? "المادة" : "Subject"} *</Label>
                <Select
                  value={formData.subjectId ? String(formData.subjectId) : ""}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ar" ? "اختر المادة" : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {language === "ar" ? subject.nameAr : subject.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder={language === "ar" ? "أدخل الاسم بالإنجليزية" : "Enter name in English"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"} *</Label>
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
              <AlertDialogTitle>{language === "ar" ? "حذف الموضوع" : "Delete Topic"}</AlertDialogTitle>
              <AlertDialogDescription>
                {language === "ar"
                  ? `هل أنت متأكد من حذف "${topicToDelete?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete "${topicToDelete?.nameEn}"? This action cannot be undone.`}
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

export default function TopicsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <TopicsContent />
    </Suspense>
  )
}
