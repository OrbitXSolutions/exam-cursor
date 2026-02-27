"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/**
 * Legacy page – redirects to /exams/[id]/overview.
 * Kept only so stale bookmarks / links don't 404.
 */
export default function ExamDetailPageRedirect() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/exams/${id}/overview`)
  }, [id, router])

  return null
}
