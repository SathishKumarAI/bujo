# Reusable patterns — what Pull-ups, Home Workout, Coaching and Pickleball built that other pages can take

> **This file is in two halves and they arrive on two branches.** PR #405 adds
> **§1–6**, out of the Pull-ups and Home Workout pass: the shared panel card,
> one bar per review zone, draw-short/announce-long chips, the record editor,
> links built from a name, and the capped list. This file, on
> `feat/coaching-pass`, adds **§7–14** out of the Coaching pass. Whichever
> merges second will conflict here, and the resolution is concatenation —
> nothing in either half contradicts the other, and the numbering is already
> allocated so the two slot together without renumbering.
>
> §1–6 are about *where a thing goes*. §7–14 are about *how it behaves, how it
> moves, and how you keep its content honest*. §15–22 came out of the
> Pickleball pass (COD-328) and are about *what a page says, and how it
> scales*: the sentence at the top, sub-sections, the grid that answers to its
> column, the act you can put away, and the way back from a figure to the rows
> behind it.

Every one of these was written twice before it was written once. This file is
so the third page does not write them a third time. Each entry says what it is,
where it lives, when to reach for it, and the measurement that decided its
shape.

Companion to `PAGE-SHAPE.md` (where a thing goes) and `DESIGN.md` (what it
looks like). This is *which component already does it*.

---

## 7 · Progress as the shape of the list — the spine

**What it is.** A list whose rows sit beside a rail: a node per row, a line
joining them, filled behind where you are and quiet ahead of it. Two adopters
already — `views/Coaching.tsx`'s twelve-week roadmap, and the skill ladder in
the same file's manual.

**Reach for it** when a list is an ORDERED journey and the person is somewhere
in it: a programme, a ladder, a course, a protocol. Not for a catalogue — a
spine down a list of 83 movements says nothing, because there is no "where you
are" to mark.

**Why it beats a progress bar.** The roadmap had a 2.5px bar floating above
twelve identical bordered boxes. The bar is a *second* thing to read, and the
twelve rows carry no trace of it. With a spine there is one thing: the list IS
the progress. Reported before as pale and dead; the page did not get more
colour, it got a structure that uses the colour it already had.

**The rules that keep it true:**

| Rule | Why |
|---|---|
| Three node states only — **done**, **here**, **ahead** | Four is a legend. Green / mauve / surface, which is the page's whole palette |
| The connector takes the colour of the row ABOVE it | So the fill reads as flowing down from where you started, not up from where you are |
| The node is the toggle where one exists | The roadmap's node is the done-tick; the ladder's is a marker. Do not add a second control beside it |
| `-mb-*` the list gap on the connector | Otherwise the spine is dashed by the space between rows and reads as twelve separate rails |
| One spine per page | Two is two ideas. Coaching has a roadmap spine and a ladder spine and they are in different sections, never on screen together |

**And the "here" marker needs data, or it needs to say so.** The ladder marks
your rung from `settings.duprLog` and prints a line naming where to log a
rating when there is none — an unmarked ladder with no explanation reads as
broken rather than as empty.

---

## 8 · Hover reveals, click pins — `views/Coaching.tsx`

**What it is.** Pointing at a disclosure opens it; moving away closes it;
clicking pins it so it survives the pointer leaving. The caret reports
**pinned**, not open — open is what the pointer is already telling you.

**Reach for it** on a long list of reference rows somebody is scanning:
fourteen shots, eight drill groups. Not on anything that holds a control — a
body that can vanish under the pointer is a body you cannot click into.

**Do it with state, not `group-hover`.** The shorter diff is a `0fr → 1fr`
grid row revealed by `group-hover`, and it is wrong: it keeps all fourteen
bodies in the DOM at zero height, so `aria-expanded="false"` becomes a lie and
a screen reader reads every one of them regardless of state. Hover state the
ARIA attribute agrees with is worth the extra handler.

**Three details that are not optional:**

- `onFocus`/`onBlur` beside the mouse handlers, so a keyboard gets the reveal.
- The handlers go on the ROW, not the button — moving the pointer down into the
  body must not close it under you.
- Tailwind's `hover:` already carries `@media (hover: hover)`, so a touch
  device never gets a sticky phantom hover.

---

## 9 · The act as a sticky aside, and shutting it gives the WIDTH back

**What it is.** The thing you fill in lives in a narrow sticky column beside
the long thing you read, and one control removes the column entirely.

**Reach for it** when a page's act is short and its reference is long — a
record beside a twelve-week programme, a log beside a catalogue.

**Measured.** Coaching's week record sat under twelve weeks with the start
date and Reset under that: the page's only text field was past the whole
programme. As an aside it is on screen from the moment you arrive.

**The two mistakes to avoid, both made here first:**

1. **`hidden` on the aside leaves the track.** The 19rem column stays and the
   list sits narrow beside a gap. Change the `grid-cols` instead — measured,
   roadmap **790px → 1110px** when the panel shuts.
