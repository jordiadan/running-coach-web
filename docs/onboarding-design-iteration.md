# Onboarding design iteration

Scope: authenticated onboarding in PR #26, on `feat/onboarding-ux-revamp`.
Mode: Operate. Public pages, backend contracts, dependencies and global themes
are outside this change.

## Surface brief

Help a runner connect one training source, save a valid profile and open their
first real weekly plan. The useful outcome is the actual Weekly Plan. Experience
level is not assumed; product facts come from PRODUCT.md and the existing API.

Retain the portal's DM Serif Display headings, DM Sans controls, theme roles,
provider identities and control geometry. The runner's source choice and weekly
rhythm are the interface's distinctive material. Refine that working interface
rather than introduce decorative imagery, a new theme or a tutorial.

At every width, the hierarchy is a compact three-step path, one task heading,
necessary controls and one primary action. A 47rem outer maximum includes the
portal's existing 24px side padding. Desktop and mobile share this calm reading
axis; the former desktop rail, welcome slogan and step descriptions are removed.

Connect uses two native radio choices and one explicitly named authorization
button. No provider is preselected. Capability differences stay visible; a
native disclosure explains the shared data. Authorization, pending status,
reconnect, request failure and status-query recovery remain available. Existing
source replacement/disconnection dialogs remain in the shared component.

Profile puts fields on the page rather than inside another card. Essential
labels explain themselves; weekly rhythm and conditional race details retain
short section headings. Four-day minimum, long-run restrictions, target
conversion, validation, draft protection and save recovery remain intact. Seven
weekday targets fit from 380px; narrower phones retain four columns. Race-target
choices share one row. The first-run editor omits future coach notes.

Preparation is one running mark, heading and short explanation. Supporting setup
facts move behind “View your setup.” Missing, preparing, failed and ready are
separate backend states. Refresh/retry errors remain inline. The ready state has
one dominant action, “Open weekly plan.” No percentages, fabricated workouts,
estimated duration, simulated stages or additional generation requests appear.

## Motion thesis

- **Focal moment:** the existing running-track mark gives way to a drawn check
  only when bootstrap reports the plan ready. Pending generation has no decorative
  loop. The checking spinner runs only during a real request.
- **Continuity:** the current-step underline and provider selection surface use
  shared-element springs. The task heading preserves position through layout
  changes; incoming controls settle horizontally over a short distance.
- **Feedback:** provider selection fills its native radio; confirmed connection
  draws a check; weekday selection draws its check. The connection callback uses
  the latest parent callback and retains a manual Continue fallback.
- **Budget:** existing Framer Motion only. Springs are heavily damped
  (step 380/36, provider surface 420/38). Opacity changes use brief tweens;
  the ready check draws in 320ms. No timers invent generation progress.
- **Control:** backend progression replaces old controls immediately. Exit
  animations cannot hold the next task hostage. Portal entry focuses its mounted
  workspace. Reduced motion removes layout travel, scale, drawing and CSS motion,
  retaining the final state, labels and announcements.

## Actual-browser critique and iteration

All captures show the running Vite app with synthetic auth/API fixtures, using
1440×1000 desktop and 390×844 mobile. These are implementation screenshots.
Scores below are subjective design judgments using Taste's critique structure,
adapted to an authenticated task rather than a marketing page.

### Before refinement

Seen in one second: a setup sidebar competing with two large provider cards.
Idea: the runner's source and rhythm lead to one real week.
Live thing: connect a source and configure a real profile.
Layout: rail / paired cards / boxed profile / summary-and-receipt card.
Scores: design 6.5 · usability 7 · creativity 6 · content 7 → overall 6.7.
Caps: marketing imagery and billboard-type requirements do not apply in Operate.

Top three problems:

1. Connect desktop repeats onboarding explanation in the rail and guidance, then
   presents two equally prominent actions. Replace with a compact path, two source
   choices and one authorization action.
2. Preparation mobile repeats the state in a heading, explanation, card heading,
   receipt and status strip. Remove the enclosing surface and repeated status;
   disclose setup details only when requested.
3. Profile mobile spends space explaining ordinary fields and enclosing groups.
   Flatten the editor, keep meaningful labels/constraints, and compact weekday
   and race-target choices.

### First refinement pass

Seen in one second: one task title and a direct action path.
Idea: the source choice becomes the working interface.
Live thing: select a source; one button adopts that provider's name.
Layout: compact path / source rows / unboxed fields / simple state.
Scores: design 7.5 · usability 8 · creativity 7 · content 8 → overall 7.6.
Caps: same scoped marketing exceptions.

