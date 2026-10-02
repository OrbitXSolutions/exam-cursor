"use client"

import Image from "next/image"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { UserRole } from "@/lib/types"
import { getCandidateVerificationStatus } from "@/lib/api/proctoring"
import { BRAND_ASSETS } from "@/lib/branding"
import { useBranding } from "@/lib/hooks/use-branding"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  FileQuestion,
  ClipboardList,
  Users,
  GraduationCap,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BookOpen,
  BarChart3,
  Eye,
  Settings,
  FolderTree,
  ListTree,
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
  ClipboardCheck,
  Building2,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Copy,
  HelpCircle,
  Bell,
  ScrollText,
  Bug,
  Activity,
  FileKey,
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
  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor],
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
  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor],
  children: [
    { icon: ClipboardList, labelKey: "nav.exams", href: "/exams/list", hidden: true },
    { icon: PlusSquare, labelKey: "nav.createExam", href: "/exams/setup" },
    { icon: Copy, labelKey: "nav.createFromTemplate", href: "/exams/create-from-template" },
    { icon: List, labelKey: "nav.examsList", href: "/exams/list" },
    { icon: Calendar, labelKey: "nav.examScheduler", href: "/exams/scheduler", hidden: true },
    { icon: UserCheck, labelKey: "nav.assignToProctor", href: "/proctor/assign", roles: [UserRole.Admin, UserRole.Instructor] },
  ],
}

// Result group with reordered items per requirements
const resultNavGroup: NavGroup = {
  icon: CheckCircle2,
  labelKey: "nav.result",
  // GradingController: SuperAdmin,Admin,Instructor,Examiner | ExamResultController: SuperAdmin,Admin,Instructor
  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor, UserRole.Examiner],
  children: [
    // GradingController allows Examiner; explicit roles required so Examiner sees grading inside the group
    { icon: GraduationCap, labelKey: "nav.grading", href: "/grading", roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor, UserRole.Examiner] },
    { icon: BarChart3, labelKey: "nav.candidateResult", href: "/results/candidate-result", roles: [UserRole.SuperAdmin, UserRole.Admin] },
    { icon: ShieldAlert, labelKey: "nav.terminatedAttempts", href: "/results/terminated-attempts", roles: [UserRole.SuperAdmin, UserRole.Admin] },
    { icon: FileText, labelKey: "nav.proctorReport", href: "/results/proctor-report", roles: [UserRole.SuperAdmin, UserRole.Admin] },
  ],
}

// Proctor Center group (unchanged)
const proctorNavGroup: NavGroup = {
  icon: Monitor,
  labelKey: "nav.proctorCenter",
  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Proctor],
  children: [
    { icon: LayoutDashboard, labelKey: "nav.proctorDashboard", href: "/proctor-center" },
    { icon: Users, labelKey: "nav.userIdentification", href: "/proctor/user-identification" },
  ],
}

// NEW: Candidates group
const candidatesNavGroup: NavGroup = {
  icon: UsersRound,
  labelKey: "nav.candidates",
  roles: [UserRole.SuperAdmin, UserRole.Admin, UserRole.Instructor],
  children: [
    // BatchesController + CandidatesController: SuperAdmin,Admin only
    { icon: FolderTree, labelKey: "nav.batch", href: "/candidates/batch", roles: [UserRole.SuperAdmin, UserRole.Admin] },
    { icon: Users, labelKey: "nav.candidatesData", href: "/candidates/data", roles: [UserRole.SuperAdmin, UserRole.Admin] },
    // AssignmentsController + CandidateExamDetailsController: SuperAdmin,Admin,Instructor
    { icon: UserPlus, labelKey: "nav.assignToExam", href: "/candidates/assign-to-exam" },
    // { icon: Wrench, labelKey: "nav.examOperations", href: "/candidates/exam-operations" },
    { icon: ClipboardCheck, labelKey: "nav.candidateExamDetails", href: "/candidates/exam-details" },
  ],
}

// NEW: Administration group
const administrationNavGroup: NavGroup = {
  icon: UserCog,
  labelKey: "nav.administration",
  roles: [UserRole.SuperAdmin],
  children: [
    { icon: Users, labelKey: "nav.users", href: "/users", exact: true },
    { icon: ShieldCheck, labelKey: "nav.permissions", href: "/users/permissions" },
    { icon: Landmark, labelKey: "nav.departments", href: "/departments" },
    { icon: Building2, labelKey: "nav.organization", href: "/organization" },
    // { icon: Settings, labelKey: "nav.settings", href: "/settings" },
    { icon: FileKey, labelKey: "nav.license", href: "/settings/license" },
  ],
}

