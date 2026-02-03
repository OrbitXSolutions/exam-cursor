"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { getAuditLogs } from "@/lib/api/admin"
import type { AuditLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  Globe,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react"

export default function AuditLogPage() {
  const { t, language } = useI18n()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    loadLogs()
  }, [actionFilter, entityFilter])

  async function loadLogs() {
    setLoading(true)
    try {
      const params: { action?: string; entityName?: string } = {}
      if (actionFilter !== "all") params.action = actionFilter
      if (entityFilter !== "all") params.entityName = entityFilter
      const data = await getAuditLogs(params)
      setLogs(Array.isArray(data.items) ? data.items : [])
    } catch {
      // Error handled
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!search) return true
    return (
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityName.toLowerCase().includes(search.toLowerCase())
    )
  })

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "default"
      case "update":
        return "secondary"
      case "delete":
        return "destructive"
      case "login":
      case "logout":
        return "outline"
      default:
        return "secondary"
    }
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
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t("audit.exportLogs")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("audit.totalEntries")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("audit.today")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("audit.uniqueUsers")}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(logs.map((l) => l.actorId)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("audit.successRate")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.length > 0
                ? Math.round((logs.filter((l) => l.outcome === "Success").length / logs.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("audit.activityLogs")}</CardTitle>
          <CardDescription>{t("audit.activityLogsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("audit.searchLogs")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("audit.action")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("audit.allActions")}</SelectItem>
                <SelectItem value="Create">{language === "ar" ? "إنشاء" : "Create"}</SelectItem>
                <SelectItem value="Update">{language === "ar" ? "تحديث" : "Update"}</SelectItem>
                <SelectItem value="Delete">{language === "ar" ? "حذف" : "Delete"}</SelectItem>
                <SelectItem value="Login">{language === "ar" ? "تسجيل دخول" : "Login"}</SelectItem>
                <SelectItem value="Submit">{language === "ar" ? "إرسال" : "Submit"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("audit.entity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("audit.allEntities")}</SelectItem>
                <SelectItem value="User">{t("audit.user")}</SelectItem>
                <SelectItem value="Exam">{t("nav.exams")}</SelectItem>
                <SelectItem value="Question">{t("questionBank.questionBody").split(" ")[0]}</SelectItem>
                <SelectItem value="Attempt">{t("results.attempt")}</SelectItem>
              </SelectContent>
            </Select>
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
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t("audit.noLogsFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
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
                            onClick={() => {
                              setSelectedLog(log)
                              setDetailsOpen(true)
                            }}
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
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {language === "ar" ? "تفاصيل السجل" : "Log Details"}
            </DialogTitle>
            <DialogDescription>
              {language === "ar" ? "معلومات تفصيلية عن هذا الإجراء" : "Detailed information about this action"}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{language === "ar" ? "المستخدم" : "User"}</p>
                  <p className="font-medium">{selectedLog.actorName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.actorType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "الوقت" : "Timestamp"}
                  </p>
                  <p className="font-medium">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "الإجراء" : "Action"}
                  </p>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)} className="mt-1">
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{language === "ar" ? "الكيان" : "Entity"}</p>
                  <p className="font-medium">
                    {selectedLog.entityName} #{selectedLog.entityId}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "عنوان IP" : "IP Address"}
                  </p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{language === "ar" ? "المصدر" : "Source"}</p>
                  <p className="font-medium">
                    {selectedLog.source} / {selectedLog.channel}
                  </p>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "وكيل المستخدم" : "User Agent"}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">{selectedLog.userAgent}</p>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {language === "ar" ? "التفاصيل" : "Details"}
                  </p>
                  <pre className="rounded-lg bg-muted p-4 text-sm overflow-auto max-h-48">
                    {JSON.stringify(JSON.parse(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
