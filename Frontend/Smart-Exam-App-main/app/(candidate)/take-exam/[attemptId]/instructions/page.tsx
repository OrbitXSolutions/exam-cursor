"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getExamPreview,
  startExam,
  type ExamPreview,
  MOCK_EXAM_PREVIEW,
} from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, PlayCircle, Clock, FileText, AlertTriangle, Shield, Monitor, Camera, Wifi, Award, XCircle } from "lucide-react"

// Helper function to get localized field
function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

const EXAM_LANGUAGE_KEY = "examLanguage"

export default function ExamInstructionsPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const examId = Number.parseInt(attemptId, 10)
  const { t, language, setLanguage } = useI18n()
  const router = useRouter()
  const [examPreview, setExamPreview] = useState<ExamPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [examLanguage, setExamLanguage] = useState<"en" | "ar">(language)
  const [accessCode, setAccessCode] = useState("")
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null)

  useEffect(() => {
    loadExamPreview()
  }, [examId])

  async function loadExamPreview() {
    try {
      if (Number.isNaN(examId)) {
        throw new Error("Invalid exam ID")
      }

      // Single API call to get exam preview with eligibility
      const preview = await getExamPreview(examId)
      console.log("[v0] Loaded exam preview:", preview)
      setExamPreview(preview)
    } catch (error) {
      console.log("[v0] API error, using mock data:", error)
      // Fallback to mock data
      setExamPreview({ ...MOCK_EXAM_PREVIEW, examId })
    } finally {
      setLoading(false)
    }
  }

  async function handleStartExam() {
    if (!agreed) {
      toast.error(t("instructions.pleaseAgree"))
      return
    }

    if (!examPreview?.eligibility.canStartNow) {
      toast.error(examPreview?.eligibility.reasons[0] || t("common.errorOccurred"))
      return
    }

    try {
      setStarting(true)
      setAccessCodeError(null) // Clear any previous errors
      // Persist exam language so the exam page uses it; apply immediately
      if (typeof window !== "undefined") {
        window.localStorage.setItem(EXAM_LANGUAGE_KEY, examLanguage)
      }
      setLanguage(examLanguage)
      // Start the exam - this creates/resumes the attempt
      // Only include accessCode in request if it has a value
      const request: { accessCode?: string } = accessCode.trim() ? { accessCode: accessCode.trim() } : {}
      const session = await startExam(examId, request)
      console.log("[v0] Exam started, attemptId:", session.attemptId)
      // Redirect to exam taking page with attemptId
      router.push(`/take-exam/${session.attemptId}`)
    } catch (error: unknown) {
      console.error("[v0] Error starting exam:", error)
      const errorMessage = error instanceof Error ? error.message : t("common.errorOccurred")
      // Set the error state for display
      setAccessCodeError(errorMessage)
      toast.error(errorMessage)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!examPreview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg">{t("exams.notFound")}</p>
        <Button variant="outline" asChild>
          <Link href="/my-exams">
            <ArrowLeft className="h-4 w-4 me-2" />
            {t("common.back")}
          </Link>
        </Button>
      </div>
    )
  }

  const canStart = examPreview.eligibility.canStartNow
  const attemptsRemaining = examPreview.eligibility.attemptsRemaining

  // Default instructions based on settings
  const defaultInstructions = [
    {
      icon: Clock,
      title: t("instructions.timeLimit"),
      description: t("instructions.timeLimitDesc", { minutes: String(examPreview.durationMinutes) }),
    },
    {
      icon: Monitor,
      title: t("instructions.fullscreen"),
      description: t("instructions.fullscreenDesc"),
    },
    {
      icon: Wifi,
      title: t("instructions.connection"),
      description: t("instructions.connectionDesc"),
    },
    {
      icon: FileText,
      title: t("instructions.answers"),
      description: t("instructions.answersDesc"),
    },
  ]

  const warnings = [
    t("instructions.warning1"),
    t("instructions.warning2"),
    t("instructions.warning3"),
    t("instructions.warning4"),
  ]

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center px-6">
          <Button variant="ghost" size="icon" asChild className="me-4">
            <Link href="/my-exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{getLocalizedField(examPreview, "title", language)}</h1>
            <p className="text-sm text-muted-foreground">
              {getLocalizedField(examPreview, "description", language)}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 px-6">
        <div className="w-full max-w-3xl space-y-6">
          {/* Error Alert - Top */}
          {accessCodeError && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-red-700">
                  <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{accessCodeError}</p>
                    <p className="text-sm mt-1 text-red-600">
                      {t("exams.enterAccessCode")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Exam Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("instructions.examInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("instructions.duration")}</p>
                    <p className="font-medium">
                      {examPreview.durationMinutes} {t("common.minutes")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("exams.totalQuestions")}</p>
                    <p className="font-medium">{examPreview.totalQuestions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("exams.passScore")}</p>
                    <p className="font-medium">{examPreview.passScore} / {examPreview.totalPoints}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("myExams.attempts")}</p>
                    <p className="font-medium">
                      {examPreview.eligibility.attemptsUsed} / {examPreview.maxAttempts === 0 ? "∞" : examPreview.maxAttempts}
                      <span className="text-xs text-muted-foreground ms-1">
                        ({attemptsRemaining} {t("common.remaining")})
                      </span>
                    </p>
                  </div>
                </div>
                {examPreview.accessPolicy.requireProctoring && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 col-span-2">
                    <Camera className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("instructions.proctoring")}</p>
                      <p className="font-medium">{t("instructions.proctoringEnabled")}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Instructions from Backend */}
          {examPreview.instructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.examInstructions")}</CardTitle>
                <CardDescription>{t("instructions.readCarefully")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-3">
                  {examPreview.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm">
                      {getLocalizedField(instruction, "content", language)}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Default Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("instructions.beforeYouBegin")}</CardTitle>
              <CardDescription>{t("instructions.readCarefully")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {defaultInstructions.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Warnings */}
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                {t("instructions.importantWarnings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-1">*</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Security Notice */}
          {examPreview.accessPolicy.requireProctoring && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Shield className="h-5 w-5" />
                  {t("instructions.securityNotice")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex flex-wrap gap-2 mb-3">
                  {examPreview.accessPolicy.requireWebcam && (
                    <Badge variant="outline"><Camera className="h-3 w-3 me-1" />{t("myExams.webcamRequired")}</Badge>
                  )}
                  {examPreview.accessPolicy.requireFullscreen && (
                    <Badge variant="outline"><Monitor className="h-3 w-3 me-1" />{t("myExams.fullscreenRequired")}</Badge>
                  )}
                  {examPreview.accessPolicy.preventCopyPaste && (
                    <Badge variant="outline">{t("exams.preventCopyPaste")}</Badge>
                  )}
                </div>
                <p>{t("instructions.securityDesc1")}</p>
                <p>{t("instructions.securityDesc2")}</p>
              </CardContent>
            </Card>
          )}

          {/* Cannot Start - Show Reasons */}
          {!canStart && examPreview.eligibility.reasons.length > 0 && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-red-600">
                  <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t("instructions.noAttemptsLeft")}</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {examPreview.eligibility.reasons.map((reason, idx) => (
                        <li key={idx}>- {reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exam language */}
          <Card>
            <CardHeader>
              <CardTitle>{t("instructions.examLanguage")}</CardTitle>
              <CardDescription>{t("instructions.examLanguageDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={examLanguage === "en" ? "default" : "outline"}
                  onClick={() => setExamLanguage("en")}
                  className="flex-1"
                >
                  {t("instructions.english")}
                </Button>
                <Button
                  type="button"
                  variant={examLanguage === "ar" ? "default" : "outline"}
                  onClick={() => setExamLanguage("ar")}
                  className="flex-1"
                >
                  {t("instructions.arabic")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Agreement and Start */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Error Alert - Bottom */}
              {accessCodeError && (
                <div className="rounded-lg border border-red-500 bg-red-50 p-4">
                  <div className="flex items-start gap-3 text-red-700">
                    <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold">{accessCodeError}</p>
                      <p className="text-sm mt-1 text-red-600">
                        {t("exams.enterAccessCode")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Access Code Input (if required) */}
              {examPreview.accessPolicy.requiresAccessCode && (
                <div className="space-y-2">
                  <Label htmlFor="accessCode">{t("exams.accessCode")}</Label>
                  <input
                    id="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value)
                      setAccessCodeError(null) // Clear error when typing
                    }}
                    placeholder={t("exams.enterAccessCode")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!canStart}
                    required
                  />
                </div>
              )}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  disabled={!canStart}
                />
                <label htmlFor="agree" className="text-sm cursor-pointer">
                  {t("instructions.agreement")}
                </label>
              </div>
              <Button
                onClick={handleStartExam}
                disabled={
                  !agreed ||
                  !canStart ||
                  starting ||
                  (examPreview.accessPolicy.requiresAccessCode && !accessCode.trim())
                }
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {starting ? (
                  <>
                    <LoadingSpinner className="me-2" size="sm" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <PlayCircle className="me-2 h-5 w-5" />
                    {t("instructions.startExam")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
