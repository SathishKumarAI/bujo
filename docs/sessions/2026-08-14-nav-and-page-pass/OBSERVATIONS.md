# Observations

The observe step, per page: screenshot with real (demo/explore) data, read the
console, then **query the DOM** for the things a screenshot cannot settle.

Environment: Chrome via CDP on :9333, Vite dev on :5173, `settings.explore` sample
journal, mocha theme. Console was clean on every page — no errors, no warnings.

## Today · focused rail, 1440

Cleanest of the six. Time-of-day tabs (Morning/Day/Evening) work; capture bar,
habit chips, count habits and streak nudge all read well. Two notes, neither a
defect: the rail has a large dead band between Insights and the pinned footer at
this height, and the page is a card inside a bordered container inside a card, so
nesting reaches three levels before content.

## Plan · 1440

Good orient zone — the three-fact stat bar is exactly what the top of a page should
be. Below it:

- The week strip truncated every entry to a prefix. **Fixed** (P4).
- The migration list is 20 rows of three identical buttons. Correct, unreadable in
  bulk → backlog B7.
- Heading treatments are mixed: "Recurring tasks & events" and "Chronically
  deferred" are display-font card titles, "This week", "Put things on the week" and
  "Migration" are plain section labels. Reads as two systems.
- Sat 15 showed only "…" — a symptom of the truncation, resolved with it.

## Fitness · 1440 / 501

- Tab row overflows: 571px of tabs in a 491px row, and did not scroll the active
  tab into view. **Fixed** (N3).
- "Next up: Target met — anything you l…" truncates in the orient strip.
- Form fields cap at 380px in a 912px zone → withdrawn as a defect, backlog B1.
- The heatmap at the foot has no legend, no axis and no caption.
- `History` / `Analytics` / `Log a cardio session` are three different label styles.
- Inputs measure 380px at both widths, so the narrow-column issue is desktop-only.

## Nutrition · 1440

Same shape as Fitness, same 380px-in-912px form. Additionally:

- "Fill a typical day" is centred while everything around it is left-aligned.
- The macro split bars both normalise to full width, so the target comparison the
  card is named for cannot be read → backlog B6.
- "Recent days" is 14 rows of date + kcal with nothing to compare against → B7.
- No ⓘ noise here, because the cards carry no titles — consistent with the `Card`
  fallback being the source of it elsewhere.

## Insights · 1440

The worst page, and the one that produced three of the six fixes.

- 17 ⓘ buttons, none with real help text. **Fixed** (P1).
- Cards 213px wide, titles wrapping to three lines. **Fixed** (P3).
- "Month over month" and "Best & worst day" rendered as floating numbers with no
  bars. Looked like a deliberate minimal style; was `height: 0` on every bar.
  **Fixed** (P2) — and the same bug turned out to affect four more charts on other
  pages.
- Five-plus distinct stat treatments in one column → backlog B3.
- Column bottoms ragged, ~200px hole under "Coach digest" → backlog B2.

## Settings · 1440

The best-structured page of the six: one tab row, one card, sensible grouping,
labels and controls aligned in two columns. Only note is that its tab row is pills
with icons while every other tab row in the app is underlined text → backlog B4.

## Classic rail · 1440

Read the rail rows straight out of the DOM rather than counting them in a
screenshot, which is how the missing views were found:

```
Today Plan Fitness Nutrition Recovery Coaching Trackers Challenges Focus Mindset
Collections Reading Monthly Goals Insights Stats Settings Light theme
sectionTabRowPresent: false
```

16 destinations, no Strength, no Pickleball, and no tab row to reach them by.
**Fixed** (N1).

## Phone · 501px

- Bottom nav renders 5 tabs, labelled Today / Plan / Body / Mind / Insights. The
  documented `PRIMARY` filtering trap is not currently firing.
- No horizontal page overflow on any page checked.
- Card subtitles are not rendered below `sm`, which is what makes the ⓘ fallback
  load-bearing there and redundant above it.
