"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  ArrowLeft, Users, UserPlus, UserMinus, Download, Search, Loader2,
  FolderTree, Calendar, User,
} from "lucide-react"
import {
  getBatchById, addCandidatesToBatch, removeCandidatesFromBatch,
  exportBatchCandidates, type BatchDetailDto, type BatchCandidateDto,
} from "@/lib/api/batch"
import { getCandidates, type CandidateDto } from "@/lib/api/candidate-admin"

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useI18n()
  const { user } = useAuth()
  const isAr = language === "ar"
  const batchId = Number(params.id)

  // ── Data state ─────────────────────────────────────────────
  const [batch, setBatch] = useState<BatchDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchMembers, setSearchMembers] = useState("")

  // ── Add candidates dialog ──────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addSearch, setAddSearch] = useState("")
  const [allCandidates, setAllCandidates] = useState<CandidateDto[]>([])
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── Remove state ───────────────────────────────────────────
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<BatchCandidateDto | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)

  // ── Bulk remove ────────────────────────────────────────────
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false)
  const [bulkRemoveLoading, setBulkRemoveLoading] = useState(false)

  // ── Export state ───────────────────────────────────────────
  const [exportLoading, setExportLoading] = useState(false)

  // ── Load batch detail ──────────────────────────────────────
  const loadBatch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBatchById(batchId)
      setBatch(data)
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل في تحميل بيانات الدفعة" : "Failed to load batch"))
    } finally {
      setLoading(false)
    }
  }, [batchId, isAr])

  useEffect(() => { loadBatch() }, [loadBatch])

  // ── Load available candidates for add dialog ───────────────
  const loadAvailable = useCallback(async () => {
    setCandidatesLoading(true)
    try {
      const data = await getCandidates({ search: addSearch, pageSize: 100 })
      setAllCandidates(data.items)
    } catch {
      setAllCandidates([])
    } finally {
      setCandidatesLoading(false)
    }
  }, [addSearch])

  useEffect(() => {
    if (addOpen) {
      const t = setTimeout(() => loadAvailable(), 300)
      return () => clearTimeout(t)
    }
  }, [addOpen, addSearch, loadAvailable])

  // ── Filtered members ───────────────────────────────────────
  const filteredMembers = (batch?.candidates ?? []).filter((c) => {
    if (!searchMembers) return true
    const s = searchMembers.toLowerCase()
    return (
      (c.fullName?.toLowerCase().includes(s)) ||
      (c.fullNameAr?.toLowerCase().includes(s)) ||
      c.email.toLowerCase().includes(s) ||
      (c.rollNo?.toLowerCase().includes(s))
    )
  })

  // ── Available (not already in batch) ───────────────────────
  const memberIds = new Set((batch?.candidates ?? []).map((c) => c.id))
  const available = allCandidates.filter((c) => !memberIds.has(c.id))

  // ── Handlers ───────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAddCandidates = async () => {
    if (selectedIds.size === 0) return
    setAddLoading(true)
    try {
      const result = await addCandidatesToBatch(batchId, Array.from(selectedIds))
      toast.success(
        isAr
          ? `تمت إضافة ${result.affectedCount} مرشح(ين)`
          : `${result.affectedCount} candidate(s) added`,
      )
      setAddOpen(false)
      setSelectedIds(new Set())
      loadBatch()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت الإضافة" : "Add failed"))
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemoveOne = async () => {
    if (!removeTarget) return
    setRemoveLoading(true)
    try {
      await removeCandidatesFromBatch(batchId, [removeTarget.id])
      toast.success(isAr ? "تمت إزالة المرشح" : "Candidate removed")
      setRemoveOpen(false)
      setRemoveTarget(null)
      loadBatch()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت الإزالة" : "Remove failed"))
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleBulkRemove = async () => {
    if (bulkSelected.size === 0) return
    setBulkRemoveLoading(true)
    try {
      const result = await removeCandidatesFromBatch(batchId, Array.from(bulkSelected))
      toast.success(
        isAr
          ? `تمت إزالة ${result.affectedCount} مرشح(ين)`
          : `${result.affectedCount} candidate(s) removed`,
      )
      setBulkRemoveOpen(false)
      setBulkSelected(new Set())
      loadBatch()
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشلت الإزالة" : "Remove failed"))
    } finally {
      setBulkRemoveLoading(false)
    }
  }

  const toggleBulk = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleBulkAll = () => {
    if (bulkSelected.size === filteredMembers.length) {
      setBulkSelected(new Set())
    } else {
      setBulkSelected(new Set(filteredMembers.map((c) => c.id)))
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      await exportBatchCandidates(batchId)
      toast.success(isAr ? "تم التصدير بنجاح" : "Export successful")
    } catch (e: any) {
      toast.error(e.message || (isAr ? "فشل التصدير" : "Export failed"))
    } finally {
      setExportLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <LoadingSpinner />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">{isAr ? "الدفعة غير موجودة" : "Batch not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/candidates/batch")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isAr ? "رجوع" : "Back"}
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/candidates/batch")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            {batch.name}
          </h1>
          <p className="text-sm text-muted-foreground">{batch.description || (isAr ? "لا يوجد وصف" : "No description")}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? "المرشحون" : "Candidates"}</p>
                <p className="text-2xl font-bold">{batch.candidateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Badge variant={batch.isActive ? "default" : "outline"} className="text-sm px-3 py-1">
                {batch.isActive ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{isAr ? "تاريخ الإنشاء" : "Created"}</p>
                <p className="font-medium">{new Date(batch.createdDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Table Header */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isAr ? "أعضاء الدفعة" : "Batch Members"} ({batch.candidateCount})
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {bulkSelected.size > 0 && (
              <Button variant="destructive" size="sm" onClick={() => setBulkRemoveOpen(true)}>
                <UserMinus className="h-4 w-4 mr-2" />
                {isAr ? `إزالة (${bulkSelected.size})` : `Remove (${bulkSelected.size})`}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
              {exportLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              {isAr ? "تصدير" : "Export"}
            </Button>
            <Button size="sm" onClick={() => { setAddOpen(true); setAddSearch(""); setSelectedIds(new Set()) }}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isAr ? "إضافة مرشحين" : "Add Candidates"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search members */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث في الأعضاء..." : "Search members..."}
              value={searchMembers}
              onChange={(e) => setSearchMembers(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-40" />
              <p>{isAr ? "لا يوجد أعضاء في هذه الدفعة" : "No members in this batch"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={bulkSelected.size === filteredMembers.length && filteredMembers.length > 0}
                      onCheckedChange={toggleBulkAll}
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{isAr ? "الاسم (عربي)" : "Name (AR)"}</TableHead>
                  <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                  <TableHead>{isAr ? "الرقم التسلسلي" : "Roll No"}</TableHead>
                  <TableHead className="text-center">{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "تاريخ الإضافة" : "Added"}</TableHead>
                  <TableHead className="text-right">{isAr ? "إجراء" : "Action"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Checkbox
                        checked={bulkSelected.has(c.id)}
                        onCheckedChange={() => toggleBulk(c.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{c.fullName || "—"}</TableCell>
                    <TableCell>{c.fullNameAr || "—"}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.rollNo || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={c.isBlocked ? "destructive" : "default"}>
                        {c.isBlocked ? (isAr ? "محظور" : "Blocked") : (isAr ? "نشط" : "Active")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.addedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setRemoveTarget(c); setRemoveOpen(true) }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Candidates Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isAr ? "إضافة مرشحين إلى الدفعة" : "Add Candidates to Batch"}</DialogTitle>
            <DialogDescription>
              {isAr ? "ابحث واختر المرشحين لإضافتهم" : "Search and select candidates to add"}
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "بحث بالاسم أو البريد أو الرقم..." : "Search by name, email, or roll no..."}
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex-1 overflow-auto border rounded-md">
            {candidatesLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : available.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isAr ? "لا يوجد مرشحون متاحون" : "No available candidates"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]" />
                    <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isAr ? "البريد" : "Email"}</TableHead>
                    <TableHead>{isAr ? "الرقم التسلسلي" : "Roll No"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {available.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => toggleSelect(c.id)}
                    >
                      <TableCell>
                        <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{c.fullName || c.fullNameAr || "—"}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>{c.rollNo || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter className="mt-3">
            <p className="text-sm text-muted-foreground mr-auto">
              {isAr ? `تم اختيار ${selectedIds.size}` : `${selectedIds.size} selected`}
            </p>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleAddCandidates} disabled={addLoading || selectedIds.size === 0}>
              {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "إضافة" : "Add"} ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove One Confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "إزالة مرشح" : "Remove Candidate"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل تريد إزالة "${removeTarget?.fullName || removeTarget?.email}" من هذه الدفعة؟`
                : `Remove "${removeTarget?.fullName || removeTarget?.email}" from this batch?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveOne} disabled={removeLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {removeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "إزالة" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Remove Confirmation */}
      <AlertDialog open={bulkRemoveOpen} onOpenChange={setBulkRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "إزالة مرشحين" : "Remove Candidates"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل تريد إزالة ${bulkSelected.size} مرشح(ين) من هذه الدفعة؟`
                : `Remove ${bulkSelected.size} candidate(s) from this batch?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkRemove} disabled={bulkRemoveLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkRemoveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isAr ? "إزالة الكل" : "Remove All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
