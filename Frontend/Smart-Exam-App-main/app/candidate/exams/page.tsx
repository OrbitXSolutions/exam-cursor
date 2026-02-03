"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FullPageLoader } from "@/components/ui/loading-spinner"

// Redirect /candidate/exams to /my-exams (unified candidate exams page)
export default function CandidateExamsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/my-exams")
  }, [router])

  return <FullPageLoader />
}
