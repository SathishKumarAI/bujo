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
