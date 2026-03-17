"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { proctorTutorial } from "@/lib/tutorials/tutorial-data";

export default function ProctorTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="proctoring">
      <TutorialModulePage module={proctorTutorial} />
    </TutorialLayout>
  );
}
