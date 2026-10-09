# Workout feedback screenshot evidence

Actual Chromium screenshots of `/dev/workout-feedback`, using synthetic runner,
activity and evaluation data. No signed-in session or backend requests.

- `before-*`: UI from commit `f7254f3`; previous score-hidden schedule and
  comparison-first feedback. Today captures use that UI with the new preview-only
  `?today` fixture selector so the same session can be compared.
- `after-*`: the revised frontend on `feat/workout-execution-feedback`.
- `desktop`: browser viewport 1440 × 1000.
- `mobile`: browser viewport 390 × 844.
- `collapsed`, `expanded`: historical Weekly Plan, Monday run.
- `today`: `/dev/workout-feedback?today`, current week with completed Monday as
  the explicitly seeded Today session.
- `comparison`: expanded native **Compare with plan** disclosure, section crop.
- `feedback`, `different`, `partial`: evaluated feedback, section crop.
- `insufficient`, `unavailable`, `manual`, `loading`, `error`: unscored feedback,
  section crop.

Full-page images can exceed the browser viewport height. Captures use reduced
motion; keyboard focus outlines are retained where they document interaction.
The development-only fixture page is excluded from the production bundle.
These PNGs are PR evidence, not application assets. Before/after links and the
screenshot checklist are included in PR #17's description.
