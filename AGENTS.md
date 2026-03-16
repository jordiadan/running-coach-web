# AGENTS.md

Operational guide for AI coding agents and contributors working on the Running Coach web app.

This repository exists to build a small, credible, fast, accessible web presence for the product.
The web app is not the backend.
Keep it lightweight, content-first, and easy to evolve.

---

## 1. Repo purpose

The first release is a small public website, not a large frontend application.

Primary goals:
- provide a trustworthy public-facing website URL
- provide a privacy policy URL
- explain what Running Coach is in simple language
- support credibility for Intervals OAuth app approval
- leave room to grow later without overbuilding now

Non-goals for v1:
- no user dashboard
- no complex auth flows
- no client-heavy architecture by default
- no unnecessary animations, CMS, or design systems
- no generic “platform” abstractions
- no backend logic in this repo

If a proposed change pushes the repo toward “mini SaaS frontend” territory, stop and simplify.

---

## 2. Decision hierarchy

When in doubt, choose:
1. the simpler scope
2. the simpler layout
3. the more semantic markup
4. the lower-JS option
5. the more readable copy
6. the more trustworthy UX
7. the smaller PR

Prefer deletion and simplification over adding more layers.

---

## 3. Working mode

Use one focused coding session per task whenever possible.

For small changes:
- state the intended outcome briefly
- implement directly
- verify the result

For non-trivial changes such as a new page, a new section, or a meaningful layout change:
1. define the page or feature goal
2. define the target user
3. define the primary user action
4. define the minimum content needed
5. propose the smallest safe implementation slice
6. implement only that slice
7. verify before moving on

Do not jump into implementation if the problem is still structurally ambiguous.

Keep changes small, localized, and reviewable.

---

## 4. Default stack

Unless requirements clearly justify otherwise, use:

- Astro
- TypeScript
- static output
- minimal or no client-side JavaScript
- plain CSS with tokens
- simple deployment

Default priorities:
1. static-first
2. semantic HTML
3. maintainable CSS
4. minimal JS
5. simple deployment
6. room to scale later

Do not choose a stack because it is trendy.
Choose it because it fits the current product scope.

---

## 5. Design workflow

Pencil is the default design tool for non-trivial UI work.

Keep the design structure simple:

- `design/running-coach.pen` → product sitemap, IA, wireframes, ready-for-dev screens
- `design/pencil-lunaris.pen` → reference kit / reusable component library

Do not split product work into separate UX and UI files unless the project becomes significantly larger.

### Default design flow

For any new page, major section, or meaningful structural UI change:
1. define the page goal
2. define the primary user action
3. define the minimum content needed
4. create or update one mobile-first frame in `design/running-coach.pen`
5. reuse kit variables and kit components before inventing new UI
6. implement the smallest viable slice
7. compare implementation against the relevant frame or screenshot
8. fix meaningful mismatches before closing the task

For very small changes such as copy edits, spacing tweaks, or minor visual fixes:
- a formal wireframe is not required
- state the intended result briefly and implement directly

Do not block progress waiting for polished design.

### What Pencil is for in this repo

Use Pencil to decide:
- page structure
- section order
- content hierarchy
- CTA placement
- mobile-first layout
- trust and credibility signals

Do not use Pencil to over-design polish too early.

Wireframes should answer:
- what is this page for
- what should users understand in 5 seconds
- what should they do next
- what should they trust

---

## 6. Pencil kit usage

Use `design/pencil-lunaris.pen` as the default visual and component baseline.

Do not recreate a local design system from scratch if the kit already provides a suitable base.

Default rule:
- reuse kit variables first
- reuse kit components second
- create new product-specific components only if the kit clearly does not fit and repetition is real

For v1, prefer a small subset of kit patterns:
- top navigation
- primary button
- secondary button
- card
- info block
- simple footer

Do not introduce complex kit patterns unless the product truly needs them.

Avoid by default:
- sidebars
- dashboard layouts
- tables
- charts
- tabs
- modal-heavy flows
- settings-like UI on the main path

The screen is defined by the product’s content and hierarchy first.
The kit exists to speed up execution and keep the UI coherent.

---

## 7. UX rules

### Clarity first
Every page must answer quickly:
- what this product is
- who it is for
- what benefit it provides
- what users should do next

The hero must communicate product purpose in plain language.
Do not assume prior knowledge.

### Credibility matters
This site exists partly to make the project feel legitimate and understandable.

Use trust-building elements where appropriate:
- clear product name
- concise explanation of what the product does
- plain language
- privacy and data-use transparency
- working links
- contact or owner information if appropriate
- no placeholder junk
- no fake corporate tone

### Strong hierarchy
Use obvious hierarchy:
- one main message per page
- one primary CTA per screen
- supporting content below the fold
- no competing focal points

Prefer:
- short sections
- strong headings
- scannable paragraphs
- single-column layouts for content-heavy pages
- consistent spacing and rhythm

### Progressive disclosure
Keep the first screen simple.
Push secondary details lower on the page.
Do not front-load every detail.

### Mobile-first always
Design and implement from the narrowest viewport first.
Desktop is an enhancement, not the default mental model.

### Simple copy beats marketing fluff
Use short, direct, human language.

Bad:
- Revolutionize your training journey with AI-powered optimization

