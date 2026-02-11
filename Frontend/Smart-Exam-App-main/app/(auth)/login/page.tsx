"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Eye, EyeOff, Shield, Lock, Mail, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { t, isRTL } = useI18n()

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
        // Redirect candidates to My Exams, others to Dashboard
        if (user.role === UserRole.Candidate) {
          router.push("/my-exams")
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

  const fillDemoCredentials = (userEmail: string) => {
    setEmail(userEmail)
    setPassword("Demo@123456")
  }

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">SmartExam</span>
        </Link>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Enterprise-Grade Online Examination Platform
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Secure, scalable, and compliant assessment solutions for educational institutions and enterprises.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-8">
            {[
              { label: "Active Users", value: "50,000+" },
              { label: "Exams Conducted", value: "1M+" },
              { label: "Institutions", value: "500+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-primary-foreground/10 p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-primary-foreground/60">
          © 2026 SmartExam. A product by{" "}
          <a
            href="https://www.build4it.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary-foreground"
          >
            Build4IT
          </a>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full lg:w-1/2 flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold">SmartExam</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Login Form */}
        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">{t("auth.loginTitle")}</CardTitle>
              <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

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
                  {t("auth.login")}
                </Button>

                <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium mb-3">Demo Credentials (click to fill):</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials("ahmed.it.admin@examcore.com")}
                      className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                    >
                      <span className="font-medium text-primary">Admin:</span>{" "}
                      <span className="text-muted-foreground">ahmed.it.admin@examcore.com</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials("sara.it.instructor@examcore.com")}
                      className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                    >
                      <span className="font-medium text-primary">Instructor:</span>{" "}
                      <span className="text-muted-foreground">sara.it.instructor@examcore.com</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoCredentials("ali.it.candidate@examcore.com")}
                      className="w-full text-left p-2 rounded hover:bg-background transition-colors"
                    >
                      <span className="font-medium text-primary">Candidate:</span>{" "}
                      <span className="text-muted-foreground">ali.it.candidate@examcore.com</span>
                    </button>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                      Password for all: <code className="bg-background px-1 py-0.5 rounded">Demo@123456</code>
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
