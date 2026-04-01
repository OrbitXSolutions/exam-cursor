"use client"

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
          {children}
          <AppToaster />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
