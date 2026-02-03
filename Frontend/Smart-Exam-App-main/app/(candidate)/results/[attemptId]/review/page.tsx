"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getMyResultReview, type CandidateResultReview, type ReviewQuestionDto } from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, FileText, 
  ChevronLeft, ChevronRight, Trophy
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

// Question type mapping for display names (supports various backend naming conventions)
const QUESTION_TYPE_DISPLAY: Record<string, string> = {
  // MCQ Single variants
  "MCQ_Single": "Multiple Choice",
  "MCQ Single Choice": "Multiple Choice",
  "SingleChoice": "Multiple Choice",
  "Multiple Choice": "Multiple Choice",
  // MCQ Multi variants
  "MCQ_Multi": "Multiple Select",
  "MCQ_Multiple": "Multiple Select",
  "MCQ Multiple Choice": "Multiple Select",
  "MultipleChoice": "Multiple Select",
  "Multiple Select": "Multiple Select",
  // True/False variants
  "TrueFalse": "True/False",
  "True_False": "True/False",
  "True/False": "True/False",
  // Short Answer variants
  "ShortAnswer": "Short Answer",
  "Short_Answer": "Short Answer",
  "Short Answer": "Short Answer",
  // Essay
  "Essay": "Essay",
  // Numeric
  "Numeric": "Numeric",
}

// Helper function to get question type display name
function getQuestionTypeDisplayName(questionTypeName: string): string {
  // Try exact match first
  if (QUESTION_TYPE_DISPLAY[questionTypeName]) {
    return QUESTION_TYPE_DISPLAY[questionTypeName]
  }
  // Try case-insensitive match
  const lowerName = questionTypeName?.toLowerCase()
  for (const [key, value] of Object.entries(QUESTION_TYPE_DISPLAY)) {
    if (key.toLowerCase() === lowerName) return value
  }
  return questionTypeName
}

