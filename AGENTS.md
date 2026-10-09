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

## Pull requests and visual evidence

Before requesting review of any PR that changes a rendered screen or UI state,
run the app and use the existing Playwright dependency to capture the **actual
implemented result**. Capture only what explains the change: each affected
screen and materially changed UI state, including loading, empty or error states
when relevant. Include mobile and desktop when both are affected; avoid redundant
captures of unchanged states. Prefer a focused screenshot over a full-page image
when it retains enough context. Use a short GIF only when motion or an interaction
is clearer than stills; do not add a GIF tool or dependency just for a PR.

For existing screens, show before/after when feasible. Run the base revision and
the PR revision separately, using the same test data, viewport and UI state.
Label each capture with route, viewport dimensions, state and before/after;
identify the baseline commit. Explain any missing baseline or viewport. Never
invent screenshots or present design mockups as implementation evidence.

Use test or anonymized data for every capture. Never expose personal
information, credentials or tokens, including in URLs, browser chrome or
developer tools. Inspect each image before uploading; redact any sensitive
content that remains.

Store evidence in a temporary directory **outside every repository/worktree**,
for example `mktemp -d "${TMPDIR:-/tmp}/running-coach-pr-evidence.XXXXXX"`.
Never commit PR screenshots, GIFs or videos, or a capture archive/manifest.
Do not create `docs/screenshots/` or use Git blob/raw URLs for new PR evidence.
This rule concerns review evidence, not product assets.

Capture and upload with the existing tools; no new package, CI job or persistent
capture script is needed. Example for an affected login screen (adapt the route,
ready-state selector, ports and viewports to the change):

```sh
evidence_dir=$(mktemp -d "${TMPDIR:-/tmp}/running-coach-pr-evidence.XXXXXX")
# Base app on 5173; PR app on 5174. Run both from separate checkouts.
npx --no-install playwright screenshot --browser chromium \
  --viewport-size "390,844" --wait-for-selector "h1" \
  http://localhost:5173/login "$evidence_dir/before-login-mobile.png"
npx --no-install playwright screenshot --browser chromium \
  --viewport-size "390,844" --wait-for-selector "h1" \
  http://localhost:5174/login "$evidence_dir/after-login-mobile.png"
```

Wait for the intended state, fonts and animations to settle before capture.
For interactive states or element crops, use Playwright's page/locator screenshot
API from a temporary script instead of adding repository tooling. Repeat for
desktop only when affected. Inspect each file before uploading.

Create the PR first (keep it draft until required evidence is present). Check
`gh pr edit --help` supports `--attach`; if unavailable, report the blocker
instead of adding an uploader or committing files. Attach inspected files to the
PR number for the current branch, never a reference PR:

```sh
pr_number=123 # Replace with this branch's PR number.
gh pr view "$pr_number" --json body --jq .body > "$evidence_dir/pr-body-before.md"
gh pr edit "$pr_number" \
  --attach "$evidence_dir/before-login-mobile.png#Before — /login — 390 × 844 — signed out" \
  --attach "$evidence_dir/after-login-mobile.png#After — /login — 390 × 844 — signed out"
gh pr view "$pr_number" --json body --jq .body > "$evidence_dir/pr-body-after.md"
```

With no `--body` or `--body-file`, `--attach` preserves the current description
and appends GitHub-hosted embeds. Repeat `--attach` for each selected PNG or GIF.
Verify the original description and existing evidence remain intact, and the new
media render directly in the description. Plain file links are not sufficient.
If an upload partially fails, inspect the body and retry only missing files;
a non-zero exit can still mean some attachments were published.

To place embeds in a before/after table or update the checklist, fetch the latest
**complete** body into a temporary file, edit only the relevant section, then use
`gh pr edit "$pr_number" --body-file "$evidence_dir/pr-body-updated.md"`.
Preserve all other text, checklists and uploaded asset URLs. Never replace the
body with an evidence-only fragment. Confirm the resulting description after
each edit. See the
[GitHub CLI attachment documentation](https://cli.github.com/manual/gh_pr_edit)
and [Playwright screenshot API](https://playwright.dev/docs/screenshots).

Evidence must be embedded in the description before requesting review, including
after updates to an existing PR. Complete the visible checklist in
`.github/pull_request_template.md`. If capture, upload or rendering is blocked,
document the blocker explicitly and keep the PR in draft until resolved.
For changes with no rendered UI impact
(e.g., docs, tooling, backend contracts), mark the visual evidence section
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
