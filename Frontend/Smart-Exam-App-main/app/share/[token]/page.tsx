"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
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
}

interface ShareCandidate {
  id: string
  fullName?: string
  fullNameAr?: string
  rollNo?: string
  hasExhaustedAttempts: boolean
  statusMessage?: string
}

interface SelectCandidateResponse {
  accessToken: string
  refreshToken: string
  expiration: string
  examId: number
  candidateId: string
  candidateName?: string
}

// ========== API calls (direct to backend, no auth) ==========
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5221/api"

async function fetchPublicExamInfo(
  token: string,
): Promise<PublicExamInfo | null> {
  try {
    const res = await fetch(`/api/proxy/public/exam/${token}`)
    const json = await res.json()
    if (json.success) return json.data
    return null
  } catch {
    return null
  }
}

async function fetchCandidates(
  token: string,
  search?: string,
): Promise<ShareCandidate[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    const res = await fetch(`/api/proxy/public/exam/${token}/candidates${params}`)
    const json = await res.json()
    if (json.success) return json.data
    return []
  } catch {
    return []
  }
}

async function selectCandidate(
  token: string,
  candidateId: string,
): Promise<{ success: boolean; data?: SelectCandidateResponse; message?: string }> {
  try {
    const res = await fetch(`/api/proxy/public/exam/${token}/select-candidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
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

  // State
  const [examInfo, setExamInfo] = useState<PublicExamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [candidates, setCandidates] = useState<ShareCandidate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCandidate, setSelectedCandidate] = useState<ShareCandidate | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Load candidates on mount (initial load)
  useEffect(() => {
    if (!token || !examInfo) return
    fetchCandidates(token).then(setCandidates)
  }, [token, examInfo])

  // Search debounce
  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value)
      setDropdownOpen(true)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = setTimeout(async () => {
        setSearching(true)
        const results = await fetchCandidates(token, value || undefined)
        setCandidates(results)
        setSearching(false)
      }, 300)
    },
    [token],
  )

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle candidate selection and authentication
  async function handleContinue() {
    if (!selectedCandidate || !token) return

    if (selectedCandidate.hasExhaustedAttempts) {
      setSubmitError(
        selectedCandidate.statusMessage ||
          (isRTL
            ? "هذا المرشح استنفد جميع المحاولات. يرجى اختيار مرشح آخر."
            : "This candidate has already exhausted all attempts. Please select another candidate."),
      )
      return
    }

    setSubmitting(true)
    setSubmitError("")

    const result = await selectCandidate(token, selectedCandidate.id)

    if (result.success && result.data) {
      // Store auth token and user info (same pattern as login)
      apiClient.setToken(result.data.accessToken)
      localStorage.setItem("refreshToken", result.data.refreshToken)
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.data.candidateId,
          email: "",
          fullNameEn: result.data.candidateName,
          role: "Candidate",
          isActive: true,
        }),
      )

      // Full page navigation so AuthProvider re-reads token from localStorage
      window.location.href = `/take-exam/${result.data.examId}/instructions`
    } else {
      setSubmitError(
        result.message ||
          (isRTL ? "فشل في تسجيل الدخول" : "Failed to authenticate"),
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
  const getCandidateName = (c: ShareCandidate) =>
    isRTL ? c.fullNameAr || c.fullName : c.fullName || c.fullNameAr

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">{isRTL ? "رابط غير صالح" : "Invalid Link"}</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top bar */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {examInfo?.organizationLogoUrl ? (
              <img
                src={examInfo.organizationLogoUrl}
                alt="Logo"
                className="h-8 w-8 rounded object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="text-sm font-medium">
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
      <div className="flex items-center justify-center min-h-[calc(100vh-57px)] p-4">
        <Card className="w-full max-w-lg">
          {/* Exam info header */}
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-xl">{getTitle()}</CardTitle>
            {getDesc() && (
              <p className="text-sm text-muted-foreground">{getDesc()}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {examInfo?.durationMinutes} {isRTL ? "دقيقة" : "min"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>
                  {examInfo?.maxAttempts || "∞"}{" "}
                  {isRTL ? "محاولات" : "attempts"}
                </span>
              </div>
            </div>

            {/* Expiry notice */}
            {examInfo?.expiresAt && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isRTL ? "ينتهي الرابط في:" : "Link expires at:"}{" "}
                  {new Date(examInfo.expiresAt).toLocaleString(
                    isRTL ? "ar-SA" : "en-US",
                    { timeZone: "Asia/Dubai" }
                  )}
                </span>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Candidate search dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isRTL ? "تسجيل الدخول بصفة:" : "Login as:"}
              </label>

              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      isRTL
                        ? "ابحث عن اسم المرشح أو الرقم..."
                        : "Search candidate name or ID..."
                    }
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setDropdownOpen(true)}
                    className="ps-9"
                  />
                </div>

                {/* Dropdown list */}
                {dropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
                    {searching ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : candidates.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {isRTL ? "لا توجد نتائج" : "No candidates found"}
                      </div>
                    ) : (
                      candidates.map((candidate) => {
                        const name = getCandidateName(candidate)
                        const isSelected =
                          selectedCandidate?.id === candidate.id
                        const isExhausted = candidate.hasExhaustedAttempts

                        return (
                          <button
                            key={candidate.id}
                            type="button"
                            className={`w-full px-3 py-2.5 text-start flex items-center justify-between hover:bg-accent transition-colors ${
                              isSelected ? "bg-accent" : ""
                            } ${isExhausted ? "opacity-60" : ""}`}
                            onClick={() => {
                              setSelectedCandidate(candidate)
                              setSearchTerm(name || "")
                              setDropdownOpen(false)
                              setSubmitError("")
                            }}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">
                                {name}
                              </span>
                              {candidate.rollNo && (
                                <span className="text-xs text-muted-foreground">
                                  {isRTL ? "رقم:" : "ID:"} {candidate.rollNo}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                            {isExhausted && (
                              <span className="text-xs text-destructive shrink-0">
                                {isRTL
                                  ? "لا محاولات متبقية"
                                  : "No attempts left"}
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected candidate status message */}
              {selectedCandidate?.statusMessage && (
                <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{selectedCandidate.statusMessage}</span>
                </div>
              )}
            </div>

            {/* Error message */}
            {submitError && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Continue button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedCandidate || submitting || selectedCandidate?.hasExhaustedAttempts}
              onClick={handleContinue}
            >
              {submitting ? (
                <LoadingSpinner size="sm" className="me-2" />
              ) : (
                <ArrowRight className="h-4 w-4 me-2" />
              )}
              {isRTL ? "متابعة إلى الاختبار" : "Continue to Exam"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
