"use client"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getLicenseStatus, uploadLicense, type LicenseStatusResult } from "@/lib/api/license"
import { UserRole } from "@/lib/types"
import { toast } from "sonner"
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Upload,
  Globe,
  Calendar,
  Users,
  Building2,
  Clock,
  FileKey,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default function LicensePage() {
  const { t, language } = useI18n()
  const { hasRole } = useAuth()
  const [status, setStatus] = useState<LicenseStatusResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = hasRole([UserRole.Admin, UserRole.SuperAdmin])

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    setLoading(true)
    try {
      const res = await getLicenseStatus()
      setStatus(res)
    } catch {
      toast.error(language === "ar" ? "فشل في تحميل حالة الرخصة" : "Failed to load license status")
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      toast.error(language === "ar" ? "يرجى رفع ملف .json فقط" : "Please upload a .json file only")
      return
    }

    setUploading(true)
    try {
      const res = await uploadLicense(file)
      setStatus(res)
      toast.success(language === "ar" ? "تم رفع الرخصة بنجاح" : "License uploaded successfully")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (language === "ar" ? "فشل في رفع الرخصة" : "Failed to upload license")
      toast.error(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function getStateColor(state: string) {
    switch (state) {
      case "Active": return "text-green-600 bg-green-50 border-green-200"
      case "Warning": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "GracePeriod": return "text-orange-600 bg-orange-50 border-orange-200"
      case "Expired": return "text-red-600 bg-red-50 border-red-200"
      case "Invalid": return "text-red-600 bg-red-50 border-red-200"
      case "Missing": return "text-muted-foreground bg-muted border-border"
      default: return "text-muted-foreground bg-muted border-border"
    }
  }

  function getStateLabel(state: string) {
    const labels: Record<string, { label: string; labelAr: string }> = {
      Active: { label: "Active", labelAr: "نشط" },
      Warning: { label: "Warning", labelAr: "تحذير" },
      GracePeriod: { label: "Grace Period", labelAr: "فترة السماح" },
      Expired: { label: "Expired", labelAr: "منتهي" },
      Invalid: { label: "Invalid", labelAr: "غير صالح" },
      Missing: { label: "Missing", labelAr: "غير موجود" },
    }
    const l = labels[state] || { label: state, labelAr: state }
    return language === "ar" ? l.labelAr : l.label
  }

  function getStateAlert(s: LicenseStatusResult) {
    const { state, graceDaysRemaining, gracePeriodDays, daysRemaining } = s

    if (state === "GracePeriod") {
      return {
        wrapperClass: "bg-orange-50 border-orange-200",
        titleClass: "text-orange-800",
        bodyClass: "text-orange-700",
        dotClass: "bg-orange-500",
        icon: <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-orange-500" />,
        title: language === "ar"
          ? `تحذير: فترة السماح — ${graceDaysRemaining ?? 0} يوم متبقي من أصل ${gracePeriodDays ?? 0}`
          : `Warning: Grace Period Active — ${graceDaysRemaining ?? 0} of ${gracePeriodDays ?? 0} day(s) remaining`,
        body: language === "ar"
          ? "انتهت صلاحية الرخصة. النظام في وضع فترة السماح المؤقتة. بعد انتهاء فترة السماح:"
          : "Your license has expired. The system is currently in temporary grace mode. When grace period ends:",
        items: language === "ar" ? [
          "ستُحظر جميع عمليات الإنشاء والتعديل والحذف تلقائياً.",
          "لن يتمكن المرشحون من تقديم إجابات الاختبارات.",
          "لن يمكن إنشاء اختبارات جديدة أو إضافة مرشحين أو تعديل البيانات.",
          "ستبقى عمليات القراءة وتسجيل الدخول متاحة بالكامل.",
          "يرجى رفع ملف رخصة جديد الآن لتجنب انقطاع الخدمة.",
        ] : [
          "All create, edit, and delete operations will be automatically blocked.",
          "Candidates will not be able to submit exam answers.",
          "New exams, candidates, and data modifications will be disabled.",
          "Login and read-only access will remain fully available.",
          "Upload a new license file now to avoid service disruption.",
        ],
      }
    }

    if (state === "Expired") {
      return {
        wrapperClass: "bg-red-50 border-red-200",
        titleClass: "text-red-800",
        bodyClass: "text-red-700",
        dotClass: "bg-red-500",
        icon: <XCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />,
        title: language === "ar"
          ? "منتهي الصلاحية — وضع القراءة فقط مُفعَّل الآن"
          : "Expired — Read-Only Mode is Now Active",
        body: language === "ar"
          ? "انتهت فترة السماح. النظام يعمل حالياً بوضع القراءة فقط:"
          : "The grace period has ended. The system is currently operating in Read-Only mode:",
        items: language === "ar" ? [
          "جميع عمليات الكتابة (POST / PUT / DELETE) محظورة ويُعاد الرد بخطأ 403.",
          "لا يمكن إنشاء اختبارات أو إضافة مرشحين أو تعديل أي بيانات.",
          "لا يمكن للمرشحين تقديم إجابات الاختبارات.",
          "تسجيل الدخول وعرض البيانات لا يزالان يعملان بشكل طبيعي.",
          "يرجى رفع ملف رخصة جديد فوراً لاستعادة الوظائف الكاملة.",
        ] : [
          "All write operations (POST / PUT / DELETE) are blocked and return HTTP 403.",
          "Exams cannot be created, candidates cannot be added, and no data can be modified.",
          "Candidates cannot submit exam answers.",
          "Login and data viewing remain fully operational.",
          "Upload a new license file immediately to restore full functionality.",
        ],
      }
    }

    if (state === "Warning") {
      return {
        wrapperClass: "bg-yellow-50 border-yellow-200",
        titleClass: "text-yellow-800",
        bodyClass: "text-yellow-700",
        dotClass: "bg-yellow-500",
        icon: <AlertCircle className="h-5 w-5 mt-0.5 shrink-0 text-yellow-500" />,
        title: language === "ar"
          ? `تنبيه: الرخصة تنتهي خلال ${daysRemaining} يوم`
          : `Notice: License expires in ${daysRemaining} day(s)`,
        body: language === "ar"
          ? "يقترب موعد انتهاء الرخصة. يرجى التجديد قبل الانتهاء لتجنب الانقطاع. عند انتهاء الصلاحية:"
          : "Your license is approaching its expiry date. Renew before it expires to avoid disruption. When it expires:",
        items: language === "ar" ? [
          "ستبدأ فترة السماح تلقائياً عند انتهاء الرخصة.",
          "بعد انتهاء فترة السماح، يدخل النظام وضع القراءة فقط.",
          "ستُحظر جميع عمليات الإنشاء والتعديل والحذف.",
          "يُنصح بالتجديد المبكر لضمان استمرارية الخدمة.",
        ] : [
          "A grace period will automatically begin when the license expires.",
          "After the grace period ends, the system will enter Read-Only mode.",
          "All write operations will be blocked.",
          "Early renewal is strongly recommended to ensure service continuity.",
        ],
      }
    }

    if (state === "Invalid" || state === "Missing") {
      return {
        wrapperClass: "bg-red-50 border-red-200",
        titleClass: "text-red-800",
        bodyClass: "text-red-700",
        dotClass: "bg-red-500",
        icon: <XCircle className="h-5 w-5 mt-0.5 shrink-0 text-red-500" />,
        title: language === "ar"
          ? (state === "Invalid" ? "رخصة غير صالحة" : "لا توجد رخصة")
          : (state === "Invalid" ? "Invalid License Detected" : "No License Found"),
        body: language === "ar"
          ? "النظام يعمل بدون رخصة صالحة:"
          : "The system is operating without a valid license:",
        items: language === "ar" ? [
          "جميع عمليات الكتابة محظورة.",
          "يرجى رفع ملف رخصة صالح لاستعادة الوظائف الكاملة.",
        ] : [
          "All write operations are blocked.",
          "Please upload a valid license file to restore full functionality.",
        ],
      }
    }

    if (state === "Active") {
      return {
        wrapperClass: "bg-green-50 border-green-200",
        titleClass: "text-green-800",
        bodyClass: "text-green-700",
        dotClass: "bg-green-500",
        icon: <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-green-500" />,
        title: language === "ar" ? "الرخصة نشطة — النظام يعمل بشكل كامل" : "License Active — System Fully Operational",
        body: language === "ar"
          ? "جميع الميزات متاحة بالكامل:"
          : "All features are fully available:",
        items: language === "ar" ? [
          "إنشاء الاختبارات وإدارة المرشحين والنتائج متاح.",
          "تسجيل الدخول وجميع عمليات القراءة والكتابة تعمل.",
          "النظام يعمل ضمن نطاق الرخصة المحددة.",
        ] : [
          "Exam creation, candidate management, and results are fully available.",
          "All read and write operations are operational.",
          "System is running within the licensed domain.",
        ],
      }
    }

    return null
  }

  function getStateIcon(state: string) {
    switch (state) {
      case "Active": return <ShieldCheck className="h-8 w-8 text-green-500" />
      case "Warning": return <AlertTriangle className="h-8 w-8 text-yellow-500" />
      case "GracePeriod": return <Clock className="h-8 w-8 text-orange-500" />
      case "Expired": return <ShieldAlert className="h-8 w-8 text-red-500" />
      case "Invalid": return <ShieldAlert className="h-8 w-8 text-red-500" />
      case "Missing": return <FileKey className="h-8 w-8 text-muted-foreground" />
      default: return <ShieldCheck className="h-8 w-8 text-muted-foreground" />
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      timeZone: "Asia/Dubai",
      year: "numeric", month: "long", day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title={language === "ar" ? "إدارة الرخصة" : "License Management"}
          description={language === "ar" ? "عرض حالة الرخصة وتحديثها" : "View and manage your system license"}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* License Status Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status && getStateIcon(status.state)}
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      {language === "ar" ? "حالة الرخصة" : "License Status"}
                      {status && (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStateColor(status.state)}`}>
                          {getStateLabel(status.state)}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{status?.message || ""}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={loadStatus} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {status && (() => {
                const alert = getStateAlert(status)
                if (!alert) return null
                return (
                  <div className={`rounded-lg border p-4 mb-5 ${alert.wrapperClass}`}>
                    <div className="flex items-start gap-3">
                      {alert.icon}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${alert.titleClass}`}>{alert.title}</p>
                        <p className={`text-sm mt-1 ${alert.bodyClass}`}>{alert.body}</p>
                        <ul className="mt-2 space-y-1">
                          {alert.items.map((item, i) => (
                            <li key={i} className={`text-sm flex items-start gap-2 ${alert.bodyClass}`}>
                              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${alert.dotClass}`} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })()}
              {status && status.state !== "Missing" && status.state !== "Invalid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "العميل" : "Customer"}</p>
                      <p className="font-medium">{status.customerName || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "تاريخ الإصدار → الانتهاء" : "Issued → Expiry"}</p>
                      <p className="font-medium">{formatDate(status.issuedAt)} — {formatDate(status.expiresAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الأيام المتبقية" : "Days Remaining"}</p>
                      <p className="font-medium">
                        {status.daysRemaining !== null ? (
                          status.daysRemaining > 0 ? status.daysRemaining : (
                            status.graceDaysRemaining !== null && status.graceDaysRemaining > 0
                              ? `${language === "ar" ? "فترة السماح:" : "Grace:"} ${status.graceDaysRemaining}`
                              : (language === "ar" ? "منتهي" : "Expired")
                          )
                        ) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileKey className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "نوع الرخصة" : "License Type"}</p>
                      <p className="font-medium">{status.licenseType || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "الحد الأقصى للمستخدمين" : "Max Users"}</p>
                      <p className="font-medium">{status.maxUsers === 0 ? (language === "ar" ? "غير محدود" : "Unlimited") : (status.maxUsers || "—")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "لا توجد رخصة صالحة. يرجى رفع ملف رخصة جديد."
                    : "No valid license found. Please upload a new license file."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Licensed Domain Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {language === "ar" ? "النطاق المرخص" : "Licensed Domain"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono">
                {status?.licensedDomain || (language === "ar" ? "غير محدد" : "Not set")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {language === "ar"
                  ? "الرخصة مرتبطة بهذا النطاق. لا يمكن استخدامها على نطاق آخر."
                  : "The license is bound to this domain. It cannot be used on a different domain."}
              </p>
            </CardContent>
          </Card>

          {/* Upload License Card */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {language === "ar" ? "تحديث الرخصة" : "Update License"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "ارفع ملف license.json الجديد لتجديد الرخصة"
                    : "Upload a new license.json file to renew your license"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleUpload}
                  className="hidden"
                  id="license-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ms-2">{language === "ar" ? "جاري الرفع..." : "Uploading..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 me-2" />
                      {language === "ar" ? "رفع ملف الرخصة" : "Upload License File"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  {language === "ar"
                    ? "يقبل ملفات .json فقط. لا يتطلب إعادة تشغيل النظام."
                    : "Accepts .json files only. No system restart required."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
