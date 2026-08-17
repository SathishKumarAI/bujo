# STATUS

**Stopped:** 2026-08-16. Nothing half-built, nothing uncommitted. Every branch
below is pushed with an open PR and green gates.

## Where things are

Two independent lines of work. **Neither has merged, and that is now the
bottleneck** — thirteen open PRs, most of them in one chain.

### Line 1 · the nav / UI chain (11 PRs, merge bottom-up from #113)

| PR | Branch | What |
|---|---|---|
| #113–#119 | `feat/modernist-*` | The Modernist redesign, page cluster by cluster |
| #120 | `refactor/one-nav-bar` | Rail deleted; navigation is a two-row top bar |
| #121 | `feat/header-scroll-collapse` | Row 1 folds on scroll; `TopBar` split into `topbar/` |
| #122 | `feat/hypertrophy-tab` | Program + Challenges become Body tabs; anatomy bundled offline |
| #123 | `chore/tab-work-followups` | Five follow-ups; a11y gate reaches companion views |

Each is based on the one above it. Squash-merging bottom-up retargets the next
automatically; **merging out of order will not work.**

### Line 2 · data storage (3 PRs, off `main`)

| PR | Branch | What |
|---|---|---|
| #124 | `feat/data-engineer-agent` | `data-engineer` subagent + `docs/DATA-STORE-DECISION.md` |
| #125 | `fix/sync-data-loss` | Four silent data-loss defects fixed |
| #126 | `fix/photo-sync-payload` | **DRAFT, blocked** — photo sync |

Independent of line 1. #124 can merge to `main` on its own.

## Next action

1. **Merge line 1 bottom-up from #113.** It is eleven deep and every day it sits
   is a day of drift against `main`.
2. **Merge #124 → #125.** These fix live data loss.
3. **Decide F-1** (below) and finish or close #126.

## The one open decision

**Photos never sync**, and the obvious fix makes it worse. Photos are canonical
in IndexedDB as `img:` ids; every push ships bare ids, so a second device gets
references resolving to nothing.

Inlining them on push breaks the size-limited paths: photos are 1024px JPEG
q0.72 (~120 KB, ~160 KB base64), progress photos are weekly, so a year is ~52 ≈
8 MB — against `api/sync.ts`'s 8 MB reject and **Vercel's 4.5 MB body limit**.
A photo user would go from "photos quietly missing" to "nothing syncs".

Options, in the order I would take them, written up in `DATA-STORE-DECISION.md`
§8 F-1: blob-per-photo · inline only on the unlimited paths · inline under a
budget. The work is preserved on #126.

## Smaller, still open

1. **F-7** — four sync writers with four debounce windows (1500/2500/4000/4000).
   Making them mutually exclusive is the cheap fix.
2. **F-8** — `bujo:sync` holds the sync passphrase in plaintext localStorage,
   beside the data it unlocks.
3. **The SQLite exporter** (step 7 of the decision doc) is not built, gated on
   F-1 deliberately: a query surface over data that still loses rows just draws
   confident charts of wrong numbers.
4. **PR #96** (Today UX, +2620/−767) has been conflicted since 2026-08-03 and is
   largely superseded. Probably a close, but it is 3.4k lines and not my call.
5. **Body is eight tabs.** It works — the row scrolls and the active tab centres
   — but that is the ceiling. A ninth needs a decision to split the section.
6. `data-engineer` is not invocable until a session restart; the agent registry
   is read at start-up.

## Traps found this session

- **`overflow-x-hidden` makes an element a scroll container.** Non-`visible` on
  one axis forces the other to `auto`, and `position: sticky` sticks to the
  nearest *scrolling* ancestor. `<main>` had it, so every sticky-under-header
  element was inert for months while reading `--header-h` correctly. Use
  `overflow-x: clip`. Symptom: the bar reads -544px instead of clamping.
- **A collapsing in-flow header fights scroll anchoring.** Shrinking content
  above the reader makes the browser move `scrollY`; a scroll listener reads
  that as the user and flips back, forever (`44 → 25 → 9 → 35 → 24 …`). Fixed
  with a settle window, not by disabling `overflow-anchor` — this app
  lazy-loads charts and anchoring is what stops them shoving content.
- **`grid-template-rows: 0fr` does not collapse without `min-height: 0`.** Grid
  items default to `min-height: auto`, flooring the track at min-content.
- **A page can be reachable in-app and broken by URL.** In-app navigation sets
  state and never consults `VIEW_ALIASES`. Pull-ups and Home workout rendered
  fine when clicked and bounced to Fitness on reload. No click-through test can
  see it — check the address bar and reload.
- **A hand-maintained list against a growing type will drift.** `mergeJournals`
  covered 28 keys and `JournalData` had more, so three collections were dropped
  silently on every merge. The guard now derives from `emptyJournal()`.
- **An effect keyed on navigation misses resize.** `SectionTabs` re-centred on
  `[view, gates]` only, so rotating left the page saying one thing and the tab
  row showing another — and a fresh load at the same width looked perfect.
- **A constant standing in for a measured value will be wrong.**
  `PageLayout` used 64px for a 99px header, so a 563px act column was sticky
  with its last 35px unreachable — the exact bug that code guards against.
- **Green tests do not mean shippable.** The photo-sync draft passed 764 tests
  and would have broken sync for every photo user; no test went near the payload
  limit. Read what the change *enables*, not just what it asserts.
- **The devtools screenshot can return a stale frame.** Two inline captures
  showed an unfolded header while the DOM measured folded. Save to disk when the
  picture matters; trust the measurement over the image.

## Environment

- Dev server was on :5200 this session; other worktrees hold 4173/5174/5199.
  The a11y gate spawns its own preview on :4173.
- `chrome-devtools` MCP worked; the `claude-in-chrome` extension was not
  connected.
- Demo data is persisted, not regenerated — re-seed via Settings → Data.