// NEW: Notifications group
const notificationsNavGroup: NavGroup = {
  icon: Bell,
  labelKey: "nav.notifications",
  roles: [UserRole.SuperAdmin, UserRole.Admin],
  children: [
    { icon: Settings, labelKey: "nav.notificationSettings", href: "/notifications/settings" },
    { icon: FileText, labelKey: "nav.notificationTemplates", href: "/notifications/templates" },
    { icon: ScrollText, labelKey: "nav.notificationLog", href: "/notifications/logs" },
  ],
}

// NEW: System Logs group
const logsNavGroup: NavGroup = {
  icon: Activity,
  labelKey: "nav.logs",
  roles: [UserRole.SuperAdmin],
  children: [
    { icon: FileText, labelKey: "nav.audit", href: "/audit" },
    { icon: Users, labelKey: "nav.candidateLogs", href: "/logs/candidate" },
    { icon: Eye, labelKey: "nav.proctorLogs", href: "/logs/proctor" },
    { icon: UserCog, labelKey: "nav.userLogs", href: "/logs/users" },
    { icon: Bug, labelKey: "nav.developerLogs", href: "/logs/developer" },
    { icon: Activity, labelKey: "nav.appLogs", href: "/logs/app-logs" },
  ],
}

// User Guide / Tutorials - visible to all non-candidate roles
const userGuideNavItem: NavItem = {
  icon: HelpCircle,
  labelKey: "nav.userGuide",
  href: "/tutorials",
  roles: [UserRole.Admin, UserRole.SuperAdmin, UserRole.Instructor, UserRole.Proctor, UserRole.Examiner],
}