export default function ReviewPage() {
  const { attemptId: attemptIdParam } = useParams<{ attemptId: string }>()
  const attemptId = Number.parseInt(attemptIdParam, 10)
  const router = useRouter()
  const { t, language, dir } = useI18n()
  const [review, setReview] = useState<CandidateResultReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    loadReview()
  }, [attemptId])

  async function loadReview() {
    try {
      setLoading(true)
      setError(null)
      
      const data = await getMyResultReview(attemptId)
      setReview(data)
    } catch (err) {
      console.error("[v0] Error loading review:", err)
      setError(t("results.reviewNotAllowed"))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">{t("results.reviewNotAllowed")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("results.reviewNotAllowedDesc")}
              </p>
            </div>
            <Button asChild>
              <Link href={`/results/${attemptId}`}>
                <ArrowLeft className="h-4 w-4 me-2" />
                {t("results.backToResults")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const questions = review.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  
  // Calculate stats
  const correctCount = questions.filter(q => q.isCorrect === true).length
  const incorrectCount = questions.filter(q => q.isCorrect === false).length
  const pendingCount = questions.filter(q => q.isCorrect === null).length
  const totalScore = review.totalScore || 0
  const maxScore = review.maxPossibleScore || 0
  const percentage = review.percentage || 0

  function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  function goToPrevQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  function navigateToQuestion(index: number) {
    setCurrentQuestionIndex(index)
  }

  // Render question review
  function renderQuestionReview(question: ReviewQuestionDto) {
    const hasOptions = question.options && question.options.length > 0
    const showCorrectness = question.isCorrect !== null || question.options?.some(o => o.isCorrect !== null)
    
    return (
      <div className="space-y-4">
        {/* Options-based question */}
        {hasOptions && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const wasSelected = option.wasSelected
              const isCorrect = option.isCorrect
              
              // Determine styling
              let optionStyle = "border-muted"
              if (showCorrectness) {
                if (isCorrect === true) {
                  optionStyle = "border-emerald-500 bg-emerald-500/10"
                } else if (wasSelected && isCorrect === false) {
                  optionStyle = "border-red-500 bg-red-500/10"
                } else if (wasSelected) {
                  optionStyle = "border-blue-500 bg-blue-500/10"
                }
              } else if (wasSelected) {
                optionStyle = "border-blue-500 bg-blue-500/10"
              }
              
              return (
                <div
                  key={option.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${optionStyle}`}
                >
                  <span className="flex-1">{getLocalizedField(option, "text", language)}</span>
                  <div className="flex items-center gap-2">
                    {wasSelected && (
                      <Badge variant="outline" className="text-xs">
                        {t("results.yourAnswer")}
                      </Badge>
                    )}
                    {showCorrectness && isCorrect === true && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    )}
                    {showCorrectness && wasSelected && isCorrect === false && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Text answer */}
        {question.textAnswer && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{t("results.yourAnswer")}:</p>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="whitespace-pre-wrap">{question.textAnswer}</p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {question.feedback && (
          <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
            <p className="text-sm font-medium text-blue-600 mb-1">{t("results.feedback")}:</p>
            <p className="text-sm">{question.feedback}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/results/${attemptId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{t("results.reviewTitle")}</h1>
              <p className="text-sm text-muted-foreground">
                {getLocalizedField(review, "examTitle", language)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={review.isPassed ? "default" : "destructive"}>
              {review.isPassed ? t("results.passed") : t("results.failed")}
            </Badge>
            <span className="font-mono font-bold text-lg">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar - Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("results.questionList")}</CardTitle>
                <CardDescription>
                  {correctCount} {t("results.correct")} / {incorrectCount} {t("results.incorrect")}
                  {pendingCount > 0 && ` / ${pendingCount} ${t("results.pending")}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] lg:h-[400px]">
                  <div className="grid grid-cols-5 gap-2 pe-4">
                    {questions.map((q, index) => {
                      const isCurrent = index === currentQuestionIndex
                      const isCorrect = q.isCorrect === true
                      const isIncorrect = q.isCorrect === false
                      const isPending = q.isCorrect === null
                      
                      let bgClass = "bg-muted hover:bg-muted/80"
                      if (isCurrent) {
                        bgClass = "bg-primary text-primary-foreground"
                      } else if (isCorrect) {
                        bgClass = "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                      } else if (isIncorrect) {
                        bgClass = "bg-red-500/20 text-red-700 dark:text-red-400"
                      } else if (isPending) {
                        bgClass = "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      }
                      
                      return (
                        <button
                          type="button"
                          key={q.questionId}
                          onClick={() => navigateToQuestion(index)}
                          className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${bgClass}`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
                
                {/* Legend */}
                <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500/30" />
                    <span>{t("results.correct")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-red-500/30" />
                    <span>{t("results.incorrect")}</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-amber-500/30" />
                      <span>{t("results.pending")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Question Review */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {currentQuestionIndex + 1}
                      </span>
                      <Badge variant="outline">
                        {currentQuestion.points} {t("common.points")}
                      </Badge>
                      <Badge variant="secondary">
                        {getQuestionTypeDisplayName(currentQuestion.questionTypeName)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentQuestion.isCorrect === true && (
                        <Badge className="bg-emerald-500">
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          {currentQuestion.scoreEarned}/{currentQuestion.points}
                        </Badge>
                      )}
                      {currentQuestion.isCorrect === false && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 me-1" />
                          {currentQuestion.scoreEarned}/{currentQuestion.points}
                        </Badge>
                      )}
                      {currentQuestion.isCorrect === null && (
                        <Badge variant="outline" className="text-amber-600">
                          {t("results.pendingGrading")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question Body */}
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg">{getLocalizedField(currentQuestion, "body", language)}</p>
                  </div>

                  {/* Answer Review */}
                  {renderQuestionReview(currentQuestion)}
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={goToPrevQuestion} 
                disabled={currentQuestionIndex === 0}
                className="bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 me-1" />
                {t("exam.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} / {totalQuestions}
              </span>
              <Button 
                variant="outline" 
                onClick={goToNextQuestion} 
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="bg-transparent"
              >
                {t("exam.next")}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {t("results.summary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{percentage.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">{t("results.score")}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{totalScore}/{maxScore}</p>
                <p className="text-sm text-muted-foreground">{t("results.totalPoints")}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-500/10">
                <p className="text-3xl font-bold text-emerald-600">{correctCount}</p>
                <p className="text-sm text-muted-foreground">{t("results.correct")}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <p className="text-3xl font-bold text-red-600">{incorrectCount}</p>
                <p className="text-sm text-muted-foreground">{t("results.incorrect")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="flex justify-center mt-8">
          <Button variant="outline" asChild className="bg-transparent">
            <Link href={`/results/${attemptId}`}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("results.backToResults")}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
