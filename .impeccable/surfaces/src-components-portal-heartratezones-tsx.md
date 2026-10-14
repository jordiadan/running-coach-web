---
version: 1
slug: "src-components-portal-heartratezones-tsx"
primary_target: "src/components/portal/HeartRateZones.tsx"
related_targets: []
---

# Profile heart-rate zones

Scope: `src/components/portal/HeartRateZones.tsx`, within the existing Profile screen. Mode: Operate.

Runner's task: read personal intensity ranges and their threshold provenance. This section is read-only; the profile's existing Save changes action remains outside it. Preserve API ranges, inclusive limits, measurement date in UTC, unavailable/calibration/pending states and polling.

## Direction contract

THESIS: Five restrained training bands replace the table. Zone labels and exact ranges carry the information; color reinforces intensity.

OWN-WORLD: Inherit the portal's surfaces, spacing and DM Sans. Use a local teal-to-green-to-ochre-to-orange-to-red progression only for the five bands, with foreground text rather than colored labels. No nested cards, icons or shadows.

STORY: Read LTHR, scan Z1–Z5, then confirm measurement date and inclusive bounds. No new controls or physiological claims.

FIRST VIEWPORT: Sans heading and short description; compact threshold definition with a right-aligned value; five full-width thin horizontal bands, each below its label and tabular range. Mobile retains the same hierarchy without columns or scrolling. Date and range note close the section.

FORM: Local extension of the established profile; precisely specified request, no concept seed required. Equal bar lengths avoid implying duration or recalculating range widths. Signature motion: one gentle left-to-right band reveal on first visibility; reduced motion renders immediately.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Exit checks: exact API values; all existing states; desktop/mobile and narrow viewport fit; keyboard unchanged; readable contrast; no band animation for reduced motion; lint, tests, build; actual app screenshots with synthetic data in the PR. Preserve DESIGN.md and its sidecar for this scoped extension. No unresolved decisions.
