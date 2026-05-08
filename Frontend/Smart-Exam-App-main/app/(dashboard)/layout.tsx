"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { FullPageLoader } from "@/components/ui/loading-spinner"
import { useApplyBrandingColor } from "@/lib/hooks/use-branding"
import { UserRole } from "@/lib/types"
import { LicenseExpiredDialog } from "@/components/license-expired-dialog"

// Route-to-allowed-roles map — mirrors sidebar access matrix.
// Paths not listed here are open to all authenticated users (dashboard, profile, tutorials, journey).
const ROUTE_ROLE_MAP: { prefix: string; roles: UserRole[] }[] = [
  // SuperAdmin only
  { prefix: "/users",           roles: [UserRole.SuperAdmin] },
  { prefix: "/departments",     roles: [UserRole.SuperAdmin] },
  { prefix: "/organization",    roles: [UserRole.SuperAdmin] },
  { prefix: "/settings/license",roles: [UserRole.SuperAdmin] },
  { prefix: "/notifications",   roles: [UserRole.SuperAdmin] },
  { prefix: "/audit",           roles: [UserRole.SuperAdmin] },
  { prefix: "/logs",            roles: [UserRole.SuperAdmin] },
  // Admin + Instructor + SuperAdmin
  { prefix: "/question-bank",   roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor] },
  { prefix: "/lookups",         roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor] },
  { prefix: "/exams",           roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor] },
  { prefix: "/candidates",      roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor] },
  // Admin + Examiner + SuperAdmin
  { prefix: "/grading",         roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Examiner] },
  { prefix: "/results",         roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Examiner] },
  // Admin + Proctor + SuperAdmin (Instructor included for /proctor/assign)
  { prefix: "/proctor-center",  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Proctor] },
  { prefix: "/proctor",         roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Proctor, UserRole.Instructor] },
  // Candidate only (within dashboard layout)
  { prefix: "/my-exams",        roles: [UserRole.Candidate] },
  { prefix: "/my-results",      roles: [UserRole.Candidate] },
  { prefix: "/verify-identity", roles: [UserRole.Candidate] },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, hasRole, user } = useAuth()
  const { isRTL } = useI18n()

  // Apply organization primary color for candidate users
  const isCandidate = hasRole(UserRole.Candidate)
  useApplyBrandingColor(isCandidate)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Route-role guard: redirect if the user's role is not permitted on this path
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return
    const matched = ROUTE_ROLE_MAP.find(
      ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
    if (matched && !matched.roles.includes(user.role)) {
      router.replace("/unauthorized")
    }
  }, [pathname, user, isLoading, isAuthenticated, router]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <FullPageLoader />
  }

  if (!isAuthenticated) {
    return null
  }

  // Synchronous render-time gate — prevents children from mounting (and firing API calls)
  // before the useEffect redirect executes. Must come AFTER the isLoading/isAuthenticated checks.
  if (user) {
    const matched = ROUTE_ROLE_MAP.find(
      ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/")
    )
    if (matched && !matched.roles.includes(user.role)) {
      return <FullPageLoader />
    }
  }

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <LicenseExpiredDialog />
    </div>
  )
}
