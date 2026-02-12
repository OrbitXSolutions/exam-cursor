"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getOrganizationSettings,
  updateOrganizationSettings,
  uploadOrganizationImage,
  type OrganizationSettingsDto,
} from "@/lib/api/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save, Loader2, Upload, Building2, ImageIcon, Globe, Mail, Phone, FileText, Palette } from "lucide-react"
import { toast } from "sonner"

export default function OrganizationPage() {
  const { language } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    logoPath: "" as string | null,
    faviconPath: "" as string | null,
    supportEmail: "",
    mobileNumber: "",
    officeNumber: "",
    supportUrl: "",
    footerText: "",
    primaryColor: "#0d9488",
    isActive: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await getOrganizationSettings()
      setFormData({
        name: data.name ?? "",
        logoPath: data.logoPath ?? "",
        faviconPath: data.faviconPath ?? "",
        supportEmail: data.supportEmail ?? "",
        mobileNumber: data.mobileNumber ?? "",
        officeNumber: data.officeNumber ?? "",
        supportUrl: data.supportUrl ?? "",
        footerText: data.footerText ?? "",
        primaryColor: data.primaryColor ?? "#0d9488",
        isActive: data.isActive,
      })
    } catch {
      toast.error(language === "ar" ? "فشل في تحميل الإعدادات" : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateOrganizationSettings({
        name: formData.name,
        supportEmail: formData.supportEmail || null,
        mobileNumber: formData.mobileNumber || null,
        officeNumber: formData.officeNumber || null,
        supportUrl: formData.supportUrl || null,
        footerText: formData.footerText || null,
        primaryColor: formData.primaryColor || null,
        isActive: formData.isActive,
      })
      toast.success(language === "ar" ? "تم حفظ إعدادات المنظمة" : "Organization settings saved")
    } catch {
      toast.error(language === "ar" ? "فشل في حفظ الإعدادات" : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const result = await uploadOrganizationImage("logo", file)
      setFormData((prev) => ({ ...prev, logoPath: result.path }))
      toast.success(language === "ar" ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload logo")
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ""
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    try {
      const result = await uploadOrganizationImage("favicon", file)
      setFormData((prev) => ({ ...prev, faviconPath: result.path }))
      toast.success(language === "ar" ? "تم رفع الأيقونة بنجاح" : "Favicon uploaded successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload favicon")
    } finally {
      setUploadingFavicon(false)
      if (faviconInputRef.current) faviconInputRef.current.value = ""
    }
  }

  function getImageUrl(path: string | null): string {
    if (!path) return ""
    // Path is like /organization/logo.png — proxy through backend
    return `http://localhost:5221${path}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ar" ? "إعدادات المنظمة" : "Organization Settings"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "تخصيص العلامة التجارية ومعلومات الاتصال التي تظهر للمرشحين"
              : "Customize branding and contact info shown to candidates"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {language === "ar" ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {language === "ar" ? "حفظ الإعدادات" : "Save Settings"}
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Branding Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {language === "ar" ? "الشعار والأيقونة" : "Logo & Favicon"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "رفع شعار المنظمة والأيقونة المفضلة"
                  : "Upload organization logo and favicon"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Logo */}
                <div className="space-y-3">
                  <Label>{language === "ar" ? "الشعار" : "Logo"}</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 overflow-hidden">
                      {formData.logoPath ? (
                        <img
                          src={getImageUrl(formData.logoPath)}
                          alt="Logo"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {language === "ar" ? "رفع شعار" : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG, SVG. Max 5MB</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                </div>
                {/* Favicon */}
                <div className="space-y-3">
                  <Label>{language === "ar" ? "الأيقونة المفضلة" : "Favicon"}</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 overflow-hidden">
                      {formData.faviconPath ? (
                        <img
                          src={getImageUrl(formData.faviconPath)}
                          alt="Favicon"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Globe className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingFavicon}
                        onClick={() => faviconInputRef.current?.click()}
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {language === "ar" ? "رفع أيقونة" : "Upload Favicon"}
                      </Button>
                      <p className="text-xs text-muted-foreground">PNG, JPG, SVG, ICO. Max 5MB</p>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,.ico"
                        className="hidden"
                        onChange={handleFaviconUpload}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {language === "ar" ? "معلومات المنظمة" : "Organization Info"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "الاسم والنصوص التي تظهر للمرشحين"
                  : "Name and text shown to candidates"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {language === "ar" ? "اسم المنظمة" : "Organization Name"} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={language === "ar" ? "مثال: هيئة التعليم" : "e.g. Education Authority"}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label>
                    {language === "ar" ? "تفعيل العلامة التجارية للمنظمة" : "Enable Organization Branding"}
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerText">
                  <FileText className="inline h-4 w-4 mr-1" />
                  {language === "ar" ? "نص التذييل" : "Footer Text"}
                </Label>
                <Input
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder={language === "ar" ? "© 2026 هيئة التعليم" : "© 2026 Education Authority"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">
                  <Palette className="inline h-4 w-4 mr-1" />
                  {language === "ar" ? "اللون الأساسي" : "Primary Color"}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border p-1"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#0d9488"
                    className="max-w-[140px] font-mono text-sm"
                  />
                  <div
                    className="h-10 flex-1 rounded border"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {language === "ar"
                    ? "اللون الرئيسي المستخدم في واجهة المرشحين"
                    : "Main accent color used in the candidate-facing UI"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {language === "ar" ? "معلومات الاتصال" : "Contact Information"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "تفاصيل الاتصال المعروضة للمرشحين"
                  : "Contact details shown to candidates"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">
                    <Mail className="inline h-4 w-4 mr-1" />
                    {language === "ar" ? "بريد الدعم" : "Support Email"}
                  </Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={formData.supportEmail}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    placeholder="support@organization.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportUrl">
                    <Globe className="inline h-4 w-4 mr-1" />
                    {language === "ar" ? "رابط الدعم" : "Support URL"}
                  </Label>
                  <Input
                    id="supportUrl"
                    value={formData.supportUrl}
                    onChange={(e) => setFormData({ ...formData, supportUrl: e.target.value })}
                    placeholder="https://support.organization.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">
                    <Phone className="inline h-4 w-4 mr-1" />
                    {language === "ar" ? "رقم الجوال" : "Mobile Number"}
                  </Label>
                  <Input
                    id="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+966 5xx xxx xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeNumber">
                    <Phone className="inline h-4 w-4 mr-1" />
                    {language === "ar" ? "رقم المكتب" : "Office Number"}
                  </Label>
                  <Input
                    id="officeNumber"
                    value={formData.officeNumber}
                    onChange={(e) => setFormData({ ...formData, officeNumber: e.target.value })}
                    placeholder="+966 1x xxx xxxx"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview sidebar — 1 column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === "ar" ? "معاينة ما يراه المرشح" : "Candidate Preview"}
              </CardTitle>
              <CardDescription className="text-xs">
                {language === "ar"
                  ? "هذا ما سيراه المرشحون"
                  : "This is what candidates will see"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-background p-4 space-y-4">
                {/* Preview header */}
                <div className="flex items-center gap-3 border-b pb-3" style={{ borderBottomColor: formData.primaryColor }}>
                  {formData.logoPath ? (
                    <img
                      src={getImageUrl(formData.logoPath)}
                      alt="Logo Preview"
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {formData.name || (language === "ar" ? "اسم المنظمة" : "Organization Name")}
                    </p>
                  </div>
                </div>
                {/* Preview contact */}
                {(formData.supportEmail || formData.mobileNumber || formData.officeNumber) && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {formData.supportEmail && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {formData.supportEmail}
                      </p>
                    )}
                    {formData.mobileNumber && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {formData.mobileNumber}
                      </p>
                    )}
                    {formData.officeNumber && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {formData.officeNumber}
                      </p>
                    )}
                    {formData.supportUrl && (
                      <p className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {formData.supportUrl}
                      </p>
                    )}
                  </div>
                )}
                {/* Preview footer */}
                <Separator />
                <p className="text-xs text-center text-muted-foreground">
                  {formData.footerText || (language === "ar" ? "نص التذييل" : "Footer text")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === "ar" ? "الحالة" : "Status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{language === "ar" ? "العلامة التجارية" : "Branding"}</span>
                <span className={formData.isActive ? "text-green-600 font-medium" : "text-muted-foreground"}>
                  {formData.isActive
                    ? (language === "ar" ? "مفعّل" : "Active")
                    : (language === "ar" ? "معطّل" : "Inactive")}
                </span>
              </div>
              <p>
                {language === "ar"
                  ? "عند تفعيل العلامة التجارية، تظهر بيانات المنظمة للمرشحين بديلاً عن إعدادات النظام."
                  : "When active, organization branding is shown to candidates instead of system settings."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
