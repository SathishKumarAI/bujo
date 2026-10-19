# STATUS

**Stopped:** 2026-10-18, on `fix/cycle-month-calendar`, **one PR open** —
COD-357, four commits, every gate run and green.

## Where it stands

The report was about the Cycle act column, pasted back verbatim: *"these are
looking quite bad… it's looking like a mere pair made by an undergrad… I want
you to make this into a production engineer UI, UX, as well as the backend."*
Measured first, at 1440 on `?demo=1`, and there were two separate faults under
one complaint — one visible, one not.

**The visible one.** The month list drew 31 rows of which **13 were days that
had not happened**, each carrying an invented cycle day (`19 d21` … `31 d33`,
counted forward past the next period the same page estimates on Oct 28), and
each pressable. It was 549px of a 1208px card inside a `.zone-act` capped at
868px, so the act column had its own 340px scroll. Replaced with a calendar:
**236px**, card **938px**, the 13 future days drawn, dated, dashed and not
buttons at all.

**The one nobody could see.** `detectOvulation`'s docstring asked for entries
"in date order" and `views/Cycle.tsx:194` handed it `data.cycle` as stored —
while `setCycle` **appends**, so correcting a day you logged earlier puts the
log permanently in *edit* order. Out of order, `entries[0].date` stops being
day 1 and the 6-before/3-after scan reads temperatures in insertion order.
Measured on a clean cycle with one day moved to the back: ovulation **Sep 6 →
Sep 7**, with `day` still reading 6 because it is measured from the bad origin
and cannot report it. That feeds `alignedCycles` → `patternGrid`, i.e. the
whole Patterns group.

**Then the calendar moved again, on a second report.** *"What is the use of
that staying in this low place? If I click on it I need to scroll up and again
make the changes. Move it to the side of Your log."* Correct: it was the last
thing in the act column and a tap set a value read by a form ~900px above it.
It is beside `DayLog` now, both halves sharing one `pickDay`, so a tap opens
`DayWindow` — a dialog. The act card went **938px → 667px** and stopped
scrolling inside a scrolling page at every width.

**And the chips were measured rather than restyled.** *"Could you please
modernize this?"* against the optional-fields panel. The untoned resting chip
had a **1.02–1.64** border and a **1.11–1.36** fill against its card across
five themes — a control with neither a visible edge nor a visible fill, on
every logging form in the app. `REST_TONE.brand` held the right idea and was
**dead**: the ternary beside it hardcoded the same string, so editing the map
changed the emitted CSS and not one pixel.

| commit | what |
|---|---|
| `aeabef3` | `detectOvulation` sorts; `setCycle` keeps the log in date order; `avgCycleLength` ignores period starts after today |
| `004910c` | `CycleMonth` replaces `MonthList`; the cycle day moves into the editor header; the phone fold goes |
| `9d4985b` | the calendar moves beside `Your log`; `DayWindow` stops naming the day twice |
| (this one) | the resting chip gets a boundary (2.51–3.20); the group legend stops outweighing its own controls |

## The next action

Push is done, PR is open. Nothing is half-built. Known and unbuilt:

1. **COD-364 · `--ctl-ring` is 1.37–1.72 against the card**, so every input,
   select and search field still has the invisible edge the chip just lost.
   Same defect, second primitive — left because that token is ALSO the
   hairline inside `--shadow-raise`, so raising it changes the edge of every
   raised surface in the app. Visible today on any form that mixes the two:
   Cycle's day editor, Pull-ups' log row.
2. **COD-360 · `intimacy` is write-only.** Found auditing the optional day
   fields: every other one has an aggregator (mucus/LH feed `detectOvulation`,
   symptoms/cravings/moodTags feed `patternGrid`, cravings feed
   `cycleFeelings`), and `intimacy` has exactly one reader — `DayLog`'s row.
   On the `conceive` goal that is the question the page exists to answer, and
   `FertileWindow` and the log never meet. Filed, not built: it is a new card,
   not a correction.
3. **The optional panel is 2,187px open inside an 868px sticky column.** The
   calendar move and the legend trim took it from 2,499; what is left is ten
   `ChipPick` groups — 53 controls offered on every day — and no amount of
   restyling changes that. The structural answer, if it is wanted, is the one
   the calendar just took: the slow path belongs in `DayWindow`, which is a
   dialog built for a long form, leaving the act column the fast path it is
   named for. Not done without asking, because it changes a gesture.
4. Everything carried in from the previous session's list is unchanged:
   `docs/QUESTIONS.md`, a seeded journal per `nextStep` branch, Home Workout's
   bare `useState` act, COD-247 for Recovery, Challenges' day panel.

## What this session found that nobody reported

- **The unsorted log.** Nothing in the type, the tests or any gate could see
  it; `analyseCycles` sorted and the sibling call site did not, so one of the
  two callers of the detection engine was right and the other was wrong, with
  identical-looking code.
- **`avgCycleLength` was the one derivation that did not filter to today**,
  while `cycleDay` and `nextPeriodEstimate` beside it both did. The month list
  was the affordance that made it reachable.
- **A test keyed to copy, again.** `Cycle.test.tsx` asserted the literal
  "Marks in the day list" and broke on the rename the calendar forced. It
  asserts a glyph from `MUCUS_GLYPH` now — what the key is *for*, which cannot
  be reworded.

## Standing traps this session paid for again

- **`git checkout <file>` wiped the fix while reverting a canary** — exactly
  the entry the last session left here, hit again within the hour. Copy the
  file to `/tmp` first; `cp /tmp/x.bak back` is the undo, `git checkout` is
  not.
- **A throwaway probe must live in the repo root, not the scratchpad.** ESM
  resolves `playwright` relative to the script, so a probe in the scratchpad
  dies on `ERR_MODULE_NOT_FOUND` before doing anything. Three were written and
  all three are deleted.
- **A Windows path inside a Playwright `screenshot()` call must be
  `C:/…`**, not the `/c/…` the Bash tool uses — the first run wrote nothing
  and reported no error.

## Environment

The preview on **4173 belongs to this worktree** (checked against
`Get-CimInstance Win32_Process`, and the served `assets/index-*.js` matched
`dist/index.html` before every measurement quoted above). 4299 is another
worktree's — every worktree here serves an identical `<title>`, so the bundle
hash is the only honest check.

```
npx vite preview --port 4173 --strictPort &
BUJO_URL=http://localhost:4173 node scripts/a11y-panels.mjs
```

`playwright` and `@axe-core/playwright` are installed on this machine but are
still not in `package.json` (COD-273).

Gates run against the pushed build, all green: `verify` (2189 tests), `design`
(500 files), `contrast` (5 themes), `a11y` **187/187 scans, no serious or
critical**, `clipped` at 1440/1024/390, `smoke` 23/23, `space cycle` 1.6
desktop / 2.3 phone, and `a11y:panels` **ALL CLEAN across every panel**
(133 rows, including all seven `cycle/` rail groups). `a11y:panels` is
**minutes** and not in CI — start it in
the background and keep working, and do not `vite build` while it runs.
