# Landing and Login redesign

Scope: `/`, `/login` and public-only components. Landing is Persuade; Login is
Operate. The merged portal, onboarding, privacy page and backend stay outside
the implementation boundary. Product facts come from PRODUCT.md.

## Direction contract

THESIS: The runner's seven-day rhythm becomes the page's working material. A
short editorial headline opens onto an explorable example week rather than
feature cards or unsupported performance statistics.

OWN-WORLD: Existing DM Serif Display and DM Sans connect public pages to
onboarding. Full-ink type, theme ground, a generous primary-color field, squared
photography and pill actions form the public vocabulary. Preserve all four
palettes; contrast-adjust action colors locally, as the portal does.

STORY: Understand personalized weekly planning, explore a clearly labelled
example, learn how one source and a goal/schedule produce the first plan, then
continue with Google. No price, speed, performance or social-proof claims.

FIRST VIEWPORT: A quiet masthead precedes two oversized headline lines. A small
running-image window interrupts the first line. Supporting copy and one filled
Get started action lead into a seven-day interactive strip and session detail.
On mobile, the headline window shrinks and the weekdays retain seven thumb
targets; all reading stays in one column. Login keeps the masthead and image
window, makes Google the sole primary action and explains the first-run path.

FORM: Running journal, candidate 3; Impeccable seed `67ef75c1`. Grounded list:
training diary, running publication, weekly journal, race programme, route guide,
club noticeboard, finish-line print. Taste: sentence-as-layout, seed
`2084845364`; existing palette and type retained. Ink basin and torn billboard
challengers lose identification and product clarity. Rhythm machine is
competitive on rhythm but loses product clarity: retain its disciplined
relationship between selection and visible state, without instrument styling.
Raise from ink basin: one continuous composition. Raise from torn billboard:
confident shifts in scale. No imagery, music or simulation quota overrides scope.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Content and states

- Hero: “Your week. Your running.” Personalized weekly running plans built around
  training, goals and available days. Get started goes to `/login`.
- Example week: explicitly illustrative, four running days, rest and strength;
  choosing a day reveals its prescribed duration/intensity and notes. This is an
  educational example, not a generated personal plan or editable schedule.
- Setup: connect Strava OR Intervals.icu; configure a race or general running
  goal, at least four running days and a preferred long-run day; receive a weekly
  plan with session details and completion. Intervals workout publishing is not
  attributed to Strava. Provider recovery capabilities are not equated.
- Login: checking existing session, ready, OAuth pending, session-check error,
  OAuth rejection/network error, authenticated redirect. Errors offer recovery;
  pending state has a visible status and prevents duplicate requests. Preserve
  Google provider and same-origin `/portal` redirect.
- No form, pricing, empty product feed, testimonials or customer metrics.

## Motion

The image window settles into the headline; type resolves over a short distance.
The selected weekday's filled field moves with a damped spring, connecting the
day to the session detail. The setup heading holds while its explanatory entries
scroll normally. Section content stays visible before observation. Controls give
brief press/hover feedback. Reduced motion shows final states immediately and
removes travel, layout animation and image scaling. No looping decoration.

## Imagery and exceptions

Reuse `src/assets/hero-running.jpg` as atmospheric running imagery, not a claim
about an actual customer or location. Original provenance is not recorded in the
repository. Public WebP derivatives preserve that source; do not call it a
verified documentary photograph. Two purposeful uses are preferable to Taste's
four-picture minimum here. No stock-photo collection or autoplay video is added.
Sticky storytelling is restricted to the short setup section; there is no scroll
hijacking. Existing type and palettes intentionally override experimental skill
aesthetic defaults. User-requested motion quality overrides motion-count quotas.

## Validation and critique

Baseline captures: `.design-experiment/landing-login/before-{landing,login}-{desktop,mobile}.png`.
All screenshots are actual local application renders, with no personal data.
Capture scrolls through reveal regions before returning to the top.

Baseline: centered photographic hero, statistics, repeated feature cards, mock
week, boxed CTA. Login is an unrelated empty split screen. Unsupported averages
and setup-time claims undermine trust. Motion obscures below-fold content in a
naive full-page capture. Taste lint: six failures and eight warnings.

### First implementation

Seen in one second: the runner’s week, expressed as a large two-line statement.
Idea: the weekly rhythm becomes the usable product demonstration.
Live thing: select a weekday to inspect the illustrative prescription.
Layouts: headline with image window / interactive strip / sticky editorial
story / photographic close.