Better:
- Connect your training data and get a clear weekly running plan

---

## 8. Frontend implementation rules

Prefer semantic HTML and CSS over JavaScript-heavy UI.

Use native elements whenever possible:
- `header`
- `main`
- `nav`
- `section`
- `footer`
- `form`
- `button`
- `label`
- `input`
- `picture`
- `img`

Use ARIA only when native HTML is insufficient.

Do not replace native elements with `div` unless there is a strong reason.

### Styling rules
- keep a small token foundation
- use CSS variables for colors, spacing, radius, typography, and shadows if needed
- avoid arbitrary hardcoded values when an existing token fits
- prefer consistency over novelty
- prefer composition over deeply configurable abstractions

CSS design tokens must live in:
- `src/styles/tokens.css`

### Component rules
Do not create a reusable UI component until repetition is real.

Create a component only when:
- the same structure appears in multiple places
- the semantics are the same
- the styling is intended to stay aligned

Prefer simple composition over generic abstractions.

### Repo boundaries
- keep this repo focused on the web app only
- do not pull backend logic into this repository
- do not duplicate backend domain logic here
- use static or mock content unless integration is explicitly required
- keep environment variables minimal
- document setup and commands in the README

---

## 9. Accessibility rules

Accessibility is a default, not a later pass.

Requirements:
- every interactive element must be keyboard reachable
- every form field must have a visible label
- every image must have meaningful `alt` text or be explicitly decorative
- headings must form a sensible outline
- link text must make sense out of context
- focus states must be visible
- color contrast must be sufficient
- motion must be subtle and respect reduced-motion preferences

Prefer native semantics over ARIA workarounds.

---

## 10. Performance rules

Performance is a product feature.

Requirements:
- prioritize a fast first render
- keep the initial page lightweight
- ship as little JavaScript as possible
- avoid unnecessary third-party scripts
- make key hero content visible quickly
- ensure important images are discoverable in HTML
- use responsive images
- lazy-load non-critical media
- avoid layout shifts
- prefer system fonts or a minimal font strategy

Audit every dependency and third-party script before adding it.

If a dependency does not clearly improve user value, do not add it.

---

## 11. Default v1 page strategy

The first pages should usually be:

- `/`
  - hero
  - what it does
  - how it works
  - privacy/data note
  - contact or owner note
- `/privacy`
  - what data is collected
  - why it is used
  - what providers are involved
  - how users can request deletion or disconnection

Optional later pages:
- `/about`
- `/integrations`
- `/connect`

Do not add extra pages unless they serve a clear purpose.

---

## 12. What agents must provide before coding

For non-trivial tasks, provide a short plan with:
- page or feature goal
- target user
- primary user action
- minimum content or structure
- simplest viable stack choice
- files likely to change
- smallest safe implementation slice
- key risk or open question if any

For UI tasks, also state:
- which Pencil frame is being implemented
- mobile-first layout concept
- whether the kit already covers the required UI

Keep the plan short and executable.

---

## 13. What agents must do while implementing

- keep changes small and localized
- preserve repository clarity
- leave the app runnable at every step
- avoid mixing refactors with new UI behavior unless necessary
- keep copy, layout, and architecture decisions explicit in the diff
- prefer one concern per commit-worthy change

Do not silently improvise major layout changes if a relevant design frame already exists.

If design and implementation diverge, say so explicitly.

---

## 14. Verification

Agents must verify their work, not just claim it is done.

Verification should be proportional to the change.

### For all meaningful changes
- run formatting if configured
- run linting if configured
- run tests if present and relevant
- build the site successfully

### For UI changes
- preview the changed page
- check mobile and desktop
- check keyboard navigation
- check obvious accessibility issues
- check that links and navigation work
- check there are no broken assets
- compare implementation against the relevant Pencil frame or screenshot
- call out any intentional deviation explicitly

Do not mark UI work done without visual verification.

---

## 15. Definition of done

A task is not done until:
- the page or feature goal is clear
- the hierarchy is obvious
- the content is understandable
- the layout works on mobile and desktop
- accessibility is acceptable at a sensible baseline
- the site builds successfully
- the implementation remains simple for the current scope
- verification has been summarized honestly

For UI work, also require:
- the implemented result matches the intended design direction
- any design/code deviation is stated explicitly

---

## 16. Anti-patterns

Avoid:
- starting with a full custom design system
- adding React state everywhere with no need
- overusing animations
- unclear CTAs
- inaccessible custom controls
- marketing copy that says little
- heavy dependency chains for simple UI
- page-builder style complexity
- abstractions for future pages that do not exist yet
- coding without first defining page purpose and hierarchy
- treating the kit canvas as the product source of truth
- expanding v1 scope just because the kit already has more components

---

## 17. Expected agent output style

Be concise, structured, and explicit.

When proposing work, include:
- plan
- rationale
- implementation steps
- verification steps
- tradeoffs if any

Do not hide tradeoffs.
Do not claim certainty when something has not been verified.
Do not over-explain simple decisions.

---

## 18. Default first task

If no other task is given, start with:
1. confirm the v1 stack
2. define the v1 sitemap
3. define the homepage information architecture
4. define the privacy page structure
5. create or update the relevant Pencil frames
6. only then scaffold or implement

Start with the smallest credible version.
