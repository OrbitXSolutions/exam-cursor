"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent } from "@/components/ui/card"
import { Layers } from "lucide-react"

export default function BulkAuthApprovalPage() {
  const { language } = useI18n()
  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{language === "ar" ? "الموافقة الجماعية على المصادقة" : "Bulk Authentication Approval"}</h1>
        <p className="text-muted-foreground mt-1">{language === "ar" ? "الموافقة على طلبات المصادقة بالجملة" : "Approve authentication requests in bulk"}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{language === "ar" ? "قريباً" : "Coming soon"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
