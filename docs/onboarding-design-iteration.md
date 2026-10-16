# Onboarding design iteration

Scope: the authenticated onboarding journey on `feat/onboarding-ux-revamp`, based
on merged PR #25 (`86a3bd1`). Mode: Operate. Public pages and backend contracts
are outside this change.

## Surface brief

The runner's task is to connect one training source, save a valid athlete profile,
and reach their first real weekly plan. Experience level is not assumed. The
first useful outcome is the completed Weekly Plan, not a tour or sample plan.

Extend the portal's DM Serif Display titles, DM Sans controls, four themes, flat
tonal surfaces, 16px panels and 12px controls. On this surface, Running Coach's
single-source setup and seven-day training rhythm become the working interface.
The source choice and weekday controls are real shared Connect/Profile controls.

Taste dealt quiet-instrument, product-performs and split-stage. Choose
product-performs (seed `89199575`): real controls at a readable scale. Retain
the portal's palette and type. Marketing photographs, hero sizing, density quotas
and pinned storytelling do not apply to authenticated task UI. No images or new
dependencies are needed; code-first is task-local, not a saved preference.

Mobile hierarchy: compact labelled three-step sequence; one task title and one
supporting sentence; the shared task controls; a clear action and feedback.
Desktop: a quiet setup rail alongside a generous task surface, aligned with the
portal shell. No enclosing card around cards, duplicate welcome heading, fake
percentage, estimated completion time or tutorial ceremony.

Connect retains both providers, capability differences, authorization, one-active
source restrictions and recovery. Profile retains essentials, weekly rhythm,
conditional race details, validation and saving. Optional future coach notes do
not belong in the first-run task. Existing settings presentation stays intact.

Plan preparation uses only bootstrap facts: connected source, saved profile and
missing/preparing/failed/ready plan status. No simulated milestones. Missing means
the first plan is not available yet; preparing means generation is in progress.
Failure preserves setup and offers retry. Retry and refresh failures remain inline
and actionable. Polling cannot erase the last usable onboarding state. A ready
transition offers one action to enter the actual weekly plan; returning users
whose first bootstrap is already ready enter the portal directly.

Use brief state transitions, focus the task title when the backend step changes,
and focus the weekly view on entry. Reduced motion removes travel and continuous
animation. Setup completion remains backend-driven. Protect profile edits when
leaving or logging out, as the portal already does.

## Baseline weaknesses

- A 42rem shell encloses a second narrow card, squeezing shared components and
  forcing providers into a long vertical stack even on desktop.
- Welcome, current-step and component headings compete. Mobile hides step names.
- Percentages measure setup completion while visually implying generation progress.
- Rotating sparkles, colored halos and three pulsing task descriptions suggest
  generation stages the API never supplies.
- Generation retry rejection has no readable recovery message. A background
  bootstrap failure replaces the whole journey and can discard profile edits.

## Verification and visual review

The first actual-app review found mobile provider cards too tall: only the first
source's identity appeared prominently in the first viewport. The correction
keeps the existing provider components, with compact identity/status rows on
mobile. Both source names are now visible at 390×844. Desktop retains the
side-by-side comparison and capability distinctions. Removing the outer card
gives Profile usable width, and removes a redundant layer on every state.

The preparation review found its setup facts stretched across the whole surface.
The final desktop summary puts supporting explanation beside the actual receipt;
mobile stacks them. The track-line mark echoes the existing portal identity.
Only the indeterminate checking icon moves; no generated workouts, fabricated
progress, timing or milestones appear. Missing, preparing, failed and ready have
separate truthful messages. The ready action opens the real Weekly Plan.

The independent Impeccable finish review requested three corrections: missing
must say waiting rather than preparing, automatic successful polling must clear
an earlier manual refresh warning, and DESIGN.md must describe the new geometry.
The verdict pass scored all three resolved (`ship`, scoped to those fixes).
Documentation was checked against the actual CSS/components, retaining all
incumbent tokens and the sidecar. Existing sidecar drift was left untouched;
the optional `document` workflow can reconcile it separately.

Functional corrections also include protecting onboarding profile drafts on
home/logout/unload, keeping the last usable step after a failed background
bootstrap, retaining the connected-completion callback across parent rerenders,
and preventing a cached authorization failure from ending a new reconnect
attempt's polling. Only a newer provider response can end that attempt. Backend
bootstrap still selects the next step; optimistic frontend step overrides were
removed. Initial ready bootstrap continues directly into the portal, while a
journey that becomes ready waits for the runner's explicit action.

