# Design Workflow

This project uses Pencil for design and Astro for implementation.

## Source of truth

- UX structure, wireframes, and implementation-ready screens live in `design/running-coach.pen`
- design tokens live in `src/styles/tokens.css`
- implemented UI lives in `src/`

## Working rules

1. Start in Pencil for any new page, major section, or layout change.
2. Work mobile-first before exploring desktop adaptations.
3. Keep product work in `design/running-coach.pen`.
4. If a second product `.pen` file appears, consolidate it or archive it before continuing.
5. Treat external kits as optional references, not the product source of truth.
6. Implement from the approved frame, not from memory or chat alone.
7. Compare the final implementation against the Pencil frame before closing the task.

## Feature workflow

For every non-trivial feature:

1. Write a short feature brief.
2. Add or update the mobile-first frame in `design/running-coach.pen`.
3. Validate hierarchy, CTA, and states.
4. Implement the smallest FE slice that delivers user value.
5. Verify design-to-code alignment.
6. Run the project checks.

Minimum feature states to consider when relevant:

- empty
- loading
- success
- error
- no-data

## Naming

- `Product flow`
- `Core screens`
- `Screen - Connect Intervals - Mobile`
- `Screen - Goal Setup - Mobile`
- `Screen - Weekly Plan - Mobile`
- `Screen - Calendar - Mobile`
- `Screen - Session Detail - Mobile`

## Minimum verification

- `npm run format`
- `npm run lint`
- `npm run build`
- responsive review
- keyboard navigation review
- design-to-code comparison
