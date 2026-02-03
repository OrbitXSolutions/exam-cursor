"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  ArrowLeft,
  Monitor,
  MonitorOff,
  User,
  Calendar,
  AlertTriangle,
  Maximize2,
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

export default function ScreenStreamPage() {
  const params = useParams<{ candidateId: string }>()
  const candidateId = params.candidateId
  const router = useRouter()
  const { language, dir } = useI18n()

  const [sessions, setSessions] = useState<ProctorSession[]>([])
  const [screenSnapshots, setScreenSnapshots] = useState<ProctorSnapshot[]>([])
  const [selectedSession, setSelectedSession] = useState<ProctorSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<ProctorSnapshot | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Get proctor sessions for this candidate
        const query = new URLSearchParams()
        query.set("CandidateId", candidateId)
        query.set("PageSize", "50")

        const res = await apiClient.get<{ items?: ProctorSession[]; Items?: ProctorSession[] } | ProctorSession[]>(
          `/Proctor/sessions?${query}`
        )
        
        let sessionList: ProctorSession[] = []
        if (Array.isArray(res)) {
          sessionList = res
        } else if (res?.items) {
          sessionList = res.items
        } else if ((res as { Items?: ProctorSession[] })?.Items) {
          sessionList = (res as { Items: ProctorSession[] }).Items
        }

        setSessions(sessionList)

        if (sessionList.length > 0) {
          const latest = sessionList[0]
          setSelectedSession(latest)
          await loadScreenSnapshots(latest.id)
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
  }, [candidateId, language])

  async function loadScreenSnapshots(sessionId: number) {
    try {
      const res = await apiClient.get<{ items?: ProctorSnapshot[]; Items?: ProctorSnapshot[] } | ProctorSnapshot[]>(
        `/Proctor/session/${sessionId}/snapshots`
      )
      
      let snapshotList: ProctorSnapshot[] = []
      if (Array.isArray(res)) {
        snapshotList = res
      } else if (res?.items) {
        snapshotList = res.items
      } else if ((res as { Items?: ProctorSnapshot[] })?.Items) {
        snapshotList = (res as { Items: ProctorSnapshot[] }).Items
      }
      
      // Filter to only screen snapshots (type 2 = Screen typically)
      const screenOnly = snapshotList.filter(s => 
        s.snapshotTypeName?.toLowerCase().includes("screen") || s.snapshotType === 2
      )
      setScreenSnapshots(screenOnly.length > 0 ? screenOnly : snapshotList)
    } catch (err) {
      console.warn("Failed to load snapshots:", err)
      setScreenSnapshots([])
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
            <Monitor className="h-6 w-6" />
            {language === "ar" ? "بث الشاشة" : "Screen Streaming"}
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
            <MonitorOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد جلسات مراقبة لهذا المرشح" : "No proctoring sessions found for this candidate"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {language === "ar" ? "الجلسات" : "Sessions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session)
                        loadScreenSnapshots(session.id)
                      }}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedSession?.id === session.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{session.examTitleEn}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(session.startedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {selectedSession && (
              <>
                {/* Session Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedSession.examTitleEn}</CardTitle>
                      <Badge variant={selectedSession.statusName === "Active" ? "default" : "secondary"}>
                        {selectedSession.statusName}
                      </Badge>
                    </div>
                    <CardDescription>
                      {selectedSession.candidateName} • {new Date(selectedSession.startedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Screen Stream Placeholder / Snapshots */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      {language === "ar" ? "لقطات الشاشة" : "Screen Captures"}
                    </CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? `${screenSnapshots.length} لقطة شاشة مسجلة`
                        : `${screenSnapshots.length} screen captures recorded`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {screenSnapshots.length === 0 ? (
                      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
                        <MonitorOff className="h-16 w-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          {language === "ar"
                            ? "لا تتوفر لقطات شاشة"
                            : "No screen captures available"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Main display */}
                        {selectedImage ? (
                          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                            {selectedImage.fileUrl ? (
                              <img
                                src={selectedImage.fileUrl}
                                alt={`Screen ${selectedImage.id}`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Monitor className="h-16 w-16 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                              {new Date(selectedImage.capturedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                            </div>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-4 right-4"
                              onClick={() => setSelectedImage(null)}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">
                                {language === "ar"
                                  ? "انقر على لقطة لعرضها"
                                  : "Click a snapshot to view"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Thumbnail grid */}
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                          {screenSnapshots.map((snapshot) => (
                            <button
                              key={snapshot.id}
                              onClick={() => setSelectedImage(snapshot)}
                              className={`aspect-video rounded overflow-hidden border-2 transition-colors ${
                                selectedImage?.id === snapshot.id
                                  ? "border-primary"
                                  : "border-transparent hover:border-primary/50"
                              }`}
                            >
                              {snapshot.fileUrl ? (
                                <img
                                  src={snapshot.fileUrl}
                                  alt={`Screen ${snapshot.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Monitor className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Banner */}
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                  <CardContent className="flex items-start gap-3 p-4">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">
                        {language === "ar" ? "ملاحظة" : "Note"}
                      </p>
                      <p>
                        {language === "ar"
                          ? "يتم التقاط لقطات الشاشة تلقائياً أثناء الاختبار. البث المباشر متاح فقط أثناء الاختبار النشط."
                          : "Screen captures are taken automatically during the exam. Live streaming is only available during an active exam session."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
