"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner"
import { getQuestionById, updateQuestion } from "@/lib/api/question-bank"
import { getQuestionTypes, getQuestionSubjects, getQuestionTopics, type QuestionType, type QuestionSubject, type QuestionTopic } from "@/lib/api/lookups"
import type { Question } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"

interface OptionInput {
  id: string
  textEn: string
  textAr: string
  isCorrect: boolean
  order: number
  originalId?: number
}

export default function EditQuestionPage() {
  const params = useParams()
  const questionId = params.id as string
  const router = useRouter()
  const { t, language } = useI18n()

  const [question, setQuestion] = useState<Question | null>(null)
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isValidId = questionId && !isNaN(Number(questionId)) && Number(questionId) > 0

  const [formData, setFormData] = useState({
    bodyEn: "",
    bodyAr: "",
    questionTypeId: "",
    subjectId: "",
    topicId: "",
    points: 1,
    difficultyLevel: DifficultyLevel.Easy,
    isActive: true,
  })

  const [options, setOptions] = useState<OptionInput[]>([])

  // Answer key state for essay/subjective questions
  const [answerKey, setAnswerKey] = useState({
    rubricTextEn: "",
    rubricTextAr: "",
  })

  useEffect(() => {
    if (questionId === "create" || !isValidId) {
      return
    }
    fetchData()
  }, [questionId])

  const fetchData = async () => {
    try {
      const [questionRes, typesRes, subjectsRes] = await Promise.all([
        getQuestionById(Number(questionId)),
        getQuestionTypes(),
        getQuestionSubjects({ pageSize: 100 }),
      ])

      const q = (questionRes as any)?.data || questionRes
      if (q && q.id) {
        setQuestion(q)
        setFormData({
          bodyEn: q.bodyEn || q.body || "",
          bodyAr: q.bodyAr || "",
          questionTypeId: String(q.questionTypeId || ""),
          subjectId: String(q.subjectId || ""),
          topicId: String(q.topicId || ""),
          points: q.points || 1,
          difficultyLevel: q.difficultyLevel || DifficultyLevel.Easy,
          isActive: q.isActive !== false,
        })
        // Load answer key if present
        if (q.answerKey) {
          setAnswerKey({
            rubricTextEn: q.answerKey.rubricTextEn || "",
            rubricTextAr: q.answerKey.rubricTextAr || "",
          })
        }
        if (q.options) {
          setOptions(
            q.options.map((opt: any) => ({
              id: String(opt.id),
              textEn: opt.textEn || opt.text || "",
              textAr: opt.textAr || "",
              isCorrect: opt.isCorrect,
              order: opt.order,
              originalId: opt.id,
            })),
          )
        }
        // Fetch topics for the question's subject
        if (q.subjectId) {
          try {
            const topicsRes = await getQuestionTopics({ subjectId: q.subjectId, pageSize: 100 })
            setTopics(topicsRes?.items || [])
          } catch { setTopics([]) }
        }
      }

      const typesList = (typesRes as any)?.items || typesRes
      if (Array.isArray(typesList)) {
        setTypes(typesList)
      } else if (typesList?.items) {
        setTypes(typesList.items)
      }

      const subjectsList = (subjectsRes as any)?.items || subjectsRes
      if (Array.isArray(subjectsList)) {
        setSubjects(subjectsList)
      } else if (subjectsList?.items) {
        setSubjects(subjectsList.items)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch data:", error)
      toast.error("Failed to load question data")
    }
    setIsLoading(false)
  }

  // Fetch topics when subject changes
  useEffect(() => {
    if (!formData.subjectId) {
      setTopics([])
      return
    }
    const fetchTopics = async () => {
      try {
        const res = await getQuestionTopics({ subjectId: Number(formData.subjectId), pageSize: 100 })
        setTopics(res?.items || [])
      } catch { setTopics([]) }
    }
    // Only fetch if subjectId changed from original (to avoid double-fetch on first load)
    if (question && String(question.subjectId) !== formData.subjectId) {
      setFormData((prev) => ({ ...prev, topicId: "" }))
      fetchTopics()
    }
  }, [formData.subjectId])

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
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)))
  }

  const selectedType = types.find((t) => String(t.id) === formData.questionTypeId)
  const isEssayType = selectedType?.nameEn === "Essay"
  const isSubjectiveType = selectedType?.nameEn === "Essay" || selectedType?.nameEn === "Short Answer"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bodyEn.trim()) {
      toast.error("Question body (English) is required")
      return
    }

    if (!isEssayType) {
      const hasCorrectAnswer = options.some((opt) => opt.isCorrect)
      if (!hasCorrectAnswer) {
        toast.error("At least one option must be marked as correct")
        return
      }
    }

    setIsSaving(true)

    try {
      const payload: any = {
        bodyEn: formData.bodyEn,
        bodyAr: formData.bodyAr || formData.bodyEn,
        questionTypeId: Number(formData.questionTypeId),
        subjectId: Number(formData.subjectId),
        topicId: formData.topicId ? Number(formData.topicId) : undefined,
        points: formData.points,
        difficultyLevel: formData.difficultyLevel,
        isActive: formData.isActive,
      }

      // Include answer key for subjective types
      if (isSubjectiveType && (answerKey.rubricTextEn || answerKey.rubricTextAr)) {
        payload.answerKey = {
          rubricTextEn: answerKey.rubricTextEn || null,
          rubricTextAr: answerKey.rubricTextAr || null,
        }
      }

      const response = await updateQuestion(Number(questionId), payload)

      const isSuccess = response && (response as any).success !== false

      if (isSuccess) {
        toast.success("Question updated successfully")
        router.push(`/question-bank/${questionId}`)
      } else {
        toast.error((response as any)?.message || "Failed to update question")
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      toast.error("Failed to update question")
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={t("questionBank.editQuestion")} />
        <PageLoader />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex flex-col">
        <PageHeader title="Question Not Found" />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">The question you are looking for does not exist.</p>
          <Button variant="outline" asChild className="mt-4 bg-transparent">
            <Link href="/question-bank">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Question Bank
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("questionBank.editQuestion")} subtitle={`Question #${question.id}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={`/question-bank/${question.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Details */}
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
                <CardDescription>Edit the question content and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Body - Bilingual */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bodyEn">
                      {t("questionBank.questionBody")} (English) <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="bodyEn"
                      placeholder="Enter your question in English..."
                      value={formData.bodyEn}
                      onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyAr">
                      {t("questionBank.questionBody")} (العربية)
                    </Label>
                    <Textarea
                      id="bodyAr"
                      placeholder="أدخل سؤالك بالعربية..."
                      value={formData.bodyAr}
                      onChange={(e) => setFormData({ ...formData, bodyAr: e.target.value })}
                      rows={4}
                      dir="rtl"
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      {t("questionBank.questionType")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.questionTypeId}
                      onValueChange={(value) => setFormData({ ...formData, questionTypeId: value })}
                    >
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {language === "ar" ? type.nameAr : type.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      {language === "ar" ? "المادة" : "Subject"} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    >
                      <SelectTrigger id="subject" className="w-full">
                        <SelectValue placeholder={language === "ar" ? "اختر المادة" : "Select subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subj) => (
                          <SelectItem key={subj.id} value={String(subj.id)}>
                            {language === "ar" ? subj.nameAr : subj.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="topic">
                      {language === "ar" ? "الموضوع" : "Topic"}
                    </Label>
                    <Select
                      value={formData.topicId}
                      onValueChange={(value) => setFormData({ ...formData, topicId: value })}
                      disabled={!formData.subjectId || topics.length === 0}
                    >
                      <SelectTrigger id="topic" className="w-full">
                        <SelectValue placeholder={language === "ar" ? "اختر الموضوع (اختياري)" : "Select topic (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={String(topic.id)}>
                            {language === "ar" ? topic.nameAr : topic.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t("questionBank.difficulty")}</Label>
                    <Select
                      value={String(formData.difficultyLevel)}
                      onValueChange={(value) => setFormData({ ...formData, difficultyLevel: Number(value) })}
                    >
                      <SelectTrigger id="difficulty" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(DifficultyLevel.Easy)}>{t("questionBank.easy")}</SelectItem>
                        <SelectItem value={String(DifficultyLevel.Medium)}>{t("questionBank.medium")}</SelectItem>
                        <SelectItem value={String(DifficultyLevel.Hard)}>{t("questionBank.hard")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">{t("common.points")}</Label>
                    <Input
                      id="points"
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{t("common.active")}</p>
                    <p className="text-sm text-muted-foreground">Question can be used in exams</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            {!isEssayType && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.options")}</CardTitle>
                  <CardDescription>Edit answer options and correct answers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Checkbox
                          id={`correct-edit-${option.id}`}
                          checked={option.isCorrect}
                          onCheckedChange={(checked) => updateOption(option.id, { isCorrect: checked === true })}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-2 grid-cols-1 lg:grid-cols-2">
                          <div>
                            <Label htmlFor={`option-edit-en-${option.id}`} className="text-xs text-muted-foreground">
                              English
                            </Label>
                            <Input
                              id={`option-edit-en-${option.id}`}
                              placeholder={`Option ${index + 1} (English)`}
                              value={option.textEn}
                              onChange={(e) => updateOption(option.id, { textEn: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`option-edit-ar-${option.id}`} className="text-xs text-muted-foreground">
                              العربية
                            </Label>
                            <Input
                              id={`option-edit-ar-${option.id}`}
                              placeholder={`الخيار ${index + 1}`}
                              value={option.textAr}
                              onChange={(e) => updateOption(option.id, { textAr: e.target.value })}
                              dir="rtl"
                            />
                          </div>
                        </div>
                        {option.isCorrect && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {t("questionBank.correctAnswer")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Model Answer / Rubric for subjective types */}
            {isSubjectiveType && (
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "الإجابة النموذجية / معايير التقييم" : "Model Answer / Grading Rubric"}</CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "سيستخدمها المُقيّم كمرجع أثناء التصحيح اليدوي"
                      : "This will be shown to the grader as a reference during manual grading"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rubricEn">
                        {language === "ar" ? "الإجابة النموذجية (English)" : "Model Answer (English)"}
                      </Label>
                      <Textarea
                        id="rubricEn"
                        placeholder="Enter model answer or grading rubric in English..."
                        value={answerKey.rubricTextEn}
                        onChange={(e) => setAnswerKey({ ...answerKey, rubricTextEn: e.target.value })}
                        rows={5}
                        className="resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rubricAr">
                        {language === "ar" ? "الإجابة النموذجية (العربية)" : "Model Answer (العربية)"}
                      </Label>
                      <Textarea
                        id="rubricAr"
                        placeholder="أدخل الإجابة النموذجية أو معايير التقييم..."
                        value={answerKey.rubricTextAr}
                        onChange={(e) => setAnswerKey({ ...answerKey, rubricTextAr: e.target.value })}
                        rows={5}
                        dir="rtl"
                        className="resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/question-bank/${question.id}`}>{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoadingSpinner size="sm" className="mr-2" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
