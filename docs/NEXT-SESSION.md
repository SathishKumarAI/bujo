# Next session

> **2026-10-09 — FIRST, and it is not code: promote the deployment.**
>
> ```
> ! npx vercel promote bujo-bdyge3g4a-sathish-s-pickleball-cards.vercel.app
> ```
>
> **Fifteen PRs (#363–#377) are merged and none of them is live.** Production
> serves the 27 September build; the alias was never moved and **no deployment
> fired for any of the fifteen merges**, which means the GitHub→Vercel
> integration is not deploying and that is the thread to pull. The production
> build itself is fine — `dpl_3gygHvzWEu6japMoTQHx1Nxt5Dgf` is Ready and its
> bundle was verified to contain the project ref, "Continue with Google" and
> "not syncing yet". `vercel promote` is blocked by this sandbox's classifier,
> so the one command is the owner's.
>
> **SECOND: the Supabase redirect allow-list (COD-293).** Authentication → URL
> Configuration. Site URL is `http://localhost:3000`, and production and preview
> origins are both **rejected** — measured by sending a `redirect_to` and
> reading the `Location` back, where both came back as the Site URL. So a
> production Google sign-in **cannot complete**. Set Site URL to
> `https://bujo-journal.vercel.app` and add that origin's `/**`, the preview
> wildcard, and `http://localhost:4173/**` + `http://localhost:5173/**`. **Keep
> the localhost entries** — they are the only reason local sign-in works.
>
> Nothing below needs either of those done first. The rest of this session's
> state, including the four open decisions it deliberately did not guess, is in
> `STATUS.md`; what shipped and what it measured is in `WORKLOG.md`.
>
> **Joined the pile this stretch:**
>
> - **COD-304 — hover-to-navigate on the sidebar.** Asked for directly, filed
>   rather than built. Five hazards in the ticket; the short version is that a
>   190px rail means the pointer crosses up to nine rows on its way anywhere,
>   and a navigation nobody asked for cannot be undone by moving the mouse back.
>   **Prefetch on hover instead of navigating** gives the speed with none of it.
>   Recommended, not decided.
> - **Loading a coach session does not pre-fill reps and sets.** `loadRoutine`
>   makes one row per exercise name; the prescription stays visible in the
>   expanded session and is retyped. Worth doing, not obviously — a pre-filled
>   target is also a target you clear when the day goes differently.
> - **`Extension 20x5`** (coach session 27) has no muscle mapping and should not
>   get a guessed one. Held in `coachSessions.test.ts`'s `NOT_A_MOVEMENT` with
>   that reason, so it is a recorded question, not a silent gap. **Ask the coach.**
>
> **Cleared this stretch, so do not go looking:** the 18 worktrees are down to
> 1; COD-287 (hide the page header) shipped as "make it shorter instead", 67px →
> 49px; and the Google client secret that broke sign-in has been re-pasted.
>
> The 2026-10-05 note that headed this file is gone. #326 went green and the
> browser gates have run on every push since — `a11y` is 187/187 across 12
> shards. Removed rather than left, because an instruction that is already done
> reads exactly like one that is not, and this file's own rule is that it gets
> rewritten when it is picked up.

> **2026-09-30 — the stack this note used to open with is merged.** `#317` and
> `#318` both landed on 2026-09-30; the instruction to merge them bottom-first
> is kept only as the trap it records (squash-merging the bottom of a stack
> permanently closes the child, and GitHub will not reopen one whose base branch
> is gone — it is in `CLAUDE.md`).
>
> This queue was again NOT worked through — the #311–#318 stretch was the Cycle
> redesign and the Recovery ledger, neither of which is on it. Every item below
> is still open and still measured. Rewritten when picked up, not when passed
> over.
>
> **Joined the pile this stretch:**
>
> - **Any new card in a rail group is a11y-unchecked until driven per group.**
>   `npm run a11y` reported 173/173 green while the whole of Cycle Stages 5–7 sat
>   outside the number (COD-237). A throwaway probe over the four groups found a
>   real `scrollable-region-focusable`. This is a *process* item: it will keep
>   happening on every rail page until the gate itself can open a rail.
> - **Limit habits still use generic numeric copy** outside the habit row —
>   Insights and Trackers describe a ceiling as though it were a goal. Carried
>   from 2026-09-29, untouched.
> - **COD-261**, the `cat('overlay0')` tick at 3.55:1. Carried, untouched.
> - **`UrgeWin.stress` is captured and never rendered.** The field ships, the
>   logger does not ask for it yet, and `contrastOutcomes` reads it if present.
>   Small, and it completes a comparison that already works for HALT.
>
> **Numbers that moved:** Today is 1.4 desktop / 2.9 phone. Cycle is 1.4 / 2.9.
> Neither is near the top of any length list now.

Written 2026-09-27 at the end of the #287–#298 stretch, replacing the queue that
stretch worked through. Read `docs/PAGE-WORKFLOW.md` first for any page work.

**The job in one line: one page is twice as long as any other, and four gates
measure less than their output implies.**

---

## 1 · `mindset` is 8.8 screens on a phone, and now has no excuse

```
mindset   desktop 4.2 / 4.2 ⚠   phone 8.8 / 8.8   3 cards · 0 groups · 0 folds
```

**More than twice the next-longest page.** `open == shipped`, so nothing is
hidden — it is flat length. It has been carried for four stretches as "needs a
decision, not a primitive", because a rail had no rows to make.

**That is no longer true, and the reason is precedent rather than opinion.** Its
library is already tiled and grouped by **nine categories**; #279 put a rail over
five glossary groups on Help with real numbers, and #288/#289/#296 took Cycle,
Recovery and Focus through the same treatment with a measured win each time
(4.4 → 2.4 phone, 4.8 → 5.0 with content *added*, 5.7 → 3.7). **The nine
categories are the rail; the bands above it stay.**

Measure it, and if the rail does not move the phone number, say so and stop — the
lever here has always been removing content from the page rather than reflowing
it.

## 2 · COD-232 has a second head, and it is on seven pages

`space-audit` walks the rendered DOM, and a rail shows **one group at a time**. So
every space number quoted for a rail page is that one group:

| page | the page reports | measured on another group |
|---|---|---|
| nofap | 1.7 / 1.7 desktop | `patterns` **3.6** desktop, **7.5** phone |
| insights | 1.7 / 1.7 desktop | `mood` **2.65** desktop, **5.12** phone |

Seven pages now use `SectionRail`. The original COD-232 is the same failure for a
tab shell — Settings still reports 0.9, which is its Profile tab five times.
**One fix covers both: walk the groups.** The assertion that makes it work is
recorded there — poll `aria-selected` via `page.evaluate` after the click, because
reading it once through `locator.evaluate` was measured failing while the same
run's own dump printed `selected:true`.

Related and cheap: **`a11y` scans one group per rail page** (COD-237). Two agents
armed it for their own page with a throwaway probe (28 and 60 extra scans, all
clean), and #298 armed Insights permanently — taking the gate 166 → 173 scans and
finding **7 serious on the first run**. **Arm the other five rail pages**; those
probes are the template.

While in there: the summary now prints **"173 of 166 scan(s)"**, because the
planned total does not count the armed rail scans. Cosmetic, but a gate whose own
arithmetic reads wrong is one people learn to skim.

## 3 · The fold-walls still standing

```
view          folds   desktop shipped/open   phone shipped/open
coaching        20      2.4 / 2.4              3.3 / 3.2
pickleball       8      2.3 / 2.3              4.8 / 5.2
gym              5      1.9 / 3.4 ⚠            3.2 / 7.2
plan             4      2.0 / 2.0              3.4 / 3.4
today            3      2.6 / 3.6 ⚠            4.3 / 5.9
trackers         3      3.3 / 3.6 ⚠            5.3 / 6.0
```

**Coaching's 20 is a misleading number** — eighteen are a single-open accordion
(`Expand week 2…12`, `Expand <drill>`), and its open state is only 2.4 screens, so
there is no gap to close. The question there is whether a 12-week accordion is the
right shape, not whether it wants a rail.

**`pickleball` is the real candidate**: 8 folds, and `views/Pickleball.tsx` is
**1013 lines** — the shape `NoFap.tsx` was in at 929 before #289 took it to 332.
One pass buys both. `gym` next, on its 1.9 → 3.4 desktop gap.

## 4 · Two capture gaps that bound the analytics — COD-251

Both named rather than faked in #295, and both are now the ceiling on what
Recovery can show:

- **`Relapse` has a date and no time**, so there is no hour-of-day reading for a
  lapse. Only urges have one (`UrgeWin.at`).
- **`UrgeWin` has no addiction field** — it carries free text, so a per-addiction
  clock is a *name join*, and **`ADDICTION_PRESETS` offers "Nicotine" while
  `URGE_PRESETS` offers "Smoking"**: the two shipped vocabularies do not match, so
  a default user gets zero attribution. The card prints its coverage fraction
  (`3 of 5`) and names the missing label rather than drawing an empty grid.

The fix is capture-side and small: an `addiction` id on `UrgeWin` written at
capture time, and a time on a lapse. **Reconciling the two preset lists is the
cheapest half and should go first** — it makes a chart that already shipped start
working.

## 5 · The scenario taxonomy — designed, not built

#295's agent designed it and deliberately did not build it, because it adds a
field no journal has any of yet. The design and its sources are in that PR's
handback and are worth following rather than redoing:

`UrgeWin.scenario?: string[]`, optional, no migration, free-text `trigger` kept.
A `lib/scenarios.ts` keyed by normalised addiction name with a generic fallback.
**HALT is not merged into it** — NIAAA's *Rethinking Drinking* splits triggers into
*external* cues (people, places, times) and *internal* ones (thoughts, emotions);
HALT is the internal axis and a scenario the external, and the pair is worth more
than either. A fourth `ChipPick multi` shown **only once "What is it?" is
answered** (ten addictions × eight scenarios is eighty chips on a 5-screen page).
Single-hue `peach`, never categorical — COD-116. Under ~5 tagged urges, print
counts and suppress the percentage.

---

## Carried over, ranked

1. **The sync cluster — COD-136 / 137 / 139, the only data-integrity work on the
   board.** Self-host keys its row on `deviceId` so two devices never converge;
   the pull-then-push dance is written four times with four debounce values; Drive
   forgets its token on every reload. The argument for doing them is #281: a
   silent, unrecoverable delete shipped green through every gate, and the sync
   paths are where the next one lives.
2. **COD-228 — `bujo:sync` holds the passphrase in plaintext beside the
   ciphertext.** Needs a product answer first: encrypting it means auto-sync
   cannot run while locked. Both readings are in the ticket.
3. **COD-244 — `check-contrast` never measures against `--card`**, because
   `--card` is a `color-mix()` with no literal to read, and that is the ground
   most text in this app sits on. The baseline is clean, so this arms a green gate
   rather than opening a queue. **It also cannot catch a faded token at all** (see
   #297) — opacity on text is outside its reach by construction.
4. **COD-240 — `SectionRail`'s phone chips are 27–28px** across 39 buttons on
   seven pages. One primitive, one fix; COD-96's 44px floor is the standard.
5. **COD-247 / COD-248**, from the width pass. `NoFap.tsx` and `Cycle.tsx` pin the
   review grid to 2 columns (2 × 585 at 2560 where 3 × 383 fits) and it is **not a
   one-line delete** — on Recovery that pin is what makes #292's full-row panel
   work. Today's capture input stretches to ~1400px at 2560, because the 380px
   control cap is scoped to `.zone-act` and Today is not on that shell.
6. **COD-257 — `DailyMetric.energy` is written by the check-in and never by the
   seed**, so Insights' Momentum card ships a three-tile row nothing has rendered
   with data. The `data.cycle` trap again.
7. **COD-245 — 20 files past the 500-line ceiling**, 36 more between 300 and 500,
   and 7 directories over four files with no change→file README (`src/lib` has 158
   files and no map — the cheapest item on this list). Ranked in the ticket by
   what a split actually buys; **not** a list of twenty refactors.
8. **COD-116** — NoFap's 10-colour urge palette collapses (sky/sapphire dE 5.7 in
   latte). Live now that charts colour by addiction.
9. **COD-233 — `src/lib/validate.ts` is dead code whose own header says
   otherwise.** Also the honest answer to the "new email" ask: there is no email
   flow in this app, by design.

## Before you start

```
npm run dev -- --port 5300 --strictPort     the UI
npm run build && npm run preview            what the gates drive (:4173)
npm run space -- --all                      where the pages actually stand
npm run a11y                                2m48s at 4 workers, not 8m07s
```

**Start the browser gates in the background** — `CLAUDE.md` has a section on it.
Never `vite build` while one is driving your preview server.

**Confirm a preview port by its asset hash, not its `<title>`.** Every worktree
serves an identical title; one agent found 4195 serving a different worktree's
bundle. Compare the served `assets/index-*.js` against your own `dist/index.html`.

**Nine agent worktrees remain under `.claude/worktrees/`**, each holding a merged
branch — which is why those local branches could not be deleted on merge. One,
`agent-afa93cdc840c582e9`, is **not a git worktree**: a dead agent left a 770MB
plain checkout plus `node_modules`, and git resolves its working tree to the repo
root. Nothing was deleted; it needs a decision. Servers were left on 4173 and
several of 4181–4198.

## If you are running agents again

The pattern worked — twelve PRs, and the single most valuable finding of the run
came from an agent auditing an unrelated page. Four corrections, all learned here:

- **Give `scripts/` a single owner.** Two agents edited the gates at once and one
  had to revert.
- **`git diff main <branch>` lies about what a squash-merge applies** — it showed
  a whole merged PR being reverted. Use
  `git diff $(git merge-base main <branch>) <branch>`.
- **Nominate a `STATUS.md` owner, or it rots.** Four agents in a row declined to
  write it because others held branches, and it sat describing an unmerged PR for
  a day. Restraint from everyone is not a policy.
- **Brief them with the area's traps, not just the task.** That is what turned an
  unrelated Recovery audit into the data-loss fix, and what let two agents
  recognise the `page-enter` phantom instead of changing a colour token.
