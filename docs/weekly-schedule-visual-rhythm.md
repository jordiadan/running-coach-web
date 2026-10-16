# Weekly schedule visual rhythm

## Brief

Continue from the user-approved component alignment in PR #28, merged at
`8b15548`. Scope: the “Your schedule” agenda inside Weekly Plan. Keep the public
Landing/Login identity, the portal shell, today's session, context sidebar and
week navigation. Connect, Profile, onboarding, authentication and backend
contracts are outside this change. Mode: Operate.

The runner should see the week's training/rest rhythm, compare prescribed
session lengths and open the detail of a particular day without decoding
identical rows. Preserve chronology, current/past-week rules, completion and undo,
save feedback, provider evidence, execution evaluation and all empty/error states.

## Spatial thesis

Use one chronological agenda with a quiet date rail. Each session leads with its
title, modality/intensity and explicit state. A common-scale horizontal bar
compares prescribed minutes with the longest training session in the displayed
week; the minute label remains readable without the graphic. A short legend
states the encoding. Rest rows are quieter and shorter, without invented training
time. Missing days remain absent from the agenda rather than being fabricated
as rest. The existing dated navigation continues to open and focus the real
session detail.

The heading retains the completion count and gains a truthful sum of prescribed
non-rest minutes when positive. This is planned time, not performed duration,
distance, training load or an execution score. Rows retain separate completion
controls and activity provenance. Desktop and mobile share one chronological
reading order; text wraps, controls stay at least 44px and long titles remain
readable. Use the approved serif/sans hierarchy, four themes, fine dividers and
shared control radius. No new assets or dependencies.

## Motion thesis

- Focal interaction: opening a day unfolds its real detail in place, preserving
  the surrounding chronology. Closing is faster than opening; repeated toggles
  must interrupt cleanly. No page-load sequence or delayed controls.
- Continuity: duration bars retain their true lengths at rest and interpolate
  only if the underlying plan changes. They never animate as completion meters.
- Feedback: manual completion draws the existing check in the same control,
  while the current optimistic update, pending disable, failure rollback and
  feedback text remain authoritative.
- Budget: existing Framer Motion, one bounded detail expansion at a time, short
  160–240ms state transitions. Reduced motion renders final states immediately.
  No loops, simulated progress, chart libraries or scroll spectacle.

## Verification

Before screenshots use the actual app with synthetic auth/API data at 1440×1000
and 390×844, under ignored `.design-experiment/schedule/`. After implementation,
check equal-scale bar accuracy, missing/rest/zero-duration data, recorded versus
planned metrics, keyboard focus, rapid toggles, pending/error rollback,
historical/future navigation, themes and responsive extremes. Run the existing
regressions plus focused coverage of the new schedule semantics. Review desktop
and mobile together, correct material issues in one batch, then confirm once.

## Implementation and review

The surrounding Weekly Plan composition is unchanged. Schedule rows now form a
native ordered list. A single comparison scale and explicit minute labels show
the prescribed training rhythm, while a fine date rail and shorter rest rows
maintain chronological scanning. Completion controls remain separate buttons;
ineligible sessions reserve the same visual space without a fake control, so
duration tracks align. Supporting metadata and execution feedback keep their
existing eligibility rules.

The initial browser pass was inspected on desktop and mobile. Follow-up work
kept completion SVGs mounted so already-completed sessions do not draw checks
on load, ensured zero-length checks are fully transparent, gave closing details
a shorter exit, and described planned minutes/state to assistive technology.
The previous no-score regression assertions now distinguish a legitimate
planning description from an execution-score description; they still reject
unsupported evaluation content and score references.

Detail opening uses a bounded `0fr` to `1fr` grid-row reveal over 240ms, with a
160ms exit. Only one day is expanded at a time; a closing panel becomes
`aria-hidden` immediately, without delaying the next selection. The seven-row
surface has one bounded intrinsic-size transition rather than a page-wide
animation system. Completion circle/check feedback takes 120/180ms. Duration
bars begin at the true value and use `scaleX` for subsequent data changes; they
are not progress meters. All spatial/drawing transitions become immediate under
reduced motion.

## Validation results

- `npm test`: 162 passing tests across 13 files. Six new schedule regressions
  cover prescribed versus recorded time, rest exclusion from totals, partial
  chronological plans, all-rest plans, zero-duration plans, accessible disclosure
  changes and historical-week resets. The time/evidence case covers two related
  boundaries in one test. Existing completion, provider evidence, execution and
  goal workflows remain covered.
- App typecheck passes: `tsc --noEmit -p tsconfig.app.json`.
- Lint passes with zero errors and nine existing Fast Refresh warnings.
- Production build passes with the existing Browserslist-age/bundle-size
  warnings. No dependency, lockfile, raster asset or backend changes.
- Actual Chromium application: four themes at 320, 390, 768 and 1440px, with 16
  layout/text-contrast measurements. No horizontal overflow or sampled text
  contrast failures. Session-detail/completion targets stay at least 44×44px.
- Browser measurements verify each rendered bar's length against its prescribed
  minutes divided by the 85-minute maximum in the synthetic fixture, with less
  than 0.01 absolute ratio difference at every measured viewport/theme.
- Keyboard Enter opens/closes a detail; rapid reversal leaves exactly one
  accessible panel. Browser interactions verify pending disables, failure
  rollback/retry, completion/undo, invariant planned total, historical completion
  restrictions and the future no-plan state.
- Additional 320px cases pass for partial, all-rest, zero-duration, long-title/
  long-note, linked-activity/evaluation and empty-session data. Missing days are
  not synthesized as rest, and matched activity metrics do not enter the planned
  total.
- Actual motion is recorded and sampled. In the mobile fixture, normal detail
  height progresses through 0, 40.28, 69.56, 79.48 and 81.5px before settling;
  closing samples return through 34.47 and 5.14px to zero. Reduced-motion samples
  at 32, 64 and 144ms are identically 106.25px at 320px width, with zero running
  browser animations. No page errors were recorded.

Before/after screenshots use the same synthetic data and comparable desktop/
mobile viewports. Representative full-page files are `before-desktop.png`,
`final-desktop.png`, `before-mobile.png` and `final-mobile.png`. Additional theme,
expanded/keyboard and motion evidence is kept under the same ignored directory,
including `validation.json` and the motion video. Fixed mobile navigation can
appear midway through a full-page capture because it remains fixed to the
viewport; viewport captures were also inspected. Element-only captures with
sticky-header occlusion are not selected as review evidence. Screenshots are
not committed; the current CLI does not support GitHub image attachment upload.

The evidence uses synthetic session/API fixtures in the real application. It
does not claim live provider authorization, production plan generation,
cross-browser compatibility, accessibility certification or a measured product
outcome. User review of this new schedule iteration remains pending; approval
and merge of PR #28 apply to its component alignment only.
