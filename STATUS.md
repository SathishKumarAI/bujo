# STATUS

**Stopped:** 2026-09-11. Four PRs — #203, #204, #205 merged; **#206 open,
waiting on CI a11y only** (local a11y green, exit 0, "No serious or critical
violations"; CI `verify` and `docs-guard` already pass). Test count **953**
across 76 files, up from 939.

## What this session did

1. **#203 feedback layer** — 26 native `alert()` → toasts; the sync-conflict
   `window.confirm` → `ConfirmDialog` (and `resolveIncoming` is now async);
   an undo toast on all 25 delete actions, from one store helper.
2. **#204 Mindset on a phone** — cue field showed 54px of a 147px note;
   filter scrollport was 10px wide. Plus `Statement` dash binding.
3. **#205 diagrams** — `docs/diagrams/` is the single home; the two divergent
   UML files retired; `ARCHITECTURE.md`'s false claims fixed.
4. **#206 folds** — eight sections across Stats, Monthly and Pickleball said
   "collapsed" in a comment and opened on every visit.

## Next action

**Merge #206** once CI a11y goes green (it is the long job now — it runs
`clipped` too). Then, in rough order of leverage:

- **Mindset (3.29 screens, 0 folds) and Focus (3.08 screens, 0 folds)** are
  flat stacks with nothing collapsible. This is page-contract work, not a
  bug — use the `page-contract` skill rather than adding folds by reflex.
- **COD-137** sync-effect consolidation — still the only two eslint warnings.
- **Two components named `Section`.** `components/pickleball/Section` is a
  local near-duplicate of `CollapsibleSection`: same name, same
  open-by-default, **no `stickyKey`**, so its folds do not remember. Deciding
  whether to consolidate is a real change; do not merge them by name alone.

## Decisions that will surprise you later

- **`resolveIncoming` defaults to keep-local** (`ask = () => false`), not to
  the old native confirm. It only applies where a caller passes nothing
  (tests, no DOM). Keeping local stalls adoption until the next change; the
  other default silently clobbers unsynced work, and a stall is recoverable.
- **Stats' six analytics sections are closed by default now, and that was
  always the stated intent** — the header comment said "six collapsed
  analytics groups". `stickyKey` persists a reader's choice, verified across
  a reload. Do not reopen them without re-measuring: it costs 620ms of script
  and 900 DOM nodes on every visit.
- **`Statement` rewrites its children** when given a string, binding a spaced
  en/em dash to the preceding word. It is written `' $1 '`, the escape,
  deliberately — the first draft pasted a literal NBSP, which reads as an
  ordinary space in the source and gets deleted as a no-op.
- **Pickleball's Charts fold does not persist.** Its `Section` has no
  `stickyKey` to give. Noted at the call site.

## Traps hit this session

- **A pipe eats the exit code.** `npx tsc -b | tail; echo $?` reports
  *tail's* status — it printed a cheerful `0` over a real `tsc` failure and I
  believed it for two commits. Use `cmd; echo $?` or `${PIPESTATUS[0]}`.
- **A JSX comment cannot sit between attributes.** `{/* … */}` inside a tag's
  attribute list is a parse error (TS1005). Put it above the element. Cost me
  two failed builds, in two different files.
- **Three docs overstated or misstated their own subject.**
  `UIUX-CRAFT-BACKLOG.md` said the toast layer was unbuilt when
  `lib/notify.ts`, `Toasts.tsx` and the shell mount had all shipped — I would
  have rebuilt all three if I had not grepped first. `ARCHITECTURE.md` said
  "no backend" and "localStorage, not IndexedDB", both false. `uml.mdx` drew
  a component that does not exist. **Grep before trusting a doc in this repo.**
- **A gate's own parser can be wrong.** The new fold gate used
  `/<Section\b[^>]*>/`, which stops at the first `>` — and Monthly has one
  inside `subtitle={<>month pulse</>}`, so every attribute after it was
  invisible and it reported an already-fixed section as broken. It counts
  brace depth now. Prove a new gate red *and* green before trusting it.
- **A tall page is not necessarily a slow one, and vice versa.** Insights
  looked worth optimising and is 141 DOM nodes. Measure before choosing a
  target: `node scripts/page-census.mjs` (it defaults to 5199, the dev
  server) and Chrome's `Performance.getMetrics` — and call
  `Performance.enable` *before* navigating, or every timing reads zero.
- **The Chrome extension and chrome-devtools MCP were both unavailable.**
  Playwright is present but deliberately not a dependency; drive it from a
  script whose `createRequire` points at this repo's `package.json`, or the
  import fails outside the tree.
- **Two gates need the first-run gates dismissed.** `?demo=1` seeds, but a
  tour overlay and "This device only" both intercept clicks. Dismiss both,
  then assert the seed landed — 90 entries — before believing any measurement.

## The one thing worth remembering

Every bug this session was **invisible to a fully green toolchain**. `tsc -b`,
eslint, vitest and `vite build` are all perfectly happy with `alert()`, with a
comment that contradicts its own props, with a field showing a third of what
was typed into it, and with a scrollport ten pixels wide. Four gates were
added or armed, and **every one of them was green on a real bug before it was
armed**. When something here looks fine, ask what would have had to fail.
