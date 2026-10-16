# Portal component alignment

## Brief

The user prefers the Landing and Login currently in production and explicitly
requested their component design across the previously merged portal and
onboarding, while retaining those screens' composition. PR #27 is closed. This
work starts from production/main at `d4b2097`; none of that rejected redesign is
used as a reference. Mode: Operate.

The runner must still connect one source, configure their profile and use the
weekly plan through the existing journeys. Preserve every section, grid,
responsive breakpoint, navigation destination, label, validation rule and API
interaction. Landing, Login and Privacy remain unchanged.

## Component reference

- Typography: production's DM Serif Display for headings, DM Sans for body text,
  labels, controls and training data. Extend the public feature-heading treatment
  to provider names and profile section headings; retain the portal page-title
  scale and its reading hierarchy.
- Surfaces: the production plan preview and feature surfaces establish quiet
  theme grounds, 16px corners and fine divider borders. Use those roles for
  provider panels, the profile editor and weekly panels rather than a separate
  elevated-white card style. Onboarding's unboxed form remains unboxed.
- Controls: use the existing Button/Input radius, `calc(var(--radius) - 2px)`,
  instead of portal-only 12px corners. Primary actions follow the public hero
  button, secondary actions follow Login's hero-outline. Retain the current
  44–48px interaction targets and mobile 16px field text. Editable fields and
  custom radio boundaries retain their stronger foreground-derived border so
  the adaptation does not make their interaction area hard to identify.
- Selection: use the public preview's restrained primary tint and the existing
  check, radio, underline and pressed-state signals. Reserve solid primary fill
  for the main action rather than entire active-provider and today panels.
- States: keep the existing theme-adjusted action/text contrast roles, keyboard
  focus, disabled/pending/error/success feedback and reduced-motion behavior.
  The four themes and the existing onboarding choreography remain intact.

This is a component adaptation, not a new layout, rebrand, photography treatment
or motion direction. No dependencies, assets, authentication or backend changes
are required.

## Validation

Actual-browser before captures use the existing Vite app, synthetic session/API
fixtures and the same desktop/mobile viewports for seven representative portal
and onboarding states. Evidence remains ignored under
`.design-experiment/component-alignment/`, outside tracked source.

The first batched visual inspection found that applying the base Input's pale
border made editing boundaries too faint, and that day hover inherited the same
background as its new parent surface. The final correction retains the existing
stronger field/radio borders, restores a visible day hover and aligns the
supporting heart-rate-zone heading with the serif section treatment. A second
desktop/mobile batch confirmed these corrections; no further visual iteration
was performed.

- Application changes are limited to the three portal stylesheets. React markup,
  state, copy, auth, API contracts, global tokens and public pages are unchanged.
- A parsed CSS comparison against `origin/main` confirms all 577 existing layout
  declarations unchanged: 242 in `portal.css`, 122 in `onboarding.css` and 213
  in `weekly-plan.css`. This covers display, grid/flex arrangement, gaps, order,
  widths, padding, margins, positioning and heights. Borders and serif headings
  can change intrinsic content size slightly; the same sections remain in the
  same composition at each existing breakpoint.
- `npm test`: all 156 tests across 13 files pass. Existing tests cover source
  replacement, profile validation/draft/save behavior, onboarding progression,
  plan navigation, completion and activity evidence. No tests were added merely
  to mirror CSS declarations.
- App typecheck passes: `tsc --noEmit -p tsconfig.app.json`.
- Lint passes with zero errors and nine pre-existing Fast Refresh warnings.
- Production build passes, including after the final CSS correction. Existing
  Browserslist-age and bundle-size warnings remain.
- Playwright checks Weekly Plan, Connect, Profile and onboarding source/profile/
  preparing/failed states across all four themes at 320, 390, 768 and 1440px:
  112 state/viewport measurements without horizontal overflow or sampled text
  contrast failures. Weekday targets remain at least 44×44px. Four additional
  primary-action hover measurements pass sampled text contrast.
- Browser interactions verify save failure/retry with preserved draft, discard
  cancellation, provider replacement/disconnection cancellation, completion/undo
  and onboarding source selection. Real keyboard Tab reaches the authorization
  action with a visible outline. Reduced-motion inspection reports zero running
  animations after settling. No browser page errors were recorded.

The checks use synthetic fixtures in the real running application; they do not
claim live provider authorization, real plan generation, personal training data,
cross-browser coverage or accessibility certification. No new assets or
dependencies were introduced. Original PR #25/#26 documents remain historical;
DESIGN.md and its sidecar record the current scoped component treatment.

Representative review evidence is the desktop Weekly Plan before/after pair
(`before-plan-desktop.png`, `final-plan-desktop.png`) and mobile onboarding profile
pair (`before-setup-profile-mobile.png`, `final-setup-profile-mobile.png`). Captures
are not committed. GitHub image attachment upload is unavailable through the
current CLI; the local files remain available for manual attachment.
