---
version: 1
slug: "src-pages-portalpage-tsx"
primary_target: "src/pages/PortalPage.tsx"
related_targets:
  [
    "src/pages/LandingPage.tsx",
    "src/pages/LoginPage.tsx",
    "src/pages/PrivacyPage.tsx",
    "src/components/portal",
  ]
---

# Race Rhythm — replacement identity

Scope: landing (Persuade), sign-in/onboarding/portal (Operate), privacy (Read).
The user explicitly requests three distinct prototypes and delegates recommendation
and implementation. Three code-led landing and weekly-plan prototypes were rendered
at 390 and 1440px before implementation; no global build preference is persisted.

## Direction contract

THESIS: Turn the rhythm of a runner's week into a recognizable athletic identity.
A race-poster opening earns attention; a working weekly duration chart earns trust.
Replace the previous SaaS rail/card structure with a horizontal club masthead,
open schedule, and one clear session surface.

OWN-WORLD: Vermilion campaign fields, aubergine ink, cool pink-white working ground,
blush active-session surface and evergreen completion. Archivo Black headlines;
Figtree instructions and tabular data. Original sunlit track photography, a compact
three-stride brand mark, measured bars, small control corners and generous space.
The runner checks a phone outdoors, so the default is light and high contrast;
existing dark, bright and forest preferences remain coherent accessible variants.

STORY: Understand that a personal weekly plan uses existing training, schedule and
goals. Inspect a clearly illustrative week, sign in, connect one source and run.
Within the portal, inspect today's prescription, explore the week and record
completion without conflating recorded activity and planned minutes.

FIRST VIEWPORT: Landing: vermilion masthead and oversized two-line headline above
a concise offer/action row; wide runner image and plum session note below. Mobile
keeps the action above the image. Portal: horizontal navigation, compact week
heading/date controls, seven proportional duration bars, then today's blush session
beside weekly context; schedule follows. Mobile compresses bars, keeps bottom nav,
and puts today's action before supporting context. Signature interaction: selecting
a bar opens and focuses its workout; the landing demo updates its session note.
Completion draws a check once. No ambient loop or scroll hijack.

FORM: Race Rhythm, candidate 3, seed 993f8ceb. Grounded list: running journal,
training atlas, race-poster typography, photographic contact sheet, training-club
noticeboard, textile race bib, broadcast split-time graphics. Journal and Atlas were
full visual alternatives; Race Rhythm wins on human energy plus product clarity.
Catalog challengers: CD-ROM console declined (audience/clarity; raise state feedback);
reference-setting declined (audience/clarity; raise reading measure); oscilloscope
declined (audience/clarity; raise honest chart scales); BBS declined (audience/clarity;
raise keyboard completeness); brick instructions declined (audience/clarity; raise
setup sequencing); industrial streetwear competitive on audience, weaker on clarity
(keep as alternate, do not borrow its hazard stripes or quoted labels).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Baseline e6d81b9 runs separately from the updated app with identical synthetic data.
Cover all public routes and portal tabs, workout expansion/completion, onboarding,
preparation/failure, empty/error/loading. Desktop/mobile evidence stays outside every
repository. Preserve API contracts, source replacement, profile validation, goal
outcomes and backend navigation. Verify keyboard, contrast, reduced motion, narrow
screens, lint, tests and build. Update PR #19 with embedded evidence; do not merge.
