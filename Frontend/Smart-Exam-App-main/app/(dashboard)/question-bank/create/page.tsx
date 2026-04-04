"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { localizeText } from "@/lib/i18n/runtime"
import { PageHeader } from "@/components/layout/page-header"
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
  ImageIcon,
  Upload,
  X,
  Calculator,
} from "lucide-react"
import Link from "next/link"

// Question Type IDs from backend
const QUESTION_TYPE = {
  MCQ_SINGLE: 1,
  MCQ_MULTI: 2,
  TRUE_FALSE: 3,
  SUBJECTIVE: 4,
}

interface OptionInput {
  id: string
  textEn: string
  textAr: string
  isCorrect: boolean
  points?: number | null
  order: number
  imageFile?: File | null
  imagePreview?: string | null
  attachmentPath?: string | null
}

const CreateQuestionPage = () => {
  const router = useRouter()
  const { t, language } = useI18n()
  const errorRef = useRef<HTMLDivElement>(null)

  const [types, setTypes] = useState<QuestionType[]>([])
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [topics, setTopics] = useState<QuestionTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])

  const [formData, setFormData] = useState({
    bodyEn: "",
    bodyAr: "",
    questionTypeId: "",
    subjectId: "",
    topicId: "",
    points: 1,
    difficultyLevel: DifficultyLevel.Easy,
    isActive: true,
    isCalculatorAllowed: false,
  })

  const [options, setOptions] = useState<OptionInput[]>([
    { id: "1", textEn: "", textAr: "", isCorrect: false, order: 0 },
    { id: "2", textEn: "", textAr: "", isCorrect: false, order: 1 },
  ])

  // For True/False
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<"true" | "false" | "">("")

  // Answer key / rubric for subjective types
  const [answerKey, setAnswerKey] = useState({
    rubricTextEn: "",
    rubricTextAr: "",
  })

  // Image attachment for question body
  const [questionImage, setQuestionImage] = useState<File | null>(null)
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error(localizeText('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed', 'يُسمح فقط بملفات الصور (JPEG, PNG, GIF, WebP, SVG)', language))
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(localizeText('Image size must be less than 10MB', 'يجب أن يكون حجم الصورة أقل من 10 ميجابايت', language))
      return
    }

    setQuestionImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setQuestionImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeQuestionImage = () => {
    setQuestionImage(null)
    setQuestionImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // Per-option image handlers
  const handleOptionImageSelect = (optionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error(localizeText('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed', 'يُسمح فقط بملفات الصور (JPEG, PNG, GIF, WebP, SVG)', language))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(localizeText('Image size must be less than 10MB', 'يجب أن يكون حجم الصورة أقل من 10 ميجابايت', language))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateOption(optionId, { imageFile: file, imagePreview: ev.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const removeOptionImage = (optionId: string) => {
    updateOption(optionId, { imageFile: null, imagePreview: null, attachmentPath: null })
  }

  useEffect(() => {
    fetchLookups()
  }, [])

  useEffect(() => {
    const currentType = types.find((t) => String(t.id) === formData.questionTypeId)
    const typeName = currentType?.nameEn?.toLowerCase() || ""
    const isTF = typeName === "true/false" || typeName === "true_false" || typeName === "truefalse"
    const isMCQ = typeName.includes("mcq") || typeName.includes("multiple choice")

    if (isTF) {
      setOptions([
        { id: "true", textEn: "True", textAr: "صحيح", isCorrect: false, order: 0 },
        { id: "false", textEn: "False", textAr: "خطأ", isCorrect: false, order: 1 },
      ])
      setTrueFalseAnswer("")
    } else if (isMCQ) {
      if (options.length === 2 && options[0].id === "true") {
        setOptions([
          { id: "1", textEn: "", textAr: "", isCorrect: false, order: 0 },
          { id: "2", textEn: "", textAr: "", isCorrect: false, order: 1 },
        ])
      }
    }
  }, [formData.questionTypeId, types])

  useEffect(() => {
    if (formErrors.length > 0 && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      errorRef.current.focus()
    }
  }, [formErrors])

  // Fetch topics when subject changes
  useEffect(() => {
    if (!formData.subjectId) {
      setTopics([])
      setFormData((prev) => ({ ...prev, topicId: "" }))
      return
    }
    const fetchTopics = async () => {
      try {
        const res = await getQuestionTopics({ subjectId: Number(formData.subjectId), pageSize: 100 })
        setTopics(res?.items || [])
        setFormData((prev) => ({ ...prev, topicId: "" })) // Reset topic when subject changes
      } catch (error) {
        console.error("Failed to fetch topics:", error)
        setTopics([])
      }
    }
    fetchTopics()
  }, [formData.subjectId])

  const fetchLookups = async () => {
    try {
      const [typesRes, subjectsRes] = await Promise.all([
        getQuestionTypes(),
        getQuestionSubjects({ pageSize: 100 }),
      ])

      // Types - response is PaginatedResponse<QuestionType>
      const typesData = typesRes?.items || []
      setTypes(typesData)

      // Subjects - response is PaginatedResponse<QuestionSubject>
      const subjectsData = subjectsRes?.items || []
      setSubjects(subjectsData)

      // Default to MCQ Single if available
      if (typesData.length > 0) {
        const mcqType = typesData.find((t) => t.nameEn?.toLowerCase().includes("single") || t.nameEn?.toLowerCase() === "mcq single") || typesData[0]
        setFormData((prev) => ({ ...prev, questionTypeId: String(mcqType.id) }))
      }

      // Default to first subject if available
      if (subjectsData.length > 0) {
        setFormData((prev) => ({ ...prev, subjectId: String(subjectsData[0].id) }))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch lookups:", error)
      toast.error(localizeText("Failed to load question types and categories", "فشل تحميل أنواع وتصنيفات الأسئلة", language))
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
      toast.error(localizeText("At least 2 options are required", "مطلوب خياران على الأقل", language))
      return
    }
    setOptions(options.filter((opt) => opt.id !== id).map((opt, idx) => ({ ...opt, order: idx })))
  }

  const updateOption = (id: string, updates: Partial<OptionInput>) => {
    const currentType = types.find((t) => String(t.id) === formData.questionTypeId)
    const isSingle = currentType?.nameEn?.toLowerCase().includes("single") || currentType?.nameEn?.toLowerCase() === "mcq single" || currentType?.nameEn?.toLowerCase() === "mcq_single"

    setOptions(
      options.map((opt) => {
        if (opt.id === id) {
          return { ...opt, ...updates }
        }
        if (updates.isCorrect && isSingle) {
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
  const selectedType = types.find((t) => String(t.id) === formData.questionTypeId)
  const selectedTypeName = selectedType?.nameEn?.toLowerCase() || ""
  const isMCQSingle = selectedTypeName === "mcq single" || selectedTypeName === "mcq_single" || selectedTypeName === "multiple choice (single)"
  const isMCQMulti = selectedTypeName === "mcq multi" || selectedTypeName === "mcq_multi" || selectedTypeName === "multiple choice (multi)"
  const isTrueFalse = selectedTypeName === "true/false" || selectedTypeName === "true_false" || selectedTypeName === "truefalse"
  const isSubjective = selectedTypeName === "subjective" || selectedTypeName === "essay" || selectedTypeName === "short answer"

  const needsOptions = isMCQSingle || isMCQMulti || isTrueFalse
  const isTextBased = isSubjective

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.bodyEn.trim()) {
      errors.push(language === "ar" ? "نص السؤال (بالإنجليزية) مطلوب" : "Question body (English) is required")
    }
    if (!formData.questionTypeId) {
      errors.push(language === "ar" ? "نوع السؤال مطلوب" : "Question type is required")
    }
    if (!formData.subjectId) {
      errors.push(language === "ar" ? "المادة مطلوبة" : "Subject is required")
    }

    if (needsOptions) {
      const hasCorrectAnswer = options.some((opt) => opt.isCorrect)
      if (!hasCorrectAnswer) {
        errors.push(language === "ar" ? "يجب تحديد خيار واحد على الأقل كإجابة صحيحة" : "At least one option must be marked as correct")
      }

      if (!isTrueFalse) {
        const hasEmptyOption = options.some((opt) => !opt.textEn.trim())
        if (hasEmptyOption) {
          errors.push(language === "ar" ? "جميع الخيارات يجب أن تحتوي على نص (بالإنجليزية)" : "All options must have text (English)")
        }
      }

      // Partial scoring validation for MCQ_Multi
      if (isMCQMulti) {
        const hasAnyPoints = options.some((opt) => opt.points != null && opt.points !== undefined)
        if (hasAnyPoints) {
          const sum = options.reduce((acc, opt) => acc + (opt.points || 0), 0)
          if (Math.abs(sum - formData.points) > 0.01) {
            errors.push(language === "ar" ? `مجموع نقاط الخيارات (${sum}) يجب أن يساوي إجمالي نقاط السؤال (${formData.points})` : `Sum of option points (${sum}) must equal question total points (${formData.points})`)
          }
          const hasNegative = options.some((opt) => (opt.points ?? 0) < 0)
          if (hasNegative) {
            errors.push(language === "ar" ? "نقاط الخيار يجب أن تكون 0 أو أكثر" : "Option points must be 0 or greater")
          }
        }
      }
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

    let finalOptions: { textEn: string; textAr: string; isCorrect: boolean; points?: number | null; order: number; attachmentPath: string | null }[] = []

    if (needsOptions) {
      // Upload option images first
      const apiBase = '/api/proxy'
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

      const uploadedOptions = await Promise.all(
        options.map(async (opt) => {
          let uploadedPath: string | null = opt.attachmentPath || null
          if (opt.imageFile) {
            try {
              const fd = new FormData()
              fd.append('file', opt.imageFile)
              const res = await fetch(`${apiBase}/Media/upload?folder=QuestionAttachments`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: fd,
              })
              if (res.ok) {
                const result = await res.json()
                uploadedPath = result.file?.url || result.file?.path || result.filePath || null
              }
            } catch (err) {
              console.warn('Option image upload failed:', err)
            }
          }
          return { ...opt, attachmentPath: uploadedPath }
        })
      )

      finalOptions = uploadedOptions.map((opt) => ({
        textEn: opt.textEn,
        textAr: opt.textAr || opt.textEn,
        isCorrect: opt.isCorrect,
        points: isMCQMulti && opt.points != null ? opt.points : null,
        order: opt.order,
        attachmentPath: opt.attachmentPath || null,
      }))
    }

    try {
      const payload: any = {
        bodyEn: formData.bodyEn,
        bodyAr: formData.bodyAr || formData.bodyEn, // Fallback to English if Arabic is empty
        questionTypeId: Number(formData.questionTypeId),
        subjectId: Number(formData.subjectId),
        topicId: formData.topicId ? Number(formData.topicId) : undefined,
        points: formData.points,
        difficultyLevel: formData.difficultyLevel,
        isActive: formData.isActive,
        isCalculatorAllowed: formData.isCalculatorAllowed,
        options: finalOptions,
      }

      // Include answer key for subjective types
      if (isSubjective && (answerKey.rubricTextEn || answerKey.rubricTextAr)) {
        payload.answerKey = {
          rubricTextEn: answerKey.rubricTextEn || null,
          rubricTextAr: answerKey.rubricTextAr || null,
        }
      }

      const response = await createQuestion(payload)

      const responseAny = response as any
      const createdQuestionId = responseAny.id || responseAny.data?.id

      // Upload question image if selected
      if (createdQuestionId && questionImage) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', questionImage)
          formDataUpload.append('folder', 'QuestionAttachments')

          const apiBase = '/api/proxy'
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
          const uploadRes = await fetch(`${apiBase}/Media/upload?folder=QuestionAttachments`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formDataUpload,
          })

          if (uploadRes.ok) {
            const uploadResult = await uploadRes.json()
            const filePath = uploadResult.file?.url || uploadResult.file?.path || uploadResult.filePath

            // Add attachment to the created question
            if (filePath) {
              const { addQuestionAttachment } = await import('@/lib/api/question-bank')
              await addQuestionAttachment(createdQuestionId, {
                fileName: questionImage.name,
                filePath: filePath,
                fileType: 'Image',
                fileSize: questionImage.size,
                isPrimary: true,
              })
            }
          }
        } catch (imgErr) {
          console.warn('Image upload failed, question was created:', imgErr)
          toast.warning(localizeText('Question created but image upload failed. You can add the image later.', 'تم إنشاء السؤال لكن فشل رفع الصورة. يمكنك إضافتها لاحقاً.', language))
        }
      }

      if (createdQuestionId) {
        // Response is the Question directly
        toast.success(localizeText("Question created successfully", "تم إنشاء السؤال بنجاح", language))
        router.replace("/question-bank")
      } else if (responseAny.success === true) {
        // Response is wrapped { success, message, data }
        toast.success(responseAny.message || localizeText("Question created successfully", "تم إنشاء السؤال بنجاح", language))
        router.replace("/question-bank")
      } else if (responseAny.success === false) {
        // Response indicates failure
        const apiErrors =
          responseAny.errors?.length > 0 ? responseAny.errors : [responseAny.message || "Failed to create question"]
        setFormErrors(apiErrors)
      } else {
        // Unknown response format, but we got a response so assume success
        toast.success(localizeText("Question created successfully", "تم إنشاء السؤال بنجاح", language))
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
        <PageHeader title={t("questionBank.createQuestion")} />
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
        <AlertTitle>{language === "ar" ? "يرجى إصلاح الأخطاء التالية" : "Please fix the following errors"}</AlertTitle>
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
      <PageHeader title={t("questionBank.createQuestion")} subtitle={language === "ar" ? "إضافة سؤال جديد إلى بنك الأسئلة" : "Add a new question to your bank"} className="text-center" />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/question-bank">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ErrorAlert />

            <Card className="border-2 shadow-sm overflow-hidden pt-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{language === "ar" ? "تفاصيل السؤال" : "Question Details"}</CardTitle>
                    <CardDescription>{language === "ar" ? "أدخل محتوى السؤال والإعدادات" : "Enter the question content and settings"}</CardDescription>
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

                {/* Question Image / Chart Attachment (Optional) */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {language === "ar" ? "صورة السؤال / مخطط (اختياري)" : "Question Image / Chart (Optional)"}
                  </Label>
                  {questionImagePreview ? (
                    <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                      <div className="relative w-full max-h-64 overflow-hidden rounded-lg">
                        <img
                          src={questionImagePreview}
                          alt="Question image preview"
                          className="w-full h-auto max-h-60 object-contain rounded-lg"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {questionImage?.name} ({((questionImage?.size || 0) / 1024).toFixed(1)} KB)
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeQuestionImage}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 me-1" />
                          {language === "ar" ? "إزالة" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <div className="p-3 bg-muted rounded-full">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">
                          {language === "ar" ? "اضغط لرفع صورة أو مخطط" : "Click to upload an image or chart"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPEG, PNG, GIF, WebP, SVG — Max 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                {/* Subject and Topic Row */}
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
                      {language === "ar" ? "المادة" : "Subject"}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                    >
                      <SelectTrigger id="subject" className="border-2 h-11 w-full">
                        <SelectValue placeholder={language === "ar" ? "اختر المادة" : "Select subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {language === "ar" ? "لا توجد مواد" : "No subjects available"}
                          </SelectItem>
                        ) : (
                          subjects.map((subject) => (
                            <SelectItem key={subject.id} value={String(subject.id)}>
                              {language === "ar" ? subject.nameAr : subject.nameEn}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-sm font-semibold flex items-center gap-2">
                      {language === "ar" ? "الموضوع" : "Topic"}
                    </Label>
                    <Select
                      value={formData.topicId}
                      onValueChange={(value) => setFormData({ ...formData, topicId: value })}
                      disabled={!formData.subjectId || topics.length === 0}
                    >
                      <SelectTrigger id="topic" className="border-2 h-11 w-full">
                        <SelectValue placeholder={language === "ar" ? "اختر الموضوع (اختياري)" : "Select topic (optional)"} />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {!formData.subjectId
                              ? (language === "ar" ? "اختر مادة أولاً" : "Select a subject first")
                              : (language === "ar" ? "لا توجد مواضيع" : "No topics for this subject")}
                          </SelectItem>
                        ) : (
                          topics.map((topic) => (
                            <SelectItem key={topic.id} value={String(topic.id)}>
                              {language === "ar" ? topic.nameAr : topic.nameEn}
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
                      step="any"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="border-2 h-11 py-2 w-full"
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
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "يمكن استخدام السؤال في الاختبارات" : "Question can be used in exams"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                {/* Calculator Toggle */}
                <div className="flex items-center justify-between rounded-xl border-2 p-4 bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{language === "ar" ? "السماح بالآلة الحاسبة" : "Allow Calculator"}</p>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "يمكن للمرشحين استخدام آلة حاسبة مدمجة لهذا السؤال" : "Candidates can use a built-in calculator for this question"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isCalculatorAllowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCalculatorAllowed: checked })}
                  />
                </div>

                {/* Question Type */}
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
                        <SelectValue placeholder={language === "ar" ? "اختر النوع" : "Select type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {types.length === 0 ? (
                          <SelectItem value="none" disabled>
                            {language === "ar" ? "لا توجد أنواع متاحة" : "No types available"}
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
                </div>
              </CardContent>
            </Card>

            {/* MCQ Single - Radio buttons for correct answer */}
            {isMCQSingle && (
              <Card className="border-2 shadow-sm overflow-hidden pt-0">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-b py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("questionBank.options")}</CardTitle>
                      <CardDescription>{language === "ar" ? "أضف خيارات الإجابة واختر الإجابة الصحيحة الوحيدة" : "Add answer options and select the single correct answer"}</CardDescription>
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
                        {/* Option Image */}
                        <div className="flex items-center gap-2">
                          {option.imagePreview ? (
                            <div className="relative group">
                              <img src={option.imagePreview} alt={`Option ${index + 1}`} className="h-16 w-24 object-cover rounded-md border" />
                              <button
                                type="button"
                                onClick={() => removeOptionImage(option.id)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors border border-dashed rounded-md px-2 py-1.5">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>{language === "ar" ? "إضافة صورة" : "Add Image"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleOptionImageSelect(option.id, e)}
                              />
                            </label>
                          )}
                        </div>
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
                    <Plus className="me-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* MCQ Multi - Checkboxes for multiple correct answers */}
            {isMCQMulti && (
              <Card className="border-2 shadow-sm overflow-hidden pt-0">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-950/50 dark:to-violet-900/30 border-b py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("questionBank.options")}</CardTitle>
                      <CardDescription>{language === "ar" ? "أضف خيارات الإجابة وحدد جميع الإجابات الصحيحة" : "Add answer options and check all correct answers"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                      {language === "ar" ? "يمكن أن تكون إجابات متعددة صحيحة. حدد كل ما ينطبق." : "Multiple answers can be correct. Check all that apply."}
                    </AlertDescription>
                  </Alert>

                  {/* Partial Scoring Summary */}
                  {(() => {
                    const hasAnyPoints = options.some((opt) => opt.points != null && opt.points !== undefined)
                    if (!hasAnyPoints) return null
                    const sum = options.reduce((acc, opt) => acc + (opt.points || 0), 0)
                    const isValid = Math.abs(sum - formData.points) < 0.01
                    return (
                      <div className={`flex items-center justify-between rounded-lg border-2 px-4 py-2 text-sm font-medium ${isValid ? "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700" : "border-destructive bg-destructive/10 text-destructive"}`}>
                        <span>{language === "ar" ? "مجموع نقاط الخيارات" : "Option Points Sum"}: {sum}</span>
                        <span>{language === "ar" ? "إجمالي نقاط السؤال" : "Question Total"}: {formData.points}</span>
                        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                    )
                  })()}

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
                        {/* Per-option points for partial scoring */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`option-points-${option.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                            {language === "ar" ? "النقاط" : "Points"}
                          </Label>
                          <Input
                            id={`option-points-${option.id}`}
                            type="number"
                            min={0}
                            step="any"
                            placeholder="0"
                            value={option.points ?? ""}
                            onChange={(e) => updateOption(option.id, { points: e.target.value === "" ? null : Number(e.target.value) })}
                            className="border-2 h-8 w-24 text-sm"
                          />
                        </div>
                        {/* Option Image */}
                        <div className="flex items-center gap-2">
                          {option.imagePreview ? (
                            <div className="relative group">
                              <img src={option.imagePreview} alt={`Option ${index + 1}`} className="h-16 w-24 object-cover rounded-md border" />
                              <button
                                type="button"
                                onClick={() => removeOptionImage(option.id)}
                                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors border border-dashed rounded-md px-2 py-1.5">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>{language === "ar" ? "إضافة صورة" : "Add Image"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleOptionImageSelect(option.id, e)}
                              />
                            </label>
                          )}
                        </div>
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
                    <Plus className="me-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* True/False */}
            {isTrueFalse && (
              <Card className="border-2 shadow-sm overflow-hidden pt-0">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-b py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                      <ListChecks className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language === "ar" ? "الإجابة الصحيحة" : "Correct Answer"}</CardTitle>
                      <CardDescription>{language === "ar" ? "حدد ما إذا كانت العبارة صحيحة أم خاطئة" : "Select whether the statement is true or false"}</CardDescription>
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
                      <CheckCircle2 className="me-2 h-5 w-5" />
                      {language === "ar" ? "صحيح" : "True"}
                    </Button>
                    <Button
                      type="button"
                      variant={trueFalseAnswer === "false" ? "default" : "outline"}
                      className={`flex-1 h-14 text-lg border-2 ${trueFalseAnswer === "false" ? "bg-red-600 hover:bg-red-700" : ""}`}
                      onClick={() => handleTrueFalseChange("false")}
                    >
                      <AlertCircle className="me-2 h-5 w-5" />
                      {language === "ar" ? "خطأ" : "False"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subjective - Manual Grading with AI Suggestion */}
            {isSubjective && (
              <Card className="border-2 shadow-sm overflow-hidden pt-0">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/30 border-b py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language === "ar" ? "الإجابة النموذجية / معايير التقييم" : "Model Answer / Grading Rubric"}</CardTitle>
                      <CardDescription>
                        {language === "ar"
                          ? "هذا السؤال يتطلب تصحيح يدوي مع اقتراح ذكاء اصطناعي. أدخل الإجابة النموذجية كمرجع للمُقيّم"
                          : "This question requires manual grading with AI suggestion. Enter a model answer as a reference for the grader"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                      {language === "ar"
                        ? "الأسئلة الذاتية تحتاج تصحيح يدوي مع دعم اقتراح الذكاء الاصطناعي. الإجابة النموذجية أدناه ستظهر كمرجع أثناء التصحيح."
                        : "Subjective questions require manual grading with AI suggestion support. The model answer below will be displayed as a reference during grading."}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rubricEn" className="text-sm font-semibold">
                        {language === "ar" ? "الإجابة النموذجية (English)" : "Model Answer (English)"}
                      </Label>
                      <Textarea
                        id="rubricEn"
                        placeholder="Enter model answer or grading rubric in English..."
                        value={answerKey.rubricTextEn}
                        onChange={(e) => setAnswerKey({ ...answerKey, rubricTextEn: e.target.value })}
                        rows={5}
                        className="resize-none border-2 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rubricAr" className="text-sm font-semibold">
                        {language === "ar" ? "الإجابة النموذجية (العربية)" : "Model Answer (العربية)"}
                      </Label>
                      <Textarea
                        id="rubricAr"
                        placeholder="أدخل الإجابة النموذجية أو معايير التقييم..."
                        value={answerKey.rubricTextAr}
                        onChange={(e) => setAnswerKey({ ...answerKey, rubricTextAr: e.target.value })}
                        rows={5}
                        dir="rtl"
                        className="resize-none border-2 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
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
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Plus className="me-2 h-4 w-4" />
                    {language === "ar" ? "إنشاء سؤال" : "Create Question"}
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
