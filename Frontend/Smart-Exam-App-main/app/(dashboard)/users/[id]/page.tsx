"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { getUserById, resetUserPassword } from "@/lib/api/admin"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, Pencil, KeyRound, Mail, Calendar, Shield, UserIcon } from "lucide-react"
import { toast } from "sonner"

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { language } = useI18n()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [id])

  async function loadUser() {
    try {
      const data = await getUserById(id)
      setUser(data)
    } catch {
      toast.error("Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!user) return
    try {
      const result = await resetUserPassword(user.id)
      toast.success(`Password reset. Temporary password: ${result.temporaryPassword}`)
    } catch {
      toast.error("Failed to reset password")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{language === "ar" ? "المستخدم غير موجود" : "User not found"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === "ar" ? "رجوع" : "Go Back"}
        </Button>
      </div>
    )
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SuperAdmin":
      case "Admin":
        return "default"
      case "Instructor":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
              {getLocalizedField(user, "fullName", language).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{getLocalizedField(user, "fullName", language)}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetPassword}>
            <KeyRound className="mr-2 h-4 w-4" />
            {language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </Button>
          <Button onClick={() => router.push(`/users/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            {language === "ar" ? "تعديل" : "Edit"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              {language === "ar" ? "معلومات المستخدم" : "User Information"}
            </CardTitle>
            <CardDescription>{language === "ar" ? "التفاصيل الأساسية للمستخدم" : "Basic user details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</span>
              <span className="font-medium">{user.fullNameEn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</span>
              <span className="font-medium" dir="rtl">
                {user.fullNameAr}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === "ar" ? "البريد الإلكتروني" : "Email"}</span>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.email}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === "ar" ? "الدور" : "Role"}</span>
              <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === "ar" ? "الحالة" : "Status"}</span>
              <StatusBadge status={user.isActive ? "success" : "muted"}>
                {user.isActive ? (language === "ar" ? "نشط" : "Active") : language === "ar" ? "غير نشط" : "Inactive"}
              </StatusBadge>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {language === "ar" ? "تفاصيل الحساب" : "Account Details"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "معلومات الحساب والأمان" : "Account and security information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === "ar" ? "معرف المستخدم" : "User ID"}</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{language === "ar" ? "تاريخ الإنشاء" : "Created Date"}</span>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(user.createdDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
