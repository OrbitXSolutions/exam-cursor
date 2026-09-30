"use client"

import Image from "next/image"

import type { ReactNode } from "react"
import Link from "next/link"
import { BRAND_ASSETS, DEFAULT_BRANDING } from "@/lib/branding"
import { useBranding } from "@/lib/hooks/use-branding"
import { useI18n } from "@/lib/i18n/context"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ExternalLoginButtons } from "./external-login-buttons"

export function LoginShell({ candidate, returnUrl, children }: {
  candidate?: boolean; returnUrl: string | null; children: ReactNode
}) {
  const { language, dir } = useI18n()
  const { orgName } = useBranding()
  const ar = language === "ar"
  return (
    <main className="login-shell" dir="ltr">
      <section className="login-introduction" dir={dir} aria-labelledby="login-heading">
        <Image fill priority sizes="(max-width: 1100px) 100vw, 75vw" src={BRAND_ASSETS.background} className="login-background" alt="" aria-hidden="true" />
        <div className="relative">
          <h1 id="login-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">{ar && orgName === DEFAULT_BRANDING.name ? "منصة اختبارات دبي الرقمية" : orgName}</h1>
          <h2 className="mt-4 text-xl font-medium sm:text-2xl">{ar ? "منصة الاختبارات والتقييم الآمن" : "Secure Examination and Assessment Platform"}</h2>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground">
            {ar
              ? candidate ? "بوابتك الآمنة للاختبارات. سجّل الدخول للوصول إلى الاختبارات المخصصة لك، وإكمال التقييمات، والاطلاع على نتائجك عبر منصة موثوقة." : "بوابة موحدة لإدارة الاختبارات والتقييمات. سجّل الدخول لإعداد الاختبارات وإدارتها ومراقبتها ومراجعة النتائج وفق صلاحيات حسابك."
              : candidate ? "Your secure gateway to examinations. Sign in to access your assigned exams, complete assessments, and view your results through a trusted digital platform." : "A unified gateway for examination and assessment management. Sign in to prepare, manage and monitor exams, and review results with your existing account permissions."}
          </p>
        </div>
      </section>
      <section className="login-access" dir={dir} aria-label={ar ? "تسجيل الدخول" : "Sign in"}>
        <nav className="flex w-full items-center justify-between gap-2" aria-label={ar ? "خيارات الدخول" : "Login options"}>
          <Link className="text-sm text-primary hover:underline" href={candidate ? "/login" : "/candidate-login"}>
            {candidate ? ar ? "دخول الموظفين" : "Staff login" : ar ? "دخول المرشحين" : "Candidate login"}
          </Link>
          <div className="flex items-center"><LanguageToggle /><ThemeToggle /></div>
        </nav>
        <div className="login-access-group">
          <div className="login-secure-card">
            <h2 className="text-center text-2xl font-bold">{ar ? "دخول آمن" : "Secure Access"}</h2>
            <p className="mb-6 mt-3 text-center text-sm text-muted-foreground">{ar ? "اختر مزود الهوية للمتابعة" : "Choose your identity provider to continue"}</p>
            <ExternalLoginButtons returnUrl={returnUrl} />
            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">{ar ? "الدخول متاح للمؤسسات والمستخدمين المصرح لهم فقط." : "Access is restricted to authorized organizations and users only."}</p>
          </div>
          <details className="login-account-panel group">
            <summary className="cursor-pointer rounded-lg p-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
              {ar ? "دخول بالحساب الحالي / حسابات التطوير والاختبار" : "Existing account / development & test sign in"}
            </summary>
            <div className="border-t p-4 sm:p-5">{children}</div>
          </details>
        </div>
      </section>
    </main>
  )
}
