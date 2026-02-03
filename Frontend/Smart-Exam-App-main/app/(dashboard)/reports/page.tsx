"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getExamsForReports,
  getResultDashboard,
  getExamResults,
  type ExamListItem,
  type ResultDashboard,
  type ResultListItem,
} from "@/lib/api/reports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Users, Target, TrendingUp, Award, Search, Download, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<ResultDashboard | null>(null)
  const [candidates, setCandidates] = useState<ResultListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getExamsForReports().then((list) => {
      setExams(list)
      if (list.length > 0 && !selectedExamId) setSelectedExamId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedExamId) {
      setDashboard(null)
      setCandidates([])
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      getResultDashboard(selectedExamId),
      getExamResults(selectedExamId, { pageSize: 100 }),
    ]).then(([dash, res]) => {
      setDashboard(dash || null)
      setCandidates(res.items)
      setLoading(false)
    })
  }, [selectedExamId])

  const filteredCandidates = candidates.filter(
    (c) =>
      c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidateId.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const passFailData = dashboard
    ? [
      { name: t("results.passed"), value: dashboard.passedCount, color: "#10b981" },
      { name: t("results.failed"), value: dashboard.failedCount, color: "#ef4444" },
    ]
    : []

  function exportCsv() {
    if (!dashboard || candidates.length === 0) return
    const headers = ["Candidate", "Candidate ID", "Score %", "Status", "Date"]
    const rows = filteredCandidates.map((c) => [
      `"${(c.candidateName || "").replace(/"/g, '""')}"`,
      `"${(c.candidateId || "").replace(/"/g, '""')}"`,
      Math.round(c.percentage),
      c.isPassed ? "Passed" : "Failed",
      new Date(c.finalizedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US"),
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
          <Select
            value={selectedExamId ? String(selectedExamId) : ""}
            onValueChange={(v) => setSelectedExamId(Number(v))}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={t("reports.selectExam")} />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={String(exam.id)}>
                  {exam.titleEn || exam.titleAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {filteredCandidates.map((candidate) => (
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
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCandidates.length === 0 && (
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
