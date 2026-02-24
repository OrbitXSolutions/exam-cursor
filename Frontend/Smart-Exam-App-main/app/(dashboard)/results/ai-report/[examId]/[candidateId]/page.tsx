"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getAttemptIdForCandidate } from "@/lib/api/results"
import { apiClient } from "@/lib/api-client"
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
  riskScore?: number
  requiresReview: boolean
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
    // Count events per type (eventType is numeric)
    const counts: Record<number, number> = {}
    for (const e of events) {
      counts[e.eventType] = (counts[e.eventType] || 0) + 1
    }
    const c = (t: number) => counts[t] || 0

    // ── Face Detection Score (100 → 0) ──
    // Penalties: FaceNotDetected(18)=8, MultipleFaces(19)=12, CameraBlocked(21)=10, WebcamDenied(16)=25
    const faceDetPenalty =
      c(18) * 8 + c(19) * 12 + c(21) * 10 + c(16) * 25
    const faceDetectionScore = Math.max(0, Math.min(100, 100 - faceDetPenalty))

    // ── Eye Tracking Score (100 → 0) ──
    // Penalties: HeadTurned(22)=7, FaceOutOfFrame(20)=6
    const eyePenalty = c(22) * 7 + c(20) * 6
    const eyeTrackingScore = Math.max(0, Math.min(100, 100 - eyePenalty))

    // ── Behavior Score (100 → 0) ──
    // Penalties: TabSwitched(4)=8, WindowBlur(8)=4, CopyAttempt(10)=10, PasteAttempt(11)=10, RightClick(12)=5
    const behaviorPenalty =
      c(4) * 8 + c(8) * 4 + c(10) * 10 + c(11) * 10 + c(12) * 5
    const behaviorScore = Math.max(0, Math.min(100, 100 - behaviorPenalty))

    // ── Environment Score (100 → 0) ──
    // Penalties: FullscreenExited(5)=10, CameraBlocked(21)=12, SnapshotFailed(17)=8
    const envPenalty = c(5) * 10 + c(21) * 12 + c(17) * 8
    const environmentScore = Math.max(0, Math.min(100, 100 - envPenalty))

    // ── Overall Risk Score ──
    // Weighted inverse: higher risk when scores are lower
    // Face 35%, Behavior 30%, Eye 20%, Environment 15%
    const overallRiskScore = Math.min(100, Math.max(0,
      (100 - faceDetectionScore) * 0.35 +
      (100 - behaviorScore) * 0.30 +
      (100 - eyeTrackingScore) * 0.20 +
      (100 - environmentScore) * 0.15
    ))

    // ── Suspicious Activities (built from real counts) ──
    const suspiciousActivities: string[] = []
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
    if (c(21) > 0) suspiciousActivities.push(
      language === "ar"
        ? `الكاميرا محجوبة ${c(21)} مرة`
        : `Camera blocked ${c(21)} time${c(21) > 1 ? "s" : ""}`
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
    if (c(21) > 0) {
      recommendations.push(
        language === "ar"
          ? "تم حظر الكاميرا — تحقق من سلامة التسجيل"
          : "Camera was blocked — verify recording integrity"
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
                    {new Date(session.startedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "النهاية" : "Ended"}</p>
                  <p className="font-medium">
                    {session.endedAt
                      ? new Date(session.endedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "المخالفات" : "Violations"}</p>
                  <p className="font-medium">{session.totalViolations}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                  <Badge variant={session.statusName === "Active" ? "default" : "secondary"}>
                    {session.statusName}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attempt Events */}
          <AttemptEventLog events={attemptEvents} />

          {/* Evidence / Snapshots */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "اللقطات" : "Snapshots"}</CardTitle>
              <CardDescription>
                {language === "ar"
                  ? `${snapshotEvidence.length} لقطة مسجلة`
                  : `${snapshotEvidence.length} snapshots captured`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshotEvidence.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {language === "ar" ? "لا توجد لقطات متاحة" : "No snapshots available"}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {snapshotEvidence.map((snap) => (
                    <div key={snap.id} className="relative">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        {snap.previewUrl || snap.downloadUrl ? (
                          <img
                            src={normalizeEvidenceUrl(snap.previewUrl ?? snap.downloadUrl)}
                            alt={`Snapshot ${snap.id}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(snap.startAt ?? snap.uploadedAt ?? snap.endAt ?? new Date().toISOString()).toLocaleTimeString(
                          language === "ar" ? "ar-SA" : "en-US"
                        )}
                      </div>
                      <Badge variant="outline" className="absolute top-2 right-2 text-xs">
                        {snap.typeName ?? "Evidence"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
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
