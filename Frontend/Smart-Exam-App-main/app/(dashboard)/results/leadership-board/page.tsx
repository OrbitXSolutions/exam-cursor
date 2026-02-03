"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function LeadershipBoardPage() {
  const { language } = useI18n()
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{language === "ar" ? "لوحة المتصدرين" : "Leadership Board"}</h1>
        <p className="text-muted-foreground mt-1">{language === "ar" ? "ترتيب المرشحين حسب الأداء" : "Candidate rankings by performance"}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "قريباً" : "Coming soon"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
