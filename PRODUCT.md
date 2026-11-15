# Running Coach

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The implemented workflows serve runners who want a weekly training plan around
their running schedule and goal, using an existing Strava or Intervals.icu
account as their training source. The profile supports preparing for a race or
improving running without a race goal.

This describes the supported user journey, not a confirmed market segment.
**Needs confirmation:** primary audience, experience level and any priority
segment. No evidence establishes beginner-only, competitive-only or coach/team
accounts as the product's intended audience.

## Product Purpose

Help the athlete configure training context, obtain a personalized weekly plan
and understand what to do next. The current portal's main workflow is sign in,
connect a training source, complete the profile, then use the weekly plan.

The backend generates plans from athlete profile, preparation, recent training
and available recovery/wellness context, using model generation followed by
schema and deterministic domain validation. This is an implemented mechanism,
not evidence of improved performance or a validated commercial promise.

## Operating Context

- A browser application built with React, TypeScript, Vite and Tailwind; public
  pages and the authenticated portal share this frontend.
- Google OAuth through Supabase provides sign-in. The frontend sends the session
  bearer token to the backend API; provider OAuth and planning run in the backend.
- One activity source, Strava or Intervals.icu, can be active at a time. The
  portal supports connection, replacement and disconnection; provider capabilities
  and available recovery data are not assumed identical.
- Onboarding uses the backend bootstrap's next step and generation status. The
  frontend polls while preparing the first plan and offers retry after failure.
- Weekly navigation and future preview availability come from the backend screen
  contract; a preview is not an already-generated future plan.

## Capabilities and Constraints

### Current frontend

- `/`: public product page. `/privacy`: trust/privacy information. `/login`:
  Google sign-in. `/portal`: session-gated onboarding and the Weekly Plan,
  Connect and Profile tabs. There are no separate calendar or session-detail
  routes; sessions expand within the weekly plan.
- Profile: display name, training goal, running days and preferred long-run day.
  The current UI requires at least four running days; the long-run day must be
  one of them. A race goal adds name, date, distance and a finish-only, target-time
  or target-pace objective. Context notes shown as coming soon are not editable.
- Weekly plan: week navigation, objective, goal timeline, today's
  session, remaining sessions, long-run highlight and completed-distance summary
  when supplied by the API. Session details include modality, intensity,
  prescribed duration, notes and strength focus when supplied. The API also
  carries plan justification and placement rationale; the current screen does
  not render those fields.
- Current-week non-rest sessions support manual completion when the API supplies
  completion state. A matched activity, its recorded metrics and provider link
  remain separate from manual completion: clearing a checkbox does not erase
  the activity. Planned duration is not performed duration, and checking a session
  does not fabricate activity distance.
- The race-goal card can record completed/skipped outcomes when eligible, and
  direct the athlete to Profile to set the next goal. A secondary goal may be
  displayed when returned by the API; that does not imply a multi-goal editor.
