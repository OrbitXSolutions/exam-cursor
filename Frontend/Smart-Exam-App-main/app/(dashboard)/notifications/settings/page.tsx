"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import {
  getNotificationSettings,
  updateNotificationSettings,
  sendTestEmail,
  sendTestSms,
  type NotificationSettingsDto,
} from "@/lib/api/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { Mail, Smartphone, Settings2, Send, Eye, EyeOff, Loader2 } from "lucide-react"

export default function NotificationSettingsPage() {
  const { language } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettingsDto | null>(null)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [showSmsToken, setShowSmsToken] = useState(false)

  // Test state
  const [testEmail, setTestEmail] = useState("")
  const [testPhone, setTestPhone] = useState("")
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [sendingTestSms, setSendingTestSms] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const data = await getNotificationSettings()
      setSettings(data)
    } catch {
      toast.error(language === "ar" ? "فشل تحميل الإعدادات" : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return
    setSaving(true)
    try {
      await updateNotificationSettings(settings)
      toast.success(language === "ar" ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully")
    } catch {
      toast.error(language === "ar" ? "فشل حفظ الإعدادات" : "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleTestEmail() {
    if (!testEmail) {
      toast.error(language === "ar" ? "يرجى إدخال البريد الإلكتروني" : "Please enter an email address")
      return
    }
    setSendingTestEmail(true)
    try {
      await sendTestEmail(testEmail)
      toast.success(language === "ar" ? "تم إرسال البريد التجريبي بنجاح" : "Test email sent successfully")
    } catch {
      toast.error(language === "ar" ? "فشل إرسال البريد التجريبي" : "Failed to send test email")
    } finally {
      setSendingTestEmail(false)
    }
  }

  async function handleTestSms() {
    if (!testPhone) {
      toast.error(language === "ar" ? "يرجى إدخال رقم الهاتف" : "Please enter a phone number")
      return
    }
    setSendingTestSms(true)
    try {
      await sendTestSms(testPhone)
      toast.success(language === "ar" ? "تم إرسال الرسالة التجريبية بنجاح" : "Test SMS sent successfully")
    } catch {
      toast.error(language === "ar" ? "فشل إرسال الرسالة التجريبية" : "Failed to send test SMS")
    } finally {
      setSendingTestSms(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === "ar"
              ? "إعداد خادم البريد الإلكتروني ومزود خدمة الرسائل القصيرة"
              : "Configure email server and SMS service provider"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin me-2" />}
          {language === "ar" ? "حفظ" : "Save Settings"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            {language === "ar" ? "البريد الإلكتروني" : "Email (SMTP)"}
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Smartphone className="h-4 w-4" />
            {language === "ar" ? "الرسائل القصيرة" : "SMS"}
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            {language === "ar" ? "عام" : "General"}
          </TabsTrigger>
        </TabsList>

        {/* ── Email Tab ───────────────────────────────── */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "إعدادات SMTP" : "SMTP Configuration"}</CardTitle>
                  <CardDescription className="mt-1">
                    {language === "ar"
                      ? "إعداد خادم البريد الإلكتروني لإرسال الإشعارات"
                      : "Configure the email server for sending notifications"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enableEmail" className="text-sm">
                    {language === "ar" ? "تفعيل" : "Enable"}
                  </Label>
                  <Switch
                    id="enableEmail"
                    checked={settings.enableEmail}
                    onCheckedChange={(v) => setSettings({ ...settings, enableEmail: v })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "خادم SMTP" : "SMTP Host"}</Label>
                  <Input
                    placeholder="smtp.gmail.com"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "المنفذ" : "Port"}</Label>
                  <Input
                    type="number"
                    placeholder="587"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المستخدم" : "Username"}</Label>
                  <Input
                    placeholder="user@example.com"
                    value={settings.smtpUsername}
                    onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "كلمة المرور" : "Password"}</Label>
                  <div className="relative">
                    <Input
                      type={showSmtpPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={settings.smtpPassword ?? ""}
                      onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute end-0 top-0 h-full px-3"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar"
                      ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية"
                      : "Leave empty to keep current password"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "بريد المرسل" : "From Email"}</Label>
                  <Input
                    placeholder="noreply@example.com"
                    value={settings.smtpFromEmail}
                    onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "اسم المرسل" : "From Name"}</Label>
                  <Input
                    placeholder="SmartExam System"
                    value={settings.smtpFromName}
                    onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="smtpSsl"
                  checked={settings.smtpEnableSsl}
                  onCheckedChange={(v) => setSettings({ ...settings, smtpEnableSsl: v })}
                />
                <Label htmlFor="smtpSsl">
                  {language === "ar" ? "تفعيل SSL/TLS" : "Enable SSL/TLS"}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Test Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === "ar" ? "اختبار البريد الإلكتروني" : "Test Email"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>{language === "ar" ? "البريد الإلكتروني للاختبار" : "Test Email Address"}</Label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button onClick={handleTestEmail} disabled={sendingTestEmail} variant="outline">
                  {sendingTestEmail ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Send className="h-4 w-4 me-2" />
                  )}
                  {language === "ar" ? "إرسال اختبار" : "Send Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SMS Tab ─────────────────────────────────── */}
        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{language === "ar" ? "إعدادات الرسائل القصيرة" : "SMS Configuration"}</CardTitle>
                  <CardDescription className="mt-1">
                    {language === "ar"
                      ? "إعداد مزود خدمة الرسائل القصيرة لإرسال الإشعارات"
                      : "Configure SMS provider for sending notifications"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="enableSms" className="text-sm">
                    {language === "ar" ? "تفعيل" : "Enable"}
                  </Label>
                  <Switch
                    id="enableSms"
                    checked={settings.enableSms}
                    onCheckedChange={(v) => setSettings({ ...settings, enableSms: v })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "مزود الخدمة" : "SMS Provider"}</Label>
                  <Select
                    value={String(settings.smsProvider)}
                    onValueChange={(v) => setSettings({ ...settings, smsProvider: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Twilio</SelectItem>
                      <SelectItem value="2">Vonage</SelectItem>
                      <SelectItem value="3">{language === "ar" ? "مخصص" : "Custom API"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رقم المرسل" : "From Number"}</Label>
                  <Input
                    placeholder="+1234567890"
                    value={settings.smsFromNumber}
                    onChange={(e) => setSettings({ ...settings, smsFromNumber: e.target.value })}
                  />
                </div>

                {settings.smsProvider !== 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>Account SID</Label>
                      <Input
                        value={settings.smsAccountSid}
                        onChange={(e) => setSettings({ ...settings, smsAccountSid: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Auth Token</Label>
                      <div className="relative">
                        <Input
                          type={showSmsToken ? "text" : "password"}
                          placeholder="••••••••"
                          value={settings.smsAuthToken ?? ""}
                          onChange={(e) => setSettings({ ...settings, smsAuthToken: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute end-0 top-0 h-full px-3"
                          onClick={() => setShowSmsToken(!showSmsToken)}
                        >
                          {showSmsToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === "ar"
                          ? "اتركه فارغاً للاحتفاظ بالرمز الحالي"
                          : "Leave empty to keep current token"}
                      </p>
                    </div>
                  </>
                )}

                {settings.smsProvider === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label>{language === "ar" ? "رابط API" : "API URL"}</Label>
                      <Input
                        placeholder="https://api.sms-provider.com/send"
                        value={settings.customSmsApiUrl ?? ""}
                        onChange={(e) => setSettings({ ...settings, customSmsApiUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "ar" ? "مفتاح API" : "API Key"}</Label>
                      <Input
                        type="password"
                        value={settings.customSmsApiKey ?? ""}
                        onChange={(e) => setSettings({ ...settings, customSmsApiKey: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test SMS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {language === "ar" ? "اختبار الرسائل القصيرة" : "Test SMS"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>{language === "ar" ? "رقم الهاتف للاختبار" : "Test Phone Number"}</Label>
                  <Input
                    placeholder="+1234567890"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                <Button onClick={handleTestSms} disabled={sendingTestSms} variant="outline">
                  {sendingTestSms ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Send className="h-4 w-4 me-2" />
                  )}
                  {language === "ar" ? "إرسال اختبار" : "Send Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── General Tab ─────────────────────────────── */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "إعدادات عامة" : "General Settings"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "رابط تسجيل الدخول" : "Login URL"}</Label>
                  <Input
                    placeholder="https://smartexam-sable.vercel.app/login"
                    value={settings.loginUrl}
                    onChange={(e) => setSettings({ ...settings, loginUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === "ar"
                      ? "الرابط الذي سيظهر في رسائل البريد الإلكتروني"
                      : "This URL will appear in email notifications"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">
                  {language === "ar" ? "إعدادات الدُفعات" : "Batch Settings"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "حجم دفعة البريد" : "Email Batch Size"}</Label>
                    <Input
                      type="number"
                      value={settings.emailBatchSize}
                      onChange={(e) =>
                        setSettings({ ...settings, emailBatchSize: parseInt(e.target.value) || 50 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "حجم دفعة SMS" : "SMS Batch Size"}</Label>
                    <Input
                      type="number"
                      value={settings.smsBatchSize}
                      onChange={(e) =>
                        setSettings({ ...settings, smsBatchSize: parseInt(e.target.value) || 50 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "تأخير بين الدفعات (مللي ثانية)" : "Batch Delay (ms)"}</Label>
                    <Input
                      type="number"
                      value={settings.batchDelayMs}
                      onChange={(e) =>
                        setSettings({ ...settings, batchDelayMs: parseInt(e.target.value) || 1000 })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
