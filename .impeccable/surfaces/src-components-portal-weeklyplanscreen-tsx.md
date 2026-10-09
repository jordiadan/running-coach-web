---
version: 1
slug: "src-components-portal-weeklyplanscreen-tsx"
primary_target: "src/components/portal/WeeklyPlanScreen.tsx"
related_targets: ["src/components/portal/WorkoutExecutionFeedback.tsx"]
---

# Workout Execution Feedback

Scope: simplify Weekly Plan schedule and run feedback; Operate mode. Athlete scans plan adherence and opens a run to understand what to keep or adjust. Frontend prototype only; real-data integration awaits user visual approval.

Content: supplied score and interpretation, concise supplied explanation/advice, optional planned/recorded duration/intensity/structure evidence and session notes. Preserve scoring, completion, matching and APIs; no inferred grades, advice or domain calculations.

States: evaluated, partial evidence, insufficient evidence, unavailable, manual unmatched, loading, retryable error. Never fabricate a score. No feedback on unmatched uncompleted runs or other modalities.

## Direction contract

THESIS: the workout name and one inline score are the interface; opening adds a useful explanation, not a second score dashboard.

OWN-WORLD: retain warm surfaces, restrained green primary, DM Sans, existing serif page headings, existing controls and focus tokens. Typography and alignment carry hierarchy; unboxed score, no metric tiles, colored status groups or redundant row labels.

STORY: scan readable names and aligned scores, open a run, read what matched and one adjustment, optionally compare the evidence.

FIRST VIEWPORT: consistent title-led schedule rows. Completion stays distinct; day and planned minutes are quiet secondary metadata; activity-source links move into details. One score sits at the right of the title; a single schedule-level Plan match label provides context. Names wrap when needed and remain readable after completion. Expanding keeps the row's score visible and adds a supplied explanation and one short actionable sentence; no repeated number, grouped dimensions or Next time heading. One Compare with plan disclosure holds evidence and notes. Today integrates the same unboxed score beside its readable title instead of adding a score stripe.

FORM: replace prior feedback scaffolding, retaining product foundations. Use supplied summary and a concise supplied insight without generating or duplicating advice. Keep dimension evidence in a semantic three-row table behind native details. Flatten expanded session styling into the schedule, avoid a nested feedback card. Preserve provider links and completion controls. Existing reveal transitions respect reduced motion; no decorative animation.

FINISH: independent review must judge the user rejection and actual before/after captures, not inherit prior approval. Final reviewer, screenshot evidence with provenance and developer documentation are required. Preserve DESIGN.md and sidecar because the product visual system is unchanged.

Acceptance: all affected Weekly Plan and Today states captured before PR update, desktop/mobile and narrow verification, readable completed names, exactly one score per schedule row when expanded, useful default explanation, accessible secondary comparison, unchanged evaluation logic, lint/tests/build. Backend remains stopped pending visual approval.

## Final validation

Fresh finish review: SHIP at mock scope after fixing the 320px comparison wrapping; this resolves the scoped finding, not global recertification. Actual eight-state browser checks at 1440/390/320px passed overflow, console/API, keyboard expansion/disclosure, retry, Today navigation, readable completed names and single-score assertions. Schedule completion targets are 44px; checked feedback prose meets 4.5:1 contrast.

All 71 tests pass, including the Strength source-link regression. Lint: zero errors and nine baseline warnings; build passes with baseline chunk/Browserslist warnings. TypeScript retains eight byte-identical baseline errors. One manual detector run across three targets returned legacy font-ramp advisories; its truncated output is not a clean-scan claim.

See [45 actual captures and provenance](../../docs/screenshots/workout-feedback/README.md) for rejected `6573f8f` versus current Weekly Plan/Today, collapsed/expanded desktop/mobile, default prose, comparison, alternate states, score/no-score rows and 320px comparison. Provider links intentionally require progressive disclosure; the default Today pending provider badge remains outside scope. Existing warm tokens, typography, rounded rows and focus treatment match the incumbent system; DESIGN.md, sidecar and global configuration remain preserved. Frontend mocks only; API adapter and backend remain stopped pending visual approval.
