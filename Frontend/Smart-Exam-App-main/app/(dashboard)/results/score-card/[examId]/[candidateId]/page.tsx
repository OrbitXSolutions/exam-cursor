"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getGradingSessionByAttempt, initiateGrading, type GradingSessionDetail, type GradedAnswerItem } from "@/lib/api/grading"
import { getAttemptIdForCandidate } from "@/lib/api/results"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Award,
  Clock,
  Target,
  HelpCircle,
  MessageSquare,
} from "lucide-react"

function getLocalizedText(en: string | undefined, ar: string | undefined, language: string): string {
  return (language === "ar" ? ar : en) || en || ""
}

export default function ScoreCardPage() {
  const params = useParams<{ examId: string; candidateId: string }>()
  const examId = Number(params.examId)
  const candidateId = params.candidateId
  const router = useRouter()
  const { t, language, dir } = useI18n()

  const [session, setSession] = useState<GradingSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadScoreCard() {
      try {
        setLoading(true)
        setError(null)

        // First get the attemptId for this candidate and exam
        const attemptId = await getAttemptIdForCandidate(examId, candidateId)
        if (!attemptId) {
          setError(language === "ar" ? "لم يتم العثور على محاولة لهذا المرشح" : "No attempt found for this candidate")
          return
        }

        // Get the grading session which contains all answers and scores
        let data = await getGradingSessionByAttempt(attemptId)
        if (!data) {
          const initiated = await initiateGrading(attemptId)
          if (initiated) {
            data = await getGradingSessionByAttempt(attemptId)
          }
        }
        if (!data) {
          setError(language === "ar" ? "لم يتم العثور على بيانات التصحيح" : "Grading data not found")
          return
        }
        setSession(data)
      } catch (err) {
        console.error("Failed to load score card:", err)
        setError(language === "ar" ? "فشل في تحميل كشف الدرجات" : "Failed to load score card")
      } finally {
        setLoading(false)
      }
    }

    if (examId && candidateId) {
      loadScoreCard()
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
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">{error || "No data found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Go Back"}
        </Button>
      </div>
    )
  }

  const examTitle = getLocalizedText(session.examTitleEn, session.examTitleAr, language)
  const percentage = session.maxPossibleScore > 0
    ? ((session.totalScore ?? 0) / session.maxPossibleScore) * 100
    : 0

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
              {language === "ar" ? "كشف الدرجات" : "Score Card"}
            </h1>
            <p className="text-muted-foreground">{examTitle}</p>
          </div>
        </div>
        <Badge variant={session.isPassed ? "default" : "destructive"} className="text-base px-4 py-1">
          {session.isPassed
            ? (language === "ar" ? "ناجح" : "PASSED")
            : (language === "ar" ? "راسب" : "FAILED")}
        </Badge>
      </div>

      {/* Candidate Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {language === "ar" ? "معلومات المرشح" : "Candidate Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الاسم" : "Name"}</p>
              <p className="font-medium">{session.candidateName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم التعريف" : "ID"}</p>
              <p className="font-medium">{session.candidateId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "رقم المحاولة" : "Attempt ID"}</p>
              <p className="font-medium">{session.attemptId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ التصحيح" : "Graded At"}</p>
              <p className="font-medium">
                {session.gradedAt
                  ? new Date(session.gradedAt).toLocaleString(language === "ar" ? "ar-SA" : "en-US")
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {language === "ar" ? "ملخص الدرجات" : "Score Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-primary">{session.totalScore?.toFixed(2) ?? "0"}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الدرجة" : "Score"}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{session.maxPossibleScore}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الحد الأقصى" : "Max Score"}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{session.passScore}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "درجة النجاح" : "Pass Score"}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold text-primary">{percentage.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "النسبة" : "Percentage"}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-3xl font-bold">{session.totalQuestions}</p>
              <p className="text-sm text-muted-foreground">{language === "ar" ? "الأسئلة" : "Questions"}</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Question-by-Question Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {language === "ar" ? "تفاصيل الإجابات" : "Answer Details"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? `${session.gradedQuestions} من ${session.totalQuestions} سؤال تم تصحيحه`
              : `${session.gradedQuestions} of ${session.totalQuestions} questions graded`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {[...session.answers]
                .sort((a, b) => a.questionId - b.questionId)
                .map((answer, index) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    index={index}
                    language={language}
                    labels={{
                      manual: t("grading.manualGrading"),
                      auto: t("grading.autoGraded"),
                      unanswered: t("results.unanswered"),
                    }}
                  />
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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

function AnswerCard({
  answer,
  index,
  language,
  labels,
}: {
  answer: GradedAnswerItem
  index: number
  language: string
  labels: { manual: string; auto: string; unanswered: string }
}) {
  const questionText = getLocalizedText(answer.questionBodyEn, answer.questionBodyAr, language)
  const isUnanswered = !answer.textAnswer && (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0)

  return (
    <div
      className={`p-4 rounded-lg border ${
        answer.isCorrect
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
            {index + 1}
          </span>
          <Badge variant="outline">{answer.questionTypeName}</Badge>
          <Badge variant={answer.isManuallyGraded ? "secondary" : "outline"}>
            {answer.isManuallyGraded ? labels.manual : labels.auto}
          </Badge>
          {isUnanswered && (
            <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
              {labels.unanswered}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {answer.isCorrect ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-bold">
            {answer.score} / {answer.maxPoints}
          </span>
        </div>
      </div>

      <p className="text-sm mb-3 font-medium">{questionText}</p>

      {/* Candidate's Answer */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>{language === "ar" ? "إجابة المرشح:" : "Candidate's Answer:"}</span>
        </div>
        <div className="pl-6 text-sm">
          {answer.textAnswer ? (
            <p className="p-2 bg-background rounded border">{answer.textAnswer}</p>
          ) : answer.selectedOptionIds && answer.selectedOptionIds.length > 0 ? (
            <p className="text-muted-foreground">
              {language === "ar" ? `الخيارات المحددة: ${answer.selectedOptionIds.join(", ")}` : `Selected options: ${answer.selectedOptionIds.join(", ")}`}
            </p>
          ) : (
            <p className="text-muted-foreground italic">
              {language === "ar" ? "لم يتم الإجابة" : "No answer provided"}
            </p>
          )}
        </div>
      </div>

      {/* Grader Comment */}
      {answer.graderComment && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <MessageSquare className="h-4 w-4" />
            <span>{language === "ar" ? "تعليق المصحح:" : "Grader Comment:"}</span>
          </div>
          <p className="pl-6 text-sm italic">{answer.graderComment}</p>
        </div>
      )}
    </div>
  )
}
