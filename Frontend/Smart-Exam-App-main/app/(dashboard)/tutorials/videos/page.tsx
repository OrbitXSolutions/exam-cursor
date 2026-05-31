"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  PlayCircle,
  ChevronLeft,
  BookOpen,
  ClipboardList,
  Users,
  Monitor,
  BarChart3,
  UserCog,
  Settings,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRef, useCallback, useState } from "react"
import type React from "react"

interface VideoTutorial {
  id: number
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  icon: React.ElementType
  /** Path relative to backend storage, e.g. /tutorials/exam-creation.mp4
   *  Served via the /api/backend-files proxy at runtime. */
  videoPath: string
}

const videoTutorials: VideoTutorial[] = [
  {
    id: 1,
    titleEn: "Exam Creation",
    titleAr: "إنشاء الاختبار",
    descriptionEn:
      "Learn how to create a new exam from scratch — configure the title, duration, grading policy, and question bank sections.",
    descriptionAr:
      "تعلّم كيفية إنشاء اختبار جديد من الصفر — ضبط العنوان والمدة وسياسة التقييم وأقسام بنك الأسئلة.",
    icon: BookOpen,
    videoPath: "/tutorials/exam-creation.mp4",
  },
  {
    id: 2,
    titleEn: "Exam Configuration",
    titleAr: "إعداد الاختبار",
    descriptionEn:
      "Configure advanced exam settings including access policies, instructions, time limits, and proctoring rules.",
    descriptionAr:
      "ضبط إعدادات الاختبار المتقدمة بما في ذلك سياسات الوصول والتعليمات ,المدة الزمنية وقواعد المراقبة.",
    icon: ClipboardList,
    videoPath: "/tutorials/exam-configuration.mp4",
  },
  {
    id: 3,
    titleEn: "Assign Proctor & Candidates",
    titleAr: "تعيين المراقب والمرشحين",
    descriptionEn:
      "Step-by-step guide on assigning proctors and adding candidates to an exam — including walk-in and batch assignment.",
    descriptionAr:
      "دليل خطوة بخطوة لتعيين المراقبين وإضافة المرشحين إلى الاختبار — بما في ذلك الدخول المباشر والتعيين الجماعي.",
    icon: Users,
    videoPath: "/tutorials/assign-proctor-candidates.mp4",
  },
  {
    id: 4,
    titleEn: "Candidate Exam & Live Proctoring",
    titleAr: "اختبار المرشح والمراقبة المباشرة",
    descriptionEn:
      "See how candidates take an exam and how proctors monitor sessions in real time, including incident flagging and overrides.",
    descriptionAr:
      "شاهد كيف يؤدي المرشحون الاختبار وكيف يراقب المراقبون الجلسات في الوقت الفعلي، بما في ذلك الإبلاغ عن الحوادث والتجاوزات.",
    icon: Monitor,
    videoPath: "/tutorials/candidate-exam-proctoring.mp4",
  },
  {
    id: 5,
    titleEn: "Grading & Results",
    titleAr: "التصحيح والنتائج",
    descriptionEn:
      "Learn how to grade attempts, review auto-graded results, manage grading sessions, and export reports.",
    descriptionAr:
      "تعلّم كيفية تصحيح المحاولات ومراجعة النتائج التلقائية وإدارة جلسات التصحيح وتصدير التقارير.",
    icon: BarChart3,
    videoPath: "/tutorials/grading-results.mp4",
  },
  {
    id: 6,
    titleEn: "Walk-In Registration Management",
    titleAr: "إدارة تسجيل الحضور المباشر",
    descriptionEn:
      "Learn how to manage self-registration candidate data, create self-registration type exams, and configure detailed registration fields.",
    descriptionAr:
      "تعلّم كيفية إدارة بيانات المرشحين ذوي التسجيل الذاتي، وإنشاء اختبار من نوع التسجيل الذاتي، وضبط الحقول التفصيلية وإدارتها.",
    icon: UserCog,
    videoPath: "/tutorials/walkin-registration.mp4",
  },
  {
    id: 7,
    titleEn: "Candidate Management",
    titleAr: "إدارة المرشحين",
    descriptionEn:
      "Learn how to upload candidate data in bulk, export candidate records, and verify candidate identity before an exam.",
    descriptionAr:
      "تعلّم كيفية رفع بيانات المرشحين بشكل مجمّع، وتصدير سجلاتهم، والتحقق من هوية المرشح قبل الاختبار.",
    icon: UserCog,
    videoPath: "/tutorials/candidate-management.mp4",
  },
  {
    id: 8,
    titleEn: "Administration & Advanced Settings",
    titleAr: "الإدارة والإعدادات المتقدمة",
    descriptionEn:
      "Configure system-wide settings: user roles, departments, notification templates, audit logs, and licensing.",
    descriptionAr:
      "ضبط الإعدادات على مستوى النظام: أدوار المستخدمين والأقسام وقوالب الإشعارات وسجلات التدقيق والترخيص.",
    icon: Settings,
    videoPath: "/tutorials/administration-settings.mp4",
  },
]