export function Sidebar({ mobileOpen, onMobileOpenChange, navigationButtonRef }: {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  navigationButtonRef: React.RefObject<HTMLButtonElement | null>
}) {
  const [desktopCollapsed, setIsCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const isCollapsed = !isMobile && desktopCollapsed
  const pathname = usePathname()
  const { t, isRTL, language } = useI18n()
  const { user, logout, hasRole } = useAuth()
  const isCandidate = hasRole(UserRole.Candidate)
  const { branding, hasOrgBranding, orgName, logoSrc } = useBranding()

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const resize = () => {
      setIsMobile(media.matches)
      if (!media.matches) onMobileOpenChange(false)
    }
    queueMicrotask(resize)
    media.addEventListener("change", resize)
    return () => media.removeEventListener("change", resize)
  }, [onMobileOpenChange])

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
    notifications: notificationsNavGroup,
    logs: logsNavGroup,
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
      notifications: false,
      logs: false,
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
    const timeout = setTimeout(() => {
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
    }, 0)
    return () => clearTimeout(timeout)
  }, [pathname, allGroups])

  const filterByRole = (items: NavItem[]) => {
    return items.filter((item) => {
      if (item.hidden) return false
      if (!item.roles) return true
      return item.roles.some((role) => hasRole(role))
    })
  }

  // Check if user guide should show (must be after filterByRole)
  const showUserGuide = !hasRole(UserRole.Candidate) && filterByRole([userGuideNavItem]).length > 0
  const sectionHeadingClass = "mb-2 mt-4 px-3 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"

  const renderNavLink = (item: NavItem) => {
    const isActive = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(`${item.href}/`))
    const Icon = item.icon
    const label = t(item.labelKey) || item.labelKey.split(".").pop()

    const link = (
      <Link
        key={item.href}
        href={item.href}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium transition-all",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-primary/10 text-sidebar-foreground font-semibold hover:bg-primary/15 hover:text-sidebar-foreground",
          isCollapsed && "justify-center px-2",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="min-w-0 flex-1 truncate text-start">{label}</span>}
        {!isCollapsed && item.badge && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    )

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
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

  const renderNavGroupBlock = (group: NavGroup, groupKey: string) => {
    const isOpen = openGroups[groupKey] ?? false
    const Icon = group.icon
    const GroupChevron = isRTL ? ChevronLeft : ChevronRight
    const label = t(group.labelKey) || group.labelKey.split(".").pop()
    const children = filterByRole(group.children)
    if (children.length === 0) return null

    if (isCollapsed) {
      return (
        <>
          {children.map((item) => (
            renderNavLink(item)
          ))}
        </>
      )
    }

    return (
      <div className="space-y-0.5">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-foreground hover:bg-accent"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-start">{label}</span>
          <GroupChevron
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen && (isRTL ? "-rotate-90" : "rotate-90")
            )}
          />
        </button>
        {isOpen && (
          <div className="ms-6 space-y-0.5 border-s border-muted ps-2">
            {children.map((item) => (
              renderNavLink(item)
            ))}
          </div>
        )}
      </div>
    )
  }

  const content = <>
        {/* Logo */}
        <div className={cn("flex h-16 shrink-0 items-center justify-between border-b px-4", isMobile && "pe-16")}>
          {!isCollapsed && (
            <Link href={isCandidate ? "/my-exams" : "/dashboard"} onClick={() => onMobileOpenChange(false)} className="flex min-w-0 items-center gap-2 text-start">
              <Image width={32} height={32} src={logoSrc === BRAND_ASSETS.digitalDubai ? BRAND_ASSETS.favicon : logoSrc} alt="" className="h-8 w-8 shrink-0 object-contain" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = BRAND_ASSETS.favicon }} />
              <span className="line-clamp-2 text-base font-bold leading-tight" title={orgName}>
                {orgName}
              </span>
            </Link>
          )}
          {!isMobile && <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", isCollapsed && "mx-auto")}
            aria-label={isCollapsed ? (language === "ar" ? "توسيع القائمة" : "Expand navigation") : (language === "ar" ? "طي القائمة" : "Collapse navigation")}
            aria-expanded={!isCollapsed}
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
          </Button>}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 min-h-0 px-3 py-4">
          <nav dir={isRTL ? "rtl" : "ltr"} aria-label={language === "ar" ? "القائمة الرئيسية" : "Main navigation"} className="flex flex-col gap-1" onClick={(event) => { if (isMobile && (event.target as Element).closest("a")) onMobileOpenChange(false) }}>
            {/* Main Nav */}
            {mainNavItems.map((item) => (
              renderNavLink(item)
            ))}

            {/* Candidate Nav */}
            {hasRole(UserRole.Candidate) && filterByRole(candidateNavItems).length > 0 && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "بوابة المرشح" : "Candidate Portal"}
                  </div>
                )}
                {filterByRole(candidateNavItems).map((item) => (
                  renderNavLink(item)
                ))}
                {/* Verified status link */}
                {verifiedStatus && (
                  <Link
                    href="/verify-identity"
                    aria-label={language === "ar" ? "التحقق من الهوية" : "Identity"}
                    aria-current={pathname === "/verify-identity" ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium transition-all",
                      "hover:bg-accent hover:text-accent-foreground",
                      pathname === "/verify-identity" && "bg-primary/10 text-sidebar-foreground font-semibold hover:bg-primary/15 hover:text-sidebar-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                  >
                    {verifiedStatus === "Approved" ? (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-green-600" />
                    ) : verifiedStatus === "Pending" ? (
                      <Clock className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (verifiedStatus === "Rejected" || verifiedStatus === "Flagged") ? (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-red-500" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    {!isCollapsed && (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate text-start">{language === "ar" ? "التحقق من الهوية" : "Identity"}</span>
                        <span className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          verifiedStatus === "Approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          verifiedStatus === "Pending" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          (verifiedStatus === "Rejected" || verifiedStatus === "Flagged") && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          (!verifiedStatus || verifiedStatus === "None") && "bg-muted text-muted-foreground",
                        )}>
                          {verifiedStatus === "Approved" ? (language === "ar" ? "تم التحقق" : "Verified") :
                           verifiedStatus === "Pending" ? (language === "ar" ? "قيد المراجعة" : "Pending") :
                           verifiedStatus === "Rejected" ? (language === "ar" ? "مرفوض" : "Rejected") :
                           verifiedStatus === "Flagged" ? (language === "ar" ? "مُعلَّم" : "Flagged") :
                           (language === "ar" ? "غير موثق" : "Not Verified")}
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
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "بنك الأسئلة" : "Question Bank"}
                  </div>
                )}
                {renderNavGroupBlock(questionBankNavGroup, "questionBank")}
              </>
            )}

            {/* Exam Management Group (expandable) */}
            {showGroup(examsNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "إدارة الاختبارات" : "Exam Management"}
                  </div>
                )}
                {renderNavGroupBlock(examsNavGroup, "exams")}
              </>
            )}

            {/* Result (expandable) */}
            {showGroup(resultNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "النتائج" : "Result"}
                  </div>
                )}
                {renderNavGroupBlock(resultNavGroup, "result")}
              </>
            )}

            {/* Proctor Center (expandable) */}
            {showGroup(proctorNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "مركز المراقبة" : "Proctor Center"}
                  </div>
                )}
                {renderNavGroupBlock(proctorNavGroup, "proctor")}
              </>
            )}

            {/* Candidates (expandable) */}
            {showGroup(candidatesNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "المرشحون" : "Candidates"}
                  </div>
                )}
                {renderNavGroupBlock(candidatesNavGroup, "candidates")}
              </>
            )}

            {/* Administration (expandable) */}
            {showGroup(administrationNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "الإدارة" : "Administration"}
                  </div>
                )}
                {renderNavGroupBlock(administrationNavGroup, "administration")}
              </>
            )}

            {/* Notifications (expandable) */}
            {showGroup(notificationsNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "الإشعارات" : "Notifications"}
                  </div>
                )}
                {renderNavGroupBlock(notificationsNavGroup, "notifications")}
              </>
            )}

            {/* System Logs (expandable) */}
            {showGroup(logsNavGroup) && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "سجلات النظام" : "System Logs"}
                  </div>
                )}
                {renderNavGroupBlock(logsNavGroup, "logs")}
              </>
            )}

            {/* User Guide */}
            {showUserGuide && (
              <>
                {!isCollapsed && (
                  <div className={sectionHeadingClass}>
                    {language === "ar" ? "المساعدة" : "Help"}
                  </div>
                )}
                {renderNavLink(userGuideNavItem)}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* Candidate Org Footer */}
        {isCandidate && hasOrgBranding && !isCollapsed && (branding.supportEmail || branding.mobileNumber) && (
          <div className="border-t px-3 py-2 space-y-1">
            {branding.supportEmail && (
              <a href={`mailto:${branding.supportEmail}`} className="flex items-center gap-2 truncate text-start text-xs text-muted-foreground hover:text-foreground">
                <span className="shrink-0">📧</span>
                {branding.supportEmail}
              </a>
            )}
            {branding.mobileNumber && (
              <a href={`tel:${branding.mobileNumber}`} className="flex items-center gap-2 text-start text-xs text-muted-foreground hover:text-foreground">
                <span className="shrink-0">📱</span>
                {branding.mobileNumber}
              </a>
            )}
          </div>
        )}

        {/* User Section */}
        <div className="border-t p-3">
          {user && (
            <div className={cn("flex items-center gap-3", isCollapsed && "flex-col justify-center")}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                {getLocalizedField(user, "fullName", language).charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden text-start">
                  <p className="truncate text-sm font-medium">{getLocalizedField(user, "fullName", language)}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.role}</p>
                </div>
              )}
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t("nav.logout")} onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "left" : "right"}>{t("nav.logout")}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
  </>

  return (
    <TooltipProvider>
      {isMobile ? (
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent side="left" dir={isRTL ? "rtl" : "ltr"} closeLabel={language === "ar" ? "إغلاق القائمة" : "Close navigation"} aria-describedby={undefined}
            className="w-[min(320px,90vw)] gap-0 bg-sidebar rtl:data-[state=open]:slide-in-from-right rtl:data-[state=closed]:slide-out-to-right"
            onCloseAutoFocus={(event) => { event.preventDefault(); navigationButtonRef.current?.focus() }}>
            <SheetTitle className="sr-only">{language === "ar" ? "القائمة الرئيسية" : "Main navigation"}</SheetTitle>
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        <aside dir={isRTL ? "rtl" : "ltr"} className={cn(
          "sticky top-0 hidden h-[var(--app-viewport-height)] shrink-0 flex-col border-e bg-sidebar md:flex",
          isCollapsed ? "w-16" : "w-64",
        )}>
          {content}
        </aside>
      )}
    </TooltipProvider>
  )
}
