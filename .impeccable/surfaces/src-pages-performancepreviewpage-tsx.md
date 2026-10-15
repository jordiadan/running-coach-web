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

THESIS: A calm training history: one generous volume plot, an aligned weekly ledger, and a companion completion narrative. No composite performance score or repeated KPI tiles.

OWN-WORLD: Extend the existing cream, forest-green, terracotta, DM Sans and DM Serif system. Rounded tonal panels, fine rules, tabular numerals. Green means recorded/matched; terracotta means manual-only completion, with text labels for both.

STORY: Read the completed-week range, explore distance/duration/run count, select a week, then understand its recorded evidence and planned-session completion separately. Missing values never become zero.

FIRST VIEWPORT: Familiar top navigation, serif Performance title, explicit sample-state selector and date range. Wide left plot with metric controls; narrow right completion summary. Below, weekly ledger and selected-week detail. Mobile stacks the plot, completion narrative, ledger and detail without horizontal scrolling.

FORM: Code-led implementation selected autonomously under the user's explicit instruction to make design decisions. Considered structures: (1) chronological ledger, (2) chart-first canvas, (3) completion-first history, (4) weekly carousel, (5) stacked volume/completion plots, (6) linked plot/ledger with companion detail, (7) calendar matrix. Surface seed 6b941c15 dealt 6, 5, 1; select 6. No image comp or persistent buildPath preference. Signature interaction: selecting a bar or ledger week synchronizes both and updates an accessible detail region; metric changes smoothly resize bars in 220ms, reduced motion is immediate.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Exit: inspect real desktop/mobile captures outside repository; verify keyboard, all sample states, calculated totals and truthful null semantics; lint, tests, build. Preserve incumbent DESIGN.md and sidecar; report intentional wider layout for this preview. No new shipping rasters.

## Verification

Actual application captures: `/tmp/running-coach-performance/desktop.png` (1440px) and `/tmp/running-coach-performance/mobile.png` (390px). Keyboard selection, tooltips, metric controls, six sample scenarios, disclosures, mobile detail focus/scroll and overflow verified with Playwright; additional widths 320, 768, 1024 and 1280px fit. Data bars and the secondary completion number were strengthened after contrast measurement.

Finish review disposition: **ship**, covering the resolved mobile detail-navigation finding; no visible regressions introduced in the verdict pass. Source/system documentation review preserved DESIGN.md and .impeccable/design.json. Intentional local differences are the wider canvas, compact chart/helper type and chart radii, not global system changes.

129 tests pass; lint passes with nine existing warnings; production build passes with existing Browserslist/chunk warnings. The additional standalone TypeScript check reports existing errors in unrelated onboarding and portal tests; no errors in the new performance files. No dependency, backend, API or database changes.
