"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getUserById, updateUser } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullNameEn: "",
    fullNameAr: "",
    role: "",
    isActive: true,
  })

  useEffect(() => {
    loadUser()
  }, [id])

  async function loadUser() {
    try {
      const user = await getUserById(id)
      setFormData({
        fullNameEn: user.fullNameEn,
        fullNameAr: user.fullNameAr,
        role: user.role,
        isActive: user.isActive,
      })
    } catch {
      toast.error("Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser(id, formData)
      toast.success(language === "ar" ? "تم تحديث المستخدم بنجاح" : "User updated successfully")
      router.push(`/users/${id}`)
    } catch {
      toast.error(language === "ar" ? "فشل في تحديث المستخدم" : "Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{language === "ar" ? "تعديل المستخدم" : "Edit User"}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تحديث معلومات المستخدم" : "Update user information"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "معلومات المستخدم" : "User Information"}</CardTitle>
            <CardDescription>{language === "ar" ? "تعديل تفاصيل المستخدم" : "Edit user details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullNameEn">{language === "ar" ? "الاسم (إنجليزي)" : "Full Name (English)"}</Label>
                <Input
                  id="fullNameEn"
                  value={formData.fullNameEn}
                  onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">{language === "ar" ? "الاسم (عربي)" : "Full Name (Arabic)"}</Label>
                <Input
                  id="fullNameAr"
                  value={formData.fullNameAr}
                  onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{language === "ar" ? "الدور" : "Role"}</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Candidate">{language === "ar" ? "مرشح" : "Candidate"}</SelectItem>
                  <SelectItem value="Instructor">{language === "ar" ? "مدرس" : "Instructor"}</SelectItem>
                  <SelectItem value="ProctorReviewer">{language === "ar" ? "مراجع" : "Proctor Reviewer"}</SelectItem>
                  <SelectItem value="Auditor">{language === "ar" ? "مدقق" : "Auditor"}</SelectItem>
                  <SelectItem value="Admin">{language === "ar" ? "مسؤول" : "Admin"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>{language === "ar" ? "حالة الحساب" : "Account Status"}</Label>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "تفعيل أو تعطيل وصول المستخدم" : "Enable or disable user access to the platform"}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
