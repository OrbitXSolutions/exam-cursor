"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { ExamSetupContent } from "@/components/exam/exam-setup-content"
import { Loader2 } from "lucide-react"

function SetupEditPageContent() {
  const params = useParams()
  const examId = params.examId as string

  return <ExamSetupContent examId={examId} />
}

export default function ExamSetupEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SetupEditPageContent />
    </Suspense>
  )
}
