"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  generateQuestionsWithAi,
  createQuestion,
  type AiGenerateQuestionsRequest,
  type AiGeneratedQuestion,
} from "@/lib/api/question-bank"
import {
  getQuestionTypes,
  getQuestionSubjects,
  getQuestionTopics,
  type QuestionType,
  type QuestionSubject,
  type QuestionTopic,
} from "@/lib/api/lookups"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Save,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Eye,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Brain,
  Zap,
} from "lucide-react"

// Question Type IDs from backend
const QUESTION_TYPE = {
  MCQ_SINGLE: 1,
  MCQ_MULTI: 2,
  TRUE_FALSE: 3,
}

const SUPPORTED_TYPES = [QUESTION_TYPE.MCQ_SINGLE, QUESTION_TYPE.MCQ_MULTI, QUESTION_TYPE.TRUE_FALSE]

type Step = "configure" | "review" | "saved"

interface EditableQuestion extends AiGeneratedQuestion {
  _id: string
  _selected: boolean
  _editing: boolean
  _saved: boolean
  _saving: boolean
}

export default function AiStudioPage() {
  const router = useRouter()
  const { t, language } = useI18n()

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>("configure")

  // Lookups
  const [types, setTypes] = useState<QuestionType[]>([])
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)

  // Form
  const [formData, setFormData] = useState<AiGenerateQuestionsRequest>({
    subjectId: 0,
    topicId: null,
    questionTypeId: QUESTION_TYPE.MCQ_SINGLE,
    difficultyLevel: DifficultyLevel.Medium,
    numberOfQuestions: 5,
    points: 1,
    customTopic: "",
    language: "both",
  })

  // Generation
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<EditableQuestion[]>([])
  const [generationInfo, setGenerationInfo] = useState<{ model: string; subjectName: string; topicName?: string; questionTypeName: string } | null>(null)

  // Saving
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    fetchLookups()
  }, [])

  useEffect(() => {
    if (formData.subjectId) {
      fetchTopics(formData.subjectId)
    } else {
      setTopics([])
    }
  }, [formData.subjectId])

  const fetchLookups = async () => {
    try {
      const [typesRes, subjectsRes] = await Promise.all([
        getQuestionTypes(),
        getQuestionSubjects({ pageSize: 100 }),
      ])
      const allTypes = typesRes?.items || []
      // Filter to only supported types (MCQ Single, MCQ Multi, True/False)
      setTypes(allTypes.filter((t: QuestionType) => SUPPORTED_TYPES.includes(t.id)))
      setSubjects(subjectsRes?.items || [])
    } catch (err) {
      console.error("Failed to load lookups:", err)
      toast.error("Failed to load form data")
    } finally {
      setIsLoadingLookups(false)
    }
  }

  const fetchTopics = async (subjectId: number) => {
    try {
      const res = await getQuestionTopics({ subjectId, pageSize: 100 })
      setTopics(res?.items || [])
    } catch {
      setTopics([])
    }
  }

  const handleGenerate = async () => {
    // Validate
    if (!formData.subjectId) {
      toast.error("Please select a subject")
      return
    }
    if (!formData.questionTypeId) {
      toast.error("Please select a question type")
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateQuestionsWithAi(formData)
      const editableQuestions: EditableQuestion[] = (result.questions || []).map((q, idx) => ({
        ...q,
        _id: `gen-${Date.now()}-${idx}`,
        _selected: true,
        _editing: false,
        _saved: false,
        _saving: false,
      }))
      setGeneratedQuestions(editableQuestions)
      setGenerationInfo({
        model: result.model,
        subjectName: result.subjectName,
        topicName: result.topicName,
        questionTypeName: result.questionTypeName,
      })
      setCurrentStep("review")
      toast.success(`Generated ${editableQuestions.length} questions successfully!`)
    } catch (err: any) {
      console.error("Generation failed:", err)
      toast.error(err?.message || "Failed to generate questions. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    setCurrentStep("configure")
    setGeneratedQuestions([])
    setGenerationInfo(null)
    setSavedCount(0)
  }

  const toggleQuestionSelection = (id: string) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q._id === id ? { ...q, _selected: !q._selected } : q))
    )
  }

  const toggleSelectAll = () => {
    const allSelected = generatedQuestions.every((q) => q._selected)
    setGeneratedQuestions((prev) =>
      prev.map((q) => ({ ...q, _selected: !allSelected }))
    )
  }

  const removeQuestion = (id: string) => {
    setGeneratedQuestions((prev) => prev.filter((q) => q._id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<EditableQuestion>) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q._id === id ? { ...q, ...updates } : q))
    )
  }

  const updateOption = (questionId: string, optionIndex: number, updates: Partial<EditableQuestion["options"][0]>) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q._id !== questionId) return q
        const newOptions = [...q.options]
        newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates }
        return { ...q, options: newOptions }
      })
    )
  }

  const toggleCorrectAnswer = (questionId: string, optionIndex: number) => {
    setGeneratedQuestions((prev) =>
      prev.map((q) => {
        if (q._id !== questionId) return q
        const isMcqMulti = q.questionTypeId === QUESTION_TYPE.MCQ_MULTI
        const newOptions = q.options.map((opt, idx) => {
          if (isMcqMulti) {
            // Multi-select: toggle individual
            return idx === optionIndex ? { ...opt, isCorrect: !opt.isCorrect } : opt
          } else {
            // Single-select: only one correct
            return { ...opt, isCorrect: idx === optionIndex }
          }
        })
        return { ...q, options: newOptions }
      })
    )
  }

  const saveSelectedQuestions = async () => {
    const selected = generatedQuestions.filter((q) => q._selected && !q._saved)
    if (selected.length === 0) {
      toast.error("No questions selected to save")
      return
    }

    // Validate MCQ Multi must have at least 2 correct answers
    const invalidMulti = selected.filter(
      (q) => q.questionTypeId === QUESTION_TYPE.MCQ_MULTI &&
        q.options.filter((o) => o.isCorrect).length < 2
    )
    if (invalidMulti.length > 0) {
      toast.error(
        language === "ar"
          ? "أسئلة الاختيار المتعدد يجب أن تحتوي على إجابتين صحيحتين على الأقل"
          : "MCQ Multi questions must have at least 2 correct answers"
      )
      return
    }

    setIsSavingAll(true)
    let saved = 0

    for (const question of selected) {
      // Mark as saving
      updateQuestion(question._id, { _saving: true })

      try {
        await createQuestion({
          bodyEn: question.bodyEn || "",
          bodyAr: question.bodyAr || "",
          questionTypeId: question.questionTypeId,
          questionCategoryId: null, // No category - nullable in backend
          subjectId: formData.subjectId,
          topicId: formData.topicId || undefined,
          points: question.points,
          difficultyLevel: question.difficultyLevel,
          isActive: true,
          options: question.options.map((opt, idx) => ({
            textEn: opt.textEn || "",
            textAr: opt.textAr || "",
            isCorrect: opt.isCorrect,
            order: idx,
          })),
        })
        updateQuestion(question._id, { _saved: true, _saving: false })
        saved++
        setSavedCount((prev) => prev + 1)
      } catch (err: any) {
        console.error(`Failed to save question: ${question._id}`, err)
        updateQuestion(question._id, { _saving: false })
        toast.error(`Failed to save a question: ${err?.message || "Unknown error"}`)
      }
    }

    setIsSavingAll(false)

    if (saved === selected.length) {
      toast.success(`All ${saved} questions saved to Question Bank!`)
      setCurrentStep("saved")
    } else {
      toast.warning(`Saved ${saved}/${selected.length} questions. Some failed.`)
    }
  }

  const selectedCount = generatedQuestions.filter((q) => q._selected && !q._saved).length
  const totalSaved = generatedQuestions.filter((q) => q._saved).length

  if (isLoadingLookups) {
    return (
      <div className="flex flex-col">
        <PageHeader
          title={language === "ar" ? "استوديو الأسئلة الذكي" : "AI Question Studio"}
          subtitle={language === "ar" ? "إنشاء أسئلة تلقائية باستخدام الذكاء الاصطناعي" : "Generate exam questions automatically using AI"}
          className="text-center"
        />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={language === "ar" ? "استوديو الأسئلة الذكي" : "AI Question Studio"}
        subtitle={language === "ar" ? "إنشاء أسئلة تلقائية باستخدام الذكاء الاصطناعي" : "Generate exam questions automatically using AI"}
        className="text-center"
      />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/question-bank">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
          currentStep === "configure" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "text-muted-foreground"
        }`}>
          {currentStep !== "configure" ? <Check className="h-3.5 w-3.5" /> : <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">1</span>}
          {language === "ar" ? "إعداد" : "Configure"}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
          currentStep === "review" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "text-muted-foreground"
        }`}>
          {currentStep === "saved" ? <Check className="h-3.5 w-3.5" /> : <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">2</span>}
          {language === "ar" ? "مراجعة وتعديل" : "Review & Edit"}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-colors ${
          currentStep === "saved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "text-muted-foreground"
        }`}>
          <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">3</span>
          {language === "ar" ? "تم الحفظ" : "Saved"}
        </div>
      </div>

      {/* Step 1: Configure */}
      {currentStep === "configure" && (
        <Card className="border-2 shadow-sm overflow-hidden pt-0">
          <CardHeader className="bg-linear-to-r from-purple-500/5 to-indigo-500/10 border-b py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Wand2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {language === "ar" ? "إعدادات التوليد" : "Generation Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "حدد المادة والموضوع ونوع الأسئلة والمستوى لتوليد الأسئلة"
                    : "Choose subject, topic, question type, and difficulty to generate questions"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Subject */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  {language === "ar" ? "المادة" : "Subject"}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subjectId ? String(formData.subjectId) : ""}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, subjectId: Number(val), topicId: null }))
                  }
                >
                  <SelectTrigger className="border-2 h-11 w-full">
                    <SelectValue placeholder={language === "ar" ? "اختر المادة" : "Select subject"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {language === "ar" ? s.nameAr || s.nameEn : s.nameEn || s.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  {language === "ar" ? "الموضوع" : "Topic"}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.topicId ? String(formData.topicId) : ""}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, topicId: Number(val) }))
                  }
                  disabled={topics.length === 0}
                >
                  <SelectTrigger className="border-2 h-11 w-full">
                    <SelectValue placeholder={language === "ar" ? "اختر الموضوع" : "Select topic"} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((tp) => (
                      <SelectItem key={tp.id} value={String(tp.id)}>
                        {language === "ar" ? tp.nameAr || tp.nameEn : tp.nameEn || tp.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Type */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  {language === "ar" ? "نوع السؤال" : "Question Type"}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formData.questionTypeId)}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, questionTypeId: Number(val) }))
                  }
                >
                  <SelectTrigger className="border-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((tp) => (
                      <SelectItem key={tp.id} value={String(tp.id)}>
                        {language === "ar" ? tp.nameAr || tp.nameEn : tp.nameEn || tp.nameAr}
                      </SelectItem>
                    ))}
                    {types.length === 0 && (
                      <>
                        <SelectItem value="1">MCQ - Single Answer</SelectItem>
                        <SelectItem value="2">MCQ - Multiple Answers</SelectItem>
                        <SelectItem value="3">True / False</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  {language === "ar" ? "مستوى الصعوبة" : "Difficulty Level"}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={String(formData.difficultyLevel)}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, difficultyLevel: Number(val) as DifficultyLevel }))
                  }
                >
                  <SelectTrigger className="border-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{language === "ar" ? "سهل" : "Easy"}</SelectItem>
                    <SelectItem value="2">{language === "ar" ? "متوسط" : "Medium"}</SelectItem>
                    <SelectItem value="3">{language === "ar" ? "صعب" : "Hard"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{language === "ar" ? "عدد الأسئلة" : "Number of Questions"}</Label>
                <Select
                  value={String(formData.numberOfQuestions)}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, numberOfQuestions: Number(val) }))
                  }
                >
                  <SelectTrigger className="border-2 h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {language === "ar" ? "أسئلة" : n === 1 ? "question" : "questions"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Points */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{language === "ar" ? "الدرجة لكل سؤال" : "Points per Question"}</Label>
                <Input
                  type="number"
                  min={0.5}
                  max={100}
                  step={0.5}
                  value={formData.points}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, points: Number(e.target.value) || 1 }))
                  }
                  className="border-2 h-11 w-full focus:border-primary transition-colors"
                />
              </div>

              {/* Custom Topic */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-semibold">{language === "ar" ? "تعليمات إضافية (اختياري)" : "Custom Instructions (optional)"}</Label>
                <Textarea
                  placeholder={
                    language === "ar"
                      ? "مثال: أسئلة حول البرمجة الكائنية في Java..."
                      : "e.g., Focus on Object-Oriented Programming concepts in Java..."
                  }
                  value={formData.customTopic || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customTopic: e.target.value }))
                  }
                  rows={2}
                  className="resize-none border-2 focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="ghost" asChild>
                <Link href="/question-bank">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {language === "ar" ? "العودة" : "Back to Question Bank"}
                </Link>
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.subjectId || !formData.topicId}
                className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white min-w-50"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {language === "ar" ? "جاري التوليد..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {language === "ar" ? "توليد الأسئلة" : "Generate Questions"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review & Edit */}
      {currentStep === "review" && (
        <div className="space-y-4">
          {/* Generation Summary */}
          {generationInfo && (
            <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <AlertTitle className="text-purple-700 dark:text-purple-300">
                {language === "ar" ? "تم التوليد بنجاح" : "Generation Complete"}
              </AlertTitle>
              <AlertDescription className="text-purple-600 dark:text-purple-400">
                {language === "ar"
                  ? `تم توليد ${generatedQuestions.length} أسئلة — ${generationInfo.questionTypeName} — ${generationInfo.subjectName}${generationInfo.topicName ? ` / ${generationInfo.topicName}` : ""}`
                  : `Generated ${generatedQuestions.length} ${generationInfo.questionTypeName} questions — ${generationInfo.subjectName}${generationInfo.topicName ? ` / ${generationInfo.topicName}` : ""}`
                }
                <span className="ml-2 text-xs opacity-60">({generationInfo.model})</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {generatedQuestions.every((q) => q._selected)
                  ? <><X className="mr-1.5 h-3.5 w-3.5" />{language === "ar" ? "إلغاء الكل" : "Deselect All"}</>
                  : <><Check className="mr-1.5 h-3.5 w-3.5" />{language === "ar" ? "تحديد الكل" : "Select All"}</>
                }
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedCount} {language === "ar" ? "محدد" : "selected"}{" "}
                {totalSaved > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    • {totalSaved} {language === "ar" ? "تم حفظها" : "saved"}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {language === "ar" ? "إعادة التوليد" : "Re-generate"}
              </Button>
              <Button
                onClick={saveSelectedQuestions}
                disabled={isSavingAll || selectedCount === 0}
                className="bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {isSavingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "ar" ? `حفظ ${selectedCount} سؤال` : `Save ${selectedCount} Question${selectedCount !== 1 ? "s" : ""}`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {generatedQuestions.map((question, qIndex) => (
              <QuestionCard
                key={question._id}
                question={question}
                index={qIndex}
                language={language}
                onToggleSelect={() => toggleQuestionSelection(question._id)}
                onRemove={() => removeQuestion(question._id)}
                onUpdate={(updates) => updateQuestion(question._id, updates)}
                onUpdateOption={(optIdx, updates) => updateOption(question._id, optIdx, updates)}
                onToggleCorrect={(optIdx) => toggleCorrectAnswer(question._id, optIdx)}
              />
            ))}
          </div>

          {generatedQuestions.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center text-muted-foreground">
                {language === "ar" ? "تمت إزالة جميع الأسئلة. أعد التوليد." : "All questions removed. Re-generate to create new ones."}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Saved */}
      {currentStep === "saved" && (
        <Card className="py-12 border-2 shadow-sm">
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === "ar" ? "تم الحفظ بنجاح!" : "Questions Saved Successfully!"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {language === "ar"
                  ? `تم حفظ ${totalSaved} سؤال في بنك الأسئلة`
                  : `${totalSaved} question${totalSaved !== 1 ? "s" : ""} saved to the Question Bank`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => {
                setCurrentStep("configure")
                setGeneratedQuestions([])
                setGenerationInfo(null)
                setSavedCount(0)
              }}>
                <Sparkles className="mr-2 h-4 w-4" />
                {language === "ar" ? "توليد المزيد" : "Generate More"}
              </Button>
              <Button asChild>
                <Link href="/question-bank">
                  <Eye className="mr-2 h-4 w-4" />
                  {language === "ar" ? "عرض بنك الأسئلة" : "View Question Bank"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </div>
    </div>
  )
}

// Individual Question Card Component
function QuestionCard({
  question,
  index,
  language,
  onToggleSelect,
  onRemove,
  onUpdate,
  onUpdateOption,
  onToggleCorrect,
}: {
  question: EditableQuestion
  index: number
  language: string
  onToggleSelect: () => void
  onRemove: () => void
  onUpdate: (updates: Partial<EditableQuestion>) => void
  onUpdateOption: (optIdx: number, updates: Partial<EditableQuestion["options"][0]>) => void
  onToggleCorrect: (optIdx: number) => void
}) {
  const isSaved = question._saved
  const isSaving = question._saving

  const difficultyLabel = question.difficultyLevel === 1 ? "Easy" : question.difficultyLevel === 2 ? "Medium" : "Hard"
  const difficultyColor = question.difficultyLevel === 1 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    : question.difficultyLevel === 2 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"

  const typeLabel = question.questionTypeId === 1 ? "MCQ Single" : question.questionTypeId === 2 ? "MCQ Multi" : "True/False"

  return (
    <Card className={`transition-all ${isSaved ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20" : question._selected ? "border-purple-200 dark:border-purple-800" : "opacity-60"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {!isSaved && (
              <Checkbox
                checked={question._selected}
                onCheckedChange={onToggleSelect}
                className="mt-1"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {language === "ar" ? `سؤال ${index + 1}` : `Question ${index + 1}`}
                </span>
                <Badge variant="outline" className="text-xs">{typeLabel}</Badge>
                <Badge variant="outline" className={`text-xs ${difficultyColor}`}>{difficultyLabel}</Badge>
                <Badge variant="outline" className="text-xs">{question.points} pts</Badge>
                {isSaved && (
                  <Badge className="bg-green-600 text-white text-xs">
                    <Check className="mr-1 h-3 w-3" /> {language === "ar" ? "تم الحفظ" : "Saved"}
                  </Badge>
                )}
                {isSaving && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> {language === "ar" ? "جاري الحفظ" : "Saving"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isSaved && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdate({ _editing: !question._editing })}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={onRemove}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Question Body */}
        {question._editing ? (
          <div className="space-y-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Question (English)</Label>
              <Textarea
                value={question.bodyEn}
                onChange={(e) => onUpdate({ bodyEn: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Question (Arabic)</Label>
              <Textarea
                value={question.bodyAr}
                onChange={(e) => onUpdate({ bodyAr: e.target.value })}
                rows={2}
                dir="rtl"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-1">
            {question.bodyEn && (
              <p className="text-sm font-medium">{question.bodyEn}</p>
            )}
            {question.bodyAr && (
              <p className="text-sm font-medium text-muted-foreground" dir="rtl">{question.bodyAr}</p>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {question.options.map((opt, optIdx) => (
            <div
              key={optIdx}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                opt.isCorrect
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <button
                type="button"
                onClick={() => !isSaved && onToggleCorrect(optIdx)}
                disabled={isSaved}
                className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  opt.isCorrect
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 dark:border-gray-600 hover:border-green-400"
                }`}
              >
                {opt.isCorrect && <Check className="h-3 w-3" />}
              </button>

              {question._editing ? (
                <div className="flex-1 space-y-1">
                  <Input
                    value={opt.textEn}
                    onChange={(e) => onUpdateOption(optIdx, { textEn: e.target.value })}
                    placeholder="Option text (English)"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={opt.textAr}
                    onChange={(e) => onUpdateOption(optIdx, { textAr: e.target.value })}
                    placeholder="Option text (Arabic)"
                    className="h-8 text-sm"
                    dir="rtl"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  {opt.textEn && (
                    <span className={`text-sm block ${opt.isCorrect ? "font-medium text-green-700 dark:text-green-300" : ""}`}>
                      {opt.textEn}
                    </span>
                  )}
                  {opt.textAr && (
                    <span className={`text-sm block text-muted-foreground ${opt.isCorrect ? "font-medium text-green-700 dark:text-green-300" : ""}`} dir="rtl">
                      {opt.textAr}
                    </span>
                  )}
                </div>
              )}

              {opt.isCorrect && (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Explanation */}
        {(question.explanationEn || question.explanationAr) && (
          <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              {language === "ar" ? "الشرح:" : "Explanation:"}
            </p>
            {question._editing ? (
              <div className="space-y-2">
                <Textarea
                  value={question.explanationEn || ""}
                  onChange={(e) => onUpdate({ explanationEn: e.target.value })}
                  rows={2}
                  className="text-sm"
                  placeholder="Explanation (English)"
                />
                <Textarea
                  value={question.explanationAr || ""}
                  onChange={(e) => onUpdate({ explanationAr: e.target.value })}
                  rows={2}
                  className="text-sm"
                  dir="rtl"
                  placeholder="الشرح (عربي)"
                />
              </div>
            ) : (
              <div className="space-y-1">
                {question.explanationEn && (
                  <p className="text-xs text-blue-700 dark:text-blue-300">{question.explanationEn}</p>
                )}
                {question.explanationAr && (
                  <p className="text-xs text-blue-700 dark:text-blue-300" dir="rtl">{question.explanationAr}</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
