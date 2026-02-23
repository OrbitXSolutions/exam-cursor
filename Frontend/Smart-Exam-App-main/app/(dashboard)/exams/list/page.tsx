"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import type { Exam } from "@/lib/types"
import { getExams, deleteExam, publishExam, unpublishExam } from "@/lib/api/exams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  Archive,
  FileText,
  Settings,
  Hammer,
  Copy,
  AlertCircle,
  PartyPopper,
} from "lucide-react"

function getExamTitle(exam: Exam, language: string): string {
  return (language === "ar" ? exam.titleAr : exam.titleEn) || exam.titleEn || "Untitled Exam"
}

function getExamStatus(exam: Exam): string {
  if (!exam.isActive) return "Archived"
  if (exam.isPublished) return "Published"
  return "Draft"
}

export default function ExamsListPage() {
  const { t, dir, language } = useI18n()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      setLoading(true)
      const response = await getExams()
      if (response?.items && Array.isArray(response.items)) {
        setExams(response.items)
      } else {
        setExams([])
      }
    } catch {
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish(exam: Exam) {
    try {
      setActionLoading(exam.id)
      await publishExam(exam.id)
      setPublishDialogOpen(true)
      fetchExams()
    } catch (error) {
      toast.error(t("exams.publishError") || "Failed to publish exam")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleArchive(exam: Exam) {
    try {
      setActionLoading(exam.id)
      await unpublishExam(exam.id)
      toast.success(t("exams.archiveSuccess") || "Exam archived successfully")
      fetchExams()
    } catch (error) {
      toast.error(t("exams.archiveError") || "Failed to archive exam")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    if (!examToDelete) return
    try {
      setActionLoading(examToDelete.id)
      await deleteExam(examToDelete.id)
      toast.success(t("exams.deleteSuccess") || "Exam deleted successfully")
      setDeleteDialogOpen(false)
      setExamToDelete(null)
      fetchExams()
    } catch (error: any) {
      setDeleteDialogOpen(false)
      setExamToDelete(null)
      const msg = error?.response?.data?.message || error?.message || "Failed to delete exam"
      setErrorMessage(msg)
      setErrorDialogOpen(true)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredExams = exams.filter((exam) => {
    const title = getExamTitle(exam, language) || ""
    const status = getExamStatus(exam)

    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {language === "ar" ? "قائمة الاختبارات" : "Exams List"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? "إدارة وتنظيم جميع الاختبارات" : "Manage and organize all exams"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/exams/create-from-template">
              <Copy className="h-4 w-4 me-2" />
              {language === "ar" ? "إنشاء من قالب" : "Create from Template"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/exams/setup">
              <Plus className="h-4 w-4 me-2" />
              {t("exams.create") || "Create Exam"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search") || "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("common.status") || "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all") || "All"}</SelectItem>
                <SelectItem value="Draft">{t("status.draft") || "Draft"}</SelectItem>
                <SelectItem value="Published">{t("status.published") || "Published"}</SelectItem>
                <SelectItem value="Archived">{t("status.archived") || "Archived"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExams.length === 0 ? (
            <div className="py-16 px-6">
              <div className="max-w-md mx-auto text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {language === "ar" ? "لا توجد اختبارات" : "No Exams Found"}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === "ar" 
                      ? "ابدأ بإنشاء اختبار جديد" 
                      : "Get started by creating a new exam"}
                  </p>
                </div>
                <Button asChild>
                  <Link href="/exams/setup">
                    <Plus className="h-4 w-4 me-2" />
                    {t("exams.create") || "Create Exam"}
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("exams.title") || "Title"}</TableHead>
                    <TableHead>{t("common.status") || "Status"}</TableHead>
                    <TableHead className="text-center">
                      {language === "ar" ? "الإعدادات" : "Configuration"}
                    </TableHead>
                    <TableHead className="text-center">
                      {language === "ar" ? "البناء" : "Builder"}
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam)
                    return (
                      <TableRow key={exam.id}>
                        {/* Exam Title - Links to config */}
                        <TableCell>
                          <Link
                            href={`/exams/setup/${exam.id}?tab=config`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {getExamTitle(exam, language)}
                          </Link>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>

                        {/* Configuration Button */}
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/exams/${exam.id}/configuration`}>
                              <Settings className="h-4 w-4 me-1" />
                              {language === "ar" ? "الإعدادات" : "Config"}
                            </Link>
                          </Button>
                        </TableCell>

                        {/* Builder Button */}
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/exams/setup/${exam.id}?tab=builder`}>
                              <Hammer className="h-4 w-4 me-1" />
                              {language === "ar" ? "البناء" : "Builder"}
                            </Link>
                          </Button>
                        </TableCell>

                        {/* Actions Menu */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                              {/* View */}
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/${exam.id}/overview`}>
                                  <Eye className="h-4 w-4 me-2" />
                                  {t("common.view") || "View"}
                                </Link>
                              </DropdownMenuItem>

                              {/* Edit */}
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/setup/${exam.id}?tab=config`}>
                                  <Pencil className="h-4 w-4 me-2" />
                                  {t("common.edit") || "Edit"}
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Publish (only if Draft) */}
                              {status === "Draft" && (
                                <DropdownMenuItem 
                                  onClick={() => handlePublish(exam)}
                                  disabled={actionLoading === exam.id}
                                >
                                  <Send className="h-4 w-4 me-2" />
                                  {t("exams.publish") || "Publish"}
                                </DropdownMenuItem>
                              )}

                              {/* Archive (only if Published) */}
                              {status === "Published" && (
                                <DropdownMenuItem 
                                  onClick={() => handleArchive(exam)}
                                  disabled={actionLoading === exam.id}
                                >
                                  <Archive className="h-4 w-4 me-2" />
                                  {t("exams.archive") || "Archive"}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Delete */}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setExamToDelete(exam)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {t("common.delete") || "Delete"}
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
          )}
        </CardContent>
      </Card>

      {/* How It Works Section - Always visible when exams exist */}
      {filteredExams.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("exams.howItWorks") || "How It Works"}</h3>
                <p className="text-sm text-muted-foreground">{t("exams.howItWorksDesc") || "Follow these steps to create and publish your exams"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">Configure Exam</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Set up title, timing, type, and security settings</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">Build Structure</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Add sections, topics, and select questions from the bank</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">Publish & Assign</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Review, publish, and assign candidates to the exam</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">Monitor & Grade</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Proctor live sessions, grade responses, and view results</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete") || "Confirm Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar" 
                ? `هل أنت متأكد من حذف "${examToDelete ? getExamTitle(examToDelete, language) : ""}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${examToDelete ? getExamTitle(examToDelete, language) : ""}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog - shown when delete is blocked */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {language === "ar" ? "لا يمكن الحذف" : "Cannot Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              {t("common.ok") || "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Celebration Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
              <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {language === "ar" ? "تم نشر الاختبار!" : "Exam Published!"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {language === "ar"
                ? "الاختبار متاح الآن للمرشحين لأدائه."
                : "The exam is now available for candidates to take."}
            </p>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setPublishDialogOpen(false)}
            >
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
