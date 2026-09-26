# `mindset/` — the Mindset page's bands

One band per file. `views/Mindset.tsx` composes them and owns the state
(search text, category filter); nothing here reaches into the store except
through the callbacks it is handed.

| Change | File |
|---|---|
| The big opening statement, its meta row, the empty state | `LeadingPrinciple.tsx` |
| Slot layout, the cue textarea, Clear, Mark practised | `FocusSlots.tsx` |
| The 12-week grid, the category-balance bars | `PracticeBand.tsx` |
| Search field, category filters, "N of 26 shown" | `LibraryBar.tsx` |
| Grouped principle rows, Add / In focus, no-match line | `LibraryList.tsx` |
| Which principles are visible, the focus cap, the full-slots toast | `views/Mindset.tsx` |
| Rule weights, cell padding, eyebrow and statement type | `components/mod/` |
| Streak, per-category counts, practice days | `lib/mindsetPractice.ts` |

## Rules with a reason

- **The slot row never wraps** (`BandRow wrap={false}`). The handoff records a
  build where it wrapped and left a dead half-row.
- **The filter row scrolls, never wraps.** Wrapping cost 107px of pinned height
  in the handoff's earlier build.
- **`LibraryBar` pins to `--header-h`**, the height the shell measures. A literal
  leaves a slit that content scrolls through, and this header changes height on
  wrap and on notched devices.
- **Accent = state.** Active category bar, in-focus row, practised-today mark.
  Nothing decorative.
- Filtering happens in the view, so the bar's count and the rows on screen are
  computed from the same array and cannot disagree.

## The library is tiles, and they are neutral

`LibraryList` was a hairline-separated list of title-plus-description rows
with an `Add` button at the far right of each. At two columns that put about
twelve unbounded text blocks on screen with nothing but 1px rules between
them, and the control sat nearer the *next* principle's text than its own.

Each principle is a tile now and **the whole tile is the button** — a target
that is the object itself, rather than a 60px control beside it. Cost,
measured: 3.8 → 4.2 shipped screens at 1440, which is the padding.

**Do not give the categories hues.** Nine categories is nine colours if you
let it be, and the page contract spends the accent on one thing: the
principles actually in focus. That is what makes them findable in a wall of
forty-six, and a rainbow of category colours would take it away. See
`docs/PAGE-SHAPE.md`.
