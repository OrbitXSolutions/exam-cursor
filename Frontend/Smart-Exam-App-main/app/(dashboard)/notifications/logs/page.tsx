"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getNotificationLogs,
  retryNotification,
  sendNowNotification,
  type NotificationLogDto,
  type NotificationLogFilter,
} from "@/lib/api/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  RefreshCw,
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react"

const STATUS_CONFIG: Record<number, { en: string; ar: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  1: { en: "Pending", ar: "قيد الانتظار", variant: "secondary", icon: Clock },
  2: { en: "Sent", ar: "تم الإرسال", variant: "default", icon: CheckCircle2 },
  3: { en: "Failed", ar: "فشل", variant: "destructive", icon: XCircle },
}

const EVENT_LABELS: Record<number, { en: string; ar: string }> = {
  1: { en: "Exam Published", ar: "نشر الاختبار" },
  2: { en: "Result Published", ar: "نشر النتائج" },
  3: { en: "Exam Expired", ar: "انتهاء الاختبار" },
}

const CHANNEL_LABELS: Record<number, { en: string; ar: string; icon: typeof Mail }> = {
  1: { en: "Email", ar: "بريد إلكتروني", icon: Mail },
  2: { en: "SMS", ar: "رسالة قصيرة", icon: Smartphone },
}

