# Workout feedback screenshot evidence

Actual Chromium captures of the running Weekly Plan component at
`/dev/workout-feedback`, using synthetic data and reduced motion. No signed-in
session, personal information, tokens or backend requests. PNGs are PR evidence,
not production application assets.

- Before: rejected prototype commit `6573f8f`.
- After: minimal revision on `feat/workout-execution-feedback`.
- Desktop viewport: 1440 × 1000. Mobile: 390 × 844. Narrow comparison: 320 × 780.
- `collapsed` / `expanded`: historical Weekly Plan, Monday run.
- `today-collapsed` / `today-expanded`: `/dev/workout-feedback?today`, explicitly
  seeded completed Monday as the Today session.
- `feedback`: default feedback section crop.
- `comparison`: native comparison open, section crop.
- `row`: workout row crop; `different-row`, `partial-row`, `manual-row` show its
  score or absence independently from the explanation.
- Other state names: alternate feedback section crops.

Full-page images can exceed the viewport height. Keyboard focus remains visible
where it documents operation. `provenance.json` records origins, source revision
or fingerprint, capture timestamps and image hashes for all 45 PNGs. Before/after
links and the screenshot checklist accompany draft PR #17's description.
