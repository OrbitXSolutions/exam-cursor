"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getCandidateResultList, type CandidateResultListItem } from "@/lib/api/results"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Brain, FileSearch, Eye, Search } from "lucide-react"

export default function ProctorReportPage() {
  const { language } = useI18n()
  const router = useRouter()

  const [data, setData] = useState<CandidateResultListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("")
  const [selectedExamKey, setSelectedExamKey] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Single API call to load all candidate+exam combinations
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCandidateResultList(undefined, { pageNumber: 1, pageSize: 500 })
      .then((res) => {
        if (!cancelled) setData(res?.items ?? [])
      })
      .catch((err) => {
        console.warn("[ProctorReport] Failed to load data:", err)
        if (!cancelled) setData([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Distinct candidates
  const candidates = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string; rollNo?: string }>()
    data.forEach((row) => {
      if (!map.has(row.candidateId)) {
        const anyRow = row as Record<string, unknown>
        map.set(row.candidateId, {
          id: row.candidateId,
          name: row.candidateName,
          email: row.candidateEmail,
          rollNo: (anyRow.rollNo ?? anyRow.RollNo ?? "") as string,
        })
      }
    })
    return Array.from(map.values())
  }, [data])

  // Filtered candidates based on search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates
    const q = searchQuery.trim().toLowerCase()
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.rollNo ?? "").toLowerCase().includes(q)
    )
  }, [candidates, searchQuery])

  // Exams filtered by selected candidate
  const examsForCandidate = useMemo(() => {
    if (!selectedCandidateId) return []
    const map = new Map<number, CandidateResultListItem>()
    data
      .filter((row) => row.candidateId === selectedCandidateId)
      .forEach((row) => {
        // Keep the latest attempt per exam
        const existing = map.get(row.examId)
        if (!existing || row.attemptId > existing.attemptId) {
          map.set(row.examId, row)
        }
      })
    return Array.from(map.values())
  }, [data, selectedCandidateId])

  // Parse selected exam key to get examId and attemptId
  const selectedRow = useMemo(() => {
    if (!selectedExamKey) return null
    const [examIdStr, attemptIdStr] = selectedExamKey.split("|")
    return examsForCandidate.find(
      (r) => r.examId === Number(examIdStr) && r.attemptId === Number(attemptIdStr)
    ) ?? null
  }, [selectedExamKey, examsForCandidate])

  const handleCandidateChange = (value: string) => {
    setSelectedCandidateId(value)
    setSelectedExamKey("")
  }

  const handleViewReport = () => {
    if (!selectedRow || !selectedCandidateId) return
    const url = `/results/ai-report/${selectedRow.examId}/${selectedCandidateId}?attemptId=${selectedRow.attemptId}`
    router.push(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8" />
            {language === "ar" ? "تقرير المراقبة بالذكاء الاصطناعي" : "AI Proctor Report"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "ar" ? "عرض تقارير المراقبة" : "View AI proctoring reports"}
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {language === "ar" ? "لا تتوفر تقارير مراقبة." : "No proctor reports available."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="h-8 w-8" />
          {language === "ar" ? "تقرير المراقبة بالذكاء الاصطناعي" : "AI Proctor Report"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar"
            ? "اختر المرشح والامتحان لعرض تقرير المراقبة بالذكاء الاصطناعي"
            : "Select a candidate and exam to view the AI proctoring report"}
        </p>
      </div>

      {/* Selector Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Candidate Dropdown - Full Width with Search */}
          <div className="w-full">
            <Label className="text-sm font-medium mb-2 block">
              {language === "ar" ? "المرشح" : "Candidate"}
            </Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 w-full"
                placeholder={
                  language === "ar"
                    ? "بحث بالاسم أو البريد أو الرقم..."
                    : "Search by name, email or roll no..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCandidateId} onValueChange={handleCandidateChange}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={language === "ar" ? "اختر المرشح..." : "Select candidate..."}
                />
              </SelectTrigger>
              <SelectContent>
                {filteredCandidates.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    {language === "ar" ? "لا توجد نتائج" : "No results found"}
                  </div>
                ) : (
                  filteredCandidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.email ? ` (${c.email})` : ""}
                      {c.rollNo ? ` — ${c.rollNo}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Exam Dropdown - Full Width */}
          <div className="w-full">
            <Label className="text-sm font-medium mb-2 block">
              {language === "ar" ? "الامتحان" : "Exam"}
            </Label>
            <Select
              value={selectedExamKey}
              onValueChange={setSelectedExamKey}
              disabled={!selectedCandidateId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedCandidateId
                      ? language === "ar"
                        ? "اختر المرشح أولاً"
                        : "Select a candidate first"
                      : language === "ar"
                        ? "اختر الامتحان..."
                        : "Select exam..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {examsForCandidate.map((row) => (
                  <SelectItem
                    key={`${row.examId}|${row.attemptId}`}
                    value={`${row.examId}|${row.attemptId}`}
                  >
                    {language === "ar" ? row.examTitleAr || row.examTitleEn : row.examTitleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Report Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedRow}
            onClick={handleViewReport}
          >
            <Eye className="h-5 w-5 mr-2" />
            {language === "ar" ? "عرض التقرير" : "View Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
