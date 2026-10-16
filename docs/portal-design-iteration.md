# Portal design iteration

Scope: Connect, Profile and the authenticated application shell on
`experiment/ui-design-skills` (PR #25). Public pages, backend contracts and Weekly
Plan behavior remain outside this iteration. Mode: Operate.

## PR #25 review corrections

The follow-up fixes preserve this direction and address the four review findings:

- Weekly Plan now uses the portal's shared primary, action and error roles.
  Dark action surfaces and Bright primary labels inherit the existing contrast
  adjustments. Light-theme error text is darkened slightly so race-outcome errors
  remain readable on the weekly context surface. Goal actions use the same roles.
- Profile compares persisted fields and the selected race target, excluding its
  display-only equivalent. A successful write updates the saved baseline even
  when the next read returns an unchanged snapshot. Failed writes retain drafts;
  calculated-zone refreshes still preserve edits.
- Weekly Plan uses a labelled section inside the shell's single main landmark,
  including loading and error states.
- The dated day navigator uses four columns below 400px and seven above, keeping
  every target at least 44px wide at the checked widths. This small responsive
  deviation follows the existing Profile day-control pattern.

Seven added regression cases cover time/pace reversion, save acknowledgement,
failure preservation, real shell/Profile history and discard, navigation after
save, and the single main landmark. Validation: 145 tests across 12 files pass;
lint has zero errors and nine existing warnings; build passes; app typecheck has
the same eight baseline errors and the Node/config typecheck passes.

The actual app was checked in Chromium with synthetic auth/API fixtures at
320–1440px. Twenty theme/state text-contrast scans have no failures, with a
minimum measured ratio of 4.85:1. Checks include race-outcome errors and next-goal
actions, completion/undo, keyboard focus, reduced motion, save failure/retry,
persisted reload, history restoration and provider-dialog cancellation. These
checks do not establish live OAuth/backend or Firefox/WebKit compatibility.

Follow-up evidence stays ignored under `.design-experiment/pr25-fixes/`:
`verification.json`, `after-weekly-dark-desktop.png` and `after-weekly-mobile.png`.
Comparable before captures are in `.design-experiment/pr25-review/`. No mockup,
production athlete data or screenshot is committed.

## Direction and acceptance brief

Extend the existing Weekly Plan identity: warm ivory, theme-aware primary color,
DM Serif Display for page titles and DM Sans for controls and data. The product's
single training source and seven-day training rhythm provide the structure.
A clear status, an explicit action and readable training settings take precedence
over decorative assets or marketing composition.

- Stable, wide shell across all three destinations. One navigation set: in the
  header on desktop, a safe-area-aware bottom bar on mobile. Preserve theme and
  logout access, visible focus and reduced-motion behavior. No sidebar is needed
  for three destinations. Selection is visible without relying on color alone.
- Connect: provider identity, status and capability appear before the action.
  The active source has a stronger tonal surface; the other source stays quiet.
  Disconnection names the action instead of disguising it as a status button.
  Preserve replacement confirmation, OAuth redirects, polling and one-source rule.
  Include loading, missing status/retry, authorization failure/reconnect, pending,
  mutation failure, connected and disconnected states.
- Profile: identity and training summary complement a form organized into
  essentials, weekly rhythm and race goal. On mobile, identity becomes a compact
  strip; the form leads. Running days expose selection and the four-day minimum;
  long-run selection remains restricted to running days. Preserve race target
  conversions, validation, date picker, persistence and calculated zones.
  Saving, failure, success and unsaved changes have readable feedback.
- Weekly Plan retains its composition and behavior, inheriting only the shell.

Taste `product-performs`, seed `1590966961`, was selected from split-stage,
product-performs and quiet-instrument. Its useful principle is real controls at
readable scale. On these screens, the single-source restriction becomes the
connection hierarchy and the seven-day training rhythm becomes the live control.
The marketing skill's photographs, giant hero, masked headline, density rules and
motion quotas do not apply to authenticated task UI; Impeccable Operate and the
repository's product rules take precedence. No new imagery or dependencies.

Before implementation, rejected generic alternatives: interchangeable icon cards,
an oversized sidebar for three tabs, a second row of seven long-run buttons,
and decorative fitness charts without supported data. Character instead comes
from editorial titles, an athlete monogram, precise day controls and differentiated
surfaces. Motion communicates navigation and operation state in 150–200ms.

## Visual inspection and corrections

Playwright CLI opened the actual Vite application at `/portal`, intercepting auth
and backend responses with synthetic fixtures. No production security code was
bypassed, no real account was used and no provider request reached a live service.
Before/after captures use the same data at 1440×1000 and 390×844.

The first visual pass found that the active provider appeared below the inactive
provider on mobile, while the always-sticky save bar covered untouched form
content. The final composition puts the active source first, keeps the initial
save bar in flow, and makes it sticky only during edits, saving or failure. The
mobile identity is compact; detailed athlete context remains on desktop.

The independent finish reviewer identified three material fixes: preserve drafts
across browser history, meet 44×44px targets for running days, and document the
new portal geometry. All three were scored resolved. Drafts now live in shell
memory, including unparsed time/pace text, and survive Back/Forward. Explicit
discard clears them; document unload requests the browser's native warning.
Running days use four columns below 640px and seven above. DESIGN.md and its
sidecar record the scoped extension; unrelated historical drift is not repaired.

A final compiled-CSS check exposed a pre-existing theme defect: Tailwind could
not discover dynamically constructed theme class names. The small literal map
in `useTheme.tsx` retains the four already-declared palettes. It adds no palette,
changes no default theme and introduces no new theme feature. This shared-control
compatibility fix also restores the existing theme selection outside the portal;
public page structure and copy remain untouched.

Earlier theme-class-only contrast measurements were invalid because they did not
verify the applied tokens. They were replaced with tests that operate the real
theme menu, assert computed background/primary variables, wait for transitions to
settle, and measure text against composited backgrounds. Local dark/bright action
fills and primary text were corrected; portalled dialogs carry the same roles.
The focused follow-up review returned `ship` for this compatibility correction;
the earlier `ship` verdict covers the three scored redesign fixes. Twelve real
theme/state measurements and six additional theme/dialog captures support that
bounded verdict.

## Quality assessment

| Question | Assessment from the running application |
| --- | --- |
| Does it look professionally designed? | The scoped design review reached its craft ceiling after the material fixes; hierarchy, proportions and editing flow are deliberate. This is a design judgment, not a claim of an award or universal preference. |
| Is there a recognizable identity? | Editorial serif titles, the track-line brand mark, athlete monogram, active-source field and tactile weekday controls extend the existing running identity. |
| Does hierarchy guide the runner? | Active source leads Connect; essentials, weekly rhythm and race target organize Profile; one save action owns editing feedback. |
| Are components distinctive and usable? | Provider identity and status are separated from explicit actions; day selection uses checks and pressed state; long-run choices are restricted to running days. |
| Is navigation deliberate on both viewports? | Three native destination links share a stable shell, use header placement on desktop and a safe-area-aware bottom bar on mobile, and retain URL/history behavior. |
| Is Weekly Plan coherent? | Its composition and code are preserved; all three destinations share title scale, theme roles, spacing and geometry. |
| Does motion help? | Short transitions identify navigation and operation state; reduced motion removes travel and local transitions. No decorative entrance sequence or motion quota. |
| Is it better, not merely different? | It removes changing shell width, ambiguous disconnection, duplicate long-run day grids, lost drafts and unreadably small targets, while adding clear error recovery and save feedback. |

## Validation

- `npm test`: 138 tests pass across 11 files. Added regression coverage for source
  failure/retry, disconnection confirmation, four-day minimum and long-run fallback,
  zone refresh preserving edits, shared destination links and bootstrap refresh.
- `npm run lint`: no errors; the same nine existing Fast Refresh warnings remain.
- `npm run build`: passes. Existing Browserslist age and bundle-size warnings remain.
- Repository typecheck (`tsc --noEmit -p tsconfig.app.json`): eight existing errors.
  A read-only copy of HEAD reproduces the same diagnostics, ignoring moved lines.
  They concern `replaceAll` versus the ES2020 lib and existing test fixtures. No
  new type errors were introduced. A separate ignored UI config excluding tests
  and using ES2021 passes; the repository configuration was not changed to hide errors.
- Playwright checks both screens at widths 320, 390, 640, 768, 900, 1024, 1280 and
  1440px: no horizontal overflow; all running-day controls meet 44×44px.
- Browser interactions cover provider status loading, unavailable status/retry,
  pending/failed authorization, connection failure/retry, replacement/cancel,
  disconnection/cancel, Profile loading/error/retry, pending/error/successful save,
  persisted reload, race target conversion, restricted long-run choice, dirty
  navigation, Back/Forward restoration, date-picker keyboard dismissal and Weekly
  Plan session details. No browser page errors.
- Contrast checks cover actual Warm, Dark, Bright and Forest palettes after
  settling, including shell navigation and portalled confirmations (12 measured cases).
  Minimum observed text contrast across Connect, Profile and those dialogs is 5.11:1. This is a bounded browser check, not a complete
  WCAG certification or an audit of unrelated screens.
- Keyboard, focus, labels, semantic links/buttons, dialog cancellation, visible
  selection, safe-area clearance and reduced motion were reviewed against
  [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
  Existing profile validation and supported race controls are preserved.
- Impeccable detector on changed UI targets: zero primary findings and 30
  advisories, chiefly the older type ramp. New portal scale is now documented.
  The detector was not rerun merely to remove advisory counts.
- Changed files were formatted using the installed TypeScript formatter and
  PostCSS; no formatting dependency, UI package or lockfile was added.

## Captures and reproducibility

Evidence remains outside tracked source under ignored `.design-experiment/portal/`.
Open `comparison.html` there for all desktop/mobile before/after pairs. The most
representative review set is Connect desktop plus Profile mobile; the gallery
also retains the other pairs and Weekly Plan navigation comparisons. No screenshot
is committed or represented as a mockup. All names/accounts are synthetic.
Fixed navigation appears at viewport height within full-page captures.

| Surface | Before | After |
| --- | --- | --- |
| Connect desktop | `before-connect-desktop.png` | `after-connect-desktop.png` |
| Connect mobile | `before-connect-mobile.png` | `after-connect-mobile.png` |
| Profile desktop | `before-profile-desktop.png` | `after-profile-desktop.png` |
| Profile mobile | `before-profile-mobile.png` | `after-profile-mobile.png` |
| Weekly Plan desktop | `before-weekly-plan-desktop.png` | `after-weekly-plan-desktop.png` |
| Weekly Plan mobile | `before-weekly-plan-mobile.png` | `after-weekly-plan-mobile.png` |

Additional theme captures: `connect-dark.png`, `connect-bright.png`,
`profile-dark.png`, `profile-bright.png`, plus `dialog-dark.png` and
`dialog-bright.png`. The ignored Playwright runner is
`.design-experiment/portal.spec.ts`, with config `.design-experiment/portal.config.ts`.
Run against the local Vite server with the installed CLI:

```sh
env TMPDIR="$PWD/.design-experiment/tmp" CAPTURE_STAGE=after ./node_modules/.bin/playwright test --config .design-experiment/portal.config.ts
```

## Limits and intentional deviations

Real OAuth consent, account credentials and live provider ingestion were not
exercised; existing redirect/popup behavior and API contracts remain unchanged.
Synthetic snapshots establish interface behavior, not backend production results.
The existing suite covers provider and profile integration calls. No new raster
asset is shipped; the Intervals identifier is a typographic cue beside its full
provider name, not a claim to supply an official logo asset.

Bespoke portal CSS extends the existing primitives rather than replacing the
shared component library. Shared theme classes and the theme-button accessible
name are the only compatibility/accessibility changes also used by public pages.
Onboarding reuses the settings presentation while retaining its existing
connection/profile/completion sequence and OAuth behavior. Weekly Plan component
code and planning/completion contracts are unchanged.

The unconfirmed build-path preference was not persisted. The marketing-specific
Taste imagery and motion quotas were intentionally omitted for task UI. No new
preference, backend capability, roadmap feature, global hook or dependency was
introduced. Drafts survive portal navigation in memory; they are not saved across
a deliberately confirmed reload or logout.
