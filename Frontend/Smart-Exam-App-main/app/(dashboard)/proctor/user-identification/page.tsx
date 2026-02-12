"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Camera,
  Monitor,
  Globe,
  User,
} from "lucide-react"
import {
  getIdentityVerifications,
  getIdentityVerificationDetail,
  applyVerificationAction,
  applyBulkVerificationAction,
} from "@/lib/api/proctoring"
import type {
  IdentityVerificationListItem,
  IdentityVerificationDetail,
} from "@/lib/types"

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────
function livenessLabel(val: number, t: (key: string) => string): string {
  switch (val) {
    case 0: return t("identityVerification.notChecked")
    case 1: return t("identityVerification.passed")
    case 2: return t("identityVerification.failed")
    case 3: return t("identityVerification.inconclusive")
    default: return t("identityVerification.notChecked")
  }
}

function livenessVariant(val: number): "default" | "secondary" | "destructive" | "outline" {
  switch (val) {
    case 1: return "default"
    case 2: return "destructive"
    case 3: return "outline"
    default: return "secondary"
  }
}

function riskColor(score: number | null): string {
  if (score === null || score === undefined) return "text-muted-foreground"
  if (score >= 75) return "text-destructive"
  if (score >= 50) return "text-orange-500"
  if (score >= 25) return "text-yellow-500"
  return "text-green-500"
}

function faceMatchColor(score: number | null): string {
  if (score === null || score === undefined) return "text-muted-foreground"
  if (score >= 90) return "text-green-500"
  if (score >= 70) return "text-yellow-500"
  return "text-destructive"
}

