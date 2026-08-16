# `focus/` — the Focus page's bands

One band per file, composed by `views/Focus.tsx`. Arithmetic is `lib/focus.ts`
and `lib/typing.ts`.

| Change | File |
|---|---|
| The week's headline, streak / focus / stress, longest session, insight | `FocusWeek.tsx` |
| The log form and its validation | `LogSession.tsx` |
| Pomodoro timer, presets, auto-logged block | `FocusTimer.tsx` |
| 14-day bars, cumulative line, 26-week heatmap | `FocusCharts.tsx` |
| Weekday volume/quality toggle, project, tags, interruptions | `FocusBreakdowns.tsx` |
| Typing form, stats, WPM trend, practice sites, recent drills | `TypingBand.tsx` |
| Session list and its in-place editor | `SessionHistory.tsx` |

## Decisions worth keeping

- **Three folds are gone** — "Focus analytics", "Typing", and a collapsible
  History. Nine cards in a masonry became six bands in a fixed order, and axe
  can now see the whole page.
- **`FocusTimer` replaced `components/PomodoroCard.tsx`** — one call site, and a
  raised card floating in a flat page. Timer, presets and the auto-logged
  session are unchanged.
- **`formatMinutes` lives in `lib/focus.ts`.** It was defined three times in the
  old view — twice as `hrs`, once as `hrsLabel`, all identical.
- **Editing a session in place is not a nicety.** Delete-and-re-log re-dates the
  session and skews the duration-weighted focus average, so a typo used to cost
  two numbers.
- **`SegmentScale` is untouched.** It is shared with Today, and "not answered
  yet" as a distinct state is a solved problem.
