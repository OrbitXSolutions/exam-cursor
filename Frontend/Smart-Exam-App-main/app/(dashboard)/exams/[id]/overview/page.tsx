"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import type { Exam } from "@/lib/types"
import { getExam, publishExam, unpublishExam } from "@/lib/api/exams"
import { queueExamEmails } from "@/lib/api/notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  CheckCircle2,
  Settings,
  Send,
  Hammer,
  ArrowLeft,
  Archive,
  FileText,
  Clock,
  Users,
  Hash,
  PartyPopper,
  AlertCircle,
  Info,
  Share2,
  Mail,
  Loader2,
} from "lucide-react"
import { ExamShareDialog } from "@/components/exam/exam-share-dialog"

function getExamTitle(exam: Exam, language: string): string {
  return (language === "ar" ? exam.titleAr : exam.titleEn) || exam.titleEn || (language === "ar" ? "اختبار بدون عنوان" : "Untitled Exam")
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
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

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
      setEmailSent(false)
      setPublishDialogOpen(true)
      fetchExam()
    } catch (error: any) {
      const msg = error?.message || (language === "ar" ? "فشل في نشر الاختبار" : "Failed to publish exam")
      setErrorMessage(msg)
      setErrorDialogOpen(true)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSendEmailNow() {
    if (!exam) return
    setSendingEmail(true)
    try {
      await queueExamEmails(exam.id)
      setEmailSent(true)
      toast.success(language === "ar" ? "تم جدولة إرسال البريد الإلكتروني" : "Email notifications queued successfully")
    } catch {
      toast.error(language === "ar" ? "فشل إرسال البريد الإلكتروني" : "Failed to queue email notifications")
    } finally {
      setSendingEmail(false)
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
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-6">
      <Card className="w-full max-w-2xl">
        {/* Success Header */}
        <div className="rounded-t-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b border-green-200 dark:border-green-900 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-800 dark:text-green-200">
                {language === "ar" ? "تم حفظ الاختبار بنجاح!" : "Exam Saved Successfully!"}
              </h1>
              <p className="text-sm text-green-600 dark:text-green-400">
                {language === "ar" 
                  ? "يمكنك الآن نشر الاختبار أو إجراء المزيد من التعديلات" 
                  : "You can now publish the exam or make further edits"}
              </p>
            </div>
          </div>
        </div>

        {/* Exam Info */}
        <CardContent className="pt-6 pb-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{getExamTitle(exam, language)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {language === "ar" ? "معرف الاختبار:" : "Exam ID:"} {exam.id}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b">
            <div className="flex flex-col items-center gap-1 text-center">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "المدة" : "Duration"}
              </span>
              <span className="text-sm font-semibold">{exam.durationMinutes || 0} {language === "ar" ? "دقيقة" : "min"}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "الأقسام" : "Sections"}
              </span>
              <span className="text-sm font-semibold">{exam.sections?.length || exam.sectionsCount || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "المحاولات" : "Max Attempts"}
              </span>
              <span className="text-sm font-semibold">{exam.maxAttempts || "∞"}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {language === "ar" ? "درجة النجاح" : "Pass Score"}
              </span>
              <span className="text-sm font-semibold">{exam.passScore || 0} {language === "ar" ? "نقطة" : "pts"}</span>
            </div>
          </div>
        </CardContent>

        {/* Actions Footer */}
        <CardContent className="pt-4 pb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/exams/list">
                <ArrowLeft className="h-4 w-4 me-2" />
                {language === "ar" ? "العودة للقائمة" : "Back to Exams List"}
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/exams/${examId}/configuration`}>
                <Settings className="h-4 w-4 me-2" />
                {language === "ar" ? "الإعدادات" : "Configuration"}
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/exams/setup/${examId}?tab=builder`}>
                <Hammer className="h-4 w-4 me-2" />
                {language === "ar" ? "تعديل البناء" : "Edit Builder"}
              </Link>
            </Button>

            {isDraft && (
              <Button
                onClick={handlePublish}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <LoadingSpinner size="sm" className="me-2" />
                ) : (
                  <Send className="h-4 w-4 me-2" />
                )}
                {language === "ar" ? "نشر الاختبار" : "Publish Exam"}
              </Button>
            )}

            {isPublished && (
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4 me-2" />
                {language === "ar" ? "مشاركة" : "Share"}
              </Button>
            )}

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

      {/* Publish Celebration Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 mb-4">
              <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {language === "ar" ? "تم نشر الاختبار!" : "Exam Published!"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar"
                ? "الاختبار متاح الآن للمرشحين لأدائه."
                : "The exam is now available for candidates to take."}
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-start mb-6 w-full">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {exam?.accessPolicyStatus === "Assigned"
                  ? (language === "ar"
                    ? "سياسة الوصول: مُعيّن — يمكن فقط للمرشحين المعينين الوصول إلى هذا الاختبار."
                    : "Access policy: Assigned — only assigned candidates can access this exam.")
                  : (language === "ar"
                    ? "سياسة الوصول الافتراضية: عام — يمكن لجميع المرشحين رؤية هذا الاختبار. يمكنك تغيير هذا من الإعدادات المتقدمة ← سياسة الوصول."
                    : "Default access policy: Public — all candidates can see this exam. You can change this in Advanced Configuration → Access Policy.")}
              </p>
            </div>

            {/* Send Email NOW button */}
            {exam && !emailSent && (
              <Button
                className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSendEmailNow}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 me-2" />
                )}
                {language === "ar" ? "إرسال البريد الإلكتروني الآن" : "Send Email NOW"}
              </Button>
            )}

            {emailSent && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-start mb-2 w-full">
                <Mail className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-300">
                  {language === "ar"
                    ? "تمت جدولة إرسال البريد الإلكتروني بنجاح! ستتم معالجة الرسائل في الخلفية."
                    : "Email notifications queued successfully! Messages will be processed in background."}
                </p>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => {
                  setPublishDialogOpen(false)
                  setShareDialogOpen(true)
                }}
              >
                <Share2 className="h-4 w-4 me-2" />
                {language === "ar" ? "مشاركة عبر رابط / QR" : "Share via URL / QR"}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setPublishDialogOpen(false)}
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {language === "ar" ? "فشل النشر" : "Failed to Publish"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base whitespace-pre-line">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              {t("common.ok") || "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      {exam && (
        <ExamShareDialog
          examId={exam.id}
          examTitle={getExamTitle(exam, language)}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}
    </div>
  )
}
