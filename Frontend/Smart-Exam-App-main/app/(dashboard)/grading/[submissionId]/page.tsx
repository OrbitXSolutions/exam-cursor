"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getGradingSessionByAttempt,
  initiateGrading,
  submitManualGrade,
  completeGrading,
  type GradingSessionDetail,
  type GradedAnswerItem,
} from "@/lib/api/grading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, User, Save, Send, FileText, ChevronLeft, ChevronRight } from "lucide-react"

interface GradeState {
  points: number
  feedback: string
  saved: boolean
}

function getLocalizedField(obj: { questionBodyEn?: string; questionBodyAr?: string }, language: string): string {
  return (language === "ar" ? obj.questionBodyAr : obj.questionBodyEn) || obj.questionBodyEn || ""
}

export default function GradeSubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const attemptId = Number(submissionId)
  const router = useRouter()
  const { t, dir, language } = useI18n()

  const [session, setSession] = useState<GradingSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [grades, setGrades] = useState<Map<number, GradeState>>(new Map())

  useEffect(() => {
    if (!Number.isNaN(attemptId)) {
      loadSession()
    }
  }, [attemptId])

  async function loadSession() {
    try {
      setLoading(true)
      let data = await getGradingSessionByAttempt(attemptId)
      if (!data) {
        const initiated = await initiateGrading(attemptId)
        if (initiated) {
          data = await getGradingSessionByAttempt(attemptId)
        }
      }
      setSession(data || null)
      if (data) {
        const initialGrades = new Map<number, GradeState>()
        const manualAnswers = data.answers.filter((a) => a.isManuallyGraded)
        manualAnswers.forEach((a) => {
          initialGrades.set(a.questionId, {
            points: a.score,
            feedback: a.graderComment || "",
            saved: true,
          })
        })
        setGrades(initialGrades)
      }
    } catch (error) {
      toast.error("Failed to load submission")
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const manualQuestions: GradedAnswerItem[] =
    session?.answers.filter((a) => a.isManuallyGraded) || []
  const currentQuestion = manualQuestions[currentQuestionIndex]
  const currentGrade = currentQuestion ? grades.get(currentQuestion.questionId) : null
  const isUnanswered = currentQuestion
    ? !currentQuestion.textAnswer && (!currentQuestion.selectedOptionIds || currentQuestion.selectedOptionIds.length === 0)
    : false

  function updateGrade(questionId: number, updates: Partial<GradeState>) {
    setGrades((prev) => {
      const current = prev.get(questionId) || { points: 0, feedback: "", saved: false }
      return new Map(prev).set(questionId, { ...current, ...updates, saved: false })
    })
  }

  async function handleSaveGrade() {
    if (!session || !currentQuestion || !currentGrade) return

    try {
      setSaving(true)
      await submitManualGrade({
        gradingSessionId: session.id,
        questionId: currentQuestion.questionId,
        score: currentGrade.points,
        isCorrect: currentGrade.points >= currentQuestion.maxPoints * 0.5,
        graderComment: currentGrade.feedback || undefined,
      })
      setGrades((prev) => new Map(prev).set(currentQuestion.questionId, { ...currentGrade, saved: true }))
      toast.success(t("grading.gradeSaved"))
    } catch (error) {
      toast.error("Failed to save grade")
    } finally {
      setSaving(false)
    }
  }

  async function handleFinalize() {
    if (!session) return
    try {
      setFinalizing(true)
      const finalResult = await completeGrading(session.id)
      toast.success(t("grading.finalized", { score: finalResult.totalScore }), {
        description: language === "ar" ? "سيظهر المرشح في صفحة نتائج المرشحين." : "Candidate will appear on Candidate Result page.",
        action: {
          label: language === "ar" ? "عرض النتائج" : "View results",
          onClick: () => router.push("/results/candidate-result"),
        },
      })
      router.push("/grading")
    } catch (error) {
      toast.error("Failed to finalize grading")
    } finally {
      setFinalizing(false)
      setFinalizeDialogOpen(false)
    }
  }

  const gradedCount = manualQuestions.filter((q) => grades.get(q.questionId)?.saved).length
  const progress = manualQuestions.length > 0 ? (gradedCount / manualQuestions.length) * 100 : 100
  const allGraded = manualQuestions.length === 0 || gradedCount === manualQuestions.length

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  if (loading || !session) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const examTitle = language === "ar" ? session.examTitleAr : session.examTitleEn

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/grading">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{examTitle}</h1>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{session.candidateName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {session.totalScore != null ? Math.round((session.totalScore / session.maxPossibleScore) * 100) : 0}% auto
          </Badge>
          <Button onClick={() => setFinalizeDialogOpen(true)} disabled={!allGraded || finalizing}>
            {finalizing ? (
              <LoadingSpinner size="sm" className="me-2" />
            ) : (
              <Send className="h-4 w-4 me-2" />
            )}
            {t("grading.finalize")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {gradedCount} / {manualQuestions.length} {t("grading.questionsGraded")}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {manualQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All questions are auto-graded. No manual grading required.</p>
              <Button asChild className="mt-4">
                <Link href="/grading">Back to Grading</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Question {currentQuestionIndex + 1} of {manualQuestions.length}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-2">
                <Badge variant="secondary">{t("grading.manualGrading")}</Badge>
                {isUnanswered && (
                  <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                    {t("results.unanswered")}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion && (
                <>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-base">
                      {getLocalizedField(currentQuestion, language)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <Label className="text-sm text-muted-foreground">{t("grading.candidateAnswer")}</Label>
                    <p className="mt-2 whitespace-pre-wrap">
                      {currentQuestion.textAnswer || JSON.stringify(currentQuestion.selectedOptionIds) || "-"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("grading.gradeQuestion")}</CardTitle>
              <CardDescription>
                {currentQuestion
                  ? `${t("grading.maxPoints")}: ${currentQuestion.maxPoints}`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="points">{t("grading.points")}</Label>
                    <Input
                      id="points"
                      type="number"
                      min={0}
                      max={currentQuestion.maxPoints}
                      step={0.5}
                      value={currentGrade?.points ?? 0}
                      onChange={(e) =>
                        updateGrade(currentQuestion.questionId, {
                          points: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">{t("grading.feedback")}</Label>
                    <Textarea
                      id="feedback"
                      rows={4}
                      value={currentGrade?.feedback ?? ""}
                      onChange={(e) =>
                        updateGrade(currentQuestion.questionId, {
                          feedback: e.target.value,
                        })
                      }
                      placeholder={t("grading.feedbackPlaceholder")}
                    />
                  </div>
                  <Button
                    onClick={handleSaveGrade}
                    disabled={saving || currentGrade?.saved}
                    className="w-full"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" className="me-2" />
                    ) : (
                      <Save className="h-4 w-4 me-2" />
                    )}
                    {currentGrade?.saved ? t("grading.saved") : t("grading.saveGrade")}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {manualQuestions.length > 1 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className={`h-4 w-4 ${dir === "rtl" ? "order-2" : "me-2"}`} />
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentQuestionIndex((i) => Math.min(manualQuestions.length - 1, i + 1))
            }
            disabled={currentQuestionIndex === manualQuestions.length - 1}
          >
            {t("common.next")}
            <ChevronRight className={`h-4 w-4 ${dir === "rtl" ? "me-2" : "ms-2"}`} />
          </Button>
        </div>
      )}

      <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("grading.finalizeConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("grading.finalizeConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <LoadingSpinner size="sm" /> : t("grading.finalize")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
