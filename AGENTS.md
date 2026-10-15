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

At the start of each session in this repository, use Caveman Ultra for agent
chat: plans, progress, summaries, reviews and final handoffs. Read and apply
the available, enabled `ultracave` skill's `SKILL.md` using its discovered path. For
older installations exposing only `caveman`, read that skill and select its
`ultra` level if supported. This is a standing instruction to use the skill;
do not wait for the user to mention it on every task. If neither is available
or enabled, follow the concise rules below and report the missing skill once;
do not claim activation. Do not install or change global skills automatically.

Codex loads this instruction through `AGENTS.md`; it is not a runtime
activation flag or proof that a skill was loaded. Honor explicit user style
overrides (including `normal mode` and `stop caveman`) for the rest of the
session. Preserve required status updates, confirmations and the Impeccable
workflow; this rule changes chat style only.

Lead with the result. Keep prose terse, direct and non-repetitive; no
greetings, unnecessary preambles or recap. Keep negations, conditions,
identifiers, numbers, paths and commands precise. Do not shorten code,
terminal output, literal errors, user-facing product copy or generated
documentation, commits or PR descriptions just to satisfy this rule. Use
complete, unambiguous prose for security, destructive or irreversible changes,
important trade-offs and any explanation where compression could hide a
critical detail.
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

## Experimental design tooling

The `experiment/ui-design-skills` branch adds four project skills under
`.agents/skills/`. Installation is setup only; it does not authorize an audit,
image generation, redesign, new visual system or changes to product copy.
Use them only for a later, explicitly scoped design task. Product facts,
existing stack, accessibility and the requested scope take precedence over
third-party aesthetic defaults, placeholder suggestions and dependency advice.

See [the experiment guide](docs/ui-design-experiment.md) for provenance,
compatibility, local Playwright commands, verification and full rollback.
Reuse the existing `@playwright/test` CLI and browser; do not install globally
or use commands that implicitly download missing packages. Browser temporary
files and captures belong in the ignored `.design-experiment/` directory.
For Taste scripts, set `TASTE_SKILL_HISTORY` to a path inside that directory,
set `TMPDIR` there and pass project-local output paths. Never run its default
user-history write. Keep Impeccable global files and project hooks unchanged.

## Pull requests and visual evidence

For PRs with meaningful visual changes, include a small, representative set of
screenshots from the actual running application.

- Existing screens: prefer one before/after comparison (2 screenshots).
- Larger redesigns: include a second comparison only if it adds meaningful value
  (usually 2–4 screenshots total).
- New screens: show the final implementation; no artificial before state is needed.
- Minor visual tweaks: screenshots are optional when they add little value.
- Non-visual changes: no screenshots required.

Choose only the most representative screens and viewports. Do not capture every
route, responsive variant or UI state. Use the existing Playwright tooling when
appropriate. Before/after screenshots should use comparable data and viewports.
Never present mockups or fabricated screenshots as implementation evidence.

Use test or anonymized data and inspect captures for secrets or personal
information. Keep evidence outside the repository; never commit PR screenshots.
Embed selected captures in the PR when practical. If capture is genuinely blocked,
briefly explain why instead of building elaborate workarounds. Do not block review
solely because screenshots are unavailable. Screenshot collection must not replace
normal UI verification.

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
