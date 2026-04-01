"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { ExamType } from "@/lib/types"
import type { Exam } from "@/lib/types"
import { getExams, cloneExam } from "@/lib/api/exams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import { localizeText } from "@/lib/i18n/runtime"
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Calendar,
  Clock,
  Timer,
  Copy,
  FileText,
  Settings,
  Search,
  CheckCircle2,
  Layers,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import Link from "next/link"

export default function CreateFromTemplatePage() {
  const { t, language } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [examsLoading, setExamsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Source exams list
  const [allExams, setAllExams] = useState<Exam[]>([])
  const [examSearch, setExamSearch] = useState("")
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Form data - user provides these
  const [formData, setFormData] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    examType: ExamType.Flex,
    startAt: "",
    endAt: "",
    durationMinutes: 60,
  })

  // Load published exams
  useEffect(() => {
    async function fetchExams() {
      try {
        setExamsLoading(true)
        const response = await getExams({ pageSize: 100 })
        if (response?.items && Array.isArray(response.items)) {
          // Show all exams (not just published) so user can pick any as template
          setAllExams(response.items)
        }
      } catch {
        toast.error(localizeText("Failed to load exams", "فشل في تحميل الاختبارات", language))
      } finally {
        setExamsLoading(false)
      }
    }
    fetchExams()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedExam = allExams.find((e) => e.id === selectedExamId) || null

  // Filter exams by search text
  const filteredExams = allExams.filter((exam) => {
    if (!examSearch) return true
    const s = examSearch.toLowerCase()
    return (
      exam.titleEn?.toLowerCase().includes(s) ||
      exam.titleAr?.toLowerCase().includes(s) ||
      ((exam as any).code && (exam as any).code.toLowerCase().includes(s))
    )
  })

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function handleSelectExam(examId: number) {
    setSelectedExamId(examId)
    setExamSearch("")
    setDropdownOpen(false)
    const exam = allExams.find((e) => e.id === examId)
    if (exam) {
      // Pre-fill duration from source exam
      setFormData((prev) => ({
        ...prev,
        durationMinutes: exam.durationMinutes || 60,
        examType: exam.examType ?? ExamType.Flex,
      }))
    }
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!selectedExamId) {
      setError(localizeText("Please select a template exam", "يرجى اختيار اختبار كقالب", language))
      return
    }
    if (!formData.titleEn.trim()) {
      setError(localizeText("Title (English) is required", "العنوان (الإنجليزي) مطلوب", language))
      return
    }
    if (formData.durationMinutes < 1 || formData.durationMinutes > 600) {
      setError(localizeText("Duration must be between 1 and 600 minutes", "المدة يجب أن تكون بين 1 و 600 دقيقة", language))
      return
    }
    if (formData.startAt && formData.endAt && new Date(formData.endAt) <= new Date(formData.startAt)) {
      setError(localizeText("End date must be after start date", "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء", language))
      return
    }

    try {
      setLoading(true)

      const result = await cloneExam(selectedExamId, {
        titleEn: formData.titleEn,
        titleAr: formData.titleAr || formData.titleEn,
        descriptionEn: formData.descriptionEn || undefined,
        descriptionAr: formData.descriptionAr || undefined,
        examType: formData.examType,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
        durationMinutes: formData.durationMinutes,
      })

      toast.success(localizeText("Exam created from template successfully!", "تم إنشاء الاختبار من القالب بنجاح!", language))
      router.push(`/exams/${result.id}/overview`)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || localizeText("Failed to create exam from template", "فشل في إنشاء الاختبار من القالب", language)
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function getExamTitle(exam: Exam): string {
    return (language === "ar" ? exam.titleAr : exam.titleEn) || exam.titleEn || (language === "ar" ? "بدون عنوان" : "Untitled")
  }

  function getExamStatus(exam: Exam): string {
    if ((exam as any).status) return (exam as any).status
    if (!exam.isActive) return "Archived"
    if (exam.isPublished) return "Published"
    return "Draft"
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams/list">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{language === "ar" ? "إنشاء اختبار من قالب" : "Create Exam from Template"}</h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? "استخدم اختبار موجود كقالب لإنشاء اختبار جديد بنفس الإعداد والأسئلة" : "Use an existing exam as a template to create a new exam with the same configuration and questions"}
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Template Exam */}
        <Card className="overflow-visible pt-0">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-4 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              {language === "ar" ? "اختيار اختبار كقالب" : "Select Template Exam"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "اختر اختبار موجود لاستخدامه كقالب. سيتم نسخ جميع الأقسام والأسئلة." : "Choose an existing exam to use as a template. All configuration, sections, questions, instructions, and access policy will be copied."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-visible min-h-[80px]">
            {examsLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <>
                {/* Dropdown selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 h-11 text-sm rounded-md border-2 bg-background hover:bg-accent/50 transition-colors"
                  >
                    <span className={selectedExam ? "text-foreground" : "text-muted-foreground"}>
                      {selectedExam ? getExamTitle(selectedExam) : (language === "ar" ? "اختر قالب اختبار..." : "Select an exam template...")}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border-2 bg-popover shadow-lg">
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={language === "ar" ? "البحث عن اختبارات بالاسم..." : "Search exams by name..."}
                            value={examSearch}
                            onChange={(e) => setExamSearch(e.target.value)}
                            className="ps-9 h-9 border"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Options list */}
                      <div className="max-h-80 overflow-y-auto divide-y">
                        {filteredExams.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">{language === "ar" ? "لم يتم العثور على اختبارات" : "No exams found"}</div>
                        ) : (
                          filteredExams.map((exam) => (
                            <button
                              key={exam.id}
                              type="button"
                              onClick={() => handleSelectExam(exam.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${
                                selectedExamId === exam.id ? "bg-primary/10 text-primary font-medium" : ""
                              }`}
                            >
                              {selectedExamId === exam.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              )}
                              <span className="truncate">{getExamTitle(exam)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Source Exam Preview */}
            {selectedExam && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{getExamTitle(selectedExam)}</h3>
                      {selectedExam.descriptionEn && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {language === "ar" ? selectedExam.descriptionAr : selectedExam.descriptionEn}
                        </p>
                      )}
                    </div>
                    <StatusBadge
                      status={getExamStatus(selectedExam)}
                      variant={selectedExam.isPublished ? "success" : "warning"}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">{language === "ar" ? "الأقسام" : "Sections"}</div>
                        <div className="font-medium">{selectedExam.sectionsCount || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">{language === "ar" ? "درجة النجاح" : "Pass Score"}</div>
                        <div className="font-medium">{selectedExam.passScore ?? 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">{language === "ar" ? "الأسئلة" : "Questions"}</div>
                        <div className="font-medium">{selectedExam.questionsCount || 0}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">{language === "ar" ? "المدة" : "Duration"}</div>
                        <div className="font-medium">{selectedExam.durationMinutes} {language === "ar" ? "دقيقة" : "min"}</div>
                      </div>
                    </div>
                  </div>

                  {/* What will be copied */}
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">{language === "ar" ? "سيتم نسخها من هذا القالب:" : "Will be copied from this template:"}</p>
                    <div className="flex flex-wrap gap-2">
                      {(language === "ar" ? [
                        "إعداد الاختبار",
                        "إعدادات الأمان",
                        "إعدادات المراقبة",
                        "إعدادات النتائج والمراجعة",
                        "جميع الأقسام والأسئلة",
                        "التعليمات",
                        "سياسة الوصول",
                      ] : [
                        "Exam Configuration",
                        "Security Settings",
                        "Proctoring Settings",
                        "Result & Review Settings",
                        "All Sections & Questions",
                        "Instructions",
                        "Access Policy",
                      ]).map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Exam Info */}
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-b py-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              {language === "ar" ? "معلومات الاختبار" : "Exam Information"}
            </CardTitle>
            <CardDescription>{language === "ar" ? "أدخل اسم ووصف جديد للاختبار المنسوخ" : "Provide a new name and description for the cloned exam"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleEn">
                  {language === "ar" ? "العنوان (بالإنجليزية)" : "Title (English)"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => updateField("titleEn", e.target.value)}
                  placeholder="Enter exam title in English"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleAr">{language === "ar" ? "العنوان (بالعربية)" : "Title (Arabic)"}</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => updateField("titleAr", e.target.value)}
                  placeholder="أدخل عنوان الاختبار بالعربية"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn">{language === "ar" ? "الوصف (بالإنجليزية)" : "Description (English)"}</Label>
                <Textarea
                  id="descriptionEn"
                  value={formData.descriptionEn}
                  onChange={(e) => updateField("descriptionEn", e.target.value)}
                  placeholder="Enter exam description in English"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionAr">{language === "ar" ? "الوصف (بالعربية)" : "Description (Arabic)"}</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => updateField("descriptionAr", e.target.value)}
                  placeholder="أدخل وصف الاختبار بالعربية"
                  dir="rtl"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Exam Timing */}
        <Card className="overflow-hidden pt-0">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-b py-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              {language === "ar" ? "توقيت الاختبار" : "Exam Timing"}
            </CardTitle>
            <CardDescription>{language === "ar" ? "حدد الجدول والمدة للاختبار الجديد" : "Set the schedule and duration for the new exam"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exam Type */}
            <div className="space-y-3">
              <Label>{language === "ar" ? "نوع الاختبار" : "Exam Type"}</Label>
              <RadioGroup
                value={formData.examType.toString()}
                onValueChange={(val) => updateField("examType", Number(val))}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="type-flex"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.examType === ExamType.Flex
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={ExamType.Flex.toString()} id="type-flex" className="mt-0.5" />
                  <div>
                    <div className="font-medium">{language === "ar" ? "مرن" : "Flexible"}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "ar" ? "يمكن للمرشحين البدء في أي وقت ضمن فترة التوفر" : "Candidates can start anytime within the availability window"}
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="type-fixed"
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    formData.examType === ExamType.Fixed
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/30"
                  }`}
                >
                  <RadioGroupItem value={ExamType.Fixed.toString()} id="type-fixed" className="mt-0.5" />
                  <div>
                    <div className="font-medium">{language === "ar" ? "ثابت" : "Fixed"}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === "ar" ? "يبدأ جميع المرشحين في نفس الوقت بالضبط" : "All candidates start at the exact same time"}
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt" className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {language === "ar" ? "تاريخ ووقت البدء" : "Start Date & Time"}
                </Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => updateField("startAt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt" className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {language === "ar" ? "تاريخ ووقت الانتهاء" : "End Date & Time"}
                </Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => updateField("endAt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5" />
                  {language === "ar" ? "المدة (بالدقائق)" : "Duration (minutes)"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={600}
                  value={formData.durationMinutes}
                  onChange={(e) => updateField("durationMinutes", Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <Settings className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            {language === "ar" ? "سيتم إنشاء الاختبار الجديد كمسودة. يمكنك مراجعته وتعديله قبل النشر." : <>The new exam will be created as a <strong>Draft</strong>. All configuration settings, sections, questions, instructions, and access policy from the template will be copied. You can edit any settings after creation.</>}
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/exams/list">{language === "ar" ? "إلغاء" : "Cancel"}</Link>
          </Button>
          <Button type="submit" disabled={loading || !selectedExamId}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="me-2" />
                {language === "ar" ? "جارٍ الإنشاء..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {language === "ar" ? "إنشاء من قالب" : "Create from Template"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
