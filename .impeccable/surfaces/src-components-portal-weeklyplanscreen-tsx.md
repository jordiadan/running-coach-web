---
version: 1
slug: "src-components-portal-weeklyplanscreen-tsx"
primary_target: "src/components/portal/WeeklyPlanScreen.tsx"
related_targets: ["src/components/portal/WorkoutExecutionFeedback.tsx"]
---

# Workout Execution Feedback

Scope: extend Weekly Plan session details; Operate mode. Athlete checks how a recorded run followed its prescription. Primary action: open the session, read the result, close it and continue through the week.

Content: durable score, supplied interpretation, duration/intensity/structure outcomes, optional planned-versus-recorded evidence. Never derive scores, thresholds or intensity from activity metrics. Separate manual completion, activity matching and evaluation. No zones editor, workout-step prescription or coaching changes.

States: evaluated, partial dimensions, insufficient evidence, no synced activity, unavailable result, loading and request error. No invented pending promise. No score for unavailable evidence. No feedback on uncompleted unmatched sessions or other modalities.

## Direction contract

THESIS: contextual adherence feedback inside the existing disclosure keeps the weekly schedule scannable.

OWN-WORLD: inherit warm surfaces, green primary, DM Sans data, serif page headings and existing rounded schedule rows. Use foreground text and restrained status icons; no score ring or extra calendar badges.

STORY: athlete opens a completed run, understands adherence rather than fitness, compares duration/intensity/structure and returns to the schedule.

FIRST VIEWPORT: retain Weekly Plan hierarchy. Expanded row leads with Workout feedback, a compact score and supplied interpretation, followed by three separated evidence rows. One-column mobile layout; values align horizontally when space permits. Prescription notes follow quietly.

FORM: local extension, directly specified by user and PR #365; no seed or concept round required. Signature interaction is the existing inline session disclosure, now keyboard accessible. No new decorative motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Acceptance: isolated frontend preview with labeled synthetic fixtures; existing APIs unchanged; mobile/desktop and keyboard verification; lint, tests and build pass. Stop for user's visual approval before backend work. Preserve DESIGN.md and its sidecar because this extends the incumbent system.

## Final validation

Finish review: ship at prototype scope. Twelve implemented desktop/mobile captures checked; all eight selectable states verified without overflow. Enter/Space disclosure, retry and Today navigation pass without backend API requests. Lint passes with nine existing warnings, 69 tests pass, build passes and production excludes preview fixtures. Separate TypeScript check retains eight baseline errors. Implementation follows this brief and incumbent tokens; no durable system change requires a DESIGN.md or sidecar refresh. Existing warm-rendering alternate themes and older sidecar remain unchanged. User visual approval is still required before backend integration. Developer instructions: `docs/workout-execution-feedback.md`.
