"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth, type LoginApiResponse } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LanguageToggle } from "@/components/layout/language-toggle"

interface ExternalSession {
  provider: string; name: string; email: string; linked: boolean; csrfToken: string; returnUrl: string | null
}

export default function ExternalLoginPage() {
  const { language } = useI18n()
  const ar = language === "ar"
  const { acceptSession } = useAuth()
  const router = useRouter()
  const search = useSearchParams()
  const providerFailed = search.has("error")
  const [session, setSession] = useState<ExternalSession | null>(null)
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (providerFailed) return
    const controller = new AbortController()
    fetch("/api/sso/session", { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) { setExpired(true); return }
        setSession(await r.json())
      }).catch(() => { if (!controller.signal.aborted) setExpired(true) })
    return () => controller.abort()
  }, [providerFailed])

  const messages: Record<string, string> = {
    "No matching corporate account was found. Please contact the support team.": "لم يتم العثور على حساب مؤسسي مطابق. يرجى التواصل مع فريق الدعم.",
    "Invalid corporate account or password.": "الحساب المؤسسي أو كلمة المرور غير صحيحة.",
    "Account locked out. Please try again later.": "تم قفل الحساب مؤقتًا. يرجى المحاولة لاحقًا.",
    "Your account is unavailable. Please contact support.": "حسابك غير متاح. يرجى التواصل مع الدعم.",
    "This corporate account is already linked to another identity. Please contact support.": "هذا الحساب المؤسسي مرتبط بهوية أخرى. يرجى التواصل مع الدعم.",
  }

  const complete = async (event: FormEvent) => {
    event.preventDefault()
    if (!session || busy) return
    setBusy(true)
    setError("")
    try {
      const response = await fetch(`/api/sso/${session.linked ? "complete" : "link"}`, {
        method: "POST", headers: { "Content-Type": "application/json", "X-SSO-CSRF": session.csrfToken },
        body: JSON.stringify(session.linked ? {} : { account, password }),
      })
      const result: LoginApiResponse = await response.json()
      setPassword("")
      if (response.status === 401) { setExpired(true); return }
      if (!response.ok || !result.success || !result.data) {
        setError(ar ? messages[result.message] || "تعذر إكمال تسجيل الدخول. يرجى المحاولة مجددًا أو التواصل مع الدعم." : result.message || "Sign in failed. Please try again.")
        return
      }
      const user = acceptSession(result.data)
      if (user.role === "Candidate") {
        if (session.returnUrl) { router.replace(session.returnUrl); return }
        try {
          const { getCandidateVerificationStatus } = await import("@/lib/api/proctoring")
          const status = await getCandidateVerificationStatus()
          router.replace(status.status === "Approved" ? "/my-exams" : "/verify-identity")
        } catch { router.replace("/verify-identity") }
      } else router.replace(user.role === "Examiner" ? "/grading" : user.role === "Proctor" ? "/proctor-center" : "/dashboard")
    } catch { setError(ar ? "تعذر الاتصال بخدمة تسجيل الدخول. حاول مجددًا." : "Unable to contact the sign-in service. Please try again.") }
    finally { setBusy(false) }
  }

  const cancel = async () => {
    if (session) await fetch("/api/sso/cancel", {
      method: "POST", headers: { "X-SSO-CSRF": session.csrfToken },
    }).catch(() => {})
    router.replace("/login")
  }

  return <main className="flex min-h-screen items-center justify-center p-4" dir={ar ? "rtl" : "ltr"}>
    <Card className="w-full max-w-md">
      <CardHeader><div className="flex justify-end"><LanguageToggle /></div>
        <CardTitle>{ar ? "إكمال تسجيل الدخول" : "Complete sign in"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(providerFailed || expired) ? <>
          <p role="alert">{ar ? "لم تكتمل عملية تسجيل الدخول أو انتهت صلاحيتها. يرجى البدء مجددًا." : "External sign-in failed, was cancelled, or expired. Please start again."}</p>
          <Button asChild><Link href="/login">{ar ? "العودة لتسجيل الدخول" : "Back to sign in"}</Link></Button>
        </> : !session ? <p role="status">{ar ? "جارٍ التحقق من تسجيل الدخول…" : "Checking your sign-in…"}</p> : <>
          <p>{ar ? "تم التحقق من هويتك عبر" : "Your identity was authenticated with"} {session.provider === "uaepass" ? "UAE PASS" : "Digital Dubai / Government SSO"}.</p>
          <div className="rounded border p-3"><p className="font-semibold">{session.name}</p><p dir="ltr" className="break-all">{session.email}</p></div>
          <p>{session.linked ? (ar ? "متابعة باستخدام حسابك المؤسسي المرتبط." : "Continue using your linked corporate account.") :
            (ar ? "للمتابعة، أدخل حسابك المؤسسي الموجود وكلمة المرور لإثبات ملكيتك وربط هويتك به." : "To continue, enter your existing corporate account and password to verify ownership and link this identity.")}</p>
          <form onSubmit={complete} className="space-y-4">
            {!session.linked && <>
              <div className="space-y-2"><Label htmlFor="corporate-account">{ar ? "البريد المؤسسي أو اسم المستخدم" : "Corporate email or username"}</Label>
                <Input id="corporate-account" autoComplete="username" maxLength={256} value={account} onChange={(e) => setAccount(e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="corporate-password">{ar ? "كلمة مرور الحساب المؤسسي" : "Corporate account password"}</Label>
                <Input id="corporate-password" type="password" autoComplete="current-password" maxLength={1024} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Link href="/forgot-password" className="text-sm underline">{ar ? "نسيت كلمة المرور؟" : "Forgot password?"}</Link>
            </>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} type="submit">{busy ? (ar ? "جارٍ المتابعة…" : "Continuing…") : session.linked ? (ar ? "متابعة" : "Continue") : (ar ? "ربط الحساب والمتابعة" : "Link account and continue")}</Button>
            <Button className="w-full" variant="outline" type="button" onClick={cancel} disabled={busy}>{ar ? "إلغاء" : "Cancel"}</Button>
          </form>
        </>}
      </CardContent>
    </Card>
  </main>
}
