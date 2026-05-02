"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import type { Exam, ExamAccessPolicy } from "@/lib/types"
import { getExam } from "@/lib/api/exams"
import { queueExamEmails } from "@/lib/api/notifications"
import { getExamProctors, type ExamProctorPageDto } from "@/lib/api/exam-proctor"
import { ExamShareDialog } from "@/components/exam/exam-share-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  CheckCircle2,
  ArrowLeft,
  List,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Globe,
  Lock,
  Users,
  Share2,
  Bell,
  Copy,
  ExternalLink,
  AlertTriangle,
  Info,
  Loader2,
  Eye,
  KeyRound,
  Send,
  ChevronRight,
  PartyPopper,
  Rocket,
} from "lucide-react"

// ── Helpers ────────────────────────────────────────────────────

function getExamTitle(exam: Exam, language: string): string {
  return (language === "ar" ? exam.titleAr : exam.titleEn) || exam.titleEn || ""
}

type AccessMode = "public" | "restricted" | "walkin" | "accesscode"

function resolveAccessMode(policy: ExamAccessPolicy | null | undefined): AccessMode {
  if (!policy) return "public"
  if (policy.isWalkIn) return "walkin"
  if (policy.restrictToAssignedCandidates) return "restricted"
  if (policy.accessCode) return "accesscode"
  return "public"
}

// ── Main Component ─────────────────────────────────────────────

