# Weekly training view experiment

Scope: the weekly training surface on `experiment/ui-design-skills`. Mode: Operate.
This replaces the local weekly composition within the existing product identity.
Public pages,
onboarding, Connect, Profile, API contracts and planning/completion rules stay outside
this experiment. The portal container widens only while the weekly view is active.

## Initial inspection

Playwright CLI opened the actual Vite app at `/portal`, with intercepted authentication
and API responses containing synthetic runner data. No real account or activity was
used. Baseline captures: 1440 × 1000 desktop and 390 × 844 mobile, full page.
Expanded a completed run and a strength session; verified evaluation dimensions,
provider links and strength focus in the existing interface.

Observed issues:

- The 624px content column leaves most desktop space unused while hiding the agenda
  below the objective, metrics and race card. On mobile the agenda starts around 1150px.
- Days use ambiguous single letters, no dates and an unexplained icon-only strip.
- Important labels and metrics use 9–12px text. Planned duration is visible, but
  recorded distance and duration are absent from session details.
- Completed titles are struck through, making training history harder to read.
- Completion hit targets are 24px; weekly arrows have no accessible names.
- Today/rest, missing completion capability, pending undo, disclosure without notes
  and reduced motion need explicit verification in the replacement.

## Sources and interpretation

Taste's `product-performs` direction and its `Day tabs, banded agenda` composition
inform the working day strip and agenda. Its type, colour and critique references
inform scale contrast, deliberate colour roles and screenshot review. Its marketing
hero, photography floor, decorative motion quotas and public-page inspector are not
applicable to an authenticated training tool. No fabricated product imagery is used.

Awesome DESIGN.md references, interpreted as inspiration rather than copied systems:

- [Oura](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/oura/DESIGN.md):
  serif/sans distinction and warmth; retain the app's actual DM fonts and green.
- [Nike](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/nike/DESIGN.md):
  athletic typographic confidence, flat surfaces and clear product metadata.
- [Linear](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md):
  consistent density, surface hierarchy and restrained control geometry.

Impeccable Operate guidance takes precedence over marketing conventions. Web Interface
Guidelines supply the accessibility, interaction, motion and overflow audit.

## Direction contract

**THESIS:** Make the runner's next action clear while keeping the entire training
week close. Training prescription, completion and recorded evidence remain distinct.

**OWN-WORLD:** Existing warm canvas, forest-green actions, DM Serif Display headings
and DM Sans data. Flat tonal surfaces, 16px panels, 12px controls, 4/8px spacing
rhythm and readable 13–16px supporting text. Tokens belong to `.weekly-plan` only.

**STORY:** Understand the week, read today's prescription, mark completion or inspect
another session. Weekly context supports the work rather than preceding the agenda.

**FIRST VIEWPORT:** Left-aligned 40/48px page title, named week navigation, seven dated
day buttons. Desktop pairs today's green session and the agenda with a quieter
context column. Mobile stacks today's session and agenda before supporting context.
The primary action lives in today's session, with a distinct completed/undo state.

**FORM:** Today plus agenda, candidate 1 from the grounded list (1 today + agenda,
2 agenda first, 3 compact calendar, 4 chronological timeline, 5 unfolded week,
6 agenda/detail split, 7 day selector/detail). Impeccable surface seed `55f1c2b1`
dealt 5, 6 and 1; alternatives were offered through structured text questions.
Code-first is a task-local assumption pending optional user steering, never a
persisted project preference. The signature interaction is a dated day strip that
opens and focuses the corresponding agenda details without changing the screen.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

The global DESIGN.md is compared with the implementation and preserved, as requested.
This document records the experimental differences; no new global design defaults,
configuration, hooks or dependencies are introduced. There are no shipping rasters.

## Required states and checks

Current, historical and future weeks; loading, preparation, error/retry, absent plan,
empty session array; running, strength, mobility and rest; completion saving/error/undo;
matched activity provenance and actual metrics; eligible execution feedback and goal
outcomes. Desktop/mobile, 320px reflow, keyboard, contrast and reduced motion.

## Verification and outcome

The independent finish review's final disposition was **ship** after three material
findings were resolved: activity links remain visible without expanding a session,
the mobile completion action fits on one line at 48px high, and failed current,
historical and future requests all offer retry. Previous/next week navigation is
disabled while completion or goal-outcome saves are pending. Planned duration,
recorded duration/distance and manual completion remain separate; a missing
completion capability is not inferred from another session.

The implemented hierarchy matches the direction contract: named week navigation,
dated seven-day strip, today's session, then the agenda, with supporting context
alongside on desktop and after the agenda on mobile. Day selection expands and
focuses that session's details. Completed titles remain readable. Rest, unavailable
completion, pending save/undo and errors have explicit presentations. Existing
execution feedback, strength focus, provider evidence and goal-outcome flows remain
available. No new backend contract, route or training rule was introduced.

### Comparison with the incumbent system

