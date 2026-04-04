"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getAttemptIdForCandidate } from "@/lib/api/results"
import { apiClient } from "@/lib/api-client"
import { getAiProctorAnalysis, type AiProctorAnalysis } from "@/lib/api/proctoring"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Separator } from "@/components/ui/separator"
import { AttemptEventLog, type AttemptEvent } from "@/components/attempt-event-log"
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Camera,
  Monitor,
  Clock,
  Info,
  Sparkles,
  Loader2,
  Video,
  ExternalLink,
  BarChart3,
  Target,
  HelpCircle,
  Hash,
  RefreshCw,
  Timer,
  Laptop,
  Globe,
  Fingerprint,
  User,
} from "lucide-react"

interface ProctorSession {
  id: number
  attemptId: number
  examId: number
  examTitleEn: string
  candidateId: string
  candidateName: string
  statusName: string
  startedAt: string
  endedAt?: string
  totalViolations: number
  countableViolationCount?: number
  maxViolationWarnings?: number
  riskScore?: number
  requiresReview: boolean
  isTerminatedByProctor?: boolean
  terminationReason?: string
  // Device & Environment
  ipAddress?: string
  userAgent?: string
  browserName?: string
  browserVersion?: string
  operatingSystem?: string
  screenResolution?: string
  deviceFingerprint?: string
  attemptIpAddress?: string
  attemptDeviceInfo?: string
  // Sub-scores from backend risk calculation (null until first risk recalculation)
  faceScore?: number
  eyeScore?: number
  behaviorScore?: number
  environmentScore?: number
}

interface AIAnalysis {
  overallRiskScore: number
  faceDetectionScore: number
  eyeTrackingScore: number
  behaviorScore: number
  environmentScore: number
  suspiciousActivities: string[]
  recommendations: string[]
}

// AttemptEvent type imported from shared component

interface ProctorEvidence {
  id: number
  type?: number
  typeName?: string
  fileName?: string
  startAt?: string
  endAt?: string
  uploadedAt?: string
  previewUrl?: string
  downloadUrl?: string
}



