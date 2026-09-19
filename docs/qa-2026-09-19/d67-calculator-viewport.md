# D67: Expanded calculator keypad clipped by viewport

Root reproduced this in the real candidate browser at 1280 × 720 during final attempt 368. Opening Calculator → Financial → PV expanded the argument panel below the viewport: the keypad's bottom rows, including `0` and `=`, were inaccessible. The floating card had no viewport height limit or scrolling surface.

The calculator card now limits its height to the space below its current dragged position, with an 8 px bottom margin and native vertical scrolling. Its width is capped to the viewport. Initial vertical placement and position after a window resize keep the panel within the visible area. Calculation functions and input behavior are unchanged.

Changed source: `Frontend/Smart-Exam-App-main/components/exam/exam-calculator.tsx`.

Validation completed: frontend TypeScript check and targeted ESLint both passed. No API changes or service restart were required. Root verified the original Financial/PV flow in the real browser after HMR: all `0`, `Next`, and `= Calc` clicks worked, and `PV(0, 2, 100, 0, 0)` returned `-200`. The screenshot showed the card bounded at y=710 with its scrollbar and keypad accessible. Basic arithmetic (`14`), SUM (`5`), and scientific calculation (`3`) had already passed before the layout fix; root continues the final reload/basic regression separately.