The paired desktop/mobile inspection found three corrections: restore visible
radio outlines, tighten source-row spacing, and apply the intended three-column
race-target layout on mobile. These were fixed together. The radio correction
also replaced an invalid CSS variable with the existing portal control-line role.

### Final confirmation

Seen in one second: the current task, with a single clear action.
Idea: the running identity resolves into confirmed readiness.
Live thing: native source choice, responsive weekday selection and actual plan entry.
Layout: one axis / selectable rows / open form / readiness statement.
Scores: design 8 · usability 8.5 · creativity 7 · content 8 → overall 8.0.
Caps: same scoped marketing exceptions. This is an in-thread review, not an
independent jury result or user research.

The confirmation keeps both providers and the action comfortably within the
mobile viewport. Preparation fits in one screen. Profile is shorter without
hiding required race fields. The ready mark resolves to one check. Browser
motion recording exposed nested exit waits that could retain stale controls or
delay portal entry; the final implementation makes progression immediate and
focuses the mounted workspace. A stale retry error also clears when polling
reports readiness.

## Verification

- `npm test`: 156 tests across 13 files, including the regression for retry-error
  recovery on automatic readiness.
- `npm run lint`: no errors; nine incumbent Fast Refresh warnings.
- App, Node/config and standalone E2E TypeScript checks; production build.
  Existing Browserslist age and bundle-size warnings remain.
- Twelve Chromium Playwright cases exercise the actual app with synthetic data:
  source selection and keyboard arrows, connection failure/retry, OAuth popup
  arguments and lagging authorization status, profile loading/save recovery,
  rhythm constraints, time/pace conversion, retry/reload/polling, background
  bootstrap recovery, draft exit guards, date-picker focus, reduced motion,
  initial-ready entry, setup disclosure and explicit ready handoff.
- Forty theme/state/viewport text-contrast scans pass; minimum observed 5.11:1.
  Ready is also checked across all four themes. No horizontal overflow at 320,
  390, 640, 768, 900, 1024, 1280 or 1440px. Day targets meet 44×44px. One main
  landmark and one current setup step; no fabricated progress bars or page errors.
- Taste source lint has no failures. Its remaining outlined-box advisory is the
  native radio affordance. Browser probe ran at 1440, 768 and 390px using the
  authenticated fixtures. Marketing findings about photography/video, giant
  focal type, the inherited warm palette/header and compact help text are
  intentionally inapplicable. The mixed-font warning identifies the incumbent
  Intervals mark. No new marketing composition or image generation was used.
- Impeccable's single mechanical scan reports only advisory differences from
  DESIGN.md's abbreviated frontmatter: existing portal supporting sizes and the
  heading focus radius, plus scoped 20px section/source labels. These values are
  recorded in the design narrative; global tokens, hooks and sidecar stay intact.
- Changed TypeScript and CSS were formatted with existing local tooling.

## Evidence and reproduction

Ignored evidence lives in `.design-experiment/onboarding/`. The four-image
`refinement-comparison.html` compares Connect desktop and preparation mobile,
before/after this refinement. Additional captures cover profile, selected source,
missing, failed and ready states. The same page links a real browser recording
of the complete journey. No screenshot, video, real identity or token is committed.

```sh
mkdir -p .design-experiment/tmp
env TMPDIR="$PWD/.design-experiment/tmp" CAPTURE_STAGE=refine-after \
  RECORD_MOTION=1 ./node_modules/.bin/playwright test --config e2e/onboarding.config.ts
```

`RECORD_MOTION=1` is optional; videos land with ignored Playwright output. The
runner reuses the local browser and starts/reuses Vite on port 5173. Normal local
Vite configuration initializes the existing auth client; all auth storage and
API traffic in these tests are synthetic.

GitHub's available CLI has no image-attachment upload. The PR identifies the
local comparison and reproduction command; captures are not published through
an unrelated service or committed as a substitute for attachments.

## Limits

Live Google/provider consent, popup-blocker fallback, provider ingestion and
production generation were not exercised. Chromium fixtures establish frontend
behavior, not live backend outcomes or Firefox/WebKit coverage. Drafts remain in
memory and do not survive a deliberately confirmed reload/logout. The complete
race form remains longer than the non-race path because its required fields are
preserved. No audience, commercial or permanent aesthetic preference was inferred.
