"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  Users,
  GraduationCap,
  Shield,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  BookOpen,
  BarChart3,
  Eye,
  Settings,
  FolderTree,
  ListTree,
  Award,
  CheckCircle2,
  Monitor,
  UserCheck,
  Layers,
} from "lucide-react"

interface NavItem {
  icon: React.ElementType
  labelKey: string
  href: string
  roles?: UserRole[]
  badge?: number
}

interface NavGroup {
  icon: React.ElementType
  labelKey: string
  roles?: UserRole[]
  children: NavItem[]
}

const mainNavItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    labelKey: "nav.dashboard",
    href: "/dashboard",
  },
]

const candidateNavItems: NavItem[] = [
  {
    icon: BookOpen,
    labelKey: "nav.myExams",
    href: "/my-exams",
    roles: [UserRole.Candidate],
  },
  {
    icon: BarChart3,
    labelKey: "nav.myResults",
    href: "/my-results",
    roles: [UserRole.Candidate],
  },
]

const instructorNavItems: NavItem[] = [
  {
    icon: FileQuestion,
    labelKey: "nav.questionBank",
    href: "/question-bank",
    roles: [UserRole.Admin, UserRole.Instructor],
  },
  {
    icon: FolderTree,
    labelKey: "nav.questionCategories",
    href: "/lookups/question-categories",
    roles: [UserRole.Admin],
  },
  {
    icon: ListTree,
    labelKey: "nav.questionTypes",
    href: "/lookups/question-types",
    roles: [UserRole.Admin],
  },
  {
    icon: ClipboardList,
    labelKey: "nav.exams",
    href: "/exams",
    roles: [UserRole.Admin, UserRole.Instructor],
  },
  {
    icon: GraduationCap,
    labelKey: "nav.grading",
    href: "/grading",
    roles: [UserRole.Admin, UserRole.Instructor],
  },
  {
    icon: BarChart3,
    labelKey: "nav.reports",
    href: "/reports",
    roles: [UserRole.Admin, UserRole.Instructor],
  },
]

const resultNavGroup: NavGroup = {
  icon: CheckCircle2,
  labelKey: "nav.result",
  roles: [UserRole.Admin, UserRole.Instructor],
  children: [
    { icon: BarChart3, labelKey: "nav.candidateResult", href: "/results/candidate-result" },
    { icon: BarChart3, labelKey: "nav.examAnalytics", href: "/results/exam-analytics" },
    { icon: FileText, labelKey: "nav.subjectiveExamAnalytics", href: "/results/subjective-analytics" },
    { icon: Eye, labelKey: "nav.proctorAnalytics", href: "/results/proctor-analytics" },
    { icon: Award, labelKey: "nav.editCertificate", href: "/results/edit-certificate" },
    { icon: Users, labelKey: "nav.leadershipBoard", href: "/results/leadership-board" },
    { icon: FileQuestion, labelKey: "nav.questionwiseAnalysis", href: "/results/questionwise-analysis" },
  ],
}

const proctorNavGroup: NavGroup = {
  icon: Monitor,
  labelKey: "nav.proctor",
  roles: [UserRole.Admin, UserRole.Instructor, UserRole.ProctorReviewer],
  children: [
    { icon: LayoutDashboard, labelKey: "nav.proctorDashboard", href: "/proctor-center" },
    { icon: UserCheck, labelKey: "nav.assignToProctor", href: "/proctor/assign" },
    { icon: Layers, labelKey: "nav.bulkAuthApproval", href: "/proctor/bulk-auth" },
    { icon: Users, labelKey: "nav.userIdentification", href: "/proctor/user-identification" },
  ],
}

const adminNavItems: NavItem[] = [
  {
    icon: Users,
    labelKey: "nav.users",
    href: "/users",
    roles: [UserRole.Admin, UserRole.SuperAdmin],
  },
  {
    icon: Award,
    labelKey: "nav.verifyCertificate",
    href: "/verify-certificate",
    roles: [UserRole.Admin, UserRole.SuperAdmin, UserRole.Instructor],
  },
  {
    icon: FileText,
    labelKey: "nav.audit",
    href: "/audit",
    roles: [UserRole.Admin, UserRole.SuperAdmin, UserRole.Auditor],
  },
  {
    icon: Settings,
    labelKey: "nav.settings",
    href: "/settings",
    roles: [UserRole.Admin, UserRole.SuperAdmin],
  },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ result: true, proctor: true })
  const pathname = usePathname()
  const { t, isRTL, language } = useI18n()
  const { user, logout, hasRole } = useAuth()

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.roles) return true
      return item.roles.some((role) => hasRole(role))
    })
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
    const Icon = item.icon
    const label = t(item.labelKey) || item.labelKey.split(".").pop()

    const link = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
          isCollapsed && "justify-center px-2",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{label}</span>}
        {!isCollapsed && item.badge && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side={isRTL ? "left" : "right"} className="flex items-center gap-2">
            {label}
            {item.badge && <span className="text-destructive">({item.badge})</span>}
          </TooltipContent>
        </Tooltip>
      )
    }

    return link
  }

  const showGroup = (group: NavGroup) => {
    if (!group.roles?.length) return true
    return group.roles.some((r) => hasRole(r))
  }

  const NavGroupBlock = ({ group, groupKey }: { group: NavGroup; groupKey: string }) => {
    const isOpen = openGroups[groupKey] ?? true
    const Icon = group.icon
    const label = t(group.labelKey) || group.labelKey.split(".").pop()
    const children = filterByRole(group.children)
    if (children.length === 0) return null

    if (isCollapsed) {
      return (
        <>
          {children.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </>
      )
    }

    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 truncate text-start">{label}</span>
          {isRTL ? (
            isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          ) : (
            isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
          )}
        </button>
        {isOpen && (
          <div className="ms-6 space-y-0.5 border-s border-muted ps-2">
            {children.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">SmartExam</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", isCollapsed && "mx-auto")}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              isRTL ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : isRTL ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Main Nav */}
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}

            {/* Candidate Nav */}
            {hasRole(UserRole.Candidate) && filterByRole(candidateNavItems).length > 0 && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "بوابة المرشح" : "Candidate Portal"}
                  </div>
                )}
                {filterByRole(candidateNavItems).map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}

            {/* Instructor Nav */}
            {filterByRole(instructorNavItems).length > 0 && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "إدارة الاختبارات" : "Exam Management"}
                  </div>
                )}
                {filterByRole(instructorNavItems).map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}

            {/* Result (expandable) */}
            {showGroup(resultNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "النتائج" : "Result"}
                  </div>
                )}
                <NavGroupBlock group={resultNavGroup} groupKey="result" />
              </>
            )}

            {/* Proctor (expandable) */}
            {showGroup(proctorNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "المراقبة" : "Proctor"}
                  </div>
                )}
                <NavGroupBlock group={proctorNavGroup} groupKey="proctor" />
              </>
            )}

            {/* Admin Nav */}
            {filterByRole(adminNavItems).length > 0 && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "الإدارة" : "Administration"}
                  </div>
                )}
                {filterByRole(adminNavItems).map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="border-t p-3">
          {user && (
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {getLocalizedField(user, "fullName", language).charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{getLocalizedField(user, "fullName", language)}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.role}</p>
                </div>
              )}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "left" : "right"}>{t("nav.logout")}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
