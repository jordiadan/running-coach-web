# AGENTS.md

Rules for AI coding agents working in this repo.

## 1. Product

This repo is the user-facing web app for Running Coach.
It is not the backend.

Ship the smallest useful slice first:
- homepage
- privacy
- clean frontend foundation

The future portal may include:
- sign up
- connect Intervals
- onboarding and goals
- weekly plan
- calendar
- session detail

Do not build future portal features speculatively.

## 2. Scope

Keep these separate:
- `Now`: public site and trust pages
- `Next`: authenticated app flows

Do not mix both in one slice unless the task explicitly requires it.
Do not implement app flows directly from backend assumptions alone.

## 3. Decision Rules

Prefer:
- simpler scope
- smaller changes
- lower JS
- more semantic HTML
- more readable copy
- clearer UX

No overengineering.
No speculative features.
No abstractions until repetition is real.
No heavy UI libraries unless explicitly required.

If something starts feeling like “mini SaaS frontend” before the product needs it, stop and simplify.

## 4. Source Of Truth

- design: `design/running-coach.pen`
- frontend: `src/`
- tokens: `src/styles/tokens.css`

Do not implement a meaningful new screen without a corresponding frame in `design/running-coach.pen`.
Do not use temporary Pencil files, demo files, or old design files as product source of truth.

## 5. How To Work

For simple changes:
- state the intended outcome briefly
- implement directly
- verify

For non-trivial changes:
1. define the goal, target user, and primary action
2. define the minimum content needed
3. create or update the mobile-first frame in `design/running-coach.pen`
4. validate hierarchy and states
5. implement the smallest FE slice
6. compare design and code
7. verify before closing

If implementation starts going sideways, stop and re-plan.

## 6. Pencil

Use Pencil for new pages, new flows, and structural UI changes.
Do not block on Pencil for copy edits, spacing tweaks, or small fixes.

Design first, then implement.

## 7. UX Rules

- mobile first
- one primary CTA per screen
- strong hierarchy
- obvious next step
- simple, intuitive, calm flows
- plain language
- no marketing fluff
- no competing focal points
- accessibility by default

Every screen should answer quickly:
- what is this
- why does it matter
- what should the user do next

## 8. FE Rules

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

## 9. Verification And Done

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

Work is not done until:
- the goal is clear
- the hierarchy is clear
- the result is simple for the current scope
- the page works on mobile and desktop
- accessibility is acceptable at baseline
- build passes
- design and code have been compared
- any deviation has been stated clearly

## 10. Boundaries

- Keep this repo focused on the frontend.
- Do not move backend logic here.
- Do not duplicate domain logic here.
- Keep environment setup minimal.
- Keep README short and practical.
- No placeholder junk in user-facing pages.
