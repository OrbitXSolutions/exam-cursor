"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
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
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner"
import { getQuestionById, updateQuestion } from "@/lib/api/question-bank"
import { getQuestionTypes, getQuestionSubjects, getQuestionTopics, type QuestionType, type QuestionSubject, type QuestionTopic } from "@/lib/api/lookups"
import type { Question } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, GripVertical, ImageIcon, Upload, X, Calculator } from "lucide-react"
import type { QuestionAttachment } from "@/lib/types"
import { addQuestionAttachment, deleteQuestionAttachment } from "@/lib/api/question-bank"

interface OptionInput {
  id: string
  textEn: string
  textAr: string
  isCorrect: boolean
  order: number
  originalId?: number
  imageFile?: File | null
  imagePreview?: string | null
  attachmentPath?: string | null
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
    isCalculatorAllowed: false,
  })

  const [options, setOptions] = useState<OptionInput[]>([])

  // Image attachment state
  const [existingAttachments, setExistingAttachments] = useState<QuestionAttachment[]>([])
  const [newImage, setNewImage] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
          isCalculatorAllowed: q.isCalculatorAllowed || false,
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
              attachmentPath: opt.attachmentPath || null,
              imagePreview: opt.attachmentPath || null,
            })),
          )
        }
        // Load existing attachments
        if (q.attachments && q.attachments.length > 0) {
          setExistingAttachments(q.attachments)
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
      toast.error(localizeText("Failed to load question data", "فشل تحميل بيانات السؤال", language))
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
      toast.error(localizeText("At least 2 options are required", "مطلوب خياران على الأقل", language))
      return
    }
    setOptions(options.filter((opt) => opt.id !== id).map((opt, idx) => ({ ...opt, order: idx })))
  }

  const updateOption = (id: string, updates: Partial<OptionInput>) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)))
  }

  const selectedType = types.find((t) => String(t.id) === formData.questionTypeId)
  const isSubjectiveType = selectedType?.nameEn === "Subjective" || selectedType?.nameEn === "Essay" || selectedType?.nameEn === "Short Answer"
  const isEssayType = isSubjectiveType

  // Image handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setNewImage(file)
    const reader = new FileReader()
    reader.onload = (ev) => setNewImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removeNewImage = () => {
    setNewImage(null)
    setNewImagePreview(null)
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

  const handleDeleteAttachment = async (attachment: QuestionAttachment) => {
    try {
      await deleteQuestionAttachment(attachment.id)
      setExistingAttachments(prev => prev.filter(a => a.id !== attachment.id))
      toast.success(localizeText('Attachment removed', 'تم إزالة المرفق', language))
    } catch {
      toast.error(localizeText('Failed to remove attachment', 'فشل إزالة المرفق', language))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bodyEn.trim()) {
      toast.error(localizeText("Question body (English) is required", "نص السؤال (بالإنجليزية) مطلوب", language))
      return
    }

    if (!isEssayType) {
      const hasCorrectAnswer = options.some((opt) => opt.isCorrect)
      if (!hasCorrectAnswer) {
        toast.error(localizeText("At least one option must be marked as correct", "يجب تحديد خيار واحد كإجابة صحيحة على الأقل", language))
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
        isCalculatorAllowed: formData.isCalculatorAllowed,
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

      // Upload new image if selected
      if (isSuccess && newImage) {
        try {
          setIsUploadingImage(true)
          const formDataUpload = new FormData()
          formDataUpload.append('file', newImage)
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
            if (filePath) {
              await addQuestionAttachment(Number(questionId), {
                fileName: newImage.name,
                filePath: filePath,
                fileType: 'Image',
                fileSize: newImage.size,
                isPrimary: existingAttachments.filter(a => a.fileType?.toLowerCase().includes('image')).length === 0,
              })
            }
          }
        } catch (imgErr) {
          console.warn('Image upload failed:', imgErr)
          toast.warning(localizeText('Question updated but image upload failed.', 'تم تحديث السؤال لكن فشل رفع الصورة.', language))
        } finally {
          setIsUploadingImage(false)
        }
      }

      // Upload option images and bulk update options
      if (isSuccess && !isEssayType && options.length > 0) {
        try {
          const apiBase = '/api/proxy'
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

          // Upload new option images
          const updatedOptions = await Promise.all(
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

          // Bulk update options with attachmentPath
          const bulkPayload = updatedOptions
            .filter(opt => opt.originalId)
            .map(opt => ({
              id: opt.originalId!,
              textEn: opt.textEn,
              textAr: opt.textAr || opt.textEn,
              isCorrect: opt.isCorrect,
              order: opt.order,
              attachmentPath: opt.attachmentPath || null,
            }))

          if (bulkPayload.length > 0) {
            await fetch(`${apiBase}/QuestionBank/questions/${questionId}/options/bulk`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(bulkPayload),
            })
          }
        } catch (optErr) {
          console.warn('Option update failed:', optErr)
        }
      }

      if (isSuccess) {
        toast.success(localizeText("Question updated successfully", "تم تحديث السؤال بنجاح", language))
        router.push(`/question-bank/${questionId}`)
      } else {
        toast.error((response as any)?.message || localizeText("Failed to update question", "فشل تحديث السؤال", language))
      }
    } catch (error) {
      console.error("[v0] Update error:", error)
      toast.error(localizeText("Failed to update question", "فشل تحديث السؤال", language))
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
        <PageHeader title={language === "ar" ? "السؤال غير موجود" : "Question Not Found"} />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">{language === "ar" ? "السؤال الذي تبحث عنه غير موجود." : "The question you are looking for does not exist."}</p>
          <Button variant="outline" asChild className="mt-4 bg-transparent">
            <Link href="/question-bank">
              <ArrowLeft className="me-2 h-4 w-4" />
              {language === "ar" ? "العودة إلى بنك الأسئلة" : "Back to Question Bank"}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={t("questionBank.editQuestion")} subtitle={language === "ar" ? `سؤال #${question.id}` : `Question #${question.id}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={`/question-bank/${question.id}`}>
              <ArrowLeft className="me-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Details */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "تفاصيل السؤال" : "Question Details"}</CardTitle>
                <CardDescription>{language === "ar" ? "تعديل محتوى السؤال والإعدادات" : "Edit the question content and settings"}</CardDescription>
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

                {/* Question Image / Chart Attachment */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {language === "ar" ? "صورة السؤال / مخطط (اختياري)" : "Question Image / Chart (Optional)"}
                  </Label>

                  {/* Existing Attachments */}
                  {existingAttachments.filter(a => a.fileType?.toLowerCase().includes('image')).map((att) => (
                    <div key={att.id} className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                      <div className="relative w-full max-h-64 overflow-hidden rounded-lg">
                        <Image
                          src={att.filePath}
                          alt={att.fileName}
                          width={800}
                          height={400}
                          className="w-full h-auto max-h-60 object-contain rounded-lg"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {att.fileName} ({(att.fileSize / 1024).toFixed(1)} KB)
                          </p>
                          {att.isPrimary && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Primary</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 me-1" />
                          {language === "ar" ? "إزالة" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* New Image Upload */}
                  {newImagePreview ? (
                    <div className="relative rounded-xl border-2 border-dashed border-green-500/30 bg-green-50/50 dark:bg-green-950/20 p-4">
                      <div className="relative w-full max-h-64 overflow-hidden rounded-lg">
                        <img
                          src={newImagePreview}
                          alt="New image preview"
                          className="w-full h-auto max-h-60 object-contain rounded-lg"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          <span className="text-green-600 dark:text-green-400 font-medium">New: </span>
                          {newImage?.name} ({((newImage?.size || 0) / 1024).toFixed(1)} KB)
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeNewImage}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4 me-1" />
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <div className="p-3 bg-muted rounded-full">
                        <Upload className="h-5 w-5 text-muted-foreground" />
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
                        <SelectValue placeholder={language === "ar" ? "اختر النوع" : "Select type"} />
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
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "يمكن استخدام السؤال في الاختبارات" : "Question can be used in exams"}</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                {/* Calculator Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium">{language === "ar" ? "السماح بالآلة الحاسبة" : "Allow Calculator"}</p>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "يمكن للمرشحين استخدام آلة حاسبة مدمجة لهذا السؤال" : "Candidates can use a built-in calculator for this question"}</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isCalculatorAllowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, isCalculatorAllowed: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            {!isEssayType && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.options")}</CardTitle>
                  <CardDescription>{language === "ar" ? "تعديل خيارات الإجابة والإجابات الصحيحة" : "Edit answer options and correct answers"}</CardDescription>
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
                        {/* Option Image */}
                        <div className="flex items-center gap-2">
                          {option.imagePreview ? (
                            <div className="relative group">
                              <img
                                src={option.imagePreview.startsWith('data:') || option.imagePreview.startsWith('/') || option.imagePreview.startsWith('http') ? option.imagePreview : `/media/${option.imagePreview}`}
                                alt={`Option ${index + 1}`}
                                className="h-16 w-24 object-cover rounded-md border"
                              />
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
                        className="shrink-0"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                    <Plus className="me-2 h-4 w-4" />
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
                {isSaving && <LoadingSpinner size="sm" className="me-2" />}
                {isSaving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ التغييرات" : "Save Changes")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
