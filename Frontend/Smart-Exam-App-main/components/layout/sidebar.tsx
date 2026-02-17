"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/lib/types"
import { getCandidateVerificationStatus } from "@/lib/api/proctoring"
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
  Hash,
  Library,
  PlusSquare,
  List,
  Calendar,
  UserCog,
  UsersRound,
  UserPlus,
  Clock,
  TimerOff,
  PlayCircle,
  ClipboardCheck,
  Building2,
  Wrench,
  ShieldCheck,
} from "lucide-react"

interface NavItem {
  icon: React.ElementType
  labelKey: string
  href: string
  roles?: UserRole[]
  badge?: number
  hidden?: boolean
  exact?: boolean
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
    hidden: true,
  },
]

const questionBankNavGroup: NavGroup = {
  icon: Library,
  labelKey: "nav.questionBank",
  roles: [UserRole.Admin, UserRole.Instructor],
  children: [
    { icon: BookOpen, labelKey: "nav.subjects", href: "/lookups/subjects" },
    { icon: Hash, labelKey: "nav.topics", href: "/lookups/topics" },
    { icon: ListTree, labelKey: "nav.questionTypes", href: "/lookups/question-types" },
    { icon: FileQuestion, labelKey: "nav.questions", href: "/question-bank" },
  ],
}

// Exam Management group: Hide "Exams" item, add "Exam Scheduler"
const examsNavGroup: NavGroup = {
  icon: ClipboardList,
  labelKey: "nav.examManagement",
  roles: [UserRole.Admin, UserRole.Instructor],
  children: [
    { icon: ClipboardList, labelKey: "nav.exams", href: "/exams", hidden: true },
    { icon: PlusSquare, labelKey: "nav.createExam", href: "/exams/setup" },
    { icon: List, labelKey: "nav.examsList", href: "/exams/list" },
    { icon: Calendar, labelKey: "nav.examScheduler", href: "/exams/scheduler", hidden: true },
  ],
}

// Result group with reordered items per requirements
const resultNavGroup: NavGroup = {
  icon: CheckCircle2,
  labelKey: "nav.result",
  roles: [UserRole.Admin, UserRole.Instructor, UserRole.Examiner],
  children: [
    { icon: GraduationCap, labelKey: "nav.grading", href: "/grading" },
    { icon: BarChart3, labelKey: "nav.candidateResult", href: "/results/candidate-result", roles: [UserRole.Admin, UserRole.Instructor] },
    { icon: FileText, labelKey: "nav.proctorReport", href: "/results/proctor-report", roles: [UserRole.Admin, UserRole.Instructor] },
  ],
}

// Proctor Center group (unchanged)
const proctorNavGroup: NavGroup = {
  icon: Monitor,
  labelKey: "nav.proctorCenter",
  roles: [UserRole.Admin, UserRole.Instructor, UserRole.ProctorReviewer, UserRole.Proctor],
  children: [
    { icon: LayoutDashboard, labelKey: "nav.proctorDashboard", href: "/proctor-center" },
    { icon: UserCheck, labelKey: "nav.assignToProctor", href: "/proctor/assign", hidden: true },
    { icon: Users, labelKey: "nav.userIdentification", href: "/proctor/user-identification" },
  ],
}

// NEW: Candidates group
const candidatesNavGroup: NavGroup = {
  icon: UsersRound,
  labelKey: "nav.candidates",
  roles: [UserRole.Admin, UserRole.Instructor],
  children: [
    { icon: FolderTree, labelKey: "nav.batch", href: "/candidates/batch" },
    { icon: Users, labelKey: "nav.candidatesData", href: "/candidates/data" },
    { icon: UserPlus, labelKey: "nav.assignToExam", href: "/candidates/assign-to-exam" },
    { icon: Shield, labelKey: "nav.examControl", href: "/candidates/exam-control" },
    { icon: Wrench, labelKey: "nav.examOperations", href: "/candidates/exam-operations" },
    { icon: ClipboardCheck, labelKey: "nav.candidateExamDetails", href: "/candidates/exam-details" },
  ],
}

