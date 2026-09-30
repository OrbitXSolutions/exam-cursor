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

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const { login, isLoading } = useAuth()
  const { t, isRTL, language } = useI18n()

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
      // Get user from localStorage to determine role-based redirect
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        // Redirect candidates: if already verified go to My Exams, otherwise verify-identity
        if (user.role === UserRole.Candidate) {
          // If coming from a share link, go directly there
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
        } else if (user.role === "Examiner") {
          router.push("/grading")
        } else if (user.role === "Proctor") {
          router.push("/proctor-center")
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/dashboard")
      }
    } else {
      setError(t("errors.invalidCredentials"))
    }
  }

  const fillDemoCredentials = (userEmail: string, userPassword = "Demo@123456") => {
    setEmail(userEmail)
    setPassword(userPassword)
  }

  return (
    <LoginShell returnUrl={returnUrl}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}

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
          {t("auth.login")}
        </Button>

        <div className="text-center">
          <Link
            href="/candidate-login"
            className="text-sm text-primary hover:underline font-medium"
          >
            {isRTL ? "تسجيل الدخول كمرشح →" : "Login as Candidate →"}
          </Link>
        </div>

        <div className="mt-4 rounded-lg bg-muted p-4 text-sm max-h-80 overflow-y-auto">
          <p className="font-medium mb-3">Demo Credentials (click to fill):</p>
          <div className="space-y-3">
            {/* SuperAdmin */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">System</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemoCredentials("super-admin@smartexam.local", "Smart@26Super5")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors border border-primary/20">
                  <span className="font-medium text-primary">SuperAdmin:</span>{" "}
                  <span className="text-muted-foreground">super-admin@smartexam.local</span>
                  <span className="ms-2 text-xs text-muted-foreground">(pw: Smart@26Super5)</span>
                </button>
              </div>
            </div>
            {/* IT Department */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">IT Department</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemoCredentials("ahmed.it.admin@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Admin:</span>{" "}
                  <span className="text-muted-foreground">ahmed.it.admin@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("sara.it.instructor@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Instructor:</span>{" "}
                  <span className="text-muted-foreground">sara.it.instructor@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("omar.it.examiner@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Examiner:</span>{" "}
                  <span className="text-muted-foreground">omar.it.examiner@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("layla.it.proctor@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Proctor:</span>{" "}
                  <span className="text-muted-foreground">layla.it.proctor@examcore.com</span>
                </button>
              </div>
            </div>
            {/* HR Department */}
            <div className="border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">HR Department</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemoCredentials("mona.hr.admin@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Admin:</span>{" "}
                  <span className="text-muted-foreground">mona.hr.admin@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("huda.hr.instructor@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Instructor:</span>{" "}
                  <span className="text-muted-foreground">huda.hr.instructor@examcore.com</span>
                </button>
              </div>
            </div>
            {/* Finance Department */}
            <div className="border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Finance Department</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemoCredentials("tarek.finance.admin@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Admin:</span>{" "}
                  <span className="text-muted-foreground">tarek.finance.admin@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("dina.finance.instructor@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Instructor:</span>{" "}
                  <span className="text-muted-foreground">dina.finance.instructor@examcore.com</span>
                </button>
              </div>
            </div>
            {/* Candidates */}
            <div className="border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Candidates</p>
              <div className="space-y-1">
                <button type="button" onClick={() => fillDemoCredentials("ali.it.candidate@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Ali Mahmoud:</span>{" "}
                  <span className="text-muted-foreground">ali.it.candidate@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("nour.it.candidate@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Nour Ahmed:</span>{" "}
                  <span className="text-muted-foreground">nour.it.candidate@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("youssef.finance.candidate@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Youssef Adel:</span>{" "}
                  <span className="text-muted-foreground">youssef.finance.candidate@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("ahmed.hr.candidate@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Ahmed Nabil:</span>{" "}
                  <span className="text-muted-foreground">ahmed.hr.candidate@examcore.com</span>
                </button>
                <button type="button" onClick={() => fillDemoCredentials("salma.hr.candidate@examcore.com")} className="w-full break-all text-start p-2 rounded hover:bg-background transition-colors">
                  <span className="font-medium text-primary">Salma Hussein:</span>{" "}
                  <span className="text-muted-foreground">salma.hr.candidate@examcore.com</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Password for all: <code className="bg-background px-1 py-0.5 rounded">Demo@123456</code>
            </p>
          </div>
        </div>
      </form>
    </LoginShell>
  )
}
