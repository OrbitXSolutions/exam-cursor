"use client"

import { SystemLogTable } from "@/components/logs/system-log-table"
import { getUserLogs } from "@/lib/api/system-logs"

export default function UserLogsPage() {
  return (
    <SystemLogTable
      title="Users Logs"
      titleAr="سجلات المستخدمين"
      description="Track admin, instructor, and examiner activities: exam management, grading, settings, and more."
      descriptionAr="تتبع أنشطة المسؤولين والمدربين والممتحنين: إدارة الاختبارات، التصحيح، الإعدادات، والمزيد."
      fetchLogs={getUserLogs}
      showUserColumn={true}
    />
  )
}
