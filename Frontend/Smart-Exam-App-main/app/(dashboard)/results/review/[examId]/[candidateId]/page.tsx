"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getGradingSessionByAttempt, initiateGrading, type GradingSessionDetail, type GradedAnswerItem } from "@/lib/api/grading"
import { getAttemptIdForCandidate } from "@/lib/api/results"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertCircle,
} from "lucide-react"

function getLocalizedText(en: string | undefined, ar: string | undefined, language: string): string {
  return (language === "ar" ? ar : en) || en || ""
}

export default function ExamReviewPage() {
  const params = useParams<{ examId: string; candidateId: string }>()
  const examId = Number(params.examId)
  const candidateId = params.candidateId
  const router = useRouter()
  const { t, language, dir } = useI18n()

  const [session, setSession] = useState<GradingSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    async function loadReview() {
      try {
        setLoading(true)
        setError(null)

        const attemptId = await getAttemptIdForCandidate(examId, candidateId)
        if (!attemptId) {
          setError(language === "ar" ? "لم يتم العثور على محاولة لهذا المرشح" : "No attempt found for this candidate")
          return
        }

        let data = await getGradingSessionByAttempt(attemptId)
        if (!data) {
          const initiated = await initiateGrading(attemptId)
          if (initiated) {
            data = await getGradingSessionByAttempt(attemptId)
          }
        }
        if (!data) {
          setError(language === "ar" ? "لم يتم العثور على بيانات المراجعة" : "Review data not found")
          return
        }
        setSession(data)
      } catch (err) {
        console.error("Failed to load review:", err)
        setError(language === "ar" ? "فشل في تحميل المراجعة" : "Failed to load review")
      } finally {
        setLoading(false)
      }
    }

    if (examId && candidateId) {
      loadReview()
    }
  }, [examId, candidateId, language])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error || "No data found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Go Back"}
        </Button>
      </div>
    )
  }

  const examTitle = getLocalizedText(session.examTitleEn, session.examTitleAr, language)
  const answers = [...(session.answers || [])].sort((a, b) => a.questionId - b.questionId)
  const currentAnswer = answers[currentIndex]
  const percentage = session.maxPossibleScore > 0
    ? ((session.totalScore ?? 0) / session.maxPossibleScore) * 100
    : 0

  const correctCount = answers.filter((a) => a.isCorrect).length
  const incorrectCount = answers.filter((a) => !a.isCorrect).length
  const manualLabel = t("grading.manualGrading")
  const autoLabel = t("grading.autoGraded")
  const unansweredLabel = t("results.unanswered")
  const isUnanswered = (a: GradedAnswerItem) =>
    !a.textAnswer && (!a.selectedOptionIds || a.selectedOptionIds.length === 0)

  return (
    <div className="flex-1 space-y-6 p-6" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {language === "ar" ? "مراجعة الاختبار" : "Exam Review"}
            </h1>
            <p className="text-muted-foreground">{examTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={session.isPassed ? "default" : "destructive"}>
            {session.isPassed
              ? (language === "ar" ? "ناجح" : "PASSED")
              : (language === "ar" ? "راسب" : "FAILED")}
          </Badge>
          <Badge variant="outline">
            {session.totalScore?.toFixed(1)} / {session.maxPossibleScore} ({percentage.toFixed(1)}%)
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="font-medium">{session.candidateName}</p>
            <p className="text-xs text-muted-foreground">{session.candidateId}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{session.totalQuestions}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "الأسئلة" : "Questions"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "صحيح" : "Correct"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
            <p className="text-xs text-muted-foreground">{language === "ar" ? "خاطئ" : "Incorrect"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">
            {language === "ar" ? "عرض فردي" : "Single View"}
          </TabsTrigger>
          <TabsTrigger value="all">
            {language === "ar" ? "عرض الكل" : "View All"}
          </TabsTrigger>
        </TabsList>

        {/* Single Question View */}
        <TabsContent value="single" className="space-y-4">
          {currentAnswer && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {currentIndex + 1}
                    </span>
                    {language === "ar" ? `السؤال ${currentIndex + 1} من ${answers.length}` : `Question ${currentIndex + 1} of ${answers.length}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentAnswer.questionTypeName}</Badge>
                    <Badge variant={currentAnswer.isManuallyGraded ? "secondary" : "outline"}>
                      {currentAnswer.isManuallyGraded ? manualLabel : autoLabel}
                    </Badge>
                    {isUnanswered(currentAnswer) && (
                      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                        {unansweredLabel}
                      </Badge>
                    )}
                    {currentAnswer.isCorrect ? (
                      <Badge className="bg-green-600">{language === "ar" ? "صحيح" : "Correct"}</Badge>
                    ) : (
                      <Badge variant="destructive">{language === "ar" ? "خاطئ" : "Incorrect"}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                  <p className="font-medium text-lg">
                    {getLocalizedText(currentAnswer.questionBodyEn, currentAnswer.questionBodyAr, language)}
                  </p>
                </div>

                {/* Candidate's Answer */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar" ? "إجابة المرشح:" : "Candidate's Answer:"}
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    {currentAnswer.textAnswer ? (
                      <p>{currentAnswer.textAnswer}</p>
                    ) : currentAnswer.selectedOptionIds && currentAnswer.selectedOptionIds.length > 0 ? (
                      <p>
                        {language === "ar"
                          ? `الخيارات المحددة: ${currentAnswer.selectedOptionIds.join(", ")}`
                          : `Selected options: ${currentAnswer.selectedOptionIds.join(", ")}`}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        {language === "ar" ? "لم يتم الإجابة" : "No answer provided"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{language === "ar" ? "الدرجة" : "Score"}</p>
                    <p className="text-xl font-bold">
                      {currentAnswer.score} / {currentAnswer.maxPoints}
                    </p>
                  </div>
                </div>

                {/* Grader Comment */}
                {currentAnswer.graderComment && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {language === "ar" ? "تعليق المصحح" : "Grader's Comment"}
                      </p>
                    </div>
                    <p className="text-sm">{currentAnswer.graderComment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {language === "ar" ? "السابق" : "Previous"}
            </Button>
            <div className="flex items-center gap-1">
              {answers.map((a, idx) => (
                <button
                  key={a.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    idx === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : a.isCorrect
                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((prev) => Math.min(answers.length - 1, prev + 1))}
              disabled={currentIndex === answers.length - 1}
            >
              {language === "ar" ? "التالي" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        {/* All Questions View */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "جميع الأسئلة" : "All Questions"}</CardTitle>
              <CardDescription>
                {language === "ar"
                  ? `إجمالي ${answers.length} سؤال`
                  : `Total ${answers.length} questions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {answers.map((answer, index) => (
                    <div
                      key={answer.id}
                      className={`p-4 rounded-lg border ${
                        answer.isCorrect
                          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
                          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {answer.questionTypeName}
                          </Badge>
                          <Badge variant={answer.isManuallyGraded ? "secondary" : "outline"} className="text-xs">
                            {answer.isManuallyGraded ? manualLabel : autoLabel}
                          </Badge>
                          {isUnanswered(answer) && (
                            <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                              {unansweredLabel}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {answer.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm font-medium">
                            {answer.score}/{answer.maxPoints}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">
                        {getLocalizedText(answer.questionBodyEn, answer.questionBodyAr, language)}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{language === "ar" ? "الإجابة: " : "Answer: "}</span>
                        {answer.textAnswer || (answer.selectedOptionIds?.join(", ")) || (language === "ar" ? "لا إجابة" : "No answer")}
                      </div>
                      {answer.graderComment && (
                        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                          <MessageSquare className="inline h-3 w-3 mr-1" />
                          {answer.graderComment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Back Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع إلى القائمة" : "Back to List"}
        </Button>
      </div>
    </div>
  )
}
