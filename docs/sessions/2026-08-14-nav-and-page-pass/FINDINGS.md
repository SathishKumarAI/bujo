# Findings

Every row carries the measurement that established it. "Looked wrong in a
screenshot" is not in this table unless a query confirmed it.

## Fixed

### N1 · Two views had no door in the classic layout — **fixed**, `04fc1b8`

`settings.layout: 'classic'` renders a flat rail and **no section tab row**. The
classic list held 16 destinations and `gym` and `pickleball` were not among them,
while `sections.ts` lists both as tabs of Body. So on that setting the entire
Strength workshop (exercise picker, program tracker, plate calculator, muscle map,
progress photos) and the entire pickleball record (win rate, singles vs doubles,
tournaments, leagues) were reachable only from the command palette or a typed URL.

Evidence, `layout: 'classic'` at 1440px, rail rows read from the DOM:

```
before  Today Plan Fitness Nutrition Recovery Coaching Trackers Challenges Focus
        Mindset Collections Reading Monthly Goals Insights Stats Settings Light
        theme                                                    ← 16 destinations
after   … Fitness Strength Pickleball Nutrition …                ← 18
sectionTabRowPresent: false
```

This is the failure `sections.ts` documents at length for the *focused* rail,
repeated in the list nobody re-read. `classicNav.test.ts` now asserts that every
view in `SECTIONS` is reachable in both layouts. Confirmed the test can fail:
deleting the `gym` row gives `AssertionError: expected [ 'gym' ] to deeply equal []`.

### N2 · `help` and `settings` rail rows were dead — **deleted**, `04fc1b8`

Both carried `group: 'System'`, which `GROUP_ORDER` does not list, and `Sidebar`
filters items against that list. Neither row has ever rendered in either layout.

Deleted rather than wired up: the comment on the group order says keeping them out
of the rail is the intent, and both destinations are genuinely reachable (Settings
from the rail footer, Help from the top bar's ⓘ menu and the overflow menu —
`TopBar.tsx:196,252`). A second test now fails on any item whose group is absent
from the order.

### N3 · The tab row never showed you where you were — **fixed**, `7d129ad`

Body's six tabs measure 571px against a 491px row, and the row opened at
`scrollLeft: 0`. Landing on `?view=nofap` showed Fitness…Coaching with Recovery
clipped off the right edge — invisible at 390px. The page said Recovery; the tab
row said Fitness.

```
before  scrollLeft 0  · active tab left edge x=466 in a row ending at 491 · visible false
after   scrollLeft 79 of a possible 80 · activeFullyVisible true · window.scrollY 0
first tab  scrollLeft 0 (untouched — the guard works)
```

Two wrong turns on the way, both caught by measuring rather than re-reading:
`offsetLeft` is relative to the nearest *positioned* ancestor and the row is not
positioned; and on a cold load the variable fonts have not resolved, so the row
measured 80px narrower and the scroll clamped to a stale maximum, coming to rest
at 61 — still clipped. Now rect-based and re-run on `document.fonts.ready`.

### P1 · Seventeen ⓘ buttons that repeated the line beneath them — **fixed**, `a4f144b`

Insights drew 17 info popovers at 1440px. Not one was passed a `help` prop —
`help ?? subtitle` in the `Card` header generated all of them, which is why an
audit grepping `help=` reported the page clean.

The fallback is not pointless: the subtitle renders `hidden … sm:block`, so on a
phone the popover is the only way to read it. That makes the boundary exact rather
than a matter of taste.

```
Insights  1440px → 17 buttons,  0 visible · subtitles rendered
Insights   390px → 17 buttons, 17 visible · subtitles not rendered
Coaching  1440px →  8 buttons,  8 visible (all pass a real `help`)
```

### P2 · Every bar chart in the app rendered flat — **fixed**, `49bfebd`

Six charts across four files (`Insights` ×2, `TrackerVisuals` ×2, `Reading`,
`Trackers`) drew their labels and their numbers and no bars at all. Every bar was
0px tall.

