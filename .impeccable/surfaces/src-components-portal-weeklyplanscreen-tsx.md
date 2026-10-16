---
version: 1
slug: "src-components-portal-weeklyplanscreen-tsx"
primary_target: "src/components/portal/WeeklyPlanScreen.tsx"
related_targets:
  [
    "src/components/portal/WeekNavigator.tsx",
    "src/components/portal/weekly-plan.css",
  ]
---

# Weekly training view

Scope: the authenticated weekly plan. Mode: Operate. Replace this surface's
composition within the incumbent system; preserve public pages, onboarding,
Connect, Profile, API contracts and backend-owned training/completion rules.
The shared portal shell follows the composition merged in PR #25.

The subsequent component-only alignment follows the user's preference for the
production Landing/Login, as recorded in `docs/portal-component-alignment.md`.
It preserves the merged weekly composition and behavior; the component values
and first-viewport treatment below describe the aligned implementation. The
original experiment's finish verdict remains historical.

Runner's task: understand this week, read today's prescription, mark completion
when supported, or inspect another session. Keep planned work, recorded activity
and manual completion distinct. Preserve current/history/future, loading,
preparation, error/retry, absent/empty plan, rest, unavailable capability, pending
save/undo, activity provenance, execution feedback and goal-outcome states.

## Direction contract

**THESIS:** Make the runner's next action clear while keeping the training week close.

**OWN-WORLD:** Inherit the theme's canvas, primary, foreground and borders, plus DM
Serif Display headings and DM Sans data. Local flat tonal panels, 16px panel and
the public controls' md radius (`calc(var(--radius) - 2px)`), 4/8px spacing rhythm
and readable supporting text. Card grounds and fine divider borders follow the
production public plan preview. Preserve the global theme and recorded system.

**STORY:** Understand the week, read today's prescription, complete it or inspect
another session. Supporting context follows the agenda on mobile.

**FIRST VIEWPORT:** Left-aligned 40/48px title, named week navigation and seven dated
day buttons. Today's bordered session panel and solid primary completion action
lead the agenda; desktop adds a quiet
context column. One primary completion action when supported, with saving/undo
states. Historical and future views do not pretend to contain today's session.

**FORM:** Today plus agenda, candidate 1. Impeccable surface seed `55f1c2b1` dealt
5 (unfolded week), 6 (agenda/detail split) and 1 (today plus agenda). Optional
focus/build-path questions were unanswered; today plus agenda and code-first are
task-local assumptions, never persisted preferences. Dated day selection opens
and focuses the corresponding inline agenda details; reduced motion skips smooth
scrolling and local motion.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

For this scoped extension, compare and preserve `DESIGN.md` and its sidecar; no
global regeneration or setup changes. No shipping rasters. Independent finish
verdict: ship after material findings were resolved. See the
[experiment report](../../docs/weekly-plan-design-experiment.md) for initial audit,
source interpretation, exact local differences, verification, screenshots and limits.
