---
version: 1
slug: "src-components-portal-weeklyplanscreen-tsx"
primary_target: "src/components/portal/WeeklyPlanScreen.tsx"
related_targets: ["src/components/portal/WorkoutExecutionFeedback.tsx"]
---

# Workout Execution Feedback

Scope: extend Weekly Plan schedule and session details; Operate mode. Athlete checks how a recorded run followed its prescription. Primary action: scan the visible score, open a run for a useful takeaway, and optionally compare it with the plan.

Content: durable score, supplied interpretation, duration/intensity/structure outcomes, optional planned-versus-recorded evidence. Never derive scores, thresholds or intensity from activity metrics. Separate manual completion, activity matching and evaluation. No zones editor, workout-step prescription or coaching changes.

States: evaluated, partial dimensions, insufficient evidence, no synced activity, unavailable result, loading and request error. No invented pending promise. No score for unavailable evidence. No feedback on uncompleted unmatched sessions or other modalities.

## Direction contract

THESIS: a compact visible score answers how the run matched the plan; contextual feedback explains what to keep and adjust before offering evidence.

OWN-WORLD: inherit warm surfaces, green primary, DM Sans data, serif page headings and existing rounded schedule rows. Use foreground text and restrained status icons; no decorative score ring or competing calendar metrics.

STORY: athlete scans score and supplied interpretation without opening a row; inside, recognizes what matched and what differed, reads a short supplied next-time insight, and optionally inspects evidence.

FIRST VIEWPORT: keep Weekly Plan hierarchy. A single compact score line is visible below each evaluated run title and on Today done, labeled as plan match with its supplied interpretation. Expanded feedback groups duration/intensity/structure into Matched your plan, Worth adjusting and Not assessed, with text and restrained icons. A supplied, optional Next time insight is visible. Comparison, evaluation explanation and notes share one native Compare with plan disclosure. Missing evaluation remains neutral and unscored.

FORM: local refinement. Reuse tokens, native details, existing row expansion and Lucide; no dependency, score thresholds or frontend coaching engine. Surface supplied insight only; comparison strings remain presentation data. Reuse one validated score component in the schedule, Today done and details. Preserve completion, activity matching and server workflows. No decorative motion; disclosure transitions respect reduced motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Acceptance: isolated frontend preview with labeled synthetic fixtures; existing APIs unchanged; mobile/desktop and keyboard verification; lint, tests and build pass. Stop for user's visual approval before backend work. Preserve DESIGN.md and its sidecar because this extends the incumbent system.

## Final validation

Independent finish review: **SHIP at frontend prototype scope**, after default Today done screenshots were recaptured. No material scoped findings remain. No intentional deviations from this direction: collapsed run rows and Today done show a contextual score and supplied result; expanded feedback groups outcomes, shows an optional supplied Next time insight and keeps comparison, explanation and notes behind one native disclosure. Unscored copy and retry remain intact.

Thirty actual desktop/mobile PNGs cover before/after collapsed, expanded and Today done views, comparison and all eight states. The screenshot README and provenance live in `docs/screenshots/workout-feedback/`; routes, viewports, source fingerprints and all 30 image hashes were verified. Fresh browser evidence in `.impeccable/review/browser-checks.json` checks eight states at 1440px, 390px and 320px without overflow, browser errors or backend requests. Row/native disclosure keyboard access, retry and Today feedback navigation pass. Captures use synthetic data and reduced motion. Review evidence accompanies draft PR #17.

Lint: zero errors, nine existing warnings. Full suite: 70 tests pass; affected suite: 17 pass. Build passes with baseline chunk-size/Browserslist warnings. TypeScript diagnostics remain byte-identical to the eight-error root baseline. Production output excludes the development preview and mock strings.

System preservation: existing warm surfaces, green emphasis, DM Sans/tabular metrics, serif headings, rounded rows and tokens remain intact. `DESIGN.md`, `.impeccable/design.json` and global configuration are unchanged. Pre-existing theme/sidecar drift is outside scope; no global recertification is claimed. The developer handoff is `docs/workout-execution-feedback.md`. Mock presentation data and the pending adapter are prototype limitations. Backend integration remains stopped until the user approves the visual result; optional supplied insight is not an API contract or frontend coaching algorithm.