2. **A container query against a missing container never matches, silently.**
   `PageLayout` declares no `@container/page`, so `@3xl/page:grid-cols-…`
   simply did not apply and the aside rendered 1110px wide — full width, no
   error anywhere. Declare the container on a WRAPPER; an element cannot query
   itself.

**Order the DOM for the phone, place the grid for the desktop.** The aside
comes first in the DOM so a phone and a screen reader meet the act before the
catalogue; `col-start-2 row-start-1` puts it on the right at width. `order-*`
would do neither honestly.

**And the toggle lives outside the thing it toggles** — a control inside the
panel it hides cannot bring the panel back.

---

## 10 · Motion that cannot lie to the contrast gate

**The rule: animate `transform`, never `opacity`, on anything holding text.**

`npm run a11y` reads colour from the rendered page. An element parked part-way
through an opacity ramp reports an arithmetically perfect contrast failure
describing a pairing that exists nowhere in the app — it cost three separate
investigations in one day, one of which changed a colour token and reverted it.
A translate cannot change a computed colour, so the gate has nothing to
misread rather than something wrong.

**What exists now**, all in `src/index.css`, all off under
`prefers-reduced-motion`:

| Class | Does | Tie it to |
|---|---|---|
| `.settle-in` | Rows rise 7px, staggered by `--i` | A list mounting |
| `.node-pop` | One node scales to 1.22 and back | The thing you just toggled — and ONLY that one |
| `.now-ring` | One expanding ring, once | Arrival at the current item |
| `.bar-grow` | A fill scales from zero | A bar stating a measurement |
| `.scroll-settle` | Rows settle as they scroll in | A long reference list |

**Two rules about when, not how:**

- **Tie motion to a state change, not to the page existing.** `.node-pop` is
  applied to the one node just ticked and cleared on `animationend`, so a
  journal that loads with four weeks done does not pop four times on arrival.
- **Once, never forever.** `.now-ring` is an arrival, not a heartbeat. An
  infinite pulse is noise you learn to stop seeing and it never stops
  repainting.

`.scroll-settle` uses `animation-timeline: view()` — no JS, no observer, no
library. The resting state is the VISIBLE one and `@supports` guards the only
rule that moves anything, so a browser without it renders the list unchanged.
It needs `animation-fill-mode: both` (a scroll-driven animation only runs
inside its range) and therefore the `/* fill-both-ok */` marker the design gate
asks for.

---

## 11 · One warning per surface — and a badge when it is not about bodies

**What it is.** A surface carries exactly one disclaimer, and its weight
matches its subject.

**Measured as a complaint:** the short line sat above every panel AND the
safety chapter opened with the long points under it, so two sections nagged
twice. Then the single line itself was still a full row of furniture on the six
sections that are coaching rather than medicine.

**The shape that stuck:**

| Surface | Form |
|---|---|
| Makes claims about bodies | The full points, full width, in the content |
| Everything else | A badge at the end of the section bar: icon + two words |

**The badge is shortened in what it DRAWS only** — the full sentence is its
`title` and an `sr-only` span. That is `USER-CONTROL.md` rule 4: a shortened
label is a shortened name unless it is said somewhere. **A claim about bodies
does not get to be a badge.**

---

## 12 · Reference content has a scenario shape

**What it is.** Four field sets that turned a reference page from true-and-
unusable into something you can act on. They are worth copying verbatim because
each one answers a question the obvious field does not.

| Shape | Fields | The question the obvious field missed |
|---|---|---|
| An injury / failure mode | `where` · `mechanism` · `now` · `prevent` · `redFlags` | "Protect the ankles" never says WHEN it happens, and the moment is the part you can train |
| A technique | `what` · **`when`** · `how` · `cues` · `mistakes` | `what` and `how` never say which shot to choose, which is the decision people get wrong |
| A principle | `why` · **`when`** · **`do`** | A principle with no scenario is a poster. "Stay calm" is not a move |
| A level / rung | `skills` · **`youAreHere`** · **`unlock`** | A band is a number; the symptoms are how anybody places themselves. And ONE unlock, because a list is why people plateau working on six |

**Keep a per-group "what this fixes" line on the CLOSED row.** A list of drill
names cannot tell you which group your problem is in, which is the only
question somebody arrives with.

**And gate the content, because `tsc` cannot.** A type proves a field exists and
is a string, never that the string says anything, and an empty one renders as a
silent gap. `src/lib/pickleballAcademy.test.ts` is the pattern: point count,
a per-point length floor, no field that is a copy of the field beside it, and a
lookup table checked in BOTH directions — a missing key renders nothing, an
extra key is a rename that happened in one place.

---

## 13 · A dated tick log that survives two devices — `lib/practiceLog.ts`

**What it is.** "Did you do this?" as a key → list of ISO days, with
`practiceKey` / `togglePractice` / `practiceStat` / `practisedInRange`.

