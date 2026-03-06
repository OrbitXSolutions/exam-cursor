"use client"

import { SystemLogTable } from "@/components/logs/system-log-table"
import { getDeveloperLogs } from "@/lib/api/system-logs"

export default function DeveloperLogsPage() {
  return (
    <SystemLogTable
      title="Developer Logs"
      titleAr="سجلات المطورين"
      description="Errors and exceptions only — full request/response details, stack traces, and correlation IDs."
      descriptionAr="الأخطاء والاستثناءات فقط — تفاصيل الطلب/الاستجابة الكاملة، تتبع المكدس، ومعرفات الربط."
      fetchLogs={getDeveloperLogs}
      showUserColumn={true}
      showErrorColumns={true}
    />
  )
}
