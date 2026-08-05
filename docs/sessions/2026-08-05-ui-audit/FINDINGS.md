# UI audit — all 24 views, demo data, 1440px

Run on `main` at `46d39c6`, immediately after the six-PR stack landed. Every
view in `VIEW_CHROME` was visited with a seeded demo journal (66 KB, 89 entries,
17 workouts, 102-day span), scrolled to the bottom and back so lazily-rendered
charts actually drew, and measured rather than eyeballed.

The sweep script is `scratchpad/ui-sweep.mjs` — it is not committed, because the
useful half of it belongs in `scripts/a11y-axe.mjs`'s neighbourhood as a real
gate, not as a one-off. See "What should become a gate" below.

## What is clean

- **No horizontal overflow on any of the 24 views.** Not one element crossing
  the viewport edge at 1440.
- **No empty cards** — no card renders a title with nothing under it.
- **No console errors** anywhere except `account`, which is the known Supabase
  NXDOMAIN (`ERR_NAME_NOT_RESOLVED`). Pre-existing and already documented.

## Three real defects, all the same shape

All three are `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` —
single-line clipping, **not** an intentional `-webkit-line-clamp`. Measured as
"the element's own `scrollWidth` exceeds its `clientWidth`", so each is text the
layout has decided not to show.

### A-1 · Coaching · six drill descriptions clipped mid-sentence

| Text | Shown | Needs |
|---|---|---|
| "From the baseline, a soft arc that lands unat…" | 436px | **662px** |
| "Jumping around the kitchen (outside the …" | 436px | 622px |
| "A small hop that loads your legs just as the …" | 436px | 539px |
| "Returning a wide ball around the outside…" | 436px | 510px |
| "Absorbing a hard ball softly into the kitchen…" | 436px | 506px |
| "Return deep, then sprint to the kitchen — the…" | 436px | 481px |

The worst loses **a third of the sentence**. These are the explanations of what
each drill *is* — the one piece of text on the card whose entire job is to be
read. A name can survive an ellipsis; a definition cannot.

Fix is to let them wrap. They are prose in a card body, not a label in a row.

### A-2 · Strength tools · the exercise name is what gets cut

"Romanian Deadlift" renders in 112px and needs 128px, so it reads
"Romanian Deadlif…".

This is the exact rule `STATUS.md` already wrote down after the last pass —
**whatever names the thing must be the last item allowed to shrink** — showing
up in a place that pass did not touch. Same flex shape: a row whose secondary
content is `shrink-0`, leaving the name as the only shrinkable child.

### A-3 · Focus · the project name is cut

"pickleball-vision" renders in 96px, needs 112px. Same shape as A-2, and the
same fix.

## The touch floor, quantified

`STATUS.md` has said "44px is met for what this pass touched, not app-wide" for
several sessions without saying what is left. Measured, across all 24 views:

| Control | Size | Views affected |
|---|---|---|
| `×` dismiss button | **28 × 28** | **9** |
| `Segmented` (Cardio / Strength / Sport) | 66 × **31** | 3 |
| "Log session" — a page's *primary* action | 404 × **36** | 3 |
| "More details" fold toggle | 404 × **27** | 3 |
| "Repeat last" | 115 × **36** | 3 |
| RPE segments | **39** × 44 | 3 |

Two things worth pulling out of that table:

- **The `×` at 28 × 28 is the most repeated miss in the app** — nine views. It
  is also the control with the highest cost of a mis-tap, because it discards
  something.
- **RPE measures 39 wide, not the 38 recorded in B-5.** The backlog entry said
  38; it is 39. The conclusion is unchanged — it cannot reach 44 in a ~380px
  act column — but the number in that note is off by one.

## What should become a gate

The sweep found A-1 through A-3 in one pass, and the repo has no check that
would have caught any of them. `npm run a11y` cannot: axe does not flag clipped
text, because clipping is not an accessibility violation — the text is still in
the accessibility tree, which is precisely why it survives every existing check
and why it keeps recurring (`M…`, `W.`, "First w…", "Centur…", and now these).

A `scrollWidth > clientWidth` assertion over the rendered page is ~15 lines and
catches the entire family. It needs one refinement to be usable: **skip
elements narrower than ~2px**, which are screen-reader-only labels sized
`width: 1px` by design. Without that filter the raw count is 221 on Stats and
110 on Fitness, and every one of them is noise — which is how a real signal
gets buried.

## Not covered by this pass

- **1440 only.** No 390 pass, no other themes.
- **Contrast** — that is `npm run a11y`'s job and it was green at `d931ff2`.
- **Interaction.** Every page was measured at rest. Nothing was typed, opened,
  submitted, or dragged.
- **`account`** renders no `h1` and could not be measured properly; it is behind
  the dead Supabase host.
