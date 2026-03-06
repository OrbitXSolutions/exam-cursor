"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getNotificationTemplates,
  updateNotificationTemplate,
  type NotificationTemplateDto,
  type UpdateNotificationTemplateDto,
} from "@/lib/api/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { FileText, Save, Loader2, Info } from "lucide-react"

const EVENT_TYPE_LABELS: Record<number, { en: string; ar: string }> = {
  1: { en: "Exam Published", ar: "نشر الاختبار" },
  2: { en: "Result Published", ar: "نشر النتائج" },
  3: { en: "Exam Expired", ar: "انتهاء الاختبار" },
}

const PLACEHOLDERS = [
  { key: "{{CandidateName}}", en: "Candidate's full name", ar: "اسم المرشح" },
  { key: "{{Username}}", en: "Login username/email", ar: "اسم المستخدم" },
  { key: "{{Password}}", en: "Login password", ar: "كلمة المرور" },
  { key: "{{ExamTitle}}", en: "Exam title", ar: "عنوان الاختبار" },
  { key: "{{ExamStartDate}}", en: "Exam start date", ar: "تاريخ بداية الاختبار" },
  { key: "{{ExamEndDate}}", en: "Exam end date", ar: "تاريخ نهاية الاختبار" },
  { key: "{{ExamDuration}}", en: "Exam duration in minutes", ar: "مدة الاختبار بالدقائق" },
  { key: "{{LoginUrl}}", en: "Login page URL", ar: "رابط صفحة الدخول" },
  { key: "{{BrandName}}", en: "Organization name", ar: "اسم المنظمة" },
  { key: "{{SupportEmail}}", en: "Support email", ar: "بريد الدعم" },
]

export default function NotificationTemplatesPage() {
  const { language } = useI18n()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<NotificationTemplateDto[]>([])
  const [savingId, setSavingId] = useState<number | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const data = await getNotificationTemplates()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      toast.error(language === "ar" ? "فشل تحميل القوالب" : "Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(template: NotificationTemplateDto) {
    setSavingId(template.eventType)
    try {
      const dto: UpdateNotificationTemplateDto = {
        subjectEn: template.subjectEn,
        subjectAr: template.subjectAr,
        bodyEn: template.bodyEn,
        bodyAr: template.bodyAr,
        isActive: template.isActive,
      }
      await updateNotificationTemplate(template.eventType, dto)
      toast.success(language === "ar" ? "تم حفظ القالب بنجاح" : "Template saved successfully")
    } catch {
      toast.error(language === "ar" ? "فشل حفظ القالب" : "Failed to save template")
    } finally {
      setSavingId(null)
    }
  }

  function updateTemplate(eventType: number, changes: Partial<NotificationTemplateDto>) {
    setTemplates((prev) =>
      prev.map((t) => (t.eventType === eventType ? { ...t, ...changes } : t))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {language === "ar" ? "قوالب الإشعارات" : "Notification Templates"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {language === "ar"
            ? "تخصيص رسائل البريد الإلكتروني والرسائل القصيرة لكل حدث"
            : "Customize email and SMS messages for each event type"}
        </p>
      </div>

      {/* Available Placeholders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            {language === "ar" ? "المتغيرات المتاحة" : "Available Placeholders"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PLACEHOLDERS.map((p) => (
              <Badge key={p.key} variant="secondary" className="font-mono text-xs cursor-help" title={language === "ar" ? p.ar : p.en}>
                {p.key}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Cards */}
      {templates.map((template) => {
        const labels = EVENT_TYPE_LABELS[template.eventType] ?? { en: template.eventName, ar: template.eventName }
        const isSaving = savingId === template.eventType

        return (
          <Card key={template.eventType}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>{language === "ar" ? labels.ar : labels.en}</CardTitle>
                    <CardDescription className="mt-0.5">
                      {language === "ar" ? "تخصيص محتوى الإشعار لهذا الحدث" : "Customize notification content for this event"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">{language === "ar" ? "مفعّل" : "Active"}</Label>
                    <Switch
                      checked={template.isActive}
                      onCheckedChange={(v) => updateTemplate(template.eventType, { isActive: v })}
                    />
                  </div>
                  <Button onClick={() => handleSave(template)} disabled={isSaving} size="sm">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                    ) : (
                      <Save className="h-4 w-4 me-2" />
                    )}
                    {language === "ar" ? "حفظ" : "Save"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* English Fields */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">English</h4>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "عنوان الرسالة (إنجليزي)" : "Subject (English)"}</Label>
                  <Input
                    value={template.subjectEn}
                    onChange={(e) => updateTemplate(template.eventType, { subjectEn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "نص الرسالة (إنجليزي)" : "Body (English)"}</Label>
                  <Textarea
                    rows={6}
                    value={template.bodyEn}
                    onChange={(e) => updateTemplate(template.eventType, { bodyEn: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Arabic Fields */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">العربية</h4>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "عنوان الرسالة (عربي)" : "Subject (Arabic)"}</Label>
                  <Input
                    dir="rtl"
                    value={template.subjectAr}
                    onChange={(e) => updateTemplate(template.eventType, { subjectAr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "نص الرسالة (عربي)" : "Body (Arabic)"}</Label>
                  <Textarea
                    rows={6}
                    dir="rtl"
                    value={template.bodyAr}
                    onChange={(e) => updateTemplate(template.eventType, { bodyAr: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === "ar"
              ? "لا توجد قوالب. سيتم إنشاؤها تلقائياً عند أول استخدام."
              : "No templates found. They will be auto-created on first use."}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
