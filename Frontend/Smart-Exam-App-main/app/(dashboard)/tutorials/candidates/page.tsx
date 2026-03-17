"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { candidateTutorial } from "@/lib/tutorials/tutorial-data";

export default function CandidateTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="candidates">
      <TutorialModulePage module={candidateTutorial} />
    </TutorialLayout>
  );
}