// ────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────
export default function UserIdentificationPage() {
  const { t, language } = useI18n()

  // ── Data ──
  const [items, setItems] = useState<IdentityVerificationListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  // ── Filters ──
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("-1")
  const [riskFilter, setRiskFilter] = useState<string>("all")

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // ── Detail modal ──
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<IdentityVerificationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Action dialog ──
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<string>("")
  const [actionTargetId, setActionTargetId] = useState<number | null>(null)
  const [actionReason, setActionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  // ── Bulk dialog ──
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<string>("")
  const [bulkReason, setBulkReason] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  const pageSize = 20

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getIdentityVerifications({
        status: statusFilter !== "-1" ? Number(statusFilter) : undefined,
        riskLevel: riskFilter !== "all" ? riskFilter : undefined,
        search: search || undefined,
        pageNumber,
        pageSize,
      })
      setItems(result.items ?? [])
      setTotalCount(result.totalCount ?? 0)
      setTotalPages(result.totalPages ?? Math.ceil((result.totalCount ?? 0) / pageSize))
    } catch {
      toast.error("Failed to load verifications")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, riskFilter, pageNumber])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounced search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPageNumber(1) }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // ── Selection helpers ──
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id))
  const someSelected = selectedIds.size > 0

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(items.map((i) => i.id)))
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── View detail ──
  async function openDetail(id: number) {
    setDetailLoading(true)
    setDetailOpen(true)
    const data = await getIdentityVerificationDetail(id)
    setDetail(data)
    setDetailLoading(false)
  }

  // ── Single action ──
  function openAction(id: number, action: string) {
    setActionTargetId(id)
    setActionType(action)
    setActionReason("")
    setActionDialogOpen(true)
  }

  async function submitAction() {
    if (!actionTargetId || !actionType) return
    setActionLoading(true)
    try {
      await applyVerificationAction(actionTargetId, actionType, actionReason || undefined)
      toast.success(t("identityVerification.actionSuccess"))
      setActionDialogOpen(false)
      fetchData()
    } catch {
      toast.error("Failed to apply action")
    } finally {
      setActionLoading(false)
    }
  }

  // ── Bulk action ──
  function openBulkAction(action: string) {
    setBulkAction(action)
    setBulkReason("")
    setBulkDialogOpen(true)
  }

  async function submitBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const result = await applyBulkVerificationAction(ids, bulkAction, bulkReason || undefined)
      if (result.failed === 0) {
        toast.success(`${t("identityVerification.bulkSuccess")}: ${result.succeeded}/${result.totalRequested}`)
      } else {
        toast.warning(`${t("identityVerification.bulkPartial")}: ${result.succeeded} ok, ${result.failed} failed`)
      }
      setBulkDialogOpen(false)
      setSelectedIds(new Set())
      fetchData()
    } catch {
      toast.error("Bulk action failed")
    } finally {
      setBulkLoading(false)
    }
  }

  // ── Stats ──
  const pendingCount = items.filter((i) => i.statusName === "Pending").length
  const flaggedCount = items.filter((i) => i.statusName === "Flagged").length

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("identityVerification.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("identityVerification.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("identityVerification.totalPending")}</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("identityVerification.totalFlagged")}</p>
              <p className="text-2xl font-bold">{flaggedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("identityVerification.totalApproved")}</p>
              <p className="text-2xl font-bold">{items.filter((i) => i.statusName === "Approved").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
              <ShieldX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("identityVerification.totalRejected")}</p>
              <p className="text-2xl font-bold">{items.filter((i) => i.statusName === "Rejected").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("identityVerification.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="ps-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageNumber(1) }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("identityVerification.statusFilter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">{t("identityVerification.allStatuses")}</SelectItem>
                  <SelectItem value="0">{t("identityVerification.pending")}</SelectItem>
                  <SelectItem value="1">{t("identityVerification.approved")}</SelectItem>
                  <SelectItem value="2">{t("identityVerification.rejected")}</SelectItem>
                  <SelectItem value="3">{t("identityVerification.flagged")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPageNumber(1) }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("identityVerification.riskFilter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("identityVerification.allRisks")}</SelectItem>
                  <SelectItem value="Low">{t("identityVerification.low")}</SelectItem>
                  <SelectItem value="Medium">{t("identityVerification.medium")}</SelectItem>
                  <SelectItem value="High">{t("identityVerification.high")}</SelectItem>
                  <SelectItem value="Critical">{t("identityVerification.critical")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {someSelected && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} {t("identityVerification.selected")}
                </span>
                <Button size="sm" variant="outline" onClick={() => openBulkAction("Approve")}>
                  <CheckCircle className="h-4 w-4 me-1" />
                  {t("identityVerification.bulkApprove")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/50"
                  onClick={() => openBulkAction("Reject")}
                >
                  <XCircle className="h-4 w-4 me-1" />
                  {t("identityVerification.bulkReject")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                  {t("identityVerification.clearSelection")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><LoadingSpinner /></div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("identityVerification.noVerifications")}
              description={t("identityVerification.noVerificationsDesc")}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                      </TableHead>
                      <TableHead>{t("identityVerification.candidate")}</TableHead>
                      <TableHead>{t("identityVerification.exam")}</TableHead>
                      <TableHead className="text-center">{t("identityVerification.faceMatch")}</TableHead>
                      <TableHead className="text-center">{t("identityVerification.liveness")}</TableHead>
                      <TableHead className="text-center">{t("identityVerification.riskScore")}</TableHead>
                      <TableHead>{t("identityVerification.status")}</TableHead>
                      <TableHead>{t("identityVerification.submittedAt")}</TableHead>
                      <TableHead>{t("identityVerification.assignedTo")}</TableHead>
                      <TableHead className="text-center">{t("identityVerification.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleOne(item.id)}
                            aria-label={`Select ${item.candidateName}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.candidateName}</TableCell>
                        <TableCell className="max-w-50 truncate">{item.examTitleEn}</TableCell>
                        <TableCell className="text-center">
                          {item.faceMatchScore !== null ? (
                            <span className={`font-semibold ${faceMatchColor(item.faceMatchScore)}`}>
                              {item.faceMatchScore}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={livenessVariant(item.livenessResult)}>
                            {livenessLabel(item.livenessResult, t)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.riskScore !== null ? (
                            <span className={`font-semibold ${riskColor(item.riskScore)}`}>
                              {item.riskScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={item.statusName} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.submittedAt).toLocaleDateString(
                            language === "ar" ? "ar-SA" : "en-US",
                            { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.assignedProctorName || (
                            <span className="text-muted-foreground">
                              {t("identityVerification.unassigned")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetail(item.id)}>
                                <Eye className="h-4 w-4 me-2" />
                                {t("identityVerification.viewDetails")}
                              </DropdownMenuItem>
                              {item.statusName !== "Approved" && (
                                <DropdownMenuItem onClick={() => openAction(item.id, "Approve")}>
                                  <CheckCircle className="h-4 w-4 me-2 text-green-500" />
                                  {t("identityVerification.approve")}
                                </DropdownMenuItem>
                              )}
                              {item.statusName !== "Rejected" && (
                                <DropdownMenuItem onClick={() => openAction(item.id, "Reject")}>
                                  <XCircle className="h-4 w-4 me-2 text-destructive" />
                                  {t("identityVerification.reject")}
                                </DropdownMenuItem>
                              )}
                              {item.statusName !== "Flagged" && (
                                <DropdownMenuItem onClick={() => openAction(item.id, "Flag")}>
                                  <AlertTriangle className="h-4 w-4 me-2 text-orange-500" />
                                  {t("identityVerification.flag")}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? `عرض ${(pageNumber - 1) * pageSize + 1}–${Math.min(pageNumber * pageSize, totalCount)} من ${totalCount}`
                    : `Showing ${(pageNumber - 1) * pageSize + 1}–${Math.min(pageNumber * pageSize, totalCount)} of ${totalCount}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{pageNumber} / {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={pageNumber >= totalPages}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══ DETAIL MODAL ═══ */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("identityVerification.detailTitle")}</DialogTitle>
            <DialogDescription>
              {detail ? `${detail.candidateName} — ${detail.examTitleEn}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Documents */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {t("identityVerification.idDocument")}
                  </p>
                  {detail.idDocumentUrl ? (
                    <div className="rounded-lg border overflow-hidden bg-muted/30">
                      <img
                        src={detail.idDocumentUrl}
                        alt="ID Document"
                        className="w-full h-auto max-h-48 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border flex items-center justify-center h-48 bg-muted/30">
                      <span className="text-muted-foreground text-sm">
                        {t("identityVerification.noImage")}
                      </span>
                    </div>
                  )}
                  {detail.idDocumentType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {detail.idDocumentType}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Camera className="h-4 w-4" />
                    {t("identityVerification.selfie")}
                  </p>
                  {detail.selfieUrl ? (
                    <div className="rounded-lg border overflow-hidden bg-muted/30">
                      <img
                        src={detail.selfieUrl}
                        alt="Selfie"
                        className="w-full h-auto max-h-48 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border flex items-center justify-center h-48 bg-muted/30">
                      <span className="text-muted-foreground text-sm">
                        {t("identityVerification.noImage")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("identityVerification.faceMatchScore")}
                  </p>
                  <p className={`text-lg font-bold ${faceMatchColor(detail.faceMatchScore)}`}>
                    {detail.faceMatchScore !== null ? `${detail.faceMatchScore}%` : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("identityVerification.livenessCheck")}
                  </p>
                  <Badge variant={livenessVariant(detail.livenessResult)}>
                    {livenessLabel(detail.livenessResult, t)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("identityVerification.riskScore")}
                  </p>
                  <p className={`text-lg font-bold ${riskColor(detail.riskScore)}`}>
                    {detail.riskScore !== null ? detail.riskScore : "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {t("identityVerification.status")}
                  </p>
                  <StatusBadge status={detail.statusName} />
                </div>
              </div>

              {/* Info rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {detail.deviceInfo && (
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("identityVerification.deviceInfo")}:
                    </span>
                    <span>{detail.deviceInfo}</span>
                  </div>
                )}
                {detail.ipAddress && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("identityVerification.ipAddress")}:
                    </span>
                    <span>{detail.ipAddress}</span>
                  </div>
                )}
                {detail.reviewedBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("identityVerification.reviewedBy")}:
                    </span>
                    <span>{detail.reviewedBy}</span>
                  </div>
                )}
                {detail.reviewedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {t("identityVerification.reviewedAt")}:
                    </span>
                    <span>{new Date(detail.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {detail.reviewNotes && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t("identityVerification.reviewNotes")}
                  </p>
                  <p className="text-sm">{detail.reviewNotes}</p>
                </div>
              )}

              {/* Audit Log */}
              {detail.auditLogs && detail.auditLogs.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {t("identityVerification.auditLog")}
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {detail.auditLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs border-b pb-2 last:border-0"
                      >
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="font-medium">{log.action}</span>
                        {log.performedBy && (
                          <span className="text-muted-foreground">by {log.performedBy}</span>
                        )}
                        {log.details && (
                          <span className="text-muted-foreground">&mdash; {log.details}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {detail && detail.statusName !== "Approved" && (
              <Button
                onClick={() => {
                  setDetailOpen(false)
                  openAction(detail.id, "Approve")
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 me-1" />
                {t("identityVerification.approve")}
              </Button>
            )}
            {detail && detail.statusName !== "Rejected" && (
              <Button
                variant="destructive"
                onClick={() => {
                  setDetailOpen(false)
                  openAction(detail.id, "Reject")
                }}
              >
                <XCircle className="h-4 w-4 me-1" />
                {t("identityVerification.reject")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              {language === "ar" ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SINGLE ACTION DIALOG ═══ */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("identityVerification.confirmAction")}: {actionType}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? `هل أنت متأكد من تطبيق "${actionType}" على هذا التحقق؟`
                : `Are you sure you want to ${actionType} this verification?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t("identityVerification.reasonPlaceholder")}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submitAction} disabled={actionLoading}>
              {actionLoading ? <LoadingSpinner /> : actionType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ BULK ACTION DIALOG ═══ */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "Approve"
                ? t("identityVerification.bulkApprove")
                : t("identityVerification.bulkReject")}
            </DialogTitle>
            <DialogDescription>
              {language === "ar"
                ? `تطبيق "${bulkAction}" على ${selectedIds.size} عنصر(ات) محددة.`
                : `Apply "${bulkAction}" to ${selectedIds.size} selected item(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder={t("identityVerification.reasonPlaceholder")}
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={submitBulkAction}
              disabled={bulkLoading}
              variant={bulkAction === "Reject" ? "destructive" : "default"}
            >
              {bulkLoading ? <LoadingSpinner /> : `${bulkAction} (${selectedIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
