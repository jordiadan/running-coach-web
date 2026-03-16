# AGENTS.md

Rules for AI coding agents working in this repo.

## Product

This repo is the user-facing web app for Running Coach.
It is not the backend.

Right now, the shipped scope is small:
- homepage
- privacy page
- clean frontend foundation

Later, this repo should grow into the user portal for:
- sign up
- connect Intervals
- onboarding and goals
- weekly plan
- calendar
- session detail

Do not build the future portal speculatively.
Build only the smallest slice that is clearly in scope.

## Core Rules

- Keep everything clear, simple, and trustworthy.
- Prefer small, reviewable changes.
- No overengineering.
- No speculative features.
- No abstractions until repetition is real.
- No heavy UI libraries unless explicitly required.
- No placeholder junk in user-facing pages.
- Preserve clarity and trust over visual complexity.

If something feels like “mini SaaS frontend” before the product needs it, stop and simplify.

## Source Of Truth

- Product design source of truth: `design/running-coach.pen`
- Frontend source of truth: `src/`
- Design tokens source of truth: `src/styles/tokens.css`

Do not implement a meaningful new screen without a corresponding frame in `design/running-coach.pen`.
Do not use temporary Pencil files, demo files, or old design files as product source of truth.

## Design First

For any non-trivial feature, page, or structural UI change:
1. define the goal
2. define the target user
3. define the primary action
4. define the minimum content needed
5. create or update the mobile-first frame in `design/running-coach.pen`
6. validate hierarchy and states
7. implement the smallest FE slice
8. compare design and code before closing

If the frame does not exist yet, do not implement the feature yet.

## UX Rules

- Mobile first always.
- One primary CTA per screen.
- Keep flows super intuitive, simple, clean, and calm.
- Use strong hierarchy and obvious next steps.
- Keep first screens light; push secondary detail lower.
- Prefer single-column layouts unless a second column clearly helps.
- Use plain language.
- Avoid marketing fluff.
- Avoid competing focal points.
- Accessibility is default, not polish.

Every screen should answer quickly:
- what is this
- why does it matter
- what should the user do next

## FE Rules

Default stack:
- Astro
- TypeScript
- plain CSS
- minimal JavaScript

Prefer:
- semantic HTML
- CSS variables and tokens
- composition over abstraction
- native elements over ARIA workarounds

Do not:
- add client state without a real need
- add dependencies for simple UI
- create reusable components before repetition is real
- hardcode new visual values if an existing token fits

## Scope Rules

Keep `public site now` and `authenticated app next` mentally separate.

Do not mix both in one implementation slice unless the task explicitly requires it.

Do not implement app flows directly from backend assumptions alone.
Design them first.

## Working Style

For simple changes:
- state the intended outcome briefly
- implement directly
- verify

For non-trivial changes:
- plan first
- keep the slice small
- keep the app runnable
- verify before moving on

If implementation starts going sideways, stop and re-plan.

## Verification

Agents must verify their work.

For meaningful changes:
- run formatting
- run linting
- run tests if present and relevant
- build successfully

For UI changes:
- preview the page
- check mobile and desktop
- check keyboard access
- check obvious accessibility issues
- compare against the Pencil frame
- call out any intentional deviation

## Definition Of Done

Work is not done until:
- the goal is clear
- the hierarchy is clear
- the result is simple for the current scope
- the page works on mobile and desktop
- accessibility is acceptable at baseline
- build passes
- design and code have been compared
- any deviation has been stated clearly

## Repo Boundaries

- Keep this repo focused on the frontend.
- Do not move backend logic here.
- Do not duplicate domain logic here.
- Keep environment setup minimal.
- Keep README short and practical.

## Default First Move

If the task is broad or unclear:
1. inspect the repo
2. inspect `design/running-coach.pen`
3. propose the smallest safe next slice
4. only then implement
