---
version: 1
slug: "src-pages-landingpage-tsx"
primary_target: "src/pages/LandingPage.tsx"
related_targets: ["src/pages/LoginPage.tsx"]
---

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

Final validation, iteration findings and limitations are recorded below after
inspection.
