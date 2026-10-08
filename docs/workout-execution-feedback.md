# Workout Execution Feedback prototype

This frontend prototype adds plan-adherence feedback inside Weekly Plan run
details. It keeps manual completion, the matched activity and evaluation separate.
Scores and duration, intensity and structure results are supplied examples; the
frontend does not calculate them. Backend integration awaits the user's visual
approval.

## Run the preview

```sh
npm run dev -- --port 5174
```

Visit `http://localhost:5174/dev/workout-feedback`. The development-only route
needs no sign-in. Open Monday's run, then use the selector to inspect eight
synthetic states:

- Good adherence
- Different from plan
- Partial evaluation
- Insufficient evidence
- No evaluation
- Manually completed
- Loading
- Request error

The error state's **Try again** button switches to the evaluated example. **Today**
opens a seeded empty week; **Previous week** returns to the fixture week. These
interactions use the preview's local query cache rather than backend requests.
All displayed athletes, activities, metrics and evaluations are mock data.

## Implementation boundary

`src/lib/workout-feedback.ts` is a presentation model, not an API contract.
`WorkoutExecutionFeedback.tsx` renders supplied results for completed or matched
running sessions. Missing evidence has no score; unmatched manual completion
does not fabricate an evaluation. Strength, mobility, rest and uncompleted
unmatched runs do not receive feedback.

The preview route and synthetic fixtures are excluded from the production build
through the `import.meta.env.DEV` import guard. Existing API contracts are
unchanged. Confirm the backend response and adapter in a later integration slice
after visual approval; do not treat the fixture vocabulary as a server schema.

## Validation

Finish review disposition: ship at prototype scope. Twelve actual desktop/mobile
captures were inspected. All eight selectable states, horizontal overflow,
keyboard disclosure with Enter/Space, retry and Today navigation were checked.
Preview interactions made no backend API requests.

`npm run lint` passes with nine existing warnings; all 69 tests pass;
`npm run build` passes. A separate TypeScript check still reports the same eight
baseline errors. The production output was checked for fixture exclusion.

The implementation matches the scoped Weekly Plan brief: existing warm surfaces,
green emphasis, DM Sans/tabular metrics, rounded disclosure, a one-column mobile
layout and aligned evidence rows from `sm`. Feedback stays inside the session;
prescription notes follow it. No durable design-system change is introduced, so
`DESIGN.md` and `.impeccable/design.json` remain unchanged.

Pre-existing limitations remain: alternate theme selections render warm, and the
design sidecar lags `DESIGN.md`. The unset Impeccable `buildPath` is a construction
preference, not a prerequisite for this extension. These findings do not imply
theme coverage or a full accessibility certification.
