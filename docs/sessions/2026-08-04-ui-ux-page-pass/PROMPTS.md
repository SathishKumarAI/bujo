# The prompts

One per fix, written **before** the code, in the order they were run. Each is
self-contained: a reader who has never seen this session should be able to run
it against a clean checkout and land the same diff.

The format is fixed on purpose — *observe · diagnose · change · check*. The
value is in step 2. If you cannot write the diagnosis without opening the file
again, you have not finished looking.

---

## P-01 · Fitness: the deep-linked activity fights the stored mode

**Observed.** Open `http://localhost:5174/?view=fitness&activity=run` with any
prior visit to the Sport mode in this browser profile. The mode toggle reads
`Sport`, the header reads "Log a game", but a Distance field is present, the
third stat is "Best pace", and the companion link says Coaching. The activity
`<select>` displays `Pickleball`.

**Diagnosed.** `Fitness.tsx` computes `initialActivity` from the URL, then
passes `modeOf(initialActivity)` as the *default* of
`useStickyState('fitness.mode', …)`. A sticky state reads its store first, so
that default is dead the moment a mode has ever been chosen. The `draft`, being
plain `useState`, does take the linked activity — hence the split. The select is
then a controlled element whose `value` is not among its `<option>`s, which a
browser renders as the first option. So the form displays Pickleball, holds
`run`, and `workoutOf(draft, unit)` would write `run`.

**Change.**
1. In `src/views/Fitness.tsx`, replace the single `mode` state with three lines:
   `const [stickyMode, setStickyMode] = useStickyState<Mode>('fitness.mode', 'cardio', MODES)`,
   `const [linkMode, setLinkMode] = useState<Mode | null>(initialActivity ? modeOf(initialActivity) : null)`,
   `const mode = linkMode ?? stickyMode`.
2. In `switchMode`, call `setLinkMode(null)` before `setStickyMode(next)` — a
   hand-picked mode must beat a stale URL, or the toggle stops working while the
   query string is still on screen.
3. Leave the `draft` initialiser alone. It was already right.
4. Comment *why* — the next reader's instinct is to "simplify" it back to one
   sticky state with a computed default, which is the bug.

**Check.** `npx tsc -b`. Then load `?view=fitness&activity=run` and confirm four
things agree: toggle on Cardio, select on Run, header "Log a cardio session",
history listing cardio sessions. Then click Sport by hand and confirm the toggle
moves (proves step 2).

---

## P-02 · The name is the only thing allowed to shrink

**Observed.** Four pages clip the text that identifies the thing on screen:
Stats renders a card titled `M…`, Insights `Best & worst d…` and `Weekday vs
w…`, Stats also `Workout mi…`; Trackers renders habit rows as `W.`, `Vi…`, and
one row with no name at all.

**Diagnosed.** One shape, three call sites. A flex row where the secondary
content is `shrink-0` and the name is the only `min-w-0 truncate` child. Flexbox
resolves the deficit entirely against whatever *can* shrink, so the name absorbs
100% of it and truncates to nothing while the badges and controls keep full
width. The priority is exactly inverted: the name is the one thing the row
cannot do without.

**Change.**
1. `src/components/ui.tsx`, `Card` header: add `flex-wrap` and split the gap
   (`gap-x-3 gap-y-2`). Give the title column `grow basis-48` so it holds ~12rem
   before anything wraps; below that the right cluster drops to its own line.
2. Same file: drop `truncate` from the `<h2>`, add `text-balance`. These titles
   are two to four words — a second line is cheaper than an ellipsis.
3. `src/views/Trackers.tsx`, the sticky name cell: add `flex-wrap`, widen the
   desktop cap `sm:max-w-[220px]` → `sm:max-w-[260px]`.
4. Same file: the habit-name button `min-w-0 truncate` → `max-w-[10rem]
   shrink-0 truncate`. Now the badges wrap under the name instead of starving it.

**Check.** `npx tsc -b`, then screenshot Stats, Insights and Trackers at 1440.
Read every card title and every habit name in full. Confirm no row lost its day
cells to the widened column.

---

## P-03 · Goal tiles do not share a baseline

**Observed.** On Plan · Goals, "Active minutes" wraps its label to two lines and
its progress bar sits ~23px below the bars of the two tiles beside it. The row
reads as two rows.

**Diagnosed.** The tiles are grid items, so the `<li>` is stretched to the row
height — but the `<button>` inside is `w-full` only, so it collapses to its
content and the bar lands wherever the label left it.

**Change.** In `src/views/Goals.tsx`: the button becomes `flex h-full w-full
flex-col`, the bar gets `mt-auto`, the icon `shrink-0`, the value `shrink-0`.
Do **not** add `truncate` to the detail text — `mt-auto` already holds the
baseline, so wrapping is free and "this w…" would be a new defect for an old one.

**Check.** Screenshot Plan · Goals. All three bars in a row on one y.

---

## P-04 · A five-star rating that looks like no rating

