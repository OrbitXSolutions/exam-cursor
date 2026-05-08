"use client"

import { useRouter } from "next/navigation"
import { ShieldX, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/context"
import { useI18n } from "@/lib/i18n/context"
import { UserRole } from "@/lib/types"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { isRTL } = useI18n()

  const homeRoute = user?.role === UserRole.Candidate ? "/my-exams" : "/dashboard"

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-destructive/5 to-background px-4"
    >
      <div className="text-center max-w-lg mx-auto">

        {/* Big 403 with icon overlay */}
        <div className="relative mb-8 select-none">
          <h1 className="text-[10rem] font-black leading-none text-destructive/10">
            403
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-5 rounded-full bg-destructive/10 ring-4 ring-destructive/20 animate-pulse">
              <ShieldX className="h-14 w-14 text-destructive" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {isRTL ? "غير مصرح لك بالوصول" : "Access Denied"}
        </h2>

        {/* Sub-heading */}
        <p className="text-muted-foreground text-base leading-relaxed mb-2">
          {isRTL
            ? "ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة."
            : "You don't have the required permissions to view this page."}
        </p>
        <p className="text-muted-foreground text-sm mb-10">
          {isRTL
            ? "إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المسؤول."
            : "If you think this is a mistake, please contact your administrator."}
        </p>

        {/* Role badge */}
        {user && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-10 border">
            <span className="h-2 w-2 rounded-full bg-destructive/60" />
            {isRTL ? "دورك الحالي:" : "Your current role:"}&nbsp;
            <span className="font-semibold text-foreground">{user.role}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            {isRTL ? (
              <>
                {isRTL ? "رجوع" : "Go Back"}
                <ArrowLeft className="h-4 w-4 ms-2 rotate-180" />
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 me-2" />
                Go Back
              </>
            )}
          </Button>

          <Button
            onClick={() => router.replace(homeRoute)}
            className="w-full sm:w-auto"
          >
            {isRTL ? (
              <>
                {user?.role === UserRole.Candidate ? "اختباراتي" : "الرئيسية"}
                <Home className="h-4 w-4 ms-2" />
              </>
            ) : (
              <>
                <Home className="h-4 w-4 me-2" />
                {user?.role === UserRole.Candidate ? "My Exams" : "Go to Dashboard"}
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
