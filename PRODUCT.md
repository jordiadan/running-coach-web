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
  routes; sessions expand within the weekly plan. The portal uses a desktop
  navigation rail and mobile bottom navigation. The public page labels its
  example week as illustrative and explains the three-step setup.
- Profile: display name, training goal, running days and preferred long-run day.
  The current UI requires at least four running days; the long-run day must be
  one of them. A race goal adds name, date, distance and a finish-only, target-time
  or target-pace objective. Fields are grouped into running context, schedule
  and race target; there is no editable context-notes field.
- Weekly plan: week navigation, objective, goal timeline, today's
  session, remaining sessions, long-run highlight and completed-distance summary
  when supplied by the API. Session details include modality, intensity,
  prescribed duration, notes and strength focus when supplied. The API also
  carries plan justification and placement rationale, shown in the “Why this
  plan” disclosure and session details when supplied. The seven-day strip opens
  and focuses the selected session's disclosure.
- Current-week non-rest sessions support manual completion when the API supplies
  completion state. A matched activity, its recorded metrics and provider link
  remain separate from manual completion: clearing a checkbox does not erase
  the activity. Planned duration is not performed duration, and checking a session
  does not fabricate activity distance.
- The race-goal card can record completed/skipped outcomes when eligible, and
  direct the athlete to Profile to set the next goal. A secondary goal may be
  displayed when returned by the API; that does not imply a multi-goal editor.

### Current backend support and boundary

The backend owns profile/preparation validation, provider data ingestion,
readiness, physiological calculations, plan generation and automatic event-driven
refresh of remaining sessions. It also implements planned-session matching and
Workout Execution Evaluation V1. Their existence is not a frontend execution-score
screen or the future adaptive-coaching initiative.

Generated running workouts are published to Intervals by the backend. Do not
promise equivalent Strava publishing. Generation already consumes available
recovery/readiness; the roadmap distinguishes that from changing future training
in response to actual-versus-planned execution evidence.

### Future initiatives — not current frontend functionality

Backend `docs/product/initiatives.md` records:

- AI-assisted workout intelligence: in progress; next slice is semantic assessment
  of weekly plans in shadow mode, without changing generated plans.
- Athlete performance dashboard: backlog, extending the weekly summary into
  multi-week metrics and trends.
- Adaptive coaching, nutrition coaching and a broader UI/UX revamp: candidates.
- Heart-rate zone visibility V2, manual active-week editing and workout
  classification: future follow-ups, explicitly not prioritized.

These are source-backed ideas/statuses, not approval to build them in this repo,
release dates or commitments. A dedicated calendar, standalone session screen,
coach/team workflows and additional sign-in methods are not established scope.

## Brand Commitments

The existing product name is Running Coach. Current user-facing copy is in
English; this is observed implementation, not a confirmed localization strategy.
Project conventions require plain language, calm and intuitive flows, clear
hierarchy and no marketing fluff. The existing visual system is recorded in
DESIGN.md and remains grounded in the code.

**Needs confirmation:** final brand voice, localization priorities, audience
positioning and any binding visual references or preferred theme. Existing theme
options do not establish a preferred future direction.

## Evidence on Hand

Frontend redesign baseline: `running-coach-web` commit `7dced9f`.
Current descriptions were reconciled with the redesign working tree on
2026-10-09. Sources:
`src/App.tsx`, `src/pages/LoginPage.tsx`, `src/pages/PortalPage.tsx`,
`src/components/portal/`, `src/lib/portal-api.ts`, `src/lib/portal-onboarding.ts`
and the portal tests in `src/test/`. Visual assets include
`src/assets/hero-running.jpg`; self-hosted fonts and their licenses live in
`public/fonts/`. Tokens live in `src/index.css` and `tailwind.config.ts`, with
the implemented system recorded in `DESIGN.md` and `.impeccable/design.json`.
The redesign review records checks from 320px through 1440px, four appearance
choices and 56 passing tests. These are implementation checks, not certification.

Backend evidence: [springboot-running-coach at
ae083420](https://github.com/jordiadan/springboot-running-coach/tree/ae083420ab401378d86c2c3acb106146788e2559),
especially `docs/product/initiatives.md`,
`docs/product/ai-workout-intelligence.md`, `docs/event-storming.md`,
`docs/weekly-coach-generation-flow.md`, and controllers under
`src/main/kotlin/com/runningcoach/infrastructure/identityaccess/web/currentuser/`.

Backend sources were checked on 2026-10-08. This record describes
implemented code, not production deployment verification. Marketing sample
metrics, session examples and setup-time claims are not validated customer
results. Do not invent testimonials, performance claims, pricing or adoption
numbers from them.

## Product Principles

- Ship the smallest useful slice for the explicitly requested scope.
- Keep public/trust pages and authenticated workflows distinct.
- Make the next action clear with plain language and a simple hierarchy.
- Preserve the distinction between a prescription, recorded activity and manual
  completion; keep backend decisions authoritative.
- Treat future initiatives and open decisions as unapproved until confirmed.

## Accessibility & Inclusion

Accessibility by default is a project requirement: semantic HTML, keyboard access,
visible focus, labels and readable content on mobile and desktop. This setup does
not certify WCAG compliance or establish product-specific accessibility needs.
**Needs confirmation:** any required compliance level or additional user needs.

## Open Decisions

The audience, brand/localization and accessibility decisions above need product
confirmation before a task depends on them. Commercial positioning, success
metrics and roadmap priority beyond the source statuses are also unconfirmed.

The Impeccable construction preference (image comp first or code first) is unset.
**Needs confirmation before persisting a default:** ask when new-surface work
needs that choice. Only an explicit answer may populate `buildPath` in
`.impeccable/config.json` or its local override; this document records no default.
These decisions do not block a source-grounded setup or authorize interface work.
