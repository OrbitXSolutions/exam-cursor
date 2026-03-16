"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { gradingTutorial } from "@/lib/tutorials/tutorial-data";

export default function GradingTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="grading">
      <TutorialModulePage module={gradingTutorial} />
    </TutorialLayout>
  );
}
