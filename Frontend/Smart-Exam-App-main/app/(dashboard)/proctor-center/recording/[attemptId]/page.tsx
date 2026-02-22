"use client"

import { useState, useEffect, useRef } from "react"
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
  Video,
  VideoOff,
  Calendar,
  Clock,
  AlertTriangle,
  Play,
  Download,
  Info,
  Camera,
  Shield,
} from "lucide-react"

interface VideoRecordingData {
  evidenceId: number
  attemptId: number
  videoUrl: string
  contentType: string
  fileSize: number
  duration: number | null
  startAt: string | null
  endAt: string | null
  expiresAt: string | null
  retentionDays: number
  retentionMessage: string | null
  candidateName: string | null
  examTitle: string | null
  events: Array<{
    id: number
    eventType: string
    severity: number
    occurredAt: string
    metadataJson: string | null
  }>
  screenshots: Array<{
    id: number
    timestamp: string | null
    url: string
  }>
}

export default function AttemptVideoPage() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const router = useRouter()
  const { language, dir } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [data, setData] = useState<VideoRecordingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)

  useEffect(() => {
    async function loadRecording() {
      try {
        setLoading(true)
        setError(null)
        const result = await apiClient.get<VideoRecordingData>(
          `/Proctor/video-recording/${attemptId}`
        )
        setData(result)
      } catch (err: any) {
        console.error("Failed to load recording:", err)
        setError(err?.message || "Failed to load recording")
      } finally {
        setLoading(false)
      }
    }

    if (attemptId) {
      loadRecording()
    }
  }, [attemptId])

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "N/A"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }

  function getSeverityColor(severity: number): string {
    if (severity >= 8) return "text-red-600"
    if (severity >= 5) return "text-orange-600"
    if (severity >= 3) return "text-yellow-600"
    return "text-muted-foreground"
  }

  function getEventIcon(eventType: string): string {
    if (eventType.includes("Tab")) return "🔀"
    if (eventType.includes("Fullscreen")) return "🖥️"
    if (eventType.includes("Camera")) return "📷"
    if (eventType.includes("Copy") || eventType.includes("Paste")) return "📋"
    if (eventType.includes("Warning")) return "⚠️"
    if (eventType.includes("Terminated")) return "🛑"
    if (eventType.includes("Network")) return "🌐"
    if (eventType.includes("Face")) return "👤"
    return "📌"
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
            {language === "ar" ? "تسجيل المحاولة" : "Attempt Recording"}
          </h1>
          {data && (
            <p className="text-muted-foreground">
              {data.examTitle} — {language === "ar" ? `محاولة #${attemptId}` : `Attempt #${attemptId}`}
            </p>
          )}
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <VideoOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {error.includes("not found") || error.includes("404")
                ? language === "ar"
                  ? "لا يوجد تسجيل فيديو لهذه المحاولة"
                  : "No video recording available for this attempt"
                : error}
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player + Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* MP4 Player */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {language === "ar" ? "تسجيل الفيديو" : "Video Recording"}
                </CardTitle>
                {data.retentionMessage && (
                  <CardDescription className="flex items-center gap-1 text-orange-600">
                    <Clock className="h-3 w-3" />
                    {data.retentionMessage}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={`/api/proxy/Proctor/video-stream/${attemptId}`}
                    controls
                    playsInline
                    className="w-full h-full"
                    controlsList="nodownload"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(data.duration)}
                    </span>
                    <span>
                      {(data.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  {data.startAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(data.startAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Screenshots Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  {language === "ar" ? "اللقطات" : "Screenshots"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? `${data.screenshots.length} لقطة`
                    : `${data.screenshots.length} snapshots captured`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.screenshots.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    {language === "ar" ? "لا توجد لقطات" : "No screenshots available"}
                  </p>
                ) : (
                  <>
                    {/* Enlarged view */}
                    {selectedScreenshot && (
                      <div className="mb-4">
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                             onClick={() => setSelectedScreenshot(null)}>
                          <img
                            src={selectedScreenshot}
                            alt="Screenshot enlarged"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {/* Thumbnail grid */}
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {data.screenshots.map((ss) => (
                        <div
                          key={ss.id}
                          className="aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => setSelectedScreenshot(ss.url)}
                        >
                          <img
                            src={ss.url}
                            alt={`Screenshot ${ss.id}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Events Timeline (sidebar) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {language === "ar" ? "الأحداث" : "Proctoring Events"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? `${data.events.length} حدث`
                    : `${data.events.length} events recorded`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.events.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    {language === "ar" ? "لا توجد أحداث" : "No events recorded"}
                  </p>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {data.events.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 text-sm"
                        >
                          <span className="text-lg leading-none mt-0.5">
                            {getEventIcon(event.eventType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-medium truncate ${getSeverityColor(event.severity)}`}>
                                {event.eventType.replace(/([A-Z])/g, " $1").trim()}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.occurredAt).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Recording Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {language === "ar" ? "معلومات التسجيل" : "Recording Info"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "المحاولة" : "Attempt"}</span>
                  <span>#{attemptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "المدة" : "Duration"}</span>
                  <span>{formatDuration(data.duration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "الحجم" : "Size"}</span>
                  <span>{(data.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === "ar" ? "الصيغة" : "Format"}</span>
                  <span>{data.contentType}</span>
                </div>
                {data.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "ar" ? "انتهاء الصلاحية" : "Expires"}</span>
                    <span>{new Date(data.expiresAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

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
