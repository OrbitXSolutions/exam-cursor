"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getMyResult, type CandidateResult } from "@/lib/api/candidate"
import { getCertificateByResult } from "@/lib/api/certificates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CheckCircle2, XCircle, Trophy, Clock, Target, FileText, ArrowLeft, Download, Share2, AlertCircle } from "lucide-react"

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

export default function ResultsPage() {
  const { attemptId: attemptIdParam } = useParams<{ attemptId: string }>()
  const attemptId = Number.parseInt(attemptIdParam, 10)
  const searchParams = useSearchParams()
  const justSubmitted = searchParams.get("submitted") === "true"
  const { t, language } = useI18n()
  const [result, setResult] = useState<CandidateResult | null>(null)
  const [certificate, setCertificate] = useState<{ id: number; downloadUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResult()
  }, [attemptId])

  useEffect(() => {
    if (result?.resultId && result?.isPassed) {
      getCertificateByResult(result.resultId).then((cert) => {
        if (cert) setCertificate({ id: cert.id, downloadUrl: cert.downloadUrl })
      })
    }
  }, [result?.resultId, result?.isPassed])

  async function loadResult() {
    try {
      setLoading(true)
      setError(null)

      const data = await getMyResult(attemptId)
      console.log("[v0] Result loaded:", data)
      setResult(data)
    } catch (err) {
      console.error("[v0] Error loading result:", err)
      setError(t("results.notAvailable"))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{t("results.calculating")}</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">{t("results.notAvailable")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("results.notAvailableDesc")}
              </p>
            </div>
            <Button asChild>
              <Link href="/my-exams">
                <ArrowLeft className="h-4 w-4 me-2" />
                {t("results.backToExams")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if results are hidden (all score fields are null)
  const showScores = result.totalScore !== null

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/my-exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{getLocalizedField(result, "examTitle", language)}</h1>
              <p className="text-sm text-muted-foreground">
                {t("results.attempt")} #{result.attemptNumber}
              </p>
            </div>
          </div>
          {showScores && (
            <div className="flex items-center gap-2">
              {certificate && result?.isPassed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/proxy/Certificate/${certificate.id}/download`, {
                        headers: { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("auth_token") : ""}` },
                      })
                      const html = await res.text()
                      const win = window.open("", "_blank")
                      if (win) win.document.write(html)
                    } catch {
                      window.open(`/api/proxy/Certificate/${certificate.id}/download`, "_blank")
                    }
                  }}
                >
                  <Download className="h-4 w-4 me-2" />
                  {t("results.downloadCertificate") || "Download Certificate"}
                </Button>
              )}
              <Button variant="outline" size="sm" className="bg-transparent">
                <Share2 className="h-4 w-4 me-2" />
                {t("results.share")}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* Just Submitted Banner */}
        {justSubmitted && (
          <Card className="mb-6 border-blue-500/50 bg-blue-500/5">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
              <div>
                <p className="font-medium">{t("results.submittedSuccessfully")}</p>
                <p className="text-sm text-muted-foreground">{t("results.submittedDesc")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Hidden Notice */}
        {!showScores && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <div>
                <p className="font-medium">{t("results.resultsHidden")}</p>
                <p className="text-sm text-muted-foreground">{t("results.resultsHiddenDesc")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success/Failure Banner - Only show if scores are visible */}
        {showScores && (
          <Card
            className={`mb-8 overflow-hidden ${result.isPassed
                ? "border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-transparent"
                : "border-red-500/50 bg-gradient-to-r from-red-500/10 to-transparent"
              }`}
          >
            <CardContent className="flex items-center gap-6 p-6">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full ${result.isPassed ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
              >
                {result.isPassed ? (
                  <Trophy className="h-10 w-10 text-emerald-500" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-500" />
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${result.isPassed ? "text-emerald-600" : "text-red-600"}`}>
                  {result.isPassed ? t("results.congratulations") : t("results.tryAgain")}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {result.isPassed ? t("results.passedMessage") : t("results.failedMessage")}
                </p>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${result.isPassed ? "text-emerald-600" : "text-red-600"}`}>
                  {result.percentage?.toFixed(0)}%
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant={result.isPassed ? "default" : "destructive"}>
                    {result.isPassed ? t("results.passed") : t("results.failed")}
                  </Badge>
                  {result.gradeLabel && (
                    <Badge variant="outline">{result.gradeLabel}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid - Only show if scores are visible */}
        {showScores && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.score")}</p>
                  <p className="text-2xl font-bold">{result.percentage?.toFixed(0)}%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.totalScore")}</p>
                  <p className="text-2xl font-bold">{result.totalScore}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.maxScore")}</p>
                  <p className="text-2xl font-bold">{result.maxPossibleScore}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.submittedAt")}</p>
                  <p className="text-lg font-medium">
                    {new Date(result.submittedAt).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                      dateStyle: "short"
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Review Link */}
        {result.allowReview && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("results.reviewAnswers")}
              </CardTitle>
              <CardDescription>
                {result.showCorrectAnswers
                  ? t("results.reviewWithCorrectAnswers")
                  : t("results.reviewWithoutCorrectAnswers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/results/${attemptId}/review`}>
                  {t("results.viewDetailedReview")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submission Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("results.submissionDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("results.examTitle")}</span>
              <span className="font-medium">{getLocalizedField(result, "examTitle", language)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("results.attemptNumber")}</span>
              <span className="font-medium">#{result.attemptNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t("results.submittedAt")}</span>
              <span className="font-medium">
                {new Date(result.submittedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
              </span>
            </div>
            {showScores && (
              <>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t("results.score")}</span>
                  <span className="font-medium">{result.totalScore} / {result.maxPossibleScore}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">{t("results.status")}</span>
                  <Badge variant={result.isPassed ? "default" : "destructive"}>
                    {result.isPassed ? t("results.passed") : t("results.failed")}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild className="bg-transparent">
            <Link href="/my-exams">
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("results.backToExams")}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
