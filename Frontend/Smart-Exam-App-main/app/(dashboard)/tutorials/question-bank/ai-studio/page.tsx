"use client"

import { TutorialLayout } from "@/components/tutorials/tutorial-layout"
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer"
import { aiStudioTutorial } from "@/lib/tutorials/tutorial-data"

export default function AIStudioTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="question-bank/ai-studio">
      <TutorialModulePage module={aiStudioTutorial} />
    </TutorialLayout>
  )
}
