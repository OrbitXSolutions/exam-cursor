"use client"

import Image from "next/image"

import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { BRAND_ASSETS } from "@/lib/branding"

export function ExternalLoginButtons({ returnUrl }: { returnUrl: string | null }) {
  const { language } = useI18n()
  const ar = language === "ar"
  const [providers, setProviders] = useState({ uaePass: false, government: false })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/sso/providers", { signal: controller.signal, cache: "no-store" })
      .then(async (r) => { if (r.ok) setProviders(await r.json()) })
      .catch(() => { /* Password sign-in remains available when SSO is unavailable. */ })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])
  const href = (provider: string) => `/api/sso/start/${provider}?${new URLSearchParams({
    language: ar ? "ar" : "en", ...(returnUrl ? { returnUrl } : {}),
  })}`
  const governmentLabel = ar ? "تسجيل الدخول الموحد لحكومة دبي" : "Government Sign in (SSO)"
  const uaeLabel = ar ? "تسجيل الدخول بالهوية الرقمية" : "Sign in with UAE PASS"
  const governmentContent = <><Image width={99} height={97} src={BRAND_ASSETS.favicon} alt="" className="h-7 w-7 shrink-0" /><span>{governmentLabel}</span></>
  const uaeContent = ar
    ? <><Image width={48} height={50} src={BRAND_ASSETS.uaePassLogo} alt="" className="h-8 w-8 shrink-0" /><span>{uaeLabel}</span></>
    : <Image width={264} height={50} src={BRAND_ASSETS.uaePassButton} alt={uaeLabel} className="block w-full" />
  return <div className="space-y-3" aria-busy={loading}>
    {providers.government
      ? <a className="provider-button" href={href("government")}>{governmentContent}</a>
      : <button className="provider-button" type="button" disabled>{governmentContent}</button>}
    {providers.uaePass
      ? <a className={`provider-button provider-uaepass ${ar ? "" : "provider-uaepass-image"}`} href={href("uaepass")}>{uaeContent}</a>
      : <button className={`provider-button provider-uaepass ${ar ? "" : "provider-uaepass-image"}`} type="button" disabled>{uaeContent}</button>}
    {!loading && (!providers.government || !providers.uaePass) && <p className="text-center text-xs leading-relaxed text-muted-foreground" role="status">
      {ar ? "بعض خيارات الدخول غير متاحة حالياً. يمكنك استخدام حسابك الحالي أدناه." : "Some sign-in options are currently unavailable. You can use your existing account below."}
    </p>}
  </div>
}
