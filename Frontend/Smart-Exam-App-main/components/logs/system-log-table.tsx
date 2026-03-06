"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { getLogDetail } from "@/lib/api/system-logs"
import type { SystemLogDto, SystemLogDetailDto, SystemLogFilter, SystemLogPagedResult } from "@/lib/api/system-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
} from "lucide-react"

interface SystemLogTableProps {
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  fetchLogs: (filter?: SystemLogFilter) => Promise<SystemLogPagedResult>
  showUserColumn?: boolean
  showErrorColumns?: boolean
}

export function SystemLogTable({
  title,
  titleAr,
  description,
  descriptionAr,
  fetchLogs,
  showUserColumn = true,
  showErrorColumns = false,
}: SystemLogTableProps) {
  const { language } = useI18n()
  const [logs, setLogs] = useState<SystemLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedLog, setSelectedLog] = useState<SystemLogDetailDto | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const filter: SystemLogFilter = { page, pageSize }
      if (search) filter.search = search
      if (levelFilter !== "all") filter.level = parseInt(levelFilter)
      if (dateFrom) filter.dateFrom = dateFrom
      if (dateTo) filter.dateTo = dateTo
      const result = await fetchLogs(filter)
      setLogs(result.items ?? [])
      setTotalCount(result.totalCount ?? 0)
    } catch {
      setLogs([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [fetchLogs, page, pageSize, search, levelFilter, dateFrom, dateTo])

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
      const detail = await getLogDetail(id)
      setSelectedLog(detail)
    } catch {
      setSelectedLog(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "Critical":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{level}</Badge>
      case "Error":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />{level}</Badge>
      case "Warning":
        return <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600"><AlertTriangle className="h-3 w-3" />{level}</Badge>
      default:
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" />{level}</Badge>
    }
  }

  const getStatusBadge = (code: number | null) => {
    if (!code) return null
    if (code >= 500) return <Badge variant="destructive">{code}</Badge>
    if (code >= 400) return <Badge variant="outline" className="border-amber-500 text-amber-600">{code}</Badge>
    return <Badge variant="secondary" className="text-green-600">{code}</Badge>
  }

  function formatTimestamp(ts: string) {
    const date = new Date(ts)
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
  }

  function formatJson(str: string | null) {
    if (!str) return null
    try {
      return JSON.stringify(JSON.parse(str), null, 2)
    } catch {
      return str
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{language === "ar" ? titleAr : title}</h1>
          <p className="text-muted-foreground">{language === "ar" ? descriptionAr : description}</p>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={language === "ar" ? "بحث في السجلات..." : "Search logs..."}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={language === "ar" ? "المستوى" : "Level"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Levels"}</SelectItem>
                <SelectItem value="1">{language === "ar" ? "معلومات" : "Info"}</SelectItem>
                <SelectItem value="2">{language === "ar" ? "تحذير" : "Warning"}</SelectItem>
                <SelectItem value="3">{language === "ar" ? "خطأ" : "Error"}</SelectItem>
                <SelectItem value="4">{language === "ar" ? "حرج" : "Critical"}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="w-[160px]"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="w-[160px]"
              placeholder="To"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {language === "ar" ? `${totalCount} سجل` : `${totalCount} logs`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="h-12 w-12 mb-4" />
              <p>{language === "ar" ? "لا توجد سجلات" : "No logs found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{language === "ar" ? "الوقت" : "Timestamp"}</TableHead>
                    <TableHead>{language === "ar" ? "المستوى" : "Level"}</TableHead>
                    {showUserColumn && <TableHead>{language === "ar" ? "المستخدم" : "User"}</TableHead>}
                    <TableHead>{language === "ar" ? "الإجراء" : "Action"}</TableHead>
                    <TableHead>{language === "ar" ? "المسار" : "Endpoint"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    {showErrorColumns && <TableHead>{language === "ar" ? "الخطأ" : "Error"}</TableHead>}
                    <TableHead className="w-[80px]">{language === "ar" ? "المدة" : "Duration"}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className={log.level === "Error" || log.level === "Critical" ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>{getLevelBadge(log.level)}</TableCell>
                      {showUserColumn && (
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[200px]">{log.userDisplayName || "—"}</span>
                            {log.userRole && <span className="text-xs text-muted-foreground">{log.userRole}</span>}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="text-sm font-mono">{log.action}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {log.httpMethod && (
                            <Badge variant="outline" className="text-xs font-mono">{log.httpMethod}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{log.endpoint}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.responseStatusCode)}</TableCell>
                      {showErrorColumns && (
                        <TableCell>
                          <span className="text-xs text-destructive truncate max-w-[250px] block">
                            {log.errorMessage || "—"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-xs text-muted-foreground">
                        {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openDetail(log.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Detail Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تفاصيل السجل" : "Log Details"}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : selectedLog ? (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <DetailField label={language === "ar" ? "التوقيت" : "Timestamp"} value={formatTimestamp(selectedLog.timestamp)} />
                  <DetailField label={language === "ar" ? "المستوى" : "Level"} value={selectedLog.level} />
                  <DetailField label={language === "ar" ? "التصنيف" : "Category"} value={selectedLog.category} />
                  <DetailField label={language === "ar" ? "المستخدم" : "User"} value={selectedLog.userDisplayName || "—"} />
                  <DetailField label={language === "ar" ? "الدور" : "Role"} value={selectedLog.userRole || "—"} />
                  <DetailField label={language === "ar" ? "الإجراء" : "Action"} value={selectedLog.action} />
                  <DetailField label="Endpoint" value={`${selectedLog.httpMethod || ""} ${selectedLog.endpoint || ""}`} />
                  <DetailField label={language === "ar" ? "رمز الحالة" : "Status Code"} value={String(selectedLog.responseStatusCode ?? "—")} />
                  <DetailField label={language === "ar" ? "المدة" : "Duration"} value={selectedLog.durationMs != null ? `${selectedLog.durationMs}ms` : "—"} />
                  <DetailField label="IP" value={selectedLog.ipAddress || "—"} />
                  <DetailField label="Trace ID" value={selectedLog.traceId || "—"} />
                  <DetailField label="User Agent" value={selectedLog.userAgent || "—"} />
                </div>

                {/* Error Details */}
                {selectedLog.errorMessage && (
                  <DetailBlock
                    label={language === "ar" ? "رسالة الخطأ" : "Error Message"}
                    value={selectedLog.errorMessage}
                    variant="error"
                  />
                )}
                {selectedLog.exceptionType && (
                  <DetailField label={language === "ar" ? "نوع الاستثناء" : "Exception Type"} value={selectedLog.exceptionType} />
                )}

                {/* Request Body */}
                {selectedLog.requestBody && (
                  <DetailBlock
                    label={language === "ar" ? "جسم الطلب" : "Request Body"}
                    value={formatJson(selectedLog.requestBody) || selectedLog.requestBody}
                    code
                  />
                )}

                {/* Response Body */}
                {selectedLog.responseBody && (
                  <DetailBlock
                    label={language === "ar" ? "جسم الاستجابة" : "Response Body"}
                    value={formatJson(selectedLog.responseBody) || selectedLog.responseBody}
                    code
                  />
                )}

                {/* Stack Trace */}
                {selectedLog.stackTrace && (
                  <DetailBlock
                    label={language === "ar" ? "تتبع المكدس" : "Stack Trace"}
                    value={selectedLog.stackTrace}
                    code
                    variant="error"
                  />
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

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm break-all">{value}</p>
    </div>
  )
}

function DetailBlock({ label, value, code, variant }: { label: string; value: string; code?: boolean; variant?: "error" }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <pre className={`text-xs p-3 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap break-all ${
        variant === "error"
          ? "bg-destructive/10 text-destructive border border-destructive/20"
          : "bg-muted text-foreground"
      } ${code ? "font-mono" : ""}`}>
        {value}
      </pre>
    </div>
  )
}
