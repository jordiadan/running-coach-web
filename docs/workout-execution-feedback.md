# Workout Execution Feedback prototype

Frontend prototype only. Weekly Plan uses readable names and one unboxed score
per evaluated running row, under **Plan match**. Completed names wrap without
strikethrough or ellipsis; day and planned minutes are secondary. Today done keeps
its score beside the name, navigation and undo. API adapter and backend work
remain stopped pending the user's visual approval.

## Run the preview

```sh
npm run dev -- --port 5175
```

Visit `http://localhost:5175/dev/workout-feedback`, open Monday's run and use the
selector: Good adherence, Different from plan, Partial evaluation, Insufficient
evidence, No evaluation, Manually completed, Loading and Request error.
**Try again** switches the error to an evaluated example. **Today** opens a seeded
empty week; **Previous week** returns to the historical fixture. Visit
`http://localhost:5175/dev/workout-feedback?today` for a completed Monday in the
current week; **View workout feedback** opens its schedule details. All data is
synthetic, cached locally, and requires no authentication or backend requests.
The `import.meta.env.DEV` import guard excludes the route and mocks in production.

## Presentation and boundary

Opening a run adds its supplied summary and short advice in plain prose, keeping
one score in the row. No duplicate score, interpretation heading, outcome groups,
**Next time** label or bordered feedback card. One native
**Compare with plan** disclosure contains planned/recorded duration, intensity and
structure, supplied outcomes, score meaning, provider link and session notes.
The score describes plan adherence, not fitness or race performance.

Missing evidence never receives a score. Loading/error states support status and
retry; unscored details retain supplied links and notes. Manual completion stays
separate from matched activity and evaluation. Other modalities keep their source
link in expanded details without run feedback. Uncompleted, unmatched runs receive
no feedback.

`src/lib/workout-feedback.ts` holds supplied presentation values, not a server
contract or domain calculations. Shorter mock prose preserves scores and outcomes;
`insight` does not establish a backend field. API contracts, completion, matching
and dependencies stay unchanged; integration needs separate contract review.

## Validation and limits

Fresh finish review: **SHIP at mock scope**, after fixing 320px comparison wrapping.
The 28% / 35% / 37% table columns preserve “Continuous” there. This scoped verdict
does not certify the whole application.
[Evidence](screenshots/workout-feedback/README.md) contains 45 actual PNGs with
[verified hashes and provenance](screenshots/workout-feedback/provenance.json):
rejected baseline `6573f8f` versus current Weekly Plan and Today, desktop/mobile,
default prose, comparison, alternate states, row crops and narrow comparison.

All eight states passed browser checks at 1440px, 390px and 320px without overflow,
console errors or API requests. Keyboard row expansion (Enter/Space), native
disclosure (Enter), retry and Today navigation passed; completed titles remained
readable and expanded rows kept one score. Schedule completion targets are 44px;
checked feedback body contrast meets 4.5:1. All 71 tests pass, including the added
Strength regression. Lint: zero errors, nine baseline warnings. Build passes with
baseline chunk/Browserslist warnings. TypeScript still has eight baseline errors,
byte-identical to the earlier baseline; it does not fully pass. One manual
three-target detector run reported legacy font-ramp advisories; truncated output
does not establish a clean scan.

The brief matches existing warm surfaces, green primary, DM Sans/tabular scores,
serif headings, rounded rows and focus tokens. Provider links require an extra
disclosure action for quieter rows. Default Today pending provider badge stays
outside this revision. `DESIGN.md`, sidecar, theme tokens and global configuration
remain preserved. Existing theme/sidecar drift, unset `buildPath` and global
accessibility remain outside validation; mocks and the adapter remain limitations.
