"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

export function ExternalLoginButtons({ returnUrl }: { returnUrl: string | null }) {
  const { language } = useI18n()
  const ar = language === "ar"
  const [providers, setProviders] = useState({ uaePass: false, government: false })
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/sso/providers", { signal: controller.signal, cache: "no-store" })
      .then(async (r) => { if (r.ok) setProviders(await r.json()) })
      .catch(() => { /* Password sign-in remains available when SSO is unavailable. */ })
    return () => controller.abort()
  }, [])
  if (!providers.uaePass && !providers.government) return null
  const href = (provider: string) => `/api/sso/start/${provider}?${new URLSearchParams({
    language: ar ? "ar" : "en", ...(returnUrl ? { returnUrl } : {}),
  })}`
  return <div className="mb-5 space-y-3">
    {providers.uaePass && <Button asChild variant="outline" className="w-full">
      <a href={href("uaepass")}>{ar ? "تسجيل الدخول بالهوية الرقمية" : "Sign in with UAE PASS"}</a>
    </Button>}
    {providers.government && <Button asChild variant="outline" className="w-full">
      <a href={href("government")}>{ar ? "تسجيل الدخول الموحد لحكومة دبي" : "Digital Dubai / Government SSO"}</a>
    </Button>}
    <p className="text-center text-sm text-muted-foreground">{ar ? "أو استخدم حسابك الحالي" : "Or use your existing account"}</p>
  </div>
}
