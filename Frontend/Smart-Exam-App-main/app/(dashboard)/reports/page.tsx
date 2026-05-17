"use client"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getResultDashboard,
  getExamResults,
  type ResultDashboard,
  type ResultListItem,
} from "@/lib/api/reports"
import { getExams } from "@/lib/api/exams"
import type { Exam } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatCard } from "@/components/ui/stat-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import { Users, Target, TrendingUp, Award, Search, Download, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react"

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const [examItems, setExamItems] = useState<Exam[]>([])
  const [examPage, setExamPage] = useState(0)
  const [examTotalPages, setExamTotalPages] = useState(0)
  const [examSearchLoading, setExamSearchLoading] = useState(false)
  const [examSearch, setExamSearch] = useState("")
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<ResultDashboard | null>(null)
  const [candidates, setCandidates] = useState<ResultListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  const PAGE_SIZE_EXAM = 20
  async function loadExamsPage(search: string, page: number, replace: boolean) {
    setExamSearchLoading(true)
    try {
      const response = await getExams({ search: search || undefined, pageNumber: page, pageSize: PAGE_SIZE_EXAM })
      const items = response.items ?? []
      if (replace) {
        setExamItems(items)
        // Auto-select first exam on initial load
        if (page === 1 && items.length > 0 && selectedExamId === null) {
          setSelectedExamId(items[0].id)
          setSelectedExam(items[0])
        }
      } else {
        setExamItems((prev) => [...prev, ...items])
      }
      setExamPage(page)
      setExamTotalPages(response.totalPages ?? 0)
    } catch {
      // silent
    } finally {
      setExamSearchLoading(false)
    }
  }

  // Load exams on mount
  useEffect(() => {
    loadExamsPage("", 1, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when dropdown opens
  useEffect(() => {
    if (!dropdownOpen) return
    loadExamsPage(examSearch, 1, true)
  }, [dropdownOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced reload on search change
  useEffect(() => {
    if (!dropdownOpen) return
    const timer = setTimeout(() => { loadExamsPage(examSearch, 1, true) }, 300)
    return () => clearTimeout(timer)
  }, [examSearch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelectExam(exam: Exam) {
    setSelectedExamId(exam.id)
    setSelectedExam(exam)
    setExamSearch("")
    setDropdownOpen(false)
  }

  function getExamTitle(exam: Exam) {
    return exam.titleEn || exam.titleAr || ""
  }

  useEffect(() => {
    if (!selectedExamId) { setDashboard(null); return; }
    getResultDashboard(selectedExamId).then((dash) => setDashboard(dash || null))
  }, [selectedExamId])

  useEffect(() => {
    if (!selectedExamId) { setCandidates([]); setLoading(false); return; }
    setLoading(true)
    const handler = setTimeout(() => {
      getExamResults(selectedExamId, {
        pageSize: 100,
        search: searchQuery.trim() || undefined,
      }).then((res) => {
        setCandidates(res.items)
        setLoading(false)
      })
    }, searchQuery ? 300 : 0)
    return () => clearTimeout(handler)
  }, [selectedExamId, searchQuery])

  const passFailData = dashboard
    ? [
      { name: t("results.passed"), value: dashboard.passedCount, color: "#10b981" },
      { name: t("results.failed"), value: dashboard.failedCount, color: "#ef4444" },
    ]
    : []

  function exportCsv() {
    if (!dashboard || candidates.length === 0) return
    const headers = ["Candidate", "Candidate ID", "Score %", "Status", "Date"]
    const rows = candidates.map((c) => [
      `"${(c.candidateName || "").replace(/"/g, '""')}"`,
      `"${(c.candidateId || "").replace(/"/g, '""')}"`,
      Math.round(c.percentage),
      c.isPassed ? "Passed" : "Failed",
      new Date(c.finalizedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { timeZone: "Asia/Dubai" }),
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `exam-${dashboard.examId}-results-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scoreDistribution =
    dashboard?.scoreDistribution?.map((s) => ({ range: s.range, count: s.count })) || [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ]

  if (loading && !dashboard) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-[280px] flex items-center justify-between px-3 py-2.5 h-10 text-sm rounded-md border bg-background hover:bg-accent/50 transition-colors"
            >
              <span className={selectedExam ? "text-foreground" : "text-muted-foreground"}>
                {selectedExam ? getExamTitle(selectedExam) : t("reports.selectExam")}
              </span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute z-50 w-[340px] mt-1 rounded-md border bg-popover shadow-lg">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("common.search")}
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      className="ps-9 h-9 border"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y">
                  {examSearchLoading && examItems.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : examItems.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">{locale === "ar" ? "لم يتم العثور على اختبارات" : "No exams found"}</div>
                  ) : (
                    <>
                      {examItems.map((exam) => (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => handleSelectExam(exam)}
                          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground ${selectedExamId === exam.id ? "bg-primary/10 text-primary font-medium" : ""}`}
                        >
                          {selectedExamId === exam.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                          <span className="truncate">{getExamTitle(exam)}</span>
                        </button>
                      ))}
                      {examPage < examTotalPages && (
                        <button
                          type="button"
                          onClick={() => loadExamsPage(examSearch, examPage + 1, false)}
                          disabled={examSearchLoading}
                          className="w-full px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors text-center disabled:opacity-50"
                        >
                          {examSearchLoading
                            ? <LoadingSpinner size="sm" className="mx-auto" />
                            : (locale === "ar" ? "تحميل المزيد..." : "Load more...")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!dashboard || candidates.length === 0}>
            <Download className="h-4 w-4 me-2" />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("reports.totalCandidates")}
          value={dashboard?.totalCandidates ?? 0}
          icon={Users}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <StatCard
          title={t("reports.averageScore")}
          value={`${dashboard ? Math.round(dashboard.averageScore) : 0}%`}
          icon={Target}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <StatCard
          title={t("reports.passRate")}
          value={`${dashboard ? Math.round(dashboard.passRate) : 0}%`}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
        />
        <StatCard
          title={t("reports.highestScore")}
          value={`${dashboard ? Math.round(dashboard.highestScore) : 0}%`}
          icon={Award}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.scoreDistribution")}</CardTitle>
            <CardDescription>{t("reports.scoreDistributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("reports.passFailRatio")}</CardTitle>
            <CardDescription>{t("reports.passFailRatioDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{t("reports.candidateResults")}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("grading.candidate")}</TableHead>
                <TableHead>{t("results.score")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("reports.finalizedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{candidate.candidateName}</p>
                      <p className="text-sm text-muted-foreground">{candidate.candidateId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-lg font-bold">{Math.round(candidate.percentage)}%</span>
                  </TableCell>
                  <TableCell>
                    {candidate.isPassed ? (
                      <Badge className="bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 me-1" />
                        {t("results.passed")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 me-1" />
                        {t("results.failed")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(candidate.finalizedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
                      timeZone: "Asia/Dubai",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("reports.noCandidates")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
