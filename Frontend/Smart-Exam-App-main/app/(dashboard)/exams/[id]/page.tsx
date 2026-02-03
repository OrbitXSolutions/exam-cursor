"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getExam, getExamSections, getExamSchedules, publishExam, archiveExam } from "@/lib/api/exams"
import type { Exam, ExamSection, ExamSchedule } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  LayoutList,
  Calendar,
  Users,
  Clock,
  Target,
  Shield,
  FileText,
  Send,
  Archive,
  Plus,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ChevronRight,
  Sparkles,
  AlertCircle,
  PartyPopper,
} from "lucide-react"

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t, dir, language } = useI18n()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<ExamSection[]>([])
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishResultDialog, setPublishResultDialog] = useState<{ open: boolean; success: boolean; message: string }>({
    open: false,
    success: false,
    message: "",
  })
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    loadExamData()
  }, [id])

  async function loadExamData() {
    try {
      setLoading(true)
      console.log("[v0] Loading exam data for id:", id)
      const [examData, sectionsData, schedulesData] = await Promise.all([
        getExam(id),
        getExamSections(id),
        getExamSchedules(id),
      ])
      console.log("[v0] Exam data loaded:", examData)
      console.log("[v0] Sections loaded:", sectionsData)
      console.log("[v0] Schedules loaded:", schedulesData)
      setExam(examData)
      setSections(sectionsData)
      setSchedules(schedulesData)
    } catch (error) {
      console.log("[v0] Error loading exam data:", error)
      toast.error("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  function openPublishDialog() {
    setPublishDialogOpen(true)
  }

  async function handlePublish() {
    if (!exam) return

    // Validation: PassScore must not exceed TotalPoints
    if (exam.passScore > totalPoints) {
      toast.error(t("exams.passScoreExceedsTotalPoints", { passScore: exam.passScore, totalPoints }))
      setPublishResultDialog({
        open: true,
        success: false,
        message: t("exams.passScoreExceedsTotalPoints", { passScore: exam.passScore, totalPoints }),
      })
      setPublishDialogOpen(false)
      return
    }

    setPublishing(true)
    setPublishDialogOpen(false)
    try {
      await publishExam(exam.id)
      toast.success(t("exams.publishSuccess"))
      setPublishResultDialog({
        open: true,
        success: true,
        message: t("exams.publishSuccessDesc"),
      })
      loadExamData()
    } catch (error) {
      console.log("[v0] Publish error:", error)
      toast.error(t("exams.publishError"))
      setPublishResultDialog({
        open: true,
        success: false,
        message: t("exams.publishErrorDesc"),
      })
    } finally {
      setPublishing(false)
    }
  }

  async function handleArchive() {
    if (!exam) return
    try {
      await archiveExam(exam.id)
      toast.success("Exam archived successfully")
      loadExamData()
    } catch (error) {
      toast.error("Failed to archive exam")
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    )
  }

  const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0)
  const totalPoints = sections.reduce(
    (acc, s) => acc + (s.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0),
    0,
  )

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{exam.titleEn || exam.title}</h1>
              <StatusBadge status={exam.isPublished ? "Published" : exam.isActive ? "Draft" : "Inactive"} />
            </div>
            {exam.code && <p className="text-muted-foreground mt-1">{exam.code}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!exam.isPublished && exam.isActive && (
            <Button onClick={openPublishDialog} disabled={publishing}>
              <Send className="h-4 w-4 me-2" />
              {publishing ? t("common.loading") : t("exams.publish")}
            </Button>
          )}
          {exam.isPublished && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 me-2" />
              {t("exams.archive")}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/exams/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {t("common.edit")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/exams/${id}/configuration`)}
          >
            <Shield className="h-4 w-4 me-2" />
            {t("exams.configuration")}
          </Button>
          <Button asChild>
            <Link href={`/exams/${id}/builder`}>
              <LayoutList className="h-4 w-4 me-2" />
              {t("exams.builder")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions / Next Steps */}
      {!exam.isPublished && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{t("exams.quickActions")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("exams.quickActionsDesc")}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Link
                    href={`/exams/${id}/builder`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${sections.length > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {sections.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-medium">1</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t("exams.addSectionsTopics")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sections.length > 0 ? `${sections.length} ${t("exams.sections").toLowerCase()}` : t("exams.notStarted")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <Link
                    href={`/exams/${id}/builder`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${totalQuestions > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {totalQuestions > 0 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-medium">2</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t("exams.addQuestions")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {totalQuestions > 0 ? `${totalQuestions} ${t("exams.questions").toLowerCase()}` : t("exams.notStarted")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <Link
                    href={`/exams/${id}/schedules/create`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${schedules.length > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {schedules.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-sm font-medium">3</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t("exams.scheduleExam")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {schedules.length > 0 ? `${schedules.length} ${t("exams.schedules").toLowerCase()}` : t("exams.notScheduled")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <button
                    onClick={openPublishDialog}
                    disabled={totalQuestions === 0 || publishing}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed text-start"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <span className="text-sm font-medium">4</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t("exams.publishExam")}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {totalQuestions === 0 ? t("exams.addQuestionsFirst") : t("exams.readyToPublish")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.totalQuestions")}</p>
              <p className="text-2xl font-bold">{totalQuestions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.totalPoints")}</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.duration")}</p>
              <p className="text-2xl font-bold">{exam.durationMinutes} min</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.passingScore")}</p>
              <p className="text-2xl font-bold">{exam.passScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
          <TabsTrigger value="sections">{t("exams.sections")}</TabsTrigger>
          <TabsTrigger value="schedules">{t("exams.schedules")}</TabsTrigger>
          <TabsTrigger value="settings">{t("common.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {language === "ar"
                    ? (exam.descriptionAr || exam.descriptionEn || t("exams.noDescription"))
                    : (exam.descriptionEn || t("exams.noDescription"))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.examInstructions")}</CardTitle>
              </CardHeader>
              <CardContent>
                {exam.instructions && exam.instructions.length > 0 ? (
                  <ul className="space-y-2">
                    {exam.instructions.map((instruction, idx) => (
                      <li key={instruction.id || idx} className="text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-medium">{idx + 1}.</span>
                        <span>{language === "ar" ? (instruction.contentAr || instruction.contentEn) : instruction.contentEn}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">{t("exams.noInstructions")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("exams.sections")}</h2>
            <Button asChild size="sm">
              <Link href={`/exams/${id}/builder`}>
                <Plus className="h-4 w-4 me-2" />
                {t("exams.addSection")}
              </Link>
            </Button>
          </div>
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LayoutList className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{t("exams.noSections")}</p>
                <Button className="mt-4" asChild>
                  <Link href={`/exams/${id}/builder`}>{t("exams.addSection")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <Card key={section.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">
                          {language === "ar"
                            ? (section.titleAr || section.titleEn || section.title)
                            : (section.titleEn || section.title)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {section.questions?.length || 0} {t("common.questions").toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/exams/${id}/builder`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("exams.schedules")}</h2>
            <Button asChild size="sm">
              <Link href={`/exams/${id}/schedules/create`}>
                <Plus className="h-4 w-4 me-2" />
                {t("exams.addSchedule")}
              </Link>
            </Button>
          </div>
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{t("exams.noSchedules")}</p>
                <Button className="mt-4" asChild>
                  <Link href={`/exams/${id}/schedules/create`}>{t("exams.addSchedule")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(schedule.startTime).toLocaleString()} -{" "}
                          {new Date(schedule.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{schedule.candidateCount}</span>
                      </div>
                      <StatusBadge status={schedule.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => router.push(`/exams/${id}/configuration`)}>
              <Shield className="h-4 w-4 me-2" />
              {t("exams.configuration")}
            </Button>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("exams.timingSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.duration")}</span>
                  <span className="font-medium">{exam.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.passingScore")}</span>
                  <span className="font-medium">{exam.passScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.maxAttempts")}</span>
                  <span className="font-medium">{exam.maxAttempts || 1}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("exams.securitySettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.requireProctoring")}</span>
                  {exam.requireProctoring ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.requireIdVerification")}</span>
                  {exam.requireIdVerification ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.preventCopyPaste")}</span>
                  {exam.preventCopyPaste ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.shuffleQuestions")}</span>
                  {exam.shuffleQuestions ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-start">
            <div className="mx-auto sm:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">{t("exams.publishConfirmTitle")}</DialogTitle>
            <DialogDescription className="text-base">
              {t("exams.publishConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/50 p-4 mt-2">
            <p className="font-medium">{exam?.titleEn || exam?.title}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {totalQuestions} {t("exams.questions").toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {totalPoints} {t("exams.points").toLowerCase()}
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              {t("exams.publishCancel")}
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? t("common.loading") : t("exams.publishConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Result Dialog */}
      <Dialog open={publishResultDialog.open} onOpenChange={(open) => setPublishResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${publishResultDialog.success ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
              {publishResultDialog.success ? (
                <PartyPopper className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {publishResultDialog.success ? t("exams.publishSuccessTitle") : t("exams.publishErrorTitle")}
            </DialogTitle>
            <DialogDescription className="text-base">
              {publishResultDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => setPublishResultDialog(prev => ({ ...prev, open: false }))}
              className="w-full"
              variant={publishResultDialog.success ? "default" : "outline"}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
