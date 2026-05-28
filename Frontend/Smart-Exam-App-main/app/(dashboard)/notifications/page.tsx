"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UserNotificationDto,
} from "@/lib/api/user-notifications"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ClipboardList,
  Clock,
  UserCheck,
  Send,
} from "lucide-react"

// ── Notification type config ────────────────────────────────────────────────

const TYPE_CONFIG: Record<number, { en: string; ar: string; icon: typeof Bell }> = {
  1: { en: "Exam Assigned",            ar: "تعيين اختبار",        icon: ClipboardList },
  2: { en: "Exam Expiring",            ar: "اختبار ينتهي قريباً", icon: Clock },
  3: { en: "Exam Published",           ar: "نشر اختبار",          icon: BookOpen },
  4: { en: "Candidate Started Exam",   ar: "بدأ المرشح الاختبار", icon: UserCheck },
  5: { en: "Candidate Submitted Exam", ar: "سلّم المرشح الاختبار", icon: Send },
}

function getTypeConfig(type: number) {
  return TYPE_CONFIG[type] ?? { en: "Notification", ar: "إشعار", icon: Bell }
}

// ── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const { language } = useI18n()
  const isRtl = language === "ar"
  const { setUnreadCount } = useNotifications()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<UserNotificationDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [markingId, setMarkingId] = useState<number | null>(null)

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const loadPage = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const result = await getUserNotifications(p, PAGE_SIZE)
      setItems(result.items)
      setTotalCount(result.totalCount)
      setPage(p)
    } catch {
      toast.error(isRtl ? "فشل تحميل الإشعارات" : "Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [isRtl])

  useEffect(() => {
    loadPage(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkRead = async (id: number) => {
    setMarkingId(id)
    try {
      await markNotificationAsRead(id)
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error(isRtl ? "فشل تحديث الإشعار" : "Failed to mark as read")
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true)
    try {
      await markAllNotificationsAsRead()
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setUnreadCount(0)
      toast.success(isRtl ? "تم تحديد جميع الإشعارات كمقروءة" : "All notifications marked as read")
    } catch {
      toast.error(isRtl ? "فشل تحديث الإشعارات" : "Failed to mark all as read")
    } finally {
      setMarkingAllRead(false)
    }
  }

  const unreadOnPage = items.filter((n) => !n.isRead).length

  return (
    <div className="flex flex-col gap-6 p-6" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{isRtl ? "الإشعارات" : "Notifications"}</h1>
            {totalCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {isRtl ? `${totalCount} إشعار` : `${totalCount} notification${totalCount !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>
        {unreadOnPage > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAllRead
              ? (isRtl ? "جارٍ التحديث..." : "Updating...")
              : (isRtl ? "تحديد الكل كمقروء" : "Mark all as read")}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-muted-foreground">
            {isRtl ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <Bell className="h-10 w-10 opacity-30" />
              <p className="text-sm">{isRtl ? "لا توجد إشعارات" : "No notifications yet"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>{isRtl ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isRtl ? "العنوان" : "Title"}</TableHead>
                  <TableHead className="hidden md:table-cell">{isRtl ? "الرسالة" : "Message"}</TableHead>
                  <TableHead className="hidden sm:table-cell">{isRtl ? "التاريخ" : "Date"}</TableHead>
                  <TableHead className="w-24">{isRtl ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((notification) => {
                  const cfg = getTypeConfig(notification.type)
                  const Icon = cfg.icon
                  const title = isRtl ? notification.titleAr : notification.titleEn
                  const message = isRtl ? notification.messageAr : notification.messageEn
                  const typeName = isRtl ? cfg.ar : cfg.en
                  const formattedDate = new Date(notification.createdAt).toLocaleString(
                    isRtl ? "ar-AE" : "en-AE",
                    { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" }
                  )
                  return (
                    <TableRow
                      key={notification.id}
                      className={notification.isRead ? "opacity-60" : "font-medium bg-primary/5 hover:bg-primary/10"}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{typeName}</span>
                      </TableCell>
                      <TableCell>{title}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                        {message}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                        {formattedDate}
                      </TableCell>
                      <TableCell>
                        {notification.isRead ? (
                          <Badge variant="secondary" className="text-xs">
                            {isRtl ? "مقروء" : "Read"}
                          </Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-primary"
                            disabled={markingId === notification.id}
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            <CheckCheck className="h-3 w-3" />
                            {markingId === notification.id
                              ? "..."
                              : (isRtl ? "تحديد" : "Mark read")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1 || loading}
            onClick={() => loadPage(page - 1)}
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-muted-foreground min-w-[6rem] text-center">
            {isRtl ? `${page} / ${totalPages}` : `${page} / ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages || loading}
            onClick={() => loadPage(page + 1)}
          >
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
