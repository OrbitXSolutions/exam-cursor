"use client"

import { useState, useEffect, Suspense } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
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
import { toast } from "sonner"
import { Plus, Search, MoreHorizontal, Edit, Trash2, ListTree, Loader2 } from "lucide-react"
import {
  getQuestionTypes,
  createQuestionType,
  updateQuestionType,
  deleteQuestionType,
  type QuestionType,
} from "@/lib/api/lookups"

function QuestionTypesContent() {
  const { t, language } = useI18n()

  const [types, setTypes] = useState<QuestionType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editingType, setEditingType] = useState<QuestionType | null>(null)
  const [formData, setFormData] = useState({ nameEn: "", nameAr: "" })
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<QuestionType | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadTypes()
  }, [])

  const loadTypes = async () => {
    setLoading(true)
    try {
      const result = await getQuestionTypes({ pageSize: 100 })
      setTypes(result.items || [])
    } catch (error) {
      toast.error("Failed to load question types")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setDialogMode("create")
    setEditingType(null)
    setFormData({ nameEn: "", nameAr: "" })
    setDialogOpen(true)
  }

  const handleEdit = (type: QuestionType) => {
    setDialogMode("edit")
    setEditingType(type)
    setFormData({ nameEn: type.nameEn, nameAr: type.nameAr })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
      toast.error("Both English and Arabic names are required")
      return
    }

    setSaving(true)
    try {
      if (dialogMode === "create") {
        const result = await createQuestionType(formData)
        if (result.success) {
          toast.success(result.message || "Question type created successfully")
          await loadTypes()
        } else {
          toast.error(result.message || "Failed to create question type")
        }
      } else if (editingType) {
        const result = await updateQuestionType(editingType.id, formData)
        if (result.success) {
          toast.success(result.message || "Question type updated successfully")
          await loadTypes()
        } else {
          toast.error(result.message || "Failed to update question type")
        }
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!typeToDelete) return

    setDeleting(true)
    try {
      const result = await deleteQuestionType(typeToDelete.id)
      if (result.success) {
        toast.success(result.message || "Question type deleted successfully")
        await loadTypes()
      } else {
        toast.error(result.message || result.errors?.[0] || "Failed to delete question type")
      }
      setDeleteDialogOpen(false)
      setTypeToDelete(null)
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setDeleting(false)
    }
  }

  const filteredTypes = types.filter((type) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return type.nameEn.toLowerCase().includes(search) || type.nameAr.includes(searchQuery)
  })

  return (
    <div className="flex flex-col">
      <Header
        title={language === "ar" ? "أنواع الأسئلة" : "Question Types"}
        subtitle={language === "ar" ? "إدارة أنواع الأسئلة" : "Manage question types"}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "بحث في الأنواع..." : "Search types..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {language === "ar" ? "إضافة نوع" : "Add Type"}
          </Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTypes.length === 0 ? (
          <EmptyState
            icon={ListTree}
            title={searchQuery ? "No types found" : "No question types yet"}
            description={searchQuery ? "Try adjusting your search" : "Create your first question type"}
            action={
              !searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {language === "ar" ? "إضافة نوع" : "Add Type"}
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
                    <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created Date"}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.map((type, index) => (
                    <TableRow key={type.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{type.nameEn}</TableCell>
                      <TableCell dir="rtl">{type.nameAr}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {type.createdDate ? new Date(type.createdDate).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setTypeToDelete(type)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? language === "ar"
                  ? "إضافة نوع جديد"
                  : "Add New Type"
                : language === "ar"
                  ? "تعديل النوع"
                  : "Edit Type"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? "أدخل اسم النوع باللغتين العربية والإنجليزية"
                : "Enter the type name in both English and Arabic"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. Multiple Choice"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"} *</Label>
              <Input
                id="nameAr"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                placeholder="مثال: اختيار من متعدد"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === "create" ? (language === "ar" ? "إنشاء" : "Create") : language === "ar" ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "ar" ? "حذف النوع؟" : "Delete Type?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? `هل أنت متأكد من حذف "${typeToDelete?.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${typeToDelete?.nameEn}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function QuestionTypesPage() {
  return (
    <Suspense fallback={null}>
      <QuestionTypesContent />
    </Suspense>
  )
}
