# Reversible UI design tooling experiment

This branch prepares tools only. It does not change the application, audit the UI,
generate design images or select a replacement visual system. No backend changes,
push, merge or pull request are part of setup.

## Git baseline

- Original branch: `main`.
- Original commit: `5c1e1c8039003dec5a58c84adc2eaa4835f4a66a`.
- Tracked and untracked working tree: clean before creating the branch.
- Experiment branch: `experiment/ui-design-skills`.
- Setup commit subject: `chore: setup experimental design skills`.

## Stack and package manager

React 18, TypeScript, Vite 5, React Router 6 and Tailwind 3, with existing
shadcn/Radix components, TanStack Query and Framer Motion. The README and
`package-lock.json` establish npm as the workflow used for this experiment.
Legacy `bun.lock` and `bun.lockb` are present and are left unchanged.
The verification machine has Node `24.22.0` and npm `11.19.1`.

## Installed and reused tools

| Tool | Project location or existing installation | Status |
| --- | --- | --- |
| Taste: `design-taste-frontend` | `.agents/skills/design-taste-frontend/` | Installed with its bundled scripts, references, assets and library |
| Taste: `redesign-existing-projects` | `.agents/skills/redesign-existing-projects/` | Installed; instructions only |
| Taste: `image-to-code` | `.agents/skills/image-to-code/` | Installed; instructions only; no images generated |
| Vercel: `web-design-guidelines` | `.agents/skills/web-design-guidelines/` | Installed; instructions only |
| Awesome DESIGN.md | [Upstream reference library](https://github.com/VoltAgent/awesome-design-md) | Linked only; no collection or brand system installed |
| Playwright | Existing local `@playwright/test` `1.58.2` and its `playwright` executable | Reused for opening the app and taking screenshots |
| Impeccable | Existing `~/.agents/skills/impeccable/SKILL.md`, version `4.5.0` | Accessible to this Codex session; launcher and existing hook configuration checked; not copied or updated |

No npm dependency or lockfile changes are required. The installed Playwright CLI
already provides `open`, `codegen`, `screenshot` and the browser automation API.
It is sufficient for this experiment's browser and capture requirements. It does
not provide the newer agent CLI's persistent sessions or element reference
commands. On inspection, `@playwright/cli@0.1.22` would add
`playwright` and `playwright-core` `1.64.0-alpha-1790635538000`. It is intentionally
not installed because an equivalent local tool already covers the requested use.

The current [Microsoft agent CLI skill](https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli)
targets `playwright-cli` / `playwright cli` commands absent in the installed
version. It is not copied: use the compatible local instructions below and the
project's `AGENTS.md`. No `npx` auto-download or global installation is needed.

### Provenance and review

The OpenAI `skill-installer` helper downloaded only the selected skill directories
to a project-local review area. Its explicit `--dest`, pinned `--ref`,
`PYTHONDONTWRITEBYTECODE=1` and project-local `TMPDIR` kept installation artifacts
inside this repository. Reviewed directories were then copied to `.agents/skills/`
under their manifest names. Upstream skill content is unchanged; Taste's MIT
license is included with each of its three skills.

| Source | Pinned revision | Selected paths |
| --- | --- | --- |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/f624f37a8c650b9cc550253104925efe4c8de246) | `f624f37a8c650b9cc550253104925efe4c8de246` | `skills/taste-skill`, `skills/redesign-skill`, `skills/image-to-code-skill` |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278) | `063bee94c3f4df8453406c830b0a7df0f2860278` | `skills/web-design-guidelines` |

Review covered manifests, executable entry points, imports, network access and
filesystem writes. No upstream project's installer, plugin registration or design
workflow was executed. Taste's scripts use Node built-ins, launch a local browser
for inspection and can fetch public media. Its `draw.mjs` normally writes history
under the user's home: always override `TASTE_SKILL_HISTORY` inside the project.
Use project-local temporary and output paths too. No direction was drawn here.

For a later, authorized Taste task, keep its environment local:

```sh
mkdir -p .design-experiment/tmp
export TMPDIR="$PWD/.design-experiment/tmp"
export TASTE_SKILL_HISTORY="$PWD/.design-experiment/taste-history.json"
```

Use `--out .design-experiment/taste` for `draw.mjs`, `--out` with a directory
under `.design-experiment/` for `inspect.mjs`, and a project-local `--to` for
media downloads. The setup smoke check only ran `draw.mjs --list sectors`;
it did not choose or save any visual direction.

