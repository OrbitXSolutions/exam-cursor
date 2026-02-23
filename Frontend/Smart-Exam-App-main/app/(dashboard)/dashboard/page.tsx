"use client"

import { useState, useEffect } from "react"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getDashboardStats, getUpcomingExams, getDashboardIncidents } from "@/lib/api/dashboard"
import type { Exam } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ClipboardList,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  FileQuestion,
  GraduationCap,
  Award,
  BookOpen,
  Target,
  Activity,
  BarChart3,
  UserCheck,
} from "lucide-react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { UserRole } from "@/lib/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DashboardPage() {
  const { t, language } = useI18n()
  const { user, hasRole } = useAuth()
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalAttempts: 0,
    passRate: 0,
    pendingGrading: 0,
    openIncidents: 0,
    attemptsOverTime: [] as { date: string; count: number }[],
    riskDistribution: [] as { level: string; count: number }[],
  })
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([])
  const [incidentCases, setIncidentCases] = useState<{ id: number; titleEn?: string; titleAr?: string; candidateName?: string; severityName?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = hasRole([UserRole.Admin, UserRole.Instructor])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [statsRes, examsRes, incidentsRes] = await Promise.all([
          getDashboardStats(),
          getUpcomingExams(5),
          isAdmin ? getDashboardIncidents(5) : Promise.resolve([]),
        ])
        setStats(statsRes)
        setUpcomingExams(examsRes)
        setIncidentCases(incidentsRes)
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin])

  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]
  const attemptsChartData = stats.attemptsOverTime.length > 0 ? stats.attemptsOverTime : [
    { date: "W1", count: 0 },
    { date: "W2", count: 0 },
    { date: "W3", count: 0 },
    { date: "W4", count: 0 },
    { date: "W5", count: 0 },
    { date: "W6", count: 0 },
    { date: "W7", count: 0 },
  ]
  const riskChartData = stats.riskDistribution.length > 0 ? stats.riskDistribution : [
    { level: "Low", count: 0 },
    { level: "Medium", count: 0 },
    { level: "High", count: 0 },
    { level: "Critical", count: 0 },
  ]

  // --- Enhanced dummy data for demo ---
  const scoreDistribution = [
    { range: "0-20", count: 2, fill: "hsl(0, 70%, 55%)" },
    { range: "21-40", count: 5, fill: "hsl(25, 70%, 55%)" },
    { range: "41-60", count: 12, fill: "hsl(45, 70%, 55%)" },
    { range: "61-80", count: 28, fill: "hsl(142, 60%, 45%)" },
    { range: "81-100", count: 18, fill: "hsl(142, 70%, 35%)" },
  ]

  const departmentPerformance = [
    { department: "IT", avgScore: 78, candidates: 45 },
    { department: "Finance", avgScore: 82, candidates: 32 },
    { department: "HR", avgScore: 71, candidates: 28 },
    { department: "Operations", avgScore: 85, candidates: 38 },
    { department: "Marketing", avgScore: 74, candidates: 22 },
  ]

  const monthlyTrends = [
    { month: "Sep", exams: 3, attempts: 45, passed: 32 },
    { month: "Oct", exams: 5, attempts: 78, passed: 58 },
    { month: "Nov", exams: 7, attempts: 112, passed: 89 },
    { month: "Dec", exams: 4, attempts: 65, passed: 48 },
    { month: "Jan", exams: 8, attempts: 134, passed: 102 },
    { month: "Feb", exams: 6, attempts: 98, passed: 76 },
  ]

  const completionData = [
    { name: "Completed", value: 76, fill: "hsl(142, 60%, 45%)" },
    { name: "In Progress", value: 15, fill: "hsl(45, 70%, 55%)" },
    { name: "Not Started", value: 9, fill: "hsl(var(--muted-foreground))" },
  ]

  const topPerformers = [
    { name: "Sara Al-Rashidi", department: "Finance", score: 98, exams: 5 },
    { name: "Ahmed Hassan", department: "IT", score: 96, exams: 7 },
    { name: "Nour Ahmed", department: "Operations", score: 94, exams: 4 },
    { name: "Youssef Khalil", department: "Finance", score: 92, exams: 6 },
    { name: "Ali Mohammed", department: "IT", score: 91, exams: 5 },
  ]

  const recentSubmissions = [
    { candidate: "Ali Mohammed", exam: "Python Basics", score: 85, status: "Passed", time: "2 min ago" },
    { candidate: "Nour Ahmed", exam: "Data Structures", score: 72, status: "Passed", time: "15 min ago" },
    { candidate: "Youssef Khalil", exam: "SQL Fundamentals", score: 45, status: "Failed", time: "1 hr ago" },
    { candidate: "Sara Al-Rashidi", exam: "Cloud Computing", score: 91, status: "Passed", time: "2 hrs ago" },
    { candidate: "Ahmed Hassan", exam: "Cybersecurity", score: 0, status: "Pending", time: "3 hrs ago" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">

        {/* Enhanced Sections - Admin Only (TOP) */}
        {isAdmin && (
          <>
            {/* Summary Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Avg. Score"
                value="76%"
                icon={Target}
                trend={{ value: 4, isPositive: true }}
              />
              <StatCard
                title="Active Candidates"
                value="165"
                icon={UserCheck}
                trend={{ value: 12, isPositive: true }}
              />
              <StatCard
                title="Exams This Month"
                value="14"
                icon={BookOpen}
                trend={{ value: 3, isPositive: true }}
              />
              <StatCard
                title="Completion Rate"
                value="76%"
                icon={Award}
                trend={{ value: 5, isPositive: true }}
              />
            </div>

            {/* Score Distribution + Department Performance */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Score Distribution
                  </CardTitle>
                  <CardDescription>Distribution of candidate scores across all exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value} candidates`, "Count"]}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {scoreDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Department Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Department Performance
                  </CardTitle>
                  <CardDescription>Average scores by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis
                          dataKey="department"
                          type="category"
                          width={90}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number, name: string) => [
                            name === "avgScore" ? `${value}%` : value,
                            name === "avgScore" ? "Avg Score" : "Candidates"
                          ]}
                        />
                        <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends + Completion Rate */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Monthly Trends */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Monthly Trends
                  </CardTitle>
                  <CardDescription>Exams, attempts, and pass rates over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="attempts" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Attempts" />
                        <Line type="monotone" dataKey="passed" stroke="hsl(142, 60%, 45%)" strokeWidth={2} dot={{ r: 4 }} name="Passed" />
                        <Line type="monotone" dataKey="exams" stroke="hsl(45, 70%, 55%)" strokeWidth={2} dot={{ r: 4 }} name="Exams Created" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Completion Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Completion Rate
                  </CardTitle>
                  <CardDescription>Overall exam completion status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={completionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {completionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {completionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Submissions + Top Performers */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Recent Submissions
                  </CardTitle>
                  <CardDescription>Latest exam submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSubmissions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{sub.candidate}</p>
                          <p className="text-xs text-muted-foreground">{sub.exam}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {sub.status !== "Pending" && (
                            <span className="text-sm font-semibold">{sub.score}%</span>
                          )}
                          <Badge
                            variant={sub.status === "Passed" ? "default" : sub.status === "Failed" ? "destructive" : "secondary"}
                            className={sub.status === "Passed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : ""}
                          >
                            {sub.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{sub.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Highest scoring candidates this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((performer, idx) => (
                      <div key={idx} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">{performer.department} &middot; {performer.exams} exams</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{performer.score}%</p>
                        </div>
                        <div className="w-20 hidden sm:block">
                          <Progress value={performer.score} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("dashboard.totalExams")}
            value={stats.totalExams}
            icon={ClipboardList}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title={t("dashboard.totalAttempts")}
            value={stats.totalAttempts}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard title={t("dashboard.passRate")} value={`${stats.passRate}%`} icon={CheckCircle} />
          {isAdmin && (
            <StatCard
              title={t("dashboard.openIncidents")}
              value={stats.openIncidents}
              icon={AlertTriangle}
              className={stats.openIncidents > 0 ? "border-destructive/50" : ""}
            />
          )}
          {!isAdmin && (
            <StatCard title={t("dashboard.pendingGrading")} value={stats.pendingGrading} icon={GraduationCap} />
          )}
        </div>

        {/* Quick Actions, Upcoming Exams & Recent Activity - 3 columns */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks at your fingertips</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {isAdmin ? (
                <>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" asChild>
                    <Link href="/question-bank/create">
                      <FileQuestion className="mr-3 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{t("questionBank.createQuestion")}</p>
                        <p className="text-xs text-muted-foreground">Add new question to bank</p>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" asChild>
                    <Link href="/exams/setup">
                      <ClipboardList className="mr-3 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{t("exams.createExam")}</p>
                        <p className="text-xs text-muted-foreground">Build a new examination</p>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" asChild>
                    <Link href="/grading">
                      <GraduationCap className="mr-3 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{t("grading.gradingQueue")}</p>
                        <p className="text-xs text-muted-foreground">{stats.pendingGrading} pending submissions</p>
                      </div>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" asChild>
                    <Link href="/my-exams">
                      <ClipboardList className="mr-3 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{t("myExams.availableExams")}</p>
                        <p className="text-xs text-muted-foreground">{t("myExams.viewAndStart")}</p>
                      </div>
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-transparent" asChild>
                    <Link href="/my-results">
                      <CheckCircle className="mr-3 h-5 w-5 text-primary" />
                      <div className="text-left">
                        <p className="font-medium">{t("myExams.myResults")}</p>
                        <p className="text-xs text-muted-foreground">{t("myExams.viewScores")}</p>
                      </div>
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.upcomingExams")}</CardTitle>
                <CardDescription>Scheduled examinations</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={isAdmin ? "/exams/list" : "/my-exams"}>
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingExams.slice(0, 3).map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{getLocalizedField(exam, "title", language)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {exam.startAt
                        ? new Date(exam.startAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "Not scheduled"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{exam.durationMinutes} min</div>
                </div>
              ))}
              {upcomingExams.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity / Open Incidents */}
          {isAdmin ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Open Incidents</CardTitle>
                  <CardDescription>Cases requiring attention</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/incidents">
                    View all
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {incidentCases.slice(0, 3).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {language === "ar" ? (incident.titleAr ?? incident.titleEn) : (incident.titleEn ?? incident.titleAr)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{incident.candidateName}</p>
                    </div>
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {incident.severityName ?? "—"}
                    </span>
                  </div>
                ))}
                {incidentCases.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No open incidents</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                <CardDescription>Your recent exam activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row - only for admin */}
        {isAdmin && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Attempts Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {t("dashboard.attemptsOverTime")}
                </CardTitle>
                <CardDescription>Exam attempts in the last 7 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attemptsChartData}>
                      <defs>
                        <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorAttempts)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Risk Distribution (Admin) / Pass Rate by Subject (Candidate) */}
            {isAdmin ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    {t("dashboard.riskDistribution")}
                  </CardTitle>
                  <CardDescription>Proctor session risk levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="count"
                          nameKey="level"
                          label={({ level, percent }) => `${level} ${(percent * 100).toFixed(0)}%`}
                        >
                          {riskChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Pass Rate by Subject</CardTitle>
                  <CardDescription>Your performance across different subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.passRateByExam} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis
                          dataKey="examTitle"
                          type="category"
                          width={100}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Pass Rate"]}
                        />
                        <Bar dataKey="passRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