export default function ExamPublishedPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { language } = useI18n()
  const isAr = language === "ar"

  const [exam, setExam] = useState<Exam | null>(null)
  const [proctorData, setProctorData] = useState<ExamProctorPageDto | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  // ── Load data on mount ────────────────────────────────────────
  useEffect(() => {
    let examData: Exam | null = null

    // 1 — Try sessionStorage first (zero API call for exam)
    try {
      const raw = sessionStorage.getItem("publishedExam")
      if (raw) {
        examData = JSON.parse(raw) as Exam
        sessionStorage.removeItem("publishedExam")
        setExam(examData)
      }
    } catch {
      // ignore parse errors
    }

    async function loadRemoteData(examId: number) {
      // proctor count only — share link is handled by ExamShareDialog
      const proctorRes = await getExamProctors(examId).catch(() => null)
      if (proctorRes) setProctorData(proctorRes)
      setLoadingPage(false)
    }

    if (examData) {
      loadRemoteData(examData.id)
    } else {
      // Fallback: fetch exam then load remote data
      getExam(id)
        .then((e) => {
          setExam(e)
          return loadRemoteData(e.id)
        })
        .catch(() => setLoadingPage(false))
    }
  }, [id])

  // ── Actions ────────────────────────────────────────────────────

  const handleSendEmail = useCallback(async () => {
    if (!exam) return
    setEmailSending(true)
    try {
      await queueExamEmails(exam.id)
      setEmailSent(true)
      toast.success(isAr ? "تمت جدولة الإرسال بنجاح" : "Email notifications queued")
    } catch {
      toast.error(isAr ? "فشل إرسال البريد" : "Failed to queue emails")
    } finally {
      setEmailSending(false)
    }
  }, [exam, isAr])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loadingPage || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const accessMode = resolveAccessMode(exam.accessPolicy)
  const assignedProctorCount = proctorData?.assignedProctors?.length ?? 0
  const proctorWarning = exam.requireProctoring && assignedProctorCount === 0

  // ── Access mode meta ───────────────────────────────────────────
  const accessMeta = {
    public: {
      icon: Globe,
      label: isAr ? "عام" : "Public",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      description: isAr
        ? "جميع المرشحين المسجلين في النظام يمكنهم رؤية هذا الاختبار وأدائه."
        : "All registered candidates in the system can see and take this exam.",
    },
    restricted: {
      icon: Lock,
      label: isAr ? "مقيّد" : "Restricted",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      description: isAr
        ? "فقط المرشحون المعيّنون يمكنهم الوصول. يُرسل البريد بعد التعيين."
        : "Only assigned candidates can access. Email sends after assignment.",
    },
    walkin: {
      icon: Users,
      label: isAr ? "حضور مباشر" : "Walk-In",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      description: isAr
        ? "لا توجد قائمة مرشحين — يصل المرشحون عبر رابط المشاركة مباشرةً. لا يُرسل بريد إلكتروني."
        : "No candidate list — candidates access via share link directly. No emails sent.",
    },
    accesscode: {
      icon: KeyRound,
      label: isAr ? "رمز وصول" : "Access Code",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800",
      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      description: isAr
        ? "المرشحون يحتاجون رمز الوصول للدخول. شارك الرمز مع المرشحين."
        : "Candidates need the access code to enter. Share the code with candidates.",
    },
  }

  const meta = accessMeta[accessMode]
  const AccessIcon = meta.icon

  return (
    <div className="flex-1 space-y-0 min-h-screen bg-background">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900">
        {/* Decorative circles */}
        <div className="absolute -top-16 -inset-e-16 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-10 -inset-s-10 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative px-6 py-10">
          <div className="max-w-4xl mx-auto">
            {/* Back nav */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => router.push("/exams/list")}
              >
                <ArrowLeft className="h-4 w-4 me-1.5" />
                {isAr ? "قائمة الاختبارات" : "Back to Exams"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Success icon */}
              <div className="shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
                <PartyPopper className="h-8 w-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <span className="text-emerald-100 text-sm font-medium">
                    {isAr ? "تم النشر بنجاح" : "Published Successfully"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {getExamTitle(exam, language)}
                </h1>
                <p className="text-emerald-100 mt-1 text-sm">
                  {isAr
                    ? "الاختبار متاح الآن — راجع الخطوات التالية أدناه"
                    : "The exam is live — review the next steps below"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow"
                  asChild
                >
                  <Link href="/exams/list">
                    <List className="h-4 w-4 me-1.5" />
                    {isAr ? "كل الاختبارات" : "All Exams"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Row 1: Proctor + Access Policy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* ── Card 1: Proctor ────────────────────────────────── */}
          <Card className={`relative overflow-hidden transition-shadow hover:shadow-md flex flex-col ${proctorWarning ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""}`}>
            {proctorWarning && (
              <div className="absolute top-0 inset-s-0 inset-e-0 h-1 bg-linear-to-r from-amber-400 to-orange-400" />
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    {proctorWarning
                      ? <ShieldAlert className="h-5 w-5 text-primary" />
                      : exam.requireProctoring
                        ? <ShieldCheck className="h-5 w-5 text-primary" />
                        : <UserCheck className="h-5 w-5 text-primary" />
                    }
                  </div>
                  <CardTitle className="text-base">
                    {isAr ? "المراقبة" : "Proctoring"}
                  </CardTitle>
                </div>
                {exam.requireProctoring ? (
                  <Badge className={proctorWarning
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0"
                  }>
                    {isAr ? "مطلوبة" : "Required"}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {isAr ? "غير مطلوبة" : "Not Required"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.requireProctoring ? (
                <>
                  {proctorWarning ? (
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? <>هذا الاختبار <strong className="text-foreground">يتطلب مراقبة</strong> ولكن <strong className="text-amber-600 dark:text-amber-400">لم يُعيَّن أي مراقب بعد.</strong> المرشحون لن يتمكنوا من بدء الاختبار دون مراقب.<br /><span className="font-semibold text-foreground">يرجى تعيين مراقب للاختبار.</span></>
                        : <>This exam <strong className="text-foreground">requires proctoring</strong> but <strong className="text-amber-600 dark:text-amber-400">no proctor has been assigned yet.</strong> Candidates won&apos;t be able to start without one.<br /><span className="font-semibold text-foreground">Please assign a proctor to the exam.</span></>
                      }
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {isAr
                        ? <><strong className="text-foreground">{assignedProctorCount} مراقب(ون)</strong> معيَّن(ون) لهذا الاختبار. يمكنك إدارة المراقبين وإضافة المزيد. </>
                        : <><strong className="text-foreground">{assignedProctorCount} proctor(s)</strong> assigned to this exam. You can manage or add more from the proctor assignment page. </>
                      }
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? <>المراقبة البشرية <strong className="text-foreground">غير مفعَّلة</strong> لهذا الاختبار. يمكن تفعيلها من إعدادات الاختبار متى أردت. </>
                    : <>Human proctoring is <strong className="text-foreground">not enabled</strong> for this exam. You can turn it on from exam settings if needed. </>
                  }
                </p>
              )}

              <Button
                variant={proctorWarning ? "default" : "outline"}
                size="sm"
                className={`w-full ${proctorWarning ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                asChild
              >
                <Link href={`/proctor/assign?examId=${exam.id}`}>
                  <UserCheck className="h-4 w-4 me-1.5" />
                  {proctorWarning
                    ? (isAr ? "عيّن مراقباً الآن" : "Assign Proctor Now")
                    : (isAr ? "إدارة المراقبين" : "Manage Proctors")}
                  <ChevronRight className="h-3.5 w-3.5 ms-auto opacity-60" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* ── Card 2: Access Policy ──────────────────────────── */}
          <Card className="overflow-hidden transition-shadow hover:shadow-md flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <AccessIcon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">
                    {isAr ? "سياسة الوصول" : "Access Policy"}
                  </CardTitle>
                </div>
                <Badge className={`${meta.badge} border-0`}>
                  {meta.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-1">
              <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                {accessMode === "public" && (
                  isAr
                    ? <>سياسة الوصول: <strong className="text-foreground">عام</strong>. جميع المرشحين المسجلين يمكنهم رؤية هذا الاختبار وأداؤه دون أي قيود. </>                    
                    : <>Access policy: <strong className="text-foreground">Public</strong>. All registered candidates can see and take this exam with no restrictions. </>
                )}
                {accessMode === "restricted" && (
                  isAr
                    ? <>سياسة الوصول: <strong className="text-foreground">مقيَّد</strong>.<br />فقط <strong className="text-foreground">المرشحون المعيَّنون</strong> صراحةً يمكنهم الوصول.<br /><span className="font-semibold text-foreground">يرجى تعيين المرشحين للاختبار.</span></>
                    : <>Access policy: <strong className="text-foreground">Restricted</strong>.<br />Only <strong className="text-foreground">explicitly assigned candidates</strong> can access.<br /><span className="font-semibold text-foreground">Please assign candidates to the exam.</span></>
                )}
                {accessMode === "walkin" && (
                  isAr
                    ? <>سياسة الوصول: <strong className="text-foreground">حضور مباشر</strong>. لا توجد قائمة مرشحين محددة — يصل المرشحون عبر <strong className="text-foreground">رابط المشاركة</strong> مباشرةً. </>                    
                    : <>Access policy: <strong className="text-foreground">Walk-In</strong>. No fixed candidate list — anyone with the <strong className="text-foreground">share link</strong> can access the exam directly. </>
                )}
                {accessMode === "accesscode" && (
                  isAr
                    ? <>سياسة الوصول: <strong className="text-foreground">رمز وصول</strong>. يحتاج المرشحون إدخال الرمز للدخول. تأكد من مشاركة <strong className="text-foreground">الرابط والرمز</strong> مع المرشحين. </>                    
                    : <>Access policy: <strong className="text-foreground">Access Code</strong>. Candidates must enter the code to access the exam. Make sure to share both the <strong className="text-foreground">link and the code</strong>. </>
                )}
              </p>

              {accessMode === "accesscode" && exam.accessPolicy?.accessCode && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border">
                  <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  <code className="flex-1 text-sm font-mono font-semibold tracking-widest">
                    {exam.accessPolicy.accessCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => copyCode(exam.accessPolicy!.accessCode!)}
                  >
                    {codeCopied
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : <Copy className="h-3.5 w-3.5" />
                    }
                  </Button>
                </div>
              )}
              </div>

              {accessMode === "restricted" ? (
                <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
                  <Link href={`/candidates/assign-to-exam?examId=${exam.id}`}>
                    <Users className="h-4 w-4 me-1.5" />
                    {isAr ? "تعيين مرشحين" : "Assign Candidates"}
                    <ChevronRight className="h-3.5 w-3.5 ms-auto opacity-60" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
                  <Link href={`/exams/${exam.id}/configuration`}>
                    <Lock className="h-4 w-4 me-1.5" />
                    {isAr ? "تعديل سياسة الوصول" : "Edit Access Policy"}
                    <ChevronRight className="h-3.5 w-3.5 ms-auto opacity-60" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Email + Share */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* ── Card 3: Email Notifications ───────────────────── */}
          <Card className="overflow-hidden transition-shadow hover:shadow-md flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">
                  {isAr ? "إشعارات البريد الإلكتروني" : "Email Notifications"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-1">
              <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {accessMode === "public" && (
                  isAr
                    ? <>عند النشر، <strong className="text-foreground">تم جدولة رسائل بريدية تلقائياً</strong> لجميع المرشحين. يمكنك إعادة الإرسال يدوياً إذا لزم الأمر. </>
                    : <>On publish, <strong className="text-foreground">invitation emails were automatically queued</strong> to all registered candidates. You can resend manually if needed. </>
                )}
                {accessMode === "restricted" && (
                  isAr
                    ? <>بريد الإشعار <strong className="text-foreground">يُرسَل تلقائياً</strong> لكل مرشح فور تعيينه. لا حاجة لأي إجراء يدوي. </>
                    : <>Invitation emails are <strong className="text-foreground">sent automatically</strong> to each candidate upon assignment. No manual action needed. </>
                )}
                {accessMode === "walkin" && (
                  isAr
                    ? <>وضع حضور مباشر: <strong className="text-foreground">لا تُرسَل رسائل بريدية.</strong> شارك رابط الاختبار مع المرشحين مباشرةً. </>
                    : <>Walk-In mode: <strong className="text-foreground">no emails are sent.</strong> Share the exam link directly with candidates instead. </>
                )}
                {accessMode === "accesscode" && (
                  isAr
                    ? <>لا تُرسَل رسائل تلقائية. شارك <strong className="text-foreground">الرابط ورمز الوصول</strong> مع المرشحين يدوياً. </>
                    : <>No automatic emails are sent. Share the <strong className="text-foreground">link and access code</strong> with candidates manually. </>
                )}
                </p>
              </div>

              <div className="mt-auto space-y-2">
              {(accessMode === "public" || accessMode === "accesscode") && (
                <>
                  {emailSent ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      {isAr ? "✓ تمت جدولة الإرسال بنجاح." : "✓ Emails queued successfully."}
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={handleSendEmail}
                      disabled={emailSending}
                    >
                      {emailSending
                        ? <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
                        : <Send className="h-4 w-4 me-1.5" />
                      }
                      {isAr ? "إرسال البريد الآن" : "Send Emails Now"}
                    </Button>
                  )}
                </>
              )}
              <Separator />
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/notifications/logs">
                  <Bell className="h-4 w-4 me-1.5" />
                  {isAr ? "عرض سجل الإشعارات" : "View Notification Logs"}
                  <ExternalLink className="h-3.5 w-3.5 ms-auto opacity-50" />
                </Link>
              </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 4: Share Exam ─────────────────────────────── */}
          <Card className="overflow-hidden transition-shadow hover:shadow-md flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">
                  {isAr ? "مشاركة الاختبار" : "Share Exam"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col flex-1">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? <>أنشئ <strong className="text-foreground">رابط مشاركة</strong> و<strong className="text-foreground"> QR Code</strong> لتوزيع هذا الاختبار على المرشحين بسهولة. </>
                    : <>Generate a <strong className="text-foreground">share link</strong> and <strong className="text-foreground">QR code</strong> to easily distribute this exam to candidates. </>
                  }
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-auto" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 me-1.5" />
                {isAr ? "فتح نافذة المشاركة" : "Open Share & QR"}
                <ChevronRight className="h-3.5 w-3.5 ms-auto opacity-60" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Quick Actions ────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {isAr ? "إجراءات سريعة" : "Quick Actions"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/exams/${exam.id}/overview`}>
                  <Eye className="h-4 w-4 me-2" />
                  {isAr ? "نظرة عامة" : "Overview"}
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href={`/exams/${exam.id}/configuration`}>
                  <Lock className="h-4 w-4 me-2" />
                  {isAr ? "الإعدادات" : "Configuration"}
                </Link>
              </Button>
              <Button
                variant={proctorWarning ? "default" : "outline"}
                className={`justify-start ${proctorWarning ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                asChild
              >
                <Link href={`/proctor/assign?examId=${exam.id}`}>
                  <UserCheck className="h-4 w-4 me-2" />
                  {isAr ? "تعيين مراقب" : "Assign Proctor"}
                </Link>
              </Button>
              {accessMode === "restricted" && (
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/candidates/assign-to-exam?examId=${exam.id}`}>
                    <Users className="h-4 w-4 me-2" />
                    {isAr ? "تعيين مرشحين" : "Assign Candidates"}
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="justify-start" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 me-2" />
                {isAr ? "مشاركة & QR" : "Share & QR"}
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link href="/notifications/logs">
                  <Bell className="h-4 w-4 me-2" />
                  {isAr ? "سجل الإشعارات" : "Notification Logs"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Share Dialog ──────────────────────────────────────────── */}
      <ExamShareDialog
        examId={exam.id}
        examTitle={getExamTitle(exam, language)}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </div>
  )
}
