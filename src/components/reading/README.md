# `reading/` — the Reading page's bands

One band per file, composed by `views/Reading.tsx`. Arithmetic lives in
`lib/reading.ts`; nothing here computes a statistic of its own.

| Change | File |
|---|---|
| The book you're reading, its progress and pace, the yearly goal | `NowReading.tsx` |
| Add-a-book row, the three shelf columns | `Shelves.tsx` |
| A single book: pages, rating, shelf moves, notes fold | `BookRow.tsx` |
| The "not moving" nudge | `Stalled.tsx` |
| Finished-by-month, year-in-books, rating distribution | `ReadingReview.tsx` |
| The cross-book learning feed and its search | `LearningFeed.tsx` |
| Saved links | `ReadLater.tsx` |
| Which book leads, what gets passed to each band | `views/Reading.tsx` |

## Decisions worth keeping

- **The leading book is `shelf(books, 'reading')[0]`** — one rule, no "featured"
  flag to keep in sync, same shape as Mindset's `focus[0]`.
- **No folds.** "Reading analytics" was default-collapsed, which hid both charts
  from the user *and* from `npm run a11y` (axe walks the rendered page).
- **The shelf row wraps**, unlike Mindset's focus slots. A shelf is a list that
  can run to fifty books; three of those squeezed into 150px columns is not a
  layout, it is a punishment.
- **"Pages read" and "Pages finished" are different numbers** and must keep
  different labels. They were once both called "Pages read" and showed 440 and
  320 on the same screen.