**Reach for it** for any yes/no a person answers repeatedly about the same
named thing: a drill, a stretch, a chapter, a habit that does not deserve the
habit machinery.

**Days, not a count.** A counter answers "how many" and nothing else; a list of
days answers that, plus when you last did it, plus whether it was this week —
and it is the only shape that can MERGE. Two devices each holding a count can
only disagree.

**The merge is the part that is easy to get wrong.** `conflict.ts`'s `fillMap`
is a shallow merge: on a key collision the winner's value replaces the loser's.
Correct for a note, silent data loss for a dated log. Use `unionListMap`, which
unions per key — and add the field to the "delete if BOTH sides lacked it" loop
so a merge cannot invent an empty map.

**Two display rules.** A tick is a toggle, not a `+1` (the first thing anybody
does with a new control is press it to see what it does), and it states its
history rather than only its state: `3× · Tue, Oct 6` beside an empty box is
the difference between "never done" and "done, just not today".

---

## 14 · Points, not paragraphs

The rule and its reasoning now live in `CLAUDE.md` under **Writing content the
UI renders**, because it applies to every page rather than to a component. The
one-line version: a field somebody reads is `string[]` the moment it holds more
than one idea, and the test asserts a per-point length floor so a point cannot
be a fragment left over from splitting a sentence on its full stops.
# Reusable patterns — what Pull-ups and Home Workout built that other pages can take

Six things exist now that did not before, and every one of them was written
twice before it was written once. This file is so the third page does not write
them a third time. Each entry says what it is, where it lives, when to reach for
it, and the measurement that decided its shape.

Companion to `PAGE-SHAPE.md` (where a thing goes) and `DESIGN.md` (what it looks
like). This is *which component already does it*.

---

## 1 · The panel card — `components/page/Panel.tsx`

`PanelGrid`, `PanelCard`, `DefList`, `Tag`.

**What it is.** A named item, an optional figure beside the name, and a short
body, in a two-column grid that breaks on its **container** (`@lg/page` = 512px)
rather than the viewport.

**Reach for it** whenever a panel holds a list of named things: form cues,
principles, equipment, session formats, logged sessions.

**Why container and not viewport:** a review column is 678px while the window is
1440, so `CardGrid`'s viewport steps would put three 210px columns in it, and
`MasonryGrid` breaks at 768px and would do nothing at all. Both failures are
recorded in `CLAUDE.md`, from opposite sides.

**The limit, measured.** A card earns its border by having a body. Putting the
31 entries of `HOME_SOURCES` on `PanelCard` measured **5.44 desktop screens and
10.95 on a phone**, against **2.50 / 4.72** for the plain list they replaced —
more than twice the page for the same facts, because a source is a link and a
publisher and has nothing to put inside the box. Two columns of two-line rows
landed at **1.93 / 4.56**, better than either. *A row for a named item with no
body; a card for one with.*

---

## 2 · One bar per review zone — `SectionRail` with `railAt="never"`

**What it is.** A horizontal strip of panel names above the panel, one panel
shown at a time. Pull-ups has eight rows; Home Workout has five.

**Reach for it** when a review zone has grown past about four peer sections.

**The rule that keeps it true:** *a review zone has one navigation in it.* A new
section beside a rail is a new rail row, or it belongs on another page. Home
Workout had three peer sections stacked above a Manual carrying **its own
twelve-row rail** — two tables of contents on one page — and the page shipped at
2.34 desktop screens, which is to say **no pixel count could see the fault**.
One bar took it to 1.10.

**Row count is the constraint.** Fourteen chips is the 1085px strip in a 730px
box `CLAUDE.md` already records. Five fit. If you are over, look for rows that
are a *facet* of another row rather than a peer of it: nine of Home Workout's
twelve were movement families, which are a filter on the catalogue, so they
moved inside it and nine rows disappeared without losing anything.

**Known ceiling (COD-237):** a rail has no `aria-expanded`, so `npm run a11y`
and `npm run space` grade only the panel it opens on. Drive every panel by hand
with a throwaway probe and say what you measured.

---

## 3 · Draw short, announce long — `ChipPick`'s `label` / `name` / `hint`

**What it is.** Three fields that already existed on `components/ui/quickpick`
and had never been used together: the visible `label`, the `name` that becomes
the accessible name, and the `hint` that becomes the hover title.

**Reach for it** whenever a chip row wraps. Shorten what is *drawn*; the full
value keeps being announced and shown on hover.

**Measured.** Nine family names wrapped to three lines on a phone; drawn as
`H push · V push · H pull · V pull · Squat · Single leg · Hip hinge · Core ·
Conditioning` they fit, and every one still announces in full. Seven routine
names measured **590px of chips in a 384px card** and wrapped to four lines; the
short set is **381px in 384px — one line, 3px of margin**.

**Pair it with an order.** `Object.keys` gave `H push · V push · V pull · H
pull`, which alternates direction mid-row and reads as a mistake once the labels
are short. An explicit `FAMILY_ORDER` pairs push with push.