export default function VideoTutorialsPage() {
  const { language, isRTL } = useI18n()
  const [activeVideo, setActiveVideo] = useState<VideoTutorial | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const openVideo = useCallback((video: VideoTutorial) => {
    setActiveVideo(video)
    setModalLoading(true)
  }, [])

  const closeVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ""
    }
    setActiveVideo(null)
    setModalLoading(false)
  }, [])

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRTL ? (
              <>
                <span>{language === "ar" ? "العودة إلى دليل المستخدم" : "Back to User Guide"}</span>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>{language === "ar" ? "العودة إلى دليل المستخدم" : "Back to User Guide"}</span>
              </>
            )}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <PlayCircle className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {language === "ar" ? "الدروس المرئية" : "Video Tutorials"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === "ar"
              ? "فيديوهات تعليمية احترافية تغطي كامل سير العمل في نظام SmartExam — من إنشاء الاختبار إلى النتائج والإدارة."
              : "Professional step-by-step walkthroughs covering the full SmartExam workflow — from exam creation to results and administration."}
          </p>
        </div>

        {/* Video Grid — thumbnail cards only, no video elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videoTutorials.map((video) => {
            const Icon = video.icon
            return (
              <Card key={video.id} className="overflow-hidden flex flex-col">
                {/* Thumbnail / placeholder — no video loaded here */}
                <button
                  onClick={() => openVideo(video)}
                  className="relative bg-muted aspect-video group/thumb w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={language === "ar" ? `تشغيل: ${video.titleAr}` : `Watch: ${video.titleEn}`}
                >
                  {/* Centred play icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 group-hover/thumb:bg-primary/20 transition-colors">
                      <Icon className="h-7 w-7 text-primary/60" />
                    </div>
                    <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-primary/80 group-hover/thumb:bg-primary transition-colors shadow-lg">
                      <PlayCircle className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  {/* Number badge */}
                  <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow pointer-events-none">
                    {video.id}
                  </span>
                </button>

                {/* Info */}
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1">
                    {language === "ar" ? video.titleAr : video.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language === "ar" ? video.descriptionAr : video.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Video modal — single video player, loaded only on demand */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => { if (!open) closeVideo() }}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle>
              {activeVideo
                ? (language === "ar" ? activeVideo.titleAr : activeVideo.titleEn)
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="relative bg-black aspect-video w-full">
            {modalLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
            )}
            {activeVideo && (
              <video
                key={activeVideo.id}
                ref={videoRef}
                src={`/api/backend-files${activeVideo.videoPath}`}
                controls
                autoPlay
                preload="none"
                className="w-full h-full"
                onCanPlay={() => setModalLoading(false)}
                onLoadStart={() => setModalLoading(true)}
                onError={() => setModalLoading(false)}
              />
            )}
          </div>

          {activeVideo && (
            <p className="px-5 py-3 text-sm text-muted-foreground">
              {language === "ar" ? activeVideo.descriptionAr : activeVideo.descriptionEn}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </ScrollArea>
  )
}
