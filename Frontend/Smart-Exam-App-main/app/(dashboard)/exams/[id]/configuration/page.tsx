"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { 
  getExam, 
  updateExam, 
  getExamInstructions,
  createInstruction,
  updateInstruction,
  deleteInstruction,
  getAccessPolicy,
  saveAccessPolicy,
  getWalkInFields,
  saveWalkInField,
  deleteWalkInField,
  reorderWalkInFields,
} from "@/lib/api/exams"
import type { Exam, ExamInstruction, ExamAccessPolicy, WalkInField } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, Save, Settings, Shield, FileText, Eye, Lock, Plus, Pencil, Trash2, GripVertical, Key, Globe, Users, CheckCircle2, XCircle, ShieldCheck, AlertTriangle, Camera, Monitor, ListChecks, ChevronUp, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ExamConfigurationPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language, dir, isRTL } = useI18n()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Instructions State
  const [instructions, setInstructions] = useState<ExamInstruction[]>([])
  const [instructionDialogOpen, setInstructionDialogOpen] = useState(false)
  const [editingInstruction, setEditingInstruction] = useState<ExamInstruction | null>(null)
  const [instructionForm, setInstructionForm] = useState({ contentEn: "", contentAr: "" })
  const [savingInstruction, setSavingInstruction] = useState(false)
  
  // Access Policy State
  const [accessPolicy, setAccessPolicy] = useState<ExamAccessPolicy | null>(null)
  const [accessPolicyForm, setAccessPolicyForm] = useState({
    isPublic: false,
    accessCode: "",
    restrictToAssignedCandidates: false,
    isWalkIn: false,
  })
  const [savingAccessPolicy, setSavingAccessPolicy] = useState(false)
  const [activeTab, setActiveTab] = useState("settings")

  // Walk-In Registration Fields State
  const [walkInFields, setWalkInFields] = useState<WalkInField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [walkInFieldDialogOpen, setWalkInFieldDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<WalkInField | null>(null)
  const [fieldForm, setFieldForm] = useState<{
    labelEn: string
    labelAr: string
    fieldType: 1 | 2
    isRequired: boolean
    displayOrder: number
  }>({ labelEn: "", labelAr: "", fieldType: 1, isRequired: false, displayOrder: 0 })
  const [savingField, setSavingField] = useState(false)
  const [deleteConfirmFieldId, setDeleteConfirmFieldId] = useState<number | null>(null)
  
  // Exam Settings State
  const [formData, setFormData] = useState({
    // Basic Settings
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: true,
    allowReview: false,
    showCorrectAnswers: false,
    // Security Settings
    requireProctoring: true,
    requireIdVerification: true,
    preventCopyPaste: true,
    preventScreenCapture: true,
    requireWebcam: true,
    requireFullscreen: true,
    browserLockdown: true,
    maxViolationWarnings: 0,
    // Screen Monitoring
    enableScreenMonitoring: false,
    screenMonitoringMode: 0,
    screenShareGracePeriod: 20,
  })
  
  // Result Message State
  const [resultMessage, setResultMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [examData, instructionsData, policyData] = await Promise.all([
        getExam(id),
        getExamInstructions(id),
        getAccessPolicy(id),
      ])
      
      console.log("[v0] Configuration page - exam data:", examData)
      console.log("[v0] Configuration page - instructions:", instructionsData)
      console.log("[v0] Configuration page - access policy:", policyData)
      
      setExam(examData)
      setInstructions(instructionsData.sort((a, b) => a.order - b.order))
      setAccessPolicy(policyData)
      
      // Load exam settings
      if (examData) {
        setFormData({
          shuffleQuestions: examData.shuffleQuestions || false,
          shuffleOptions: examData.shuffleOptions || false,
          showResults: examData.showResults !== false,
          allowReview: examData.allowReview || false,
          showCorrectAnswers: examData.showCorrectAnswers || false,
          requireProctoring: examData.requireProctoring || false,
          requireIdVerification: examData.requireIdVerification || false,
          preventCopyPaste: examData.preventCopyPaste || false,
          preventScreenCapture: examData.preventScreenCapture || false,
          requireWebcam: examData.requireWebcam || false,
          requireFullscreen: examData.requireFullscreen || false,
          browserLockdown: examData.browserLockdown || false,
          maxViolationWarnings: examData.maxViolationWarnings ?? 0,
          enableScreenMonitoring: examData.enableScreenMonitoring || false,
          screenMonitoringMode: examData.screenMonitoringMode ?? 0,
          screenShareGracePeriod: examData.screenShareGracePeriod ?? 20,
        })
      }
      
      // Load access policy
      if (policyData) {
        setAccessPolicyForm({
          isPublic: policyData.isPublic || false,
          accessCode: policyData.accessCode || "",
          restrictToAssignedCandidates: policyData.restrictToAssignedCandidates || false,
          isWalkIn: policyData.isWalkIn || false,
        })
        // Auto-load walk-in fields if walk-in is already enabled
        if (policyData.isWalkIn) {
          const fieldsData = await getWalkInFields(id)
          setWalkInFields(fieldsData)
        }
      }
    } catch (error) {
      console.log("[v0] Configuration page - error:", error)
      toast.error(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  // Load walk-in fields on demand (e.g. when user enables walk-in mid-session)
  async function loadWalkInFields() {
    try {
      setLoadingFields(true)
      const data = await getWalkInFields(id)
      setWalkInFields(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setLoadingFields(false)
    }
  }

  // Walk-In Field CRUD
  function openAddField() {
    setEditingField(null)
    setFieldForm({
      labelEn: "",
      labelAr: "",
      fieldType: 1,
      isRequired: false,
      displayOrder: walkInFields.length,
    })
    setWalkInFieldDialogOpen(true)
  }

  function openEditField(field: WalkInField) {
    setEditingField(field)
    setFieldForm({
      labelEn: field.labelEn,
      labelAr: field.labelAr,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      displayOrder: field.displayOrder,
    })
    setWalkInFieldDialogOpen(true)
  }

  async function handleSaveField() {
    if (!fieldForm.labelEn.trim()) {
      toast.error(language === "ar" ? "التسمية الإنجليزية مطلوبة" : "English label is required")
      return
    }
    if (!fieldForm.labelAr.trim()) {
      toast.error(language === "ar" ? "التسمية العربية مطلوبة" : "Arabic label is required")
      return
    }
    try {
      setSavingField(true)
      await saveWalkInField(id, editingField?.id ?? null, fieldForm)
      toast.success(t("common.saved"))
      const updated = await getWalkInFields(id)
      setWalkInFields(updated)
      setWalkInFieldDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setSavingField(false)
    }
  }

  async function handleDeleteField(fieldId: number) {
    try {
      await deleteWalkInField(id, fieldId)
      toast.success(t("common.deleteSuccess"))
      setWalkInFields(prev => prev.filter(f => f.id !== fieldId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"))
    } finally {
      setDeleteConfirmFieldId(null)
    }
  }

  async function handleMoveField(fieldId: number, direction: "up" | "down") {
    const idx = walkInFields.findIndex(f => f.id === fieldId)
    if (idx === -1) return
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === walkInFields.length - 1) return

    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    const reordered = [...walkInFields]
    const tmp = reordered[idx].displayOrder
    reordered[idx] = { ...reordered[idx], displayOrder: reordered[swapIdx].displayOrder }
    reordered[swapIdx] = { ...reordered[swapIdx], displayOrder: tmp }
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]
    setWalkInFields(reordered)

    try {
      await reorderWalkInFields(id, reordered.map((f, i) => ({ fieldId: f.id, displayOrder: i })))
      const updated = await getWalkInFields(id)
      setWalkInFields(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"))
    }
  }

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      // If allowReview is turned off, also turn off showCorrectAnswers
      if (field === "allowReview" && value === false) {
        updated.showCorrectAnswers = false
      }
      return updated
    })
  }

  // Helper to show result message and scroll to it
  function showResult(type: "success" | "error", message: string) {
    setResultMessage({ type, message })
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
    // Auto-clear success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => setResultMessage(null), 5000)
    }
  }

  // Save Exam Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    
    if (!exam) return
    
    // Validation: ShowCorrectAnswers can only be true if AllowReview is also true
    if (formData.showCorrectAnswers && !formData.allowReview) {
      showResult("error", t("exams.requiresAllowReview"))
      return
    }
    
    try {
      setSaving(true)
      setResultMessage(null)
      
      // Backend requires full exam object for PUT update
      const updatePayload = {
        titleEn: exam.titleEn,
        titleAr: exam.titleAr,
        descriptionEn: exam.descriptionEn,
        descriptionAr: exam.descriptionAr,
        departmentId: exam.departmentId,
        examType: exam.examType,
        durationMinutes: exam.durationMinutes,
        maxAttempts: exam.maxAttempts,
        passScore: exam.passScore,
        startAt: exam.startAt,
        endAt: exam.endAt,
        isActive: exam.isActive,
        // Updated settings from form
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        showResults: formData.showResults,
        allowReview: formData.allowReview,
        showCorrectAnswers: formData.showCorrectAnswers,
        requireProctoring: formData.requireProctoring,
        requireIdVerification: formData.requireIdVerification,
        preventCopyPaste: formData.preventCopyPaste,
        preventScreenCapture: formData.preventScreenCapture,
        requireWebcam: formData.requireWebcam,
        requireFullscreen: formData.requireFullscreen,
        browserLockdown: formData.browserLockdown,
        maxViolationWarnings: formData.maxViolationWarnings,
        enableScreenMonitoring: formData.enableScreenMonitoring,
        screenMonitoringMode: formData.enableScreenMonitoring ? 3 : 0,
        screenShareGracePeriod: formData.screenShareGracePeriod,
      }
      
      console.log("[v0] Saving exam settings (full payload):", updatePayload)
      await updateExam(id, updatePayload)
      toast.success(t("common.saved"))
      showResult("success", t("common.saved"))
      
      // Update local exam state with new values
      setExam(prev => prev ? { ...prev, ...formData } : null)
    } catch (error) {
      console.log("[v0] Save settings error:", error)
      const msg = error instanceof Error ? error.message : t("common.error")
      toast.error(msg)
      showResult("error", msg)
    } finally {
      setSaving(false)
    }
  }

  // Instructions Management
  function openAddInstruction() {
    setEditingInstruction(null)
    setInstructionForm({ contentEn: "", contentAr: "" })
    setInstructionDialogOpen(true)
  }

  function openEditInstruction(instruction: ExamInstruction) {
    setEditingInstruction(instruction)
    setInstructionForm({ contentEn: instruction.contentEn, contentAr: instruction.contentAr })
    setInstructionDialogOpen(true)
  }

  async function handleSaveInstruction() {
    if (!instructionForm.contentEn.trim()) {
      toast.error(t("exams.instructionContentRequired"))
      return
    }
    if (!instructionForm.contentAr.trim()) {
      toast.error(language === "ar" ? "المحتوى العربي مطلوب" : "Arabic content is required")
      return
    }
    
    try {
      setSavingInstruction(true)
      setResultMessage(null)
      
      if (editingInstruction) {
        // Update existing
        console.log("[v0] Updating instruction:", editingInstruction.id, instructionForm)
        await updateInstruction(editingInstruction.id, instructionForm)
        toast.success(t("common.saved"))
        showResult("success", t("common.saved"))
      } else {
        // Create new
        const newOrder = instructions.length + 1
        console.log("[v0] Creating instruction:", { ...instructionForm, order: newOrder })
        await createInstruction(id, { ...instructionForm, order: newOrder })
        toast.success(t("common.added"))
        showResult("success", t("common.added"))
      }
      
      // Reload instructions
      const updatedInstructions = await getExamInstructions(id)
      setInstructions(updatedInstructions.sort((a, b) => a.order - b.order))
      setInstructionDialogOpen(false)
    } catch (error) {
      console.log("[v0] Save instruction error:", error)
      const msg = error instanceof Error ? error.message : t("common.error")
      toast.error(msg)
      showResult("error", msg)
    } finally {
      setSavingInstruction(false)
    }
  }

  async function handleDeleteInstruction(instructionId: number) {
    if (!confirm(t("common.confirmDelete"))) return
    
    try {
      console.log("[v0] Deleting instruction:", instructionId)
      await deleteInstruction(instructionId)
      toast.success(t("common.deleted"))
      
      // Reload instructions
      const updatedInstructions = await getExamInstructions(id)
      setInstructions(updatedInstructions.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.log("[v0] Delete instruction error:", error)
      toast.error(error instanceof Error ? error.message : t("common.error"))
    }
  }

  // Access Policy Management
  async function handleSaveAccessPolicy() {
    try {
      setSavingAccessPolicy(true)
      console.log("[v0] Saving access policy:", accessPolicyForm)
      await saveAccessPolicy(id, accessPolicyForm)
      toast.success(t("common.saved"))
      showResult("success", t("common.saved"))
      
      // Reload access policy
      const updatedPolicy = await getAccessPolicy(id)
      setAccessPolicy(updatedPolicy)
    } catch (error) {
      console.log("[v0] Save access policy error:", error)
      const msg = error instanceof Error ? error.message : t("common.error")
      toast.error(msg)
      showResult("error", msg)
    } finally {
      setSavingAccessPolicy(false)
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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-10" dir={dir}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams/list">
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.configuration")}</h1>
          <p className="text-muted-foreground mt-1">
            {language === "ar" ? (exam.titleAr || exam.titleEn) : (exam.titleEn || exam.titleAr)}
          </p>
        </div>
      </div>

      {/* Result Message at Top */}
      <div ref={resultRef}>
        {resultMessage && (
          <Alert variant={resultMessage.type === "error" ? "destructive" : "default"} className={resultMessage.type === "success" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : ""}>
            {resultMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{resultMessage.type === "success" ? t("common.saved") : t("common.error")}</AlertTitle>
            <AlertDescription>{resultMessage.message}</AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" dir={dir}>
        <TabsList className={`grid w-full ${accessPolicyForm.isWalkIn ? "grid-cols-5" : "grid-cols-4"}`} dir={dir}>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t("exams.examSettings")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("exams.securitySettings")}</span>
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t("exams.examInstructions")}</span>
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">{t("exams.accessPolicy")}</span>
          </TabsTrigger>
          {accessPolicyForm.isWalkIn && (
            <TabsTrigger
              value="registration-fields"
              className="flex items-center gap-2"
              onClick={() => { if (walkInFields.length === 0 && !loadingFields) loadWalkInFields() }}
            >
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">{t("exams.registrationFields")}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Exam Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <form onSubmit={handleSaveSettings}>
            <Card>
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Settings className="h-5 w-5" />
                  {t("exams.examSettings")}
                </CardTitle>
                <CardDescription>{t("exams.examSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.shuffleQuestions")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.shuffleQuestionsDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.shuffleQuestions}
                      onCheckedChange={(checked) => updateField("shuffleQuestions", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.shuffleOptions")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.shuffleOptionsDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.shuffleOptions}
                      onCheckedChange={(checked) => updateField("shuffleOptions", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base font-medium">{t("exams.showResults")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.showResultsDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.showResults}
                      onCheckedChange={(checked) => updateField("showResults", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.allowReview")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.allowReviewDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.allowReview}
                      onCheckedChange={(checked) => updateField("allowReview", checked)}
                    />
                  </div>
                  
                  <div className={`flex items-center justify-between p-4 border rounded-lg ${!formData.allowReview ? "opacity-50" : ""}`}>
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.showCorrectAnswers")}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t("exams.showCorrectAnswersDesc")}
                        {!formData.allowReview && (
                          <span className="block text-xs text-amber-600 mt-1">
                            {t("exams.requiresAllowReview")}
                          </span>
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={formData.showCorrectAnswers}
                      onCheckedChange={(checked) => updateField("showCorrectAnswers", checked)}
                      disabled={!formData.allowReview}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 me-2" />
                    {saving ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <form onSubmit={handleSaveSettings}>
            <Card>
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  {t("exams.securitySettings")}
                </CardTitle>
                <CardDescription>{t("exams.securitySettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4">
                  {/* Activate All Toggle */}
                  <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-linear-to-r from-teal-50/80 to-emerald-50/80 dark:from-teal-950/30 dark:to-emerald-950/30 border-teal-300 dark:border-teal-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-teal-600" />
                        <Label className="text-base font-bold">
                          {language === "ar" ? "تفعيل جميع إعدادات الأمان" : "Activate All Security Settings"}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? "تبديل جميع خيارات الأمان دفعة واحدة"
                          : "Toggle all security options at once"}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.requireProctoring &&
                        formData.requireWebcam &&
                        formData.requireIdVerification &&
                        formData.preventCopyPaste &&
                        formData.preventScreenCapture &&
                        formData.requireFullscreen &&
                        formData.browserLockdown &&
                        formData.enableScreenMonitoring
                      }
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          requireProctoring: checked,
                          requireWebcam: checked,
                          requireIdVerification: checked,
                          preventCopyPaste: checked,
                          preventScreenCapture: checked,
                          requireFullscreen: checked,
                          browserLockdown: checked,
                          enableScreenMonitoring: checked,
                          screenMonitoringMode: checked ? 3 : 0,
                        }))
                      }}
                    />
                  </div>

                  <div className="border-b" />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base font-medium">{t("exams.requireProctoring")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.requireProctoringDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.requireProctoring}
                      onCheckedChange={(checked) => updateField("requireProctoring", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base font-medium">{t("exams.requireWebcam")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.requireWebcamDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.requireWebcam}
                      onCheckedChange={(checked) => updateField("requireWebcam", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.requireIdVerification")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.requireIdVerificationDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.requireIdVerification}
                      onCheckedChange={(checked) => updateField("requireIdVerification", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base font-medium">{t("exams.preventCopyPaste")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.preventCopyPasteDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.preventCopyPaste}
                      onCheckedChange={(checked) => updateField("preventCopyPaste", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.preventScreenCapture")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.preventScreenCaptureDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.preventScreenCapture}
                      onCheckedChange={(checked) => updateField("preventScreenCapture", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">{t("exams.requireFullscreen")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.requireFullscreenDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.requireFullscreen}
                      onCheckedChange={(checked) => updateField("requireFullscreen", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-red-600" />
                        <Label className="text-base font-medium">{t("exams.browserLockdown")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.browserLockdownDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.browserLockdown}
                      onCheckedChange={(checked) => updateField("browserLockdown", checked)}
                    />
                  </div>

                  {/* Screen Monitoring */}
                  <div className="p-4 border-2 rounded-lg bg-linear-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-300 dark:border-purple-800">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-5 w-5 text-purple-600" />
                            <Label className="text-base font-bold">
                              {language === "ar" ? "مراقبة الشاشة" : "Screen Monitoring"}
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar"
                              ? "السماح للمراقب بمشاهدة شاشة المرشح أثناء الاختبار"
                              : "Enable proctor to view candidate's screen during the exam"}
                          </p>
                        </div>
                        <Switch
                          checked={formData.enableScreenMonitoring}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              enableScreenMonitoring: checked,
                              screenMonitoringMode: checked ? 3 : 0,
                            }))
                          }}
                        />
                      </div>

                      {formData.enableScreenMonitoring && (
                        <div className="space-y-4 pt-2 border-t border-purple-200 dark:border-purple-800">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              {language === "ar" ? "فترة السماح (بالثواني)" : "Grace Period (seconds)"}
                            </Label>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={5}
                                max={120}
                                value={formData.screenShareGracePeriod}
                                onChange={(e) => updateField("screenShareGracePeriod", Math.max(5, Math.min(120, Number(e.target.value) || 20)))}
                                className="w-24 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-center font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              />
                              <span className="text-sm text-muted-foreground">
                                {language === "ar"
                                  ? `تحذير ثم إجراء بعد ${formData.screenShareGracePeriod} ثانية`
                                  : `Warning then action after ${formData.screenShareGracePeriod} seconds`}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-b" />

                  {/* Max Violation Warnings */}
                  <div className="p-4 border-2 rounded-lg bg-linear-to-r from-orange-50/80 to-red-50/80 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-800">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <Label className="text-base font-bold">{t("exams.maxViolationWarnings")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.maxViolationWarningsDesc")}</p>
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formData.maxViolationWarnings}
                          onChange={(e) => updateField("maxViolationWarnings", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                          className="w-24 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-center font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.maxViolationWarnings === 0
                            ? (language === "ar" ? "معطل (بدون إنهاء تلقائي)" : "Disabled (no auto-termination)")
                            : (language === "ar" ? `سيتم إنهاء الاختبار بعد ${formData.maxViolationWarnings} مخالفة` : `Exam will terminate after ${formData.maxViolationWarnings} violations`)}
                        </span>
                      </div>
                      <a
                        href="/tutorials/exams#section-violation-events"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 underline underline-offset-2"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {t("exams.maxViolationWarningsLearnMore")}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4 me-2" />
                    {saving ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    {t("exams.examInstructions")}
                  </CardTitle>
                  <CardDescription className="mt-1">{t("exams.examInstructionsDesc")}</CardDescription>
                </div>
                <Button onClick={openAddInstruction} size="sm">
                  <Plus className="h-4 w-4 me-2" />
                  {t("exams.addInstruction")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {instructions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">{t("exams.noInstructions")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t("exams.noInstructionsDesc")}</p>
                  <Button onClick={openAddInstruction}>
                    <Plus className="h-4 w-4 me-2" />
                    {t("exams.addInstruction")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {instructions.map((instruction, index) => (
                    <div
                      key={instruction.id}
                      className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 pt-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium">{instruction.contentEn}</p>
                        {instruction.contentAr && (
                          <p className="text-sm text-muted-foreground" dir="rtl">{instruction.contentAr}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditInstruction(instruction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInstruction(instruction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Policy Tab */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Key className="h-5 w-5" />
                {t("exams.accessPolicy")}
              </CardTitle>
              <CardDescription>{t("exams.accessPolicyDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">{t("exams.isPublic")}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("exams.isPublicDesc")}</p>
                  </div>
                  <Switch
                    checked={accessPolicyForm.isPublic}
                    onCheckedChange={(checked) => setAccessPolicyForm(prev => ({
                      ...prev,
                      isPublic: checked,
                      ...(checked ? { isWalkIn: false } : {}),
                    }))}
                  />
                </div>
                
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">{t("exams.accessCode")}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("exams.accessCodeDesc")}</p>
                  </div>
                  <Input
                    value={accessPolicyForm.accessCode}
                    onChange={(e) => setAccessPolicyForm(prev => ({ ...prev, accessCode: e.target.value }))}
                    placeholder={t("exams.accessCodePlaceholder")}
                    className="max-w-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-base font-medium">{t("exams.restrictToAssigned")}</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("exams.restrictToAssignedDesc")}</p>
                  </div>
                  <Switch
                    checked={accessPolicyForm.restrictToAssignedCandidates}
                    onCheckedChange={(checked) => setAccessPolicyForm(prev => ({
                      ...prev,
                      restrictToAssignedCandidates: checked,
                      ...(checked ? { isWalkIn: false } : {}),
                    }))}
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base font-medium">{t("exams.walkIn")}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{t("exams.walkInDesc")}</p>
                    </div>
                    <Switch
                      checked={accessPolicyForm.isWalkIn}
                      onCheckedChange={(checked) => setAccessPolicyForm(prev => ({
                        ...prev,
                        isWalkIn: checked,
                        ...(checked ? { isPublic: false, restrictToAssignedCandidates: false, accessCode: "" } : {}),
                      }))}
                    />
                  </div>
                  {accessPolicyForm.isWalkIn && (
                    <div className="px-4 py-3 bg-primary/5 border-t flex items-center justify-between">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-primary" />
                        {language === "ar" ? "يمكنك إضافة حقول إضافية يجب على المرشحين ملؤها عند التسجيل" : "You can add extra fields candidates must fill when registering"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("registration-fields")
                          if (walkInFields.length === 0 && !loadingFields) loadWalkInFields()
                        }}
                        className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 shrink-0 ms-4"
                      >
                        {language === "ar" ? "إدارة الحقول" : "Manage Fields"}
                        {isRTL ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveAccessPolicy} disabled={savingAccessPolicy}>
                  <Save className="h-4 w-4 me-2" />
                  {savingAccessPolicy ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Fields Tab — Walk-In only */}
        {accessPolicyForm.isWalkIn && (
          <TabsContent value="registration-fields" className="space-y-6">
            <Card>
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <ListChecks className="h-5 w-5" />
                      {t("exams.registrationFields")}
                    </CardTitle>
                    <CardDescription className="mt-1">{t("exams.registrationFieldsDesc")}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {walkInFields.length >= 5
                        ? t("exams.fieldsLimitReached")
                        : t("exams.fieldsLimitHint")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium tabular-nums ${walkInFields.length >= 5 ? "text-destructive" : "text-muted-foreground"}`}>
                      {walkInFields.length} / 5
                    </span>
                    <Button onClick={openAddField} size="sm" disabled={loadingFields || walkInFields.length >= 5}>
                      <Plus className="h-4 w-4 me-2" />
                      {t("exams.addField")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingFields ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : walkInFields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">{t("exams.noRegistrationFields")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t("exams.noRegistrationFieldsDesc")}</p>
                    <Button onClick={openAddField} disabled={walkInFields.length >= 5}>
                      <Plus className="h-4 w-4 me-2" />
                      {t("exams.addField")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {walkInFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0}
                            onClick={() => handleMoveField(field.id, "up")}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === walkInFields.length - 1}
                            onClick={() => handleMoveField(field.id, "down")}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{field.labelEn}</span>
                            <span className="text-muted-foreground text-sm" dir="rtl">{field.labelAr}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {field.fieldType === 2 ? t("exams.fieldTypeNumber") : t("exams.fieldTypeText")}
                            </span>
                            {field.isRequired && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                                {t("exams.fieldRequired")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditField(field)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmFieldId(field.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}

                  <AlertDialog open={deleteConfirmFieldId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmFieldId(null) }}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("exams.deleteFieldConfirm")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("exams.deleteFieldConfirmDesc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => deleteConfirmFieldId !== null && handleDeleteField(deleteConfirmFieldId)}
                        >
                          {t("common.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Walk-In Field Dialog */}
      <Dialog open={walkInFieldDialogOpen} onOpenChange={setWalkInFieldDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle>
              {editingField ? t("exams.editField") : t("exams.addField")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fieldLabelEn">
                {t("exams.fieldLabelEn")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fieldLabelEn"
                value={fieldForm.labelEn}
                onChange={(e) => setFieldForm(prev => ({ ...prev, labelEn: e.target.value }))}
                placeholder={t("exams.fieldLabelEnPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldLabelAr">
                {t("exams.fieldLabelAr")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fieldLabelAr"
                value={fieldForm.labelAr}
                onChange={(e) => setFieldForm(prev => ({ ...prev, labelAr: e.target.value }))}
                placeholder={t("exams.fieldLabelArPlaceholder")}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("exams.fieldType")}</Label>
              <Select
                value={String(fieldForm.fieldType)}
                onValueChange={(v) => setFieldForm(prev => ({ ...prev, fieldType: Number(v) as 1 | 2 }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("exams.fieldTypeText")}</SelectItem>
                  <SelectItem value="2">{t("exams.fieldTypeNumber")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="fieldRequired" className="cursor-pointer">
                {t("exams.fieldRequired")}
              </Label>
              <Switch
                id="fieldRequired"
                checked={fieldForm.isRequired}
                onCheckedChange={(checked) => setFieldForm(prev => ({ ...prev, isRequired: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalkInFieldDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveField} disabled={savingField}>
              {savingField ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instruction Dialog */}
      <Dialog open={instructionDialogOpen} onOpenChange={setInstructionDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir={dir}>
          <DialogHeader>
            <DialogTitle>
              {editingInstruction ? t("exams.editInstruction") : t("exams.addInstruction")}
            </DialogTitle>
            <DialogDescription>
              {t("exams.instructionDialogDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contentEn">{t("exams.instructionsEn")} <span className="text-destructive">*</span></Label>
              <Textarea
                id="contentEn"
                value={instructionForm.contentEn}
                onChange={(e) => setInstructionForm(prev => ({ ...prev, contentEn: e.target.value }))}
                placeholder={t("exams.instructionsPlaceholderEn")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentAr">{t("exams.instructionsAr")} <span className="text-destructive">*</span></Label>
              <Textarea
                id="contentAr"
                value={instructionForm.contentAr}
                onChange={(e) => setInstructionForm(prev => ({ ...prev, contentAr: e.target.value }))}
                placeholder={t("exams.instructionsPlaceholderAr")}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveInstruction} disabled={savingInstruction}>
              {savingInstruction ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
