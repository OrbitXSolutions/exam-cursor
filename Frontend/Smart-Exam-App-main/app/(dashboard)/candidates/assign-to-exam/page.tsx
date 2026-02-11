"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Clock } from "lucide-react"

export default function AssignToExamPage() {
  const { language } = useI18n()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === "ar" ? "تعيين للاختبار" : "Assign to Exam"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === "ar" ? "تعيين المرشحين للاختبارات" : "Assign candidates to exams"}
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {language === "ar" ? "قريباً" : "Coming Soon"}
          </h2>
          <p className="text-muted-foreground text-center max-w-md">
            {language === "ar"
              ? "نعمل على تطوير ميزة تعيين المرشحين للاختبارات. ستتمكن قريباً من تعيين المرشحين للاختبارات المختلفة."
              : "We're working on the candidate assignment feature. Soon you'll be able to assign candidates to various exams."}
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
