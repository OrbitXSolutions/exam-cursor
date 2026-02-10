"use client"

import { Suspense } from "react"
import { ExamSetupContent } from "@/components/exam/exam-setup-content"
import { Loader2 } from "lucide-react"

function SetupPageContent() {
  return <ExamSetupContent />
}

export default function ExamSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SetupPageContent />
    </Suspense>
  )
}