The desktop, 768px and 390px batch exposed three material corrections: the
programmatically focused Login title retained a browser-default blue outline;
the mobile headline needed more presence; the weekday strip hid useful session
information on mobile. The next pass removes that heading outline while retaining
focus on interactive controls, increases mobile display size, and shows sample
session durations. Below 360px the days wrap to four columns to retain 44px
targets. A React 18 warning from `fetchPriority` was also removed; eager loading,
explicit dimensions and responsive sources remain.

### Confirmed implementation and fresh review

Seen in one second: “Your week. Your running.” followed by the interactive week.
Idea and live thing remain visible across desktop, tablet and phone layouts.
Scores, as a scoped subjective critique: design 7.5 · usability 8 · creativity 7 ·
content 8 → overall 7.6. This is not an award or a user-research result. Taste’s
four-picture and motion-count quotas are intentionally superseded by this brief’s
fewer purposeful visuals and restrained motion. Without those scoped exceptions,
the skill’s numerical caps would lower the score.

The separate Impeccable finish reviewer accepted the direction, composition,
Login continuity and actual captures. It requested two fixes: place weekday
metadata below the session title and replace superseded public observations in
DESIGN.md. Both were applied; all six core captures were refreshed. The documenter
merged public tokens and observations into DESIGN.md and `.impeccable/design.json`,
preserving unrelated authenticated-system documentation.

The reviewer’s verdict pass scored both requested fixes **resolved**, with
`disposition: ship` for that fix list. All six recaptures were accepted as valid;
this is a bounded review verdict, not an accessibility certification.

### Verification

- `npm test`: **168 passing tests across 14 files**, including 12 new navigation,
  session-check, existing-session redirect, duplicate-click, OAuth error/retry,
  late-response and example-week regressions.
- `node_modules/.bin/tsc --noEmit -p tsconfig.app.json`: passes.
- `npm run lint`: zero errors; nine pre-existing Fast Refresh warnings.
- `npm run build`: passes; existing Browserslist age and bundle-size warnings.
- Changed source and documentation formatted with an already cached Prettier;
  no dependency or lockfile changes. `git diff --check` passes.
- Playwright: 64 route/theme/viewport measurements. Both routes, all four themes,
  widths 320, 390, 640, 768, 900, 1024, 1280 and 1440px. No horizontal overflow,
  clipped headings/actions or undersized weekday targets. Measured body/action
  contrast meets 4.5:1; large text meets 3:1, accounting for the selected day’s
  absolutely positioned fill.
- Actual keyboard selection updates the example; Login focuses its heading on
  entry and the next Tab reaches the Google action with visible focus.
- Real Google OAuth navigation was intercepted at the network boundary:
  `provider=google`, `redirect_to=http://127.0.0.1:5173/portal`. No personal account
  or production training data was used. Completing an external Google login was
  not part of this local verification.
- Motion recorded in-browser. The selected field travels through x≈71, 162, 260,
  then 272px and settles. Reduced motion removes travel and image scaling;
  a settled page reports no running browser animations. Early global body theme
  transitions are outside the visible public surface.
- Taste source lint: zero failures, two warnings for the intentionally consistent
  “Get started” action. Final browser inspector: zero failures with documented
  exceptions for two image uses and its absolute-layer contrast false positive.
  Four warnings remain: inherited warm palette, local type sizes, no footage,
  and 15 moving elements below its warning threshold of 16. These are recorded,
  not treated as product requirements or reasons to add decoration.
- Image provenance scan: two responsive WebPs, zero missing origin records.
  The tool uses `.webp.json` sidecars for this format. Original acquisition
  provenance remains unknown, as recorded in the asset README.

### Review evidence and limits

Actual before/after desktop (1440×900) and mobile (390×844) captures of both pages,
plus final tablet, representative themes, 320px and OAuth-pending captures, remain
in ignored `.design-experiment/landing-login/`. Motion recordings are in its
`video/` directory. Evidence is never committed. The CLI has no supported GitHub
image-attachment upload; selected local captures are available for manual PR
attachment. This does not block code review.

No new photo, generated image, video, customer quote, pricing, adoption metric or
performance claim was introduced. The displayed sessions are illustrative
prescriptions, not generated for the visitor and not saved. No global default
theme, construction workflow or audience positioning was persisted.
