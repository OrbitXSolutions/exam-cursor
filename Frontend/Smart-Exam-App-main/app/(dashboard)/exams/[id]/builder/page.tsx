"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getExam,
  getExamSections,
  createExamSection,
  updateExamSection,
  deleteExamSection,
  addQuestionToSection,
  removeQuestionFromSection,
  getSectionTopics,
  createTopic,
  updateTopic,
  deleteTopic,
} from "@/lib/api/exams"
import { getQuestions } from "@/lib/api/question-bank"
import type { Exam, ExamSection, ExamTopic, Question } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Shuffle,
  MousePointer,
  FolderOpen,
  BookOpen,
} from "lucide-react"

export default function ExamBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const { t, dir, locale } = useI18n()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<ExamSection[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ExamSection | null>(null)
  const [sectionForm, setSectionForm] = useState({ 
    titleEn: "", 
    titleAr: "", 
    descriptionEn: "", 
    descriptionAr: "", 
    timeLimit: 0 
  })
  const [deleteSectionDialog, setDeleteSectionDialog] = useState<ExamSection | null>(null)

  // Topic states
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<ExamTopic | null>(null)
  const [activeSectionForTopic, setActiveSectionForTopic] = useState<string | null>(null)
  const [topicForm, setTopicForm] = useState({ 
    titleEn: "", 
    titleAr: "", 
    descriptionEn: "", 
    descriptionAr: ""
  })
  const [deleteTopicDialog, setDeleteTopicDialog] = useState<ExamTopic | null>(null)

  // Question picker
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false)
  const [activeSectionForQuestions, setActiveSectionForQuestions] = useState<string | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [questionSearch, setQuestionSearch] = useState("")
  const [selectionMode, setSelectionMode] = useState<"manual" | "random">("manual")
  const [randomCount, setRandomCount] = useState(5)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isAddingQuestions, setIsAddingQuestions] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [examData, sectionsData, questionsData] = await Promise.all([
        getExam(id),
        getExamSections(id),
        getQuestions(),
      ])
      setExam(examData)
      setSections(sectionsData)
      setAvailableQuestions(questionsData.items.filter((q) => q.isActive))
      // Expand all sections by default
      setExpandedSections(new Set(sectionsData.map((s) => s.id)))
    } catch (error) {
      toast.error("Failed to load exam data")
    } finally {
      setLoading(false)
    }
  }

  function toggleSectionExpand(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  function openSectionDialog(section?: ExamSection) {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        titleEn: section.titleEn || section.title || "",
        titleAr: section.titleAr || "",
        descriptionEn: section.descriptionEn || section.description || "",
        descriptionAr: section.descriptionAr || "",
        timeLimit: section.timeLimit || section.durationMinutes || 0,
      })
    } else {
      setEditingSection(null)
      setSectionForm({ titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "", timeLimit: 0 })
    }
    setSectionDialogOpen(true)
  }

  async function handleSaveSection() {
    if (!sectionForm.titleEn.trim()) {
      toast.error(t("exams.errorTitleRequired"))
      return
    }

    try {
      if (editingSection) {
        // API takes sectionId directly, not examId + sectionId
        await updateExamSection(editingSection.id, {
          titleEn: sectionForm.titleEn,
          titleAr: sectionForm.titleAr || sectionForm.titleEn,
          descriptionEn: sectionForm.descriptionEn || undefined,
          descriptionAr: sectionForm.descriptionAr || undefined,
          order: editingSection.order || 1,
          durationMinutes: sectionForm.timeLimit || undefined,
        })
        toast.success(t("common.saveSuccess"))
      } else {
        await createExamSection(id, {
          titleEn: sectionForm.titleEn,
          titleAr: sectionForm.titleAr || sectionForm.titleEn,
          descriptionEn: sectionForm.descriptionEn || undefined,
          descriptionAr: sectionForm.descriptionAr || undefined,
          order: sections.length + 1,
          durationMinutes: sectionForm.timeLimit || undefined,
        })
        toast.success(t("common.saveSuccess"))
      }
      setSectionDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error(t("common.error"))
    }
  }

  async function handleDeleteSection() {
    if (!deleteSectionDialog) return
    try {
      // API takes sectionId directly, not examId + sectionId
      await deleteExamSection(deleteSectionDialog.id)
      toast.success("Section deleted")
      setDeleteSectionDialog(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete section")
    }
  }

  // Topic handlers
  function openTopicDialog(sectionId: string, topic?: ExamTopic) {
    setActiveSectionForTopic(sectionId)
    if (topic) {
      setEditingTopic(topic)
      setTopicForm({
        titleEn: topic.titleEn || "",
        titleAr: topic.titleAr || "",
        descriptionEn: topic.descriptionEn || "",
        descriptionAr: topic.descriptionAr || "",
      })
    } else {
      setEditingTopic(null)
      setTopicForm({ titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "" })
    }
    setTopicDialogOpen(true)
  }

  async function handleSaveTopic() {
    if (!activeSectionForTopic || !topicForm.titleEn.trim()) {
      toast.error(t("exams.errorTitleRequired"))
      return
    }

    const section = sections.find((s) => String(s.id) === activeSectionForTopic)
    const topicsCount = section?.topics?.length || 0

    try {
      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          titleEn: topicForm.titleEn,
          titleAr: topicForm.titleAr || topicForm.titleEn,
          descriptionEn: topicForm.descriptionEn || undefined,
          descriptionAr: topicForm.descriptionAr || undefined,
          order: editingTopic.order || 1,
        })
        toast.success(t("common.saveSuccess"))
      } else {
        await createTopic(activeSectionForTopic, {
          titleEn: topicForm.titleEn,
          titleAr: topicForm.titleAr || topicForm.titleEn,
          descriptionEn: topicForm.descriptionEn || undefined,
          descriptionAr: topicForm.descriptionAr || undefined,
          order: topicsCount + 1,
        })
        toast.success(t("common.saveSuccess"))
      }
      setTopicDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error(t("common.error"))
    }
  }

  async function handleDeleteTopic() {
    if (!deleteTopicDialog) return
    try {
      await deleteTopic(deleteTopicDialog.id)
      toast.success(t("common.deleteSuccess"))
      setDeleteTopicDialog(null)
      loadData()
    } catch (error) {
      toast.error(t("common.error"))
    }
  }

  function openQuestionPicker(sectionId: string) {
    setActiveSectionForQuestions(sectionId)
    // Start with empty selection - only show questions not already in the exam
    setSelectedQuestions(new Set())
    setQuestionPickerOpen(true)
  }

  async function handleAddQuestions() {
    if (!activeSectionForQuestions || isAddingQuestions) return

    const section = sections.find((s) => s.id === activeSectionForQuestions)
    
    // Calculate the max order from existing questions in this section
    const maxOrder = section?.questions?.reduce((max, q) => Math.max(max, q.order || 0), 0) || 0

    // Find newly selected questions that are NOT already in ANY section of the exam
    const newQuestionIds = Array.from(selectedQuestions).filter((qId) => !allExamQuestionIds.has(String(qId)))

    if (newQuestionIds.length === 0) {
      toast.error(t("exams.noNewQuestionsSelected"))
      return
    }

    setIsAddingQuestions(true)
    try {
      let orderIndex = maxOrder + 1 // Start from next order number after max
      for (const questionId of newQuestionIds) {
        const question = availableQuestions.find((q) => String(q.id) === String(questionId))
        // API takes sectionId directly, include order to avoid duplicate order error
        await addQuestionToSection(activeSectionForQuestions, {
          questionId: Number(questionId),
          pointsOverride: question?.points || 1,
          isRequired: true,
          order: orderIndex,
        })
        orderIndex++
      }
      toast.success(`${t("common.added") || "Added"} ${newQuestionIds.length} ${(t("exams.questions") || "questions").toLowerCase()}`)
      setQuestionPickerOpen(false)
      setSelectedQuestions(new Set())
      await loadData()
    } catch (error) {
      toast.error(t("common.error"))
    } finally {
      setIsAddingQuestions(false)
    }
  }

  async function handleRemoveQuestion(sectionId: string, examQuestionId: string) {
    try {
      // API takes examQuestionId directly
      await removeQuestionFromSection(id, sectionId, examQuestionId)
      toast.success("Question removed")
      loadData()
    } catch (error) {
      toast.error("Failed to remove question")
    }
  }

  // Get unique categories from questions (use English name as key, store both for display)
  const categoryMap = new Map<string, { en: string; ar: string }>()
  availableQuestions.forEach(q => {
    const categoryEn = q.questionCategoryNameEn || q.questionCategoryName || q.category?.name
    const categoryAr = q.questionCategoryNameAr || categoryEn
    if (categoryEn) {
      categoryMap.set(categoryEn, { en: categoryEn, ar: categoryAr || categoryEn })
    }
  })
  const categories = Array.from(categoryMap.keys())

  // Get all question IDs that are already in ANY section of the exam
  const allExamQuestionIds = new Set(
    sections.flatMap(s => s.questions?.map(q => String(q.questionId)) || [])
  )

  // Filter questions that are NOT already in the exam
  const questionsNotInExam = availableQuestions.filter(q => !allExamQuestionIds.has(String(q.id)))
  
  const filteredQuestions = questionsNotInExam.filter((q) => {
    const searchTerm = questionSearch.toLowerCase()
    const bodyTextEn = (q.bodyEn || q.body || "").toLowerCase()
    const bodyTextAr = (q.bodyAr || "").toLowerCase()
    const categoryNameEn = (q.questionCategoryNameEn || q.questionCategoryName || q.category?.name || "").toLowerCase()
    const categoryNameAr = (q.questionCategoryNameAr || "").toLowerCase()
    
    const matchesSearch = bodyTextEn.includes(searchTerm) || bodyTextAr.includes(searchTerm) || 
                          categoryNameEn.includes(searchTerm) || categoryNameAr.includes(searchTerm)
    
    const matchesCategory = selectedCategory === "all" || 
      q.questionCategoryNameEn === selectedCategory || 
      q.questionCategoryName === selectedCategory || 
      q.category?.name === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  function handleRandomSelection() {
    // Shuffle and take random count from filtered questions (already excludes exam questions)
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5)
    const randomIds = shuffled.slice(0, Math.min(randomCount, shuffled.length)).map(q => q.id)
    
    setSelectedQuestions(new Set(randomIds.map(String)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/exams/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{t("exams.builder")}</h1>
              <StatusBadge status={exam.isPublished ? "Published" : exam.isActive ? "Draft" : "Inactive"} />
            </div>
            <p className="text-muted-foreground mt-1">{exam.titleEn || exam.title}</p>
          </div>
        </div>
        <Button onClick={() => openSectionDialog()}>
          <Plus className="h-4 w-4 me-2" />
          {t("exams.addSection")}
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-6 text-lg font-medium">{t("exams.noSections")}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t("exams.noSectionsDesc")}</p>
            <Button className="mt-6" onClick={() => openSectionDialog()}>
              <Plus className="h-4 w-4 me-2" />
              {t("exams.addSection")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.has(section.id)
            const questionCount = section.questions?.length || 0
            const totalPoints = section.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSectionExpand(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {sectionIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {locale === "ar" ? (section.titleAr || section.titleEn || section.title) : (section.titleEn || section.title)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span>
                            {questionCount} {(t("exams.questions") || "questions").toLowerCase()}
                          </span>
                          <span>•</span>
                          <span>
                            {totalPoints} {t("exams.points")}
                          </span>
                          {(section.timeLimit || section.durationMinutes) && (section.timeLimit || section.durationMinutes) > 0 && (
                            <>
                              <span>•</span>
                              <span>{section.timeLimit || section.durationMinutes} {t("exams.mins")}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSectionDialog(section)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteSectionDialog(section)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/20 pt-4">
                    {(section.descriptionEn || section.descriptionAr || section.description) && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {locale === "ar" 
                          ? (section.descriptionAr || section.descriptionEn || section.description) 
                          : (section.descriptionEn || section.description)}
                      </p>
                    )}

                    {/* Topics in this section (optional) */}
                    {section.topics && section.topics.length > 0 ? (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t("exams.topics") || "Topics"} ({section.topics.length})
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => openTopicDialog(String(section.id))}
                          >
                            <Plus className="h-4 w-4 me-2" />
                            {t("exams.addTopic") || "Add Topic"}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {section.topics.map((topic, topicIndex) => (
                            <div
                              key={topic.id}
                              className="flex items-center justify-between p-3 bg-background rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-medium">
                                  {topicIndex + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {locale === "ar" ? (topic.titleAr || topic.titleEn) : topic.titleEn}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {topic.questionsCount || 0} {(t("exams.questions") || "questions").toLowerCase()} • {topic.totalPoints || 0} {t("exams.points") || "points"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openTopicDialog(String(section.id), topic)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTopicDialog(topic)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => openTopicDialog(String(section.id))}
                        >
                          <BookOpen className="h-4 w-4 me-2" />
                          {t("exams.addTopic") || "Add Topic"} ({t("common.optional") || "Optional"})
                        </Button>
                      </div>
                    )}

                    {/* Questions in this section */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        {t("exams.questions")} ({questionCount})
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => openQuestionPicker(String(section.id))}
                      >
                        <Plus className="h-4 w-4 me-2" />
                        {t("exams.addQuestions")}
                      </Button>
                    </div>

                    {questionCount === 0 ? (
                      <div className="text-center py-6 border-2 border-dashed rounded-lg bg-background">
                        <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">{t("exams.noQuestionsInSection")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {section.questions?.map((eq, qIndex) => (
                          <div key={eq.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <span className="text-sm font-medium text-muted-foreground w-6">{qIndex + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {locale === "ar" 
                                  ? (eq.questionBodyAr || eq.questionBodyEn || eq.questionBody || "Question not found")
                                  : (eq.questionBodyEn || eq.questionBody || "Question not found")}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {(eq.questionTypeNameEn || eq.questionTypeName) && (
                                  <Badge variant="secondary" className="text-xs">
                                    {locale === "ar"
                                      ? (eq.questionTypeNameAr || eq.questionTypeNameEn || eq.questionTypeName)
                                      : (eq.questionTypeNameEn || eq.questionTypeName)}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{eq.points} pts</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveQuestion(section.id, eq.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 bg-transparent"
                          onClick={() => openQuestionPicker(section.id)}
                        >
                          <Plus className="h-4 w-4 me-2" />
                          {t("exams.addQuestions")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSection ? t("exams.editSection") : t("exams.addSection")}</DialogTitle>
            <DialogDescription>{t("exams.sectionDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title - Bilingual */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sectionTitleEn">{t("exams.sectionTitleEn")} *</Label>
                <Input
                  id="sectionTitleEn"
                  value={sectionForm.titleEn}
                  onChange={(e) => setSectionForm((p) => ({ ...p, titleEn: e.target.value }))}
                  placeholder={t("exams.sectionTitleEnPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionTitleAr">{t("exams.sectionTitleAr")}</Label>
                <Input
                  id="sectionTitleAr"
                  value={sectionForm.titleAr}
                  onChange={(e) => setSectionForm((p) => ({ ...p, titleAr: e.target.value }))}
                  placeholder={t("exams.sectionTitleArPlaceholder")}
                  dir="rtl"
                />
              </div>
            </div>
            {/* Description - Bilingual */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sectionDescEn">{t("exams.descriptionEn")}</Label>
                <Textarea
                  id="sectionDescEn"
                  value={sectionForm.descriptionEn}
                  onChange={(e) => setSectionForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                  placeholder={t("exams.sectionDescEnPlaceholder")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sectionDescAr">{t("exams.descriptionAr")}</Label>
                <Textarea
                  id="sectionDescAr"
                  value={sectionForm.descriptionAr}
                  onChange={(e) => setSectionForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                  placeholder={t("exams.sectionDescArPlaceholder")}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>
            {/* Time Limit */}
            <div className="space-y-2">
              <Label htmlFor="timeLimit">{t("exams.sectionTimeLimit")}</Label>
              <Input
                id="timeLimit"
                type="number"
                min="0"
                value={sectionForm.timeLimit}
                onChange={(e) => setSectionForm((p) => ({ ...p, timeLimit: Number.parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full sm:w-40"
              />
              <p className="text-xs text-muted-foreground">{t("exams.sectionTimeLimitDesc")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveSection}>
              <Save className="h-4 w-4 me-2" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Dialog */}
      <AlertDialog open={!!deleteSectionDialog} onOpenChange={(open) => !open && setDeleteSectionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exams.deleteSectionConfirm", { title: deleteSectionDialog?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTopic ? t("exams.editTopic") : t("exams.addTopic")}</DialogTitle>
            <DialogDescription>{t("exams.topicDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Title - Bilingual */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topicTitleEn">{t("exams.topicTitleEn")} *</Label>
                <Input
                  id="topicTitleEn"
                  value={topicForm.titleEn}
                  onChange={(e) => setTopicForm((p) => ({ ...p, titleEn: e.target.value }))}
                  placeholder={t("exams.topicTitleEnPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicTitleAr">{t("exams.topicTitleAr")}</Label>
                <Input
                  id="topicTitleAr"
                  value={topicForm.titleAr}
                  onChange={(e) => setTopicForm((p) => ({ ...p, titleAr: e.target.value }))}
                  placeholder={t("exams.topicTitleArPlaceholder")}
                  dir="rtl"
                />
              </div>
            </div>
            {/* Description - Bilingual */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topicDescEn">{t("exams.descriptionEn")}</Label>
                <Textarea
                  id="topicDescEn"
                  value={topicForm.descriptionEn}
                  onChange={(e) => setTopicForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                  placeholder={t("exams.topicDescEnPlaceholder")}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topicDescAr">{t("exams.descriptionAr")}</Label>
                <Textarea
                  id="topicDescAr"
                  value={topicForm.descriptionAr}
                  onChange={(e) => setTopicForm((p) => ({ ...p, descriptionAr: e.target.value }))}
                  placeholder={t("exams.topicDescArPlaceholder")}
                  rows={2}
                  dir="rtl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveTopic}>
              <Save className="h-4 w-4 me-2" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Dialog */}
      <AlertDialog open={!!deleteTopicDialog} onOpenChange={(open) => !open && setDeleteTopicDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exams.deleteTopicConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Picker Sheet */}
      <Sheet open={questionPickerOpen} onOpenChange={(open) => {
        setQuestionPickerOpen(open)
        if (!open) {
          setSelectedQuestions(new Set())
          setSelectionMode("manual")
          setSelectedCategory("all")
        }
      }}>
        <SheetContent side={dir === "rtl" ? "left" : "right"} className="w-full sm:max-w-lg px-6">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-primary">{t("exams.selectQuestions")}</SheetTitle>
            <SheetDescription>{t("exams.selectQuestionsDesc")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            {/* Selection Mode Tabs */}
            <Tabs value={selectionMode} onValueChange={(v) => setSelectionMode(v as "manual" | "random")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="gap-2">
                  <MousePointer className="h-4 w-4" />
                  {t("exams.manualSelection")}
                </TabsTrigger>
                <TabsTrigger value="random" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  {t("exams.randomSelection")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 mt-4">
                {/* Category Filter + Search */}
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("exams.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("exams.allCategories")}</SelectItem>
                      {categories.map((cat) => {
                        const catData = categoryMap.get(cat)
                        return (
                          <SelectItem key={cat} value={cat || ""}>
                            {locale === "ar" ? (catData?.ar || cat) : (catData?.en || cat)}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("common.search")}
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="space-y-2 pe-4">
                    {filteredQuestions.map((question) => {
                      const isSelected = selectedQuestions.has(String(question.id))
                      return (
                        <div
                          key={question.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            setSelectedQuestions((prev) => {
                              const next = new Set(prev)
                              const qId = String(question.id)
                              if (next.has(qId)) {
                                next.delete(qId)
                              } else {
                                next.add(qId)
                              }
                              return next
                            })
                          }}
                        >
                          <Checkbox checked={isSelected} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-2">
                              {locale === "ar" 
                                ? (question.bodyAr || question.bodyEn || question.body || "No question text")
                                : (question.bodyEn || question.body || "No question text")}
                            </p>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              {(question.questionTypeNameEn || question.questionTypeName || question.type?.name) && (
                                <Badge variant="secondary" className="text-xs">
                                  {locale === "ar"
                                    ? (question.questionTypeNameAr || question.questionTypeNameEn || question.questionTypeName)
                                    : (question.questionTypeNameEn || question.questionTypeName)}
                                </Badge>
                              )}
                              {(question.questionCategoryNameEn || question.questionCategoryName || question.category?.name) && (
                                <Badge variant="outline" className="text-xs">
                                  {locale === "ar"
                                    ? (question.questionCategoryNameAr || question.questionCategoryNameEn || question.questionCategoryName)
                                    : (question.questionCategoryNameEn || question.questionCategoryName)}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{question.points} pts</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {filteredQuestions.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">{t("common.noResults")}</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="random" className="space-y-4 mt-4">
                {/* Random Selection Options */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label>{t("exams.category")}</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("exams.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("exams.allCategories")}</SelectItem>
                        {categories.map((cat) => {
                          const catData = categoryMap.get(cat)
                          return (
                            <SelectItem key={cat} value={cat || ""}>
                              {locale === "ar" ? (catData?.ar || cat) : (catData?.en || cat)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("exams.numberOfQuestions")}</Label>
                    <Input
                      type="number"
                      min="1"
                      max={filteredQuestions.length}
                      value={randomCount}
                      onChange={(e) => setRandomCount(Number.parseInt(e.target.value) || 1)}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {filteredQuestions.length} {t("exams.questionsAvailable")}
                    </p>
                  </div>
                  <Button onClick={handleRandomSelection} className="w-full">
                    <Shuffle className="h-4 w-4 me-2" />
                    {t("exams.generateRandom")}
                  </Button>
                </div>

                {/* Show selected questions preview */}
                {selectedQuestions.size > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{selectedQuestions.size} {t("exams.questionsSelected")}</Label>
                    <ScrollArea className="h-[calc(100vh-520px)]">
                      <div className="space-y-2 pe-4">
                        {Array.from(selectedQuestions).map((qId) => {
                          const question = availableQuestions.find(q => String(q.id) === qId)
                          if (!question) return null
                          return (
                            <div key={qId} className="flex items-start gap-3 p-3 rounded-lg border border-primary bg-primary/5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm line-clamp-2">
                                  {locale === "ar" 
                                    ? (question.bodyAr || question.bodyEn || question.body || "No question text")
                                    : (question.bodyEn || question.body || "No question text")}
                                </p>
                                <div className="flex items-center flex-wrap gap-2 mt-2">
                                  {(question.questionCategoryNameEn || question.questionCategoryName || question.category?.name) && (
                                    <Badge variant="outline" className="text-xs">
                                      {locale === "ar"
                                        ? (question.questionCategoryNameAr || question.questionCategoryNameEn || question.questionCategoryName)
                                        : (question.questionCategoryNameEn || question.questionCategoryName)}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{question.points} pts</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setSelectedQuestions(prev => {
                                    const next = new Set(prev)
                                    next.delete(qId)
                                    return next
                                  })
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedQuestions.size} {t("exams.questionsSelected")}
              </span>
              <Button onClick={handleAddQuestions} disabled={selectedQuestions.size === 0 || isAddingQuestions}>
                {isAddingQuestions ? (
                  <>
                    <LoadingSpinner size="sm" className="me-2" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 me-2" />
                    {t("exams.addSelected")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
