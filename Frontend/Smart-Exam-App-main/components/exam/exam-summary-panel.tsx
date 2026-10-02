"use client"

import { useEffect, useState, type ReactNode, type RefObject } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

/** Keep the existing summary beside the exam on desktop and readable on phones. */
export function ExamSummaryPanel({ open, onOpenChange, dir, title, closeLabel, triggerRef, children }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dir: "ltr" | "rtl"
  title: string
  closeLabel: string
  triggerRef: RefObject<HTMLButtonElement | null>
  children: ReactNode
}) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const update = () => setMobile(media.matches)
    queueMicrotask(update)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  if (mobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" dir={dir} closeLabel={closeLabel} aria-describedby={undefined}
          className="w-[min(320px,90vw)] gap-0 bg-card rtl:data-[state=open]:slide-in-from-left rtl:data-[state=closed]:slide-out-to-left"
          onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus() }}>
          <SheetTitle className="sr-only">{title}</SheetTitle>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  return open ? <aside aria-label={title} className="hidden w-72 shrink-0 flex-col overflow-hidden border-s bg-card md:flex">{children}</aside> : null
}
