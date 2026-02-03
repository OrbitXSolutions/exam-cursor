"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createQuestion } from "@/lib/api/question-bank"
import { getQuestionCategories, getQuestionTypes, type QuestionCategory, type QuestionType } from "@/lib/api/lookups"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Info,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Settings,
  ListChecks,
} from "lucide-react"
import Link from "next/link"

// Question Type IDs from backend
const QUESTION_TYPE = {
  MCQ_SINGLE: 1,
  MCQ_MULTI: 2,
  TRUE_FALSE: 3,
  SHORT_ANSWER: 4,
  ESSAY: 5,
  NUMERIC: 6,
}

interface OptionInput {
  id: string
  textEn: string
  textAr: string
  isCorrect: boolean
  order: number
}

const CreateQuestionPage = () => {
  const router = useRouter()
  const { t, language } = useI18n()
  const errorRef = useRef<HTMLDivElement>(null)

  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    bodyEn: "",
    bodyAr: "",
    questionTypeId: "",
    questionCategoryId: "",
    points: 1,
    difficultyLevel: DifficultyLevel.Easy,
    isActive: true,
  })

  const [options, setOptions] = useState<OptionInput[]>([
    { id: "1", textEn: "", textAr: "", isCorrect: false, order: 0 },
    { id: "2", textEn: "", textAr: "", isCorrect: false, order: 1 },
  ])

  // For True/False
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<"true" | "false" | "">("")

  // For Short Answer / Numeric - correct answer
  const [correctAnswer, setCorrectAnswer] = useState("")

  useEffect(() => {
    fetchLookups()
  }, [])

  useEffect(() => {
    const typeId = Number(formData.questionTypeId)

    if (typeId === QUESTION_TYPE.TRUE_FALSE) {
      setOptions([
        { id: "true", textEn: "True", textAr: "صحيح", isCorrect: false, order: 0 },
        { id: "false", textEn: "False", textAr: "خطأ", isCorrect: false, order: 1 },
      ])
      setTrueFalseAnswer("")
    } else if (typeId === QUESTION_TYPE.MCQ_SINGLE || typeId === QUESTION_TYPE.MCQ_MULTI) {
      if (options.length === 2 && options[0].id === "true") {
        setOptions([
          { id: "1", textEn: "", textAr: "", isCorrect: false, order: 0 },
          { id: "2", textEn: "", textAr: "", isCorrect: false, order: 1 },
        ])
      }
    }
  }, [formData.questionTypeId])

  useEffect(() => {
    if (formErrors.length > 0 && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      errorRef.current.focus()
    }
  }, [formErrors])

  const fetchLookups = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([getQuestionCategories(), getQuestionTypes()])

      // Categories - response is PaginatedResponse<QuestionCategory>
      const categoriesData = categoriesRes?.items || []
      setCategories(categoriesData)

      // Types - response is PaginatedResponse<QuestionType>
      const typesData = typesRes?.items || []
      setTypes(typesData)

      // Default to MCQ Single if available
      if (typesData.length > 0) {
        const mcqType = typesData.find((t) => t.id === QUESTION_TYPE.MCQ_SINGLE) || typesData[0]
        setFormData((prev) => ({ ...prev, questionTypeId: String(mcqType.id) }))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch lookups:", error)
      toast.error("Failed to load question types and categories")
    }
    setIsLoading(false)
  }

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: String(Date.now()),
        textEn: "",
        textAr: "",
        isCorrect: false,
        order: options.length,
      },
    ])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("At least 2 options are required")
      return
    }
    setOptions(options.filter((opt) => opt.id !== id).map((opt, idx) => ({ ...opt, order: idx })))
  }

  const updateOption = (id: string, updates: Partial<OptionInput>) => {
    const typeId = Number(formData.questionTypeId)

    setOptions(
      options.map((opt) => {
        if (opt.id === id) {
          return { ...opt, ...updates }
        }
        if (updates.isCorrect && typeId === QUESTION_TYPE.MCQ_SINGLE) {
          return { ...opt, isCorrect: false }
        }
        return opt
      }),
    )
  }

  const handleTrueFalseChange = (value: "true" | "false") => {
    setTrueFalseAnswer(value)
    setOptions([
      { id: "true", textEn: "True", textAr: "صحيح", isCorrect: value === "true", order: 0 },
      { id: "false", textEn: "False", textAr: "خطأ", isCorrect: value === "false", order: 1 },
    ])
  }

  const selectedTypeId = Number(formData.questionTypeId)
  const isMCQSingle = selectedTypeId === QUESTION_TYPE.MCQ_SINGLE
  const isMCQMulti = selectedTypeId === QUESTION_TYPE.MCQ_MULTI
  const isTrueFalse = selectedTypeId === QUESTION_TYPE.TRUE_FALSE
  const isShortAnswer = selectedTypeId === QUESTION_TYPE.SHORT_ANSWER
  const isEssay = selectedTypeId === QUESTION_TYPE.ESSAY
  const isNumeric = selectedTypeId === QUESTION_TYPE.NUMERIC

  const needsOptions = isMCQSingle || isMCQMulti || isTrueFalse
  const isTextBased = isShortAnswer || isEssay || isNumeric

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.bodyEn.trim()) {
      errors.push("Question body (English) is required")
    }
    if (!formData.questionTypeId) {
      errors.push("Question type is required")
    }
    if (!formData.questionCategoryId) {
      errors.push("Question category is required")
    }

    if (needsOptions) {
      const hasCorrectAnswer = options.some((opt) => opt.isCorrect)
      if (!hasCorrectAnswer) {
        errors.push("At least one option must be marked as correct")
      }

      if (!isTrueFalse) {
        const hasEmptyOption = options.some((opt) => !opt.textEn.trim())
        if (hasEmptyOption) {
          errors.push("All options must have text (English)")
        }
      }
    }

    if ((isShortAnswer || isNumeric) && !correctAnswer.trim()) {
      errors.push("Please provide the correct answer")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateForm()
    if (errors.length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors([])
    setIsSaving(true)

    let finalOptions: { textEn: string; textAr: string; isCorrect: boolean; order: number; attachmentPath: string | null }[] = []

    if (needsOptions) {
      finalOptions = options.map((opt) => ({
        textEn: opt.textEn,
        textAr: opt.textAr || opt.textEn, // Fallback to English if Arabic is empty
        isCorrect: opt.isCorrect,
        order: opt.order,
        attachmentPath: null,
      }))
    } else if (isShortAnswer || isNumeric) {
      finalOptions = [
        {
          textEn: correctAnswer,
          textAr: correctAnswer, // Use same value for both languages for short answer
          isCorrect: true,
          order: 0,
          attachmentPath: null,
        },
      ]
    }

    try {
      const response = await createQuestion({
        bodyEn: formData.bodyEn,
        bodyAr: formData.bodyAr || formData.bodyEn, // Fallback to English if Arabic is empty
        questionTypeId: Number(formData.questionTypeId),
        questionCategoryId: Number(formData.questionCategoryId),
        points: formData.points,
        difficultyLevel: formData.difficultyLevel,
        isActive: formData.isActive,
        options: finalOptions,
      })

      const responseAny = response as any

      if (responseAny.id) {
        // Response is the Question directly
        toast.success("Question created successfully")
        router.replace("/question-bank")
      } else if (responseAny.success === true) {
        // Response is wrapped { success, message, data }
        toast.success(responseAny.message || "Question created successfully")
        router.replace("/question-bank")
      } else if (responseAny.success === false) {
        // Response indicates failure
        const apiErrors =
          responseAny.errors?.length > 0 ? responseAny.errors : [responseAny.message || "Failed to create question"]
        setFormErrors(apiErrors)
      } else {
        // Unknown response format, but we got a response so assume success
        toast.success("Question created successfully")
        router.replace("/question-bank")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while creating the question"
      setFormErrors([errorMessage])
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title={t("questionBank.createQuestion")} />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const ErrorAlert = () => {
    if (formErrors.length === 0) return null
    return (
      <Alert variant="destructive" ref={errorRef} tabIndex={-1} className="animate-in fade-in-0 slide-in-from-top-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Please fix the following errors</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {formErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title={t("questionBank.createQuestion")} subtitle="Add a new question to your bank" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/question-bank">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ErrorAlert />

            <Card className="border-2 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Question Details</CardTitle>
                    <CardDescription>Enter the question content and settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Question Body - Bilingual */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bodyEn" className="text-sm font-semibold flex items-center gap-2">
                      {t("questionBank.questionBody")} (English)
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="bodyEn"
                      placeholder="Enter your question in English..."
                      value={formData.bodyEn}
                      onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                      rows={4}
                      className="resize-none text-base border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyAr" className="text-sm font-semibold flex items-center gap-2">
                      {t("questionBank.questionBody")} (العربية)
                    </Label>
                    <Textarea
                      id="bodyAr"
                      placeholder="أدخل سؤالك بالعربية..."
                      value={formData.bodyAr}
                      onChange={(e) => setFormData({ ...formData, bodyAr: e.target.value })}
                      rows={4}
                      dir="rtl"
                      className="resize-none text-base border-2 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Type and Category Row */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-semibold flex items-center gap-2">
                      {t("questionBank.questionType")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.questionTypeId}
                      onValueChange={(value) => setFormData({ ...formData, questionTypeId: value })}
                    >
                      <SelectTrigger id="type" className="border-2 h-11 w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No types available
                          </SelectItem>
                        ) : (
                          types.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {language === "ar" ? type.nameAr : type.nameEn}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                      {t("questionBank.questionCategory")}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.questionCategoryId}
                      onValueChange={(value) => setFormData({ ...formData, questionCategoryId: value })}
                    >
                      <SelectTrigger id="category" className="border-2 h-11 w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {language === "ar" ? cat.nameAr : cat.nameEn}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Difficulty and Points Row */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-semibold">
                      {t("questionBank.difficulty")}
                    </Label>
                    <Select
                      value={String(formData.difficultyLevel)}
                      onValueChange={(value) => setFormData({ ...formData, difficultyLevel: Number(value) })}
                    >
                      <SelectTrigger id="difficulty" className="border-2 h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(DifficultyLevel.Easy)}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            {t("questionBank.easy")}
                          </span>
                        </SelectItem>
                        <SelectItem value={String(DifficultyLevel.Medium)}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            {t("questionBank.medium")}
                          </span>
                        </SelectItem>
                        <SelectItem value={String(DifficultyLevel.Hard)}>
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            {t("questionBank.hard")}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-sm font-semibold">
                      {t("common.points")}
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="border-2 h-11 w-full"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between rounded-xl border-2 p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{t("common.active")}</p>
                      <p className="text-sm text-muted-foreground">Question can be used in exams</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* MCQ Single - Radio buttons for correct answer */}
            {isMCQSingle && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("questionBank.options")}</CardTitle>
                      <CardDescription>Add answer options and select the single correct answer</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {options.map((option, index) => (
                    <div
                      key={option.id}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${option.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "hover:border-muted-foreground/50"}`}
                    >
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => updateOption(option.id, { isCorrect: true })}
                          className="h-5 w-5 text-primary accent-primary"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
                          <div>
                            <Label htmlFor={`option-single-en-${option.id}`} className="text-xs text-muted-foreground">
                              English
                            </Label>
                            <Input
                              id={`option-single-en-${option.id}`}
                              placeholder={`Option ${index + 1} (English)`}
                              value={option.textEn}
                              onChange={(e) => updateOption(option.id, { textEn: e.target.value })}
                              className="border-2 h-10"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`option-single-ar-${option.id}`} className="text-xs text-muted-foreground">
                              العربية
                            </Label>
                            <Input
                              id={`option-single-ar-${option.id}`}
                              placeholder={`الخيار ${index + 1}`}
                              value={option.textAr}
                              onChange={(e) => updateOption(option.id, { textAr: e.target.value })}
                              className="border-2 h-10"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        {option.isCorrect && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("questionBank.correctAnswer")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 hover:bg-destructive/10"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full h-12 border-2 border-dashed hover:border-primary hover:bg-primary/5 bg-transparent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* MCQ Multi - Checkboxes for multiple correct answers */}
            {isMCQMulti && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("questionBank.options")}</CardTitle>
                      <CardDescription>Add answer options and check all correct answers</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      Multiple answers can be correct. Check all that apply.
                    </AlertDescription>
                  </Alert>

                  {options.map((option, index) => (
                    <div
                      key={option.id}
                      className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${option.isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "hover:border-muted-foreground/50"}`}
                    >
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Checkbox
                          id={`correct-multi-${option.id}`}
                          checked={option.isCorrect}
                          onCheckedChange={(checked) => updateOption(option.id, { isCorrect: checked === true })}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
                          <div>
                            <Label htmlFor={`option-multi-en-${option.id}`} className="text-xs text-muted-foreground">
                              English
                            </Label>
                            <Input
                              id={`option-multi-en-${option.id}`}
                              placeholder={`Option ${index + 1} (English)`}
                              value={option.textEn}
                              onChange={(e) => updateOption(option.id, { textEn: e.target.value })}
                              className="border-2 h-10"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`option-multi-ar-${option.id}`} className="text-xs text-muted-foreground">
                              العربية
                            </Label>
                            <Input
                              id={`option-multi-ar-${option.id}`}
                              placeholder={`الخيار ${index + 1}`}
                              value={option.textAr}
                              onChange={(e) => updateOption(option.id, { textAr: e.target.value })}
                              className="border-2 h-10"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        {option.isCorrect && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("questionBank.correctAnswer")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 hover:bg-destructive/10"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full h-12 border-2 border-dashed hover:border-primary hover:bg-primary/5 bg-transparent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* True/False */}
            {isTrueFalse && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Correct Answer</CardTitle>
                      <CardDescription>Select whether the statement is true or false</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={trueFalseAnswer === "true" ? "default" : "outline"}
                      className={`flex-1 h-14 text-lg border-2 ${trueFalseAnswer === "true" ? "bg-green-600 hover:bg-green-700" : ""}`}
                      onClick={() => handleTrueFalseChange("true")}
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      True
                    </Button>
                    <Button
                      type="button"
                      variant={trueFalseAnswer === "false" ? "default" : "outline"}
                      className={`flex-1 h-14 text-lg border-2 ${trueFalseAnswer === "false" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      onClick={() => handleTrueFalseChange("false")}
                    >
                      <AlertCircle className="mr-2 h-5 w-5" />
                      False
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Short Answer */}
            {isShortAnswer && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Expected Answer</CardTitle>
                      <CardDescription>Provide the correct answer for auto-grading</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="shortAnswer" className="text-sm font-semibold">
                      Correct Answer <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="shortAnswer"
                      placeholder="Enter the expected answer"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="border-2 h-11"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Numeric */}
            {isNumeric && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Numeric Answer</CardTitle>
                      <CardDescription>Provide the correct numeric value</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="numericAnswer" className="text-sm font-semibold">
                      Correct Value <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="numericAnswer"
                      type="number"
                      step="any"
                      placeholder="Enter the numeric answer"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="border-2 h-11"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Essay */}
            {isEssay && (
              <Card className="border-2 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/30 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Essay Question</CardTitle>
                      <CardDescription>This question requires manual grading</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      Essay questions cannot be auto-graded. Instructors will need to manually review and grade
                      responses.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            <ErrorAlert />

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" size="lg" asChild>
                <Link href="/question-bank">{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" size="lg" disabled={isSaving} className="min-w-[140px]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Question
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateQuestionPage
