"use client"

import { BrandingProvider } from "@/lib/hooks/use-branding"
import { BrandHeader, BrandFooter } from "@/components/layout/brand-chrome"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme/context"
import { I18nProvider, useI18n } from "@/lib/i18n/context"
import { AuthProvider } from "@/lib/auth/context"
import { Toaster } from "sonner"

function AppToaster() {
  const { dir } = useI18n()

  return (
    <Toaster
      dir={dir}
      position={dir === "rtl" ? "top-left" : "top-right"}
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
      }}
    />
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <BrandingProvider>
            <div className="flex min-h-dvh flex-col">
              <BrandHeader />
              <div className="min-w-0 flex-1">{children}</div>
              <BrandFooter />
            </div>
            <AppToaster />
          </BrandingProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