- Profile displays persisted personalized running heart-rate zones (Z1–Z5),
  their source threshold and calibration availability states (backend #387,
  web #22/#23). This is visibility, not individual LT1 calibration.
- For eligible matched running sessions, the Weekly Plan presents persisted
  Workout Execution Evaluation V1 and its evidence/score states (backend #385,
  web #20). No execution score is invented from a manual completion.

### Current backend support and boundary

The backend owns profile/preparation validation, provider data ingestion,
readiness, physiological calculations, plan generation and automatic event-driven
refresh of remaining sessions. It also implements planned-session matching and
Workout Execution Evaluation V1, whose persisted results are shown for eligible
sessions in the current frontend. This is **not** Adaptive Coaching V1:
current evaluations do not systematically change upcoming plans from execution
evidence.

Generated running workouts are published to Intervals by the backend. Do not
promise equivalent Strava publishing. Generation already consumes available
recovery/readiness; the roadmap distinguishes that from changing future training
in response to actual-versus-planned execution evidence.

### Active product priorities — agreed 2026-11-10

These are the **only three active product initiatives**, documented in backend
`docs/product/initiatives.md`. Prioritization is agreed; detailed implementation
and final visual decisions still require review.

1. **Athlete Performance Dashboard V1 — next functional delivery.** Eight
   completed weeks of planned/completed/matched runs and recorded volume, with
   honest source/availability states. Backend [PR #388](https://github.com/jordiadan/springboot-running-coach/pull/388)
   defines a read-only contract. Web [PR #24](https://github.com/jordiadan/running-coach-web/pull/24)
   is an interactive **synthetic-data** prototype, not production analytics; it
   currently conflicts with `main` and must be reconciled before integration.
2. **Adaptive Coaching V1 — strategic functional delivery.** The product should
   use reliable execution and recovery evidence to make one bounded,
   explainable future-plan adjustment (or explicitly keep the plan). The
   decision, validation and longitudinal prerequisites are not implemented yet.
   Planning already consumes some wellness context, which is different from
   adapting training based on observed execution.
3. **Full UI/UX revamp — parallel across product flows.** Mobile-first,
   minimal, premium and coherent across navigation, the weekly plan,
   session details, onboarding and dashboard, with purposeful animations and
   accessible interaction. Portal/onboarding/component refinements shipped in
   web #25/#26/#28; [PR #29](https://github.com/jordiadan/running-coach-web/pull/29)
   is a draft weekly-schedule treatment still awaiting visual approval. Do not
   treat local visual polish as an approved end-to-end design direction.

**Delivery order:** build Dashboard V1 as the next functional slice; define and
validate Adaptive Coaching V1 before enabling automatic adjustments. Continue
UI/UX concurrently, ensuring new features meet the selected design standard from
the beginning.

### Deferred or independent work

- Weekly-plan semantic assessment in shadow mode, nutrition coaching, manual
  active-week editing, general workout classification, multi-session planning,
  concurrent training providers and advanced individual LT1 calibration are
  **not** active product initiatives.
- Heart-rate-zone visibility is **delivered**, not a future priority.
- Supabase RLS ([backend issue #354](https://github.com/jordiadan/springboot-running-coach/issues/354))
  and Strava data-lifecycle/policy validation remain **independent security and
  compliance gates**. Never expose unreliable or prohibited source-derived
  analytics merely because the UI has a chart.
- A dedicated calendar, standalone session route, coach/team workflows and
  additional sign-in methods remain unapproved scope.

These statuses describe planned work and repository code, not verified
production availability or approval to merge any pending PR.

## Brand Commitments

The existing product name is Running Coach. Current user-facing copy is in
English; this is observed implementation, not a confirmed localization strategy.
Project conventions require plain language, calm and intuitive flows, clear
hierarchy and no marketing fluff. The agreed revamp direction is mobile-first,
premium, minimal and deliberately animated without sacrificing clarity or
accessibility. This is a design brief, not approval of a specific layout or
final visual system. The existing implementation is recorded in DESIGN.md.

**Needs confirmation:** final brand voice, localization priorities, audience
positioning and any binding visual references or preferred theme. Existing theme
options do not establish a preferred future direction.

## Evidence on Hand

Frontend baseline: `running-coach-web` commit
`46c86587557a02ee2883795540b0e1b3be364dbf` (PR #15's base). Sources:
`src/App.tsx`, `src/pages/LoginPage.tsx`, `src/pages/PortalPage.tsx`,
`src/components/portal/`, `src/lib/portal-api.ts`, `src/lib/portal-onboarding.ts`
and the portal tests in `src/test/`. Visual assets include
`src/assets/hero-running.jpg`; tokens live in `src/index.css` and
`tailwind.config.ts`.

Backend evidence: [springboot-running-coach at
ae083420](https://github.com/jordiadan/springboot-running-coach/tree/ae083420ab401378d86c2c3acb106146788e2559),
especially `docs/product/initiatives.md`,
`docs/product/ai-workout-intelligence.md`, `docs/event-storming.md`,
`docs/weekly-coach-generation-flow.md`, and controllers under
`src/main/kotlin/com/runningcoach/infrastructure/identityaccess/web/currentuser/`.

The above baseline references describe the 2026-10-08 implementation, not the
full current feature state. Product status was reconciled against merged
backend/frontend PRs and open initiative/prototype PRs on 2026-11-10. This is
repository evidence, not production deployment verification. Marketing sample
metrics, session examples and setup-time claims are not validated customer
results. Do not invent testimonials, performance claims, pricing or adoption
numbers from them.

## Product Principles

- Ship the smallest useful slice for the explicitly requested scope.
- Keep public/trust pages and authenticated workflows distinct.
- Make the next action clear with plain language and a simple hierarchy.
- Preserve the distinction between a prescription, recorded activity and manual
  completion; keep backend decisions authoritative.
- Treat the three confirmed product priorities as approved **scope to plan**, not
  permission to merge a specific implementation; other ideas stay deferred.

## Accessibility & Inclusion

Accessibility by default is a project requirement: semantic HTML, keyboard access,
visible focus, labels and readable content on mobile and desktop. This setup does
not certify WCAG compliance or establish product-specific accessibility needs.
**Needs confirmation:** any required compliance level or additional user needs.

## Open Decisions

The audience, localization and accessibility decisions above need product
confirmation before a task depends on them. Commercial positioning, success
metrics, detailed Adaptive Coaching acceptance criteria and the final UI design
system remain open. The three product priorities and their high-level delivery
order were confirmed on 2026-11-10.

The Impeccable construction preference (image comp first or code first) is unset.
**Needs confirmation before persisting a default:** ask when new-surface work
needs that choice. Only an explicit answer may populate `buildPath` in
`.impeccable/config.json` or its local override; this document records no default.
These decisions do not block a source-grounded setup or authorize interface work.
