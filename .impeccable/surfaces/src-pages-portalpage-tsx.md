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

# Running Coach redesign

Scope: public discovery, sign-in, onboarding, weekly plan, profile and connections.
Modes: Operate for the portal; Persuade for the landing page; Read for privacy.
The user explicitly delegates design decisions and direct implementation. This run
uses a code-led direction contract without persisting a global build preference.

## Findings and priorities

1. Daily use: the narrow desktop column hides the schedule beneath repeated cards;
   small controls and pointer-only disclosures obstruct workout access.
2. Activation: onboarding repeats headings, hides step labels on mobile and exposes
   backend terminology. Connection status doubles as an unexpected disconnect action.
3. Configuration: the profile is an undifferentiated form, including an unavailable
   notes feature. Group identity, schedule and race target; retain validation.
4. Discovery: an oversized photo overlay and unverified average metrics obscure how
   the product works. Show an explicitly illustrative week and the real setup sequence.

## Direction contract

THESIS: A training companion with the clarity of athletics wayfinding. The next
workout leads; the entire week stays within reach. Avoid a generic metrics dashboard.

OWN-WORLD: Ink-blue navigation, cool pale ground, white work surfaces, cobalt
selection and restrained citron in the public brand. Barlow Condensed headings,
Manrope reading text, legible tabular measures, quiet borders and 12px corners.
The runner checks a phone outdoors before training, so the default is high-contrast
light content; existing theme choices remain supported.

STORY: Connect one source, set a realistic schedule and goal, then open the plan.
Daily: understand today's prescription, inspect the week, mark completion. Actual
activities remain distinct from planned work. No invented performance analytics.

FIRST VIEWPORT: Desktop has a persistent ink-blue left rail, a week heading and
navigation, then a seven-day strip. Today's workout and the full schedule occupy
the wide column; weekly context and race goal sit beside it. Mobile uses compact
top branding and fixed bottom navigation, with today before schedule before context.
Signature interaction: selecting a day in the week strip opens and focuses its
workout disclosure. Brief color and disclosure transitions respect reduced motion.

FORM: Athletics wayfinding, candidate 4, seed d733f998. Grounded candidates in order:
running club identity, race timing sheets, training journal, athletics wayfinding,
outdoor equipment labeling, race photography contact sheets, event typography.
Challengers: acetate manual declined (keep disciplined section hierarchy); record
sleeve declined (keep typographic restraint); orienteering competitive on audience
identification but weaker on product clarity (keep explicit state legend); streaming
wall declined (keep focus continuity); warm consumer app competitive on clarity but
weaker on distinction (keep touch comfort); exposure sheets declined (keep clear
tonal separation). All controls retain familiar web semantics.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## States and acceptance

Capture matched mobile/desktop baselines at commit 7dced9f. Cover public routes,
plan and workout details, completion, profile, connections, onboarding, preparation,
failure, future empty and request error. Preserve routes, API payloads, backend
navigation authority and race outcome actions. Check keyboard use, no horizontal
overflow, contrast, reduced motion, tests, lint and build. Store evidence outside
all repositories. Review and documentation complete before final handoff.
