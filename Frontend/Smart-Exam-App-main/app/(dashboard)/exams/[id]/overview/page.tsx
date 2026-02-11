"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import type { Exam } from "@/lib/types"
import { getExam, publishExam, unpublishExam } from "@/lib/api/exams"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  CheckCircle2,
  Settings,
  Send,
  Hammer,
  Eye,
  ArrowLeft,
  Archive,
  FileText,
  Clock,
  Users,
  Hash,
} from "lucide-react"

function getExamTitle(exam: Exam, language: string): string {
  return (language === "ar" ? exam.titleAr : exam.titleEn) || exam.titleEn || "Untitled Exam"
}

function getExamStatus(exam: Exam): string {
  if (!exam.isActive) return "Archived"
  if (exam.isPublished) return "Published"
  return "Draft"
}

export default function ExamOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const { t, language } = useI18n()
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (examId) {
      fetchExam()
    }
  }, [examId])

  async function fetchExam() {
    try {
      setLoading(true)
      const data = await getExam(examId)
      setExam(data)
    } catch (error) {
      toast.error(language === "ar" ? "فشل في تحميل الاختبار" : "Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!exam) return
    try {
      setActionLoading(true)
      await publishExam(exam.id)
      toast.success(t("exams.publishSuccess") || "Exam published successfully")
      fetchExam()
    } catch (error) {
      toast.error(t("exams.publishError") || "Failed to publish exam")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleArchive() {
    if (!exam) return
    try {
      setActionLoading(true)
      await unpublishExam(exam.id)
      toast.success(t("exams.archiveSuccess") || "Exam archived successfully")
      fetchExam()
    } catch (error) {
      toast.error(t("exams.archiveError") || "Failed to archive exam")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">
          {language === "ar" ? "الاختبار غير موجود" : "Exam not found"}
        </p>
        <Button variant="outline" asChild>
          <Link href="/exams/list">
            <ArrowLeft className="h-4 w-4 me-2" />
            {language === "ar" ? "العودة للقائمة" : "Back to List"}
          </Link>
        </Button>
      </div>
    )
  }

  const status = getExamStatus(exam)
  const isDraft = status === "Draft"
  const isPublished = status === "Published"

  return (
    <div className="space-y-6 p-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800 dark:text-green-200">
                {language === "ar" ? "تم حفظ الاختبار بنجاح!" : "Exam Saved Successfully!"}
              </h1>
              <p className="text-green-600 dark:text-green-400">
                {language === "ar" 
                  ? "يمكنك الآن نشر الاختبار أو إجراء المزيد من التعديلات" 
                  : "You can now publish the exam or make further edits"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{getExamTitle(exam, language)}</CardTitle>
              <CardDescription className="mt-1">
                {language === "ar" ? "معرف الاختبار:" : "Exam ID:"} {exam.id}
              </CardDescription>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {language === "ar" ? "المدة:" : "Duration:"}
              </span>
              <span className="font-medium">{exam.durationMinutes || 0} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {language === "ar" ? "الأقسام:" : "Sections:"}
              </span>
              <span className="font-medium">{exam.sections?.length || exam.sectionsCount || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {language === "ar" ? "المحاولات:" : "Attempts:"}
              </span>
              <span className="font-medium">{exam.maxAttempts || "∞"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {language === "ar" ? "درجة النجاح:" : "Pass Score:"}
              </span>
              <span className="font-medium">{exam.passScore || 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "ar" ? "الإجراءات الرئيسية" : "Primary Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Go to Configuration */}
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/exams/${examId}/configuration`}>
                <Settings className="h-5 w-5" />
                <span>{language === "ar" ? "الإعدادات" : "Go to Configuration"}</span>
              </Link>
            </Button>

            {/* Publish Exam (if Draft) */}
            {isDraft && (
              <Button 
                className="h-auto py-4 flex-col gap-2"
                onClick={handlePublish}
                disabled={actionLoading}
              >
                <Send className="h-5 w-5" />
                <span>{language === "ar" ? "نشر الاختبار" : "Publish Exam"}</span>
              </Button>
            )}

            {/* Edit Builder */}
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href={`/exams/setup/${examId}?tab=builder`}>
                <Hammer className="h-5 w-5" />
                <span>{language === "ar" ? "تعديل البناء" : "Edit Builder"}</span>
              </Link>
            </Button>

            {/* Preview Exam */}
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" disabled>
              <Eye className="h-5 w-5" />
              <span>{language === "ar" ? "معاينة الاختبار" : "Preview Exam"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "ar" ? "إجراءات إضافية" : "Secondary Actions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Back to Exams List */}
            <Button variant="outline" asChild>
              <Link href="/exams/list">
                <ArrowLeft className="h-4 w-4 me-2" />
                {language === "ar" ? "العودة لقائمة الاختبارات" : "Back to Exams List"}
              </Link>
            </Button>

            {/* Archive Exam (only if Published) */}
            {isPublished && (
              <Button 
                variant="outline"
                onClick={handleArchive}
                disabled={actionLoading}
              >
                <Archive className="h-4 w-4 me-2" />
                {language === "ar" ? "أرشفة الاختبار" : "Archive Exam"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
