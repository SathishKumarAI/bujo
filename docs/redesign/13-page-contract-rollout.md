# 13 · Rolling the page contract onto the other 24 views

**Branch:** `docs/page-contract-rollout-plan` · **Date:** 2026-08-23
**Audited against:** `origin/chore/tab-work-followups` (PR #123, the Modernist
chain tip) — **not** `main`, which does not contain any of it.

The app does not have a design problem. It has a **distribution** problem.

The three-zone contract is built, documented and proven. Four views use it.
Twenty-four do not, and every view that reads as a flat stack of cards is in
the second group. Nothing below proposes a new design system; it proposes
finishing the rollout of the one that already exists.

## What already exists

`src/components/page/` on the Modernist tip:

| Primitive | What it owns |
|---|---|
| `PageLayout` | The three zones. Container query, not viewport — collapsing the sidebar cannot flip the layout. Measured sticky that falls back to static when the act column outgrows the scrollport |
| `StatBar` | The orient bar |
| `SummaryStrip` | Review-zone summary |
| `EmptyFrame` | Empty states as frames |
| `DisclosureRow` | The single "More" row |
| `CalendarHeatmap` | Accessible grid (`<table>` + headers) |
| `ActivityForm`, `NumField`, `draft.ts` | Act-zone form pieces |

`PageLayout`'s own docstring is the contract, verbatim: *"There is no zone 4.
Content that fits none of the three belongs on another page."*

## The audit

### Adoption: 4 of 28

| Uses `PageLayout` | Does not |
|---|---|
| Fitness, Plan, Nutrition, NoFap | Today, Insights, Stats, Trackers, Gym, Monthly, Goals, Mindset, Reading, Collections, Focus, Cycle, Challenges, Coaching, Pickleball, Pullups, HomeWorkout, Program, FitnessHub, Settings, Account, Help, Welcome, KitchenSink |

### Contradictions, counted

Contract caps: **two raised cards per page**, **one accent in four appearances**.

| Page | `<Card>` | Distinct `cat()` accents | Over by |
|---|---|---|---|
| **Insights** | **17** | **6** — green, mauve, peach, red, sapphire, yellow | 8× cards, 6× accent |
| **Stats** | 11 | 5 — crust, mauve, peach, sky, teal | 5× cards |
| **Trackers** | 2 + 1 raised | **9** — effectively the whole palette | 9× accent |
| **Today** | 8 (4 + 4 in `today/cards.tsx`) | 3 | 4× cards |
| Plan | 2 | 3 | at the card cap |
| **Fitness** *(converted)* | **0** | **0** | — |

Fitness renders **zero cards and zero hardcoded accents**. Its structure lives
in `PageLayout` and its colour comes from tokens. That is the target state, and
it is already in the branch — this is a measured result, not an aspiration.

The contract's own words for the symptom: *"a row of six stat tiles in six
different hues is not six insights; it is one insight and five distractions
competing for the same glance."* Insights has six. Trackers has nine.

### Why the reference dashboards look calmer

Measured live from the shadcnstore dashboard-2 template the look was
requested from:

| Token | Its value |
|---|---|
| `--background` | `oklch(0.145 **0** 0)` |
| `--card` | `oklch(0.205 **0** 0)` |
| `--primary` | `oklch(0.922 **0** 0)` |
| `--radius` | `0.625rem` (shadcn default, untouched) |
| `--font-sans` | stock Tailwind stack, renders Inter |

**Chroma zero on every neutral.** Its restraint is what reads as polished, not
its typeface. bujo ships Fraunces, Instrument Sans, JetBrains Mono and Caveat,
five hand-built themes and a documented contrast pass — swapping to Inter would
make it *more* generic, not less. The gap is accent discipline and
numbers-first density, both of which the contract already specifies.

## The plan

Five phases. Each leaves the app shippable; stop after any one.

### Phase 1 — Merge the Modernist chain

PRs **#113 → #123**, bottom-up, in order. `PageLayout` and every primitive
above live in those PRs; until they land on `main` the later phases have
nothing to import.