// NEW: Administration group
const administrationNavGroup: NavGroup = {
  icon: UserCog,
  labelKey: "nav.administration",
  roles: [UserRole.Admin, UserRole.SuperAdmin],
  children: [
    { icon: Users, labelKey: "nav.users", href: "/users", exact: true },
    { icon: ShieldCheck, labelKey: "nav.permissions", href: "/users/permissions" },
    { icon: Building2, labelKey: "nav.organization", href: "/organization" },
    { icon: FileText, labelKey: "nav.audit", href: "/audit" },
    { icon: Settings, labelKey: "nav.settings", href: "/settings" },
  ],
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { t, isRTL, language } = useI18n()
  const { user, logout, hasRole } = useAuth()

  // Candidate verification status for sidebar badge
  const [verifiedStatus, setVerifiedStatus] = useState<string | null>(null)
  useEffect(() => {
    if (!hasRole(UserRole.Candidate)) return
    getCandidateVerificationStatus()
      .then((s) => setVerifiedStatus(s.status ?? null))
      .catch(() => setVerifiedStatus(null))
  }, [hasRole])

  // All navigation groups for easy access
  const allGroups = useMemo(() => ({
    questionBank: questionBankNavGroup,
    exams: examsNavGroup,
    result: resultNavGroup,
    proctor: proctorNavGroup,
    candidates: candidatesNavGroup,
    administration: administrationNavGroup,
  }), [])

  // Compute which groups should be expanded based on current route
  const computeOpenGroups = useMemo(() => {
    const groups: Record<string, boolean> = {
      questionBank: false,
      exams: false,
      result: false,
      proctor: false,
      candidates: false,
      administration: false,
    }
    
    // Check if current route is inside any group
    Object.entries(allGroups).forEach(([key, group]) => {
      const isRouteInGroup = group.children.some(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
      )
      if (isRouteInGroup) {
        groups[key] = true
      }
    })
    
    return groups
  }, [pathname, allGroups])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(computeOpenGroups)

  // Update open groups when route changes (auto-expand if route is inside group)
  useEffect(() => {
    setOpenGroups(prev => {
      const newState = { ...prev }
      Object.entries(allGroups).forEach(([key, group]) => {
        const isRouteInGroup = group.children.some(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        )
        if (isRouteInGroup) {
          newState[key] = true
        }
      })
      return newState
    })
  }, [pathname, allGroups])

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.hidden) return false
      if (!item.roles) return true
      return item.roles.some((role) => hasRole(role))
    })
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`))
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
    const isOpen = openGroups[groupKey] ?? false
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
          <ChevronRight 
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-90"
            )} 
          />
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
        <ScrollArea className="flex-1 min-h-0 px-3 py-4">
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
                {/* Verified status link */}
                {verifiedStatus && (
                  <Link
                    href="/verify-identity"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      "hover:bg-accent hover:text-accent-foreground",
                      pathname === "/verify-identity" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                  >
                    {verifiedStatus === "Approved" ? (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                    ) : verifiedStatus === "Pending" ? (
                      <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-red-500" />
                    )}
                    {!isCollapsed && (
                      <span className="flex items-center gap-2 truncate">
                        {language === "ar" ? "التحقق من الهوية" : "Identity"}
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          verifiedStatus === "Approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          verifiedStatus === "Pending" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          (verifiedStatus === "Rejected" || verifiedStatus === "Flagged") && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        )}>
                          {verifiedStatus === "Approved" ? (language === "ar" ? "تم التحقق" : "Verified") :
                           verifiedStatus === "Pending" ? (language === "ar" ? "قيد المراجعة" : "Pending") :
                           (language === "ar" ? "مرفوض" : verifiedStatus)}
                        </span>
                      </span>
                    )}
                  </Link>
                )}
              </>
            )}

            {/* Question Bank (expandable) */}
            {showGroup(questionBankNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "بنك الأسئلة" : "Question Bank"}
                  </div>
                )}
                <NavGroupBlock group={questionBankNavGroup} groupKey="questionBank" />
              </>
            )}

            {/* Exam Management Group (expandable) */}
            {showGroup(examsNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "إدارة الاختبارات" : "Exam Management"}
                  </div>
                )}
                <NavGroupBlock group={examsNavGroup} groupKey="exams" />
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

            {/* Proctor Center (expandable) */}
            {showGroup(proctorNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "مركز المراقبة" : "Proctor Center"}
                  </div>
                )}
                <NavGroupBlock group={proctorNavGroup} groupKey="proctor" />
              </>
            )}

            {/* Candidates (expandable) */}
            {showGroup(candidatesNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "المرشحون" : "Candidates"}
                  </div>
                )}
                <NavGroupBlock group={candidatesNavGroup} groupKey="candidates" />
              </>
            )}

            {/* Administration (expandable) */}
            {showGroup(administrationNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {language === "ar" ? "الإدارة" : "Administration"}
                  </div>
                )}
                <NavGroupBlock group={administrationNavGroup} groupKey="administration" />
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
