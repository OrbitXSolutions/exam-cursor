"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { isRTL } = useI18n()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
