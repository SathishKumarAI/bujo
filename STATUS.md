# STATUS

**Stopped:** 2026-09-21, on `refactor/pickleball-space` (stacked on
`fix/a11y-gate-hide-on-scroll`, PR #252). COD-202 closed; `npm run a11y` green
at 194 rows. New: `npm run space`, a measured answer to "this page feels empty".

## `npm run space` — the layout audit

`npm run space -- <view> | --all` prints, per viewport: screens of scroll **as
shipped and with every fold opened**, card count and groups, how many columns
the layout *actually uses*, and any card whose box is mostly air.

Both scroll numbers, because either alone is gameable. Measure only the opened
page and a disclosure looks worthless — fold four optional fields away and the
page is shorter for every user while the tool reports no change. Measure only
the shipped page and hiding content scores well, which is the trap `a11y`
already documents.

### The eight pages over three desktop screens

Two were real layout bugs and are fixed. **The rest are mostly deliberate, and
the audit's value was telling them apart** — a number over budget is a question,
not a verdict.

| View | desktop shipped · open | Verdict |
|---|---|---|
| `help` | 4.3 · 10.8 | **By design.** A catalogue of 24 features in 7 groups; 4.3 is what you actually meet |
| `coaching` | 2.2 · 7.4 | **By design, and measured.** The file documents why it is `stacked`: act column 1676px against a review of 238px, and "no allocation of two columns balances one tall thing and two short ones" |
| `insights` | 6.8 · 6.8 | **Large, not broken.** 31 cards over 4 columns since it absorbed Stats (#236). Shortening it is a product call |
| `pullups` | 1.9 · 5.6 | Not looked at. Already 3 columns, so this is volume |
| `mindset` | 4.8 · 4.8 | **By design.** Full-width bands divided by 2px rules, then a searchable principle library — the length *is* the library, and it has search and filter |
| `nofap` | 1.8 · 4.7 | Not looked at. 3 columns already |
| `pickleball` | 4.1 · 5.0 → **3.5 · 4.7** | Fixed |
| `gym` | 1.2 · 4.7 → **1.9 · 3.7** | Fixed |

### Pickleball — a component that stacked

`components/pickleball/Section` laid its children out `flex-col`, so thirteen
analytics cards each spanned 1,180px to hold about 180px. It was also a
near-duplicate of `CollapsibleSection` (the view's own comment said so) without
`stickyKey`, so its fold state did not survive a reload. Deleting it was the
layout fix and the bug fix at once.

Then: "At a glance" moved from the **last** card to the first; Competition &
rating gathered the occasional logging out of the daily loop; two groups
answering one question became one; three subtitles that listed the cards
underneath them went.

The log form is now tap-to-log — `ChipPick`/`Stepper`, with Partner and Location
chips read from `partnerStats`/`venueStats` **sorted by how often you play**, so
they are your real partners and courts. Verified end to end: a session logs with
**zero keystrokes**. It cost 0.4 screens, bought back with `SPAN_2` and a
`DisclosureRow` around the half you fill less than half the time.

### Gym — eight folds, every one shut

Every `QuietSection` passed `defaultOpen={false}`, so the page measured **1.2
screens shipped against 4.7 opened**: nearly everything was behind one of eight
identical grey bars, with no clue which held your squat PR. Eight groups are now
three, merged by the question each answers, and the payoff group opens.

**The first attempt packed nothing**, and the tool caught it. `MasonryGrid`
breaks on its *container* (`@3xl` = 768px) and Gym's review zone is **722px** —
46px short, so all three groups resolved to one column. `CardGrid` breaks on the
viewport, which is the right question when the column width is decided by the
page split. This is the second page that trap has bitten; it is in `CLAUDE.md`.

## Next, in the order I would take it

1. `pullups` (5.6) and `nofap` (4.7) are unexamined — run `npm run space` and
   the `space-audit` skill on them.
2. `insights` at 6.8 desktop / **11.9 phone** is the largest page in the app.
   Shortening it means cutting cards, which is a product decision.
3. `NoFap.logUrge` still has no guard beyond a 3s double-tap window.
4. Focus has 6 typed-number fields, Goals 3 — the `quickpick` conversion that
   Pickleball just had.
5. **COD-208**: a crash inside the a11y gate's `scan()` escapes and the summary
   table never prints, so a reader cannot tell whether it checked nothing or
   everything.

## Traps worth the next session's time

- **Do not run `npm run build` while `npm run a11y` is running.** The preview
  server serves the half-written `dist` and the gate reports
  `[Plan] rendered 0 characters — the view did not load`, which looks exactly
  like a real regression. Cost one confused re-run this session.
- **A number over budget is a question, not a verdict.** Four of the eight pages
  over three screens are deliberately that long, and two of them say so in the
  file with the measurements that decided it. Read the view before "fixing" it.
- **`git stash push -- <path>` fails on a path you have `git rm`'d** — the
  pathspec matches nothing git knows about. Copy the file aside and
  `git checkout HEAD --` instead.
- **A generated doc with no gate is a stale doc.** `docs/FEATURE-REFERENCE.md`
  still described Tracking and Stats, both retired. `npm run manual &&
  git diff --exit-code` in CI would close it.
- **`MasonryGrid` is a container query**, and 722 < 768. Twice now.