**Observed.** Reading · Finished · "Atomic Habits" carries `rating: 5`, the page
header says "5.0★ Avg rating", and the book's own star row draws five hollow
outline stars — pixel-identical to an unrated book.

**Diagnosed.** The rated branch is `className="fill-yellow text-yellow"` on
`<AppIcon as={Star} />`. `--color-yellow` exists, so the utility is real and the
computed `fill` *is* yellow — but the glyph is Phosphor's regular Star, an
outline ring, and filling a ring colours the ring. `Icon`'s own doc states the
rule: "`bold` and `fill` are not used in this app at all… weight, not colour,
signals state." The rated state was written against a weight the icon set does
not ship.

Two more defects in the same four lines: no `aria-pressed`, so a screen reader
cannot hear the current rating at all; and `aria-label={`Rate ${n} stars`}`
says "Rate 1 stars".

**Change.** In `src/views/Reading.tsx`: `active={n <= (book.rating ?? 0)}` for
the duotone weight, keep `text-yellow` for hue, drop `fill-yellow`. Add
`aria-pressed`, pluralise the label, and wrap the glyph in a `grid size-6
place-items-center` so the target is 24px rather than a bare 16px glyph.

**Check.** Screenshot the Finished shelf: five visibly solid yellow stars.
`npm run a11y` for the label change.

---

## P-05 · The week strip still cannot draw a week

**Observed.** Today · Morning, "Today's plan": seven bars of visibly identical
height. The aria tree has nothing to read.

**Diagnosed.** The previous pass made height the primary encoding — correct —
but left the track at `h-8`. A lived-in journal's daily coverage sits between
70% and 100%, so the entire realistic range maps to 9px, and demo data lands at
81/85/89/81/81/81/85. Height is the right encoding and it is out of resolution.
Separately the strip is `div`s with a `title` attribute: no role, no name, so
assistive tech gets nothing.

**Change.** In `src/components/TodayPlanCard.tsx`: track `h-8` → `h-10`; print
the integer percent under each bar in `text-micro tabular-nums`; give the strip
`role="img"` and an `aria-label` naming each weekday and its percentage.

Do not normalise the bars to the week's own min/max to manufacture contrast —
that makes an 81% week and a 20% week draw the same chart, which is a worse lie
than the one being fixed.

**Check.** Screenshot Today · Morning; read seven distinct numbers. Query the
strip's `aria-label` in the console and confirm it names all seven days.

---

## P-06 · The fixture only exercises one habit shape

**Observed.** `Object.keys` over the demo journal's habits: eight habits, every
one `type: 'check'`, none `avoid`.

**Diagnosed.** The app renders habits four ways — check, avoid, count, timer —
and demo data reaches exactly one of them. This is why the previous pass had to
hand-add two habits before it could see the Evening close-out striking a *slip*
through with a ✓. A fixture that exercises one path does not disagree with the
code; it agrees with it, which is the failure mode of a fixture.

**Change.** In `src/lib/demo.ts`, after the time-of-day assignment: append
Doomscrolling (`avoid`), Water (`count`, target 8, floor 4, unit glasses) and
Meditation (`timer`, target 15, floor 5, unit min), all backdated to the same
`HIST_DAYS` start. Then write logs of the correct *shape*:
- the avoid habit is mostly **absent** from `habitLog` — present means slipped —
  with a slip probability that decays over the run so streak and comeback chips
  have something real to describe;
- count and timer habits write to `habitValues`, not `habitLog`.

Leave `seedJournal` alone: a new user's starter journal is a product decision.

**Check.** Re-seed via Settings → Data → Load demo data (**it is persisted, not
regenerated** — editing the file changes nothing for an existing journal, and
the button is behind a confirm dialog). Then Today · Evening shows
"Doomscrolling · clean" with no strike-through and the footer reconciles as
"5 of 8 done. 1 to avoid, tracked separately."; Trackers shows a count stepper
and a timer chip.

---

## P-07 · Three small ones, batched

**Birthdays list the same person twice.** `Collections.tsx` concatenates
`data.birthdays` and friend birthdays with no dedupe, so anyone in both appears
twice on one day. Dedupe on `name|month|day`, friend record first so it wins —
it is the one the row links to.

**A strict challenge shows three day counts.** "Day 5 of 75" (`progressDay` =
current run), "7 of 75 days done" (`completedDays`) and "Elapsed 9/75"
(`elapsedDay`). All three are correct and the library documents why. The card
does not. Append "· since last reset" for strict challenges and add a `title`.
Do not "fix" the numbers.

**Two folds still default closed.** Collections' Auto-pages is a *controlled*
`QuietSection` holding its own `useState(false)`; Challenges' Calendar is a
hand-rolled caret button, not one of the three collapse primitives. Both were
missed by the sweep that opened eighteen others — the same trap, third time: an
audit keyed on how something is written cannot see what is written another way.
Set both to `true` and say in the comment why each was missed.
