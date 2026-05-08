"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/lib/types"
import { createUser, getDepartmentsList } from "@/lib/api/admin"
import type { DepartmentListItem } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

const MAX_NAME = 100
const MAX_EMAIL = 254

const PASSWORD_RULES = [
  {
    key: "length",
    test: (p: string) => p.length >= 8,
    en: "At least 8 characters",
    ar: "8 أحرف على الأقل",
  },
  {
    key: "uppercase",
    test: (p: string) => /[A-Z]/.test(p),
    en: "One uppercase letter (A–Z)",
    ar: "حرف كبير واحد (A–Z)",
  },
  {
    key: "lowercase",
    test: (p: string) => /[a-z]/.test(p),
    en: "One lowercase letter (a–z)",
    ar: "حرف صغير واحد (a–z)",
  },
  {
    key: "number",
    test: (p: string) => /[0-9]/.test(p),
    en: "One number (0–9)",
    ar: "رقم واحد (0–9)",
  },
  {
    key: "special",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    en: "One special character (e.g. @, #, !)",
    ar: "رمز خاص واحد (مثل @، #، !)",
  },
]

function validatePassword(password: string) {
  return PASSWORD_RULES.every((r) => r.test(password))
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type TouchedFields = {
  fullNameEn: boolean
  fullNameAr: boolean
  email: boolean
  role: boolean
  departmentId: boolean
  password: boolean
  confirmPassword: boolean
}

export default function CreateUserPage() {
  const { language } = useI18n()
  const { hasRole } = useAuth()
  const router = useRouter()
  const ar = language === "ar"
  const isSuperAdmin = hasRole(UserRole.SuperAdmin)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [showPasswordRules, setShowPasswordRules] = useState(false)
  const [touched, setTouched] = useState<TouchedFields>({
    fullNameEn: false,
    fullNameAr: false,
    email: false,
    role: false,
    departmentId: false,
    password: false,
    confirmPassword: false,
  })
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

  function touch(field: keyof TouchedFields) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function touchAll() {
    setTouched({
      fullNameEn: true,
      fullNameAr: true,
      email: true,
      role: true,
      departmentId: true,
      password: true,
      confirmPassword: true,
    })
  }

  // Per-field errors
  const errors = {
    fullNameEn: !formData.fullNameEn.trim()
      ? (ar ? "الاسم بالإنجليزية مطلوب" : "Full name (English) is required")
      : formData.fullNameEn.trim().length > MAX_NAME
        ? (ar ? `الحد الأقصى ${MAX_NAME} حرف` : `Max ${MAX_NAME} characters`)
        : null,
    fullNameAr: !formData.fullNameAr.trim()
      ? (ar ? "الاسم بالعربية مطلوب" : "Full name (Arabic) is required")
      : formData.fullNameAr.trim().length > MAX_NAME
        ? (ar ? `الحد الأقصى ${MAX_NAME} حرف` : `Max ${MAX_NAME} characters`)
        : null,
    email: !formData.email.trim()
      ? (ar ? "البريد الإلكتروني مطلوب" : "Email is required")
      : formData.email.trim().length > MAX_EMAIL
        ? (ar ? `الحد الأقصى ${MAX_EMAIL} حرف` : `Max ${MAX_EMAIL} characters`)
        : !isValidEmail(formData.email.trim())
          ? (ar ? "صيغة البريد الإلكتروني غير صحيحة" : "Invalid email format")
          : null,
    role: !formData.role ? (ar ? "الدور مطلوب" : "Role is required") : null,
    departmentId: formData.role === "SuperAdmin"
      ? null
      : (!formData.departmentId || formData.departmentId === "none"
          ? (ar ? "القسم مطلوب" : "Department is required")
          : null),
    password: !formData.password
      ? (ar ? "كلمة المرور مطلوبة" : "Password is required")
      : !validatePassword(formData.password)
        ? (ar ? "كلمة المرور لا تستوفي متطلبات الأمان" : "Password does not meet security requirements")
        : null,
    confirmPassword: !formData.confirmPassword
      ? (ar ? "تأكيد كلمة المرور مطلوب" : "Please confirm your password")
      : formData.password !== formData.confirmPassword
        ? (ar ? "كلمات المرور غير متطابقة" : "Passwords do not match")
        : null,
  }

  const hasErrors = Object.values(errors).some(Boolean)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    touchAll()
    setShowPasswordRules(true)

    if (hasErrors) {
      toast.error(ar ? "يرجى تصحيح الأخطاء قبل المتابعة" : "Please fix the errors before submitting")
      return
    }

    setLoading(true)
    try {
      await createUser({
        email: formData.email.trim(),
        fullNameEn: formData.fullNameEn.trim(),
        fullNameAr: formData.fullNameAr.trim(),
        role: formData.role,
        password: formData.password,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      })
      toast.success(ar ? "تم إنشاء المستخدم بنجاح" : "User created successfully")
      router.push("/users")
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      toast.error(msg || (ar ? "فشل في إنشاء المستخدم" : "Failed to create user"))
    } finally {
      setLoading(false)
    }
  }

  const R = <span className="text-destructive ml-0.5">*</span>

  function fieldClass(field: keyof TouchedFields) {
    return touched[field] && errors[field] ? "border-destructive focus-visible:ring-destructive" : ""
  }

  return (
    <div className="mx-auto w-[70%] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {ar ? "إضافة مستخدم جديد" : "Add New User"}
          </h1>
          <p className="text-muted-foreground">
            {ar ? "إنشاء حساب مستخدم جديد" : "Create a new user account"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>{ar ? "معلومات المستخدم" : "User Information"}</CardTitle>
            <CardDescription>
              {ar ? "أدخل تفاصيل المستخدم الجديد" : "Enter the new user details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullNameEn">{ar ? "الاسم (إنجليزي)" : "Full Name (English)"}{R}</Label>
                <Input
                  id="fullNameEn"
                  value={formData.fullNameEn}
                  maxLength={MAX_NAME}
                  onChange={(e) => setFormData({ ...formData, fullNameEn: e.target.value })}
                  onBlur={() => touch("fullNameEn")}
                  className={fieldClass("fullNameEn")}
                />
                {touched.fullNameEn && errors.fullNameEn && (
                  <p className="text-xs text-destructive">{errors.fullNameEn}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">{ar ? "الاسم (عربي)" : "Full Name (Arabic)"}{R}</Label>
                <Input
                  id="fullNameAr"
                  value={formData.fullNameAr}
                  maxLength={MAX_NAME}
                  onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                  onBlur={() => touch("fullNameAr")}
                  dir="rtl"
                  className={fieldClass("fullNameAr")}
                />
                {touched.fullNameAr && errors.fullNameAr && (
                  <p className="text-xs text-destructive">{errors.fullNameAr}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{ar ? "البريد الإلكتروني" : "Email"}{R}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                maxLength={MAX_EMAIL}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => touch("email")}
                className={fieldClass("email")}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">{ar ? "الدور" : "Role"}{R}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    setFormData({ ...formData, role: value })
                    touch("role")
                  }}
                >
                  <SelectTrigger
                    className={`w-full${touched.role && errors.role ? " border-destructive" : ""}`}
                    onBlur={() => touch("role")}
                  >
                    <SelectValue placeholder={ar ? "اختر الدور" : "Select role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="SuperAdmin">{ar ? "مسؤول أعلى" : "Super Admin"}</SelectItem>
                    )}
                    <SelectItem value="Admin">{ar ? "مسؤول" : "Admin"}</SelectItem>
                    <SelectItem value="Instructor">{ar ? "مدرس" : "Instructor"}</SelectItem>
                    <SelectItem value="Examiner">{ar ? "ممتحن" : "Examiner"}</SelectItem>
                    <SelectItem value="Proctor">{ar ? "مراقب" : "Proctor"}</SelectItem>
                  </SelectContent>
                </Select>
                {touched.role && errors.role && (
                  <p className="text-xs text-destructive">{errors.role}</p>
                )}
              </div>
              {formData.role !== "SuperAdmin" && (
              <div className="space-y-2">
                <Label htmlFor="departmentId">{ar ? "القسم" : "Department"}{R}</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, departmentId: value })
                    touch("departmentId")
                  }}
                >
                  <SelectTrigger
                    className={`w-full${touched.departmentId && errors.departmentId ? " border-destructive" : ""}`}
                    onBlur={() => touch("departmentId")}
                  >
                    <SelectValue placeholder={ar ? "اختر القسم" : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {ar ? dept.nameAr : dept.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.departmentId && errors.departmentId && (
                  <p className="text-xs text-destructive">{errors.departmentId}</p>
                )}
              </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">{ar ? "كلمة المرور" : "Password"}{R}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (!showPasswordRules) setShowPasswordRules(true)
                    touch("password")
                  }}
                  onBlur={() => touch("password")}
                  className={fieldClass("password")}
                />
                {touched.password && errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{ar ? "تأكيد كلمة المرور" : "Confirm Password"}{R}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    touch("confirmPassword")
                  }}
                  onBlur={() => touch("confirmPassword")}
                  className={fieldClass("confirmPassword")}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {ar
                ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على: حرف كبير، حرف صغير، رقم، ورمز خاص."
                : "Password must be at least 8 characters and contain: an uppercase letter, a lowercase letter, a number, and a special character."}
            </p>

            {/* Password strength rules */}
            {showPasswordRules && formData.password.length > 0 && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {ar ? "متطلبات كلمة المرور:" : "Password requirements:"}
                </p>
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(formData.password)
                  return (
                    <div key={rule.key} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className={passed ? "text-green-600" : "text-destructive"}>
                        {ar ? rule.ar : rule.en}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {ar ? "جاري الإنشاء..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {ar ? "إنشاء المستخدم" : "Create User"}
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