**And write the margin down.** A 3px margin is a measurement with no date on it:
the next rename breaks it silently. The comment above `Rounds` on the pull-up
log card claimed "exactly one row" and had been false for some time — that row
measured **218px in a 184px half** and had been wrapping its escape input onto
its own line.

---

## 4 · Correcting a record — `SessionEditor` and `useConfirm`

**What it is.** An inline editor on a history card, plus a confirmation that
names what it is about to delete.

**Reach for it** on any list of things the person created. The full contract is
in `USER-CONTROL.md`; the short version is that `add` without `edit` is a bug,
and an edit must rewrite **every** stored shape of the record, not the one the
list renders.

**Measured.** Editing one exercise from `3×12` to `9×99` moved the stored
`setRows` from 12 to 18. A version that rewrote only the human-readable string
would have looked identical on screen and been wrong in every muscle chart.

---

## 5 · Links built from a name, never pinned — `lib/video.ts`

`videoUrl`, `videoSearchUrl`, `buyingGuideUrl`.

**What it is.** A link constructed from the thing's name, with an optional
pinned override.

**Reach for it** for any outbound reference that is *about* an item rather than
*part of* it — a form demo, a buying guide.

**Why.** A pinned URL rots and a dead link is worse than a search, which always
lands somewhere useful. And the failure is quiet: of fifteen equipment rows
across two pages, **thirteen carried no `url` at all**, so `{e.url && <a>}`
rendered nothing fourteen times while both pinned URLs answered **200**. The
report was "the URLs are not working". Count how many rows carry the field
before debugging the field's value.

---

## 6 · A capped list with an honest affordance — `useCappedList` + `ShowMore`

**What it is.** Show the first N, keep the rest one click away, and put the
total in the button.

**Reach for it** for any list long enough to dominate its panel. The catalogue
of 83 movements measured **7.28 desktop screens and 16.06 on a phone** fully
expanded; capped at twelve it is **1.71 / 4.40**.

**The label carries the total** — `Show all (83)`, never `Show all` — because a
list collapsed to twelve with an unlabelled button cannot be told from a list
that only ever had twelve. Same reasoning as the urge-coverage card that prints
`3 of 5` and names what is missing.

**Do not cap by collapsing instead.** `npm run a11y` walks the rendered page, so
a fold that starts shut hides its contents from the gate — shortening a page
that way makes violations disappear rather than content.

---

## Applying these to the next page

In order, because each answers a different question:

1. **Count the navigations** in the review zone. More than one is the fault,
   whatever the page's height says.
2. **Group peers into rail rows**, and move any row that is a *facet* of another
   inside it.
3. **Put named items on `PanelCard`** — unless they have no body, in which case
   a two-column row list is shorter and reads the same.
4. **Cap the long list**, with the total in the affordance.
5. **Check `USER-CONTROL.md`** against anything the page records.
6. **Measure both viewports and report the one that did not improve.**

And then, for a page that is a programme rather than a catalogue:

7. **Does the list have a "where you are"?** If so it wants a spine (§7), and
   the marker wants real data or an honest line saying there is none.
8. **Is the act under the reference?** Give it an aside (§9), and make shutting
   it give the width back.
9. **Does the content say WHEN, or only WHAT?** (§12.) If only what, it is true
   and unusable.
10. **Is there more than one warning on the surface?** (§11.)
11. **Does any new animation touch opacity on text?** (§10.) If so, it will
    eventually be blamed on a colour token.

And then, for a page that RECORDS something and reads it back:

12. **Does zone 1 say what to do next, or only what is true?** (§15.)
13. **Is the act permanent furniture?** Give it a hide (§18) — and check every
    `grid-template-columns` rule excludes the collapsed state, at more than one
    viewport width.
14. **Do the grid's steps come from the card's needs or from a breakpoint
    scale?** (§19.)
15. **Can you get from a figure to the rows behind it?** (§20.)
16. **Is a comparison of more than about five things drawn as tiles?** (§21.)
17. **Is "today" one block, and is it out of the record?** (§22.)

---

## 15 · One sentence that says what to do next — `lib/pickleball.ts`'s `nextStep`

**What it is.** A priority list of rules over the page's own data, returning
ONE sentence and the panel that holds its detail. Zone 1 renders it above the
totals; it is a button when a panel answers it and a paragraph when none does.

**Reach for it** on any page whose orient zone is a row of totals. Four true
numbers are four things that change nothing about today; the thing that does —
an event on Saturday, a goal two games short, eleven days of silence — is
usually somewhere in zone 3 behind a navigation choice.

**The order is urgency, and getting it wrong is visible immediately.** It
shipped as event → goal → lapse, and the demo journal — ten days quiet, weekly
goal of twelve — rendered *"12 more games this week and you hit your goal of
12"*: arithmetically true, and nagging, because at a 3.8-day cadence that week
was already gone. Lapse above goal now. A target inside a week you have not
started is worth less than the fact that you stopped.

