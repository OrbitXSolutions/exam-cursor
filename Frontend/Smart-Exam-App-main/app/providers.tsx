"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme/context"
import { I18nProvider } from "@/lib/i18n/context"
import { AuthProvider } from "@/lib/auth/context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
