# 15 · One place for fitness — phased plan

**Branch:** `docs/page-contract-rollout-plan` · **Date:** 2026-08-24
**Supersedes the sequencing in** `13-page-contract-rollout.md` (its Phase 1 is
done, and its premise about `main` was wrong — see below).
**Desktop is the only target for these phases.** Phone is not regressed, but it
is not what gets looked at or screenshotted until this plan finishes.

## Two corrections to the record

**1. The page primitives were already on `main`.** `13-page-contract-rollout.md`
line 85 and `STATUS.md` line 19 both said `PageLayout` and every primitive lived
only in PRs #113–#123, and that Phase 2 was blocked until they landed. They were
on `main` the whole time — `src/components/page/` has all eleven files, and
Fitness, Plan, Nutrition, NoFap and KitchenSink import them on `main`. What the
eleven PRs actually carried is the **Modernist look** (bands, radius 0, shell and
nav), which is a different thing.

The mistake was reading an adoption count as a distribution problem without
checking the branch the count was taken on. `STATUS.md`'s own last trap — *judge
a UI on the right branch* — applies in both directions.

**2. The chain tip never converted the four target pages.** Measured:

```
Today Insights Stats Trackers → 0 `components/page` imports on chore/tab-work-followups
```

It restyles them (34–58 lines each) and does not restructure them. So the
conversion work is still owed regardless of the merge, and those four files are
the conflict surface between the chain and this plan. That is why the chain was
merged first.

## Where the fitness cluster actually is

`SECTIONS` in `src/components/shell/sections.ts` already makes **Body** the
fitness destination. After the chain lands it holds:

| Tab | View | Lines | Notes |
|---|---|---|---|
| Fitness | `Fitness.tsx` | 341 | ✅ already on `PageLayout` |
| Strength | `Gym.tsx` | 709 | the workshop — picker, plates, muscle map, photos |
| Pickleball | `Pickleball.tsx` | 633 | a real surface, not an activity — has its own record type |
| Coaching | `Coaching.tsx` | 285 | |
| Nutrition | `Nutrition.tsx` | 306 | ✅ already on `PageLayout` |
| Program | *(#122)* | — | arrives with the chain |
| Challenges | `Challenges.tsx` | 283 | moves here from Insights in #122 |
| Recovery | `NoFap.tsx` | — | gated | 
| Cycle | `Cycle.tsx` | — | gated |

Companions, reachable but not tabbed: `Pullups.tsx` (146), `HomeWorkout.tsx`
(143), `FitnessHub.tsx` (142).

**So "everything for fitness in one place" is 80% already true.** The two things
genuinely outside it:

- **Trackers** (`Trackers.tsx`, 1013 lines — the largest view in the app) sits
  under **Insights**. Habit tracking is where gym attendance, protein and
  steps get logged, so the daily tracking loop is split across two sections.
- **Stats** likewise sits under Insights, and most of what it charts is body data.

That is the IA question this plan answers — and it is a *move*, not a rebuild.
Per the contract: **relocate, never delete**, and `?view=` must keep working.

## Do not reinvent: two data sets worth adopting

Both replace hand-maintained lists in this repo. Both are additive — the
existing local list stays as the offline seed, because this app is local-first
and must work with no network.

| Source | License | Replaces | Why it wins |
|---|---|---|---|
| **[Open Food Facts](https://world.openfoodfacts.org/data)** search + barcode API | ODbL, free, **no API key**, CORS-enabled | `src/lib/foods.ts` — 50 hand-typed items whose own header admits *"for anything not here, the card links out to a web search so you can look it up and type it in"* | ~3M products, barcode lookup, per-100g macros. Turns a dead end into a search field. No dependency: `fetch` + JSON |
| **[free-exercise-db](https://github.com/yuhonas/free-exercise-db)** | **Unlicense** (public domain) | `EXERCISE_LIBRARY` in `src/lib/fitness.ts:100` | ~870 exercises with muscle groups, equipment, force, level and images. Static JSON — bundle a subset or fetch once and cache. No API, no key, no runtime dependency |

**Rejected, with reasons** — so this is not relitigated next session:

- **wger** — a full self-hosted Django server. Adopting it means running a
  backend for a local-first PWA that deliberately has none. Its *exercise
  dataset* is CC-BY-SA, which is fine, but free-exercise-db is public domain and
  needs no attribution plumbing.
- **Nutritionix / Edamam / USDA FoodData Central** — all require an API key.
  A key in a client-side PWA is a published key. Open Food Facts needs none.
- **Any charting or dashboard library.** The repo already renders its own
  visuals on its own tokens. Adding one would undo the accent discipline
  `14-dashboard-inspiration.md` just argued for.

**The rule for both:** the network source is an *enrichment path*, never the
only path. Offline must still log food and still pick an exercise. Cache what
is fetched into the journal record itself, so a food logged today still reads
correctly in five years when the API is gone.

## The phases

One phase per session. Each ends with the app working, screenshots taken at
desktop width, the gates run, and a handoff written. Stop after any.

### Phase A — Trackers moves into Body *(next session)*

The single largest IA win and the smallest code change. `Trackers` is 1013
lines and lives under the wrong section.

1. Move `{ view: 'trackers', label: 'Tracking' }` from the `insights` section to
   `body` in `sections.ts`. Order it after Fitness.
2. **Check every list that names a route id** — `BottomNav`'s `PRIMARY` is
   silently filtered against the sidebar items, so a moved id can drop a phone
   tab with no error (`CLAUDE.md`). Also check the command palette and any tour.
3. Do **not** rewrite `Trackers.tsx` in this phase. Moving and restructuring in
   one commit means neither can be reviewed.
4. Verify `?view=trackers` still resolves and still lights the right rail row,
   by reloading the address bar — not by clicking.

Prompt:

> Move the Trackers view from the Insights section to the Body section in
> `src/components/shell/sections.ts`, placed after Fitness and labelled
> "Tracking". Do not change `Trackers.tsx` itself. Then find every other list
> that resolves a view id — `BottomNav`'s `PRIMARY`, the command palette,
> onboarding, `deepLink` aliases — and confirm none of them silently drops the
> moved id. Reload `?view=trackers` in the address bar and confirm the Body rail
> row lights. Run `npx tsc -b`, `npx vitest run`, `npx eslint .`, `npm run build`
> and quote the output.

### Phase B — Trackers on the page contract

1013 lines, and the page it should be is: orient (how many habits alive, today's
completion), act (log today), review (the heatmap, the list). Write the slot
table before any code. Target: ≤ 2 raised cards, one accent.

### Phase C — Nutrition gets Open Food Facts

Keep `FOODS` as the offline seed. Add a search field that queries Open Food
Facts when online, writes the **resolved macros into the journal record** (never
a product id alone), and falls back silently to the local list offline. One
`fetch`, no dependency. Test: a logged food still reads correctly with the
network stubbed out.

### Phase D — Strength gets free-exercise-db

Replace `EXERCISE_LIBRARY` with the public-domain dataset, keeping the existing
`musclesForExercise` mapping working — that mapping feeds the muscle map and is
the part that will break silently. `fitness.test.ts` exists; extend it before
swapping the data.

### Phase E — Insights, Stats, Today on the contract

What is left of `13-page-contract-rollout.md` Phase 2 once Trackers has moved.
Insights is the worst offender by measurement: 17 cards against a cap of 2, six
accent colours against one.

### Phase F — Sweep

Card and accent greps per page, then the gates, then open the app. The traps are
listed in `13-page-contract-rollout.md` Phase 5 and are all still live —
especially that `scripts/a11y-axe.mjs` walks a fixed `VIEWS` list, and axe cannot
see inside a collapsed fold.

## Validation, every phase

```
npx tsc -b          # NOT --noEmit — root tsconfig is solution-style, always exits 0
npx vitest run
npx eslint .
npm run build
npm run a11y        # re-run with new folds OPEN
```

Then open the app at desktop width in light and dark, and confirm the dev server
is serving *this* working copy — check the port's process command line before
believing a screenshot.

## Not verified in this document

- The Body tab list above is read from `sections.ts` on `main` **plus** what
  #122's title says it adds. Re-read `sections.ts` after the chain finishes.
- Open Food Facts' CORS behaviour and rate limits are from its public
  documentation, **not measured from this app**. Phase C must confirm a real
  request from the browser before the UI is built around it.
- No screenshots were taken this session. Nothing here is a claim about how a
  page currently looks.