The Vercel skill fetches the latest rules from
[Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md)
at review time. Those rules were inspected during setup; later reviews must
inspect the then-current content again. The selected agent-skills revision has
no root license file; no license text is invented or borrowed from another repo.

The vendored skills and generated experiment artifacts are excluded from the
application's ESLint rules. This prevents applying browser app lint rules to
upstream Node scripts without weakening lint rules for `src/`.

### Compatibility and activation boundaries

- Taste's current main skill is for public-facing pages and explicitly excludes
  dashboards and app screens. Its Node 22+ requirement is met here. Do not apply
  its marketing composition, photography floor or animation quotas to the weekly
  portal. No additional Taste skills were installed to work around that boundary.
- Redesign and image-to-code instructions contain opinionated typography, motion,
  layout and imagery defaults. They do not approve a rebrand, replace the
  project's icons or justify adding libraries or placeholder product data.
- Image-to-code requires image generation for visual work. Installation does not
  select that workflow or set Impeccable's `buildPath`. A future task must resolve
  the intended workflow and visual authority before implementation.
- Impeccable remains the available shared workflow. Its context command and
  `hooks status` run successfully; the existing PostToolUse and Stop registrations
  are unchanged. No second detector or machine trust/consent change was added.
- Impeccable reports an existing stale `design.json` sidecar and unset
  `buildPath`. Neither is repaired or chosen by this setup.

## Codex discovery

