# STATUS

**Stopped:** 2026-10-15, on `feat/pickleball-pass`, **twelve commits**, branched
off `feat/coaching-pass` (**PR #407**, still open). It stacks on that branch
because `lib/practiceLog.ts` and `components/coaching/PracticeTick.tsx` exist
only there. `refactor/homeworkout-panels` (**PR #405**) is also open and is not
a parent of either.

**Merge order matters:** rebase this onto `main` with
`git rebase --onto main <old-base-sha> feat/pickleball-pass` and retarget its
PR **before** merging #407, or squash-merging the parent permanently closes the
child (CLAUDE.md — it already cost #145/#147 being re-created as #148/#149).

## The Pickleball pass · COD-328

Applied `docs/REUSABLE-PATTERNS.md` — the Pull-ups, Home Workout and Coaching
patterns — to the last sport page still on the legacy shell.

| commit | what |
|---|---|
| `ad1425d` | the act stops re-teaching what Coaching owns |
| `1d98576` | one sentence at the top says what to do next |
| `a2d1234` | the record packs two across at 1440, not one |
| `b9023e3` | the record is a bar with sub-sections, not a column |
| `7f5ada8` | the page moves onto the shared three-zone shell |
| `731ee07` | one concern per file, under the 500-line ceiling |
| `2ba93ed` | the prep checklist is reachable by the gate; the demo gets a future event |
| `2c6538a` | the last user-visible "bujo" strings say Cadence |
| `23e18b9` | the log can be put away; nothing overflows; chips say what they are |
| `35f5fe4` | panels scale with the column; the weekday card is readable; figures lead back to your entries |
| `0e51a11` | hiding the log scales at every width; Results/Activity replace Performance/Trends |
| `9134156` | today's drill joins the stat bar; the rail reads in order |

### The page now

`PageLayout` tier 1180, same as Home Workout and Pull-ups:

- **zone 2** — Log a session, in the sticky 38% column, with a **Hide the log**
  toggle that gives the width back (`PageLayout collapsibleAct`).
- **zone 1** — one bordered block: the `nextStep` sentence, four totals, and
  **Today's drill** (merged in, asked for as "one single space"). It is not
  part of the record, so it does not sit in it.
- **zone 3** — `components/pickleball/Review.tsx`: one bar of five rows in
  reading order — **Results · Sessions · Activity · Matchups · Competition** —
  with sub-section chips inside the rows big enough to need them. The page
  OPENS on Sessions, which is the thirty seconds after you press Log session;
  the order is for finding things.

Measured at `?demo=1` against the preview server, both viewports:

| | before the pass | after |
|---|---|---|
| desktop landing | 2568px · 2.85 screens | **1136px · 1.26** |
| phone landing | 4200px · 4.98 screens | **2598px · 3.08** |
| desktop, worst panel, log open | 2.85 | 2.90 (Activity) |
| desktop, worst panel, log hidden | — | **1.92** (Results) / 1.77 (Activity) |
| review width, log hidden, 1920 / 2560 | — | 1590 / 1926 (was 1062 / 1398) |
| a sub-section picked | — | 338–397px |
| `views/Pickleball.tsx` | 1233 lines | 406 |
| `<details>` in `#main` | 1 (invisible to the gate) | 0 |

**a11y, per panel, because the gate cannot reach a rail's other rows**
(COD-237). A throwaway probe drove all five rows at five desktop themes and two
phone themes — **35 scans, 0 serious, 0 critical** — with the gate's own waits
copied (theme asserted on the root, folds to four passes, lazy content
revealed, a `settle()` immediately before axe). It was **armed on a planted
violation first**: with `BUJO_CANARY=1` the same run reports 8 criticals, so
its green means something.

### The second and third rounds, after the first look

Reported and fixed, each measured: the demo banner's 24px overflow (every page
scrolled sideways on a phone), placeholders wider than their inputs, chips that
were sentences, a bar that wrapped to three lines, the weekday card as seven
44px tiles with colour that said nothing, zone 1 as three rows for two facts,
`CardGrid` giving 353px cards whatever the panel width, and — only above a
1680px viewport — `layout.css`'s second column rule re-asserting `1fr 32rem`
with the log hidden, so the review sat beside a 512px empty track.

Also: five cards had never been rendered by any gate because the seed wrote no
location, opponent, level or points; `nextStep`'s lapse rule now opens Activity;
every weekday, partner and venue opens Sessions filtered to it.

### Next action

1. **PR #408 is open and pushed.** Rebase onto `main` and retarget it BEFORE
   #407 merges, or GitHub closes it permanently.
2. Gates all green at `9134156`: `npm run verify` (1986 tests / 145 files),
   `npm run design` (456 files), `npm run contrast`, and the new
   `npm run a11y:panels` (35 scans, armed on a canary).
3. The throwaway probes are gone; the axe one is `scripts/a11y-panels.mjs`,
   which COD-237 asks for on five more pages.

### Traps found in it, worth not re-learning

- **A rail panel is a page-split column.** `MasonryGrid` breaks on its
  container at 64rem; the panel beside a 13rem rail is **870px at 1440**, so
  seven cards drew one column while the class list said two. `CardGrid` asks
  about the viewport, which is the right question when the width is decided by
  the page split: **1561px → 1022px**, then → full width as a bar.
- **A conditional card the demo cannot reach is a card no gate has ever
  seen.** Every seeded `pickleballEvents` row was in the past, so
  `upcomingEvents` was empty and the countdown card, its prep checklist and
  the `event` branch of `nextStep` rendered for nobody. Seeded at +9 days;
  `DEMO_VERSION` 18 → 19, because demo data is persisted, not regenerated.
- **A raw `<details>` is invisible to `npm run a11y`** — the third disclosure
  implementation in this repo to learn it.
- **Order a priority list by urgency and check it against real data.** The
  next-step sentence shipped as event → goal → lapse and the demo journal
  immediately produced "12 more games this week and you hit your goal of 12"
  ten days into a silence. Lapse outranks goal now.
- **One source for a chip and the card it counts.** `has` is a map of
  booleans read by both, so a sub-section chip cannot select an empty panel —
  the failure mode of every hand-written id list this repo has had.
- **A component declared inside a render is a new type every render.** `Facet`
  as a closure remounted every chart on each keystroke-level re-render; eslint
  names it `no-create-component-during-render`.

### Open questions for the owner

- The phone's worst panel is Activity with every sub-section showing. Picking
  one takes it under 1.5 screens. Should a phone default to a sub-section
  rather than All?
- With the log OPEN the review is one column, so a short card (Recent form
  fills 0.48 of its box) looks sparse at 702px. Two columns there would be
  331px, which is the width this pass spent three rounds getting rid of. A
  dense/span rule could pair short cards; it has not been written.
- `PracticeTick` writes under one key space shared with Coaching, so ticking
  "Figure-8" here and in the manual is one record. That is deliberate; if the
  two pages should ever count separately, the key needs a surface.
