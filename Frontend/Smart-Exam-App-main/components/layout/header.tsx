"use client"

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
import { Bell, User, Settings, LogOut, HelpCircle } from "lucide-react"
import Link from "next/link"

export function Header() {
  const { t, language } = useI18n()
  const { user, logout } = useAuth()

  // Generate welcome title and date subtitle
  const welcomeTitle = user
    ? `${language === "ar" ? "مرحباً بعودتك" : "Welcome back"}, ${getLocalizedField(user, "fullName", language).split(" ")[0]}!`
    : ""
  const dateSubtitle = new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
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
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
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
                  <User className="mr-2 h-4 w-4" />
                  {t("nav.profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  {t("nav.settings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                {t("nav.helpSupport")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
