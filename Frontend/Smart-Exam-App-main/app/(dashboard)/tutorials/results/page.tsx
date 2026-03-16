"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { resultsTutorial } from "@/lib/tutorials/tutorial-data";

export default function ResultsTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="results">
      <TutorialModulePage module={resultsTutorial} />
    </TutorialLayout>
  );
}