## Validation

- `npm test`: 155 tests across 13 files pass. Ten new regression cases cover
  authoritative progression, truthful generation state, retry/refresh failures,
  automatic refresh recovery, ready focus/handoff and callback stability.
- `npm run lint`: zero errors; nine existing Fast Refresh warnings remain.
- App and Node/config typechecks pass. The baseline had eight errors; this change
  removes the unsupported `replaceAll` call, adds explicit existing API response
  types, supplies a missing fixture status, and merges a duplicate test assertion
  so activity provenance is actually checked. No runtime API contract changed.
- E2E test/config typecheck and `npm run build` pass. Existing Browserslist age
  and bundle-size warnings remain; no dependency or lockfile changes.
- The actual Vite application passes 11 Playwright cases using intercepted
  synthetic auth/API fixtures. Cases cover all onboarding states, provider OAuth
  popup arguments and polling with a lagging provider snapshot, failed
  authorization/reconnect, profile loading/error/save failure/retry, long-run
  restrictions and time/pace conversion, generation retry/reload/polling, initial
  bootstrap failure/retry, profile exit guards, keyboard/date-picker focus,
  reduced motion, ready handoff and direct entry for returning ready users.
- Desktop (1440×1000) and mobile (390×844) captures cover connection, profile,
  missing, preparing, failed and ready. The five ongoing states have captures in
  all four themes; ready was checked in all four themes as well. Forty measured
  state/theme/viewport text-contrast cases pass, minimum observed ratio 4.89:1.
  Theme tokens are asserted and nested color transitions settle before sampling.
- Widths 320, 390, 640, 768, 900, 1024, 1280 and 1440 have no horizontal overflow.
  Day controls meet 44×44px. One main landmark, one current setup step, zero fake
  progress bars and no browser page errors were verified.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
  informed labels, focus, status announcements, semantic controls, native error
  details, touch targets, safe-area clearance and reduced motion. This bounded
  browser check is not a full WCAG certification.
- Taste source lint passes with one documented incumbent-elevation exception.
  Its browser probe and judge ran through Playwright inside authenticated fixtures
  at 1440, 768 and 390px. Raw marketing findings remain in the ignored report:
  photographs/video, giant focal type, five-size limits, the warm palette, portal
  elevation/dividers, compact form/help text, and a step label misclassified as an
  eyebrow. These conventions follow the explicitly requested portal system and
  Operate mode, so they were retained. No raster or ornamental motion was added.
- The project Impeccable hook reported no deterministic design issues. It was
  not duplicated with a separate detector. Changed TypeScript files were formatted
  using the installed TypeScript formatter; CSS retains the project's style.

## Evidence and reproduction

Captures remain ignored in `.design-experiment/onboarding/`; no screenshot or
athlete data is committed. `comparison.html` shows a representative Connect
desktop and preparation mobile before/after set (four screenshots total).
The remaining local captures support detailed inspection, rather than inflating
the PR's representative evidence set. All displayed identities are synthetic.

The committed runner is `e2e/onboarding.spec.ts` with its standalone configuration:

```sh
mkdir -p .design-experiment/tmp
env TMPDIR="$PWD/.design-experiment/tmp" CAPTURE_STAGE=final \
  ./node_modules/.bin/playwright test --config e2e/onboarding.config.ts
```

It reuses the installed browser and starts/reuses Vite at port 5173. Normal local
Vite environment settings are required to initialize the existing auth client;
all auth storage and API responses in the tests are synthetic. Screenshots and
test output stay in the ignored experiment directory.

## Limits and intentional deviations

Live Google/provider consent, popup-blocker fallback, real provider ingestion and
production plan generation were not exercised. The existing redirect/fallback
code and API requests remain in place; controlled tests establish frontend
behavior, not live backend outcomes. Browser coverage is Chromium, not
Firefox/WebKit. Drafts remain in memory and are protected from accidental exit;
they do not survive a deliberately confirmed reload or logout.

No product preferences were inferred or persisted. Future coach notes are omitted
only in onboarding; settings retain their existing presentation. No unrelated
public page, backend, global hook or dependency changed. GitHub's available CLI
does not provide image-attachment upload, so captures remain locally reviewable
and reproducible rather than being committed or published through an unrelated
service.
