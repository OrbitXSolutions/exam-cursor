"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  Clock,
  Users,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  LogIn,
  GraduationCap,
} from "lucide-react"

// ========== Types ==========
interface PublicExamInfo {
  examId: number
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  durationMinutes: number
  maxAttempts: number
  expiresAt?: string
  organizationName?: string
  organizationLogoUrl?: string
  isWalkIn: boolean
}

interface WalkInResponse {
  accessToken: string
  refreshToken: string
  expiration: string
  examId: number
  candidateId: string
  candidateName?: string
}

// ========== API calls ==========
async function fetchPublicExamInfo(token: string): Promise<PublicExamInfo | null> {
  try {
    const res = await fetch(`/api/proxy/public/exam/${token}`)
    const json = await res.json()
    if (json.success) return json.data
    return null
  } catch {
    return null
  }
}

async function walkInRegister(
  token: string,
  data: { fullName: string; email: string; phoneNumber: string },
): Promise<{ success: boolean; data?: WalkInResponse; message?: string }> {
  try {
    const res = await fetch(`/api/proxy/public/exam/${token}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    return json
  } catch {
    return { success: false, message: "Failed to connect to server" }
  }
}

// ========== Component ==========
export default function ShareExamPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useI18n()
  const isRTL = language === "ar"
  const token = params.token as string

  const [examInfo, setExamInfo] = useState<PublicExamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  })
  const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({})

  // Load exam info on mount
  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchPublicExamInfo(token).then((info) => {
      if (info) {
        setExamInfo(info)
      } else {
        setError(
          isRTL
            ? "رابط غير صالح أو منتهي الصلاحية"
            : "Invalid or expired share link",
        )
      }
      setLoading(false)
    })
  }, [token])

  // Handle walk-in registration and authentication
  async function handleWalkInSubmit() {
    const errors: Record<string, string> = {}
    if (!walkInForm.fullName.trim())
      errors.fullName = isRTL ? "الاسم الكامل مطلوب" : "Full name is required"
    if (!walkInForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(walkInForm.email))
      errors.email = isRTL ? "بريد إلكتروني صالح مطلوب" : "Valid email is required"
    if (!walkInForm.phoneNumber.trim())
      errors.phoneNumber = isRTL ? "رقم الهاتف مطلوب" : "Phone number is required"

    setWalkInErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    setSubmitError("")

    const result = await walkInRegister(token, {
      fullName: walkInForm.fullName.trim(),
      email: walkInForm.email.trim(),
      phoneNumber: walkInForm.phoneNumber.trim(),
    })

    if (result.success && result.data) {
      apiClient.setToken(result.data.accessToken)
      localStorage.setItem("refreshToken", result.data.refreshToken)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.data.candidateId,
          email: walkInForm.email.trim(),
          fullNameEn: result.data.candidateName,
          role: "Candidate",
          isActive: true,
          isWalkIn: true,
        }),
      )
      window.location.href = `/take-exam/${result.data.examId}/instructions`
    } else {
      setSubmitError(
        result.message || (isRTL ? "فشل في التسجيل" : "Registration failed"),
      )
    }

    setSubmitting(false)
  }

  // Get display text based on language
  const getTitle = () =>
    isRTL ? examInfo?.titleAr || examInfo?.titleEn : examInfo?.titleEn
  const getDesc = () =>
    isRTL
      ? examInfo?.descriptionAr || examInfo?.descriptionEn
      : examInfo?.descriptionEn

  // ========== Render ==========

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">{isRTL ? "رابط غير صالح" : "Invalid Link"}</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" dir={isRTL ? "rtl" : "ltr"}>

      {/* Top bar */}
      <div className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3 max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            {examInfo?.organizationLogoUrl ? (
              <img src={examInfo.organizationLogoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="text-sm font-semibold text-foreground">
              {examInfo?.organizationName || "SmartExam"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] p-4 py-10">
        <div className="w-full max-w-lg">
          <Card className="shadow-2xl border-0 overflow-hidden">

            {/* Colored header banner */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold leading-tight">{getTitle()}</h1>
              {getDesc() && (
                <p className="mt-2 text-sm text-white/80 leading-relaxed">{getDesc()}</p>
              )}

              {/* Stats pills */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{examInfo?.durationMinutes} {isRTL ? "دقيقة" : "min"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
                  <Users className="h-3.5 w-3.5" />
                  <span>{examInfo?.maxAttempts || "∞"} {isRTL ? "محاولات" : "attempts"}</span>
                </div>
              </div>
            </div>

            <CardContent className="px-6 py-6 space-y-5">
              {/* Expiry notice */}
              {examInfo?.expiresAt && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {isRTL ? "ينتهي الرابط في:" : "Link expires at:"}{" "}
                    <span className="font-medium">
                      {new Date(examInfo.expiresAt).toLocaleString(isRTL ? "ar-SA" : "en-US", { timeZone: "Asia/Dubai" })}
                    </span>
                  </span>
                </div>
              )}

              {examInfo?.isWalkIn ? (
                /* ===== Walk-in Registration Form ===== */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b pb-3">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span>{isRTL ? "أدخل بياناتك لبدء الاختبار" : "Enter your details to start the exam"}</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="walkIn-fullName" className="font-medium">
                      {isRTL ? "الاسم الكامل" : "Full Name"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="walkIn-fullName"
                      value={walkInForm.fullName}
                      onChange={(e) => setWalkInForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder={isRTL ? "أدخل اسمك الكامل" : "Enter your full name"}
                      className="h-11"
                    />
                    {walkInErrors.fullName && (
                      <p className="text-xs text-destructive">{walkInErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="walkIn-email" className="font-medium">
                      {isRTL ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="walkIn-email"
                      type="email"
                      value={walkInForm.email}
                      onChange={(e) => setWalkInForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                      className="h-11"
                    />
                    {walkInErrors.email && (
                      <p className="text-xs text-destructive">{walkInErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="walkIn-phone" className="font-medium">
                      {isRTL ? "رقم الهاتف" : "Phone Number"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="walkIn-phone"
                      type="tel"
                      value={walkInForm.phoneNumber}
                      onChange={(e) => setWalkInForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                      placeholder={isRTL ? "أدخل رقم هاتفك" : "Enter your phone number"}
                      className="h-11"
                    />
                    {walkInErrors.phoneNumber && (
                      <p className="text-xs text-destructive">{walkInErrors.phoneNumber}</p>
                    )}
                  </div>

                  {submitError && (
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <Button className="w-full h-12 text-base font-semibold" size="lg" disabled={submitting} onClick={handleWalkInSubmit}>
                    {submitting ? (
                      <LoadingSpinner size="sm" className="me-2" />
                    ) : (
                      <ArrowRight className="h-5 w-5 me-2" />
                    )}
                    {isRTL ? "بدء الاختبار" : "Start Exam"}
                  </Button>
                </div>
              ) : (
                /* ===== Case 2: Redirect to Login ===== */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground border-b pb-3">
                    <LogIn className="h-4 w-4 text-primary" />
                    <span>
                      {isRTL ? "يرجى تسجيل الدخول للوصول إلى هذا الاختبار" : "Please log in to access this exam"}
                    </span>
                  </div>

                  <Button
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                    onClick={() => router.push(`/candidate-login?returnUrl=${encodeURIComponent(`/take-exam/${examInfo?.examId}/instructions`)}`)}
                  >
                    <LogIn className="h-5 w-5 me-2" />
                    {isRTL ? "تسجيل الدخول" : "Login"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
