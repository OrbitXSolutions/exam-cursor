"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { getAuditLogs, getAuditLogDetail } from "@/lib/api/admin"
import type { AuditLog } from "@/lib/types"
import type { AuditLogDetail } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  Globe,
} from "lucide-react"

export default function AuditLogPage() {
  const { t, language } = useI18n()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs({
        search: search || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        entityName: entityFilter !== "all" ? entityFilter : undefined,
        outcome: outcomeFilter !== "all" ? parseInt(outcomeFilter) : undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        page,
        pageSize,
      })
      setLogs(Array.isArray(data.items) ? data.items : [])
      setTotalCount(data.totalCount)
    } catch {
      setLogs([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, actionFilter, entityFilter, outcomeFilter, dateFrom, dateTo])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadLogs, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadLogs])

  async function openDetail(id: number) {
    setDetailLoading(true)
    setDetailsOpen(true)
    try {
      const detail = await getAuditLogDetail(id)
      setSelectedLog(detail)
    } catch {
      setSelectedLog(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getActionBadgeVariant = (action: string) => {
    const a = action.toLowerCase()
    if (a.includes("login") && !a.includes("failed")) return "outline"
    if (a.includes("failed") || a.includes("force")) return "destructive"
    if (a.includes("created") || a.includes("added")) return "default"
    if (a.includes("decision")) return "secondary"
    return "secondary"
  }

  const getOutcomeIcon = (outcome: string) => {
    if (outcome === "Success") {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <XCircle className="h-4 w-4 text-destructive" />
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("audit.title")}</h1>
          <p className="text-muted-foreground">{t("audit.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {language === "ar" ? "تحديث تلقائي" : "Auto Refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("audit.activityLogs")}</CardTitle>
          <CardDescription>{t("audit.activityLogsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("audit.searchLogs")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t("audit.action")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("audit.allActions")}</SelectItem>
                  <SelectItem value="Auth.Login">{language === "ar" ? "تسجيل دخول" : "Login"}</SelectItem>
                  <SelectItem value="Auth.LoginFailed">{language === "ar" ? "فشل تسجيل دخول" : "Login Failed"}</SelectItem>
                  <SelectItem value="Auth.Logout">{language === "ar" ? "تسجيل خروج" : "Logout"}</SelectItem>
                  <SelectItem value="Auth.PasswordChanged">{language === "ar" ? "تغيير كلمة المرور" : "Password Changed"}</SelectItem>
                  <SelectItem value="Auth.RoleChanged">{language === "ar" ? "تغيير الدور" : "Role Changed"}</SelectItem>
                  <SelectItem value="User.Created">{language === "ar" ? "إنشاء مستخدم" : "User Created"}</SelectItem>
                  <SelectItem value="User.Updated">{language === "ar" ? "تحديث مستخدم" : "User Updated"}</SelectItem>
                  <SelectItem value="User.Deleted">{language === "ar" ? "حذف مستخدم" : "User Deleted"}</SelectItem>
                  <SelectItem value="Exam.Created">{language === "ar" ? "إنشاء اختبار" : "Exam Created"}</SelectItem>
                  <SelectItem value="Exam.Published">{language === "ar" ? "نشر اختبار" : "Exam Published"}</SelectItem>
                  <SelectItem value="Exam.Deleted">{language === "ar" ? "حذف اختبار" : "Exam Deleted"}</SelectItem>
                  <SelectItem value="Attempt.Started">{language === "ar" ? "بدء محاولة" : "Attempt Started"}</SelectItem>
                  <SelectItem value="Attempt.Submitted">{language === "ar" ? "تقديم محاولة" : "Attempt Submitted"}</SelectItem>
                  <SelectItem value="Attempt.ForceSubmitted">{language === "ar" ? "إنهاء إجباري" : "Force Submit"}</SelectItem>
                  <SelectItem value="Attempt.TimeAdded">{language === "ar" ? "إضافة وقت" : "Time Added"}</SelectItem>
                  <SelectItem value="Grading.Completed">{language === "ar" ? "اكتمال التصحيح" : "Grading Completed"}</SelectItem>
                  <SelectItem value="Grading.ManualGrade">{language === "ar" ? "تصحيح يدوي" : "Manual Grade"}</SelectItem>
                  <SelectItem value="Result.Finalized">{language === "ar" ? "نتيجة نهائية" : "Result Finalized"}</SelectItem>
                  <SelectItem value="Result.Published">{language === "ar" ? "نشر نتيجة" : "Result Published"}</SelectItem>
                  <SelectItem value="Incident.Created">{language === "ar" ? "إنشاء حادثة" : "Incident Created"}</SelectItem>
                  <SelectItem value="Incident.DecisionMade">{language === "ar" ? "قرار حادثة" : "Incident Decision"}</SelectItem>
                  <SelectItem value="Proctor.SessionStarted">{language === "ar" ? "بدء جلسة مراقبة" : "Proctor Session"}</SelectItem>
                  <SelectItem value="Proctor.DecisionMade">{language === "ar" ? "قرار المراقب" : "Proctor Decision"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("audit.entity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("audit.allEntities")}</SelectItem>
                  <SelectItem value="User">{language === "ar" ? "مستخدم" : "User"}</SelectItem>
                  <SelectItem value="Auth">{language === "ar" ? "مصادقة" : "Auth"}</SelectItem>
                  <SelectItem value="Exam">{language === "ar" ? "اختبار" : "Exam"}</SelectItem>
                  <SelectItem value="Attempt">{language === "ar" ? "محاولة" : "Attempt"}</SelectItem>
                  <SelectItem value="Grading">{language === "ar" ? "تصحيح" : "Grading"}</SelectItem>
                  <SelectItem value="Result">{language === "ar" ? "نتيجة" : "Result"}</SelectItem>
                  <SelectItem value="IncidentCase">{language === "ar" ? "حادثة" : "Incident"}</SelectItem>
                  <SelectItem value="Proctor">{language === "ar" ? "مراقب" : "Proctor"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Select value={outcomeFilter} onValueChange={(v) => { setOutcomeFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={language === "ar" ? "النتيجة" : "Outcome"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "ar" ? "كل النتائج" : "All Outcomes"}</SelectItem>
                  <SelectItem value="1">{language === "ar" ? "ناجح" : "Success"}</SelectItem>
                  <SelectItem value="2">{language === "ar" ? "فاشل" : "Failure"}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="w-full sm:w-[160px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="w-full sm:w-[160px]"
              />
            </div>
          </div>

          {/* Count */}
          <div className="mb-3 text-sm font-medium text-muted-foreground">
            {language === "ar" ? `${totalCount} سجل` : `${totalCount} logs`}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("audit.timestamp")}</TableHead>
                    <TableHead>{t("audit.user")}</TableHead>
                    <TableHead>{t("audit.action")}</TableHead>
                    <TableHead>{t("audit.entity")}</TableHead>
                    <TableHead>{t("audit.outcome")}</TableHead>
                    <TableHead>{t("audit.source")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t("audit.noLogsFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {log.actorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{log.actorName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {log.entityName}
                            <span className="text-xs ml-1">#{log.entityId}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getOutcomeIcon(log.outcome)}
                            <span className="text-sm">{log.outcome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span className="text-sm">{log.channel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(log.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? `صفحة ${page} من ${totalPages}`
                  : `Page ${page} of ${totalPages}`}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {language === "ar" ? "تفاصيل السجل" : "Log Details"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "معلومات تفصيلية عن هذا الإجراء" : "Detailed information about this action"}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : selectedLog ? (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Summary Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "المستخدم" : "User"}</p>
                    <p className="text-sm font-medium">{selectedLog.actorDisplayName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{selectedLog.actorType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الوقت" : "Timestamp"}</p>
                    <p className="text-sm">{formatTimestamp(selectedLog.occurredAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الإجراء" : "Action"}</p>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-1">
                      {selectedLog.action}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الكيان" : "Entity"}</p>
                    <p className="text-sm">{selectedLog.entityName} #{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "النتيجة" : "Outcome"}</p>
                    <div className="flex items-center gap-1">
                      {getOutcomeIcon(selectedLog.outcome)}
                      <span className="text-sm">{selectedLog.outcome}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "المدة" : "Duration"}</p>
                    <p className="text-sm">{selectedLog.durationMs != null ? `${selectedLog.durationMs}ms` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "عنوان IP" : "IP Address"}</p>
                    <p className="text-sm font-mono">{selectedLog.ipAddress || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "المصدر" : "Source"}</p>
                    <p className="text-sm">{selectedLog.source} / {selectedLog.channel}</p>
                  </div>
                  {selectedLog.correlationId && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Correlation ID</p>
                      <p className="text-sm font-mono break-all">{selectedLog.correlationId}</p>
                    </div>
                  )}
                </div>

                {selectedLog.userAgent && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {language === "ar" ? "وكيل المستخدم" : "User Agent"}
                    </p>
                    <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                  </div>
                )}

                {selectedLog.errorMessage && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {language === "ar" ? "رسالة الخطأ" : "Error Message"}
                    </p>
                    <pre className="text-xs p-3 rounded-md overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all bg-destructive/10 text-destructive border border-destructive/20">
                      {selectedLog.errorMessage}
                    </pre>
                  </div>
                )}

                {/* Before / After comparison */}
                {(selectedLog.beforeJson || selectedLog.afterJson) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedLog.beforeJson && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {language === "ar" ? "قبل" : "Before"}
                        </p>
                        <pre className="text-xs p-3 rounded-md overflow-auto max-h-[250px] bg-muted font-mono">
                          {formatJson(selectedLog.beforeJson)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.afterJson && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {language === "ar" ? "بعد" : "After"}
                        </p>
                        <pre className="text-xs p-3 rounded-md overflow-auto max-h-[250px] bg-muted font-mono">
                          {formatJson(selectedLog.afterJson)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {selectedLog.metadataJson && !selectedLog.beforeJson && !selectedLog.afterJson && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {language === "ar" ? "التفاصيل" : "Details"}
                    </p>
                    <pre className="text-xs p-3 rounded-md overflow-auto max-h-[250px] bg-muted font-mono">
                      {formatJson(selectedLog.metadataJson)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              {language === "ar" ? "لا توجد بيانات" : "No data available"}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatJson(str: string | null): string {
  if (!str) return ""
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}
