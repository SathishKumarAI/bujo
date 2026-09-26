# Plan · the platform pass

**Written** 2026-09-26, at the start of the run that follows #277.
**The ask, in the user's own framing:** stop being a journal with tabs and
become a platform an individual can live in — which here means four concrete
things, none of them a redesign for its own sake:

1. The pages that are *gendered* — Cycle for women, Recovery for men — are the
   two with the most domain knowledge and the least explanation on screen.
2. The app speaks in abbreviations (`pms`, `bbt`, `dupr`, `rpe`, `halt`) that a
   first-time reader, or someone being shown a demo, cannot decode.
3. Settings is a tab shell, and the audit that says it is 0.9 screens only ever
   measured the tab it opens on.
4. The data the user already has — Apple Health on an iPhone — is typed in by
   hand today, temperature most painfully.

Plus the queue that `docs/NEXT-SESSION.md` was already carrying, and the gate
that takes long enough that people stop running it.

Read `docs/PAGE-WORKFLOW.md` before any page work. Measure first; the numbers
in the table below are the ones to beat, and every one of them came from
`npm run space -- --all` on `main` at the start of this run.

---

## The baseline, measured 2026-09-26 on `main`

| view | desktop shipped / open | phone shipped / open | cards | groups |
|---|---|---|---|---|
| cycle | 1.9 / 2.8 | 4.1 / 6.3 | 8 | 1 |
| nofap (Recovery) | 1.8 / 4.7 ⚠ | 4.2 / 7.7 | 16 | 3 |
| settings | 0.9 / 0.9 | — | 2 | 0 |
| focus | 3.4 / 3.4 ⚠ | 5.7 / 5.7 | 6 | 0 |
| mindset | 4.2 / 4.2 ⚠ | — | 3 | 0 |
| gym | 1.7 / 3.4 ⚠ | 3.2 / 7.2 | 17 | 5 |

**Settings' 0.9 is a lie by omission** and is itself a finding: the view is a
tab shell (`AppearanceTab`, `DataTab`, `RemindersTab`, `SyncTab`,
`ProfileTab`), the audit walks the DOM, and the DOM holds one tab at a time.
Every space number ever quoted for Settings measured whichever tab it opens on.
Any pass on it must measure **per tab**, by driving the tab control.

Gates on `main` at the start: `npm run clipped` **red, 9 findings** (fixed by
the first branch of this run), `npm run verify` green, 1181 tests in 91 files.

---

## Work packages

Each is one branch, one PR, its own verification. They are ordered by
dependency, not by size. WP1 blocks WP2; nothing else blocks anything.

### WP0 · `fix/clipped-gym-cycle` — the queue's open red · **done**

`npm run clipped` 9 → 0. Gym's last-session rows lost the exercise name to a
`shrink-0` set strip (`min-w-0` is also what stopped the row wrapping); Cycle's
symptom grid divided 352px across 31 columns and clipped every two-digit day
label. Plus Pickleball's forecast: the clamp made a 71% win rate print
"Projected 100%", so `winRateForecast` now returns `clamped` and the tile says
"Trend ceiling" with a line explaining the cap.

### WP1 · A glossary the app can point at — **blocks WP2**

The trigger: Cycle's day editor offers a chip that says `pms`, and the person
being shown the app asks what it means. The same is true of `bbt` on the chart,
`dupr` and `rpe` on Pickleball, `halt` on Recovery, `1rm` and `amrap` in the
gym.

- `src/data/glossary.json` — one entry per term: `term`, `short` (the
  expansion), `long` (a sentence or two), `domain`, optional `source`.
  **JSON on purpose**, so the list is editable without touching a component and
  so Help and the inline marker cannot disagree about what a word means.
- `<Abbr term="pms">` — renders the abbreviation with a superscript ⓘ; press or
  hover reveals the expansion. Must be a real control (focusable, named,
  dismissable), not a `title` attribute — `title` does not exist on touch.
- A glossary section on **Help**, generated from the same JSON, so there is one
  place to read the whole list.
