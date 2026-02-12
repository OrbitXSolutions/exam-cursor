"use client"

import { useState, useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Play,
  Save,
  Navigation,
  ArrowLeftRight,
  Maximize,
  Send,
  Timer,
  EyeOff,
  Eye,
  Copy,
  ClipboardPaste,
  MousePointer,
  AlertTriangle,
  Shield,
  Filter,
  FileText,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AttemptEvent {
  id: number
  attemptId: number
  eventType: number
  eventTypeName: string
  metadataJson?: string
  occurredAt: string
  // Enrichment fields (from enriched API)
  questionTextEn?: string
  questionTextAr?: string
  answerSummary?: string
}

interface AttemptEventLogProps {
  events: AttemptEvent[]
  className?: string
  maxHeight?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ALERT_EVENT_TYPES = new Set([
  "TabSwitched",
  "FullscreenExited",
  "WindowBlur",
  "CopyAttempt",
  "PasteAttempt",
  "RightClickAttempt",
  "TimedOut",
])

const LIFECYCLE_EVENT_TYPES = new Set([
  "Started",
  "Submitted",
  "TimedOut",
])

// ── Helpers ────────────────────────────────────────────────────────────────────

function getEventIcon(eventTypeName: string) {
  switch (eventTypeName) {
    case "Started":
      return <Play className="h-4 w-4" />
    case "AnswerSaved":
      return <Save className="h-4 w-4" />
    case "Navigated":
      return <Navigation className="h-4 w-4" />
    case "TabSwitched":
      return <ArrowLeftRight className="h-4 w-4" />
    case "FullscreenExited":
      return <Maximize className="h-4 w-4" />
    case "Submitted":
      return <Send className="h-4 w-4" />
    case "TimedOut":
      return <Timer className="h-4 w-4" />
    case "WindowBlur":
      return <EyeOff className="h-4 w-4" />
    case "WindowFocus":
      return <Eye className="h-4 w-4" />
    case "CopyAttempt":
      return <Copy className="h-4 w-4" />
    case "PasteAttempt":
      return <ClipboardPaste className="h-4 w-4" />
    case "RightClickAttempt":
      return <MousePointer className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

function getEventStyle(eventTypeName: string): {
  iconBg: string
  iconColor: string
  borderColor: string
  badgeBg: string
  badgeText: string
} {
  if (ALERT_EVENT_TYPES.has(eventTypeName)) {
    return {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-400",
      badgeBg: "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800",
      badgeText: "text-red-700 dark:text-red-300",
    }
  }
  if (eventTypeName === "Started") {
    return {
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      borderColor: "border-l-green-400",
      badgeBg: "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800",
      badgeText: "text-green-700 dark:text-green-300",
    }
  }
  if (eventTypeName === "Submitted") {
    return {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-400",
      badgeBg: "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800",
      badgeText: "text-blue-700 dark:text-blue-300",
    }
  }
  if (eventTypeName === "AnswerSaved") {
    return {
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      borderColor: "border-l-purple-400",
      badgeBg: "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800",
      badgeText: "text-purple-700 dark:text-purple-300",
    }
  }
  if (eventTypeName === "WindowFocus") {
    return {
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-l-emerald-400",
      badgeBg: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800",
      badgeText: "text-emerald-700 dark:text-emerald-300",
    }
  }
  return {
    iconBg: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-l-gray-300",
    badgeBg: "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    badgeText: "text-gray-700 dark:text-gray-300",
  }
}

function getEventLabel(eventTypeName: string, language: string): string {
  if (language !== "ar") {
    switch (eventTypeName) {
      case "Started": return "Exam Started"
      case "AnswerSaved": return "Answer Saved"
      case "Navigated": return "Navigated"
      case "TabSwitched": return "Tab Switched"
      case "FullscreenExited": return "Fullscreen Exited"
      case "Submitted": return "Exam Submitted"
      case "TimedOut": return "Timed Out"
      case "WindowBlur": return "Window Lost Focus"
      case "WindowFocus": return "Window Regained Focus"
      case "CopyAttempt": return "Copy Attempt"
      case "PasteAttempt": return "Paste Attempt"
      case "RightClickAttempt": return "Right Click Attempt"
      default: return eventTypeName
    }
  }
  switch (eventTypeName) {
    case "Started": return "بدء الاختبار"
    case "AnswerSaved": return "تم حفظ الإجابة"
    case "Navigated": return "انتقال"
    case "TabSwitched": return "تبديل التبويب"
    case "FullscreenExited": return "خروج من الشاشة الكاملة"
    case "Submitted": return "تم التسليم"
    case "TimedOut": return "انتهاء الوقت"
    case "WindowBlur": return "فقدان تركيز النافذة"
    case "WindowFocus": return "استعادة تركيز النافذة"
    case "CopyAttempt": return "محاولة نسخ"
    case "PasteAttempt": return "محاولة لصق"
    case "RightClickAttempt": return "محاولة نقر يمين"
    default: return eventTypeName
  }
}

function formatTime(dateStr: string, language: string): string {
  return new Date(dateStr).toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatDateTime(dateStr: string, language: string): string {
  return new Date(dateStr).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

// Parse metadata and return rendered description
function getEventDescription(
  event: AttemptEvent,
  language: string
): string | null {
  // For AnswerSaved — show question + answer from enrichment fields
  if (event.eventTypeName === "AnswerSaved") {
    const questionText = language === "ar" ? event.questionTextAr : event.questionTextEn
    if (questionText) {
      const truncated = questionText.length > 80 ? questionText.substring(0, 80) + "..." : questionText
      const answerPart = event.answerSummary
        ? ` → ${event.answerSummary.length > 60 ? event.answerSummary.substring(0, 60) + "..." : event.answerSummary}`
        : ""
      return `${truncated}${answerPart}`
    }
    // Fallback: parse questionId from metadata
    if (event.metadataJson) {
      try {
        const meta = JSON.parse(event.metadataJson)
        if (meta.questionId) {
          return language === "ar" ? `السؤال #${meta.questionId}` : `Question #${meta.questionId}`
        }
      } catch {}
    }
    return null
  }

  // For Started — show attempt number
  if (event.eventTypeName === "Started" && event.metadataJson) {
    try {
      const meta = JSON.parse(event.metadataJson)
      if (meta.attemptNumber) {
        return language === "ar" ? `المحاولة رقم ${meta.attemptNumber}` : `Attempt #${meta.attemptNumber}`
      }
    } catch {}
  }

  // For alert events with timestamps
  if (ALERT_EVENT_TYPES.has(event.eventTypeName) && event.metadataJson) {
    try {
      const meta = JSON.parse(event.metadataJson)
      if (meta.blocked) {
        return language === "ar" ? "تم الحظر" : "Blocked"
      }
    } catch {}
  }

  return null
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AttemptEventLog({ events, className, maxHeight = "600px" }: AttemptEventLogProps) {
  const { language, dir } = useI18n()
  const [showAlertsOnly, setShowAlertsOnly] = useState(false)

  const alertCount = useMemo(() => events.filter((e) => ALERT_EVENT_TYPES.has(e.eventTypeName)).length, [events])

  const filteredEvents = useMemo(() => {
    if (!showAlertsOnly) return events
    return events.filter((e) => ALERT_EVENT_TYPES.has(e.eventTypeName))
  }, [events, showAlertsOnly])

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { date: string; events: AttemptEvent[] }[] = []
    let currentDate = ""
    for (const event of filteredEvents) {
      const eventDate = new Date(event.occurredAt).toLocaleDateString(
        language === "ar" ? "ar-SA" : "en-US",
        { year: "numeric", month: "short", day: "numeric" }
      )
      if (eventDate !== currentDate) {
        currentDate = eventDate
        groups.push({ date: eventDate, events: [] })
      }
      groups[groups.length - 1].events.push(event)
    }
    return groups
  }, [filteredEvents, language])

  return (
    <Card className={`overflow-hidden ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {language === "ar" ? "سجل الأحداث" : "Event Log"}
            </CardTitle>
            <CardDescription className="mt-1">
              {language === "ar"
                ? `${events.length} حدث${alertCount > 0 ? ` • ${alertCount} تنبيه` : ""}`
                : `${events.length} events${alertCount > 0 ? ` • ${alertCount} alerts` : ""}`}
            </CardDescription>
          </div>
          {alertCount > 0 && (
            <Button
              variant={showAlertsOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAlertsOnly(!showAlertsOnly)}
              className="gap-2"
            >
              <Filter className="h-3.5 w-3.5" />
              <AlertTriangle className="h-3.5 w-3.5" />
              {showAlertsOnly
                ? language === "ar" ? "عرض الكل" : "Show All"
                : language === "ar" ? `التنبيهات (${alertCount})` : `Alerts (${alertCount})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{language === "ar" ? "لا توجد أحداث مسجلة" : "No events recorded"}</p>
          </div>
        ) : (
          <div className="overflow-y-auto pr-2" style={{ maxHeight }}>
            <div className="space-y-1">
              {groupedEvents.map((group, groupIdx) => (
                <div key={group.date}>
                  {/* Date header */}
                  {groupedEvents.length > 1 && (
                    <>
                      {groupIdx > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-xs font-medium text-muted-foreground">{group.date}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    </>
                  )}

                  {/* Events */}
                  {group.events.map((event, eventIdx) => {
                    const style = getEventStyle(event.eventTypeName)
                    const isAlert = ALERT_EVENT_TYPES.has(event.eventTypeName)
                    const description = getEventDescription(event, language)
                    const isLast = eventIdx === group.events.length - 1

                    return (
                      <div key={event.id} className="relative flex gap-3 group">
                        {/* Timeline line */}
                        {!isLast && (
                          <div className="absolute left-[17px] top-[34px] bottom-0 w-px bg-border" />
                        )}

                        {/* Icon */}
                        <div
                          className={`relative z-10 shrink-0 flex items-center justify-center w-[34px] h-[34px] rounded-full ${style.iconBg} ${style.iconColor}`}
                        >
                          {getEventIcon(event.eventTypeName)}
                        </div>

                        {/* Content */}
                        <div
                          className={`flex-1 min-w-0 pb-4 ${
                            isAlert ? `border-l-2 pl-3 -ml-1 ${style.borderColor}` : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`${style.badgeBg} ${style.badgeText} border`}
                            >
                              {getEventLabel(event.eventTypeName, language)}
                            </Badge>
                            {isAlert && (
                              <Badge className="bg-red-500 text-white border-transparent">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {language === "ar" ? "تنبيه" : "Alert"}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(event.occurredAt, language)}
                            </span>
                          </div>

                          {/* Description */}
                          {description && (
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
