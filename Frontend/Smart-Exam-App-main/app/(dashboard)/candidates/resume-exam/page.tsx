"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { PlayCircle, Clock } from "lucide-react"

export default function ResumeExamPage() {
  const { language } = useI18n()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "ar" ? "استئناف الاختبار" : "Resume Exam"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "استئناف اختبارات المرشحين المتوقفة" : "Resume paused candidate exams"}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <PlayCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {language === "ar" ? "قريباً" : "Coming Soon"}
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            {language === "ar"
              ? "نعمل على تطوير ميزة استئناف الاختبارات. ستتمكن قريباً من استئناف اختبارات المرشحين المتوقفة."
              : "We're working on the resume exam feature. Soon you'll be able to resume paused candidate exams."}
          </p>
          <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{language === "ar" ? "قيد التطوير" : "Under Development"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
