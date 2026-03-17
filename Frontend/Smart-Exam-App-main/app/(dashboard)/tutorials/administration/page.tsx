"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { administrationTutorial } from "@/lib/tutorials/tutorial-data";

export default function AdministrationTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="administration">
      <TutorialModulePage module={administrationTutorial} />
    </TutorialLayout>
  );
}
