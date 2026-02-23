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
} from "@/lib/api/exams"
import type { Exam, ExamInstruction, ExamAccessPolicy } from "@/lib/types"
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
import { toast } from "sonner"
import { ArrowLeft, Save, Settings, Shield, FileText, Eye, Lock, Plus, Pencil, Trash2, GripVertical, Key, Globe, Users, CheckCircle2, XCircle } from "lucide-react"

export default function ExamConfigurationPage() {
  const { id } = useParams<{ id: string }>()
  const { t, language } = useI18n()
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
  })
  const [savingAccessPolicy, setSavingAccessPolicy] = useState(false)
  
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
        })
      }
      
      // Load access policy
      if (policyData) {
        setAccessPolicyForm({
          isPublic: policyData.isPublic || false,
          accessCode: policyData.accessCode || "",
          restrictToAssignedCandidates: policyData.restrictToAssignedCandidates || false,
        })
      }
    } catch (error) {
      console.log("[v0] Configuration page - error:", error)
      toast.error(t("common.error"))
    } finally {
      setLoading(false)
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
      }
      
      console.log("[v0] Saving exam settings (full payload):", updatePayload)
      await updateExam(id, updatePayload)
      toast.success(t("common.saved"))
      showResult("success", t("common.saved"))
      
      // Update local exam state with new values
      setExam(prev => prev ? { ...prev, ...formData } : null)
    } catch (error) {
      console.log("[v0] Save settings error:", error)
      toast.error(t("common.error"))
      showResult("error", t("common.error"))
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
      toast.error(t("common.error"))
      showResult("error", t("common.error"))
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
      toast.error(t("common.error"))
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
      toast.error(t("common.error"))
      showResult("error", t("common.error"))
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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams/list">
            <ArrowLeft className="h-4 w-4" />
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

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
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
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-amber-600" />
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
                      <Label className="text-base font-medium">{t("exams.requireWebcam")}</Label>
                      <p className="text-sm text-muted-foreground">{t("exams.requireWebcamDesc")}</p>
                    </div>
                    <Switch
                      checked={formData.requireWebcam}
                      onCheckedChange={(checked) => updateField("requireWebcam", checked)}
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
                    onCheckedChange={(checked) => setAccessPolicyForm(prev => ({ ...prev, isPublic: checked }))}
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
                    onCheckedChange={(checked) => setAccessPolicyForm(prev => ({ ...prev, restrictToAssignedCandidates: checked }))}
                  />
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
      </Tabs>

      {/* Instruction Dialog */}
      <Dialog open={instructionDialogOpen} onOpenChange={setInstructionDialogOpen}>
        <DialogContent className="sm:max-w-lg">
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
              <Label htmlFor="contentAr">{t("exams.instructionsAr")}</Label>
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
