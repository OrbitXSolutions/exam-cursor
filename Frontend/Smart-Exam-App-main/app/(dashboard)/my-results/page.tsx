"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getMyResults,
  type CandidateResultDto,
} from "@/lib/api/candidate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Trophy,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  BarChart3,
  Target
} from "lucide-react"

// Helper function to get localized field
function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

export default function MyResultsPage() {
  const { t, locale, language } = useI18n()
  const [results, setResults] = useState<CandidateResultDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    try {
      setLoading(true)

      let data: CandidateResultDto[] = []

      data = await getMyResults()
      console.log("[v0] Loaded results from API:", data.length)
      setResults(data)
    } catch (error) {
      console.error("[v0] Error loading results:", error)
      toast.error(t("common.errorOccurred"))
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats (percentage can be null)
  const totalExams = results.length
  const passedExams = results.filter(r => r.isPassed).length
  const averageScore = results.length > 0
    ? Math.round(
      results.reduce((acc, r) => acc + (r.percentage ?? 0), 0) / results.length
    )
    : 0
  const bestScore =
    results.length > 0
      ? Math.max(...results.map(r => r.percentage ?? 0))
      : 0

  function formatDate(dateString: string | null) {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function getGradeColor(grade: string | undefined) {
    if (!grade) return "text-muted-foreground bg-muted"
    switch (grade) {
      case "A": return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
      case "B": return "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
      case "C": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30"
      case "D": return "text-orange-600 bg-orange-50 dark:bg-orange-900/30"
      case "F": return "text-red-600 bg-red-50 dark:bg-red-900/30"
      default: return "text-muted-foreground bg-muted"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("results.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("results.subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalExams}</p>
                <p className="text-xs text-muted-foreground">{t("results.totalExams")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{passedExams}</p>
                <p className="text-xs text-muted-foreground">{t("myExams.passed")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageScore}%</p>
                <p className="text-xs text-muted-foreground">{t("results.averageScore")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bestScore}%</p>
                <p className="text-xs text-muted-foreground">{t("results.bestScore")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={t("results.noResults")}
          description={t("results.noResultsDesc")}
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("results.examHistory")}</h2>

          {results.map((result) => (
            <Card key={result.resultId} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left side - Exam info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {getLocalizedField(result, "examTitle", language)}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(result.finalizedAt)}
                          </span>
                          {result.attemptStartedAt && result.attemptSubmittedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.round(
                                (new Date(result.attemptSubmittedAt).getTime() -
                                  new Date(result.attemptStartedAt).getTime()) / 60000
                              )} {t("common.minutes")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant={result.isPassed ? "default" : "destructive"}>
                            {result.isPassed ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> {t("myExams.passed")}</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> {t("myExams.failed")}</>
                            )}
                          </Badge>
                          {result.attemptNumber > 1 && (
                            <Badge variant="outline">
                              {t("results.attempt")} #{result.attemptNumber}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Grade badge */}
                      {result.gradeLabel && (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${getGradeColor(result.gradeLabel)}`}>
                          {result.gradeLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Score details */}
                  <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l bg-muted/30 p-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{(result.percentage ?? 0).toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">{t("results.score")}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{result.totalScore}/{result.maxPossibleScore}</p>
                      <p className="text-xs text-muted-foreground">{t("common.points")}</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-transparent" asChild>
                      <Link href={`/results/${result.attemptId || result.resultId}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t("common.details")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
