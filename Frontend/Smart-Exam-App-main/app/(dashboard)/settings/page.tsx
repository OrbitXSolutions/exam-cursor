"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Save, Loader2, Settings, Shield, Lock, Globe, Palette } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { language } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await getSystemSettings()
      setSettings(data)
    } catch {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    try {
      await updateSystemSettings(settings)
      toast.success(language === "ar" ? "تم حفظ الإعدادات" : "Settings saved")
    } catch {
      toast.error("Failed to save settings")
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

  if (!settings) return null

  const brand = settings.brand ?? {
    logoUrl: "",
    brandName: "SmartExam",
    footerText: "© SmartExam. All rights reserved.",
    supportEmail: "",
    supportUrl: "",
    primaryColor: "#0d9488",
  }

  const setBrand = (updates: Partial<typeof brand>) => {
    setSettings({ ...settings, brand: { ...brand, ...updates } })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ar" ? "إعدادات النظام" : "System Settings"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "تكوين إعدادات النظام العامة" : "Configure global system settings"}
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
              {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            {language === "ar" ? "عام" : "General"}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            {language === "ar" ? "الأمان" : "Security"}
          </TabsTrigger>
          <TabsTrigger value="proctoring" className="gap-2">
            <Globe className="h-4 w-4" />
            {language === "ar" ? "المراقبة" : "Proctoring"}
          </TabsTrigger>
          <TabsTrigger value="brand" className="gap-2">
            <Palette className="h-4 w-4" />
            {language === "ar" ? "العلامة التجارية" : "Brand Info"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "الإعدادات العامة" : "General Settings"}</CardTitle>
              <CardDescription>
                {language === "ar" ? "إعدادات النظام الأساسية" : "Basic system configuration"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ar" ? "وضع الصيانة" : "Maintenance Mode"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "تعطيل الوصول للمستخدمين أثناء الصيانة"
                      : "Disable user access during maintenance"}
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ar" ? "السماح بالتسجيل" : "Allow Registration"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "السماح للمستخدمين الجدد بالتسجيل" : "Allow new users to register"}
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الحد الأقصى لحجم الملف (MB)" : "Max File Upload (MB)"}</Label>
                  <Input
                    type="number"
                    value={settings.maxFileUploadMb}
                    onChange={(e) =>
                      setSettings({ ...settings, maxFileUploadMb: Number.parseInt(e.target.value) || 10 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "مهلة الجلسة (دقائق)" : "Session Timeout (minutes)"}</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSettings({ ...settings, sessionTimeoutMinutes: Number.parseInt(e.target.value) || 120 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {language === "ar" ? "سياسة كلمة المرور" : "Password Policy"}
              </CardTitle>
              <CardDescription>
                {language === "ar" ? "تكوين متطلبات كلمة المرور" : "Configure password requirements"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{language === "ar" ? "الحد الأدنى للطول" : "Minimum Length"}</Label>
                <Input
                  type="number"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      passwordPolicy: {
                        ...settings.passwordPolicy,
                        minLength: Number.parseInt(e.target.value) || 8,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ar" ? "يتطلب أحرف كبيرة" : "Require Uppercase"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "يجب أن تحتوي على حرف كبير واحد على الأقل"
                      : "Must contain at least one uppercase letter"}
                  </p>
                </div>
                <Switch
                  checked={settings.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, requireUppercase: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ar" ? "يتطلب أرقام" : "Require Numbers"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "يجب أن تحتوي على رقم واحد على الأقل" : "Must contain at least one number"}
                  </p>
                </div>
                <Switch
                  checked={settings.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, requireNumbers: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{language === "ar" ? "يتطلب رموز خاصة" : "Require Special Characters"}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "يجب أن تحتوي على رمز خاص واحد على الأقل"
                      : "Must contain at least one special character"}
                  </p>
                </div>
                <Switch
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      passwordPolicy: { ...settings.passwordPolicy, requireSpecialChars: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proctoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "إعدادات المراقبة" : "Proctoring Settings"}</CardTitle>
              <CardDescription>
                {language === "ar" ? "تكوين إعدادات المراقبة الافتراضية" : "Configure default proctoring settings"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{language === "ar" ? "وضع المراقبة الافتراضي" : "Default Proctor Mode"}</Label>
                <Select
                  value={settings.defaultProctorMode}
                  onValueChange={(value) => setSettings({ ...settings, defaultProctorMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">{language === "ar" ? "بدون مراقبة" : "None"}</SelectItem>
                    <SelectItem value="Soft">{language === "ar" ? "مراقبة خفيفة" : "Soft Proctoring"}</SelectItem>
                    <SelectItem value="Hard">{language === "ar" ? "مراقبة صارمة" : "Hard Proctoring"}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {language === "ar"
                    ? "وضع المراقبة الافتراضي للاختبارات الجديدة"
                    : "Default proctoring mode for new exams"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {language === "ar" ? "معلومات العلامة التجارية" : "Brand Info"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "خصص الشعار والاسم والنص السفلي لنظام الامتحانات الخاص بشركتك"
                  : "Customize logo, name, and footer for your company's exam system"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{language === "ar" ? "رابط الشعار" : "Logo URL"}</Label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={brand.logoUrl}
                  onChange={(e) => setBrand({ logoUrl: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "رابط صورة الشعار (يظهر في الشريط الجانبي والرأس)" : "URL of logo image (shown in sidebar and header)"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "اسم العلامة التجارية" : "Brand Name"}</Label>
                <Input
                  placeholder="SmartExam"
                  value={brand.brandName}
                  onChange={(e) => setBrand({ brandName: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "الاسم المعروض في الواجهة" : "Name displayed across the application"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "النص السفلي (Footer)" : "Footer Text"}</Label>
                <Input
                  placeholder="© Your Company. All rights reserved."
                  value={brand.footerText}
                  onChange={(e) => setBrand({ footerText: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "نص يظهر في أسفل الصفحات" : "Text shown at the bottom of pages"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "البريد الداعم" : "Support Email"}</Label>
                  <Input
                    type="email"
                    placeholder="support@example.com"
                    value={brand.supportEmail}
                    onChange={(e) => setBrand({ supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط الدعم" : "Support URL"}</Label>
                  <Input
                    placeholder="https://support.example.com"
                    value={brand.supportUrl}
                    onChange={(e) => setBrand({ supportUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "اللون الأساسي" : "Primary Color"}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brand.primaryColor}
                    onChange={(e) => setBrand({ primaryColor: e.target.value })}
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    value={brand.primaryColor}
                    onChange={(e) => setBrand({ primaryColor: e.target.value })}
                    className="max-w-[120px] font-mono"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "لون التمييز للزر والروابط" : "Accent color for buttons and links"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
