"use client"

import type React from "react"
import { useAuth } from "@/lib/auth/context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useApplyBrandingColor } from "@/lib/hooks/use-branding"

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Apply organization primary color to all candidate pages
  useApplyBrandingColor()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
