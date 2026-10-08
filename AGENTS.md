# AGENTS.md

Rules for AI coding agents working in this repo.

## Product and scope

This repo is the user-facing web app for Running Coach, not the backend.

Current surfaces:

- Public landing page (`/`) and privacy page (`/privacy`).
- Google sign-in (`/login`) and authenticated portal (`/portal`).
- Portal onboarding, one active training source (Strava or Intervals.icu),
  profile and goals, and the weekly plan with session details and completion.

Keep public/trust pages and authenticated workflows separate in a change unless
the task explicitly requires both. See PRODUCT.md for current capabilities,
backend boundaries, future initiatives and decisions awaiting confirmation.
Do not implement future features speculatively or infer frontend scope from
backend capabilities alone.

## Decision rules

Prefer smaller changes, simpler scope, less JavaScript, semantic HTML, readable
copy and clear UX. No overengineering, speculative abstractions or new heavy UI
libraries without a concrete need. Reuse the existing foundation before adding
dependencies or components; do not generalize until repetition is real.

## Agent communication — Caveman Ultra

Default to Caveman Ultra (`ultracave`, formerly `caveman ultra`) for all
agent chat responses in this repository: plans, progress, implementation
summaries, reviews and final handoffs. Invoke the `ultracave` skill when
available. If it is not installed, still follow the ultra-concise style, but
do not claim the skill was activated. `.caveman.json` sets the repo-local
default for Caveman runtimes that support project configuration.

Lead with the result. Keep prose terse, direct and non-repetitive; no
greetings, unnecessary preambles or recap. Keep negations, conditions,
identifiers, numbers, paths and commands precise. Do not shorten code,
terminal output, literal errors, user-facing product copy or generated
documentation just to satisfy this rule. Use complete, unambiguous prose
for security, destructive or irreversible changes, important trade-offs
and any explanation where compression could hide a critical detail.
Follow explicit user instructions about response format or detail.

## Sources of truth

- Product context: `PRODUCT.md`; open decisions are not approved preferences.
- Frontend behavior, routes and assets: `src/`.
- Tokens and theme declarations: `src/index.css` and `tailwind.config.ts`.
- Existing components: `src/components/ui/` and `src/components/portal/`.
- Observed visual system: `DESIGN.md` and `.impeccable/design.json`.
- API consumption: `src/lib/api.ts` and `src/lib/portal-api.ts`; verify backend
  contracts before changing integration behavior.

Code is the incumbent visual authority; DESIGN.md records it and must be checked
against it when changing visuals. No canonical Pencil file is currently tracked.
Do not require an absent frame or token file. If a task supplies a Pencil frame,
use and compare it; temporary/demo/old files are not product authority.

## How to work

For simple changes: state the intended outcome briefly, implement and verify.

For non-trivial UI changes:

1. Define the goal, target user and primary action.
2. Define minimum content and loading, empty, error and success states.
3. Establish a mobile-first hierarchy before implementation; use the supplied
   design or a scoped surface brief for new pages and structural changes.
4. Implement the smallest useful frontend slice.
5. Compare the implementation with that design/brief and the existing system.
6. Verify and state intentional deviations.

Design first, then implement. Copy edits, spacing tweaks and small fixes do not
need a new design artifact. If implementation goes sideways, stop and re-plan.
Setup/documentation tasks do not authorize UX audits or interface changes.

## UX conventions

- Mobile first, strong hierarchy and one primary action per screen/state.
- Make the next step obvious; keep flows simple, intuitive and calm.
- Plain language, no marketing fluff or competing focal points.
- Accessibility by default: semantic elements, keyboard access, visible focus,
  labels, readable contrast and appropriate reduced-motion behavior.
- Every screen should quickly explain what it is, why it matters and what to do.

## Frontend conventions

Current stack: React 18, TypeScript, Vite, React Router and Tailwind CSS, with
shadcn/Radix UI primitives, TanStack Query and Framer Motion already installed.
Use the current stack; do not migrate frameworks as incidental cleanup.

Prefer composition, existing CSS variables/Tailwind tokens, and native elements
over ARIA workarounds. Keep client state only where behavior needs it. Use
TanStack Query for the existing server-data workflows. Do not hardcode new
visual values when an existing token fits.

## Impeccable

Reuse the global skill; do not vendor it or add an npm dependency for setup.
Follow its scoped command references, with PRODUCT.md for product facts and
DESIGN.md for the incumbent system. Do not turn unconfirmed decisions into
`buildPath`, aesthetic defaults, roadmap commitments or user-facing claims.

The shared setup lives in `.impeccable/` and `.codex/hooks.json`. Developer
overrides, consent and runtime artifacts stay gitignored. Codex hook trust is
machine-local and separate from Impeccable consent; see README.md. Avoid running
the same detector from both user/global and project hook sources.

## Pull requests and screen screenshots

Before opening any PR that changes a rendered screen or UI state, run the app
and capture screenshots of the **actual implemented result** for every affected
screen. Include both mobile and desktop views whenever the change affects both.
For existing screens, show before/after screenshots when feasible, with clear
screen, viewport and state labels (including important empty/error/loading
states that changed). Upload or link the captures **in the PR description** so
reviewers can see the changes without checking out the branch. Never invent
screenshots or present design mockups as implementation evidence.

Screenshots are a pre-PR requirement, not an optional review follow-up. If the
UI cannot be captured, document the blocker explicitly and keep the PR in
draft until evidence is available. For changes with no rendered UI impact
(e.g., docs, tooling, backend contracts), mark the screenshot section
`Not applicable — no screens changed`; do not generate irrelevant images.

## Verification and done

For meaningful changes, format changed files, run `npm run lint`, relevant tests
(`npm test` for the suite), and `npm run build`. No formatting script is currently
defined: use available tooling without adding a dependency just for a one-off.

For UI changes, preview mobile and desktop, check keyboard access and obvious
accessibility issues, compare against the supplied design/brief and record
deviations. These visual checks do not apply to a setup-only change.

Work is done when the requested scope is complete, verification passes and
remaining limitations or open decisions are stated. For UI work, hierarchy,
responsive behavior and baseline accessibility must also be checked.

## Boundaries

Keep this repo focused on the frontend. Do not move backend/domain logic here
or duplicate backend decisions in the UI. Keep environment setup minimal and
README short and practical. No placeholder junk in user-facing pages.