| rule | fires when |
|---|---|
| `first` | nothing logged — a record with no rows cannot say anything else |
| `event` | a dated thing within 14 days; the date is not movable |
| `lapse` | silence longer than twice your cadence |
| `goal` | a target you set, this period, not met |
| `milestone` | always, as the floor — something to aim at beats a blank line |

**Every window-comparing rule needs a coverage floor on both sides and must
state its sample.** The lapse rule wants four play days (three gaps) before it
will call anything a lapse, and says so in the sentence: *"across 5 play days
your cadence is about every 3.8 days"*. Without that it is the
momentum-indicator bug in CLAUDE.md, where a two-day sample against a seven-day
one reported a lapse as an improvement.

**Make the function total.** It always returns a sentence, which is what lets
the page render it without a conditional that would leave a hole at the top.

**Colour means urgency on that row and nothing else**, in the left edge and the
icon, with `fg-1` text — never the accent as text on a wash of itself.

---

## 16 · Sub-sections, and the single source that keeps them honest

**What it is.** A second, lighter chip row under a rail row, for the groups big
enough to need one. Pickleball's Performance holds nine cards and Trends seven;
the chips split them by the question they answer — *How I am playing · How hard
· Turning up · Badges*.

**Reach for it** at about five panels in one group. Below that a sub-navigation
costs more than it saves: Competition (3) and Opponents (4) have none.

**The rule that makes it safe:** the chips and the cards read ONE source. A
`has` map of booleans is declared once, the chip counts are computed from it,
and each card renders behind `has.x`. The obvious shape — a chip list written
beside the render conditions — is the hand-written list resolved against
another source that this repo has been bitten by three times (`BottomNav`'s
`PRIMARY`, `view-ids.mjs`, the a11y `VIEWS`), and it fails the same way: a chip
that selects nothing, or a card no chip can reach. Measured against the demo
journal the chips read `All 7 · 2 · 2 · 2 · 1` — seven, not the nine that
exist, because two have no data yet.

**`Facet` is module-level with `active` as a prop.** Declared inside the render
it is a new component type every render, so React remounts the whole subtree:
every chart re-enters and every fold inside it snaps shut. eslint's
`no-create-component-during-render` catches it before any of that is visible.

**Not sticky, and not in the URL.** A sub-section is a narrowing you do while
reading. Persist it and somebody opens the page a week later with four cards
missing and no memory of hiding them — the opposite of the rail row, which IS
a place you return to.

---

## 17 · A rail panel is a page-split column, so `CardGrid` — not `MasonryGrid`

`MasonryGrid` breaks on its **container** at 64rem. A review panel beside a
13rem rail measures **870px at a 1440 viewport** (an 1180px shell minus the
rail and a 2rem gap), so it draws one column however wide the window is —
seven cards, 1561px, with `@min-[64rem]:columns-2` sitting in the class list
looking correct. It only ever worked at 1920.

`CardGrid` asks about the **viewport**, which is the right question when the
column's width is decided by the page split rather than by the card. Measured
on the swap: **1561px → 1022px**, and the page from 2.84 to 2.24 desktop
screens. The cost is the row pocket masonry exists to avoid (~200px beside the
shortest card), which is the right side of that trade.

**And then prefer a bar to a column.** `railAt="never"` gives the panel the
full 1110px and puts the four rows left to right, which is how a short table of
contents is read. It wraps rather than scrolling — a strip wider than its box
scrolls with nothing advertising it, which is how three of eight chapters went
missing on Pull-ups — and it must not be sticky, because a bar that sticks
paints over the panel it switches (COD-202).

---

## 18 · The act you can put away — `PageLayout collapsibleAct`

**What it is.** A "Hide the log" control in zone 1 that removes the act COLUMN,
and gives its width to the review.

**Reach for it** on any page whose act is permanent furniture: a log form is on
screen whether or not you are logging, and on a phone it is the first thing
under the orient bar. Pickleball's was **1078px of form** before the record
started.

```tsx
<PageLayout tier={1180} collapsibleAct={{ key: 'pickleball', label: 'log' }} … />
```

`key` namespaces the remembered state (`bujo.ui.act.<key>`), `label` completes
"Hide the …". It is opt-in: the control is page chrome, and fourteen contract
pages should not gain it in one commit with no measurement behind any of them.

**Three things that are not optional, each of which went wrong first:**

| Rule | What happened without it |
|---|---|
| The toggle lives OUTSIDE the column it toggles | A control inside the panel it hides cannot bring the panel back |
| Give it a home in an existing zone, not a grid row of its own | `.zone-act`/`.zone-review` are explicitly placed with no explicit rows, so an extra auto-placed child landed at **y=1113** — under the whole page |
| Exclude the collapsed state from **every** `grid-template-columns` rule | `layout.css` has a second one at `@container (min-width: 1365px)`; with it missed, the review sat beside a **512px empty track** at 1920 and 2560 while every width below looked right |

