"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { localizeText } from "@/lib/i18n/runtime"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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
import type { Question, QuestionType } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import { getQuestions, deleteQuestion, toggleQuestionStatus } from "@/lib/api/question-bank"
import { getQuestionTypes, getQuestionSubjects, getQuestionTopics, type QuestionSubject, type QuestionTopic } from "@/lib/api/lookups"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  FileQuestion,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react"

export default function QuestionBankPage() {
  const { t, language } = useI18n()

  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedTopic, setSelectedTopic] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch questions, subjects, and types in parallel
      const [questionsRes, subjectsRes, typesRes] = await Promise.all([
        getQuestions({ pageSize: 100 }),
        getQuestionSubjects({ pageSize: 100 }),
        getQuestionTypes(),
      ])

      // Handle questions response
      const items = questionsRes?.items || []
      setQuestions(Array.isArray(items) ? items : [])

      // Handle subjects response
      const subjectsData = subjectsRes?.items || []
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])

      // Handle types response
      const typesData = typesRes?.items || []
      setTypes(Array.isArray(typesData) ? typesData : [])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(localizeText("Failed to load data. Please try again.", "فشل تحميل البيانات. يرجى المحاولة مرة أخرى.", language))
      toast.error(localizeText("Failed to load questions", "فشل تحميل الأسئلة", language))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch topics when subject changes
  useEffect(() => {
    if (selectedSubject === "all") {
      setTopics([])
      setSelectedTopic("all")
      return
    }
    const fetchTopicsForSubject = async () => {
      try {
        const res = await getQuestionTopics({ subjectId: Number(selectedSubject), pageSize: 100 })
        setTopics(res?.items || [])
        setSelectedTopic("all")
      } catch {
        setTopics([])
      }
    }
    fetchTopicsForSubject()
  }, [selectedSubject])

  const handleDelete = async () => {
    if (!questionToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteQuestion(questionToDelete.id)
      if (result) {
        setQuestions(questions.filter((q) => q.id !== questionToDelete.id))
        toast.success(localizeText("Question deleted successfully", "تم حذف السؤال بنجاح", language))
      } else {
        toast.error(localizeText("Failed to delete question", "فشل حذف السؤال", language))
      }
    } catch (err) {
      toast.error(localizeText("Failed to delete question", "فشل حذف السؤال", language))
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
    }
  }

  const handleToggleStatus = async (question: Question) => {
    try {
      const result = await toggleQuestionStatus(question.id)
      if (result) {
        setQuestions(questions.map((q) => (q.id === question.id ? { ...q, isActive: !q.isActive } : q)))
        toast.success(
          question.isActive
            ? localizeText("Question deactivated successfully", "تم تعطيل السؤال بنجاح", language)
            : localizeText("Question activated successfully", "تم تفعيل السؤال بنجاح", language),
        )
      } else {
        toast.error(localizeText("Failed to update question status", "فشل تحديث حالة السؤال", language))
      }
    } catch (err) {
      toast.error(localizeText("Failed to update question status", "فشل تحديث حالة السؤال", language))
    }
  }

  const filteredQuestions = questions.filter((q) => {
    const bodyEn = q.bodyEn || q.body || ""
    const bodyAr = q.bodyAr || ""
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || bodyEn.toLowerCase().includes(searchLower) || bodyAr.toLowerCase().includes(searchLower)
    const matchesSubject = selectedSubject === "all" || q.subjectId === Number(selectedSubject)
    const matchesTopic = selectedTopic === "all" || q.topicId === Number(selectedTopic)
    const matchesType = selectedType === "all" || q.questionTypeId === Number(selectedType)
    const matchesDifficulty = selectedDifficulty === "all" || q.difficultyLevel === Number(selectedDifficulty)
    return matchesSearch && matchesSubject && matchesTopic && matchesType && matchesDifficulty
  })

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSubject("all")
    setSelectedTopic("all")
    setSelectedType("all")
    setSelectedDifficulty("all")
  }

  const hasActiveFilters =
    searchQuery || selectedSubject !== "all" || selectedTopic !== "all" || selectedType !== "all" || selectedDifficulty !== "all"

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("questionBank.title")} subtitle={t("questionBank.subtitle")} />
        <div className="flex-1 flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("questionBank.title")} subtitle={t("questionBank.subtitle")} />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="me-2 h-4 w-4" />
              {t("common.retry")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("questionBank.title")} subtitle={t("questionBank.subtitle")} />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", language === "ar" ? "right-3" : "left-3")} />
              <Input
                placeholder={`${t("common.search")} ${language === "ar" ? "الأسئلة..." : "questions..."}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={language === "ar" ? "pr-10" : "pl-10"}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-4 w-4" />
                {language === "ar" ? "مسح" : "Clear"}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={fetchData} title={language === "ar" ? "تحديث" : "Refresh"}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30">
            <Link href="/question-bank/ai-studio">
              <Sparkles className="me-2 h-4 w-4" />
              {language === "ar" ? "استوديو الأسئلة الذكي" : "AI Question Studio"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/question-bank/create">
              <Plus className="me-2 h-4 w-4" />
              {t("questionBank.createQuestion")}
            </Link>
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="animate-in slide-in-from-top-2">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === "ar" ? "المادة" : "Subject"}</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === "ar" ? "جميع المواد" : "All Subjects"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "جميع المواد" : "All Subjects"}</SelectItem>
                      {subjects.map((subj) => (
                        <SelectItem key={subj.id} value={String(subj.id)}>
                          {language === "ar" ? subj.nameAr : subj.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === "ar" ? "الموضوع" : "Topic"}</label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic} disabled={selectedSubject === "all" || topics.length === 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === "ar" ? "جميع المواضيع" : "All Topics"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "جميع المواضيع" : "All Topics"}</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={String(topic.id)}>
                          {language === "ar" ? topic.nameAr : topic.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("questionBank.questionType")}</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === "ar" ? "جميع الأنواع" : "All Types"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "جميع الأنواع" : "All Types"}</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {language === "ar" ? type.nameAr : type.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("questionBank.difficulty")}</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={language === "ar" ? "جميع المستويات" : "All Difficulties"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === "ar" ? "جميع المستويات" : "All Difficulties"}</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Easy)}>{t("questionBank.easy")}</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Medium)}>{t("questionBank.medium")}</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Hard)}>{t("questionBank.hard")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title={hasActiveFilters
              ? (language === "ar" ? "لا توجد أسئلة تطابق الفلاتر" : "No questions match your filters")
              : (language === "ar" ? "لا توجد أسئلة بعد" : "No questions yet")}
            description={
              hasActiveFilters
                ? (language === "ar" ? "حاول تعديل الفلاتر أو مصطلح البحث" : "Try adjusting your filters or search query")
                : (language === "ar" ? "أنشئ أول سؤال للبدء في بنك الأسئلة" : "Create your first question to get started with your question bank")
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="me-2 h-4 w-4" />
                  {language === "ar" ? "مسح الفلاتر" : "Clear Filters"}
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/question-bank/create">
                    <Plus className="me-2 h-4 w-4" />
                    {t("questionBank.createQuestion")}
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              {language === "ar"
                ? `عرض ${filteredQuestions.length} من ${questions.length} سؤال`
                : `Showing ${filteredQuestions.length} of ${questions.length} questions`}
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "السؤال" : "Question"}</TableHead>
                    <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                    <TableHead>{language === "ar" ? "المادة" : "Subject"}</TableHead>
                    <TableHead>{language === "ar" ? "الصعوبة" : "Difficulty"}</TableHead>
                    <TableHead>{language === "ar" ? "النقاط" : "Points"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium truncate">
                            {language === "ar" 
                              ? (question.bodyAr || question.bodyEn || question.body || "لا يوجد نص للسؤال")
                              : (question.bodyEn || question.body || "No question text")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {language === "ar"
                            ? question.questionTypeNameAr ||
                              question.questionTypeNameEn ||
                              question.questionTypeName ||
                              "Unknown"
                            : question.questionTypeNameEn ||
                              question.questionTypeName ||
                              "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {language === "ar"
                            ? question.subjectNameAr ||
                              question.subjectNameEn ||
                              "—"
                            : question.subjectNameEn ||
                              "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={
                          language === "ar"
                            ? (question.difficultyLevelName === "Easy" ? "سهل"
                              : question.difficultyLevelName === "Medium" ? "متوسط"
                              : question.difficultyLevelName === "Hard" ? "صعب"
                              : question.difficultyLevelName || "غير معروف")
                            : (question.difficultyLevelName || "Unknown")
                        } />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{question.points || 0}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={question.isActive
                          ? (language === "ar" ? "نشط" : "Active")
                          : (language === "ar" ? "غير نشط" : "Inactive")} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={language === "ar" ? "start" : "end"}>
                            <DropdownMenuItem asChild>
                              <Link href={`/question-bank/${question.id}`}>
                                <Eye className="me-2 h-4 w-4" />
                                {language === "ar" ? "عرض" : "View"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/question-bank/${question.id}/edit`}>
                                <Edit className="me-2 h-4 w-4" />
                                {language === "ar" ? "تعديل" : "Edit"}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(question)}>
                              <ToggleLeft className="me-2 h-4 w-4" />
                              {question.isActive
                                ? (language === "ar" ? "تعطيل" : "Deactivate")
                                : (language === "ar" ? "تفعيل" : "Activate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setQuestionToDelete(question)
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
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "ar" ? "حذف السؤال؟" : "Delete Question?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف السؤال نهائياً من بنك الأسئلة."
                : "This action cannot be undone. The question will be permanently deleted from your question bank."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting
                ? (language === "ar" ? "جاري الحذف..." : "Deleting...")
                : (language === "ar" ? "حذف" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
