# STATUS

**Stopped:** 2026-10-18, on `fix/act-column-consistency`.
**One PR merged, two open.** Full session record:
`docs/sessions/2026-10-18-cycle-and-the-act-column.md` — read that first, it
is written to be read cold.

## Where it stands

| # | what | state |
|---|---|---|
| #436 | the month is a calendar beside the log, and three measured defects under it | **merged** |
| #437 | four controls, the slow path in a window, the key in the manual | open, `feat/cycle-design-system` |
| #438 | three logging columns that never collapsed on a phone, + one `ActHide` | open, this branch |

**#437 and #438 do not overlap** — #437 is `ui/quickpick` plus the Cycle
components, #438 is the act column across nine views. #438 was branched off
`main` for that reason and the two will not conflict. Merge order does not
matter.

## The next action

1. **Cycle's zone 1 is still five bands** — banner, month stepper, four-up
   fact row, three-up stat strip, privacy line, none of them the page's
   answer. `docs/DESIGN-SYSTEM.md` §04 and the
   [system comp](https://claude.ai/code/artifact/d06fa879-3c1a-452c-849b-8aff641d74eb)
   rebuild it as one card with `20` at the `answer` step and the phase as a
   band. **Largest remaining piece, most left in it.**
2. **`ChartCard` has no `footer` slot** — every chart's key and sample size
   sit loose in its body, which is how a band chart's right column ran off the
   panel edge.
3. **COD-364** — `--ctl-ring` leaves every input and select at **1.37–1.72**
   against the card, the numbers the chip left behind. Not fixed because that
   token is also the hairline inside `--shadow-raise`.
4. **COD-360** — `intimacy` is write-only: every other optional day field has
   an aggregator, that one has a single reader.
5. **The rest of the app** inherits the primitives already; what remains per
   page is whatever was hand-rolled instead of using them.

## The three live traps, in short

The session record has all of them. These are the ones that will bite again:

- **A Tailwind v4 class can emit no CSS, exit 0, no warning.** Three did this
  session (`@container/more`, `@3xl:max-w-5xl`, `w-[6ch]`). **The tell is a
  tweak to a number having no effect.** Check with
  `grep '<the class>' dist/assets/*.css`.
- **A stale preview worker makes a fixed gate keep failing.** `clipped` kept
  reporting a defect a fresh probe could not reproduce. Start a new preview on
  a new port; compare `assets/index-*.js` against `dist/index.html` both ways.
- **Read a gate's predicate before believing its noun.** `clipped` said "37px
  shown of 39px" on a field — that is `scrollHeight`, a HEIGHT. Three guesses
  went into widening something too short.

## Environment

**Preview on 4310, this worktree.** 4173 is also this worktree and was serving
a stale worker mid-session.

```
npx vite build
npx vite preview --port 4310 --strictPort &
BUJO_URL=http://localhost:4310 node scripts/a11y-axe.mjs
```

`playwright` and `@axe-core/playwright` are installed here but still not in
`package.json` (COD-273). A throwaway probe must live in the **repo root** —
ESM resolves `playwright` relative to the script, so one in the scratchpad
dies on `ERR_MODULE_NOT_FOUND`.

`npm run design` and `npm run contrast` are **not** in `npm run verify` but
are in CI. `a11y:panels` is minutes and not in CI. Run all of them before
pushing, and never `vite build` while a gate is running.
