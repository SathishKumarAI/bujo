# Reusable patterns — what Pull-ups, Home Workout and Coaching built that other pages can take

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
> moves, and how you keep its content honest*.

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
