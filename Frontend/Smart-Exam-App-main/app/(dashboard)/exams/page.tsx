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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
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
  Clock,
  LayoutList,
  Shield,
} from "lucide-react"

function getExamTitle(exam: Exam, language: string): string {
  return exam.title || (language === "ar" ? exam.titleAr : exam.titleEn) || "Untitled Exam"
}

function getExamStatus(exam: Exam): string {
  if (exam.status) return exam.status
  if (!exam.isActive) return "Archived"
  if (exam.isPublished) return "Published"
  return "Draft"
}

export default function ExamsPage() {
  const { t, dir, language } = useI18n()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

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
      toast.success(t("exams.publishSuccess"))
      fetchExams()
    } catch (error) {
      toast.error(t("exams.publishError"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleArchive(exam: Exam) {
    try {
      setActionLoading(exam.id)
      await unpublishExam(exam.id)
      toast.success(t("exams.archiveSuccess"))
      fetchExams()
    } catch (error) {
      toast.error(t("exams.archiveError"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete() {
    if (!examToDelete) return
    try {
      setActionLoading(examToDelete.id)
      await deleteExam(examToDelete.id)
      toast.success(t("exams.deleteSuccess"))
      setDeleteDialogOpen(false)
      setExamToDelete(null)
      fetchExams()
    } catch (error) {
      toast.error(t("exams.deleteError"))
    } finally {
      setActionLoading(null)
    }
  }

  const filteredExams = exams.filter((exam) => {
    const title = getExamTitle(exam, language) || ""
    const code = exam.code || ""
    const status = getExamStatus(exam)

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) || code.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("exams.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/exams/create">
            <Plus className="h-4 w-4 me-2" />
            {t("exams.create")}
          </Link>
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="Draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="Published">{t("status.published")}</SelectItem>
                  <SelectItem value="Archived">{t("status.archived")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredExams.length === 0 ? (
            <div className="py-16 px-6">
              <div className="max-w-2xl mx-auto text-center space-y-8">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                
                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">{t("exams.noExams")}</h3>
                  <p className="text-muted-foreground">{t("exams.noExamsDesc")}</p>
                </div>

                {/* How It Works Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-3">1</div>
                    <h4 className="font-medium text-foreground mb-1">{t("exams.emptyStateStep1")}</h4>
                    <p className="text-sm text-muted-foreground">{t("exams.emptyStateStep1Desc")}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-3">2</div>
                    <h4 className="font-medium text-foreground mb-1">{t("exams.emptyStateStep2")}</h4>
                    <p className="text-sm text-muted-foreground">{t("exams.emptyStateStep2Desc")}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-3">3</div>
                    <h4 className="font-medium text-foreground mb-1">{t("exams.emptyStateStep3")}</h4>
                    <p className="text-sm text-muted-foreground">{t("exams.emptyStateStep3Desc")}</p>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mb-3">4</div>
                    <h4 className="font-medium text-foreground mb-1">{t("exams.emptyStateStep4")}</h4>
                    <p className="text-sm text-muted-foreground">{t("exams.emptyStateStep4Desc")}</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/exams/create">
                      <Plus className="h-4 w-4 me-2" />
                      {t("exams.create")}
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="https://docs.smartexam.com/getting-started" target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 me-2" />
                      {t("exams.watchTutorial")}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("exams.title")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("exams.duration")}</TableHead>
                    <TableHead>{t("exams.passingScore")}</TableHead>
                    <TableHead>{t("exams.sections")}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam)
                    return (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/exams/${exam.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {getExamTitle(exam, language)}
                            </Link>
                            {exam.code && <span className="text-xs text-muted-foreground">{exam.code}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{exam.durationMinutes || 0} min</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{exam.passingScore || exam.passScore || 0}%</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <LayoutList className="h-4 w-4" />
                            <span>{exam.sections?.length || exam.sectionsCount || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/${exam.id}`}>
                                  <Eye className="h-4 w-4 me-2" />
                                  {t("common.view")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/${exam.id}/edit`}>
                                  <Pencil className="h-4 w-4 me-2" />
                                  {t("common.edit")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/${exam.id}/builder`}>
                                  <LayoutList className="h-4 w-4 me-2" />
                                  {t("exams.builder")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/exams/${exam.id}/configuration`}>
                                  <Shield className="h-4 w-4 me-2" />
                                  {t("exams.configuration")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {status === "Draft" && (
                                <DropdownMenuItem onClick={() => handlePublish(exam)}>
                                  <Send className="h-4 w-4 me-2" />
                                  {t("exams.publish")}
                                </DropdownMenuItem>
                              )}
                              {status === "Published" && (
                                <DropdownMenuItem onClick={() => handleArchive(exam)}>
                                  <Archive className="h-4 w-4 me-2" />
                                  {t("exams.archive")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setExamToDelete(exam)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {t("common.delete")}
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
      </div>

      {/* How It Works Section - Always visible when exams exist */}
      {filteredExams.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("exams.howItWorks")}</h3>
                <p className="text-sm text-muted-foreground">{t("exams.howItWorksDesc")}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{t("exams.emptyStateStep1")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("exams.emptyStateStep1Desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{t("exams.emptyStateStep2")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("exams.emptyStateStep2Desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{t("exams.emptyStateStep3")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("exams.emptyStateStep3Desc")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">4</div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{t("exams.emptyStateStep4")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("exams.emptyStateStep4Desc")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exams.deleteConfirm", { title: examToDelete ? getExamTitle(examToDelete, language) : "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
