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

  // Demo audit log entries covering all roles and common actions
  const demoLogs: AuditLog[] = [
    { id: 1, actorId: "u1", actorName: "Ahmed Hassan", actorType: "Admin", action: "Login", entityName: "Session", entityId: "s-101", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.10", userAgent: "Mozilla/5.0 Chrome/120", timestamp: "2026-02-17T09:02:14Z", details: '{"role":"Admin","department":"IT"}' },
    { id: 2, actorId: "u1", actorName: "Ahmed Hassan", actorType: "Admin", action: "Create", entityName: "User", entityId: "u-22", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.10", userAgent: null, timestamp: "2026-02-17T09:10:33Z", details: '{"email":"new.user@examcore.com","role":"Instructor","department":"HR"}' },
    { id: 3, actorId: "u1", actorName: "Ahmed Hassan", actorType: "Admin", action: "Update", entityName: "User", entityId: "u-18", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.10", userAgent: null, timestamp: "2026-02-17T09:15:50Z", details: '{"field":"role","from":"Instructor","to":"Examiner"}' },
    { id: 4, actorId: "u2", actorName: "Sara Khaled", actorType: "Instructor", action: "Create", entityName: "Exam", entityId: "ex-45", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.15", userAgent: null, timestamp: "2026-02-17T09:22:07Z", details: '{"title":"IT Security Fundamentals","sections":3,"questions":25}' },
    { id: 5, actorId: "u2", actorName: "Sara Khaled", actorType: "Instructor", action: "Create", entityName: "Question", entityId: "q-312", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.15", userAgent: null, timestamp: "2026-02-17T09:30:18Z", details: '{"type":"MCQ","subject":"Cybersecurity","difficulty":"Medium"}' },
    { id: 6, actorId: "u2", actorName: "Sara Khaled", actorType: "Instructor", action: "Update", entityName: "Exam", entityId: "ex-45", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.15", userAgent: null, timestamp: "2026-02-17T09:35:44Z", details: '{"field":"status","from":"Draft","to":"Published"}' },
    { id: 7, actorId: "u3", actorName: "Nour Ahmed", actorType: "Candidate", action: "Login", entityName: "Session", entityId: "s-205", correlationId: null, tenantId: null, source: "Web", channel: "Exam Portal", outcome: "Success", ipAddress: "10.0.0.55", userAgent: "Mozilla/5.0 Chrome/120", timestamp: "2026-02-17T10:00:02Z", details: null },
    { id: 8, actorId: "u3", actorName: "Nour Ahmed", actorType: "Candidate", action: "Submit", entityName: "Attempt", entityId: "att-89", correlationId: null, tenantId: null, source: "Web", channel: "Exam Portal", outcome: "Success", ipAddress: "10.0.0.55", userAgent: null, timestamp: "2026-02-17T10:45:30Z", details: '{"examTitle":"IT Security Fundamentals","duration":"45m","answered":24,"total":25}' },
    { id: 9, actorId: "u4", actorName: "Omar Fathi", actorType: "Examiner", action: "Update", entityName: "Grading", entityId: "gr-33", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.20", userAgent: null, timestamp: "2026-02-17T11:10:12Z", details: '{"candidate":"Nour Ahmed","question":"Q5 - Essay","score":8,"maxScore":10}' },
    { id: 10, actorId: "u4", actorName: "Omar Fathi", actorType: "Examiner", action: "Update", entityName: "Grading", entityId: "gr-34", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.20", userAgent: null, timestamp: "2026-02-17T11:18:45Z", details: '{"candidate":"Nour Ahmed","status":"Completed","totalScore":"88/100"}' },
    { id: 11, actorId: "u5", actorName: "Layla Amr", actorType: "Proctor", action: "Login", entityName: "Session", entityId: "s-210", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.25", userAgent: "Mozilla/5.0 Firefox/115", timestamp: "2026-02-17T09:55:00Z", details: null },
    { id: 12, actorId: "u5", actorName: "Layla Amr", actorType: "Proctor", action: "Create", entityName: "Incident", entityId: "inc-12", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.25", userAgent: null, timestamp: "2026-02-17T10:22:08Z", details: '{"candidate":"Nour Ahmed","type":"Tab Switch","severity":"Medium","exam":"IT Security"}' },
    { id: 13, actorId: "u5", actorName: "Layla Amr", actorType: "Proctor", action: "Update", entityName: "Proctor Session", entityId: "ps-18", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.25", userAgent: null, timestamp: "2026-02-17T10:50:33Z", details: '{"decision":"Approved","candidate":"Nour Ahmed","violations":1}' },
    { id: 14, actorId: "u6", actorName: "Mona Youssef", actorType: "Admin", action: "Update", entityName: "Department", entityId: "dept-2", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.30", userAgent: null, timestamp: "2026-02-17T08:45:20Z", details: '{"department":"HR","action":"Assigned user","user":"Huda Samir"}' },
    { id: 15, actorId: "u6", actorName: "Mona Youssef", actorType: "Admin", action: "Update", entityName: "User", entityId: "u-15", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.30", userAgent: null, timestamp: "2026-02-17T08:48:10Z", details: '{"field":"role","from":"Candidate","to":"Proctor"}' },
    { id: 16, actorId: "u2", actorName: "Sara Khaled", actorType: "Instructor", action: "Delete", entityName: "Question", entityId: "q-280", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.15", userAgent: null, timestamp: "2026-02-17T09:40:55Z", details: '{"reason":"Duplicate question","subject":"Networking"}' },
    { id: 17, actorId: "u3", actorName: "Salma Hussein", actorType: "Candidate", action: "Login", entityName: "Session", entityId: "s-211", correlationId: null, tenantId: null, source: "Web", channel: "Exam Portal", outcome: "Failure", ipAddress: "10.0.0.60", userAgent: "Mozilla/5.0 Safari/17", timestamp: "2026-02-17T10:05:15Z", details: '{"reason":"Invalid password","attempts":3}' },
    { id: 18, actorId: "u7", actorName: "Tarek Ibrahim", actorType: "Admin", action: "Create", entityName: "Department", entityId: "dept-4", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.35", userAgent: null, timestamp: "2026-02-17T08:30:00Z", details: '{"name":"Quality Assurance","code":"QA"}' },
    { id: 19, actorId: "u2", actorName: "Sara Khaled", actorType: "Instructor", action: "Update", entityName: "Exam", entityId: "ex-40", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Failure", ipAddress: "192.168.1.15", userAgent: null, timestamp: "2026-02-17T09:25:10Z", details: '{"reason":"Cannot update published exam with active attempts"}' },
    { id: 20, actorId: "u4", actorName: "Omar Fathi", actorType: "Examiner", action: "Login", entityName: "Session", entityId: "s-208", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.20", userAgent: "Mozilla/5.0 Chrome/120", timestamp: "2026-02-17T11:00:05Z", details: null },
    { id: 21, actorId: "u8", actorName: "Huda Samir", actorType: "Instructor", action: "Create", entityName: "Exam", entityId: "ex-46", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.40", userAgent: null, timestamp: "2026-02-17T10:15:22Z", details: '{"title":"HR Policies Assessment","sections":2,"questions":15}' },
    { id: 22, actorId: "u1", actorName: "Ahmed Hassan", actorType: "Admin", action: "Update", entityName: "Settings", entityId: "sys-1", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.10", userAgent: null, timestamp: "2026-02-17T09:05:28Z", details: '{"field":"sessionTimeout","from":"120min","to":"60min"}' },
    { id: 23, actorId: "u3", actorName: "Ahmed Nabil", actorType: "Candidate", action: "Submit", entityName: "Attempt", entityId: "att-90", correlationId: null, tenantId: null, source: "Web", channel: "Exam Portal", outcome: "Success", ipAddress: "10.0.0.70", userAgent: null, timestamp: "2026-02-17T11:30:00Z", details: '{"examTitle":"HR Policies Assessment","duration":"28m","answered":15,"total":15}' },
    { id: 24, actorId: "u5", actorName: "Layla Amr", actorType: "Proctor", action: "Create", entityName: "Incident", entityId: "inc-13", correlationId: null, tenantId: null, source: "Web", channel: "Dashboard", outcome: "Success", ipAddress: "192.168.1.25", userAgent: null, timestamp: "2026-02-17T11:35:18Z", details: '{"candidate":"Ahmed Nabil","type":"Multiple Faces Detected","severity":"High","exam":"HR Policies"}' },
  ]

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
      const apiLogs = Array.isArray(data.items) ? data.items : []
      // Use demo data if API returns empty
      if (apiLogs.length > 0) {
        setLogs(apiLogs)
      } else {
        // Apply filters to demo data locally
        let filtered = [...demoLogs]
        if (actionFilter !== "all") filtered = filtered.filter(l => l.action === actionFilter)
        if (entityFilter !== "all") filtered = filtered.filter(l => l.entityName === entityFilter)
        setLogs(filtered)
      }
    } catch {
      // Fallback to demo data on error
      let filtered = [...demoLogs]
      if (actionFilter !== "all") filtered = filtered.filter(l => l.action === actionFilter)
      if (entityFilter !== "all") filtered = filtered.filter(l => l.entityName === entityFilter)
      setLogs(filtered)
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
                <SelectItem value="User">{language === "ar" ? "مستخدم" : "User"}</SelectItem>
                <SelectItem value="Exam">{language === "ar" ? "اختبار" : "Exam"}</SelectItem>
                <SelectItem value="Question">{language === "ar" ? "سؤال" : "Question"}</SelectItem>
                <SelectItem value="Attempt">{language === "ar" ? "محاولة" : "Attempt"}</SelectItem>
                <SelectItem value="Session">{language === "ar" ? "جلسة" : "Session"}</SelectItem>
                <SelectItem value="Grading">{language === "ar" ? "تصحيح" : "Grading"}</SelectItem>
                <SelectItem value="Incident">{language === "ar" ? "حادثة" : "Incident"}</SelectItem>
                <SelectItem value="Department">{language === "ar" ? "قسم" : "Department"}</SelectItem>
                <SelectItem value="Settings">{language === "ar" ? "إعدادات" : "Settings"}</SelectItem>
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
