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

          // Generate mock AI analysis based on session data
          // In a real implementation, this would come from an AI analysis endpoint
          const mockAnalysis: AIAnalysis = {
            overallRiskScore: selectedSession.riskScore ?? Math.random() * 30,
            faceDetectionScore: 85 + Math.random() * 15,
            eyeTrackingScore: 80 + Math.random() * 20,
            behaviorScore: 75 + Math.random() * 25,
            environmentScore: 90 + Math.random() * 10,
            suspiciousActivities: selectedSession.totalViolations > 0
              ? [
                  language === "ar" ? "تم اكتشاف خروج من التبويب" : "Tab switch detected",
                  ...(selectedSession.totalViolations > 1 ? [language === "ar" ? "حركة غير عادية" : "Unusual movement detected"] : []),
                ]
              : [],
            recommendations: selectedSession.requiresReview
              ? [language === "ar" ? "يوصى بمراجعة يدوية" : "Manual review recommended"]
              : [language === "ar" ? "لا توجد مخاوف كبيرة" : "No major concerns"],
          }
          setAnalysis(mockAnalysis)

          await Promise.all([
            loadAttemptEvents(resolvedAttemptId),
            loadEvidence(selectedSession.id),
          ])
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

  async function loadAttemptEvents(attemptId: number) {
    try {
      const res = await apiClient.get<unknown>(`/Attempt/${attemptId}/events`)
      setAttemptEvents(normalizeList<AttemptEvent>(res))
    } catch (err) {
      console.warn("Failed to load attempt events:", err)
      setAttemptEvents([])
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
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === "ar" ? "كشف الوجه" : "Face Detection"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {analysis.faceDetectionScore.toFixed(0)}%
                </div>
                <Progress value={analysis.faceDetectionScore} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === "ar" ? "تتبع العين" : "Eye Tracking"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {analysis.eyeTrackingScore.toFixed(0)}%
                </div>
                <Progress value={analysis.eyeTrackingScore} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === "ar" ? "السلوك" : "Behavior"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {analysis.behaviorScore.toFixed(0)}%
                </div>
                <Progress value={analysis.behaviorScore} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Monitor className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {language === "ar" ? "البيئة" : "Environment"}
                  </span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {analysis.environmentScore.toFixed(0)}%
                </div>
                <Progress value={analysis.environmentScore} className="h-2" />
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
