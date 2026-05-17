"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export function LicenseExpiredDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { language } = useI18n()

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("licenseExpired", handler)
    return () => window.removeEventListener("licenseExpired", handler)
  }, [])

  function handleActivate() {
    setOpen(false)
    router.push("/settings/license")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-destructive">
              {language === "ar" ? "انتهت صلاحية الرخصة" : "License Expired"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {language === "ar"
              ? "انتهت صلاحية رخصة النظام. النظام يعمل حاليًا في وضع القراءة فقط ولا يمكن إجراء أي تعديلات. يرجى تفعيل الرخصة للمتابعة."
              : "Your system license has expired. The system is currently in read-only mode and no changes can be made. Please activate your license to continue."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {language === "ar" ? "إغلاق" : "Cancel"}
          </Button>
          <Button variant="destructive" onClick={handleActivate}>
            {language === "ar" ? "تفعيل الآن" : "Activate Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
