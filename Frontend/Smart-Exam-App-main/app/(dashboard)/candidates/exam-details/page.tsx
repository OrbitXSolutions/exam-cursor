"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Search, ClipboardCheck, User, BookOpen, Clock, Shield, Camera, Video, FileText,
  AlertTriangle, Activity, ExternalLink, RefreshCw, ChevronDown, ChevronUp,
  Play, CheckCircle, XCircle, Pause, TimerOff, Ban, Loader2, Image as ImageIcon,
  ChevronsUpDown, Check, Brain, Sparkles,
} from "lucide-react"
import {
  getCandidateExamDetails, getCandidateExams,
  type CandidateExamDetailsDto, type CandidateExamBriefDto,
} from "@/lib/api/candidate-exam-details"
import { getCandidates, type CandidateDto } from "@/lib/api/candidate-admin"
import { getAiProctorAnalysis, type AiProctorAnalysis } from "@/lib/api/proctoring"
import { AttemptEventLog, type AttemptEvent } from "@/components/attempt-event-log"

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr: string | undefined | null, language: string): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function formatSeconds(s: number): string {
  if (s <= 0) return "00:00:00"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function formatExtraTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—"
  const m = Math.floor(totalSeconds / 60)
  return `+${m} min`
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"]
  let order = 0
  let size = bytes
  while (size >= 1024 && order < sizes.length - 1) { order++; size /= 1024 }
  return `${size.toFixed(1)} ${sizes[order]}`
}

function statusBadgeVariant(statusName: string): "default" | "secondary" | "destructive" | "outline" {
  switch (statusName) {
    case "InProgress": return "default"
    case "Started": return "secondary"
    case "Submitted": return "secondary"
    case "Paused": return "outline"
    case "ForceSubmitted": return "destructive"
    case "Terminated": return "destructive"
    case "Expired": return "destructive"
    case "Cancelled": return "destructive"
    default: return "outline"
  }
}

function getStatusIcon(statusName: string) {
  switch (statusName) {
    case "InProgress": return <Play className="h-3 w-3" />
    case "Started": return <Play className="h-3 w-3" />
    case "Submitted": return <CheckCircle className="h-3 w-3" />
    case "Paused": return <Pause className="h-3 w-3" />
    case "ForceSubmitted": return <XCircle className="h-3 w-3" />
    case "Terminated": return <XCircle className="h-3 w-3" />
    case "Expired": return <TimerOff className="h-3 w-3" />
    case "Cancelled": return <Ban className="h-3 w-3" />
    default: return null
  }
}

function getRiskBadgeVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case "Low": return "secondary"
    case "Medium": return "outline"
    case "High": return "destructive"
    case "Critical": return "destructive"
    default: return "outline"
  }
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function CandidateExamDetailsPage() {
  const { language } = useI18n()
  const searchParams = useSearchParams()
  const isRtl = language === "ar"

  // ── Search State ──
  const [candidateSearch, setCandidateSearch] = useState("")
  const [candidateList, setCandidateList] = useState<CandidateDto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [selectedCandidateName, setSelectedCandidateName] = useState<string>("")
  const [candidateExams, setCandidateExams] = useState<CandidateExamBriefDto[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number>(0)
  const [showSearch, setShowSearch] = useState(true)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Data State ──
  const [data, setData] = useState<CandidateExamDetailsDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | undefined>()
  const [screenshotPreview, setScreenshotPreview] = useState<number | null>(null)

  // ── AI Analysis State ──
  const [aiAnalysis, setAiAnalysis] = useState<AiProctorAnalysis | null>(null)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null)

  // ── Initialize from query params ──
  useEffect(() => {
    const cId = searchParams.get("candidateId")
    const eId = searchParams.get("examId")
    const aId = searchParams.get("attemptId")

    if (cId && eId) {
      setSelectedCandidateId(cId)
      setSelectedExamId(Number(eId))
      if (aId) setSelectedAttemptId(Number(aId))
      setShowSearch(false)
    }
  }, [searchParams])

  // ── Load details when candidate + exam are set ──
  useEffect(() => {
    if (selectedCandidateId && selectedExamId > 0) {
      loadDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidateId, selectedExamId, selectedAttemptId])

  // ── Load candidate exams when candidate selected ──
  useEffect(() => {
    if (selectedCandidateId) {
      loadCandidateExams(selectedCandidateId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidateId])

  // ── Load initial candidates on mount ──
  useEffect(() => {
    loadCandidateList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Debounced search when typing in dropdown ──
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      loadCandidateList(candidateSearch)
    }, 300)
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateSearch])

  // ── Search Candidates ──
  const loadCandidateList = useCallback(async (search?: string) => {
    setIsSearching(true)
    try {
      const result = await getCandidates({ search: search?.trim() || undefined, pageSize: 20 })
      setCandidateList(result.items)
    } catch {
      // silent fail for search
    } finally {
      setIsSearching(false)
    }
  }, [])

  // ── Load Candidate Exams ──
  const loadCandidateExams = async (candidateId: string) => {
    try {
      const exams = await getCandidateExams(candidateId)
      setCandidateExams(exams)
    } catch {
      setCandidateExams([])
    }
  }

  // ── Load Details ──
  const loadDetails = async () => {
    setIsLoading(true)
    setAiAnalysis(null)
    setAiAnalysisError(null)
    try {
      const result = await getCandidateExamDetails({
        candidateId: selectedCandidateId,
        examId: selectedExamId,
        attemptId: selectedAttemptId,
      })
      setData(result)
      if (result?.candidate) {
        setSelectedCandidateName(
          isRtl ? (result.candidate.fullNameAr || result.candidate.fullName) : result.candidate.fullName
        )
      }
    } catch {
      toast.error(isRtl ? "فشل تحميل التفاصيل" : "Failed to load details")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Select Candidate from List ──
  const handleSelectCandidate = (c: CandidateDto) => {
    setSelectedCandidateId(c.id)
    setSelectedCandidateName(isRtl ? (c.fullNameAr || c.fullName || "") : (c.fullName || ""))
    setSelectedExamId(0)
    setData(null)
    setCandidateDropdownOpen(false)
    setCandidateSearch("")
  }

  // ── Select Exam ──
  const handleSelectExam = (examId: string) => {
    const eid = Number(examId)
    setSelectedExamId(eid)
    setSelectedAttemptId(undefined)
    setData(null)
  }

  // ── Switch Attempt ──
  const handleSwitchAttempt = (attemptId: string) => {
    setSelectedAttemptId(Number(attemptId))
  }

  // ── Refresh ──
  const handleRefresh = () => {
    if (selectedCandidateId && selectedExamId > 0) loadDetails()
  }

  // ── AI Analysis ──
  const handleGenerateAiAnalysis = async () => {
    if (!data?.proctor?.sessionId) return
    try {
      setAiAnalysisLoading(true)
      setAiAnalysisError(null)
      const analysis = await getAiProctorAnalysis(String(data.proctor.sessionId))
      setAiAnalysis(analysis)
      toast.success(isRtl ? "تم إنشاء تحليل الذكاء الاصطناعي" : "AI analysis generated successfully")
    } catch (error: any) {
      const msg = error?.message || (isRtl ? "فشل إنشاء تحليل الذكاء الاصطناعي" : "Failed to generate AI analysis")
      setAiAnalysisError(msg)
      toast.error(msg)
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  // ── Map events to shared component shape ──
  const mappedEvents: AttemptEvent[] = (data?.eventLogs ?? []).map(e => ({
    id: e.id,
    attemptId: e.attemptId,
    eventType: e.eventType,
    eventTypeName: e.eventTypeName,
    metadataJson: e.metadataJson,
    occurredAt: e.occurredAt,
    questionTextEn: e.questionTextEn,
    questionTextAr: e.questionTextAr,
    answerSummary: e.answerSummary,
  }))

  // ── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isRtl ? "تفاصيل اختبار المرشح" : "Candidate Exam Details"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRtl ? "عرض شامل لمحاولة الاختبار والمراقبة وسجل الأحداث" : "Comprehensive view of exam attempt, proctoring, and event timeline"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
            {showSearch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-1">{isRtl ? "بحث" : "Search"}</span>
          </Button>
          {data && (
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* ── Search Section ── */}
      {showSearch && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-4">
              {/* Candidate Searchable Dropdown */}
              <div className="space-y-2">
                <Label>{isRtl ? "اختر المرشح" : "Select Candidate"}</Label>
                <Popover open={candidateDropdownOpen} onOpenChange={setCandidateDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={candidateDropdownOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedCandidateName ? (
                        <span className="truncate">{selectedCandidateName}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {isRtl ? "اختر مرشح..." : "Select candidate..."}
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <input
                        className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        placeholder={isRtl ? "ابحث بالاسم، البريد، الرقم..." : "Search name, email, roll no..."}
                        value={candidateSearch}
                        onChange={e => setCandidateSearch(e.target.value)}
                      />
                      {isSearching && <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0 opacity-50" />}
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {candidateList.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {isRtl ? "لا توجد نتائج" : "No candidates found"}
                        </div>
                      ) : (
                        candidateList.map(c => (
                          <button
                            key={c.id}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-start gap-2 ${
                              selectedCandidateId === c.id
                                ? "bg-primary/10"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => handleSelectCandidate(c)}
                          >
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${selectedCandidateId === c.id ? "opacity-100 text-primary" : "opacity-0"}`} />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{isRtl ? (c.fullNameAr || c.fullName) : c.fullName}</div>
                              <div className="text-muted-foreground text-xs truncate">{c.email}{c.rollNo ? ` · ${c.rollNo}` : ""}</div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Exam Selector */}
              <div className="space-y-2">
                <Label>{isRtl ? "اختر الاختبار" : "Select Exam"}</Label>
                <Select
                  value={selectedExamId > 0 ? String(selectedExamId) : ""}
                  onValueChange={handleSelectExam}
                  disabled={!selectedCandidateId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isRtl ? "اختر اختبار..." : "Choose exam..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateExams.map(e => (
                      <SelectItem key={e.examId} value={String(e.examId)}>
                        {isRtl ? (e.titleAr || e.titleEn) : e.titleEn}
                        <span className="text-muted-foreground text-xs ml-2">
                          ({e.totalAttempts} {isRtl ? "محاولة" : "attempts"})
                        </span>
                      </SelectItem>
                    ))}
                    {candidateExams.length === 0 && selectedCandidateId && (
                      <SelectItem value="none" disabled>
                        {isRtl ? "لا توجد اختبارات" : "No exams found"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Attempt Selector */}
              <div className="space-y-2">
                <Label>{isRtl ? "المحاولة" : "Attempt"}</Label>
                <Select
                  value={selectedAttemptId ? String(selectedAttemptId) : "latest"}
                  onValueChange={v => handleSwitchAttempt(v === "latest" ? "0" : v)}
                  disabled={!data?.hasAttempts}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isRtl ? "الأحدث" : "Latest"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">{isRtl ? "الأحدث" : "Latest"}</SelectItem>
                    {(data?.attemptsList ?? []).map(a => (
                      <SelectItem key={a.attemptId} value={String(a.attemptId)}>
                        #{a.attemptNumber} — {a.statusName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Loading State ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !data && !selectedCandidateId && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {isRtl ? "ابحث عن مرشح للبدء" : "Search for a Candidate to Start"}
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              {isRtl
                ? "استخدم البحث أعلاه للعثور على مرشح ثم اختر الاختبار لعرض التفاصيل الكاملة."
                : "Use the search above to find a candidate, then select an exam to view full attempt details."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── No Attempts State ── */}
      {!isLoading && data && !data.hasAttempts && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              {isRtl ? "لا توجد محاولات" : "No Attempts Found"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {isRtl
                ? "لم يبدأ هذا المرشح أي محاولة لهذا الاختبار بعد."
                : "This candidate has not started any attempt for this exam yet."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Data Display ── */}
      {!isLoading && data && data.hasAttempts && data.attemptSummary && (
        <>
          {/* ── Section A: Header ── */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Candidate Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="h-4 w-4" />
                    {isRtl ? "المرشح" : "Candidate"}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {isRtl ? (data.candidate.fullNameAr || data.candidate.fullName) : data.candidate.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">{data.candidate.email}</p>
                    {data.candidate.rollNo && (
                      <p className="text-sm text-muted-foreground">
                        {isRtl ? "رقم التسجيل" : "Roll No"}: {data.candidate.rollNo}
                      </p>
                    )}
                    {data.candidate.mobile && (
                      <p className="text-sm text-muted-foreground">{data.candidate.mobile}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={data.candidate.isBlocked ? "destructive" : "secondary"}>
                      {data.candidate.isBlocked
                        ? (isRtl ? "محظور" : "Blocked")
                        : (isRtl ? "نشط" : "Active")}
                    </Badge>
                  </div>
                </div>

                {/* Exam Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {isRtl ? "الاختبار" : "Exam"}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {isRtl ? (data.exam.titleAr || data.exam.titleEn) : data.exam.titleEn}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.exam.durationMinutes} {isRtl ? "دقيقة" : "min"}
                      {" · "}
                      {isRtl ? "حد" : "Pass"}: {data.exam.passScore}%
                      {" · "}
                      {isRtl ? "محاولات" : "Max"}: {data.exam.maxAttempts}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={data.exam.isPublished ? "default" : "outline"}>
                      {data.exam.isPublished ? (isRtl ? "منشور" : "Published") : (isRtl ? "مسودة" : "Draft")}
                    </Badge>
                    {data.exam.requireProctoring && (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        {isRtl ? "مراقب" : "Proctored"}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Current Attempt + Quick Links */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    {isRtl ? "المحاولة الحالية" : "Current Attempt"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(data.attemptSummary.statusName)}>
                      {getStatusIcon(data.attemptSummary.statusName)}
                      <span className="ml-1">{data.attemptSummary.statusName}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      #{data.attemptSummary.attemptNumber}
                    </span>
                  </div>

                  {/* Quick Navigation Links */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {data.attemptSummary && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/results/review/${data.exam.examId}/${data.candidate.candidateId}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {isRtl ? "النتيجة" : "Result"}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    {data.resultInfo?.gradingSessionId && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/grading/${data.resultInfo.gradingSessionId}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isRtl ? "التصحيح" : "Grade"}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Section B: Attempt Overview ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status & Timing */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRtl ? "التوقيت" : "Timing"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "بدأ" : "Started"}</span>
                  <span>{formatDateTime(data.attemptSummary.startedAt, language)}</span>
                </div>
                {data.attemptSummary.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRtl ? "سُلّم" : "Submitted"}</span>
                    <span>{formatDateTime(data.attemptSummary.submittedAt, language)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "المدة الكلية" : "Total Duration"}</span>
                  <span>{formatSeconds(data.attemptSummary.totalDurationSeconds)}</span>
                </div>
                {/* Expiry Reason (when status is Expired) */}
                {data.attemptSummary.statusName === "Expired" && data.attemptSummary.expiryReasonName && data.attemptSummary.expiryReasonName !== "None" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRtl ? "سبب الانتهاء" : "Expiry Reason"}</span>
                    <span className="text-red-500 text-xs font-medium">{data.attemptSummary.expiryReasonName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Questions & Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {isRtl ? "الأسئلة والدرجة" : "Questions & Score"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "الأسئلة" : "Questions"}</span>
                  <span>{data.attemptSummary.answeredQuestions} / {data.attemptSummary.totalQuestions}</span>
                </div>
                {data.attemptSummary.totalScore !== null && data.attemptSummary.totalScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRtl ? "الدرجة" : "Score"}</span>
                    <span className="font-medium">{data.attemptSummary.totalScore}</span>
                  </div>
                )}
                {data.attemptSummary.isPassed !== null && data.attemptSummary.isPassed !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRtl ? "النتيجة" : "Result"}</span>
                    <Badge variant={data.attemptSummary.isPassed ? "default" : "destructive"} className="text-xs">
                      {data.attemptSummary.isPassed ? (isRtl ? "ناجح" : "Passed") : (isRtl ? "راسب" : "Failed")}
                    </Badge>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "وقت إضافي" : "Extra Time"}</span>
                  <span>{formatExtraTime(data.attemptSummary.extraTimeSeconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "استئنافات" : "Resumes"}</span>
                  <span>{data.attemptSummary.resumeCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Proctor Summary Counters */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {isRtl ? "المراقبة" : "Proctoring"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.proctor ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "الوضع" : "Mode"}</span>
                      <span>{isRtl ? "كامل" : "Full"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "الأحداث" : "Events"}</span>
                      <span>{data.proctor.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "المخالفات" : "Violations"}</span>
                      <span className={data.proctor.totalViolations > 0 ? "text-red-500 font-medium" : ""}>
                        {data.proctor.totalViolations}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{isRtl ? "الخطورة" : "Risk"}</span>
                      <Badge variant={getRiskBadgeVariant(data.proctor.riskLevel)} className="text-xs">
                        {data.proctor.riskLevel}
                        {data.proctor.riskScore !== null && data.proctor.riskScore !== undefined
                          ? ` (${data.proctor.riskScore}%)`
                          : ""}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "لقطات" : "Screenshots"}</span>
                      <span>{data.proctor.totalScreenshots}</span>
                    </div>
                    {data.proctor.decisionStatus && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRtl ? "القرار" : "Decision"}</span>
                        <span>{data.proctor.decisionStatus}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isRtl ? "لا توجد جلسة مراقبة" : "No proctor session"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Additional Info Row ── */}
          {(data.attemptSummary.lastActivityAt || data.attemptSummary.ipAddress || data.attemptSummary.forceSubmittedBy) && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-6 text-sm">
                  {data.attemptSummary.lastActivityAt && (
                    <div>
                      <span className="text-muted-foreground">{isRtl ? "آخر نشاط" : "Last Activity"}: </span>
                      <span>{formatDateTime(data.attemptSummary.lastActivityAt, language)}</span>
                    </div>
                  )}
                  {data.attemptSummary.ipAddress && (
                    <div>
                      <span className="text-muted-foreground">IP: </span>
                      <span className="font-mono text-xs">{data.attemptSummary.ipAddress}</span>
                    </div>
                  )}
                  {data.attemptSummary.deviceInfo && (
                    <div>
                      <span className="text-muted-foreground">{isRtl ? "الجهاز" : "Device"}: </span>
                      <span className="text-xs">{data.attemptSummary.deviceInfo}</span>
                    </div>
                  )}
                  {data.attemptSummary.forceSubmittedBy && (
                    <div>
                      <span className="text-muted-foreground">{isRtl ? "أنهي بواسطة" : "Force-ended by"}: </span>
                      <span>{data.attemptSummary.forceSubmittedBy}</span>
                      {data.attemptSummary.forceSubmittedAt && (
                        <span className="text-muted-foreground"> at {formatDateTime(data.attemptSummary.forceSubmittedAt, language)}</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── AI Proctor Report ── */}
          {data.proctor && (
            <Card className="border-purple-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-500" />
                  {isRtl ? "تقرير المراقبة بالذكاء الاصطناعي" : "AI Proctor Report"}
                  <Badge variant="outline" className="ms-auto bg-purple-500/10 border-purple-500/30 text-purple-600 text-[10px]">
                    <Sparkles className="h-3 w-3 me-1" />
                    GPT-4o
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {isRtl ? "تحليل شامل للمخاطر بالذكاء الاصطناعي — استشاري فقط" : "Comprehensive AI-powered forensic analysis — advisory only"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Generate Button */}
                {!aiAnalysis && !aiAnalysisLoading && (
                  <div className="text-center py-4">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-purple-500/30" />
                    <p className="text-xs text-muted-foreground mb-3">
                      {isRtl
                        ? "إنشاء تقرير تحليل شامل بالذكاء الاصطناعي لهذه الجلسة"
                        : "Generate a comprehensive AI forensic analysis report for this session"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAiAnalysis}
                      className="border-purple-500/30 text-purple-600 hover:bg-purple-500/10"
                    >
                      <Sparkles className="h-3.5 w-3.5 me-1.5" />
                      {isRtl ? "إنشاء التقرير الشامل" : "Generate Full Report"}
                    </Button>
                    {aiAnalysisError && (
                      <p className="text-xs text-destructive mt-2">{aiAnalysisError}</p>
                    )}
                  </div>
                )}

                {/* Loading */}
                {aiAnalysisLoading && (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 mx-auto mb-2 text-purple-500 animate-spin" />
                    <p className="text-xs text-muted-foreground">
                      {isRtl ? "جارٍ تحليل الجلسة بالذكاء الاصطناعي..." : "Generating comprehensive analysis report..."}
                    </p>
                  </div>
                )}

                {/* ═══ Analysis Results ═══ */}
                {aiAnalysis && !aiAnalysisLoading && (
                  <div className="space-y-4">

                    {/* ── Header: Risk Level, Score, Confidence ── */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{isRtl ? "مستوى الخطورة" : "Risk Level"}</span>
                          <Badge variant="outline" className={`text-xs font-semibold ${
                            aiAnalysis.riskLevel === "Critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                            aiAnalysis.riskLevel === "High" ? "bg-orange-500/10 border-orange-500/30 text-orange-600" :
                            aiAnalysis.riskLevel === "Medium" ? "bg-amber-500/10 border-amber-500/30 text-amber-600" :
                            "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                          }`}>
                            {aiAnalysis.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {aiAnalysis.riskScore != null && (
                            <span>{isRtl ? "نقاط الخطورة" : "Risk Score"}: <span className="font-medium text-foreground">{aiAnalysis.riskScore}/100</span></span>
                          )}
                          <span>{isRtl ? "الثقة" : "Confidence"}: <span className="font-medium text-foreground">{aiAnalysis.confidence}%</span></span>
                        </div>
                      </div>
                      {/* Risk score visual bar */}
                      {aiAnalysis.riskScore != null && (
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              aiAnalysis.riskScore >= 75 ? "bg-destructive" :
                              aiAnalysis.riskScore >= 50 ? "bg-orange-500" :
                              aiAnalysis.riskScore >= 25 ? "bg-amber-500" :
                              "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, aiAnalysis.riskScore)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* ── Executive Summary ── */}
                    {aiAnalysis.executiveSummary && (
                      <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                        <p className="text-sm font-medium mb-1 text-purple-700 dark:text-purple-300">{isRtl ? "الملخص التنفيذي" : "Executive Summary"}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.executiveSummary}</p>
                      </div>
                    )}

                    {/* ── Candidate Profile ── */}
                    {aiAnalysis.candidateProfile && (
                      <details className="border rounded-lg" open>
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <User className="h-4 w-4 text-blue-500" />
                          {isRtl ? "ملف المرشح" : "Candidate Profile"}
                        </summary>
                        <div className="px-3 pb-3 space-y-1.5">
                          {aiAnalysis.candidateProfile.name && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "الاسم" : "Name"}</span><span>{aiAnalysis.candidateProfile.name}</span></div>
                          )}
                          {aiAnalysis.candidateProfile.email && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "البريد" : "Email"}</span><span>{aiAnalysis.candidateProfile.email}</span></div>
                          )}
                          {aiAnalysis.candidateProfile.rollNumber && aiAnalysis.candidateProfile.rollNumber !== "N/A" && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "الرقم" : "Roll No."}</span><span>{aiAnalysis.candidateProfile.rollNumber}</span></div>
                          )}
                          {aiAnalysis.candidateProfile.department && aiAnalysis.candidateProfile.department !== "N/A" && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "القسم" : "Department"}</span><span>{aiAnalysis.candidateProfile.department}</span></div>
                          )}
                          {aiAnalysis.candidateProfile.identityVerificationStatus && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "التحقق من الهوية" : "ID Verification"}</span><span>{aiAnalysis.candidateProfile.identityVerificationStatus}</span></div>
                          )}
                          {aiAnalysis.candidateProfile.deviceSummary && (
                            <div className="pt-1.5 border-t"><p className="text-xs text-muted-foreground"><span className="font-medium">{isRtl ? "الجهاز" : "Device"}:</span> {aiAnalysis.candidateProfile.deviceSummary}</p></div>
                          )}
                          {aiAnalysis.candidateProfile.networkSummary && (
                            <div><p className="text-xs text-muted-foreground"><span className="font-medium">{isRtl ? "الشبكة" : "Network"}:</span> {aiAnalysis.candidateProfile.networkSummary}</p></div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ── Session Overview ── */}
                    {aiAnalysis.sessionOverview && (
                      <details className="border rounded-lg" open>
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          {isRtl ? "نظرة عامة على الجلسة" : "Session Overview"}
                        </summary>
                        <div className="px-3 pb-3 space-y-1.5">
                          {aiAnalysis.sessionOverview.examTitle && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "الاختبار" : "Exam"}</span><span className="font-medium">{aiAnalysis.sessionOverview.examTitle}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.proctorMode && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "وضع المراقبة" : "Proctor Mode"}</span><span>{aiAnalysis.sessionOverview.proctorMode}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.sessionStatus && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "حالة الجلسة" : "Session Status"}</span><span>{aiAnalysis.sessionOverview.sessionStatus}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.attemptStatus && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "حالة المحاولة" : "Attempt Status"}</span><span>{aiAnalysis.sessionOverview.attemptStatus}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.duration && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "المدة" : "Duration"}</span><span>{aiAnalysis.sessionOverview.duration}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.timeUsage && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "استخدام الوقت" : "Time Usage"}</span><span>{aiAnalysis.sessionOverview.timeUsage}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.completionRate && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "نسبة الإكمال" : "Completion"}</span><span>{aiAnalysis.sessionOverview.completionRate}</span></div>
                          )}
                          {aiAnalysis.sessionOverview.terminationInfo && aiAnalysis.sessionOverview.terminationInfo !== "N/A" && (
                            <div className="pt-1.5 border-t">
                              <p className="text-xs text-destructive"><span className="font-medium">{isRtl ? "الإنهاء" : "Termination"}:</span> {aiAnalysis.sessionOverview.terminationInfo}</p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ── Behavior Analysis ── */}
                    {aiAnalysis.behaviorAnalysis && (
                      <details className="border rounded-lg">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <Activity className="h-4 w-4 text-cyan-500" />
                          {isRtl ? "تحليل السلوك" : "Behavior Analysis"}
                        </summary>
                        <div className="px-3 pb-3 space-y-2.5">
                          {aiAnalysis.behaviorAnalysis.answerPatternSummary && (
                            <div><p className="text-xs font-medium mb-0.5">{isRtl ? "أنماط الإجابة" : "Answer Patterns"}</p><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.behaviorAnalysis.answerPatternSummary}</p></div>
                          )}
                          {aiAnalysis.behaviorAnalysis.timingAnalysis && (
                            <div><p className="text-xs font-medium mb-0.5">{isRtl ? "تحليل التوقيت" : "Timing Analysis"}</p><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.behaviorAnalysis.timingAnalysis}</p></div>
                          )}
                          {aiAnalysis.behaviorAnalysis.navigationBehavior && (
                            <div><p className="text-xs font-medium mb-0.5">{isRtl ? "سلوك التنقل" : "Navigation Behavior"}</p><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.behaviorAnalysis.navigationBehavior}</p></div>
                          )}
                          {aiAnalysis.behaviorAnalysis.focusBehavior && (
                            <div><p className="text-xs font-medium mb-0.5">{isRtl ? "سلوك التركيز" : "Focus Behavior"}</p><p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.behaviorAnalysis.focusBehavior}</p></div>
                          )}
                          {aiAnalysis.behaviorAnalysis.suspiciousPatterns && (
                            <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10">
                              <p className="text-xs font-medium mb-0.5 text-amber-600">{isRtl ? "أنماط مشبوهة" : "Suspicious Patterns"}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{aiAnalysis.behaviorAnalysis.suspiciousPatterns}</p>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ── Violation Analysis ── */}
                    {aiAnalysis.violationAnalysis && (
                      <details className="border rounded-lg border-orange-500/20">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          {isRtl ? "تحليل المخالفات" : "Violation Analysis"}
                          {aiAnalysis.violationAnalysis.totalViolations != null && (
                            <Badge variant="outline" className="ms-auto text-[10px] bg-orange-500/10 border-orange-500/30 text-orange-600">{aiAnalysis.violationAnalysis.totalViolations} {isRtl ? "مخالفة" : "violations"}</Badge>
                          )}
                        </summary>
                        <div className="px-3 pb-3 space-y-2">
                          {aiAnalysis.violationAnalysis.thresholdStatus && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "حالة الحد" : "Threshold"}</span><span className="text-xs">{aiAnalysis.violationAnalysis.thresholdStatus}</span></div>
                          )}
                          {aiAnalysis.violationAnalysis.violationTrend && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "اتجاه المخالفات" : "Trend"}</span><span className="text-xs">{aiAnalysis.violationAnalysis.violationTrend}</span></div>
                          )}
                          {aiAnalysis.violationAnalysis.violationBreakdown && aiAnalysis.violationAnalysis.violationBreakdown.length > 0 && (
                            <div className="pt-1.5 border-t">
                              <p className="text-xs font-medium mb-1.5">{isRtl ? "التفاصيل" : "Breakdown"}</p>
                              <div className="space-y-1">
                                {aiAnalysis.violationAnalysis.violationBreakdown.map((v, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                                    <span className="font-medium">{v.type}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">x{v.count}</span>
                                      <Badge variant="outline" className={`text-[9px] ${
                                        v.severity === "Critical" ? "border-destructive/30 text-destructive" :
                                        v.severity === "High" ? "border-orange-500/30 text-orange-600" :
                                        v.severity === "Medium" ? "border-amber-500/30 text-amber-600" :
                                        "border-muted-foreground/30"
                                      }`}>{v.severity}</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ── Environment Assessment ── */}
                    {aiAnalysis.environmentAssessment && (
                      <details className="border rounded-lg">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <Shield className="h-4 w-4 text-teal-500" />
                          {isRtl ? "تقييم البيئة" : "Environment Assessment"}
                        </summary>
                        <div className="px-3 pb-3 space-y-1.5">
                          {aiAnalysis.environmentAssessment.browserCompliance && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "المتصفح" : "Browser"}</span><span className="text-xs max-w-[60%] text-end">{aiAnalysis.environmentAssessment.browserCompliance}</span></div>
                          )}
                          {aiAnalysis.environmentAssessment.networkStability && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "الشبكة" : "Network"}</span><span className="text-xs max-w-[60%] text-end">{aiAnalysis.environmentAssessment.networkStability}</span></div>
                          )}
                          {aiAnalysis.environmentAssessment.webcamStatus && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "الكاميرا" : "Webcam"}</span><span className="text-xs">{aiAnalysis.environmentAssessment.webcamStatus}</span></div>
                          )}
                          {aiAnalysis.environmentAssessment.fullscreenCompliance && (
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{isRtl ? "ملء الشاشة" : "Fullscreen"}</span><span className="text-xs">{aiAnalysis.environmentAssessment.fullscreenCompliance}</span></div>
                          )}
                          {aiAnalysis.environmentAssessment.overallEnvironmentRisk && (
                            <div className="pt-1.5 border-t flex justify-between text-sm"><span className="text-muted-foreground font-medium">{isRtl ? "خطر البيئة" : "Environment Risk"}</span><span className="font-medium text-xs">{aiAnalysis.environmentAssessment.overallEnvironmentRisk}</span></div>
                          )}
                        </div>
                      </details>
                    )}

                    {/* ── Suspicious Behaviors ── */}
                    {aiAnalysis.suspiciousBehaviors?.length > 0 && (
                      <details className="border rounded-lg border-amber-500/20">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          {isRtl ? "السلوكيات المشبوهة" : "Suspicious Behaviors"}
                          <Badge variant="outline" className="ms-auto text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-600">{aiAnalysis.suspiciousBehaviors.length}</Badge>
                        </summary>
                        <div className="px-3 pb-3">
                          <ul className="space-y-1">
                            {aiAnalysis.suspiciousBehaviors.map((behavior, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                                <span>{behavior}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}

                    {/* ── Aggravating & Mitigating Factors ── */}
                    {((aiAnalysis.aggravatingFactors && aiAnalysis.aggravatingFactors.length > 0) || (aiAnalysis.mitigatingFactors && aiAnalysis.mitigatingFactors.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {aiAnalysis.aggravatingFactors && aiAnalysis.aggravatingFactors.length > 0 && (
                          <div className="p-2.5 rounded-lg border border-destructive/20 bg-destructive/5">
                            <p className="text-xs font-medium mb-1.5 text-destructive">{isRtl ? "عوامل مشددة" : "Aggravating Factors"}</p>
                            <ul className="space-y-1">
                              {aiAnalysis.aggravatingFactors.map((f, i) => (
                                <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
                                  <XCircle className="h-3 w-3 mt-0.5 shrink-0 text-destructive/60" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {aiAnalysis.mitigatingFactors && aiAnalysis.mitigatingFactors.length > 0 && (
                          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                            <p className="text-xs font-medium mb-1.5 text-emerald-600">{isRtl ? "عوامل مخففة" : "Mitigating Factors"}</p>
                            <ul className="space-y-1">
                              {aiAnalysis.mitigatingFactors.map((f, i) => (
                                <li key={i} className="flex items-start gap-1 text-xs text-muted-foreground">
                                  <CheckCircle className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500/60" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Risk Timeline ── */}
                    {aiAnalysis.riskTimeline && aiAnalysis.riskTimeline.length > 0 && (
                      <details className="border rounded-lg">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <Clock className="h-4 w-4 text-violet-500" />
                          {isRtl ? "الجدول الزمني للمخاطر" : "Risk Timeline"}
                        </summary>
                        <div className="px-3 pb-3">
                          <div className="relative border-s-2 border-muted ms-2 space-y-2">
                            {aiAnalysis.riskTimeline.map((event, i) => (
                              <div key={i} className="ms-4 relative">
                                <div className="absolute -start-[1.3rem] top-1 h-2 w-2 rounded-full bg-violet-500" />
                                <p className="text-xs text-muted-foreground">{event}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}

                    {/* ── Integrity Verdict ── */}
                    {aiAnalysis.integrityVerdict && (
                      <div className="p-3 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                        <p className="text-sm font-medium mb-1 text-purple-700 dark:text-purple-300">{isRtl ? "حكم النزاهة" : "Integrity Verdict"}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.integrityVerdict}</p>
                      </div>
                    )}

                    {/* ── Recommendations ── */}
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 ? (
                      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <p className="text-sm font-medium mb-1.5 text-purple-700 dark:text-purple-300">{isRtl ? "التوصيات" : "Recommendations"}</p>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-muted-foreground">
                              <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-500" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : aiAnalysis.recommendation && (
                      <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <p className="text-sm font-medium mb-1">{isRtl ? "التوصية" : "Recommendation"}</p>
                        <div className="flex items-start gap-1.5">
                          <Shield className="h-4 w-4 mt-0.5 shrink-0 text-purple-500" />
                          <p className="text-sm text-purple-700 dark:text-purple-300">{aiAnalysis.recommendation}</p>
                        </div>
                      </div>
                    )}

                    {/* ── Detailed Analysis (collapsible) ── */}
                    {aiAnalysis.detailedAnalysis && (
                      <details className="border rounded-lg">
                        <summary className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                          <FileText className="h-4 w-4 text-gray-500" />
                          {isRtl ? "التحليل التفصيلي الكامل" : "Full Detailed Analysis"}
                        </summary>
                        <div className="px-3 pb-3">
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{aiAnalysis.detailedAnalysis}</p>
                        </div>
                      </details>
                    )}

                    {/* ── Footer: Regenerate & Timestamp ── */}
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {aiAnalysis.generatedAt ? new Date(aiAnalysis.generatedAt).toLocaleString(isRtl ? "ar-SA" : "en-US") : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateAiAnalysis}
                        className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-500/10"
                      >
                        <Sparkles className="h-3 w-3 me-1" />
                        {isRtl ? "إعادة إنشاء" : "Regenerate"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Section C: Proctor Media ── */}
          {data.proctor && (data.proctor.video || data.proctor.screenshots.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  {isRtl ? "وسائط المراقبة" : "Proctor Media"}
                </CardTitle>
                <CardDescription>
                  {isRtl ? "الفيديو ولقطات الشاشة المسجلة أثناء المحاولة" : "Video and screenshots captured during the attempt"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video */}
                {data.proctor.video && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Video className="h-4 w-4" />
                      {isRtl ? "الفيديو" : "Video Recording"}
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                      <Video className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{data.proctor.video.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(data.proctor.video.fileSize)}
                          {data.proctor.video.durationSeconds
                            ? ` · ${Math.floor(data.proctor.video.durationSeconds / 60)}m ${data.proctor.video.durationSeconds % 60}s`
                            : ""}
                          {data.proctor.video.capturedAt
                            ? ` · ${formatDateTime(data.proctor.video.capturedAt, language)}`
                            : ""}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/proxy/Proctor/evidence/${data.proctor.video.id}/download-url`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {isRtl ? "فتح" : "Open"}
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Screenshots Gallery */}
                {data.proctor.screenshots.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <ImageIcon className="h-4 w-4" />
                        {isRtl ? "لقطات الشاشة" : "Screenshots"}
                        <Badge variant="outline" className="text-xs">{data.proctor.totalScreenshots}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {data.proctor.screenshots.map((ss) => (
                        <div
                          key={ss.id}
                          className="group relative border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                          onClick={() => setScreenshotPreview(screenshotPreview === ss.id ? null : ss.id)}
                        >
                          <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                            {ss.previewUrl ? (
                              <img
                                src={ss.previewUrl}
                                alt={ss.fileName || "Screenshot"}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const el = e.target as HTMLImageElement;
                                  el.style.display = "none";
                                  el.parentElement!.querySelector(".fallback-icon")?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <ImageIcon className={`h-6 w-6 text-muted-foreground fallback-icon ${ss.previewUrl ? "hidden" : ""}`} />
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] text-muted-foreground truncate">
                              {ss.capturedAt ? formatDateTime(ss.capturedAt, language) : ss.fileName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(ss.fileSize)}</p>
                          </div>
                          {/* Quick download overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a
                              href={`/api/proxy/Proctor/evidence/${ss.id}/download-url`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-white text-xs flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {isRtl ? "فتح" : "Open"}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                    {data.proctor.totalScreenshots > data.proctor.screenshots.length && (
                      <p className="text-xs text-muted-foreground text-center">
                        {isRtl
                          ? `عرض ${data.proctor.screenshots.length} من ${data.proctor.totalScreenshots} لقطة`
                          : `Showing ${data.proctor.screenshots.length} of ${data.proctor.totalScreenshots} screenshots`}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Section D: Event Logs ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                {isRtl ? "سجل الأحداث" : "Event Timeline"}
              </CardTitle>
              <CardDescription>
                {isRtl
                  ? `${mappedEvents.length} حدث مسجل لهذه المحاولة`
                  : `${mappedEvents.length} events recorded for this attempt`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mappedEvents.length > 0 ? (
                <AttemptEventLog events={mappedEvents} maxHeight="500px" />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {isRtl ? "لا توجد أحداث مسجلة" : "No events recorded"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Attempts History ── */}
          {data.attemptsList.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isRtl ? "جميع المحاولات" : "All Attempts"}
                </CardTitle>
                <CardDescription>
                  {isRtl ? `${data.attemptsList.length} محاولة لهذا الاختبار` : `${data.attemptsList.length} attempts for this exam`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium">#</th>
                        <th className="text-left py-2 px-3 font-medium">{isRtl ? "الحالة" : "Status"}</th>
                        <th className="text-left py-2 px-3 font-medium">{isRtl ? "بدأ" : "Started"}</th>
                        <th className="text-left py-2 px-3 font-medium">{isRtl ? "سُلّم" : "Submitted"}</th>
                        <th className="text-left py-2 px-3 font-medium">{isRtl ? "الدرجة" : "Score"}</th>
                        <th className="text-left py-2 px-3 font-medium">{isRtl ? "النتيجة" : "Result"}</th>
                        <th className="text-right py-2 px-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.attemptsList.map(a => (
                        <tr
                          key={a.attemptId}
                          className={`border-b hover:bg-muted/50 transition-colors ${
                            a.attemptId === data.attemptSummary?.attemptId ? "bg-muted/30" : ""
                          }`}
                        >
                          <td className="py-2 px-3 font-medium">{a.attemptNumber}</td>
                          <td className="py-2 px-3">
                            <Badge variant={statusBadgeVariant(a.statusName)} className="text-xs">
                              {getStatusIcon(a.statusName)}
                              <span className="ml-1">{a.statusName}</span>
                            </Badge>
                          </td>
                          <td className="py-2 px-3">{formatDateTime(a.startedAt, language)}</td>
                          <td className="py-2 px-3">{formatDateTime(a.submittedAt, language)}</td>
                          <td className="py-2 px-3">{a.totalScore ?? "—"}</td>
                          <td className="py-2 px-3">
                            {a.isPassed !== null && a.isPassed !== undefined ? (
                              <Badge variant={a.isPassed ? "default" : "destructive"} className="text-xs">
                                {a.isPassed ? (isRtl ? "ناجح" : "Pass") : (isRtl ? "راسب" : "Fail")}
                              </Badge>
                            ) : "—"}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {a.attemptId !== data.attemptSummary?.attemptId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSwitchAttempt(String(a.attemptId))}
                              >
                                {isRtl ? "عرض" : "View"}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
