# Design Workflow

This project uses Pencil for design and Astro for implementation.

## Source of truth

- UX structure, wireframes, and implementation-ready screens live in `design/running-coach.pen`
- design tokens live in `src/styles/tokens.css`
- implemented UI lives in `src/`

## Working rules

1. Start in Pencil for any new page, major section, or layout change.
2. Work mobile-first before exploring desktop adaptations.
3. Keep product work in `design/running-coach.pen` unless the project grows enough to justify a split.
4. Treat `lunaris` as a reference kit, not the product source of truth.
5. Implement from the approved frame, not from memory or chat alone.
6. Compare the final implementation against the Pencil frame before closing the task.

## Naming

- `Wireframe - Home - Mobile`
- `Wireframe - Privacy - Mobile`
- `Ready for Dev - Home`
- `Ready for Dev - Privacy`

## Minimum verification

- `npm run format`
- `npm run lint`
- `npm run build`
- responsive review
- keyboard navigation review
- design-to-code comparison