Measured: review **678px → 1110px** at 1440, and 1590 / 1926 at 1920 / 2560.
The bug only appeared above a 1680px viewport, which is why the first round of
measurements said it was fine — **measure a layout change at more than one
width**.

---

## 19 · A card grid whose steps are solved, not copied — `PanelGrid`

**What it is.** The review panel's grid, breaking on its **container**, with
thresholds derived from how wide a card has to be.

**The arithmetic.** A card holding four stat tiles and a sentence reads as a
column below about **450px**. So the steps are `n × 450 + gaps`: **58rem /
88rem / 116rem** for 2 / 3 / 4 columns. Copying `@3xl/@6xl` from a breakpoint
scale instead gave four **382px** columns at 1920 — the same too-narrow card
the grid existed to fix, arrived at from the other side.

**Spell every step the same way.** Tailwind has no `@8xl`, so a fourth step
written that way emitted nothing and the grid silently stayed at three columns
on a 1926px panel; and mixing named with arbitrary variants of one family sorts
by neither number nor source order. One spelling — all arbitrary — sorts by
value.

**Charts go in a grid of their own, below the cards, not inside one.** A nested
grid is a grid inside ONE CELL of the outer one: three charts stacked in a
single column beside a column of stat cards.

| container | columns | card | when |
|---|---|---|---|
| < 928px | 1 | the whole panel | 1440 with the log open |
| ≥ 928px | 2 | ~545 | 1440 with the log hidden |
| ≥ 1408px | 3 | ~517 | 1920 with the log hidden |
| ≥ 1856px | 4 | ~466 | 2560 with the log hidden |

---

## 20 · Every figure leads back to the entries behind it

**What it is.** A weekday bar, a partner, a venue — anything an aggregate is
grouped by — is a button that opens the record filtered to exactly those rows.

**Reach for it** the moment a page has a read-only summary and an editable
list, which is every page in this app. Reported as *"I need to be able to edit
them as well, my entries, not the visualizations."* The sessions behind a
figure were a rail row away in a list of everything.

**The three rules that keep it honest:**

- **The filter states itself**, as a chip with the count and a way off:
  `Sun sessions · 1 of 5 ×`. A list that is quietly short reads as broken.
- **It clears when the reader changes subject** — picking another rail row
  drops it. A filter you cannot see is a list that looks wrong.
- **It is not persisted and not in the URL.** Like a sub-section chip, it is a
  narrowing you do while reading, not a place you return to.

Verified in the browser rather than by reading the handler: clicking Sun took
the list from **5 rows to 1**.

---

## 21 · A comparison of seven things is bars, not tiles

**What it is.** One row per item: label, a track, the figure, the sample. Not a
grid of cells. **`components/page/BarList.tsx`** since Fitness (COD-329) — it
was written as a component on its FOURTH caller, after Pickleball hand-rolled
the same row three times and Fitness needed three more. Pickleball's three are
deliberately left alone: they render identically today and migrating them is a
diff with no measurement behind it.

**Measured on "Performance by weekday".** Seven 44px cells inside a 353px card,
each holding a weekday, a percentage and a games count: `100%` needs 38px, so
the figure was the whole cell, and four-up on a phone wrapped a week into 4+3 —
which loses the one shape a week has. A bar per day reads at **348px and at
702px** with no breakpoint.

**Colour goes on the bar, never behind the text.** Every played day wore the
same wash before, so 100% and 60% looked identical — colour that carries no
value. A tinted ground under a percentage is also the accent-on-wash trap this
repo has measured at **3.64:1**; a bar is a graphic at 3:1, text is 4.5.

**Three steps, not a gradient** — under 40 red, under 60 peach, else green —
because nobody can read a value off a continuous ramp, and because that is
already the three-step scale Plan and Trackers use.

**And the subtitle says the finding**, not the title again: *"Best on Sun ·
100% of 2 games"*.

---

## 22 · One block for today, and a rail that reads in order

**Today is one block.** The next-step sentence, the totals and whatever you are
meant to do today belong in a single bordered unit in zone 1 — not a row, then
a bar, then a strip pinned at the top of the review. Pinned there, the strip
read as the first panel and ran into the first heading under it: *"the sessions
look completely collapsed into"* the drill. Merging them also gives the strip a
container to ask about (`@container/orient`), which is what lets it split into
two columns at width: **155px → 90px**.

**A thing to do today is not part of the record.** That is the test for whether
something belongs in zone 1 or zone 3, and it is cheaper than any amount of
arguing about card order.

**Order the rail by the question, not by the build.** Results · Sessions ·
Activity · Matchups · Competition — what a scoreline page is for, then what you
logged, then whether you are playing enough, then who and where, then the few
times a year you enter something.

**The default row need not be the first one.** The order is for finding things;
the default is for the thirty seconds after the primary button — which on a
logging page is the list you just added to.