- Adopt it at the call sites that motivated it, starting with Cycle's flag
  chips.

### WP2 · Cycle — the parts a calendar cannot explain

Three things, in one page pass. Depends on WP1 for the abbreviation marker.

- **A libido / drive counter.** A per-day 0–5 rating on `CyclePoint`, logged in
  `DayEditor` beside temperature, and then *used*: averaged by phase, so the
  page can say where in the cycle drive actually peaks for this person rather
  than where a textbook says it does.
- **A legend that says what the colours mean.** Five flags carry five hues
  across four components (`flags.ts`) and nothing on the page decodes them.
  Ovulation in particular: what it is, how it differs from the neighbouring
  phases, and what the temperature shift has to do with it — as a diagram, not
  a paragraph.
- **Phase-by-phase food and cravings.** `lib/cycleGuide.ts` already holds the
  four phases with `what` / `feel` / `tip`; this extends it with what the
  cravings usually are and what is worth eating, **with its sources named and
  linked on screen**. Formatted properly — the repo already has `.prose-doc`
  for exactly this.

### WP3 · Recovery — log the day, not just the streak

Today Recovery records a *relapse event* and a *resisted urge*. What it cannot
record is the shape of an ordinary day: that there were three cigarettes, or
that it happened once. Without a quantity there is no "Sundays average ten",
and that sentence is the whole point of tracking it.

- A one-tap day logger per tracked addiction, with a count where a count makes
  sense (cigarettes) and a plain tally where it does not.
- Quantity on the existing `Relapse`/addiction shapes — **additive and
  optional**, so every journal already written keeps working.
- The insight that pays for it: by weekday, by hour where the data allows,
  against the streak.

### WP4 · Settings — measure every tab, then fix the worst

The pass the user asked for ("a lot of scrolling, a lot of empty space, and the
width is not used"), on a view whose numbers nobody has actually taken. Measure
each tab, then apply `docs/PAGE-WORKFLOW.md` — and note that the workflow
records **widening and stacking as measured failures**, so neither is the
answer to a dead column.

### WP5 · Apple Health import

An iPhone already holds basal temperature, steps, sleep, heart rate and weight.
Health exports one zip with one `export.xml` inside. Drag it onto the app and
the domains it can fill, fill themselves.

Data-shaped, so it goes to the `data-engineer` agent: a parse-and-map pipeline
with a preview and an explicit merge policy, never a silent overwrite of
hand-logged data.

### WP6 · The a11y gate is slow enough that people stop running it

5 desktop themes × 24 views + 2 phone themes × 24 views ≈ **170 scans**, each
navigating, opening every fold up to four passes deep, and running axe — all on
one page, one after another. The fix is concurrency, not fewer assertions: the
assertions are what make the gate worth having (see CLAUDE.md).

And while in there: `space-audit.mjs` reads `BASE_URL` while every other script
reads `BUJO_URL`, which is how a sharded run ends up pointed at the wrong
preview server.

---

## How this run is executed

Parallel agents, each in its own git worktree, each handed the traps for its
area up front. **No agent merges its own work**; each hands back a branch and a
PR number, and they land in dependency order after their gates are read.

One worktree per agent is not optional — sharing one means an agent checks out
a branch underneath another's uncommitted work.

Each agent runs its own preview server on its own port. `BUJO_URL` /
`BASE_URL` must point at it: two agents on 4173 measure each other's app, and
the smoke-gate history in CLAUDE.md is what that looks like when nobody
notices.

## Questions that are deliberately not being guessed

Recorded here rather than blocking. Defaults taken are stated in each PR.

- **Focus and Mindset** (`docs/NEXT-SESSION.md` item 2) still need someone to
  say what their sections *are*. Not invented here.
- **`bujo:sync` in plaintext beside `bujo:enc`.** Encrypting it means auto-sync
  cannot run while the journal is locked. Product decision, still open.
- **Apple Health merge policy** where a day already has a hand-typed value.
  Default taken: the hand-typed value wins and the import says how many it
  skipped.
