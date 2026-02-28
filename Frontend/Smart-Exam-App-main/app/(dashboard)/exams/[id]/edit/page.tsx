"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { ExamType, type Exam } from "@/lib/types"
import { getExam, updateExam } from "@/lib/api/exams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, Save, Zap, AlertCircle, Calendar, Clock, Timer, Target, RefreshCw, FileText, Settings } from "lucide-react"
import Link from "next/link"

export default function EditExamPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)

  const [formData, setFormData] = useState({
    examType: ExamType.Flex,
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    startAt: "",
    endAt: "",
    durationMinutes: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    passScore: 0,
    isActive: true,
  })

  useEffect(() => {
    loadExam()
  }, [id])

  async function loadExam() {
    try {
      setLoading(true)
      const examData = await getExam(id)
      setExam(examData)
      
      // Populate form with exam data
      setFormData({
        examType: examData.examType,
        titleEn: examData.titleEn || "",
        titleAr: examData.titleAr || "",
        descriptionEn: examData.descriptionEn || "",
        descriptionAr: examData.descriptionAr || "",
        startAt: examData.startAt ? formatDateTimeLocal(examData.startAt) : "",
        endAt: examData.endAt ? formatDateTimeLocal(examData.endAt) : "",
        durationMinutes: examData.durationMinutes || 60,
        maxAttempts: examData.maxAttempts || 1,
        shuffleQuestions: examData.shuffleQuestions || false,
        shuffleOptions: examData.shuffleOptions || false,
        passScore: examData.passScore || 0,
        isActive: examData.isActive ?? true,
      })
    } catch (err) {
      setError("Failed to load exam")
      toast.error("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  function formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.titleEn.trim()) {
      setError(t("exams.errorTitleRequired"))
      return
    }
    if (formData.durationMinutes < 1 || formData.durationMinutes > 600) {
      setError(t("exams.errorDurationRange"))
      return
    }
    // StartAt and EndAt are required for both exam types
    if (!formData.startAt) {
      setError(t("exams.errorStartAtRequired") || "Start date & time is required")
      return
    }
    if (!formData.endAt) {
      setError(t("exams.errorEndAtRequired") || "End date & time is required")
      return
    }
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      setError(t("exams.errorEndBeforeStart") || "End date must be after start date")
      return
    }

    try {
      setSaving(true)

      // Build request body - include all required fields for PUT
      const requestBody = {
        departmentId: exam?.departmentId || 1,
        examType: formData.examType,
        titleEn: formData.titleEn,
        titleAr: formData.titleAr || formData.titleEn,
        descriptionEn: formData.descriptionEn || null,
        descriptionAr: formData.descriptionAr || null,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : null,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
        durationMinutes: formData.durationMinutes,
        maxAttempts: formData.maxAttempts,
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        passScore: formData.passScore,
        isActive: formData.isActive,
      }

      await updateExam(id, requestBody)
      toast.success(t("common.saved"))
      router.push(`/exams/${id}/overview`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update exam"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
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
        <p className="text-muted-foreground">{t("exams.notFound")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams/list">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.edit")}</h1>
          <p className="text-muted-foreground mt-1">{exam.titleEn}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              {t("exams.basicInfo")}
            </CardTitle>
            <CardDescription>{t("exams.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleEn">{t("exams.titleEn")} *</Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => updateField("titleEn", e.target.value)}
                  placeholder={t("exams.titleEnPlaceholder")}
                  className="w-full h-11"
                  maxLength={500}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">{t("exams.titleAr")}</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => updateField("titleAr", e.target.value)}
                  placeholder={t("exams.titleArPlaceholder")}
                  className="w-full h-11"
                  dir="rtl"
                  maxLength={500}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{t("exams.descriptionEn")}</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => updateField("descriptionEn", e.target.value)}
                  placeholder={t("exams.descriptionEnPlaceholder")}
                  rows={3}
                  maxLength={2000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{t("exams.descriptionAr")}</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => updateField("descriptionAr", e.target.value)}
                  placeholder={t("exams.descriptionArPlaceholder")}
                  rows={3}
                  dir="rtl"
                  maxLength={2000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              {t("exams.examType")}
            </CardTitle>
            <CardDescription>{t("exams.examTypeDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={String(formData.examType)}
              onValueChange={(value) => updateField("examType", Number(value))}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Label
                htmlFor="exam-type-flex"
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.examType === ExamType.Flex
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={String(ExamType.Flex)} id="exam-type-flex" className="mt-1" />
                <div className="space-y-1">
                  <span className="font-medium">{t("exams.examTypeFlex")}</span>
                  <p className="text-sm text-muted-foreground">{t("exams.examTypeFlexDesc")}</p>
                </div>
              </Label>
              <Label
                htmlFor="exam-type-fixed"
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.examType === ExamType.Fixed
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={String(ExamType.Fixed)} id="exam-type-fixed" className="mt-1" />
                <div className="space-y-1">
                  <span className="font-medium">{t("exams.examTypeFixed")}</span>
                  <p className="text-sm text-muted-foreground">{t("exams.examTypeFixedDesc")}</p>
                </div>
              </Label>
            </RadioGroup>

            {/* Schedule — Start & End DateTime for both Flexible and Fixed */}
              <div className="pt-4 border-t space-y-4">
                <p className="text-sm text-muted-foreground">
                  {formData.examType === ExamType.Fixed
                    ? (t("exams.fixedScheduleHelp") || "All candidates must start at the exact scheduled time.")
                    : (t("exams.flexScheduleHelp") || "Candidates can start anytime within the availability window.")}
                </p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("exams.startAt") || "Start Date & Time"} *
                    </Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={formData.startAt}
                      onChange={(e) => updateField("startAt", e.target.value)}
                      className="w-full h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {t("exams.endAt") || "End Date & Time"} *
                    </Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={formData.endAt}
                      onChange={(e) => updateField("endAt", e.target.value)}
                      className="w-full h-11"
                      required
                    />
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Timing & Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              {t("exams.timingSettings")}
            </CardTitle>
            <CardDescription>{t("exams.timingSettingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  {t("exams.durationMinutes")} *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="600"
                  value={formData.durationMinutes}
                  onChange={(e) => updateField("durationMinutes", Number.parseInt(e.target.value) || 60)}
                  className="w-full h-11"
                />
                <p className="text-xs text-muted-foreground">{t("exams.durationRange")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingScore" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  {t("exams.passScorePoints")} *
                </Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  value={formData.passScore}
                  onChange={(e) => updateField("passScore", Number.parseInt(e.target.value) || 0)}
                  className="w-full h-11"
                />
                <p className="text-xs text-muted-foreground">{t("exams.passScoreHint")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttempts" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  {t("exams.maxAttempts")}
                </Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min="0"
                  value={formData.maxAttempts}
                  onChange={(e) => updateField("maxAttempts", Number.parseInt(e.target.value) || 1)}
                  className="w-full h-11"
                />
                <p className="text-xs text-muted-foreground">{t("exams.maxAttemptsHint")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Settings className="h-5 w-5" />
              {t("exams.displayOptions")}
            </CardTitle>
            <CardDescription>{t("exams.displayOptionsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("exams.shuffleQuestions")}</Label>
                <p className="text-sm text-muted-foreground">{t("exams.shuffleQuestionsDesc")}</p>
              </div>
              <Switch
                checked={formData.shuffleQuestions}
                onCheckedChange={(checked) => updateField("shuffleQuestions", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("exams.shuffleOptions")}</Label>
                <p className="text-sm text-muted-foreground">{t("exams.shuffleOptionsDesc")}</p>
              </div>
              <Switch
                checked={formData.shuffleOptions}
                onCheckedChange={(checked) => updateField("shuffleOptions", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("exams.isActive")}</Label>
                <p className="text-sm text-muted-foreground">{t("exams.isActiveDesc")}</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => updateField("isActive", checked)} />
            </div>
          </CardContent>
        </Card>

        {/* Error before submit */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/exams/list">{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 me-2" />
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
