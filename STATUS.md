# STATUS

**Stopped:** 2026-09-21, on `main`, clean. Three PRs merged this session:
**#234** Settings & Account layout + motion; **#235** one habit-scheduling
rule; **#236** Insights absorbs Stats. Plane: COD-199, COD-200, COD-201 done.
**COD-202 open and it is the one that matters — see "The gate is off".**

## What shipped

### #234 · COD-200 · Settings & Account

**A text collision on a phone.** `tabsListVariants` sets
`group-data-[orientation=horizontal]/tabs:h-9`; the call site passed a bare
`h-auto`, and tailwind-merge does not treat those as the same utility, so both
shipped and the variant won. Five pills wrapped to three rows at 390px inside a
36px box and the overflow drew **on top of** the panel — "Data" over the
"Profile" card heading, on the live build.

**Neither rendering gate can see an overlap.** `clipped-text.mjs` asks whether
an element shows less than it holds (every pill showed all its text); `a11y`
asks whether the tree is sound (it was). Worth remembering next time something
"cannot have regressed, the gates are green".

Also: three tabs capped content at `max-w-2xl` inside the wide tier (~500px
dead beside every control) while Sync and Data had no cap at all (a 1,160px
passphrase field); four `Disclosure`s shipped **open** despite comments saying
"collapsed to cut option overload"; Data's `auto-rows-fr` stretched Tags to
match a 1,300px neighbour; "Journal summary" drew its heading twice, 40px
apart, differing in one capital T.

Measured, built bundle, full page: Appearance 1341→1076, Sync 1932→**624**,
Data 3062→**1112**.

**The motion system was landing on nothing.** `.page-enter > *` selects DIRECT
children and sat on the page shell, which has exactly one — so every contract
page rose as a single block and the 45ms ladder never ran once. Moved onto
`.page-zones`, `.zone-review` and both grids in `CardGrid.tsx`. Account went
from 1 staggered child to 4. A band's hover is now its closing hairline
(`line` → `line-strong`), not a shadow: a shadow re-boxes the card the band
variant exists to un-box.

### #235 · COD-199 · one answer to "what is due today"

`isScheduledOn` was always the definition — `day >= startedOn` AND the weekday
is active. **Seven call sites re-typed the weekday half and dropped
`startedOn`.** `lib/penalties.missesFor` was one of them, so a habit scheduled
to begin next month **earned you make-up drills for missing it**.

Nothing failed, because two hand-written filters that agree with *each other*
read as correct. `Trackers.tsx` said so in a comment — "same filter TodayStrip
applies, so the header count and the chips agree" — true of each other, false
of the `trackerSummary` call one line above, rendered as "today done N%" sixty
pixels higher on the same page.

**A slip counted as a completion.** `habitDoneOn` is true for an *avoid* habit
when you logged it, which means you slipped; Trackers' header ran over every
habit, so slipping on "no doomscroll" pushed "done" **up**.

`lib/schedule.ts` is a new leaf module owning `isScheduledOn` and
`habitsDueOn`. It is below `habitStats` **because it has to be**: `habitStats`
imports `stats`, so the moment `stats.ts` needed the rule there was nowhere
else to put it without closing an import cycle.

**Grep found thirteen matches and six were already correct.** `CategoryRows`
names a local `scheduled` that genuinely means only the weekday half (it pairs
it with a separate `before = d < h.startedOn`); `coverage.ts` and
`stats.dayCompletion` spell `startedOn` on the line above the one grep matched.
All three left alone. This is the "two things with the same name" trap in
`CLAUDE.md`, live.

`schedule.test.ts` is named for symptoms, not functions, and **was verified to
fail on the old behaviour** — reverting `penalties.ts` alone turns exactly one
test red.

### #236 · COD-201 · Insights absorbs Stats

The page called Insights rendered **zero charts**. Every plot in the app was on
the Stats tab behind seven `defaultOpen={false}` folds. ~20 analytics surfaces,
none reachable without already knowing where to click.

One page now. Six domain chips with live counts, a search matching a card's
*measure* as well as its title, a sort on journal results. Four new charts:
correlation matrix, journal volume, habit consistency, task completion trend.

`views/Stats.tsx` was **`git mv`d, not retyped**, and the proof is a
rendered-output diff of the built bundle with every fold forced open: headings
6+27→37, recharts surfaces 0+6→8, **chart `aria-label`s lost 0**, text lines
lost 7 (all accounted for). That diff earned its keep twice — it caught a
five-fact `StatBar`, and **`StatBar` slices to four while warning only in
DEV**, so the fifth vanished from a production build with nothing on screen to
say so.

`?view=stats` aliases to `insights`, so bookmarks, deep links and guide buttons
still land.

## The gate is off — COD-202

**`npm run a11y` aborts at the second entry of its VIEWS list**, in CI and
locally:

```
[Plan] no rail row with that name — the gate could not reach it.
```

Today (entry 1) passes first, so the harness works; it is the **Plan rail row**
it cannot find. CI runs 35547262905 and 35547265269, ~9 minutes each, exit 1.

**This is not the failure the old STATUS.md recorded.** COD-197 describes an
abort inside `scanReceipt()` *before* the view walk. This one is inside it.
Either COD-197 is intermittent and this is the next failure behind it, or there
are two. Do not delete the entry to make it pass — the file's own error message
says so, and its header says a page not on the list is not checked.

**What it costs, concretely:** the new correlation matrix shipped at **1.71:1
on vscode, 1.85 mocha, 1.88 neon, 2.95 dawn, 4.11 latte** — every number in it
under the floor in all five themes — and was caught only because I wrote a
throwaway five-theme probe by hand. A green a11y gate would have caught it in
seconds. While this is red, every view's contrast ships unmeasured.

## Traps learned this session

- **A measurement that cannot vary is not a measurement.** The first contrast
  probe printed identical numbers for all five themes, because it wrote the
  theme to `localStorage['bujo']` and the real key is `bujo:data`. It then
  reported a fake **1.30:1** for latte, because it read
  `color(srgb 0.80 0.43 0.40)` channels as 0–255. Two bugs in the instrument
  before one in the subject. Assert the thing you changed actually changed —
  the loop now checks `documentElement.dataset.theme` and skips the theme if it
  did not take.
- **`color-mix()` costs you `onAccent`.** It computes to `color(srgb …)`, which
  the repo's colour helpers do not parse — so a fill built that way cannot ask
  for its own readable foreground. `over()` already composites a wash and
  returns hex; that is why `Stats`' `moodColor` returns hex, and its comment
  says so.
- **One foreground for N backgrounds is a decision made once and wrong most of
  the time.** Same shape as the `cat('crust')` trap already in `CLAUDE.md`,
  reached from a new direction.

## Next action

COD-202. Open `scripts/a11y-axe.mjs`, find what it clicks to reach a section,
and compare against `SECTIONS` — navigation moved twice recently (#231 put
Today's surface tabs in the header's second row, and other comments refer to
"when the sidebar was deleted"). The likely answer is that the gate is looking
for a door that was removed. **Fix the gate, not the list.**
