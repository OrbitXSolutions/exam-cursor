"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  Maximize2,
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
    titleEn: "Candidate Management & Walk-In",
    titleAr: "إدارة المرشحين والدخول المباشر",
    descriptionEn:
      "Manage candidate profiles, assign exams, handle walk-in registrations, and track candidate history.",
    descriptionAr:
      "إدارة ملفات المرشحين وتعيين الاختبارات ومعالجة تسجيلات الدخول المباشر وتتبع سجل المرشحين.",
    icon: UserCog,
    videoPath: "/tutorials/candidate-management-walkin.mp4",
  },
  {
    id: 7,
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
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({})
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({})

  const setLoading = useCallback((id: number, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleFullscreen = useCallback((id: number) => {
    const video = videoRefs.current[id]
    if (!video) return
    if (video.requestFullscreen) {
      video.requestFullscreen()
    }
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

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videoTutorials.map((video) => {
            const Icon = video.icon
            return (
              <Card key={video.id} className="overflow-hidden flex flex-col">
                {/* Video area */}
                <div className="relative bg-black/5 aspect-video group/video">
                  <video
                    ref={(el) => { videoRefs.current[video.id] = el }}
                    src={`/api/backend-files${video.videoPath}`}
                    controls
                    className="w-full h-full rounded-t-xl"
                    preload="metadata"
                    onLoadStart={() => setLoading(video.id, true)}
                    onCanPlay={() => setLoading(video.id, false)}
                    onError={(e) => {
                      setLoading(video.id, false)
                      const target = e.currentTarget
                      target.style.display = "none"
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = "flex"
                    }}
                  />
                  {/* Loading spinner */}
                  {loadingStates[video.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-xl pointer-events-none">
                      <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                  )}
                  {/* Fallback — shown only when video fails to load */}
                  <div
                    className="hidden absolute inset-0 flex-col items-center justify-center gap-3 text-muted-foreground bg-muted/30 rounded-t-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary/50" />
                    </div>
                    <p className="text-xs font-mono text-muted-foreground/60">{video.videoPath}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === "ar"
                        ? "ضع الفيديو في مجلد wwwroot/tutorials/"
                        : "Place video in wwwroot/tutorials/ folder"}
                    </p>
                  </div>
                  {/* Number badge */}
                  <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow pointer-events-none">
                    {video.id}
                  </span>
                  {/* Fullscreen button */}
                  <button
                    onClick={() => handleFullscreen(video.id)}
                    title={language === "ar" ? "ملء الشاشة" : "Fullscreen"}
                    className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover/video:opacity-100 transition-opacity hover:bg-black/70 focus:opacity-100 focus:outline-none"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>

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
    </ScrollArea>
  )
}
