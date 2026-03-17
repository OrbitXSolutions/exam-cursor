"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { candidatePortalTutorial } from "@/lib/tutorials/tutorial-data";

export default function CandidatePortalTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="candidate-portal">
      <TutorialModulePage module={candidatePortalTutorial} />
    </TutorialLayout>
  );
}