export default function NotificationLogsPage() {
  const { language } = useI18n()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<NotificationLogDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [retryingId, setRetryingId] = useState<number | null>(null)
  const [sendingNowId, setSendingNowId] = useState<number | null>(null)

  // Filters
  const [filter, setFilter] = useState<NotificationLogFilter>({
    page: 1,
    pageSize: 20,
  })
  const [searchInput, setSearchInput] = useState("")

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNotificationLogs(filter)
      setLogs(result.items)
      setTotalCount(result.totalCount)
    } catch {
      toast.error(language === "ar" ? "فشل تحميل السجلات" : "Failed to load logs")
    } finally {
      setLoading(false)
    }
  }, [filter, language])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  async function handleRetry(logId: number) {
    setRetryingId(logId)
    try {
      await retryNotification(logId)
      toast.success(language === "ar" ? "تمت إعادة الجدولة" : "Notification re-queued")
      loadLogs()
    } catch {
      toast.error(language === "ar" ? "فشلت إعادة المحاولة" : "Retry failed")
    } finally {
      setRetryingId(null)
    }
  }

  async function handleSendNow(logId: number) {
    setSendingNowId(logId)
    try {
      await sendNowNotification(logId)
      toast.success(language === "ar" ? "تمت جدولة الإرسال الفوري" : "Queued for immediate sending")
      loadLogs()
    } catch {
      toast.error(language === "ar" ? "فشل الإرسال" : "Send failed")
    } finally {
      setSendingNowId(null)
    }
  }

  const totalPages = Math.ceil(totalCount / (filter.pageSize ?? 20))
  const currentPage = filter.page ?? 1

  // Stats
  const sentCount = logs.filter((l) => l.status === 2).length
  const failedCount = logs.filter((l) => l.status === 3).length
  const pendingCount = logs.filter((l) => l.status === 1).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "ar" ? "سجل الإشعارات" : "Notification Log"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ar"
              ? `${totalCount} إشعار إجمالي`
              : `${totalCount} total notifications`}
          </p>
        </div>
        <Button variant="outline" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 me-2 ${loading ? "animate-spin" : ""}`} />
          {language === "ar" ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "قيد الانتظار" : "Pending"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentCount}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "تم الإرسال" : "Sent"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedCount}</p>
              <p className="text-xs text-muted-foreground">{language === "ar" ? "فشل" : "Failed"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Status */}
            <Select
              value={filter.status != null ? String(filter.status) : "all"}
              onValueChange={(v) =>
                setFilter((prev) => ({
                  ...prev,
                  status: v === "all" ? undefined : parseInt(v),
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Status"}</SelectItem>
                <SelectItem value="1">{language === "ar" ? "قيد الانتظار" : "Pending"}</SelectItem>
                <SelectItem value="2">{language === "ar" ? "تم الإرسال" : "Sent"}</SelectItem>
                <SelectItem value="3">{language === "ar" ? "فشل" : "Failed"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Channel */}
            <Select
              value={filter.channel != null ? String(filter.channel) : "all"}
              onValueChange={(v) =>
                setFilter((prev) => ({
                  ...prev,
                  channel: v === "all" ? undefined : parseInt(v),
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "القناة" : "Channel"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Channels"}</SelectItem>
                <SelectItem value="1">{language === "ar" ? "بريد إلكتروني" : "Email"}</SelectItem>
                <SelectItem value="2">{language === "ar" ? "رسالة قصيرة" : "SMS"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Event Type */}
            <Select
              value={filter.eventType != null ? String(filter.eventType) : "all"}
              onValueChange={(v) =>
                setFilter((prev) => ({
                  ...prev,
                  eventType: v === "all" ? undefined : parseInt(v),
                  page: 1,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={language === "ar" ? "نوع الحدث" : "Event Type"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Events"}</SelectItem>
                <SelectItem value="1">{language === "ar" ? "نشر الاختبار" : "Exam Published"}</SelectItem>
                <SelectItem value="2">{language === "ar" ? "نشر النتائج" : "Result Published"}</SelectItem>
                <SelectItem value="3">{language === "ar" ? "انتهاء الاختبار" : "Exam Expired"}</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div>
              <Input
                type="date"
                value={filter.dateFrom ?? ""}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    dateFrom: e.target.value || undefined,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {language === "ar" ? "لا توجد سجلات" : "No logs found"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "المرشح" : "Candidate"}</TableHead>
                    <TableHead>{language === "ar" ? "الاختبار" : "Exam"}</TableHead>
                    <TableHead>{language === "ar" ? "الحدث" : "Event"}</TableHead>
                    <TableHead>{language === "ar" ? "القناة" : "Channel"}</TableHead>
                    <TableHead>{language === "ar" ? "المستلم" : "Recipient"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{language === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const statusCfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG[1]
                    const eventLabel = EVENT_LABELS[log.eventType]
                    const channelCfg = CHANNEL_LABELS[log.channel]
                    const StatusIcon = statusCfg.icon
                    const ChannelIcon = channelCfg?.icon ?? Mail

                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium max-w-[150px] truncate">
                          {log.candidateName}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {log.examTitle ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {language === "ar" ? eventLabel?.ar : eventLabel?.en}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <ChannelIcon className="h-3.5 w-3.5" />
                            <span className="text-xs">
                              {language === "ar" ? channelCfg?.ar : channelCfg?.en}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate">
                          {log.channel === 1 ? log.recipientEmail : log.recipientPhone}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {language === "ar" ? statusCfg.ar : statusCfg.en}
                          </Badge>
                          {log.retryCount > 0 && (
                            <span className="ms-1 text-[10px] text-muted-foreground">
                              (×{log.retryCount})
                            </span>
                          )}
                          {log.errorMessage && (
                            <p className="text-[11px] text-destructive mt-0.5 max-w-[200px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {log.sentAt
                            ? new Date(log.sentAt).toLocaleString(language === "ar" ? "ar" : "en")
                            : new Date(log.createdDate).toLocaleString(language === "ar" ? "ar" : "en")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Send Now - for Pending and Failed */}
                            {(log.status === 1 || log.status === 3) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSendNow(log.id)}
                                disabled={sendingNowId === log.id}
                                title={language === "ar" ? "إرسال الآن" : "Send Now"}
                              >
                                {sendingNowId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {/* Retry - only for Failed */}
                            {log.status === 3 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRetry(log.id)}
                                disabled={retryingId === log.id}
                                title={language === "ar" ? "إعادة المحاولة" : "Retry"}
                              >
                                {retryingId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? `صفحة ${currentPage} من ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setFilter((prev) => ({ ...prev, page: currentPage - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setFilter((prev) => ({ ...prev, page: currentPage + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