As of 2026-08-24 all eleven are `MERGEABLE` / `CLEAN` with CI `SUCCESS`. There
is nothing to fix first — only the eleven merges, in order.

**Use merge commits, not squash.** Squashing a stacked PR rewrites the parent's
commits under a new SHA, so the child still carries the originals and conflicts
add/add against them. This cost a recovery on #125 — see D-49 and the note
below. Merged with merge commits, #126 needed zero rebase and zero force-push.

**Do not pass `--delete-branch` while a child PR still targets the branch.**
GitHub auto-closes any PR whose base branch is deleted, and a closed PR cannot
be retargeted or reopened until the base ref is restored.

### Phase 2 — Convert the four pages that are actually looked at

Today, Insights, Stats, Trackers. Write each page's slot table *before* any
code: route, job, primary object, container tier, zone contents, signature
visual, where the single accent is spent, empty state, and what moves off.

Target: Insights 17 cards → ≤ 2, six accents → one.

These four are the cheapest large win — the primitives exist, so this is
adoption, not construction.

### Phase 3 — The stat band

The density the reference template has, built on bujo's tokens: tabular
numerals, tight tracking, a delta pill, one line of verdict. Fraunces for the
numerals — that is the part that makes it bujo and not another Inter dashboard.

**Extend `StatBar`, do not fork it at the call site.** Needing a variant means
Stage 2 under-abstracted; the fix belongs in the primitive.

### Phase 4 — Body's eight tabs, then the remaining 20 views

Body at eight tabs is the ceiling STATUS.md already recorded, and a tab row
mixing surfaces with the items inside them is the IA failure the contract names.

Two traps that apply here specifically, both already in `CLAUDE.md`:

- `BottomNav`'s `PRIMARY` list is **silently filtered** against the sidebar
  items. Retiring a nav id drops its phone tab with no error.
- Navigation is state plus `?view=`, and in-app clicks never consult
  `VIEW_ALIASES`. A retired destination must rewrite on read, or the page works
  when clicked and 404s on reload. Check the address bar, then reload.

Relocate, never delete: a retired *destination* is not a retired *feature*.

### Phase 5 — Sweep, then distrust the sweep

Greps for card count and accent count per page, then:

| Gate | The trap |
|---|---|
| `npm run a11y` | axe cannot see inside a **collapsed fold**. Re-run with new folds **open** — a critical `select-name` shipped for months this way |
| `scripts/a11y-axe.mjs` | visits a fixed `VIEWS` list. **Add every converted page** or "0 serious" means only "for the pages that were opened" |
| `npm run design`, `npm run clipped` | — |
| `npx tsc -b` | **not** `--noEmit` — the root tsconfig is solution-style and always exits 0 |
| Tailwind v4 | does not fail the build on a stale utility class. It exits 0 and emits no CSS; the element silently inherits |

Then **open the app** at wide and narrow width in all five themes. Confirm the
server is serving *this* working copy — this repo has had several worktrees on
different ports, and a tab pointed at the wrong one never shows the change.

Fold in the **print fix** here: printing currently emits near-white text on
white paper. `print-color-adjust` is `economy`, so Chrome drops the dark surface
(which sits on a `div`, not `body`), while the text keeps `rgb(205,214,244)`.
The lazy fix reuses the existing `latte` theme: swap `data-theme` on
`beforeprint` and restore on `afterprint` — one listener covers Ctrl+P and the
Settings button both. `ExploreBanner` is a `div`, so `header, nav {display:none}`
misses it; it needs a `no-print` class.

## What this plan is not

- Not a new design system. Every primitive it needs already exists.
- Not a font change. Fraunces stays.
- Not a rebuild of the Modernist work — that work *is* phase 1.

## Not verified

The card and accent counts are **greps over source** on the Modernist tip, read
without running it. A card rendered through a helper would not be counted. The
contract's own Stage 6 warning — grep the feature, not the prop that feeds it —
applies to these numbers as much as to anything else. Confirm on the rendered
page before treating any single figure as final.

Adoption (4 of 28) is a `PageLayout` import check and is reliable.
