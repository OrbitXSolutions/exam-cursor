"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { AttemptEventLog, type AttemptEvent } from "@/components/attempt-event-log"
import {
  ArrowLeft,
  Video,
  VideoOff,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  Download,
  Info,
} from "lucide-react"

interface ProctorSession {
  id: number
  attemptId: number
  examId: number
  examTitleEn: string
  examTitleAr?: string
  candidateId: string
  candidateName: string
  status: number
  statusName: string
  startedAt: string
  endedAt?: string
  totalViolations: number
  riskScore?: number
}

interface ProctorSnapshot {
  id: number
  sessionId: number
  capturedAt: string
  snapshotType: number
  snapshotTypeName: string
  filePath: string
  fileUrl?: string
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



export default function CandidateVideoPage() {
  const params = useParams<{ candidateId: string }>()
  const candidateId = params.candidateId
  const router = useRouter()
  const searchParams = useSearchParams()
  const attemptIdFromQuery = Number(searchParams.get("attemptId") || "")
  const { language, dir } = useI18n()

  const [sessions, setSessions] = useState<ProctorSession[]>([])
  const [snapshots, setSnapshots] = useState<ProctorSnapshot[]>([])
  const [attemptEvents, setAttemptEvents] = useState<AttemptEvent[]>([])
  const [selectedSession, setSelectedSession] = useState<ProctorSession | null>(null)
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

        // Get proctor sessions for this candidate
        const query = new URLSearchParams()
        query.set("CandidateId", candidateId)
        query.set("PageSize", "50")

        const res = await apiClient.get<unknown>(`/Proctor/sessions?${query}`)
        const sessionList = normalizeList<ProctorSession>(res)

        let selected = sessionList[0] ?? null
        if (attemptIdFromQuery && sessionList.length > 0) {
          const match = sessionList.find((s) => s.attemptId === attemptIdFromQuery)
          if (match) {
            selected = match
          }
        }

        setSessions(sessionList)

        if (selected) {
          setSelectedSession(selected)
          await Promise.all([loadSnapshots(selected.id), loadAttemptEvents(selected.attemptId)])
        } else {
          setAttemptEvents([])
        }
      } catch (err) {
        console.error("Failed to load proctor data:", err)
        setError(language === "ar" ? "فشل في تحميل بيانات المراقبة" : "Failed to load proctoring data")
      } finally {
        setLoading(false)
      }
    }

    if (candidateId) {
      loadData()
    }
  }, [candidateId, language, attemptIdFromQuery])

  async function loadSnapshots(sessionId: number) {
    try {
      const res = await apiClient.get<unknown>(`/Proctor/session/${sessionId}/evidence`)
      const evidenceList = normalizeList<ProctorEvidence>(res)
      const imageEvidence = evidenceList.filter(
        (e) =>
          e.type === 3 ||
          e.typeName?.toLowerCase().includes("image") ||
          e.typeName?.toLowerCase().includes("photo")
      )

      const snapshotList: ProctorSnapshot[] = (imageEvidence.length > 0 ? imageEvidence : evidenceList).map((e) => ({
        id: e.id,
        sessionId,
        capturedAt: e.startAt ?? e.uploadedAt ?? e.endAt ?? new Date().toISOString(),
        snapshotType: e.type ?? 0,
        snapshotTypeName: e.typeName ?? "",
        filePath: e.fileName ?? "",
        fileUrl: normalizeEvidenceUrl(e.previewUrl ?? e.downloadUrl),
      }))

      setSnapshots(snapshotList)
    } catch (err) {
      console.warn("Failed to load snapshots:", err)
      setSnapshots([])
    }
  }

  async function loadAttemptEvents(attemptId: number) {
    try {
      const res = await apiClient.get<unknown>(`/Attempt/${attemptId}/events`)
      const eventList = normalizeList<AttemptEvent>(res)
      setAttemptEvents(eventList)
    } catch (err) {
      console.warn("Failed to load attempt events:", err)
      setAttemptEvents([])
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            {language === "ar" ? "فيديو المرشح" : "Candidate Video"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? `المرشح: ${candidateId}` : `Candidate: ${candidateId}`}
          </p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد جلسات مراقبة لهذا المرشح" : "No proctoring sessions found for this candidate"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === "ar" ? "الجلسات" : "Sessions"}
              </CardTitle>
              <CardDescription>
                {language === "ar" ? `${sessions.length} جلسة` : `${sessions.length} sessions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session)
                        loadSnapshots(session.id)
                        loadAttemptEvents(session.attemptId)
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedSession?.id === session.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{session.examTitleEn}</span>
                        <Badge variant={session.statusName === "Active" ? "default" : "secondary"} className="text-xs">
                          {session.statusName}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                      </div>
                      {session.totalViolations > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3" />
                          {session.totalViolations} {language === "ar" ? "مخالفة" : "violations"}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedSession && (
              <>
                {/* Session Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedSession.examTitleEn}</CardTitle>
                    <CardDescription>
                      {selectedSession.candidateName} ({selectedSession.candidateId})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{language === "ar" ? "البداية" : "Started"}</p>
                          <p className="text-sm font-medium">
                            {new Date(selectedSession.startedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</p>
                          <Badge variant={selectedSession.statusName === "Active" ? "default" : "secondary"}>
                            {selectedSession.statusName}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{language === "ar" ? "المخالفات" : "Violations"}</p>
                          <p className="text-sm font-medium">{selectedSession.totalViolations}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{language === "ar" ? "الخطورة" : "Risk Score"}</p>
                          <p className="text-sm font-medium">{selectedSession.riskScore ?? "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Player */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      {language === "ar" ? "تسجيل الفيديو" : "Video Recording"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedSession?.attemptId ? (
                      <div className="space-y-3">
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                          <video
                            src={`/api/proxy/Proctor/video-stream/${selectedSession.attemptId}`}
                            controls
                            playsInline
                            className="w-full h-full"
                            controlsList="nodownload"
                            onError={() => {
                              // Video not available, show placeholder
                              const el = document.getElementById("video-fallback")
                              if (el) el.style.display = "flex"
                              const vid = document.getElementById("video-player")
                              if (vid) vid.style.display = "none"
                            }}
                            id="video-player"
                          >
                            Your browser does not support the video tag.
                          </video>
                          <div id="video-fallback" className="hidden aspect-video bg-muted rounded-lg flex-col items-center justify-center">
                            <VideoOff className="h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                              {language === "ar"
                                ? "تسجيل الفيديو غير متوفر حالياً"
                                : "Video recording not available yet"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/proctor-center/recording/${selectedSession.attemptId}`)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {language === "ar" ? "عرض التسجيل الكامل" : "View Full Recording"}
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                        <VideoOff className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                          {language === "ar"
                            ? "تسجيل الفيديو غير متوفر حالياً"
                            : "Video recording not available"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Snapshots */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === "ar" ? "اللقطات" : "Snapshots"}
                    </CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? `${snapshots.length} لقطة مسجلة`
                        : `${snapshots.length} snapshots captured`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {snapshots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {language === "ar" ? "لا توجد لقطات متاحة" : "No snapshots available"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {snapshots.map((snapshot) => (
                          <div key={snapshot.id} className="relative group">
                            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                              {snapshot.fileUrl ? (
                                <img
                                  src={snapshot.fileUrl}
                                  alt={`Snapshot ${snapshot.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(snapshot.capturedAt).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US")}
                            </div>
                            <Badge variant="outline" className="absolute top-2 right-2 text-xs">
                              {snapshot.snapshotTypeName}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Attempt Events */}
                <AttemptEventLog events={attemptEvents} />
              </>
            )}
          </div>
        </div>
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