Compared `src/index.css`, `tailwind.config.ts` and `DESIGN.md` with
`WeeklyPlanScreen.tsx`, `WeekNavigator.tsx`, `weekly-plan.css` and the portal shell.
The source remains the visual authority. The warm theme's canvas, green primary,
neutral foreground, soft borders and the DM Serif Display/DM Sans pairing are
preserved. Local color aliases resolve the existing theme variables; no palette,
font, global token or shared component was replaced. The existing provider-orange
Strava mark remains a provenance detail, not a new product accent.

The local differences are intentional and are not global defaults:

| Aspect             | Incumbent record                                                 | Weekly experiment                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Container          | Portal `max-w-2xl` (42rem), 24px horizontal padding              | Active weekly shell `max-w-6xl` (72rem), same padding; other portal surfaces retain their width                                                                            |
| Composition        | Narrow vertical stack of context and sessions                    | Training first; from 1024px, flexible agenda beside a 20rem context column with a 32px gap                                                                                 |
| Type               | Common portal headings 24px, body 14–16px                        | Page heading 40px/1.1, then 48px from 640px; today's heading 32px/1.15, then 40px; agenda heading 26px; session titles 16–17px                                             |
| Supporting text    | Theme `muted-foreground` and smaller session labels              | Local muted text uses foreground at 68% opacity; most supporting text 13–16px, with 12px day/status/phase labels                                                           |
| Surfaces and shape | Tonal cards, borders, mixed 10/12/16px radii and some shadows    | Flat tonal panels and agenda, 16px panel radius, 12px local controls, 24/32px principal padding; no new shadows                                                            |
| Controls and focus | Base shared button 40px; previous session completion target 24px | Week/completion/provider targets at least 44px, primary completion 48px; local 2px outline with 4px offset, inverse outline inside today's primary panel                   |
| Motion             | Existing portal translation/fade and spring transitions          | Local 160ms control transitions, 180ms detail reveal; reduced motion disables weekly CSS animation/transition, smooth scrolling and weekly shell entrance/spring durations |

`PortalPage.tsx` changes are conditional weekly shell width, mobile tab spacing and
padding, and reduced-motion handling. Public pages, onboarding, Connect and Profile
were not redesigned. `DESIGN.md`, `.impeccable/design.json`, Impeccable configuration,
hooks, skills and dependencies remain unchanged. The small weekly surface brief
records the durable local contract; this report owns its audit and outcome.

### Checks and evidence

- The existing Playwright CLI exercised the actual `/portal` application with
  intercepted synthetic authentication and API fixtures. Final captures use
  1440 × 1000 desktop and 390 × 844 mobile viewports. Widths 320, 390, 768, 1024,
  1280 and 1440px showed no horizontal overflow.
- Keyboard navigation, visible focus, day-to-detail focus transfer, long strings,
  reduced motion, completion and pending undo were checked. Fixtures covered
  current/history/future, loading/preparation, error/retry, absent plan, empty
  sessions, rest, missing completion capability, strength and execution feedback.
- `.design-experiment/browser-audit.json` records 149 checked text nodes, minimum
  measured contrast 5.34:1 and no contrast failures in the sampled synthetic state.
  Both DM fonts loaded. This is scoped evidence, not certification of every theme
  or every possible backend response.
- `npm test`: 133 passed, 0 failed, including 12 new regression tests.
  `npm run lint`: no errors, 9 existing Fast Refresh warnings. `npm run build`:
  passed; bundle-size and outdated Browserslist-data warnings remain.
- The separate TypeScript check reports 8 errors. Its final output exactly matches
  the baseline after removing the baseline checkout's `.design-experiment/tmp/`
  prefix; these existing errors were not repaired in this design experiment.
- The Impeccable detector returned `[]`; the hook check was clean. Runtime logs,
  audit data and captures remain ignored under `.design-experiment/`.

Representative before/after captures are `before-desktop.png`, `after-desktop.png`,
`before-mobile.png` and `after-mobile.png` in that ignored directory. They show the
running implementation with synthetic data, not design mockups. Selected copies
are delivered outside the repository in `/private/tmp/running-coach-weekly-review`;
no screenshot is committed and there are no shipping raster assets.

### Limits and open decisions

Real authentication, backend integration and production data were not validated;
the browser checks use intercepted fixtures. Firefox and WebKit are not certified.
The Web Interface Guidelines review intentionally preserves incumbent English copy,
date-fns date formatting, and local selected-week/expanded-session state. This
experiment adds no localization system or URL persistence. Pre-existing theme compilation drift and
stale global design-sidecar details remain untouched and are not canonized by this
local report. Bundle size, baseline lint warnings and baseline TypeScript errors
remain separate maintenance concerns.

Optional focus and construction-path questions were unanswered. Today plus agenda
and code-first therefore remain task-local assumptions, not a persisted preference
or `buildPath` setting. No usage, performance, training-outcome or commercial
success metric was measured or claimed.
