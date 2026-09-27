# `focus/` — the Focus page's parts

Composed by `views/Focus.tsx` on the three-zone contract. Arithmetic is
`lib/focus.ts` and `lib/typing.ts`; **which card sits under which rail row is
`lib/focusCards.ts`**, and `views/Focus.test.tsx` binds that registry to what
renders.

| Change | File |
|---|---|
| The countdown ring, its size, presets, the auto-logged block | `FocusTimer.tsx` |
| The log form and its validation | `LogSession.tsx` |
| A bar, a column series, and every mark the review zone draws | `FocusCharts.tsx` |
| The findings sentences and the interruption cost | `Findings.tsx` |
| Typing form + goal bar (`TypingDrill`), stats + trend + drills (`TypingStats`) | `TypingBand.tsx` |
| The session list and its in-place editor | `SessionHistory.tsx` |
| Which rail row a card is under, its title, whether it takes the row | `../../lib/focusCards.ts` |
| A new finding, a new derivation | `../../lib/focus.ts` (+ its test, + `lib/demo.ts`) |

## Decisions worth keeping

- **A component in here draws marks, not sections.** No file owns a `Band`, an
  `<h2>` or a surface any more: the heading, the subtitle and the box belong to
  the `Card` that `focusCards.ts` places it in. Six bands that each drew their
  own section heading is precisely why the page could only ever be a flat
  vertical stack — the "card inside a card" mistake in header form.
- **`FocusWeek.tsx` and `FocusBreakdowns.tsx` are gone, not lost.** The week's
  headline and its *Worth knowing* list became zone 1's `StatBar` and the
  `findings` card; the four breakdowns became the `weekday`, `interruptions`,
  `projects` and `tags` cards. The rendered-content diff in the PR is the proof.
- **Two mark primitives, eight charts.** `Bar` is a labelled row, `ColumnChart`
  a vertical series. The 14-day minutes chart and the interruptions chart were
  the same eleven lines of markup written twice, one class apart.
- **`share` is a fraction of something the caller names.** Minutes are
  normalised against the largest row; a focus score against **10**, because
  0–10 is an absolute scale and re-basing it makes 7.9 look like a failure
  beside 8.1.
- **Two measures per row, never two y-axes.** `Bar`'s `aside` column carries the
  second figure. A dual-axis chart invites "the lines cross, so something
  happened", which is an artefact of the scaling.
- **`null` is not `0`.** `focusByDuration` returns `avg: null` for a band nobody
  has worked in and the bar prints `—`; `0/10` would say the work was bad rather
  than absent.
- **`FocusTimer` replaced `components/PomodoroCard.tsx`** and is the page's
  identity element — a 240px ring, first in zone 2, which `styles/layout.css`
  places in the **right** column above a 900px container. The countdown stays at
  `--text-display`: DESIGN.md allows "display or larger" for a page's identity
  element and bans an eighth type step, and a one-off clamp is an eighth step
  with no name. The ring carries the size.
- **`formatMinutes` lives in `lib/focus.ts`.** It was defined three times in the
  old view — twice as `hrs`, once as `hrsLabel`, all identical.
- **Editing a session in place is not a nicety.** Delete-and-re-log re-dates the
  session and skews the duration-weighted focus average, so a typo used to cost
  two numbers.
- **`SegmentScale` is untouched.** It is shared with Today, and "not answered
  yet" as a distinct state is a solved problem.
- **Typing had never been seeded.** `lib/demo.ts` wrote every domain except
  `typingSessions`, so `page-census` read `focus · charts 0` for a page holding a
  Recharts `LineChart` — the chart is gated on `wpmCount >= 2`. Seeded now, with
  the gate's own condition asserted in `lib/demo.test.ts`.
