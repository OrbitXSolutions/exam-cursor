"use client"

import { useEffect, useState, useCallback } from "react"
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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Search, ClipboardCheck, User, BookOpen, Clock, Shield, Camera, Video, FileText,
  AlertTriangle, Activity, ExternalLink, RefreshCw, ChevronDown, ChevronUp,
  Play, CheckCircle, XCircle, Pause, TimerOff, Ban, Loader2, Image as ImageIcon,
} from "lucide-react"
import {
  getCandidateExamDetails, getCandidateExams,
  type CandidateExamDetailsDto, type CandidateExamBriefDto,
} from "@/lib/api/candidate-exam-details"
import { getCandidates, type CandidateDto } from "@/lib/api/candidate-admin"
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
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<CandidateDto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [selectedCandidateName, setSelectedCandidateName] = useState<string>("")
  const [candidateExams, setCandidateExams] = useState<CandidateExamBriefDto[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number>(0)
  const [showSearch, setShowSearch] = useState(true)

  // ── Data State ──
  const [data, setData] = useState<CandidateExamDetailsDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | undefined>()
  const [screenshotPreview, setScreenshotPreview] = useState<number | null>(null)

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

  // ── Search Candidates ──
  const searchCandidates = useCallback(async () => {
    if (!searchTerm.trim()) return
    setIsSearching(true)
    try {
      const result = await getCandidates({ search: searchTerm.trim(), pageSize: 10 })
      setSearchResults(result.items)
      if (result.items.length === 0) {
        toast.info(isRtl ? "لا توجد نتائج" : "No candidates found")
      }
    } catch {
      toast.error(isRtl ? "فشل البحث" : "Search failed")
    } finally {
      setIsSearching(false)
    }
  }, [searchTerm, isRtl])

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

  // ── Select Candidate from Search ──
  const handleSelectCandidate = (c: CandidateDto) => {
    setSelectedCandidateId(c.id)
    setSelectedCandidateName(isRtl ? (c.fullNameAr || c.fullName || "") : (c.fullName || ""))
    setSelectedExamId(0)
    setData(null)
    setSearchResults([])
    setSearchTerm("")
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Candidate Search */}
              <div className="space-y-2">
                <Label>{isRtl ? "البحث عن مرشح" : "Search Candidate"}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={isRtl ? "الاسم، البريد، الرقم..." : "Name, email, roll no..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchCandidates()}
                  />
                  <Button size="sm" onClick={searchCandidates} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto bg-background shadow-sm">
                    {searchResults.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-b-0 transition-colors"
                        onClick={() => handleSelectCandidate(c)}
                      >
                        <div className="font-medium">{isRtl ? (c.fullNameAr || c.fullName) : c.fullName}</div>
                        <div className="text-muted-foreground text-xs">{c.email} {c.rollNo ? `· ${c.rollNo}` : ""}</div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCandidateName && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{selectedCandidateName}</span>
                  </div>
                )}
              </div>

              {/* Exam Selector */}
              <div className="space-y-2">
                <Label>{isRtl ? "اختر الاختبار" : "Select Exam"}</Label>
                <Select
                  value={selectedExamId > 0 ? String(selectedExamId) : ""}
                  onValueChange={handleSelectExam}
                  disabled={!selectedCandidateId}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                    {data.resultInfo?.resultId && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/results/view/${data.exam.examId}/${data.candidate.candidateId}`}
                          target="_blank"
                          rel="noopener noreferrer"
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
                          href={`/grading/review/${data.resultInfo.gradingSessionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isRtl ? "التصحيح" : "Grading"}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                    {data.resultInfo?.certificateId && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/certificates/${data.resultInfo.certificateId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ClipboardCheck className="h-3 w-3 mr-1" />
                          {isRtl ? "الشهادة" : "Certificate"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isRtl ? "المتبقي" : "Remaining"}</span>
                  <span className={data.attemptSummary.remainingSeconds > 0 && data.attemptSummary.remainingSeconds <= 300 ? "text-red-500 font-medium" : ""}>
                    {formatSeconds(data.attemptSummary.remainingSeconds)}
                  </span>
                </div>
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

            {/* Schedule / Assignment */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRtl ? "الجدول الزمني" : "Schedule"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.assignment ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "من" : "From"}</span>
                      <span>{formatDateTime(data.assignment.scheduleFrom, language)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "إلى" : "To"}</span>
                      <span>{formatDateTime(data.assignment.scheduleTo, language)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRtl ? "معيّن من" : "Assigned By"}</span>
                      <span>{data.assignment.assignedBy || "—"}</span>
                    </div>
                    <Badge variant={data.assignment.isActive ? "default" : "outline"} className="text-xs">
                      {data.assignment.isActive ? (isRtl ? "فعال" : "Active") : (isRtl ? "غير فعال" : "Inactive")}
                    </Badge>
                  </>
                ) : (
                  <p className="text-muted-foreground italic">
                    {isRtl ? "لا يوجد تعيين" : "No assignment record"}
                  </p>
                )}
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
                      <span>{data.proctor.modeName}</span>
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
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
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
