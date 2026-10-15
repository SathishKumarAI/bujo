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
