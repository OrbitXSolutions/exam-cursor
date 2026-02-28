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
  getAiGradeSuggestion,
  type GradingSessionDetail,
  type GradedAnswerItem,
  type AiGradeSuggestion,
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
import { ArrowLeft, CheckCircle2, Clock, User, Save, Send, FileText, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

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
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AiGradeSuggestion | null>(null)

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
          // Only mark as saved if the grader has actually graded this question
          const wasGraded = a.score > 0 || !!a.graderComment
          initialGrades.set(a.questionId, {
            points: a.score,
            feedback: a.graderComment || "",
            saved: wasGraded,
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

  async function handleAiSuggest() {
    if (!session || !currentQuestion) return
    try {
      setAiLoading(true)
      setAiSuggestion(null)
      const { data: suggestion, error } = await getAiGradeSuggestion(session.id, currentQuestion.questionId)
      if (suggestion) {
        setAiSuggestion(suggestion)
        updateGrade(currentQuestion.questionId, {
          points: suggestion.suggestedScore,
          feedback: suggestion.suggestedComment,
        })
        toast.success(
          language === "ar" ? "تم إنشاء اقتراح الذكاء الاصطناعي" : "AI suggestion generated",
          { description: language === "ar" ? `الثقة: ${suggestion.confidence}%` : `Confidence: ${suggestion.confidence}%` }
        )
      } else {
        toast.error(error || (language === "ar" ? "فشل إنشاء اقتراح الذكاء الاصطناعي" : "Failed to generate AI suggestion"))
      }
    } catch {
      toast.error(language === "ar" ? "خدمة الذكاء الاصطناعي غير متاحة" : "AI service unavailable")
    } finally {
      setAiLoading(false)
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
                      {currentQuestion.textAnswer ? (
                        currentQuestion.textAnswer
                      ) : currentQuestion.selectedOptions && currentQuestion.selectedOptions.length > 0 ? (
                        currentQuestion.selectedOptions.map((opt, idx) => (
                          <span key={opt.id}>
                            {idx > 0 && ", "}
                            <span className={opt.isCorrect ? "text-green-600 font-medium" : ""}>
                              {language === "ar" ? opt.textAr : opt.textEn}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic">{language === "ar" ? "لم يتم الإجابة" : "No answer"}</span>
                      )}
                    </p>
                  </div>

                  {/* Model Answer / Rubric Reference */}
                  {(currentQuestion.modelAnswerEn || currentQuestion.modelAnswerAr) && (
                    <div className="rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-4">
                      <Label className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {language === "ar" ? "الإجابة النموذجية / معايير التقييم" : "Model Answer / Grading Rubric"}
                      </Label>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-blue-900 dark:text-blue-200">
                        {language === "ar"
                          ? (currentQuestion.modelAnswerAr || currentQuestion.modelAnswerEn)
                          : (currentQuestion.modelAnswerEn || currentQuestion.modelAnswerAr)}
                      </p>
                    </div>
                  )}
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
                  {/* AI Suggest Button */}
                  <Button
                    variant="outline"
                    onClick={handleAiSuggest}
                    disabled={aiLoading || isUnanswered}
                    className="w-full border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-950/50 dark:hover:to-indigo-950/50 text-purple-700 dark:text-purple-300 transition-all duration-300"
                  >
                    {aiLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="me-2" />
                        <span className="animate-pulse">
                          {language === "ar" ? "يحلل الذكاء الاصطناعي..." : "AI Analyzing..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 me-2" />
                        {language === "ar" ? "اقتراح الذكاء الاصطناعي" : "AI Suggest Grade"}
                      </>
                    )}
                  </Button>

                  {/* AI Suggestion Result */}
                  {aiSuggestion && (
                    <div className="rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-950/40 dark:to-indigo-950/40 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {language === "ar" ? "اقتراح الذكاء الاصطناعي" : "AI Suggestion"}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            aiSuggestion.confidence >= 80
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : aiSuggestion.confidence >= 50
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {aiSuggestion.confidence}%{" "}
                          {language === "ar" ? "ثقة" : "confidence"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "ar"
                          ? "يمكنك تعديل الدرجة والتعليق أدناه قبل الحفظ"
                          : "You can adjust the score and feedback below before saving"}
                      </p>
                    </div>
                  )}

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
            onClick={() => { setAiSuggestion(null); setCurrentQuestionIndex((i) => Math.max(0, i - 1)); }}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className={`h-4 w-4 ${dir === "rtl" ? "order-2" : "me-2"}`} />
            {t("common.previous")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAiSuggestion(null);
              setCurrentQuestionIndex((i) => Math.min(manualQuestions.length - 1, i + 1));
            }}
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
