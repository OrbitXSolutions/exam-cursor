import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type StatusVariant = "default" | "success" | "warning" | "destructive" | "secondary" | "outline"

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
  className?: string
  showDot?: boolean
}

const statusVariantMap: Record<string, StatusVariant> = {
  // General
  active: "success",
  inactive: "secondary",
  published: "success",
  unpublished: "secondary",
  draft: "warning",
  pending: "warning",
  approved: "success",
  rejected: "destructive",

  // Attempt Status
  notstarted: "secondary",
  inprogress: "warning",
  submitted: "success",
  timedout: "destructive",
  cancelled: "destructive",

  // Grading Status
  completed: "success",
  requiresmanualgrading: "warning",

  // Proctor Decision
  cleared: "success",
  suspicious: "warning",
  invalidated: "destructive",
  requiresreview: "warning",

  // Incident Status
  open: "warning",
  inreview: "default",
  resolved: "success",
  closed: "secondary",
  reopened: "warning",

  // Incident Outcome
  confirmed: "destructive",
  escalated: "destructive",

  // Pass/Fail
  passed: "success",
  failed: "destructive",

  // Severity
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
  severe: "destructive",

  // Difficulty
  easy: "success",
  hard: "destructive",
}

export function StatusBadge({ status, variant, className, showDot = true }: StatusBadgeProps) {
  // Handle null/undefined status gracefully
  if (!status) {
    return (
      <Badge variant="secondary" className={cn("gap-1.5 font-medium", className)}>
        {showDot && <span className={cn("h-1.5 w-1.5 rounded-full bg-gray-400")} />}
        Unknown
      </Badge>
    )
  }
  
  const normalizedStatus = status.toLowerCase().replace(/[\s_-]/g, "")
  const resolvedVariant = variant || statusVariantMap[normalizedStatus] || "default"

  const dotColors: Record<StatusVariant, string> = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500",
    secondary: "bg-gray-400",
    outline: "bg-gray-400",
  }

  return (
    <Badge variant={resolvedVariant} className={cn("gap-1.5 font-medium", className)}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[resolvedVariant])} />}
      {status}
    </Badge>
  )
}
