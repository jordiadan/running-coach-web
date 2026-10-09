# Workout Execution Feedback prototype

Frontend prototype only. Weekly Plan and Today use supplied evaluations; API
adaptation and backend integration remain separate work before merge.

## Run the preview

```sh
npm run dev -- --port 5175
```

Visit `http://localhost:5175/dev/workout-feedback` and open a workout. The selector
covers evaluated, different, partial, insufficient, unavailable, manual, loading,
error and manually completed with evaluation. Add `?today` to inspect Today.
**Try again** switches the error example to an evaluation. All data is synthetic;
the preview needs no authentication or backend requests. The DEV import guard
excludes the route and mock fixtures from production.

## Presentation and boundary

Compact desktop rows align day and planned minutes in consistent columns; mobile
keeps them below the title. Names wrap and remain readable after completion.
Completion controls retain 44px targets. A single neutral number shows the supplied
plan-match score, without a duplicate meter, grade or invented threshold. The
schedule names the score once; its meaning remains available within the comparison
details. The score measures plan match, not fitness or race performance.

Opening a run shows supplied explanation and advice. Its provider link appears
immediately, outside **Compare with plan** or **Session notes**. Today shows the
provider link directly, independently of evaluation availability. Missing URLs
remain plain source text; the frontend never invents activity URLs.

One native comparison disclosure retains duration, intensity, structure, supplied
outcomes, score meaning and session notes. Missing evidence receives no score;
loading and retryable errors keep their existing behavior. **View workout feedback**
appears on Today only for a valid supplied running evaluation, for either manual
or automatic completion. It opens the matching workout. Completing a run alone
never creates an evaluation.

`src/lib/workout-feedback.ts` remains a presentation model, not a server contract
or scoring calculation. Existing score validation, matching, completion and API
behavior are preserved. No new dependencies or backend requests are introduced.

## Verification and limitations

The full suite passes 99 tests, including both completion sources, valid/absent/
invalid evaluation gating, provider disclosure access and single score displays at
0, 48, 92 and 100. Lint reports zero errors and nine existing warnings; production
build passes. TypeScript retains the same eight baseline errors, so it does not
fully pass.

Actual Chromium checks cover 1440px, 390px and 320px with reduced motion,
keyboard focus and activation, native comparison, retry and Today navigation.
No horizontal overflow, page errors or fetch/XHR requests were observed. The
fixture row measures 44px on desktop and 57.5px on mobile, versus 65.5px before.
Long titles can increase height. Score numbers, explanations, theme tokens and
matching logic remain authoritative; real-data and screen-reader validation are
still outside this prototype.

Fresh, inspected before/after screenshots are embedded in
[PR #17](https://github.com/jordiadan/running-coach-web/pull/17). The baseline is
`84f900b`, with identical synthetic fixtures on both sides. Captures and their
metadata stay outside the repository. The latest refinement removes the duplicate
meter, aligns desktop metadata even when rows have no evaluation, and gives
comparison cells natural widths and explicit spacing. Today feedback keeps a
readable primary color on hover.
