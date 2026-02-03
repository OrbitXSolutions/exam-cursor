"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function SubjectiveAnalyticsPage() {
  const { language } = useI18n()
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{language === "ar" ? "تحليلات الاختبار الذاتي" : "Subjective Exam Analytics"}</h1>
        <p className="text-muted-foreground mt-1">{language === "ar" ? "تحليلات الأسئلة المقالية" : "Subjective question analytics"}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "قريباً" : "Coming soon"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
