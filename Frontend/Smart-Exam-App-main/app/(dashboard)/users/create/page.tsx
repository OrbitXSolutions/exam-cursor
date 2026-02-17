"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createUser, getDepartmentsList } from "@/lib/api/admin"
import type { DepartmentListItem } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function CreateUserPage() {
  const { language } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [formData, setFormData] = useState({
    email: "",
    fullNameEn: "",
    fullNameAr: "",
    role: "",
    password: "",
    confirmPassword: "",
    departmentId: "",
  })

  useEffect(() => {
    getDepartmentsList().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error(language === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      toast.error(
        language === "ar" ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters",
      )
      return
    }

    setLoading(true)
    try {
      await createUser({
        email: formData.email,
        fullNameEn: formData.fullNameEn,
        fullNameAr: formData.fullNameAr,
        role: formData.role,
        password: formData.password,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      })
      toast.success(language === "ar" ? "تم إنشاء المستخدم بنجاح" : "User created successfully")
      router.push("/users")
    } catch {
      toast.error(language === "ar" ? "فشل في إنشاء المستخدم" : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ar" ? "إضافة مستخدم جديد" : "Add New User"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إنشاء حساب مستخدم جديد" : "Create a new user account"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "معلومات المستخدم" : "User Information"}</CardTitle>
            <CardDescription>
              {language === "ar" ? "أدخل تفاصيل المستخدم الجديد" : "Enter the new user details"}
            </CardDescription>
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
              <Label htmlFor="email">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">{language === "ar" ? "الدور" : "Role"}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ar" ? "اختر الدور" : "Select role"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Candidate">{language === "ar" ? "مرشح" : "Candidate"}</SelectItem>
                    <SelectItem value="Instructor">{language === "ar" ? "مدرس" : "Instructor"}</SelectItem>
                    <SelectItem value="Examiner">{language === "ar" ? "ممتحن" : "Examiner"}</SelectItem>
                    <SelectItem value="Proctor">{language === "ar" ? "مراقب" : "Proctor"}</SelectItem>
                    <SelectItem value="ProctorReviewer">{language === "ar" ? "مراجع" : "Proctor Reviewer"}</SelectItem>
                    <SelectItem value="Auditor">{language === "ar" ? "مدقق" : "Auditor"}</SelectItem>
                    <SelectItem value="Admin">{language === "ar" ? "مسؤول" : "Admin"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">{language === "ar" ? "القسم" : "Department"}</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "ar" ? "اختر القسم" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{language === "ar" ? "بدون قسم" : "No Department"}</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {language === "ar" ? dept.nameAr : dept.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{language === "ar" ? "كلمة المرور" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === "ar" ? "جاري الإنشاء..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === "ar" ? "إنشاء المستخدم" : "Create User"}
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
