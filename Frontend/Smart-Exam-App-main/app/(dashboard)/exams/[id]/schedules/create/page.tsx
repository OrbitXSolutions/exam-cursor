"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getExam, createExamSchedule } from "@/lib/api/exams"
import type { Exam } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, Save, Calendar, Users } from "lucide-react"

export default function CreateSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    maxCandidates: 100,
    allowLateEntry: false,
    lateEntryMinutes: 15,
  })

  useEffect(() => {
    loadExam()
  }, [id])

  async function loadExam() {
    try {
      const data = await getExam(id)
      setExam(data)
    } catch (error) {
      toast.error("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setSaving(true)
      await createExamSchedule(id, {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      })
      toast.success("Schedule created successfully")
      router.push(`/exams/${id}/overview`)
    } catch (error) {
      toast.error("Failed to create schedule")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams/list">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.createSchedule")}</h1>
          <p className="text-muted-foreground mt-1">{exam?.titleEn || exam?.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="h-5 w-5" />
              {t("exams.scheduleDetails")}
            </CardTitle>
            <CardDescription>{t("exams.scheduleDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("exams.scheduleName")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder={t("exams.scheduleNamePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("exams.location")}</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder={t("exams.locationPlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={t("exams.scheduleDescPlaceholder")}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t("exams.startTime")} *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t("exams.endTime")} *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              {t("exams.capacitySettings")}
            </CardTitle>
            <CardDescription>{t("exams.capacitySettingsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxCandidates">{t("exams.maxCandidates")}</Label>
              <Input
                id="maxCandidates"
                type="number"
                min="1"
                value={formData.maxCandidates}
                onChange={(e) => updateField("maxCandidates", Number.parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("exams.allowLateEntry")}</Label>
                <p className="text-sm text-muted-foreground">{t("exams.allowLateEntryDesc")}</p>
              </div>
              <Switch
                checked={formData.allowLateEntry}
                onCheckedChange={(checked) => updateField("allowLateEntry", checked)}
              />
            </div>
            {formData.allowLateEntry && (
              <div className="space-y-2">
                <Label htmlFor="lateMinutes">{t("exams.lateEntryMinutes")}</Label>
                <Input
                  id="lateMinutes"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.lateEntryMinutes}
                  onChange={(e) => updateField("lateEntryMinutes", Number.parseInt(e.target.value))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/exams/list">{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 me-2" />
            {saving ? t("common.saving") : t("exams.createSchedule")}
          </Button>
        </div>
      </form>
    </div>
  )
}
