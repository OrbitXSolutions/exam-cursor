"use client";

import { TutorialLayout } from "@/components/tutorials/tutorial-layout";
import { TutorialModulePage } from "@/components/tutorials/tutorial-section-renderer";
import { examManagementTutorial } from "@/lib/tutorials/tutorial-data";

export default function ExamManagementTutorialPage() {
  return (
    <TutorialLayout currentModuleSlug="exams">
      <TutorialModulePage module={examManagementTutorial} />
    </TutorialLayout>
  );
}
