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

The default evaluated view shows the supplied result and score, then a three-row
**Plan / Your run** table for duration, intensity and structure. Optional
`planned` and `recorded` strings are presentation values, not computed metrics.
A single native **More details** disclosure holds the explanation and session
notes. Unavailable states use shorter messages. The calendar is unchanged.

The preview route and synthetic fixtures are excluded from the production build
through the `import.meta.env.DEV` import guard. Existing API contracts are
unchanged. Confirm the backend response and adapter in a later integration slice
after visual approval; do not treat the fixture vocabulary as a server schema.

## Validation

Finish review disposition: ship at frontend prototype scope. Twenty-one actual
desktop, mobile and narrow-screen captures were inspected. All eight selectable
states were checked at 1440px, 390px and 320px without overflow, browser errors or
backend API requests. The outer disclosure works with Enter/Space; the native
details disclosure works with Enter. Retry and Today navigation also pass.

At 390px, the default feedback capture is 340px tall, down from 553px (39%
shorter). The sole material review finding, wrapping of the planned structure
value at 320px, was resolved with local cell padding and recaptured.

`npm run lint` passes with nine existing warnings; all 69 tests pass;
`npm run build` passes. A separate TypeScript check still reports the same eight
baseline errors. The production output was checked for fixture exclusion.

The implementation matches the scoped Weekly Plan brief: existing warm surfaces,
green emphasis, DM Sans/tabular metrics, rounded disclosure and a compact
comparison table on all checked widths. Feedback stays inside the session;
explanation and notes sit behind one disclosure. No durable design-system change
is introduced, so `DESIGN.md` and `.impeccable/design.json` remain unchanged.

Pre-existing limitations remain: alternate theme selections render warm, and the
design sidecar lags `DESIGN.md`. The unset Impeccable `buildPath` is a construction
preference, not a prerequisite for this extension. These findings do not imply
theme coverage or a full accessibility certification.
