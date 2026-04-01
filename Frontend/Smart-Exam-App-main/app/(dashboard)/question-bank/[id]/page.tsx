"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useI18n } from "@/lib/i18n/context"
import { localizeText } from "@/lib/i18n/runtime"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageLoader } from "@/components/ui/loading-spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getQuestionById, deleteQuestion } from "@/lib/api/question-bank"
import type { Question } from "@/lib/types"
import { ArrowLeft, Edit, Check, X, FileImage, Calendar, Clock, Trash2, Calculator, BookOpen, FileText } from "lucide-react"
import { toast } from "sonner"

// Dynamically import the create page component
const CreateQuestionPage = dynamic(() => import("../create/page"), {
  loading: () => <PageLoader />,
})

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = params.id as string
  const router = useRouter()
  const { t, language } = useI18n()

  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const numericId = Number(questionId)
  const isValidId = !isNaN(numericId) && numericId > 0
  const isCreateRoute = questionId === "create"

  useEffect(() => {
    if (isCreateRoute || !isValidId) {
      setIsLoading(false)
      return
    }
    fetchQuestion()
  }, [questionId, isCreateRoute, isValidId])

  // If the ID is "create", render the create page directly
  if (isCreateRoute) {
    return <CreateQuestionPage />
  }

  const fetchQuestion = async () => {
    try {
      const response = await getQuestionById(numericId)
      const q = (response as any)?.data || response
      if (q && q.id) {
        setQuestion(q)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch question:", error)
      toast.error(localizeText("Failed to load question", "فشل تحميل السؤال", language))
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteQuestion(numericId)
      toast.success(localizeText("Question deleted successfully", "تم حذف السؤال بنجاح", language))
      router.push("/question-bank")
    } catch (error) {
      console.error("[v0] Failed to delete question:", error)
      toast.error(localizeText("Failed to delete question", "فشل حذف السؤال", language))
    }
    setIsDeleting(false)
  }

  if (questionId === "create") {
    return <CreateQuestionPage />
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PageHeader title={language === "ar" ? "تفاصيل السؤال" : "Question Details"} />
        <PageLoader />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex flex-col">
        <PageHeader title={language === "ar" ? "السؤال غير موجود" : "Question Not Found"} />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">{language === "ar" ? "السؤال الذي تبحث عنه غير موجود." : "The question you are looking for does not exist."}</p>
          <Button variant="outline" className="mt-4 bg-transparent" asChild>
            <Link href="/question-bank">
              <ArrowLeft className="me-2 h-4 w-4" />
              {language === "ar" ? "العودة إلى بنك الأسئلة" : "Back to Question Bank"}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader title={language === "ar" ? "تفاصيل السؤال" : "Question Details"} subtitle={language === "ar" ? `سؤال #${question.id}` : `Question #${question.id}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/question-bank">
                <ArrowLeft className="me-2 h-4 w-4" />
                {t("common.back")}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{language === "ar" ? "حذف السؤال" : "Delete Question"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === "ar" ? "هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this question? This action cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (language === "ar" ? "جاري الحذف..." : "Deleting...") : t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button asChild>
                <Link href={`/question-bank/${question.id}/edit`}>
                  <Edit className="me-2 h-4 w-4" />
                  {t("common.edit")}
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Question Content */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{language === "ar" ? "السؤال" : "Question"}</CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? (question.questionTypeNameAr || question.questionTypeNameEn || question.questionTypeName)
                        : (question.questionTypeNameEn || question.questionTypeName)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={question.difficultyLevelName} />
                    <StatusBadge status={question.isActive ? "Active" : "Inactive"} />
                    {question.isCalculatorAllowed && (
                      <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        <Calculator className="h-3 w-3" />
                        {language === "ar" ? "آلة حاسبة" : "Calculator"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* English Body */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الإنجليزية" : "English"}</p>
                    <p className="text-lg leading-relaxed">{question.bodyEn || question.body || (language === "ar" ? "لا يوجد نص للسؤال" : "No question text")}</p>
                  </div>
                  {/* Arabic Body */}
                  {question.bodyAr && (
                    <div dir="rtl">
                      <p className="text-xs font-medium text-muted-foreground mb-1">العربية</p>
                      <p className="text-lg leading-relaxed">{question.bodyAr}</p>
                    </div>
                  )}
                  {/* Primary Image / Chart Attachment */}
                  {question.attachments?.some((a) => a.isPrimary || a.fileType?.toLowerCase().includes("image")) && (() => {
                    const img = question.attachments.find((a) => a.isPrimary && a.fileType?.toLowerCase().includes("image"))
                      || question.attachments.find((a) => a.fileType?.toLowerCase().includes("image"))
                    return img ? (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {language === "ar" ? "صورة / مخطط السؤال" : "Question Image / Chart"}
                        </p>
                        <div className="flex justify-center overflow-hidden rounded-lg border bg-muted/30">
                          <img
                            src={img.filePath}
                            alt="Question image"
                            className="max-h-64 w-auto object-contain"
                          />
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "التفاصيل" : "Details"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Badge className="h-fit">{question.points}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.points")}</p>
                      <p className="font-medium">{question.points} {language === "ar" ? "نقاط" : "points"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "المادة" : "Subject"}</p>
                      <p className="font-medium">
                        {language === "ar"
                          ? (question.subjectNameAr || question.subjectNameEn || "—")
                          : (question.subjectNameEn || "—")}
                      </p>
                    </div>
                  </div>

                  {(question.topicNameEn || question.topicNameAr) && (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileImage className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "الموضوع" : "Topic"}</p>
                        <p className="font-medium">
                          {language === "ar"
                            ? (question.topicNameAr || question.topicNameEn || "—")
                            : (question.topicNameEn || "—")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created"}</p>
                      <p className="font-medium">
                        {new Date(question.createdDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>

                  {question.updatedDate && (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "آخر تحديث" : "Last Updated"}</p>
                        <p className="font-medium">
                          {new Date(question.updatedDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            {question.options && question.options.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.options")}</CardTitle>
                  <CardDescription>{language === "ar" ? "خيارات الإجابة لهذا السؤال" : "Answer choices for this question"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options
                    .sort((a, b) => a.order - b.order)
                    .map((option, index) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                          option.isCorrect
                            ? "border-green-500/50 bg-green-500/5 dark:border-green-500/30"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium ${
                            option.isCorrect
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <div className={`flex-1 ${option.isCorrect ? "font-medium" : ""}`}>
                          <p>{language === "ar" ? (option.textAr || option.textEn || option.text) : (option.textEn || option.text)}</p>
                          {language === "en" && option.textAr && (
                            <p className="text-sm text-muted-foreground mt-1" dir="rtl">{option.textAr}</p>
                          )}
                          {option.attachmentPath && (
                            <div className="mt-2">
                              <img
                                src={option.attachmentPath.startsWith('/') || option.attachmentPath.startsWith('http') ? option.attachmentPath : `/media/${option.attachmentPath}`}
                                alt={`Option ${index + 1} image`}
                                className="h-20 max-w-[200px] object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                        {option.isCorrect ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Model Answer / Rubric (Subjective Questions) */}
            {question.answerKey && (question.answerKey.rubricTextEn || question.answerKey.rubricTextAr) && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {language === "ar" ? "الإجابة النموذجية / معيار التقييم" : "Model Answer / Rubric"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar" ? "الإجابة المرجعية المستخدمة للتصحيح" : "Reference answer used for grading"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.answerKey.rubricTextEn && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الإنجليزية" : "English"}</p>
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-background p-4 whitespace-pre-wrap">
                        {question.answerKey.rubricTextEn}
                      </div>
                    </div>
                  )}
                  {question.answerKey.rubricTextAr && (
                    <div dir="rtl">
                      <p className="text-xs font-medium text-muted-foreground mb-1">العربية</p>
                      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-background p-4 whitespace-pre-wrap">
                        {question.answerKey.rubricTextAr}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Explanation */}
            {(question.explanationEn || question.explanationAr) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {language === "ar" ? "الشرح" : "Explanation"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {question.explanationEn && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{language === "ar" ? "الإنجليزية" : "English"}</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{question.explanationEn}</p>
                    </div>
                  )}
                  {question.explanationAr && (
                    <div dir="rtl">
                      <p className="text-xs font-medium text-muted-foreground mb-1">العربية</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{question.explanationAr}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {question.attachments && question.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.attachments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {question.attachments.map((attachment) => (
                      <div key={attachment.id} className="rounded-lg border overflow-hidden">
                        {attachment.fileType?.toLowerCase().includes("image") ? (
                          <div className="relative w-full h-40 bg-muted/30">
                            <Image
                              src={attachment.filePath}
                              alt={attachment.fileName}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : null}
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <FileImage className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attachment.fileName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{(attachment.fileSize / 1024).toFixed(1)} KB</p>
                              {attachment.isPrimary && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{language === "ar" ? "أساسي" : "Primary"}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