[Official OpenAI documentation](https://learn.chatgpt.com/docs/build-skills)
specifies repository `.agents/skills/` discovery and a `SKILL.md` with `name` and
`description`. All four manifests are validated against those requirements,
with no symlinks or duplicate local names. Skills are available for the next
turn; use `/skills` or explicitly mention `$design-taste-frontend`,
`$redesign-existing-projects`, `$image-to-code` or `$web-design-guidelines` in
Codex. Restart Codex if its picker does not refresh.

Runtime discovery was also attempted with Codex `0.162.1` app-server
`skills/list`, local SQLite/log paths and local `TMPDIR`. The sandbox refused
startup with `Operation not permitted (os error 1)` before the request could be
served. Therefore runtime picker visibility is not claimed as verified. No global
Codex configuration was changed to bypass this limit. Impeccable is already in
this session's enabled skill catalog and its manifest was read successfully.

## Browser verification and capture workspace

`.design-experiment/` is ignored by Git. It contains `captures/before/`,
`captures/after/`, temporary browser profiles, review downloads and verification
logs. Setup explicitly uses this repository-local ignored workspace; screenshots
must never be committed. `after/` stays empty until a later design task. Recreate
the directories after cloning, since Git does not track empty directories:

```sh
mkdir -p .design-experiment/tmp .design-experiment/captures/before .design-experiment/captures/after
env TMPDIR="$PWD/.design-experiment/tmp" npm_config_cache="$PWD/.design-experiment/npm-cache" npm run dev -- --host 127.0.0.1 --port 5179 --strictPort
```

In a second terminal, use the installed executable without downloading packages:

```sh
./node_modules/.bin/playwright --version
./node_modules/.bin/playwright --help
env TMPDIR="$PWD/.design-experiment/tmp" ./node_modules/.bin/playwright screenshot --channel=chromium --viewport-size='1440,900' --wait-for-selector=h1 --wait-for-timeout=800 --timeout=20000 http://127.0.0.1:5179/login .design-experiment/captures/before/login-desktop.png
env TMPDIR="$PWD/.design-experiment/tmp" ./node_modules/.bin/playwright screenshot --channel=chromium --viewport-size='390,844' --wait-for-selector=h1 --wait-for-timeout=800 --timeout=20000 http://127.0.0.1:5179/login .design-experiment/captures/before/login-mobile.png
```

For an interactive browser, the compatible command is:

```sh
env TMPDIR="$PWD/.design-experiment/tmp" ./node_modules/.bin/playwright open --channel=chromium http://127.0.0.1:5179/login
```

These commands reuse a pre-existing Chromium installation. No browser download
was performed. If another machine lacks it, do not install globally: explicitly
configure a repository-local `PLAYWRIGHT_BROWSERS_PATH` and install the matching
browser there. Keep captures free of account/session data. Port binding and
browser launch required sandbox approval on the verification machine.

The existing `playwright.config.ts` and `playwright-fixture.ts` reference
`lovable-agent-playwright-config`, which is absent from `package.json`. The
standalone CLI capture path does not load those files. This setup does not claim
the template Playwright Test configuration works or repair it incidentally.

## Weekly view location

- Route: `/portal` in `src/App.tsx`.
- Host and authentication/onboarding gate: `src/pages/PortalPage.tsx`; the
  `Weekly Plan` tab renders after bootstrap reaches `view_weekly_plan`.
- Main view: `src/components/portal/WeeklyPlanScreen.tsx`.
- Week selection: `src/components/portal/WeekNavigator.tsx`.
- Current local composition includes `WeekPulse`, `TodayPendingCard`,
  `TodayDoneCard`, `WeekMetrics`, `RaceGoalCard`, `ScheduleList`,
  `SyncedActivityBadge`, `SessionRightSummary` and `ExecutionFeedbackDetails`,
  defined within `WeeklyPlanScreen.tsx`. Session details expand inline.
- Data boundary: `src/lib/portal-api.ts`; layout/theme sources remain
  `src/index.css`, `tailwind.config.ts`, `DESIGN.md` and `.impeccable/design.json`.

The browser smoke check uses the real login page, without signing in or calling
authenticated backend endpoints. Login screenshots are tooling evidence, not
weekly-plan design evidence. Capturing the weekly view later requires an
authorized test session or an explicitly identified, isolated test fixture.

## Setup verification

Recorded on 2026-10-15:

- `npm run lint`: passes, with 9 existing Fast Refresh warnings in unchanged
  application files and no errors.
- `npm test`: all 121 tests pass across 10 files. Existing React Router future
  flag warnings remain.
- `npm run build`: passes. Existing Browserslist age and bundle-size warnings
  remain; dependencies and application code were not changed to address them.
- All 4 skill manifests have valid YAML, matching names and nonempty descriptions.
  Local Markdown references resolve, no symlinks are present, and copied files
  match their pinned upstream content. The 3 added Taste license files are the
  only additions to those upstream skill directories.
- All 8 bundled JavaScript files pass `node --check`; the read-only sector list
  command loads successfully. No design audit, direction draw or media fetch ran.
- Real login screenshots at 1440×900 and 390×844 were generated and visually
  inspected. Both show the application and contain no personal account data.
- `git check-ignore` confirms before/after captures remain ignored.
- First-party whitespace check:
  `git diff --cached --check -- . ':!.agents/skills'` passes. The full staged
  check reports 11 upstream Markdown hard-break lines in the unchanged
  `image-to-code/SKILL.md`; those two-space endings are preserved deliberately.
- `src/`, dependency manifests/lockfiles, visual system files and project hook
  configuration remain unchanged from the baseline.
- Runtime Codex picker verification remains blocked as described above. The
  template Playwright Test configuration is outside the verified standalone CLI
  path. These are explicit limitations, not successful checks.

Changed first-party files retain the repository's formatting; vendored skills
retain upstream bytes. No formatting dependency was added. No visual audit or
redesign acceptance check is part of this setup.

## Revert the entire experiment

Returning to the original branch preserves the experiment for later review:

```sh
git status --short
git switch main
git rev-parse HEAD
```

Stop if there are uncommitted changes. The original `main` commit recorded above
must remain unchanged during setup; do not reset or force-move it. Switching
branches removes the tracked experiment files, including installed project skills.
Global skills and hooks require no rollback. Dependencies were not changed, so
no reinstall is necessary for this setup alone.

For complete removal, first stop this experiment's dev server and browsers. Save
any captures you want to retain. While still on the experiment branch, remove
only its generated workspace, then switch and optionally delete the branch:

```sh
git status --short
rm -rf -- .design-experiment
git switch main
git branch -D experiment/ui-design-skills
```

`rm -rf` permanently deletes this experiment's ignored artifacts; branch deletion
discards its Git reference, including any later experiment commits. Run these
only when that is intended. Avoid `git reset --hard` or broad `git clean` commands.
If you want to keep the branch but undo setup, locate the commit with
`git log --oneline --grep='^chore: setup experimental design skills$'` and run
`git revert <setup-commit>` from a clean working tree instead. Ignored runtime
files still require the explicit workspace cleanup above. If future experiment
commits change dependencies, restore their manifests and run `npm ci` separately.
