---
version: 1
slug: src-pages-performancepreviewpage-tsx
primary_target: src/pages/PerformancePreviewPage.tsx
related_targets:
  - src/components/performance/PerformanceDashboard.tsx
  - src/components/performance/performance.css
---

# Performance dashboard V1 preview

Mode: Operate. A runner reviews eight completed Monday–Sunday weeks, selects a week, and distinguishes recorded volume from plan completion. Synthetic Intervals.icu examples only; no API or auth changes. Public preview is explicitly labeled and linked from the portal. Sample scenarios cover missing plans, unavailable recording, confirmed zero, empty, loading and error.

## Direction contract

THESIS: A calm, visual training history: one generous volume plot directly beside its selected-week detail, followed by a compact weekly completion pattern. Replace the dominant ledger and explanatory narrative with linked visual evidence. No composite performance score or repeated KPI tiles.

OWN-WORLD: Extend the existing cream, forest-green, terracotta, DM Sans and DM Serif system. Rounded tonal panels, fine rules, tabular numerals. Green means recorded/matched; terracotta means manual-only completion, with text labels for both.

STORY: Read the completed-week range, explore distance/duration/run count, select a week, then understand its recorded evidence and planned-session completion separately. Missing values never become zero.

FIRST VIEWPORT: Familiar top navigation, serif Performance title, explicit sample-state selector and date range. A shared surface connects the wide plot and selected-week detail. Below, one quiet completion summary pairs with eight selectable weekly stacks: solid matched sessions, checked terracotta manual sessions, outlined incomplete sessions, and a distinct no-plan gap. Mobile puts detail immediately after the chart, then completion and weekly stacks, without horizontal scrolling. Minimum copy: metric names, dates, values, evidence labels and state explanations. Methodology stays in its native disclosure.

FORM: Refine the existing React components, model and tokens; no new dependencies, imagery or persistent buildPath preference. Primary action: select a completed week and inspect its evidence. Signature motion: chart bars reshape with metric changes while a shared selection marker moves between weeks; the companion detail briefly resolves into its new state. The selected metric leads the detail, with the other two recorded metrics beneath it. Controls respond within 150–300ms, chart transitions finish within 500ms, and reduced motion uses immediate state changes. No looping animation or staged page-load delays. Retain every sample scenario; missing evidence, absent plans and confirmed zero remain distinct.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Exit: inspect real desktop/mobile captures outside repository; verify keyboard, all sample states, calculated totals and truthful null semantics; lint, tests, build. Preserve incumbent DESIGN.md and sidecar; report intentional wider layout for this preview. No new shipping rasters.

## Verification

Finish review: **ship**. Actual application captures live outside the repository at `/tmp/running-coach-performance-refinement/desktop.png` (1440px) and `mobile.png` (390px), with comparable `desktop-before.png` and `mobile-before.png`. One desktop/mobile inspection batch and one confirmation batch completed. Mobile visible text fell from 297 to 188 words (37%); the desktop page is 249px shorter. The running overview and detail now share a surface; the eight-week completion pattern replaces the table. No intentional deviation from this refinement brief.

Playwright verified linked chart/pattern selection, metric-dependent totals and detail, previous/next boundaries, keyboard activation, mobile detail focus, all six scenarios, and overflow at 320, 390, 640, 768, 1024, 1280 and 1440px. Confirmed animated bar transforms during metric changes; reduced motion has immediate transforms, no CSS animations and no detail translation. Checked small text contrast is 4.89:1 or higher in the default warm theme. No browser errors. Null, zero, manual-only and no-plan semantics remain distinct.

130 tests pass; lint passes with nine existing Fast Refresh warnings; production build passes with existing Browserslist and chunk-size warnings. Changed files formatted with existing cached Prettier. Intentional local differences remain the wider preview canvas and chart-specific geometry; global DESIGN.md and theme tokens are unchanged. No dependency, API, backend or model changes.
