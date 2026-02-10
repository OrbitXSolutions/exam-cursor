"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { ExamType, type Exam } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ArrowLeft,
  Save,
  Zap,
  AlertCircle,
  Calendar,
  Clock,
  Timer,
  Target,
  RefreshCw,
  FileText,
  Settings,
  Loader2,
  Blocks,
  ArrowRight,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { getExam, updateExam } from "@/lib/api/exams"

interface ExamSetupContentProps {
  examId?: string
}

export function ExamSetupContent({ examId }: ExamSetupContentProps) {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get tab from query string, default to "config"
  const currentTab = searchParams.get("tab") || "config"

  const isEditMode = !!examId
  const [loading, setLoading] = useState(false)
  const [loadingExam, setLoadingExam] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)

  // Form data matching API spec
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

  // Load exam data in edit mode
  useEffect(() => {
    if (isEditMode && examId) {
      loadExamData()
    }
  }, [examId])

  async function loadExamData() {
    try {
      setLoadingExam(true)
      const exam = await getExam(examId!)

      // Format dates for datetime-local input
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return ""
        const date = new Date(dateStr)
        return date.toISOString().slice(0, 16)
      }

      setFormData({
        examType: exam.examType,
        titleEn: exam.titleEn,
        titleAr: exam.titleAr || "",
        descriptionEn: exam.descriptionEn || "",
        descriptionAr: exam.descriptionAr || "",
        startAt: formatDate(exam.startAt),
        endAt: formatDate(exam.endAt),
        durationMinutes: exam.durationMinutes,
        maxAttempts: exam.maxAttempts,
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        passScore: exam.passScore,
        isActive: exam.isActive,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load exam"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingExam(false)
    }
  }

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function handleTabChange(tab: string) {
    // Update URL with new tab
    const url = isEditMode ? `/exams/setup/${examId}?tab=${tab}` : `/exams/setup?tab=${tab}`
    router.replace(url)
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
    if (formData.examType === ExamType.Fixed && !formData.startAt) {
      setError("Start date is required for Fixed exam type")
      return
    }

    try {
      setLoading(true)

      const requestBody = {
        departmentId: 1,
        examType: formData.examType,
        titleEn: formData.titleEn,
        titleAr: formData.titleAr || formData.titleEn,
        descriptionEn: formData.descriptionEn || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        durationMinutes: formData.durationMinutes,
        maxAttempts: formData.maxAttempts,
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        passScore: formData.passScore,
        isActive: formData.isActive,
      }

      if (isEditMode) {
        // Update existing exam
        await updateExam(examId!, requestBody)
        toast.success(t("exams.updateSuccess") || "Exam updated successfully")
      } else {
        // Create new exam
        const response = await apiClient.post("/Assessment/exams", requestBody) as any

        if (response?.success === false) {
          setError(response.message || "Failed to create exam")
          return
        }

        const newExamId = response?.data?.id || response?.id
        toast.success(t("exams.createSuccess"))

        if (newExamId) {
          // Navigate to edit mode with builder tab
          router.push(`/exams/setup/${newExamId}?tab=builder`)
          return
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save exam"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingExam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditMode ? t("exams.editExam") || "Edit Exam" : t("exams.create")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode
              ? t("exams.editExamSubtitle") || "Update exam configuration and build content"
              : t("exams.createSubtitle")}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t("exams.configuration") || "Configuration"}
          </TabsTrigger>
          <TabsTrigger
            value="builder"
            className="flex items-center gap-2"
            disabled={!isEditMode}
          >
            <Blocks className="h-4 w-4" />
            {t("exams.builder") || "Builder"}
            {!isEditMode && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
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

                {/* Fixed Exam Only - Show Start Time */}
                {formData.examType === ExamType.Fixed && (
                  <div className="pt-4 border-t space-y-4">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startAt" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {t("exams.startAt")} *
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
                          {t("exams.endAt")}
                        </Label>
                        <Input
                          id="endAt"
                          type="datetime-local"
                          value={formData.endAt}
                          onChange={(e) => updateField("endAt", e.target.value)}
                          className="w-full h-11"
                        />
                      </div>
                    </div>
                  </div>
                )}
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/exams">{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : isEditMode ? (
                  <Save className="h-4 w-4 me-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 me-2" />
                )}
                {loading
                  ? t("common.loading")
                  : isEditMode
                    ? t("common.save") || "Save"
                    : t("exams.saveAndContinue") || "Save & Continue"}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {!isEditMode ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("exams.builderLocked") || "Builder Locked"}
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {t("exams.pleaseCreateExamFirst") || "Please save the exam configuration first to unlock the Builder tab."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => handleTabChange("config")}
                >
                  <Settings className="h-4 w-4 me-2" />
                  {t("exams.goToConfiguration") || "Go to Configuration"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Blocks className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("exams.welcomeToBuilder") || "Welcome to Builder"}
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {t("exams.builderDescription") || "Build your exam by adding sections and questions."}
                </p>
                <div className="bg-muted px-4 py-2 rounded-md">
                  <span className="text-sm text-muted-foreground">Exam ID: </span>
                  <span className="font-mono font-semibold">{examId}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
