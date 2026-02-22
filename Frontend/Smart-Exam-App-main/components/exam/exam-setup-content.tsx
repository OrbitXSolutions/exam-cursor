"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { ExamType, SectionSourceType, type Exam, type ExamBuilderDto, type BuilderSectionDto, type SaveBuilderSectionDto, type SaveExamBuilderRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
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
  BookOpen,
  Hash,
  Trash2,
  Plus,
  FolderTree,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { getExam, updateExam, getExamBuilder, saveExamBuilder, getQuestionsCount } from "@/lib/api/exams"
import { getQuestionSubjects, getQuestionTopics, type QuestionSubject, type QuestionTopic } from "@/lib/api/lookups"

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

  // ============ BUILDER STATE ============
  const [builderLoading, setBuilderLoading] = useState(false)
  const [builderSaving, setBuilderSaving] = useState(false)
  const [builderError, setBuilderError] = useState<string | null>(null)
  const [sourceType, setSourceType] = useState<SectionSourceType>(SectionSourceType.Subject)
  const [subjects, setSubjects] = useState<QuestionSubject[]>([])
  const [topics, setTopics] = useState<Map<number, QuestionTopic[]>>(new Map())
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
  const [questionsCount, setQuestionsCount] = useState<Map<string, number>>(new Map())
  const [builderSections, setBuilderSections] = useState<Array<{
    key: string // unique key for react
    questionSubjectId: number | null
    questionTopicId: number | null
    subjectNameEn: string
    subjectNameAr: string
    topicNameEn: string | null
    topicNameAr: string | null
    titleEn: string
    titleAr: string
    durationMinutes: number | null
    pickCount: number
    sourceType: SectionSourceType
    availableQuestionsCount: number
  }>>([])
  const [loadedBuilderData, setLoadedBuilderData] = useState<ExamBuilderDto | null>(null)

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

  // ============ BUILDER FUNCTIONS ============
  
  // Load subjects list
  const loadSubjects = useCallback(async () => {
    try {
      const response = await getQuestionSubjects({ pageSize: 500 })
      setSubjects(response.items || [])
    } catch (err) {
      console.error("Failed to load subjects:", err)
    }
  }, [])

  // Load topics for a subject
  const loadTopicsForSubject = useCallback(async (subjectId: number) => {
    try {
      const response = await getQuestionTopics({ subjectId, pageSize: 500 })
      setTopics(prev => new Map(prev).set(subjectId, response.items || []))
    } catch (err) {
      console.error(`Failed to load topics for subject ${subjectId}:`, err)
    }
  }, [])

  // Fetch questions count for a subject/topic
  const fetchQuestionsCount = useCallback(async (subjectId: number | null, topicId: number | null): Promise<number> => {
    const key = `${subjectId || 0}-${topicId || 0}`
    if (questionsCount.has(key)) {
      return questionsCount.get(key) || 0
    }
    try {
      const count = await getQuestionsCount(subjectId, topicId)
      setQuestionsCount(prev => new Map(prev).set(key, count))
      return count
    } catch (err) {
      console.error("Failed to fetch questions count:", err)
      return 0
    }
  }, [questionsCount])

  // Load existing builder configuration
  const loadBuilderData = useCallback(async () => {
    if (!examId) return
    
    try {
      setBuilderLoading(true)
      setBuilderError(null)
      const data = await getExamBuilder(examId)
      setLoadedBuilderData(data)
      
      if (data.sections && data.sections.length > 0) {
        setSourceType(data.sourceType)
        
        // Build sections from loaded data
        const loadedSections = data.sections.map((s, index) => ({
          key: `section-${s.id || index}-${Date.now()}`,
          questionSubjectId: s.questionSubjectId,
          questionTopicId: s.questionTopicId,
          subjectNameEn: s.subjectNameEn || "",
          subjectNameAr: s.subjectNameAr || "",
          topicNameEn: s.topicNameEn,
          topicNameAr: s.topicNameAr,
          titleEn: s.titleEn,
          titleAr: s.titleAr,
          durationMinutes: s.durationMinutes,
          pickCount: s.pickCount,
          sourceType: s.sourceType,
          availableQuestionsCount: s.availableQuestionsCount,
        }))
        
        setBuilderSections(loadedSections)
        
        // Use selected subject IDs from API or extract from sections
        const subjectIds = data.selectedSubjectIds?.length > 0 
          ? data.selectedSubjectIds 
          : [...new Set(data.sections.map(s => s.questionSubjectId).filter(Boolean) as number[])]
        setSelectedSubjectIds(subjectIds)
        
        if (data.sourceType === SectionSourceType.Topic) {
          const topicIds = data.sections.map(s => s.questionTopicId).filter(Boolean) as number[]
          setSelectedTopicIds(topicIds)
          // Load topics for each subject
          for (const sid of subjectIds) {
            await loadTopicsForSubject(sid)
          }
        }
      }
    } catch (err) {
      // If no builder data exists, that's okay - it's a fresh exam
      console.log("No existing builder data or error loading:", err)
    } finally {
      setBuilderLoading(false)
    }
  }, [examId, loadTopicsForSubject])

  // Load subjects and builder data when switching to builder tab
  useEffect(() => {
    if (currentTab === "builder" && isEditMode) {
      loadSubjects()
      loadBuilderData()
    }
  }, [currentTab, isEditMode, loadSubjects, loadBuilderData])

  // Toggle subject selection
  const toggleSubject = async (subjectId: number, checked: boolean) => {
    const subject = subjects.find(s => s.id === subjectId)
    if (!subject) return

    if (checked) {
      setSelectedSubjectIds(prev => [...prev, subjectId])
      
      if (sourceType === SectionSourceType.Subject) {
        // Add section for this subject
        const count = await fetchQuestionsCount(subjectId, null)
        setBuilderSections(prev => [...prev, {
          key: `subject-${subjectId}-${Date.now()}`,
          questionSubjectId: subjectId,
          questionTopicId: null,
          subjectNameEn: subject.nameEn,
          subjectNameAr: subject.nameAr,
          topicNameEn: null,
          topicNameAr: null,
          titleEn: subject.nameEn,
          titleAr: subject.nameAr,
          durationMinutes: null,
          pickCount: Math.min(10, count),
          sourceType: SectionSourceType.Subject,
          availableQuestionsCount: count,
        }])
      } else {
        // Load topics for this subject
        await loadTopicsForSubject(subjectId)
      }
    } else {
      setSelectedSubjectIds(prev => prev.filter(id => id !== subjectId))
      
      if (sourceType === SectionSourceType.Subject) {
        // Remove section for this subject
        setBuilderSections(prev => prev.filter(s => s.questionSubjectId !== subjectId))
      } else {
        // Remove all topic sections for this subject
        const subjectTopics = topics.get(subjectId) || []
        const topicIds = subjectTopics.map(t => t.id)
        setSelectedTopicIds(prev => prev.filter(id => !topicIds.includes(id)))
        setBuilderSections(prev => prev.filter(s => s.questionSubjectId !== subjectId))
      }
    }
  }

  // Toggle topic selection
  const toggleTopic = async (topic: QuestionTopic, checked: boolean) => {
    if (checked) {
      setSelectedTopicIds(prev => [...prev, topic.id])
      
      // Add section for this topic
      const count = await fetchQuestionsCount(topic.subjectId, topic.id)
      setBuilderSections(prev => [...prev, {
        key: `topic-${topic.id}-${Date.now()}`,
        questionSubjectId: topic.subjectId,
        questionTopicId: topic.id,
        subjectNameEn: topic.subjectNameEn || "",
        subjectNameAr: topic.subjectNameAr || "",
        topicNameEn: topic.nameEn,
        topicNameAr: topic.nameAr,
        titleEn: topic.nameEn,
        titleAr: topic.nameAr,
        durationMinutes: null,
        pickCount: Math.min(10, count),
        sourceType: SectionSourceType.Topic,
        availableQuestionsCount: count,
      }])
    } else {
      setSelectedTopicIds(prev => prev.filter(id => id !== topic.id))
      setBuilderSections(prev => prev.filter(s => s.questionTopicId !== topic.id))
    }
  }

  // Handle source type change
  const handleSourceTypeChange = (newType: string) => {
    const newSourceType = Number(newType) as SectionSourceType
    setSourceType(newSourceType)
    // Clear sections when changing source type
    setBuilderSections([])
    setSelectedSubjectIds([])
    setSelectedTopicIds([])
  }

  // Update section field
  const updateSectionField = (key: string, field: string, value: number | string | null) => {
    setBuilderSections(prev => prev.map(s => {
      if (s.key === key) {
        const updated = { ...s, [field]: value }
        // Validate pickCount doesn't exceed available
        if (field === "pickCount" && typeof value === "number") {
          updated.pickCount = Math.max(1, Math.min(value, s.availableQuestionsCount))
        }
        return updated
      }
      return s
    }))
  }

  // Remove a section
  const removeSection = (key: string) => {
    const section = builderSections.find(s => s.key === key)
    if (!section) return
    
    if (section.sourceType === SectionSourceType.Subject && section.questionSubjectId) {
      setSelectedSubjectIds(prev => prev.filter(id => id !== section.questionSubjectId))
    } else if (section.sourceType === SectionSourceType.Topic && section.questionTopicId) {
      setSelectedTopicIds(prev => prev.filter(id => id !== section.questionTopicId))
    }
    
    setBuilderSections(prev => prev.filter(s => s.key !== key))
  }

  // Save builder configuration
  const handleSaveBuilder = async () => {
    if (!examId) return
    
    if (builderSections.length === 0) {
      setBuilderError("Please add at least one section")
      return
    }

    // Validate all sections have pickCount >= 1
    const invalidSection = builderSections.find(s => s.pickCount < 1)
    if (invalidSection) {
      setBuilderError("Pick count must be at least 1 for all sections")
      return
    }

    try {
      setBuilderSaving(true)
      setBuilderError(null)

      const request: SaveExamBuilderRequest = {
        sourceType,
        sections: builderSections.map((s, index) => ({
          questionSubjectId: s.questionSubjectId,
          questionTopicId: s.questionTopicId,
          titleEn: s.titleEn,
          titleAr: s.titleAr,
          durationMinutes: s.durationMinutes,
          pickCount: s.pickCount,
          sourceType: s.sourceType,
          order: index + 1,
        })),
      }

      const result = await saveExamBuilder(examId, request)
      setLoadedBuilderData(result)
      toast.success("Builder configuration saved successfully")
      // Redirect to exam overview page
      router.push(`/exams/${examId}/overview`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save builder"
      setBuilderError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setBuilderSaving(false)
    }
  }

  // Get total questions count from all sections
  const getTotalQuestionsCount = () => {
    return builderSections.reduce((sum, s) => sum + s.pickCount, 0)
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
          <Link href="/exams/list">
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

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" asChild>
                <Link href="/exams/list">{t("common.cancel") || "Cancel"}</Link>
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
                  ? t("common.loading") || "Loading..."
                  : isEditMode
                    ? t("common.save") || "Save"
                    : "Save & Continue"}
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
          ) : builderLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Builder Error Alert */}
              {builderError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{builderError}</AlertDescription>
                </Alert>
              )}

              {/* Summary Stats */}
              {builderSections.length > 0 && (
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Sections:</span>
                          <Badge variant="secondary">{builderSections.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Total Questions:</span>
                          <Badge variant="secondary">{getTotalQuestionsCount()}</Badge>
                        </div>
                      </div>
                      <Button onClick={handleSaveBuilder} disabled={builderSaving || builderSections.length === 0}>
                        {builderSaving ? (
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 me-2" />
                        )}
                        {builderSaving ? "Saving..." : "Save Builder"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Source Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Blocks className="h-5 w-5" />
                    Build Mode
                  </CardTitle>
                  <CardDescription>
                    Choose how to structure your exam sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={String(sourceType)}
                    onValueChange={handleSourceTypeChange}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={String(SectionSourceType.Subject)} id="bySubject" />
                      <Label htmlFor="bySubject" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          By Subject
                        </div>
                        <p className="text-xs text-muted-foreground font-normal">
                          One section per subject
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={String(SectionSourceType.Topic)} id="byTopic" />
                      <Label htmlFor="byTopic" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FolderTree className="h-4 w-4" />
                          By Topic
                        </div>
                        <p className="text-xs text-muted-foreground font-normal">
                          One section per topic
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Subject Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <BookOpen className="h-5 w-5" />
                    Select Subjects
                  </CardTitle>
                  <CardDescription>
                    {sourceType === SectionSourceType.Subject
                      ? "Each selected subject will become a section in your exam"
                      : "Select subjects to see their topics"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No subjects found in Question Bank</p>
                      <p className="text-sm">Create subjects in the Question Bank first</p>
                    </div>
                  ) : sourceType === SectionSourceType.Subject ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subjects.map(subject => (
                        <div
                          key={subject.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                            selectedSubjectIds.includes(subject.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={selectedSubjectIds.includes(subject.id)}
                            onCheckedChange={(checked) => toggleSubject(subject.id, checked as boolean)}
                          />
                          <Label htmlFor={`subject-${subject.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{subject.nameEn}</span>
                            {subject.topicsCount !== undefined && (
                              <span className="text-xs text-muted-foreground ms-2">
                                ({subject.topicsCount} topics)
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Topic mode - show accordion with subjects and topics */
                    <Accordion type="multiple" className="w-full">
                      {subjects.map(subject => (
                        <AccordionItem key={subject.id} value={`subject-${subject.id}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pe-2">
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  id={`subject-expand-${subject.id}`}
                                  checked={selectedSubjectIds.includes(subject.id)}
                                  onCheckedChange={(checked) => toggleSubject(subject.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium">{subject.nameEn}</span>
                                {subject.topicsCount !== undefined && (
                                  <Badge variant="outline" className="text-xs">
                                    {subject.topicsCount} topics
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {selectedSubjectIds.includes(subject.id) ? (
                              <div className="ps-8 space-y-2">
                                {topics.get(subject.id)?.length ? (
                                  topics.get(subject.id)!.map(topic => (
                                    <div
                                      key={topic.id}
                                      className={`flex items-center space-x-3 p-2 rounded-md border transition-colors ${
                                        selectedTopicIds.includes(topic.id)
                                          ? "border-primary bg-primary/5"
                                          : "border-transparent hover:bg-muted"
                                      }`}
                                    >
                                      <Checkbox
                                        id={`topic-${topic.id}`}
                                        checked={selectedTopicIds.includes(topic.id)}
                                        onCheckedChange={(checked) => toggleTopic(topic, checked as boolean)}
                                      />
                                      <Label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer text-sm">
                                        {topic.nameEn}
                                      </Label>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground py-2">
                                    Loading topics...
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="ps-8 text-sm text-muted-foreground py-2">
                                Select this subject to see its topics
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Section Configuration */}
              {builderSections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Settings className="h-5 w-5" />
                      Configure Sections
                    </CardTitle>
                    <CardDescription>
                      Set duration and question count for each section
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {builderSections.map((section, index) => (
                      <div
                        key={section.key}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {section.titleEn}
                              </h4>
                              {section.sourceType === SectionSourceType.Topic && section.subjectNameEn && (
                                <p className="text-xs text-muted-foreground">
                                  Subject: {section.subjectNameEn}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {section.availableQuestionsCount} available
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeSection(section.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`title-${section.key}`}>Section Title</Label>
                            <Input
                              id={`title-${section.key}`}
                              value={section.titleEn}
                              onChange={(e) => updateSectionField(section.key, "titleEn", e.target.value)}
                              placeholder="Section title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`duration-${section.key}`}>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Duration (minutes)
                              </div>
                            </Label>
                            <Input
                              id={`duration-${section.key}`}
                              type="number"
                              min="1"
                              value={section.durationMinutes ?? ""}
                              onChange={(e) => updateSectionField(section.key, "durationMinutes", e.target.value ? Number(e.target.value) : null)}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`pickCount-${section.key}`}>
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                Questions to Pick
                              </div>
                            </Label>
                            <Input
                              id={`pickCount-${section.key}`}
                              type="number"
                              min="1"
                              max={section.availableQuestionsCount}
                              value={section.pickCount}
                              onChange={(e) => updateSectionField(section.key, "pickCount", Number(e.target.value) || 1)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Max: {section.availableQuestionsCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              {builderSections.length > 0 && (
                <div className="flex justify-end gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/exams/list">{t("common.cancel") || "Cancel"}</Link>
                  </Button>
                  <Button onClick={handleSaveBuilder} disabled={builderSaving}>
                    {builderSaving ? (
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 me-2" />
                    )}
                    {builderSaving ? "Saving..." : "Save Builder Configuration"}
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {builderSections.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Blocks className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Sections Added
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      {sourceType === SectionSourceType.Subject
                        ? "Select subjects above to create exam sections"
                        : "Select subjects and their topics above to create exam sections"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
