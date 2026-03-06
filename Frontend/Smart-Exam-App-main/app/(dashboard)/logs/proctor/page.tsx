"use client"

import { SystemLogTable } from "@/components/logs/system-log-table"
import { getProctorLogs } from "@/lib/api/system-logs"

export default function ProctorLogsPage() {
  return (
    <SystemLogTable
      title="Proctor Logs"
      titleAr="سجلات المراقبين"
      description="Track proctor activities: sessions, identity verifications, incidents, and reviews."
      descriptionAr="تتبع أنشطة المراقبين: الجلسات، التحقق من الهوية، الحوادث، والمراجعات."
      fetchLogs={getProctorLogs}
      showUserColumn={true}
    />
  )
}
