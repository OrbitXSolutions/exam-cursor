"use client"

import { SystemLogTable } from "@/components/logs/system-log-table"
import { getCandidateLogs } from "@/lib/api/system-logs"

export default function CandidateLogsPage() {
  return (
    <SystemLogTable
      title="Candidate Logs"
      titleAr="سجلات المرشحين"
      description="Track candidate activities: login, exam attempts, submissions, and related events."
      descriptionAr="تتبع أنشطة المرشحين: تسجيل الدخول، محاولات الاختبار، التقديمات، والأحداث ذات الصلة."
      fetchLogs={getCandidateLogs}
      showUserColumn={true}
    />
  )
}