**And the heading above a bar is `sr-only`.** The bar names every row; a grey
"The record" above it is furniture, and with the act column hidden it is
furniture 1110px wide. Keep the heading for the document outline, draw nothing.

---

## 24 · Sort the act's passengers by the question they answer

**What it is.** When an act column has grown a fold of reference panels, do not
move the fold to the review bar as one row called Tools. Ask what each panel is
used *between*, and let that decide where it goes.

**Measured on Strength.** The act was **3001px** at 1440 beside a 678px review,
because five panels lived under the logger in a `QuietSection`. Sorted:

| Panel | Went to | Used between |
|---|---|---|
| Saved routines · Coach sessions | a **Load** row | decisions — "start from a prescription" |
| Anatomy map · the exercise library | a **Lookup** row | decisions — "what is this lift" |
| Plate calculator | stayed in **zone 2** | sets — a target weight, at the rack |
| Rest timer | stayed in **zone 2** | sets — and a timer you navigate to is one you do not start |

Act **3001px → 541px**, and once it is under the viewport `PageLayout` makes the
column sticky again instead of giving it its own scrollport. Folds on the page
28 → 5.

**The move does not cost the "used during the act" argument**, which is what
kept them in zone 2 in the first place: zone 3 is BESIDE zone 2, not below it,
so the anatomy map and the logger are on screen together on a desktop — which a
fold under the form never allowed. On a phone it is one tap on the bar instead
of a fold plus a scroll.

**Pass them as a SLOT, not as props.** Those panels read state the act owns —
the focused lift, the split, `addRow` — and threading eleven props through the
review would make it know what a set row is. A `ReactNode` per row keeps the
ownership where it is.

---

## 25 · One opinion per question, cited from both places

**What it is.** When a second surface needs a number the app already decides
somewhere, import the decision rather than restating it.

**Three instances in one pass.** Rest between sets was about to become a
constant in the logger while `lib/programs.ts` already stated the rule for the
hypertrophy block (12+ reps → 30s, 8–11 → 120s, under 8 → 180s). The stored
set-line format was written inline in `finish()` and would have been retyped in
the history editor — `setLineOf` now, one formatter, two callers. And there were
**two rest timers**: one decrementing a `setInterval` (it drifts, and a
throttled background tab comes back insisting four seconds have passed) and one
counting against a deadline, naming the exercise, with tests. The second was
strictly better and already existed.

**The test is not "is this duplicated" but "could these disagree".** Two timers
cannot disagree about anything a user sees until one of them is wrong about the
time — which is exactly what the drifting one was.

---

## 23 · The act column, stacked — `useActColumn`

**What it is.** The open/shut state of zone 2, with the one rule nobody
guesses: **stacked, it starts shut.**

**Why.** Wide, the act is a column beside the review and open is right. Below
the split it is the whole width of the page, and one column cannot have a
683px form above the record AND the record near the top. Measured on
Pickleball at a 1152px window:

| order | what it cost |
|---|---|
| form first (the shared default) | the rail sat at **y1057** — a screen down |
| record first (`actLast`) | the form drifted to **y880**, and to **y1321** just by switching to a bigger panel |
| **shut by default** | strip **41px**, rail **y415**, form one tap away |

Reported twice from both sides — *"when I click Matchups it tries to get
downwards"*, then *"it's still moving down"* — because the first two orders
trade the problem rather than solve it. The third is the solution: when you
tap the strip open you are logging, so the form at the top is the point.

**Three things this hook exists to get right:**

1. **`stacked` can only come from the shell.** The split is a container query
   on the 900px shell, so no viewport test answers it — a 1152px window with
   the rail open is a "desktop" by `useDevice()` and stacks anyway.
   `PageLayout` measures it and reports through `onSplitChange`.
2. **It is a default, not a rule.** Once the reader opens or shuts the column
   themselves, their choice holds for the life of the page, and the sticky
   value keeps governing the desktop, where it is a preference rather than a
   reaction to a layout they can see.
3. **`ActStrip` lies down when it stacks.** It is built for a column — 40px
   wide, label rotated — and a 40px tower of sideways text in the middle of a
   full-width zone reads as a rendering fault. `layout.css` turns the same
   button into a 44px bar below the split, label upright, summary beside it.

Verified across all five Pickleball panels at 1152, 1024 and 390: the rail
sits at the same y on every one of them, and nothing moves when you switch
panels.

---

## 26 · The way back from a number you changed — `components/page/ResetField.tsx`

**What it is.** A one-line affordance beside any stepped or typed value that
puts it back where it started. `<ResetField changed={…} to="2,000"
onReset={…} what="the calorie target" />`.

**Why.** Asked for directly: *"if sometimes I'm entering or increasing the
values, give me an option for reset as well — like in the plate calculator and
food and some other places"*. It is `USER-CONTROL.md`'s rule 1 one level down —
`add` without `edit` is a bug, and **a stepper without a way back is a stepper
you are afraid to press.** Tapping `+` eleven times to see what it does is the
first thing anybody does with a new control, and the only way out used to be
selecting the field and retyping the original, which you have to remember.

