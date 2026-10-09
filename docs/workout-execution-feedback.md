# Workout Execution Feedback prototype

This frontend prototype shows a compact plan-adherence score and supplied result
in evaluated Weekly Plan run rows and Today done. Opening a run explains what
matched, what differed and any supplied next-time insight. Manual completion,
the matched activity and evaluation remain separate. Backend integration is
stopped pending the user's visual approval.

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

The error state's **Try again** button switches to the evaluated example. In this
historical preview, **Today** opens a seeded empty week; **Previous week** returns
to the fixture week. Visit `http://localhost:5174/dev/workout-feedback?today` to
inspect Today done: it seeds the current week and explicitly sets
`todaySessionDay` to `MON`. **View workout feedback** opens that run's details.
These interactions use the preview's local query cache rather than backend
requests. All athletes, activities, metrics, evaluations and insights are mock
data.

## Implementation boundary

`src/lib/workout-feedback.ts` is a presentation model, not an API contract.
Scores, labels, insights and duration/intensity/structure outcomes are supplied
data. The frontend does not calculate scores, infer intensity, generate coaching
advice or change the plan. The optional `insight` field demonstrates presentation
only; its mock examples do not establish a backend response field.

`WorkoutExecutionScore.tsx` renders valid supplied scores in the schedule, Today
done and expanded feedback. `WorkoutExecutionFeedback.tsx` renders feedback for
completed or matched running sessions. Missing evidence has no score; unmatched
manual completion does not fabricate an evaluation. Strength, mobility, rest and
uncompleted unmatched runs do not receive feedback.

Expanded feedback groups supplied outcomes under **Matched your plan**, **Worth
adjusting** and **Not assessed**, omitting empty groups. An optional actionable
**Next time** insight follows. One native **Compare with plan** disclosure holds
the three-row **Plan / Your run** table, supplied summary, score explanation and
session notes. Optional `planned` and `recorded` strings are presentation values,
not computed metrics. Unscored states retain neutral copy, loading feedback and
error retry; their notes use a **Session notes** disclosure when present.

The preview route and synthetic fixtures are excluded from the production build
through the `import.meta.env.DEV` import guard. Existing APIs, calculations,
completion workflows and dependencies are unchanged. After visual approval,
confirm the backend response and implement the adapter in a separate integration
slice. Do not treat the fixture vocabulary as a server schema.

## Validation

Independent finish review disposition: **SHIP at frontend prototype scope**,
after recapturing the default Today done screenshots. No material scoped findings
remain. This verdict does not authorize backend integration.

[Screenshot evidence](screenshots/workout-feedback/README.md) contains 30 actual
Chromium PNGs at desktop 1440 × 1000 and mobile 390 × 844. Before/after captures
cover collapsed rows, expanded feedback and Today done; additional captures show
the comparison disclosure and all eight states. The baseline is commit
`f7254f3`; baseline Today captures use the current preview-only fixture selector
with baseline product components. [Provenance](screenshots/workout-feedback/provenance.json)
records routes, states, source fingerprints and image hashes; the reviewer
verified all 30 hashes. Evidence is linked for review in
[draft PR #17](https://github.com/jordiadan/running-coach-web/pull/17).

All eight states passed browser checks at 1440px, 390px and 320px without
horizontal overflow, browser errors or backend requests. Row expansion and the
native disclosure support keyboard operation; retry, Today navigation and the
Today feedback link pass. Captures use synthetic data and reduced motion.

`npm run lint` reports zero errors and nine existing warnings. All 70 tests pass;
the 17 affected tests also pass after the test typing adjustment.
`npm run build` passes with baseline chunk-size and Browserslist warnings.
Separate TypeScript diagnostics are byte-identical to the root baseline's eight
errors. Production output excludes the preview and mock strings.

The implementation matches the scoped Weekly Plan direction with no intentional
deviations: visible contextual scores, grouped feedback, optional supplied
insight and one comparison disclosure. Existing warm surfaces, green emphasis,
DM Sans/tabular metrics, serif headings and rounded rows remain intact. No global
design change is introduced; `DESIGN.md`, `.impeccable/design.json`, theme tokens
and global configuration remain unchanged.

Pre-existing theme rendering drift and the stale design sidecar remain outside
this slice. The unset Impeccable `buildPath` remains a construction preference.
Validation covers the scoped warm implementation; it does not recertify global
themes or application-wide accessibility. Mock data and the pending API adapter
are the remaining prototype limitations.
