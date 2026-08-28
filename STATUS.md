# STATUS

**Stopped:** 2026-08-28 (second session that day). Branch
`feat/today-orient-zone`, two commits, PR open. Previous session's five PRs
(#161–#165) are merged; `main` was at `e4508db` when this branched.

## What this branch does

Today was the page the contract had never been applied to. Two increments:

| Commit | What | Ticket |
|---|---|---|
| `9a25dde` | The tabs report, and the day gets its 550px of gutter back | COD-53 |
| `79fe084` | The close-out list is a list of checkboxes, not of pressed buttons | COD-50 |

## The one thing to carry forward

**"Optimise this page" is two different jobs, and only one of them was
available.** Measured per surface at 1440, 1920 and 390:

- **Chrome was compressible and worth compressing.** 180px of dateline plus tab
  row before a word of the day, and 550px of dead gutter on each side at 1920
  because the focused layout never had a rail. Fixing both took all three
  surfaces from 1.36 / 1.01 / 1.09 screens to **0.91 / 0.88 / 0.88** — they fit
  one screen now.
- **The phone was not.** 1.57 → **1.56**. Every pixel there is card content, so
  the only remaining lever is what the cards ask for — a density decision, not a
  layout one. Saying that plainly is more useful than shaving 8px off a padding
  and calling it a win.

The second half is the part worth keeping: **before optimising, measure whether
the thing you are about to compress is actually what is on the screen.**

## Next action

1. **The date is stated three times** — `Today · Your daily log` and
   `Fri, Aug 28` in the shell, then `Friday · August 28 · today` in the
   masthead. Hoisting the dateline (so Morning and Evening are dated at all)
   made this worse. The fix is known and deliberately not taken here: the
   shell's Row 2 exists on Today only to hold the day chevrons, so moving those
   into the masthead retires the row and ~56px with it. It is a shell change for
   one view; do it with the next shell pass. Filed as **COD-57**.
2. **`fg-2` on `ink-3` is 4.09:1** — the surfaces swatch on the kitchen sink,
   `#a6adc8` on `#45475a` at 11px. Found by axe-ing kitchen-sink by hand, which
   is the finding underneath the finding: see the gate note below. **COD-58**.
3. Still open from `docs/pages/today.md`: **pick a voice** (the penalty card's
   gamified tone against the reflection prompts' calm one). A judgement call,
   not a fix.

## Gates, and what each one is now good for

Unchanged from the last session except one repair.

`scripts/a11y-axe.mjs` navigated by `hasText: /^Evening$/`, which reads
`textContent` — **including visually-hidden text**. The moment a surface tab
started announcing its state ("Evening, nothing recorded yet") the gate
declared the tab retired and exited 1. It falls back to the same name followed
by a status suffix now, exact match first so two controls sharing a prefix
cannot swap places.

**The kitchen sink is not on `VIEWS`,** so axe has never seen the design system
it exists to display — which is how a 4.09:1 swatch label sat there. Adding it
would be right, and would likely surface more than the one above; that is the
argument for doing it deliberately rather than as a side effect of this branch.

## Traps hit this session

- **A rendering gate that navigates by accessible name breaks when a control
  starts announcing its state.** Above. The gate's own error message was right —
  "the destination was renamed or it lost its door" — and the answer was
  neither: the name had grown a suffix.
- **The design gate is a line-level regex, so it fires on prose.** A comment
  explaining *why* a full-radius utility is wrong here failed the rule that
  forbids the utility. Reworded the comment; the rule is fine.
- **Tailwind v4 emits nothing for a class assembled at runtime, silently.**
  `tone.on.replace(/data-\[state=checked\]:/g, 'group-data-[state=checked]/row:')`
  type-checks, builds and paints nothing. Both forms are written out as literals
  now, and the *proof* is a measurement: every checked row's box computes the
  14% wash in mocha, latte and dawn, and every unchecked one computes the card
  surface. This trap has no failure mode, so it needs a computed value or it
  needs nothing.
- **The docs were stale in the direction that sends work at the wrong thing.**
  `docs/pages/today.md` described ten cards and 3.5 screens; the page has been
  three surfaces for some time. Re-dated with measurements.

## Verification, as run

Against `http://localhost:5199` (dev server — sidesteps the stale-service-worker
trap), demo data seeded and asserted present:

- `npx tsc -b` exit 0 · `npx vitest run` **61 files, 862 tests** (854 at the
  start) · `npx eslint .` 0 errors, 2 pre-existing `App.tsx` warnings ·
  `npm run build` clean.
- `npm run design` — 276 files. `npm run contrast` — 5 themes, 14 accents, both
  palettes agree.
- `npm run a11y` — 0 serious, 0 critical, 5 themes × 2 widths, **all three
  Today surfaces scanned** (the gate already walks them; see the repair above).
- `npm run smoke` 25/25 · `node scripts/clipped-text.mjs` clean, 23 views.
- Today re-measured on the rendered page at 1440, 1920 and 390, per surface,
  before and after — the numbers in this file are those, not estimates.
- `CheckRow` verified by computed style in mocha, latte and dawn: role, checked
  state, 44px row height, wash alpha, mark opacity.
- Kitchen sink axed by hand in mocha and latte (it is not on the gate's list).
