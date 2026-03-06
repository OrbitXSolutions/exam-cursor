"use client"

import { TutorialLayout } from "@/components/tutorials/tutorial-layout"
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer"
import { questionBankTutorial } from "@/lib/tutorials/tutorial-data"

export default function QuestionBankTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="question-bank">
      <TutorialModulePage module={questionBankTutorial} />
    </TutorialLayout>
  )
}
