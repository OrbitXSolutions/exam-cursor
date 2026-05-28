"use client"

import { useState, useEffect } from "react"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { LanguageToggle } from "./language-toggle"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bell, User, Settings, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getLicenseStatus, type LicenseStatusResult } from "@/lib/api/license"
import { UserRole } from "@/lib/types"
import { useNotifications } from "@/lib/hooks/useNotifications"

function getLicenseBadgeStyle(stateText: string): string {
  switch (stateText) {
    case "Active":   return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700"
    case "Warning":  return "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700"
    case "GracePeriod": return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
    default:         return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
  }
}

function getLicenseBadgeLabel(stateText: string): string {
  switch (stateText) {
    case "Active":      return "License: Active"
    case "Warning":     return "License: Warning"
    case "GracePeriod": return "License: Grace Period"
    case "Expired":     return "License: Expired"
    case "Invalid":     return "License: Invalid"
    case "Missing":     return "License: Missing"
    default:            return `License: ${stateText}`
  }
}

export function Header() {
  const { t, language } = useI18n()
  const { user, logout, hasRole } = useAuth()
  const router = useRouter()
  const { unreadCount } = useNotifications()
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatusResult | null>(null)

  const isAdmin = hasRole(UserRole.Admin) || hasRole(UserRole.SuperAdmin)

  useEffect(() => {
    if (!isAdmin) return
    getLicenseStatus().then(setLicenseStatus).catch(() => null)
  }, [isAdmin])

  // Generate welcome title and date subtitle
  const welcomeTitle = user
    ? `${language === "ar" ? "مرحباً بعودتك" : "Welcome back"}, ${getLocalizedField(user, "fullName", language).split(" ")[0]}!`
    : ""
  const dateSubtitle = new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Welcome Title */}
      <div className="flex items-center gap-4">
        {user && (
          <div>
            <h1 className="text-lg font-semibold">{welcomeTitle}</h1>
            <p className="text-sm text-muted-foreground">{dateSubtitle}</p>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* License Status Badge — Admin only */}
        {isAdmin && licenseStatus && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/settings/license">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 cursor-pointer ${getLicenseBadgeStyle(licenseStatus.stateText)}`}>
                    {getLicenseBadgeLabel(licenseStatus.stateText)}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{licenseStatus.message}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex min-w-[1.1rem] h-[1.1rem] items-center justify-center rounded-full bg-destructive text-[0.6rem] font-bold text-destructive-foreground px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Theme & Language */}
        <ThemeToggle />
        <LanguageToggle />

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                  {getLocalizedField(user, "fullName", language).charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline-block max-w-32 truncate">
                  {getLocalizedField(user, "fullName", language)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getLocalizedField(user, "fullName", language)}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-primary font-medium">
                    {user.role === "Admin" && t("nav.roleAdmin")}
                    {user.role === "Instructor" && t("nav.roleInstructor")}
                    {user.role === "Candidate" && t("nav.roleCandidate")}
                    {user.role === "Proctor" && t("nav.roleProctor")}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="h-4 w-4" />
                  {t("nav.profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4" />
                  {t("nav.settings")}
                </Link>
              </DropdownMenuItem>
              {user.role !== "Candidate" && (
                <DropdownMenuItem asChild>
                  <Link href="/tutorials" className="cursor-pointer">
                    <HelpCircle className="h-4 w-4" />
                    {t("nav.userGuide") || t("nav.helpSupport")}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
