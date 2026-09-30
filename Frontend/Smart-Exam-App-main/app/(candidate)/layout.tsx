"use client"

import type React from "react"
import { useAuth } from "@/lib/auth/context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { UserRole } from "@/lib/types"

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()


  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    // Non-candidate staff should not access the candidate portal
    if (!isLoading && user && user.role !== UserRole.Candidate) {
      router.replace("/unauthorized")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-[var(--app-viewport-height)] flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Synchronous render-time gate — blocks non-Candidate staff from mounting children
  // (and firing API calls) before the useEffect redirect executes.
  if (user.role !== UserRole.Candidate) {
    return (
      <div className="min-h-[var(--app-viewport-height)] flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}
