"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { UserRole } from "@/lib/types"
import { useBranding } from "@/lib/hooks/use-branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Shield, Phone, Globe, MailIcon } from "lucide-react"

export default function CandidateLoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { t, isRTL, language } = useI18n()
  const { branding, loading: brandingLoading, hasOrgBranding, logoSrc, orgName } = useBranding()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const success = await login(email, password)
    if (success) {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        if (user.role === UserRole.Candidate) {
          try {
            const { getCandidateVerificationStatus } = await import("@/lib/api/proctoring")
            const vs = await getCandidateVerificationStatus()
            if (vs.status === "Approved") {
              router.push("/my-exams")
            } else {
              router.push("/verify-identity")
            }
          } catch {
            router.push("/verify-identity")
          }
        } else {
          // Non-candidate logged in from candidate page — redirect to dashboard
          router.push("/dashboard")
        }
      } else {
        router.push("/dashboard")
      }
    } else {
      setError(language === "ar" ? "بيانات الاعتماد غير صحيحة" : "Invalid credentials. Please try again.")
    }
  }

  const fillDemoCredentials = (userEmail: string) => {
    setEmail(userEmail)
    setPassword("Demo@123456")
  }

  // Check for org contact info to display
  const hasContactInfo = branding.supportEmail || branding.mobileNumber || branding.officeNumber || branding.supportUrl

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{language === "ar" ? "تسجيل الدخول كمسؤول" : "Staff Login"}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Logo & Organization Info */}
      <div className="mb-6 flex flex-col items-center gap-3 mt-12">
        {brandingLoading ? (
          <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
        ) : logoSrc ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-white shadow-sm">
            <img
              src={logoSrc}
              alt={orgName}
              className="h-full w-full object-contain p-1"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield className="h-9 w-9" />
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{orgName}</h1>
          {hasOrgBranding && branding.footerText && (
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">{branding.footerText}</p>
          )}
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-1 text-center pb-4">
          <CardTitle className="text-xl font-semibold">
            {language === "ar" ? "بوابة المرشحين" : "Candidate Portal"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "سجل دخولك للوصول إلى اختباراتك" : "Sign in to access your exams"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">
                {t("auth.rememberMe")}
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {language === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Button>

            {/* Demo Credentials */}
            <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-3">
                {language === "ar" ? "بيانات تجريبية (انقر للتعبئة):" : "Demo Credentials (click to fill):"}
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("ali.it.candidate@examcore.com")}
                  className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                >
                  <span className="font-medium text-primary">
                    {language === "ar" ? "مرشح 1:" : "Candidate 1:"}
                  </span>{" "}
                  <span className="text-muted-foreground">ali.it.candidate@examcore.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("nour.it.candidate@examcore.com")}
                  className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                >
                  <span className="font-medium text-primary">
                    {language === "ar" ? "مرشح 2:" : "Candidate 2:"}
                  </span>{" "}
                  <span className="text-muted-foreground">nour.it.candidate@examcore.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("youssef.finance.candidate@examcore.com")}
                  className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                >
                  <span className="font-medium text-primary">
                    {language === "ar" ? "مرشح 3:" : "Candidate 3:"}
                  </span>{" "}
                  <span className="text-muted-foreground">youssef.finance.candidate@examcore.com</span>
                </button>
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  {language === "ar" ? "كلمة المرور:" : "Password:"}{" "}
                  <code className="bg-background px-1 py-0.5 rounded">Demo@123456</code>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Organization Contact Info Footer */}
      {hasOrgBranding && hasContactInfo && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          {branding.supportEmail && (
            <a href={`mailto:${branding.supportEmail}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <MailIcon className="h-3 w-3" />
              {branding.supportEmail}
            </a>
          )}
          {branding.mobileNumber && (
            <a href={`tel:${branding.mobileNumber}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Phone className="h-3 w-3" />
              {branding.mobileNumber}
            </a>
          )}
          {branding.officeNumber && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {branding.officeNumber}
            </span>
          )}
          {branding.supportUrl && (
            <a href={branding.supportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <Globe className="h-3 w-3" />
              {language === "ar" ? "الدعم" : "Support"}
            </a>
          )}
        </div>
      )}

      {/* Powered by footer */}
      <div className="mt-4 text-xs text-muted-foreground/60 text-center">
        © 2026{" "}
        {hasOrgBranding ? (
          <>
            {orgName} · Powered by{" "}
            <a href="https://www.build4it.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">
              Build4IT
            </a>
          </>
        ) : (
          <>
            SmartExam · A product by{" "}
            <a href="https://www.build4it.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">
              Build4IT
            </a>
          </>
        )}
      </div>
    </div>
  )
}
