"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getAppLogs,
  getAppErrors,
  type AppLogEntryDto,
  type AppErrorEntryDto,
  type AppLogFilter,
} from "@/lib/api/system-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  AlertCircle,
} from "lucide-react"

// ── helpers ──────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Information: "bg-blue-100 text-blue-800",
    Warning:     "bg-yellow-100 text-yellow-800",
    Error:       "bg-red-100 text-red-800",
    Fatal:       "bg-purple-100 text-purple-800",
    Debug:       "bg-gray-100 text-gray-700",
    Verbose:     "bg-gray-100 text-gray-500",
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[level] ?? "bg-gray-100 text-gray-700"}`}>
      {level}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function truncate(s: string | null | undefined, n = 120) {
  if (!s) return "—"
  return s.length > n ? s.slice(0, n) + "…" : s
}

// ── filter bar ───────────────────────────────────────────────

interface FilterBarProps {
  filter: AppLogFilter
  onFilterChange: (f: Partial<AppLogFilter>) => void
  onRefresh: () => void
  loading: boolean
  showLevelFilter?: boolean
}

function FilterBar({ filter, onFilterChange, onRefresh, loading, showLevelFilter = true }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filter.search ?? "")

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") onFilterChange({ search: searchInput, pageNumber: 1 })
  }

  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search message / path…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKey}
          className="pl-8"
        />
      </div>
      {showLevelFilter && (
        <Select
          value={filter.level ?? "all"}
          onValueChange={v => onFilterChange({ level: v === "all" ? undefined : v, pageNumber: 1 })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Information">Information</SelectItem>
            <SelectItem value="Warning">Warning</SelectItem>
            <SelectItem value="Error">Error</SelectItem>
            <SelectItem value="Fatal">Fatal</SelectItem>
            <SelectItem value="Debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Input
        type="date"
        value={filter.dateFrom ?? ""}
        onChange={e => onFilterChange({ dateFrom: e.target.value || undefined, pageNumber: 1 })}
        className="w-[150px]"
      />
      <Input
        type="date"
        value={filter.dateTo ?? ""}
        onChange={e => onFilterChange({ dateTo: e.target.value || undefined, pageNumber: 1 })}
        className="w-[150px]"
      />
      <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}

// ── pagination bar ───────────────────────────────────────────

interface PagerProps {
  page: number
  totalPages: number
  totalCount: number
  onPage: (p: number) => void
}

function Pager({ page, totalPages, totalCount, onPage }: PagerProps) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>{totalCount.toLocaleString()} records</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span>Page {page} / {totalPages || 1}</span>
        <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Request Logs tab ─────────────────────────────────────────

function RequestLogsTab() {
  const [filter, setFilter] = useState<AppLogFilter>({ pageNumber: 1, pageSize: 50 })
  const [items, setItems] = useState<AppLogEntryDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AppLogEntryDto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAppLogs(filter)
      setItems(res.items)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch {
      // silently fail — table stays as-is
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  function updateFilter(partial: Partial<AppLogFilter>) {
    setFilter(prev => ({ ...prev, ...partial }))
  }

  return (
    <>
      <FilterBar filter={filter} onFilterChange={updateFilter} onRefresh={load} loading={loading} />
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead className="w-[60px]">Method</TableHead>
                <TableHead className="w-[110px]">Level</TableHead>
                <TableHead className="w-[280px]">Request Path</TableHead>
                <TableHead className="w-[60px]">Status</TableHead>
                <TableHead className="w-[80px]">Duration</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="text-xs font-mono whitespace-nowrap">{fmtDate(row.timeStamp)}</TableCell>
                  <TableCell className="text-xs font-mono font-bold">{row.requestMethod ?? "—"}</TableCell>
                  <TableCell><LevelBadge level={row.level} /></TableCell>
                  <TableCell className="text-xs font-mono">{truncate(row.requestPath, 60)}</TableCell>
                  <TableCell className="text-xs font-mono">{row.statusCode ?? "—"}</TableCell>
                  <TableCell className="text-xs">{row.elapsedMs ? `${parseFloat(row.elapsedMs).toFixed(0)} ms` : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager
        page={filter.pageNumber ?? 1}
        totalPages={totalPages}
        totalCount={totalCount}
        onPage={p => updateFilter({ pageNumber: p })}
      />

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Log — #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <ScrollArea className="h-[60vh]">
              <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium">Timestamp</dt><dd>{fmtDate(selected.timeStamp)}</dd>
                <dt className="font-medium">Method</dt><dd className="font-mono font-bold">{selected.requestMethod ?? "—"}</dd>
                <dt className="font-medium">Status</dt><dd className="font-mono">{selected.statusCode ?? "—"}</dd>
                <dt className="font-medium">Duration</dt><dd>{selected.elapsedMs ? `${parseFloat(selected.elapsedMs).toFixed(2)} ms` : "—"}</dd>
                <dt className="font-medium">Level</dt><dd><LevelBadge level={selected.level} /></dd>
                <dt className="font-medium">Request Path</dt><dd className="font-mono text-xs break-all">{selected.requestPath ?? "—"}</dd>
                <dt className="font-medium">User ID</dt><dd className="font-mono text-xs break-all">{selected.userId ?? "—"}</dd>
                <dt className="font-medium">IP Address</dt><dd className="font-mono text-xs">{selected.clientIp ?? "—"}</dd>
                <dt className="font-medium">Browser / UA</dt><dd className="text-xs break-all">{selected.userAgent ?? "—"}</dd>
                <dt className="font-medium">Message</dt>
                <dd className="text-xs whitespace-pre-wrap break-all">{selected.message || "—"}</dd>
                {selected.exception && (
                  <>
                    <dt className="font-medium text-red-600">Exception</dt>
                    <dd className="text-xs whitespace-pre-wrap break-all text-red-600">{selected.exception}</dd>
                  </>
                )}
              </dl>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Error Logs tab ────────────────────────────────────────────

function ErrorLogsTab() {
  const [filter, setFilter] = useState<AppLogFilter>({ pageNumber: 1, pageSize: 50 })
  const [items, setItems] = useState<AppErrorEntryDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AppErrorEntryDto | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAppErrors(filter)
      setItems(res.items)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  function updateFilter(partial: Partial<AppLogFilter>) {
    setFilter(prev => ({ ...prev, ...partial }))
  }

  return (
    <>
      <FilterBar filter={filter} onFilterChange={updateFilter} onRefresh={load} loading={loading} showLevelFilter={false} />
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No error records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead className="w-[250px]">Exception Type</TableHead>
                <TableHead className="w-[300px]">Exception Message</TableHead>
                <TableHead className="w-[250px]">Endpoint</TableHead>
                <TableHead className="w-[140px]">Request ID</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  <TableCell className="text-xs font-mono whitespace-nowrap">{fmtDate(row.timeStamp)}</TableCell>
                  <TableCell className="text-xs font-medium">{truncate(row.exceptionType, 60)}</TableCell>
                  <TableCell className="text-xs">{truncate(row.exceptionMessage, 80)}</TableCell>
                  <TableCell className="text-xs font-mono">{truncate(row.endpoint, 60)}</TableCell>
                  <TableCell className="text-xs font-mono">{truncate(row.requestId, 30)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager
        page={filter.pageNumber ?? 1}
        totalPages={totalPages}
        totalCount={totalCount}
        onPage={p => updateFilter({ pageNumber: p })}
      />

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Log — #{selected?.id}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <ScrollArea className="h-[65vh]">
              <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="font-medium">Timestamp</dt><dd>{fmtDate(selected.timeStamp)}</dd>
                <dt className="font-medium">Exception Type</dt><dd className="font-mono text-xs break-all">{selected.exceptionType ?? "—"}</dd>
                <dt className="font-medium">Exception Message</dt><dd className="text-xs break-all">{selected.exceptionMessage ?? "—"}</dd>
                <dt className="font-medium">Endpoint</dt><dd className="font-mono text-xs break-all">{selected.endpoint ?? "—"}</dd>
                <dt className="font-medium">Request ID</dt><dd className="font-mono text-xs">{selected.requestId ?? "—"}</dd>
                <dt className="font-medium">User ID</dt><dd className="font-mono text-xs break-all">{selected.userId ?? "—"}</dd>
                <dt className="font-medium">IP Address</dt><dd className="font-mono text-xs">{selected.clientIp ?? "—"}</dd>
                <dt className="font-medium">Browser / UA</dt><dd className="text-xs break-all">{selected.userAgent ?? "—"}</dd>
                <dt className="font-medium">Machine</dt><dd className="text-xs">{selected.machineName ?? "—"}</dd>
                <dt className="font-medium">Environment</dt><dd className="text-xs">{selected.environmentName ?? "—"}</dd>
                {selected.message && (
                  <>
                    <dt className="font-medium">Message</dt>
                    <dd className="text-xs whitespace-pre-wrap break-all">{selected.message}</dd>
                  </>
                )}
                {selected.innerException && (
                  <>
                    <dt className="font-medium">Inner Exception</dt>
                    <dd className="text-xs whitespace-pre-wrap break-all text-orange-600">{selected.innerException}</dd>
                  </>
                )}
                {selected.exception && (
                  <>
                    <dt className="font-medium">Stack Trace</dt>
                    <dd className="text-xs whitespace-pre-wrap break-all text-red-600 font-mono">{selected.exception}</dd>
                  </>
                )}
              </dl>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function AppLogsPage() {
  const { language } = useI18n()
  const isAr = language === "ar"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" />
          {isAr ? "سجلات التطبيق" : "Application Logs"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAr
            ? "سجلات طلبات HTTP وأخطاء التطبيق من قاعدة البيانات — في الوقت الفعلي، بدون فتح ملفات."
            : "Live HTTP request logs and application errors from the SQL database — no file access needed."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="requests">
            <TabsList className="mb-4">
              <TabsTrigger value="requests" className="gap-2">
                <Activity className="h-4 w-4" />
                {isAr ? "طلبات HTTP" : "Request Logs"}
              </TabsTrigger>
              <TabsTrigger value="errors" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                {isAr ? "سجلات الأخطاء" : "Error Logs"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              <RequestLogsTab />
            </TabsContent>

            <TabsContent value="errors">
              <ErrorLogsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