export default function AIReportPage() {
  const params = useParams<{ examId: string; candidateId: string }>()
  const examId = Number(params.examId)
  const candidateId = params.candidateId
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptIdFromQuery = Number(searchParams.get("attemptId") || "")
  const { language, dir } = useI18n()

  const [session, setSession] = useState<ProctorSession | null>(null)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [attemptEvents, setAttemptEvents] = useState<AttemptEvent[]>([])
  const [evidence, setEvidence] = useState<ProctorEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiAnalysis2, setAiAnalysis2] = useState<AiProctorAnalysis | null>(null)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)

  const normalizeList = <T,>(res: unknown): T[] => {
    if (Array.isArray(res)) return res as T[]
    if (res && typeof res === "object") {
      const record = res as Record<string, unknown>
      const items = (record.items ?? record.Items ?? record.data ?? record.Data) as T[] | undefined
      return Array.isArray(items) ? items : []
    }
    return []
  }

  const normalizeEvidenceUrl = (url?: string | null) => {
    if (!url) return undefined
    if (url.startsWith("/api/")) return url.replace(/^\/api\//, "/api/proxy/")
    return url
  }

  // ── Compute AI analysis scores from real event data ────────────────────────
  function computeAnalysis(
    events: AttemptEvent[],
    sess: ProctorSession,
  ): AIAnalysis {
    // If backend has already computed and persisted sub-scores, use them directly.
    // This avoids recalculation and ensures consistency with the risk engine.
    const backendSubScoresAvailable =
      sess.faceScore != null &&
      sess.eyeScore != null &&
      sess.behaviorScore != null &&
      sess.environmentScore != null

    // Count events per type (eventType is numeric)
    const counts: Record<number, number> = {}
    for (const e of events) {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1
    }
    const c = (t: number) => counts[t] || 0

    // ── Proportional CameraBlocked penalty ──
    const sessionDurationSec = sess.endedAt
      ? (new Date(sess.endedAt).getTime() - new Date(sess.startedAt).getTime()) / 1000
      : 300
    const effectiveDuration = Math.max(10, sessionDurationSec)
    const blockedSeconds = c(21) * 30
    const blockedRatio = Math.min(1, blockedSeconds / effectiveDuration)

    const cameraBlockedFacePenalty = Math.round(blockedRatio * 85)
    const cameraBlockedEyePenalty = Math.round(blockedRatio * 80)
    const cameraBlockedEnvPenalty = Math.round(blockedRatio * 50)

    // ── Proportional FaceNotDetected penalty ──
    const faceAbsentSeconds = c(18) * 30
    const faceAbsentRatio = Math.min(1, faceAbsentSeconds / effectiveDuration)
    const faceAbsentPenalty = Math.round(faceAbsentRatio * 70)

    // ── Fallback sub-scores (used only when backend hasn't calculated yet) ──
    const fallbackFaceDetPenalty =
      faceAbsentPenalty + c(19) * 12 + cameraBlockedFacePenalty + c(16) * 25
    const fallbackFaceDetectionScore = Math.max(0, Math.min(100, 100 - fallbackFaceDetPenalty))

    const fallbackEyePenalty = c(22) * 7 + c(20) * 6 + cameraBlockedEyePenalty
    const fallbackRawEye = Math.max(0, Math.min(100, 100 - fallbackEyePenalty))
    const fallbackEyeScore = Math.min(fallbackRawEye, fallbackFaceDetectionScore)

    const fallbackBehaviorPenalty = c(4) * 8 + c(8) * 4 + c(10) * 10 + c(11) * 10 + c(12) * 5
    const fallbackBehaviorScore = Math.max(0, Math.min(100, 100 - fallbackBehaviorPenalty))

    // IMP 1: Remove missingInfoPenalty — device info is now captured reliably at session start
    const fallbackEnvPenalty = c(5) * 10 + cameraBlockedEnvPenalty + c(17) * 8
    const fallbackEnvironmentScore = Math.max(0, Math.min(100, 100 - fallbackEnvPenalty))

    // ── Use backend sub-scores when available, otherwise use local fallback ──
    const faceDetectionScore = backendSubScoresAvailable ? sess.faceScore! : fallbackFaceDetectionScore
    const eyeTrackingScore   = backendSubScoresAvailable ? sess.eyeScore!  : fallbackEyeScore
    const behaviorScore      = backendSubScoresAvailable ? sess.behaviorScore! : fallbackBehaviorScore
    const environmentScore   = backendSubScoresAvailable ? sess.environmentScore! : fallbackEnvironmentScore

    // ── Overall Risk Score ──
    // Source of truth: Backend Rule Engine (ProctorSession.RiskScore)
    // Fallback: client-side weighted formula if backend hasn't calculated yet
    const clientFallback = Math.min(100, Math.max(0,
      (100 - faceDetectionScore) * 0.35 +
      (100 - behaviorScore) * 0.30 +
      (100 - eyeTrackingScore) * 0.20 +
      (100 - environmentScore) * 0.15
    ))
    // If session was auto-terminated, risk should be at least 75 (High)
    const terminationFloor = sess.isTerminatedByProctor ? 75 : 0
    const rawRiskScore = (sess.riskScore != null && sess.riskScore !== undefined)
      ? Number(sess.riskScore)
      : clientFallback
    const overallRiskScore = Math.max(rawRiskScore, terminationFloor)

    // ── Suspicious Activities (built from real counts) ──
    const suspiciousActivities: string[] = []
    if (c(21) > 0) {
      const pct = Math.round(blockedRatio * 100)
      suspiciousActivities.push(
        language === "ar"
          ? `الكاميرا محجوبة ${c(21)} مرة (~${pct}% من الجلسة)`
          : `Camera blocked ${c(21)} time${c(21) > 1 ? "s" : ""} (~${pct}% of session)`
      )
    }
    if (c(18) > 0) suspiciousActivities.push(
      language === "ar"
        ? `لم يتم اكتشاف الوجه ${c(18)} مرة`
        : `Face not detected ${c(18)} time${c(18) > 1 ? "s" : ""}`
    )
    if (c(19) > 0) suspiciousActivities.push(
      language === "ar"
        ? `اكتشاف وجوه متعددة ${c(19)} مرة`
        : `Multiple faces detected ${c(19)} time${c(19) > 1 ? "s" : ""}`
    )
    if (c(22) > 0) suspiciousActivities.push(
      language === "ar"
        ? `التفات الرأس ${c(22)} مرة`
        : `Head turned away ${c(22)} time${c(22) > 1 ? "s" : ""}`
    )
    if (c(20) > 0) suspiciousActivities.push(
      language === "ar"
        ? `الوجه خارج الإطار ${c(20)} مرة`
        : `Face out of frame ${c(20)} time${c(20) > 1 ? "s" : ""}`
    )
    if (c(4) > 0) suspiciousActivities.push(
      language === "ar"
        ? `تبديل التبويب ${c(4)} مرة`
        : `Tab switched ${c(4)} time${c(4) > 1 ? "s" : ""}`
    )
    if (c(5) > 0) suspiciousActivities.push(
      language === "ar"
        ? `خروج من الشاشة الكاملة ${c(5)} مرة`
        : `Fullscreen exited ${c(5)} time${c(5) > 1 ? "s" : ""}`
    )
    if (c(8) > 0) suspiciousActivities.push(
      language === "ar"
        ? `فقدان تركيز النافذة ${c(8)} مرة`
        : `Window lost focus ${c(8)} time${c(8) > 1 ? "s" : ""}`
    )
    if (c(10) + c(11) > 0) suspiciousActivities.push(
      language === "ar"
        ? `محاولة نسخ/لصق ${c(10) + c(11)} مرة`
        : `Copy/paste attempt ${c(10) + c(11)} time${c(10) + c(11) > 1 ? "s" : ""}`
    )
    if (c(16) > 0) suspiciousActivities.push(
      language === "ar"
        ? `تم رفض الكاميرا`
        : `Webcam access denied`
    )

    // ── Recommendations ──
    const recommendations: string[] = []
    if (c(21) > 0 && blockedRatio >= 0.5) {
      recommendations.push(
        language === "ar"
          ? "تم حظر الكاميرا لمعظم الجلسة — بيانات المراقبة غير موثوقة، يجب المراجعة اليدوية"
          : "Camera was blocked for most of the session — proctoring data unreliable, manual review required"
      )
    } else if (c(21) > 0) {
      recommendations.push(
        language === "ar"
          ? "تم حظر الكاميرا — تحقق من سلامة التسجيل"
          : "Camera was blocked — verify recording integrity"
      )
    }
    if (overallRiskScore >= 50) {
      recommendations.push(
        language === "ar"
          ? "مخاطر عالية — يوصى بمراجعة يدوية فورية ومراجعة التسجيلات"
          : "High risk — immediate manual review and recording review recommended"
      )
    } else if (overallRiskScore >= 25) {
      recommendations.push(
        language === "ar"
          ? "مخاطر متوسطة — يوصى بمراجعة أحداث التنبيه"
          : "Medium risk — review alert events recommended"
      )
    }
    if (c(19) > 0) {
      recommendations.push(
        language === "ar"
          ? "تم اكتشاف وجوه متعددة — تحقق من وجود مساعدة خارجية"
          : "Multiple faces detected — verify no external assistance"
      )
    }
    if (c(4) >= 3) {
      recommendations.push(
        language === "ar"
          ? `تبديل التبويب المتكرر (${c(4)} مرات) — تحقق من عدم استخدام مصادر خارجية`
          : `Frequent tab switching (${c(4)} times) — verify no external resources used`
      )
    }
    if (c(18) >= 3) {
      recommendations.push(
        language === "ar"
          ? `غياب الوجه المتكرر (${c(18)} مرات) — قد يشير إلى وجود شخص آخر`
          : `Frequent face absence (${c(18)} times) — may indicate another person present`
      )
    }
    if (recommendations.length === 0) {
      recommendations.push(
        language === "ar"
          ? "لا توجد مخاوف كبيرة — الجلسة تبدو طبيعية"
          : "No major concerns — session appears normal"
      )
    }

    return {
      overallRiskScore,
      faceDetectionScore,
      eyeTrackingScore,
      behaviorScore,
      environmentScore,
      suspiciousActivities,
      recommendations,
    }
  }



  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Resolve attempt ID for this candidate and exam
        const resolvedAttemptId = attemptIdFromQuery || (await getAttemptIdForCandidate(examId, candidateId))
        if (!resolvedAttemptId) {
          setError(language === "ar" ? "لم يتم العثور على محاولة" : "No attempt found")
          return
        }

        // Get proctor sessions for this candidate and select the matching attempt
        const query = new URLSearchParams()
        query.set("CandidateId", candidateId)
        query.set("PageSize", "50")

        const res = await apiClient.get<unknown>(`/Proctor/sessions?${query}`)
        const sessions = normalizeList<ProctorSession>(res)
        const selectedSession = sessions.find((s) => s.attemptId === resolvedAttemptId) ?? sessions[0]

        if (selectedSession) {
          setSession(selectedSession)

          // Load events + evidence first, then compute real analysis from events
          const [evts] = await Promise.all([
            loadAttemptEvents(selectedSession.attemptId ?? resolvedAttemptId),
            loadEvidence(selectedSession.id),
          ])

          // Compute AI analysis from real event data
          const realAnalysis = computeAnalysis(evts, selectedSession)
          setAnalysis(realAnalysis)

          // Auto-generate GPT-4o analysis
          try {
            setAiAnalysisLoading(true)
            const aiResult = await getAiProctorAnalysis(String(selectedSession.id), language)
            setAiAnalysis2(aiResult)
          } catch {
            // Silent fail — user can click Regenerate
          } finally {
            setAiAnalysisLoading(false)
          }
        } else {
          setError(language === "ar" ? "لا توجد بيانات مراقبة" : "No proctoring data found")
        }
      } catch (err) {
        console.error("Failed to load AI report:", err)
        setError(language === "ar" ? "فشل في تحميل التقرير" : "Failed to load report")
      } finally {
        setLoading(false)
      }
    }

    if (examId && candidateId) {
      loadData()
    }
  }, [examId, candidateId, language, attemptIdFromQuery])

  async function loadAttemptEvents(attemptId: number): Promise<AttemptEvent[]> {
    try {
      const res = await apiClient.get<unknown>(`/Attempt/${attemptId}/events`)
      const evts = normalizeList<AttemptEvent>(res)
      setAttemptEvents(evts)
      return evts
    } catch (err) {
      console.warn("Failed to load attempt events:", err)
      setAttemptEvents([])
      return []
    }
  }

  async function loadEvidence(sessionId: number) {
    try {
      const res = await apiClient.get<unknown>(`/Proctor/session/${sessionId}/evidence`)
      setEvidence(normalizeList<ProctorEvidence>(res))
    } catch (err) {
      console.warn("Failed to load evidence:", err)
      setEvidence([])
    }
  }

  const handleGenerateAiAnalysis = async () => {
    if (!session?.id) return
    try {
      setAiAnalysisLoading(true)
      setAiAnalysisError(null)
      const result = await getAiProctorAnalysis(String(session.id), language)
      setAiAnalysis2(result)
      toast.success(language === "ar" ? "تم إنشاء تحليل الذكاء الاصطناعي" : "AI analysis generated successfully")
    } catch (error: any) {
      const msg = error?.message || (language === "ar" ? "فشل إنشاء تحليل الذكاء الاصطناعي" : "Failed to generate AI analysis")
      setAiAnalysisError(msg)
      toast.error(msg)
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score < 20) return { label: language === "ar" ? "منخفض" : "Low", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" }
    if (score < 50) return { label: language === "ar" ? "متوسط" : "Medium", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30" }
    if (score < 75) return { label: language === "ar" ? "مرتفع" : "High", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" }
    return { label: language === "ar" ? "حرج" : "Critical", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30" }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Go Back"}
        </Button>
      </div>
    )
  }

  const riskLevel = analysis ? getRiskLevel(analysis.overallRiskScore) : null

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-primary"
    if (score >= 50) return "text-orange-600"
    return "text-red-600"
  }
  const getProgressColor = (score: number) => {
    if (score >= 90) return "[&>div]:bg-green-500"
    if (score >= 70) return ""
    if (score >= 50) return "[&>div]:bg-orange-500"
    return "[&>div]:bg-red-500"
  }

  const snapshotEvidence = evidence.filter(
    (e) =>
      e.type === 3 ||
      e.type === 4 ||
      e.typeName?.toLowerCase().includes("image") ||
      e.typeName?.toLowerCase().includes("screen")
  )

  return (
    <div className="flex-1 space-y-6 p-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            {language === "ar" ? "تقرير الذكاء الاصطناعي" : "AI Proctoring Report"}
          </h1>
          <p className="text-muted-foreground">
            {session?.examTitleEn} • {session?.candidateName}
          </p>
        </div>
      </div>

      {analysis && session && (
        <>
          {/* Overall Risk Score */}
          <Card className={riskLevel?.bg}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === "ar" ? "درجة المخاطر الإجمالية" : "Overall Risk Score"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`text-4xl font-bold ${riskLevel?.color}`}>
                      {analysis.overallRiskScore.toFixed(0)}%
                    </span>
                    <Badge className={riskLevel?.color}>{riskLevel?.label}</Badge>
                  </div>
                </div>
                <Shield className={`h-16 w-16 ${riskLevel?.color} opacity-50`} />
              </div>
              <Progress 
                value={analysis.overallRiskScore} 
                className="mt-4 h-3"
              />
            </CardContent>
          </Card>

          {/* Analysis Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Camera className={`h-5 w-5 ${getScoreColor(analysis.faceDetectionScore)}`} />
                  <span className="font-medium">
                    {language === "ar" ? "كشف الوجه" : "Face Detection"}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.faceDetectionScore)} mb-2`}>
                  {analysis.faceDetectionScore.toFixed(0)}%
                </div>
                <Progress value={analysis.faceDetectionScore} className={`h-2 ${getProgressColor(analysis.faceDetectionScore)}`} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className={`h-5 w-5 ${getScoreColor(analysis.eyeTrackingScore)}`} />
                  <span className="font-medium">
                    {language === "ar" ? "تتبع العين" : "Eye Tracking"}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.eyeTrackingScore)} mb-2`}>
                  {analysis.eyeTrackingScore.toFixed(0)}%
                </div>
                <Progress value={analysis.eyeTrackingScore} className={`h-2 ${getProgressColor(analysis.eyeTrackingScore)}`} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className={`h-5 w-5 ${getScoreColor(analysis.behaviorScore)}`} />
                  <span className="font-medium">
                    {language === "ar" ? "السلوك" : "Behavior"}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.behaviorScore)} mb-2`}>
                  {analysis.behaviorScore.toFixed(0)}%
                </div>
                <Progress value={analysis.behaviorScore} className={`h-2 ${getProgressColor(analysis.behaviorScore)}`} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className={`h-5 w-5 ${getScoreColor(analysis.environmentScore)}`} />
                  <span className="font-medium">
                    {language === "ar" ? "البيئة" : "Environment"}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.environmentScore)} mb-2`}>
                  {analysis.environmentScore.toFixed(0)}%
                </div>
                <Progress value={analysis.environmentScore} className={`h-2 ${getProgressColor(analysis.environmentScore)}`} />
              </CardContent>
            </Card>
          </div>

          {/* AI Proctor Analysis (GPT-4o) */}
          <Card className="border-purple-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-500" />
                {language === "ar" ? "تقرير المراقبة بالذكاء الاصطناعي" : "AI Proctor Report"}
                <Badge variant="outline" className="ms-auto bg-purple-500/10 border-purple-500/30 text-purple-600 text-[10px]">
                  <Sparkles className="h-3 w-3 me-1" />
                  GPT-4o
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {language === "ar" ? "تحليل المخاطر بالذكاء الاصطناعي — استشاري فقط" : "AI-powered risk analysis — advisory only"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Generate Button */}
              {!aiAnalysis2 && !aiAnalysisLoading && (
                <div className="text-center py-4">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500/30" />
                  <p className="text-xs text-muted-foreground mb-3">
                    {language === "ar"
                      ? "إنشاء تحليل بالذكاء الاصطناعي لأنماط المخاطر والسلوك في هذه الجلسة"
                      : "Generate an AI-powered analysis of this session's risk and behavior patterns"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAiAnalysis}
                    className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 me-1.5" />
                    {language === "ar" ? "إنشاء تحليل الذكاء الاصطناعي" : "Generate AI Analysis"}
                  </Button>
                  {aiAnalysisError && (
                    <p className="text-xs text-destructive mt-2">{aiAnalysisError}</p>
                  )}
                </div>
              )}

              {/* Loading */}
              {aiAnalysisLoading && (
                <div className="text-center py-6">
                  <Loader2 className="h-6 w-6 mx-auto mb-2 text-purple-500 animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {language === "ar" ? "جارٍ تحليل الجلسة بالذكاء الاصطناعي..." : "Analyzing session with AI..."}
                  </p>
                </div>
              )}

              {/* Analysis Results */}
              {aiAnalysis2 && !aiAnalysisLoading && (
                <div className="space-y-3">
                  {/* Risk Level, Score & Confidence */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{language === "ar" ? "مستوى الخطورة" : "Risk Level"}</span>
                    <Badge variant="outline" className={
                      aiAnalysis2.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                      aiAnalysis2.riskLevel === "High" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                      aiAnalysis2.riskLevel === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" :
                      "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    }>
                      {aiAnalysis2.riskLevel}
                    </Badge>
                  </div>
                  {aiAnalysis2.riskScore != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{language === "ar" ? "درجة المخاطر" : "Risk Score"}</span>
                      <span className="text-sm font-bold">{aiAnalysis2.riskScore}/100</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{language === "ar" ? "الثقة" : "Confidence"}</span>
                    <span className="text-sm font-medium">{aiAnalysis2.confidence}%</span>
                  </div>

                  {/* Executive Summary */}
                  {aiAnalysis2.executiveSummary && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">{language === "ar" ? "الملخص التنفيذي" : "Executive Summary"}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis2.executiveSummary}</p>
                    </div>
                  )}

                  {/* Candidate Profile */}
                  {aiAnalysis2.candidateProfile && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        {language === "ar" ? "ملف المرشح" : "Candidate Profile"}
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {aiAnalysis2.candidateProfile.name && (
                          <div><span className="font-medium text-foreground">{language === "ar" ? "الاسم:" : "Name:"}</span> {aiAnalysis2.candidateProfile.name}</div>
                        )}
                        {aiAnalysis2.candidateProfile.department && (
                          <div><span className="font-medium text-foreground">{language === "ar" ? "القسم:" : "Dept:"}</span> {aiAnalysis2.candidateProfile.department}</div>
                        )}
                        {aiAnalysis2.candidateProfile.identityVerificationStatus && (
                          <div><span className="font-medium text-foreground">{language === "ar" ? "التحقق:" : "ID Verification:"}</span> {aiAnalysis2.candidateProfile.identityVerificationStatus}</div>
                        )}
                        {aiAnalysis2.candidateProfile.deviceSummary && (
                          <div className="col-span-2"><span className="font-medium text-foreground">{language === "ar" ? "الجهاز:" : "Device:"}</span> {aiAnalysis2.candidateProfile.deviceSummary}</div>
                        )}
                        {aiAnalysis2.candidateProfile.networkSummary && (
                          <div className="col-span-2"><span className="font-medium text-foreground">{language === "ar" ? "الشبكة:" : "Network:"}</span> {aiAnalysis2.candidateProfile.networkSummary}</div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Risk Explanation */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-1">{language === "ar" ? "شرح الخطورة" : "Risk Explanation"}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis2.riskExplanation}</p>
                  </div>

                  {/* Integrity Verdict */}
                  {aiAnalysis2.integrityVerdict && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">{language === "ar" ? "حكم النزاهة" : "Integrity Verdict"}</p>
                      <div className={`flex items-start gap-1.5 p-2.5 rounded-md border ${
                        aiAnalysis2.riskLevel === "Critical" || aiAnalysis2.riskLevel === "High"
                          ? "bg-destructive/5 border-destructive/20"
                          : aiAnalysis2.riskLevel === "Medium"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                      }`}>
                        <Shield className={`h-4 w-4 mt-0.5 shrink-0 ${
                          aiAnalysis2.riskLevel === "Critical" || aiAnalysis2.riskLevel === "High"
                            ? "text-destructive" : aiAnalysis2.riskLevel === "Medium" ? "text-amber-500" : "text-emerald-500"
                        }`} />
                        <p className="text-sm leading-relaxed">{aiAnalysis2.integrityVerdict}</p>
                      </div>
                    </div>
                  )}

                  {/* Suspicious Behaviors */}
                  {aiAnalysis2.suspiciousBehaviors?.length > 0 && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        {language === "ar" ? "السلوكيات المشبوهة" : "Suspicious Behaviors"}
                        <Badge variant="outline" className="ms-auto text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-600">
                          {aiAnalysis2.suspiciousBehaviors.length}
                        </Badge>
                      </summary>
                      <ul className="space-y-1 mt-2">
                        {aiAnalysis2.suspiciousBehaviors.map((behavior, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <span>{behavior}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* Violation Analysis */}
                  {aiAnalysis2.violationAnalysis && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        {language === "ar" ? "تحليل المخالفات" : "Violation Analysis"}
                        {(aiAnalysis2.violationAnalysis.totalViolations ?? 0) > 0 && (
                          <Badge variant="outline" className="ms-auto text-[10px] bg-red-500/10 border-red-500/20 text-red-600">
                            {aiAnalysis2.violationAnalysis.totalViolations}
                          </Badge>
                        )}
                      </summary>
                      <div className="mt-2 space-y-2">
                        {aiAnalysis2.violationAnalysis.thresholdStatus && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">{language === "ar" ? "حالة العتبة:" : "Threshold:"}</span> {aiAnalysis2.violationAnalysis.thresholdStatus}
                          </p>
                        )}
                        {aiAnalysis2.violationAnalysis.violationTrend && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">{language === "ar" ? "الاتجاه:" : "Trend:"}</span> {aiAnalysis2.violationAnalysis.violationTrend}
                          </p>
                        )}
                        {aiAnalysis2.violationAnalysis.violationBreakdown && aiAnalysis2.violationAnalysis.violationBreakdown.length > 0 && (
                          <div className="space-y-1.5">
                            {aiAnalysis2.violationAnalysis.violationBreakdown.map((v, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-[10px] ${
                                    v.severity === "Critical" || v.severity === "High" ? "bg-red-500/10 border-red-500/20 text-red-600" :
                                    v.severity === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                                    "bg-blue-500/10 border-blue-500/20 text-blue-600"
                                  }`}>{v.severity}</Badge>
                                  <span className="font-medium">{v.type}</span>
                                  <span className="text-muted-foreground">×{v.count}</span>
                                </div>
                                {v.impact && <span className="text-muted-foreground max-w-[50%] text-end">{v.impact}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Behavior Analysis */}
                  {aiAnalysis2.behaviorAnalysis && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        {language === "ar" ? "تحليل السلوك" : "Behavior Analysis"}
                      </summary>
                      <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {aiAnalysis2.behaviorAnalysis.answerPatternSummary && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-0.5">{language === "ar" ? "أنماط الإجابة" : "Answer Patterns"}</p>
                            <p className="text-xs leading-relaxed">{aiAnalysis2.behaviorAnalysis.answerPatternSummary}</p>
                          </div>
                        )}
                        {aiAnalysis2.behaviorAnalysis.focusBehavior && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-0.5">{language === "ar" ? "سلوك التركيز" : "Focus Behavior"}</p>
                            <p className="text-xs leading-relaxed">{aiAnalysis2.behaviorAnalysis.focusBehavior}</p>
                          </div>
                        )}
                        {aiAnalysis2.behaviorAnalysis.timingAnalysis && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-0.5">{language === "ar" ? "تحليل التوقيت" : "Timing Analysis"}</p>
                            <p className="text-xs leading-relaxed">{aiAnalysis2.behaviorAnalysis.timingAnalysis}</p>
                          </div>
                        )}
                        {aiAnalysis2.behaviorAnalysis.suspiciousPatterns && (
                          <div>
                            <p className="text-xs font-medium text-foreground mb-0.5">{language === "ar" ? "أنماط مشبوهة" : "Suspicious Patterns"}</p>
                            <p className="text-xs leading-relaxed">{aiAnalysis2.behaviorAnalysis.suspiciousPatterns}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Session Overview */}
                  {aiAnalysis2.sessionOverview && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        {language === "ar" ? "نظرة عامة على الجلسة" : "Session Overview"}
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        {aiAnalysis2.sessionOverview.duration && (
                          <div><span className="text-muted-foreground">{language === "ar" ? "المدة:" : "Duration:"}</span> <span className="font-medium">{aiAnalysis2.sessionOverview.duration}</span></div>
                        )}
                        {aiAnalysis2.sessionOverview.timeUsage && (
                          <div><span className="text-muted-foreground">{language === "ar" ? "استخدام الوقت:" : "Time Usage:"}</span> <span className="font-medium">{aiAnalysis2.sessionOverview.timeUsage}</span></div>
                        )}
                        {aiAnalysis2.sessionOverview.completionRate && (
                          <div><span className="text-muted-foreground">{language === "ar" ? "معدل الإنجاز:" : "Completion:"}</span> <span className="font-medium">{aiAnalysis2.sessionOverview.completionRate}</span></div>
                        )}
                        {aiAnalysis2.sessionOverview.proctorMode && (
                          <div><span className="text-muted-foreground">{language === "ar" ? "وضع المراقبة:" : "Proctor Mode:"}</span> <span className="font-medium">{aiAnalysis2.sessionOverview.proctorMode}</span></div>
                        )}
                        {aiAnalysis2.sessionOverview.terminationInfo && aiAnalysis2.sessionOverview.terminationInfo !== "N/A" && (
                          <div className="col-span-2 text-red-600"><span className="font-medium">{language === "ar" ? "الإنهاء:" : "Termination:"}</span> {aiAnalysis2.sessionOverview.terminationInfo}</div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Environment Assessment */}
                  {aiAnalysis2.environmentAssessment && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-teal-500" />
                        {language === "ar" ? "تقييم البيئة" : "Environment Assessment"}
                        {aiAnalysis2.environmentAssessment.overallEnvironmentRisk && (
                          <Badge variant="outline" className={`ms-auto text-[10px] ${
                            aiAnalysis2.environmentAssessment.overallEnvironmentRisk === "High" ? "bg-red-500/10 border-red-500/20 text-red-600" :
                            aiAnalysis2.environmentAssessment.overallEnvironmentRisk === "Medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-600" :
                            "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                          }`}>{aiAnalysis2.environmentAssessment.overallEnvironmentRisk}</Badge>
                        )}
                      </summary>
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {aiAnalysis2.environmentAssessment.webcamStatus && (
                          <div className="flex items-center gap-2">
                            <Camera className="h-3 w-3 shrink-0" />
                            <span className="font-medium text-foreground">{language === "ar" ? "الكاميرا:" : "Webcam:"}</span>
                            <span>{aiAnalysis2.environmentAssessment.webcamStatus}</span>
                          </div>
                        )}
                        {aiAnalysis2.environmentAssessment.networkStability && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 shrink-0" />
                            <span className="font-medium text-foreground">{language === "ar" ? "الشبكة:" : "Network:"}</span>
                            <span>{aiAnalysis2.environmentAssessment.networkStability}</span>
                          </div>
                        )}
                        {aiAnalysis2.environmentAssessment.browserCompliance && (
                          <div className="flex items-center gap-2">
                            <Laptop className="h-3 w-3 shrink-0" />
                            <span className="font-medium text-foreground">{language === "ar" ? "المتصفح:" : "Browser:"}</span>
                            <span>{aiAnalysis2.environmentAssessment.browserCompliance}</span>
                          </div>
                        )}
                        {aiAnalysis2.environmentAssessment.fullscreenCompliance && (
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3 w-3 shrink-0" />
                            <span className="font-medium text-foreground">{language === "ar" ? "ملء الشاشة:" : "Fullscreen:"}</span>
                            <span>{aiAnalysis2.environmentAssessment.fullscreenCompliance}</span>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Aggravating & Mitigating Factors */}
                  {((aiAnalysis2.aggravatingFactors && aiAnalysis2.aggravatingFactors.length > 0) || (aiAnalysis2.mitigatingFactors && aiAnalysis2.mitigatingFactors.length > 0)) && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors">
                        {language === "ar" ? "العوامل المشددة والمخففة" : "Aggravating & Mitigating Factors"}
                      </summary>
                      <div className="mt-2 space-y-2">
                        {aiAnalysis2.aggravatingFactors && aiAnalysis2.aggravatingFactors.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">{language === "ar" ? "عوامل مشددة" : "Aggravating Factors"}</p>
                            <ul className="space-y-0.5">
                              {aiAnalysis2.aggravatingFactors.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <XCircle className="h-3 w-3 mt-0.5 shrink-0 text-red-400" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiAnalysis2.mitigatingFactors && aiAnalysis2.mitigatingFactors.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-emerald-600 mb-1">{language === "ar" ? "عوامل مخففة" : "Mitigating Factors"}</p>
                            <ul className="space-y-0.5">
                              {aiAnalysis2.mitigatingFactors.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-emerald-400" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Risk Timeline */}
                  {aiAnalysis2.riskTimeline && aiAnalysis2.riskTimeline.length > 0 && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2">
                        <Timer className="h-4 w-4 text-purple-500" />
                        {language === "ar" ? "الجدول الزمني للمخاطر" : "Risk Timeline"}
                        <Badge variant="outline" className="ms-auto text-[10px]">{aiAnalysis2.riskTimeline.length}</Badge>
                      </summary>
                      <div className="mt-2 relative">
                        <div className="absolute start-[7px] top-2 bottom-2 w-0.5 bg-purple-500/20" />
                        <ul className="space-y-2">
                          {aiAnalysis2.riskTimeline.map((event, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground ps-0">
                              <div className="h-3.5 w-3.5 rounded-full bg-purple-500/20 border-2 border-purple-500/40 shrink-0 mt-0.5 z-10" />
                              <span>{event}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}

                  {/* Recommendations */}
                  {aiAnalysis2.recommendations && aiAnalysis2.recommendations.length > 0 ? (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1.5">{language === "ar" ? "التوصيات" : "Recommendations"}</p>
                      <div className="space-y-1.5">
                        {aiAnalysis2.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-1.5 p-2 rounded-md bg-purple-500/5 border border-purple-500/10">
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-500" />
                            <p className="text-xs text-purple-700 dark:text-purple-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">{language === "ar" ? "التوصية" : "Recommendation"}</p>
                      <div className="flex items-start gap-1.5 p-2.5 rounded-md bg-purple-500/5 border border-purple-500/10">
                        <Shield className="h-4 w-4 mt-0.5 shrink-0 text-purple-500" />
                        <p className="text-sm text-purple-700 dark:text-purple-300">{aiAnalysis2.recommendation}</p>
                      </div>
                    </div>
                  )}

                  {/* Detailed Analysis (collapsible) */}
                  {aiAnalysis2.detailedAnalysis && (
                    <details className="pt-2 border-t" open>
                      <summary className="text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors">
                        {language === "ar" ? "التحليل التفصيلي الكامل" : "Full Detailed Analysis"}
                      </summary>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 whitespace-pre-line">{aiAnalysis2.detailedAnalysis}</p>
                    </details>
                  )}

                  {/* Regenerate */}
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {aiAnalysis2.generatedAt ? new Date(aiAnalysis2.generatedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US", { timeZone: "Asia/Dubai" }) : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateAiAnalysis}
                      className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                    >
                      <Sparkles className="h-3 w-3 me-1" />
                      {language === "ar" ? "إعادة إنشاء" : "Regenerate"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "تفاصيل الجلسة" : "Session Details"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "البداية" : "Started"}</p>
                  <p className="font-medium">
                    {new Date(session.startedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US", { timeZone: "Asia/Dubai" })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "النهاية" : "Ended"}</p>
                  <p className="font-medium">
                    {(() => {
                      const endDate = session.endedAt
                        || attemptEvents.find(e => e.eventType === 6 || e.eventType === 7 || e.eventType === 13)?.occurredAt
                      return endDate
                        ? new Date(endDate).toLocaleString(language === "ar" ? "ar-SA" : "en-US", { timeZone: "Asia/Dubai" })
                        : "—"
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "المدة" : "Duration"}</p>
                  <p className="font-medium">
                    {(() => {
                      const endDate = session.endedAt
                        || attemptEvents.find(e => e.eventType === 6 || e.eventType === 7 || e.eventType === 13)?.occurredAt
                      if (!endDate) return "—"
                      const diffMs = new Date(endDate).getTime() - new Date(session.startedAt).getTime()
                      const mins = Math.floor(diffMs / 60000)
                      const secs = Math.floor((diffMs % 60000) / 1000)
                      return `${mins}m ${secs}s`
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                  <Badge variant={
                    session.statusName === "Active" ? "default"
                    : session.statusName === "Cancelled" || session.isTerminatedByProctor ? "destructive"
                    : "secondary"
                  }>
                    {session.isTerminatedByProctor
                      ? (language === "ar" ? "تم الإنهاء تلقائياً" : "Auto-Terminated")
                      : session.statusName}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي المخالفات" : "Total Violations"}</p>
                  <p className={`font-bold text-lg ${session.totalViolations > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {session.totalViolations || attemptEvents.filter(e => [4,5,8,10,11,12,16,17,18,19,20,21,22].includes(e.eventType)).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "المخالفات المحتسبة" : "Countable Violations"}
                  </p>
                  <p className="font-bold text-lg">
                    {session.countableViolationCount ?? attemptEvents.filter(e => [4,18,19,21].includes(e.eventType)).length}
                    {(session.maxViolationWarnings ?? 0) > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {" / "}{session.maxViolationWarnings}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الأحداث" : "Total Events"}</p>
                  <p className="font-medium text-lg">{attemptEvents.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "الإنهاء التلقائي" : "Auto-Termination"}
                  </p>
                  <Badge variant="outline" className={
                    (session.maxViolationWarnings ?? 0) > 0
                      ? "bg-green-500/10 border-green-500/30 text-green-600"
                      : "bg-muted"
                  }>
                    {(session.maxViolationWarnings ?? 0) > 0
                      ? (language === "ar" ? `مفعّل (${session.maxViolationWarnings} تحذير)` : `Enabled (${session.maxViolationWarnings} warnings)`)
                      : (language === "ar" ? "معطّل" : "Disabled")}
                  </Badge>
                </div>
              </div>

              {/* Termination Info Banner */}
              {session.isTerminatedByProctor && session.terminationReason && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        {language === "ar" ? "سبب الإنهاء" : "Termination Reason"}
                      </p>
                      <p className="text-sm text-destructive/80">{session.terminationReason}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Device & Environment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5" />
                {language === "ar" ? "الجهاز والبيئة" : "Device & Environment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* IP Address */}
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "عنوان IP" : "IP Address"}</p>
                    <p className="font-medium font-mono text-sm">{session.ipAddress || "—"}</p>
                    {session.attemptIpAddress && session.attemptIpAddress !== session.ipAddress && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        {language === "ar" ? "IP المحاولة يختلف:" : "Attempt IP differs:"} {session.attemptIpAddress}
                      </p>
                    )}
                  </div>
                </div>
                {/* Browser */}
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "المتصفح" : "Browser"}</p>
                    <p className="font-medium text-sm">
                      {session.browserName
                        ? `${session.browserName}${session.browserVersion ? " " + session.browserVersion : ""}`
                        : "—"}
                    </p>
                  </div>
                </div>
                {/* Operating System */}
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "نظام التشغيل" : "Operating System"}</p>
                    <p className="font-medium text-sm">{session.operatingSystem || "—"}</p>
                  </div>
                </div>
                {/* Screen Resolution */}
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "دقة الشاشة" : "Screen Resolution"}</p>
                    <p className="font-medium text-sm font-mono">{session.screenResolution || "—"}</p>
                  </div>
                </div>
                {/* Device Fingerprint */}
                {session.deviceFingerprint && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Fingerprint className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "بصمة الجهاز" : "Device Fingerprint"}</p>
                      <p className="font-medium text-xs font-mono break-all">{session.deviceFingerprint}</p>
                    </div>
                  </div>
                )}
                {/* Device Info from Attempt */}
                {session.attemptDeviceInfo && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <Laptop className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "معلومات الجهاز" : "Device Info"}</p>
                      <p className="font-medium text-xs font-mono break-all">{session.attemptDeviceInfo}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidate Answer Behavior */}
          {(() => {
            const answerEvents = attemptEvents.filter(e => e.eventType === 2)
            if (answerEvents.length === 0) return null

            // Group by questionId to detect answer changes
            const questionMap = new Map<number, { count: number; times: string[]; text?: string }>()
            for (const evt of answerEvents) {
              try {
                const meta = evt.metadataJson ? JSON.parse(evt.metadataJson as string) : {}
                const qId = meta.questionId
                if (!qId) continue
                const existing = questionMap.get(qId)
                if (existing) {
                  existing.count++
                  existing.times.push(evt.occurredAt)
                } else {
                  questionMap.set(qId, { count: 1, times: [evt.occurredAt], text: evt.questionTextEn })
                }
              } catch { /* skip malformed metadata */ }
            }

            const totalAnswered = questionMap.size
            const changedAnswers = Array.from(questionMap.values()).filter(q => q.count > 1)
            const totalChanges = changedAnswers.reduce((sum, q) => sum + q.count - 1, 0)

            // Time analysis: gap between consecutive answer events
            const sortedAnswers = [...answerEvents].sort((a, b) =>
              new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
            )
            const questionTimes: { qId: number; text?: string; seconds: number }[] = []
            for (let i = 0; i < sortedAnswers.length; i++) {
              try {
                const meta = sortedAnswers[i].metadataJson ? JSON.parse(sortedAnswers[i].metadataJson as string) : {}
                const qId = meta.questionId
                if (!qId) continue
                // Only count first answer per question for time analysis
                if (questionTimes.some(qt => qt.qId === qId)) continue
                const prevTime = i > 0
                  ? new Date(sortedAnswers[i - 1].occurredAt).getTime()
                  : new Date(session.startedAt).getTime()
                const curTime = new Date(sortedAnswers[i].occurredAt).getTime()
                const seconds = Math.max(0, Math.round((curTime - prevTime) / 1000))
                if (seconds > 0 && seconds < 7200) { // sanity: max 2hr per question
                  questionTimes.push({ qId, text: sortedAnswers[i].questionTextEn, seconds })
                }
              } catch { /* skip */ }
            }

            const slowest = [...questionTimes].sort((a, b) => b.seconds - a.seconds).slice(0, 3)
            const fastest = [...questionTimes].sort((a, b) => a.seconds - b.seconds).slice(0, 3)
            const avgTime = questionTimes.length > 0
              ? Math.round(questionTimes.reduce((s, q) => s + q.seconds, 0) / questionTimes.length)
              : 0

            const formatTime = (s: number) => {
              if (s < 60) return `${s}s`
              const m = Math.floor(s / 60)
              const sec = s % 60
              return sec > 0 ? `${m}m ${sec}s` : `${m}m`
            }

            return (
              <Card className="border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    {language === "ar" ? "سلوك إجابة المرشح" : "Candidate Answer Behavior"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === "ar"
                      ? "تحليل أنماط الإجابة والسلوك أثناء الاختبار"
                      : "Analysis of answering patterns and behavior during the exam"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Target className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "الأسئلة المجابة" : "Questions Answered"}
                        </p>
                        <p className="text-lg font-bold">{totalAnswered}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <RefreshCw className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "تغييرات الإجابة" : "Answer Changes"}
                        </p>
                        <p className={`text-lg font-bold ${totalChanges > 0 ? "text-amber-600" : ""}`}>
                          {totalChanges}
                          {totalChanges > 0 && (
                            <span className="text-xs font-normal text-muted-foreground ms-1">
                              ({changedAnswers.length} {language === "ar" ? "سؤال" : "questions"})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Timer className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "متوسط الوقت" : "Avg. Time/Question"}
                        </p>
                        <p className="text-lg font-bold">{avgTime > 0 ? formatTime(avgTime) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Hash className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "إجمالي الإجابات" : "Total Submissions"}
                        </p>
                        <p className="text-lg font-bold">{answerEvents.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Slowest Questions */}
                  {slowest.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        {language === "ar" ? "الأسئلة الأبطأ" : "Slowest Questions"}
                      </p>
                      <div className="space-y-1.5">
                        {slowest.map((q, i) => (
                          <div key={q.qId} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                            <span className="text-muted-foreground truncate max-w-[70%]">
                              {q.text || `Q#${q.qId}`}
                            </span>
                            <Badge variant="outline" className="bg-orange-500/10 border-orange-500/20 text-orange-600 text-xs">
                              {formatTime(q.seconds)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fastest Questions */}
                  {fastest.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-green-500" />
                        {language === "ar" ? "الأسئلة الأسرع" : "Fastest Questions"}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({language === "ar" ? "قد تشير إلى تخمين" : "may indicate guessing"})
                        </span>
                      </p>
                      <div className="space-y-1.5">
                        {fastest.map((q, i) => (
                          <div key={q.qId} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                            <span className="text-muted-foreground truncate max-w-[70%]">
                              {q.text || `Q#${q.qId}`}
                            </span>
                            <Badge variant="outline" className={`text-xs ${
                              q.seconds <= 5
                                ? "bg-red-500/10 border-red-500/20 text-red-600"
                                : "bg-green-500/10 border-green-500/20 text-green-600"
                            }`}>
                              {formatTime(q.seconds)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Changed Answers */}
                  {changedAnswers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 text-amber-500" />
                        {language === "ar" ? "أسئلة تم تغيير إجابتها" : "Questions with Changed Answers"}
                      </p>
                      <div className="space-y-1.5">
                        {changedAnswers.slice(0, 5).map((q, i) => {
                          const entry = Array.from(questionMap.entries()).find(([, v]) => v === q)
                          return (
                            <div key={i} className="flex items-center justify-between p-2 rounded-md bg-amber-500/5 border border-amber-500/10 text-sm">
                              <span className="text-muted-foreground truncate max-w-[70%]">
                                {q.text || `Q#${entry?.[0]}`}
                              </span>
                              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-600 text-xs">
                                {q.count - 1} {language === "ar" ? "تغيير" : q.count - 1 === 1 ? "change" : "changes"}
                              </Badge>
                            </div>
                          )
                        })}
                        {changedAnswers.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{changedAnswers.length - 5} {language === "ar" ? "أسئلة أخرى" : "more questions"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* Attempt Events */}
          <AttemptEventLog events={attemptEvents} />

          {/* Screen Captures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {language === "ar" ? "لقطات الشاشة" : "Screen Captures"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? `${snapshotEvidence.length} لقطة شاشة مسجلة`
                  : `${snapshotEvidence.length} screen captures recorded`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshotEvidence.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Monitor className="h-10 w-10 mb-2" />
                  <p>{language === "ar" ? "لا توجد لقطات متاحة" : "No screen captures available"}</p>
                </div>
              ) : (
                <>
                  {/* Enlarged view */}
                  <div className="mb-4">
                    <div
                      className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center cursor-pointer"
                      onClick={() => selectedScreenshot && setSelectedScreenshot(null)}
                    >
                      {selectedScreenshot ? (
                        <img
                          src={selectedScreenshot}
                          alt="Screen capture enlarged"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Monitor className="h-10 w-10 mb-2" />
                          <p className="text-sm">{language === "ar" ? "اضغط على لقطة لعرضها" : "Click a capture to view"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Thumbnail strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {snapshotEvidence.map((snap) => {
                      const url = normalizeEvidenceUrl(snap.previewUrl ?? snap.downloadUrl)
                      return (
                        <div
                          key={snap.id}
                          className={`shrink-0 w-24 cursor-pointer rounded overflow-hidden border-2 transition-all ${
                            selectedScreenshot === url
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-primary/50"
                          }`}
                          onClick={() => url && setSelectedScreenshot(url)}
                        >
                          {url ? (
                            <img
                              src={url}
                              alt={`${language === "ar" ? "شاشة" : "Screen"} ${snap.id}`}
                              className="w-full aspect-video object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full aspect-video bg-muted flex items-center justify-center">
                              <Camera className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Video Recording */}
          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="h-5 w-5 text-blue-500" />
                {language === "ar" ? "تسجيل فيديو المرشح" : "Candidate Video Recording"}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === "ar"
                  ? "مشاهدة تسجيل الفيديو الكامل لجلسة الاختبار"
                  : "View the full video recording of the exam session"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Video className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{session.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{session.examTitleEn}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
                  onClick={() => window.open(`/proctor-center/video/${candidateId}?attemptId=${session.attemptId}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                  {language === "ar" ? "فتح التسجيل" : "Open Recording"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suspicious Activities */}
          {analysis.suspiciousActivities.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  {language === "ar" ? "أنشطة مشبوهة" : "Suspicious Activities"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.suspiciousActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-orange-600" />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Info className="h-5 w-5" />
                {language === "ar" ? "التوصيات" : "Recommendations"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 text-sm text-muted-foreground">
              <p>
                {language === "ar"
                  ? "ملاحظة: هذا التقرير تم إنشاؤه بواسطة نظام الذكاء الاصطناعي ويجب مراجعته من قبل المشرف قبل اتخاذ أي إجراء."
                  : "Note: This report was generated by an AI system and should be reviewed by a proctor before taking any action."}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Back Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Back"}
        </Button>
      </div>
    </div>
  )
}
