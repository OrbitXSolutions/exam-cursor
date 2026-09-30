"use client"

import type React from "react"
import { LoginShell } from "@/components/auth/login-shell"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function CandidateLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const { login, isLoading } = useAuth()
  const { t, language } = useI18n()

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
          if (returnUrl) {
            router.push(returnUrl)
            return
          }
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

  return (
    <LoginShell candidate returnUrl={returnUrl}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              dir="ltr"
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
              dir="ltr"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              aria-label={language === "ar" ? (showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور") : (showPassword ? "Hide password" : "Show password")}
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
              className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors"
            >
              <span className="font-medium text-primary">
                {language === "ar" ? "مرشح 1:" : "Candidate 1:"}
              </span>{" "}
              <span className="text-muted-foreground">ali.it.candidate@examcore.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("nour.it.candidate@examcore.com")}
              className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors"
            >
              <span className="font-medium text-primary">
                {language === "ar" ? "مرشح 2:" : "Candidate 2:"}
              </span>{" "}
              <span className="text-muted-foreground">nour.it.candidate@examcore.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("youssef.finance.candidate@examcore.com")}
              className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors"
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
    </LoginShell>
  )
}
