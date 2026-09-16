# Help

`src/views/Help.tsx` · top bar → ? → *Open the full guide* · `?view=help`

## What this page is

The in-app guide: the bullet grammar, three starting tutorials, and a searchable
catalogue of every surface in the app — what it is, why it exists, and the first
three things to do on it.

It renders `src/lib/guide.ts`, which holds **only** `why` and `how`. The title
and the "what it is" blurb come from `VIEW_CHROME`, the grouping from
`SECTIONS`. `scripts/build-manual.mjs` renders the same data to
`docs/FEATURE-REFERENCE.md` (`npm run manual`).

## The findings this page was rebuilt to fix

The audit below is kept because the *cause* is worth remembering: the page
carried its own copy of what each screen does.

**P1 · One long scroll with no way in.** *Fixed.* Zone 3 is a search box over
twenty-four folded cards, grouped by nav section, with the count in zone 1. A
search hit opens itself — a result you still have to click has only narrowed the
same long scroll.

**P2 · It duplicated the ⓘ system.** *Fixed, and this was the root cause.* Each
screen was documented three times — the card ⓘ, `VIEW_CHROME.help`, and this
page's prose. Three copies drift, and they had: the prose named **fifteen of
twenty-four** screens. Goals, Program, Nutrition, Coaching, Reading, Mindset,
Stats, Pickleball and Home workout were absent from the one page a lost user
opens, and nothing failed when they were added to the app. `guide.test.ts` now
asserts coverage in both directions.

**P2 · Nothing linked out.** *Fixed.* Every feature card has an *Open <name>*
button; every tutorial step that names a screen has *Open it*.

**P2 · Prose at content width with no rhythm.** *Fixed.* The page is on the
three-zone contract: zone 1 the counts and a backup pointer, zone 2 the
tutorials, zone 3 the bullet grammar then the catalogue.

**P3 · The bullet legend was buried.** *Fixed.* It is the first thing in zone 3,
above the catalogue.

**P3 · Unreachable from the sidebar.** *Unchanged, deliberately.* It is reached
from the top bar "?" (which also shows the current page's blurb and
suggestions), from the ⋯ menu, and from ⌘K. A sixth rail row for a reference
page would cost every other page a row's worth of nav.

## How the contract bends here

This page records nothing, so zone 3 is not "what you have recorded" — it is the
reference body. Zone 2 is still the act, and the act on a guide is **start**,
not read: the three tutorials, with the track picker above them.

## Leave alone

- **The `what` text.** It is `VIEW_CHROME[view].help` and must stay that way —
  a paraphrase here is the drift the whole module exists to prevent, and
  `guide.test.ts` asserts the strings are identical.
- **Two facts per feature, not five.** Collapsed, a card shows its name and one
  sentence of *why*. That is what makes a list of twenty-four scannable.
- **Plain language, no screenshots, no video, no marketing voice.**