**Three rules, and they are what make it honest:**

1. **It renders nothing while the value is already the default.** A reset button
   that is always there is furniture, and a *disabled* one teaches people the
   control does not work — the same reasoning `ShowMore` uses for hiding itself
   when nothing is hidden.
2. **The label says where it goes**, not just "reset". `Back to 2,000` tells you
   what will happen; a bare ↺ glyph does not. The drawn text can be shortened
   because `aria-label` carries the full sentence — §3's draw-short /
   announce-long rule.
3. **It is not a delete.** Reset restores a KNOWN value; clearing a record is a
   different verb with a different confirmation (`useConfirm`, naming what it
   removes). A control that says "reset" and empties a day is the kind of thing
   this repo has shipped once already.

**Where it goes.** Anywhere a number has an origin the app knows: the plate
calculator's target, each of Nutrition's four targets. Not next to a field whose
"default" is empty — that is a clear, and `SearchField`'s `×` is the shape for
it.

---

## 27 · The title is the toggle

**What it is.** When a zone can be put away, the heading itself is the button,
with `aria-expanded` on it and the caret kept as the visual affordance.

**Why.** Asked for as *"if I click on Log what you ate, that should hide it and
also show me that"*. §18's `collapsibleAct` shipped the caret as a 28px icon
button beside a 200px heading the whole thing is about — so the obvious target
was the inert one, and **a heading that looks pressable and is not is worse than
one that does nothing.**

```tsx
<h2 className="text-heading font-medium text-fg-1">
  <button type="button" onClick={logCol.close} aria-expanded
          title="Hide the log — the review takes the width">
    Log what you ate <Icon as={CaretRight} size="sm" />
  </button>
</h2>
```

**The heading stays a heading.** The button goes *inside* the `<h2>`, not
instead of it: a page whose zones are unnamed in the outline is a page a screen
reader cannot skim, and `aria-expanded` on a heading element itself is not a
pattern assistive tech reads.

**It is a hide, not a disclosure.** `aria-expanded` is hard `true` because the
zone it collapses is the one being read — the strip that brings it back is
elsewhere (`ActStrip`), which is why this is not a `DisclosureRow`. Keep the
caret: it is the only thing on screen that says which direction the press goes.

---

## 28 · A library too big for a chip row — search above, groups as a filter

**What it is.** When a pick-list outgrows one capped row, the answer is a search
box above it and the groups as **buttons that filter**, not as more rows.

**Why.** Nutrition's library went 48 → 103 foods. Two uncapped cuisine rows
measured **2,258px of act column on a phone**; capping them at ten put the food
you wanted behind a `Show all` that re-created the problem. Asked for as *"if I
click on American, show all the American; if I click on Indian, show me all
Indian; if not, I'll search for it"*.

| piece | rule |
|---|---|
| search | above everything, `SearchField`, matching more than the name — Nutrition searches the **serving** too, so "cup" finds everything measured in cups |
| your usual | the first row, built from what was actually logged (`topFoods`) — not from what the library thinks is popular |
| the groups | two buttons side by side carrying their **counts**, `aria-expanded`, picking one again closes it |
| the open group | **uncapped** — you asked for this group, so this is the group. The cap exists for rows you did not ask for |
| the state | not sticky. It is a narrowing you do while logging lunch, not a place you return to — the same rule §16's sub-section chips follow |

**Two columns at any width**, with no container query: they are two buttons, and
the narrowest act column in the app is 324px.

**A chip in a long list needs a second channel.** At ten chips the weight could
be a coloured dot; at a hundred it cannot, because colour was carrying three
states at 6px. Nutrition draws three vertical bars filled one/two/three, in the
band's colour, with the band named in `sr-only` text — height *and* hue *and*
text, so it survives both a small screen and a reader who cannot separate the
hues. And put the number in **its own column** past a hairline rule, in the mono
face: a row of chips is then scanned down the number instead of read word by
word.

---

## 29 · The record of a thing lives with what it explains

**What it is.** A list you read back and correct belongs in the review zone,
beside the figure it explains — not under the form that wrote it.

**Why.** Nutrition's logged-foods list shipped at the bottom of the act: under a
picker, a search box, a custom-food form and a legend, which is **the furthest
possible point from the chip that put it there**. Reported as *"show me log
today, right side or inside today — why do I need to scroll down?"*. The same
arithmetic as §22: the act column is the narrow one, and anything that is read
rather than filled in has more room in the review.

**It goes before the figure, not after.** The macro split is the *consequence*
of the log, and you cannot judge a ratio you cannot correct — so the rows come
first and the chart reads as their result.

**Pass it as a slot.** The state it edits belongs to the act (the date, the
day's metric, the confirm dialog), so the view owns the component and the review
borrows it as a `ReactNode`. Rebuilding it from props is a second opinion about
what the day holds, and two opinions is how §25's duplicate timers happened.
