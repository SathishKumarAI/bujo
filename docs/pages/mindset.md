# Mindset

`src/views/Mindset.tsx` · nav: Wellbeing → Mindset · `?view=mindset`

## What this page is

A library of thinking principles — focus, resilience, growth, composure,
confidence, discipline, connection — from which you pick one to three to
actively work on. "Your focus" holds the chosen few; the library holds the rest.

## Measured (1440×900, demo data)

- **2.4 screens · 2 blocks**: Your focus (462px) and **Principle library
  (1,575px)**.
- The library is a single always-open card taller than one and a half screens.

## The finding that matters

**P1 · A 1,575px card with no way to close it.** Every principle in the app is
rendered at once, in one uninterrupted card, with category headers inside it.
There is no collapse, no filter, no search, and no count. The page is the
library, and the library is one wall.

Every comparable page in the app (Coaching, Pickleball, Trackers) puts reference
material behind a disclosure. This one does not, and it is the most reference-y
page of them all.

**P2 · The chosen principles are duplicated verbatim below.** "Process over
outcome" appears in *Your focus* at the top and again in the library 500px
lower, same title, same body text. Nothing in the library marks which ones you
have already taken.

## UX / IA

**P2 · No way to get to a category.** The library has section headers
(`FOCUS & PRESENCE`, …) but no jump list, so reaching "Discipline" means
scrolling past everything before it. Seven categories, one scroll.

**P3 · "Tap + to add a principle to your focus"** — the `+` is described before
it is seen, and at desktop width the affordance is a long way right of the text
it belongs to.

## UI

**P2 · Each principle is title + one sentence, and they all look the same.**
Twenty-plus identical text blocks stacked vertically is a page a reader skims
and abandons. Two columns at wide widths, or collapsed categories, would make
the same content browsable.

**P3 · "Your focus" and the library use the same card treatment**, so the two or
three principles you have actively committed to look exactly like the twenty you
have not.

## Copy

**Strong throughout.** *"Dwelling on a mistake leaks tension into the next
attempt. Reset and move on."* and *"Attention is your scarcest resource;
splitting it halves the quality of both."* are well-written, concrete, and
opinionated — the same voice as Coaching, which is the app's best.

**P3 · "Tip: keep it to 1–3 at a time — focus beats breadth."** Good advice,
placed as a footnote under the focus card. It is the page's central rule and it
is set as an aside.

## Upgrades, ranked

1. **P1 · Collapse the library by category** — seven closed sections instead of
   one 1,575px card.
2. **P2 · Mark principles already in your focus** where they appear in the
   library, and do not repeat their full text.
3. **P2 · Two-column layout** for the library at wide widths.
4. **P3 · Promote the "1–3 at a time" rule** into the focus card's subtitle.
5. **P3 · Add a filter or search** once the library is collapsed.

## Leave alone

- **The writing.** Do not touch it.
- **The 1–3 limit as a product rule.** A principles list that lets you pick
  everything is a list nobody follows; the cap is the idea.
- **"Your focus" leading the page.** Correct — what you are working on comes
  before what you could work on.
