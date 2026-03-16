Continue building the User Guide / Tutorial system for the SmartExam platform.

## What's Already Done

- ✅ Question Bank tutorial (complete, with rich formatting)
- ✅ AI Studio tutorial (complete, with rich formatting)
- ✅ Exam Management tutorial (complete, with rich formatting)
- ✅ Grading tutorial (complete, with rich formatting)
- ✅ Results & Publishing tutorial (complete, with rich formatting)
- ✅ RichText parser component in tutorial-section-renderer.tsx (supports **bold**, "highlighted", numbered lists, bullet lists)
- ✅ Enhanced visual styling (gradient step numbers, styled cards, tables, tips, notes)

## Next Module: Proctor Center

Create a complete, detailed tutorial for the **Proctor Center** module — covering every page, action, and feature available in the proctoring system.

### What to Do

1. **Explore the full Proctor module** in the frontend codebase (sidebar menu items under Proctor, all pages, components, API calls) to understand every feature
2. **Create `proctorTutorial`** in `lib/tutorials/tutorial-data.ts` following the exact same TutorialModule structure as gradingTutorial and resultsTutorial
3. **Cover all proctor features** including but not limited to:
   - Proctor Dashboard / Live Monitoring
   - Session management (active sessions, session details)
   - Candidate monitoring (camera feed, screen share, alerts)
   - Incident management (flagging, warnings, termination)
   - Real-time notifications and alerts
   - Proctor actions (warn, pause, terminate, message candidate)
   - Session history and review
   - Any settings or configuration related to proctoring
4. **Use rich text formatting** in ALL descriptions from the start:
   - `**bold**` for key terms
   - `\n- ` for bullet lists
   - `\n1. ` for numbered lists
   - Include tips, notes, and field references where relevant
5. **Bilingual**: All content must be in English (En) and Arabic (Ar)
6. **Create the route page**: `app/(dashboard)/tutorials/proctoring/page.tsx`
7. **Update tutorials index**: Remove "Proctor Center" from comingSoonModules in `app/(dashboard)/tutorials/page.tsx`
8. **Update allTutorialModules** and **tutorialModuleOrder** in tutorial-data.ts
9. **Add image placeholders** for each step (imagePlaceholder paths like `/tutorials/proctor-*.png`)

### Architecture Reference

- Tutorial data file: `Frontend/Smart-Exam-App-main/lib/tutorials/tutorial-data.ts`
- Renderer: `Frontend/Smart-Exam-App-main/components/tutorials/tutorial-section-renderer.tsx`
- Layout: `Frontend/Smart-Exam-App-main/components/tutorials/tutorial-layout.tsx`
- Existing route pages: `app/(dashboard)/tutorials/grading/page.tsx`, `app/(dashboard)/tutorials/results/page.tsx`

### Rules

- Explore the actual codebase first — do NOT guess features
- Match the exact data structure (TutorialModule, TutorialSection, TutorialStep, etc.)
- Production quality, no placeholders in text content
- Do not modify existing tutorials or the renderer component