One class. Each chart is a fixed-height row of columns; the row carried `items-end`
to baseline the bars, but cross-axis `end` sizes each column to its own content
instead of stretching it, so a column measured 34px of text inside a 120px row, the
`flex-1` bar track inside resolved to 0, and `height: 55%` had nothing to resolve
against. The bars already bottom-align from the *track's* own `items-end`, one
level in — the row's copy was doing nothing but breaking the chart.

Verified by flipping `alignItems` on a live node **before** touching the source:

```
before  row 120px · column  34px · track  0px · bar 0px
after   row 120px · column 120px · track 86px · bar 3px
```

and after the edit, with demo data:

```
Trackers  13 tracks · 0 of height 0 (was 13 of 13)
Insights  13 tracks · 0 of height 0 — "Month over month" and "Best & worst day"
          draw bars for the first time
Reading   12 tracks · 0 of height 0; the 11 zero-height bars that remain are
          months with no books, which is the chart telling the truth
```

### P3 · Insights cards were 213px wide on a 1440px screen — **fixed**, `22d2616`

`md:columns-2` asks how wide the *window* is. Insights lays its sections out two-up,
so each inner masonry sat in a 446px column, read "the viewport is 1440, that clears
md", and split 446 into two 213px columns.

At 213px "Best & worst day" wrapped its title over three lines and rendered its
weekday axis as seven unreadable numbers; "Weekday vs weekend" clipped "5.7/10 mo…"
and "650 scheduled days" inside its own tiles. It read as a per-card styling problem
and was one layout decision made in the wrong units.

```
outer masonry  912px → 2 columns (unchanged)
inner masonry  446px → 1 column  (was 2 × 213px)
Mindset        912px → 2 columns, cards 446px (unchanged — no regression)
containerType  inline-size on all three wrappers
```

Checked the computed values rather than trusting the class names, per the standing
note that Tailwind v4 exits 0 and emits nothing for a utility it does not know.

### P4 · Plan's week strip showed prefixes, not tasks — **fixed**, `9aa2c13`

Every entry was `truncate`d to roughly eighteen characters: "Get camp new fo…",
"Find something r…", "#travel walk the …". The comment above `WeekAgenda` already
names truncation as the reason the strip spans both zone columns; spanning bought
it 120px per day, which was not enough.

`line-clamp-2` instead — the rule the card header already states: wraps, never
truncates. 16 entries across 7 cells, **0 still clipped** (`scrollHeight >
clientHeight`) against 16 of 16 before. Cells grow 112px → 150px, still bounded by
the existing four-item + "+n more" cap.

## Withdrawn

### W1 · "The Fitness/Nutrition forms leave half the page empty"

Raised from the 1440px screenshots: form fields cap at 380px inside a 912px zone,
leaving ~530px of dead space to the right.

**Withdrawn as a defect.** A capped measure on a form is correct practice, not a
bug — a 900px-wide text input is worse. What is actually wrong is that the page has
one zone doing one job, which is a layout redesign and outside a fix pass. Moved to
`BACKLOG.md` with the measurement.

### W2 · "The tab row overflows with no scroll affordance"

Real (571px of tabs in a 491px row, no fade or arrow), but once N3 centres the
active tab, partial tabs are visible at both edges — which is the affordance, and
the standard iOS/Material behaviour. Logged in `BACKLOG.md` rather than fixed.

## Not checked

- **Latte (light) theme** — not selected in scope. Every measurement here is mocha.
- **The other 22 views** — only the six agreed pages plus the pages the shared
  fixes touch (`Reading`, `Trackers`, `Mindset`, `Coaching`) were opened.
- **390px exactly.** Chrome's minimum window width on this machine is ~501px, so
  the "phone" measurements are at 501px. That is still below the `md` breakpoint,
  so the bottom nav and drawer are the ones under test; but a defect that only
  appears between 390 and 501 would not have been seen. The tab-row overflow was
  measured arithmetically (571 vs 491) rather than by eye, so it holds at 390.
