# Validation

Branch `fix/ui-ux-page-pass`, five commits off `chore/real-data-pass`.

## Gates

| Gate | Before | After |
|---|---|---|
| `npx tsc -b` | 0 | **0** |
| `npx vitest run` | 738 / 50 files | **741 / 51 files** (+3, the F-01 regression test) |
| `npx eslint .` | 0 errors, 2 warnings | **0 errors, 2 warnings** (both pre-existing, `App.tsx:154,206` `replaceAll`) |
| `npm run build` | clean | **clean** |
| `npm run a11y` | 0 serious / 80 scans | **0 serious / 80 scans** (5 themes × 16 surfaces) |

`npm run a11y` needs `npx vite preview --port 4173` running first — the script
assumes it and dies with `ERR_CONNECTION_REFUSED` otherwise. Rebuild before
believing a result; it serves `dist`, not source.

## Per-fix visual proof

Every fix was re-screenshotted on the page that showed the defect. A fix with no
re-screenshot was not counted as done.

| Fix | Verified by |
|---|---|
| F-01 Fitness deep link | `?view=fitness&activity=run` → toggle **Cardio**, select **Run**, header "Log a cardio session", cardio history. Then clicking Sport by hand still switches, proving the link does not pin the toggle. |
| F-02 week strip | Seven distinct numbers under the bars (81 / 85 / 89 / 81 / 81 / 81 / 85); `aria-label` read back from the DOM names all seven days with percentages. |
| F-04 Goals baseline | All three bars in a row on one y; detail text wraps instead of clipping. |
| F-06 Fitness empty state | Sport mode with no sessions: no `—` tiles, no blank heatmap. |
| F-08 demo shapes | `bujo:data` habits now include `Doomscrolling:check:avoid`, `Water:count`, `Meditation:timer`. Evening shows "Doomscrolling · clean" un-struck; footer "5 of 8 done. 1 to avoid, tracked separately." Trackers shows the count stepper (`7/8`) and the timer chip (`8/15m`). |
| F-11 habit names | Every name legible in full — Caffeine, Sugar, Alcohol, Vegetables, Water 2L, Water, Exercise — badges wrapped beneath. |
| F-12 card titles | Stats reads "Mood calendar", "Workout minutes", "Workout split", "Focus vs sleep", "Task breakdown" in full. |
| F-13 star rating | Five solid yellow duotone stars on a rated book. |
| F-14 · F-15 · F-16 | Code-level; covered by the suite and by the a11y pass over Collections and Challenges. |

## What was NOT verified

- **Only mocha, only 1440.** Agreed scope. The a11y gate covers all five themes
  mechanically, which is contrast and naming — not layout. The wrapping changes
  in `Card` and Trackers are the ones most likely to look different at 390px,
  and they were not looked at there.
- **F-14's dedupe is unproven against a real duplicate** in the current demo
  journal — the fixture's Sam/Mara pair was what surfaced it, and the re-seed
  regenerated it, but the deduped list was not re-screenshotted.
- **The other seven fixes have no test.** F-01 does (`src/views/Fitness.test.tsx`,
  proven to fail 2/3 against the pre-fix code). The rest are layout and are held
  by screenshots. The `ResizeObserver` polyfill this session added to the test
  setup is what unblocks testing any page-contract view, so the next pass can
  close that cheaply.
- **Nothing was checked at 390px.** The `Card` header and Trackers name-cell
  changes both introduce wrapping, and phone width is where wrapping decisions
  actually bite.
