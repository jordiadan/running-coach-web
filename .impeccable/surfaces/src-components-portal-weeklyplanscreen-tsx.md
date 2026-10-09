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

FIRST VIEWPORT: retain Weekly Plan hierarchy. Expanded row leads with the supplied interpretation, a compact score and the meaning “Match to your plan”. A three-row table compares Plan with Your run; outcome icons accompany plain-language labels. This same compact comparison works on mobile. A single native disclosure contains explanation and session notes, keeping the default result short.

FORM: local extension, directly specified by user and PR #365; no seed or concept round required. The user requested a simpler, more intuitive and visual revision. Remove the repeated introduction, narrative summary and disclaimer from the default view; preserve them in More details. Keep the calendar unchanged and use existing native disclosures without new motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Acceptance: isolated frontend preview with labeled synthetic fixtures; existing APIs unchanged; mobile/desktop and keyboard verification; lint, tests and build pass. Stop for user's visual approval before backend work. Preserve DESIGN.md and its sidecar because this extends the incumbent system.

## Final validation

Finish review: ship at frontend prototype scope. Twenty-one actual desktop/mobile/narrow captures checked. All eight selectable states pass at 1440px, 390px and 320px without overflow, browser errors or backend API requests. Outer disclosure passes Enter/Space; native details passes Enter; retry and Today navigation pass. Default feedback at 390px shrank from 553px to 340px (39%). The sole material review finding, planned structure wrapping at 320px, is resolved with local cell padding and recaptured. Result/score, Plan/Your run table and one More details disclosure follow the revised brief; calendar unchanged. Lint passes with nine existing warnings, 69 tests pass, build passes and production excludes preview fixtures. Separate TypeScript check retains eight baseline errors. Incumbent tokens remain intact; preserve DESIGN.md and sidecar. Existing warm-rendering alternate themes and older sidecar remain unchanged. This review is scoped to the prototype, not a global recertification. User visual approval is still required before backend integration. Developer instructions: `docs/workout-execution-feedback.md`.
