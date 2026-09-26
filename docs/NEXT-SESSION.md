# Next session

Written 2026-09-26 at the end of the #278–#286 stretch, replacing the queue that
stretch worked through. Read `docs/PAGE-WORKFLOW.md` first for any page work —
it is the method these tasks assume, and the order in it is what saves time.

**The job in one line: three pages are now over budget on a phone, and one gate
still cannot see the view it is pointed at.**

---

## 1 · `mindset` is 8.8 screens on a phone — the worst page in the app

Measured on `main` after this stretch:

| | shipped | open | cards | groups |
|---|---|---|---|---|
| desktop 1440 | 4.2 | 4.2 ⚠ | 3 | **0** |
| phone 390 | **8.8** | **8.8** | 3 | **0** |

Nothing folds, nothing groups, and it is nearly nine screens on the device it is
most likely to be read on. Note the shape: **zero disclosure groups and three
cards**, so this is not a fold-wall and the rail is not the obvious answer.

`docs/NEXT-SESSION.md` carried this page for two stretches as "needs a decision,
not a primitive", and that is still true — but the decision got smaller since it
was written. The library is already tiled and grouped by nine categories, and PR
#279 put a `SectionRail` on Help's glossary over exactly five such groups with a
measured before/after (open 3.3 → 2.5 desktop, 6.8 → 5.1 phone). **The nine
categories are the rail; the bands above it stay.** That is a concrete proposal
rather than an invented grouping, so it no longer needs asking about first —
but measure it, and if the rail does not move the phone number, say so and stop.

## 2 · Settings' gate blindness — COD-232, and the cheap half is identified

`npm run space -- settings` still reports **0.9 shipped / 0.9 open** on `main`,
and that is the Profile tab measured five times. Both rendering gates only ever
grade the first tab of a tab shell.

Two halves, and the cheaper one is not the one in the ticket title:

- **Seed the default-off switches.** `reminderEnabled: true` in `src/lib/demo.ts`
  makes that whole branch render for every gate on every run, and it is
  local-only so it triggers no network. It is what hid a real `label` violation
  through the gate's entire existence. **`weatherEnabled` and `foodLookup` need
  more thought** — both reach outside the device, and a gate that makes live
  requests is a different problem. This was held back only because three
  branches were editing `demo.ts` at once; nothing is in flight now.
- **Walk the tabs.** The larger half. `aria-selected` must be asserted after the
  click and **polled** via `page.evaluate` — reading it once through
  `locator.evaluate` was measured failing while the same run's own dump printed
  `selected:true` three lines lower. Without that assertion the walk scans one
  tab N times and reports it clean, which is how this was nearly dismissed as
  overstated.

Two more from the same report, both still true: `space-audit.mjs` never sets
`bujo:onboarded`, so it measures under the onboarding modal and cannot click
anything; and `NAV_SELECTOR` in `a11y-axe.mjs` does not match
`main [role="tab"]`.

## 3 · COD-235 — the a11y gate passes for a theme that does not exist

`setTheme` asserts a theme applied by reading `data-theme` back, and the app
writes that attribute verbatim. So `BUJO_THEMES=mocha,bogus` scans 23 views as
"bogus" and reports them clean. Pre-existing, and the serial script did it too.

Same family as everything else on this list: **the assertion checks that the
gate did something, not that the app did.** Assert a resolved token instead — a
`--color-*` value that differs between themes — so a theme with no stylesheet
fails instead of passing.

## 4 · The pages still over three desktop screens

Measured on `main`, desktop 1440, after this stretch:

| view | shipped | open | what the numbers say |
|---|---|---|---|
| `mindset` | 4.2 | 4.2 ⚠ | item 1 above |
| `focus` | 3.5 | 3.5 ⚠ | 6 cards, **0 groups**, 5.7 on a phone. Same shape as mindset: the timer, the log form and the analytics are three jobs sharing one scroll, and the analytics half is the rail candidate. Still needs the grouping named. |
| `trackers` | 3.1 | 3.6 ⚠ | 9 cards in 1 group, 5.0 on a phone |
| `today` | 2.5 | 3.6 ⚠ | the capture page; be careful |
| `cycle` | 2.5 | 4.8 ⚠ | **COD-230, deliberately still open** — see below |
| ~~`nofap`~~ | ~~1.9~~ **1.7** | ~~4.8 ⚠~~ **1.7** | **Done** — a `SectionRail` over four registry groups replaced three shut folds. `open` now *equals* `shipped`: nothing left on the page to open. Phone 4.8 / 8.2 → 4.7 / 4.7. COD-61. |
| `gym` | 1.7 | 3.4 ⚠ | 5 groups already open, no gap to close |

**COD-230 stays open and the work on it is already done once.** #286 folded
Cycle's phone month list for **−956px** (without it, shipped would be 5.5
instead of 4.4), and splitting at 390 was measured **impossible** rather than
argued away: a row's min-content is ~227px against 167px available. 4.4 is still
not under 3. The remaining lever is removing content from the page, which is the
one that has worked every time in this repo — not a wider tier and not stacking,
both measured worse on ten and seven pages respectively.

---

## Carried over, ranked

1. **The sync cluster — COD-136 / 137 / 139, untouched for several stretches and
   the only data-integrity work left on the board.** Self-host keys its row on
   `deviceId` so two devices never converge; the pull-then-push dance is written
   four times with four debounce values; Drive forgets its token on every
   reload. #281 is the argument for doing these: a silent, unrecoverable delete
   shipped green through `tsc`, eslint, vitest and the build, and the sync paths
   are where the next one lives.
2. **COD-228 — `bujo:sync` holds the passphrase in plaintext beside the
   ciphertext it unlocks.** Needs a product answer before any code: encrypting it
   means auto-sync cannot run while the journal is locked. Both readings of what
   the passcode is for are written up in the ticket.
3. **COD-229 — `habitgrids` overlaps `activity` and `habitanalytics`.** Three
   registry entries over one subject, now all under one heading. Diff the
   rendered output of all three before deciding any pair is a duplicate.
4. **COD-233 — `src/lib/validate.ts` is dead code whose own header says it is
   still used.** Nothing imports it but its 16-assertion test;
   `src/lib/ingest/validate.ts` is a different live module, which is how a grep
   hides it. It is also the honest answer to the "new email" ask: there is no
   email flow in the app, by design.
5. **`steps`, `restingHR` and `activeKcal` have no reader anywhere.** Apple
   Health now writes them and CSV now exports them, but nothing in the app
   displays them — `captureLanding.ts` names them in a receipt string and that is
   all. Deliberately not built in #285.
6. **A size-token gate, from a claim that turned out to be bounded.** tailwind-
   merge puts a custom font-size and a custom text-colour in one group, so the
   later wins — but **only where `cn()` runs**; plain JSX is never merged. A grep
   says 815 call sites; measured in the DOM across 24 views, the real count of
   elements whose declared size token is not the size they render is **2**, both
   a deliberate `sm:text-display` override. So the follow-up is that one-line DOM
   check as a gate against a currently clean baseline, **not** a sweep of 815
   innocent call sites.
7. **CSV drops things the app stores.** `drive` and every other cycle field are
   excluded from the CSV export by design, and a lapse day's `count` leaves as
   one undifferentiated reset. The whole-journal JSON export (`storage.ts:263`)
   is lossless, so this is a gap in the human-readable export rather than a data
   risk — decide whether that is intended and write it down either way.
8. **CI has no measurement behind the sharded a11y gate.** It will pick up 4
   workers on a 4-vCPU runner. Pin `BUJO_A11Y_WORKERS` in `a11y.yml` if it turns
   out to need it — and note the workers make every timing assertion in that file
   tighter, which is the failure mode the wait-before-assert table in `CLAUDE.md`
   is about.

## Environment, before you start

```
npm run dev -- --port 5300 --strictPort     the UI
npm run build && npm run preview            what the gates drive (:4173)
npm run space -- --all                      where the pages actually stand
npm run a11y                                now 2m48s, not 8m07s
```

**Start the browser gates in the background** — `CLAUDE.md` has a section on it
now. Do not run `vite build` while one is driving your preview server: it serves
a half-written `dist` and the gate reports a phantom regression.

**Five agent worktrees are still under `.claude/worktrees/`**, each holding a
now-merged branch, which is why those local branches could not be deleted on
merge. One of them, `agent-afa93cdc840c582e9`, is **not a git worktree** — a
dead agent left a 770MB plain checkout plus `node_modules` there and git
resolves its working tree to the repo root. Nothing was deleted; it needs a
decision.

Servers were left on 4173, 5199 and 5300, all from the main worktree. Confirm
what a port serves by its `<title>`, not by it answering 200.

## If you are running agents again

The pattern that worked, and it is in `docs/sessions/2026-09-26-platform-pass/PLAN.md`:
one worktree each, one preview port each, the area's traps in the prompt, and
**no agent merges its own work.** Two corrections learned the hard way:

- **Give `scripts/` a single owner.** Two agents editing the gates at once cost a
  revert.
- **Expect to rebase.** Branches cut from different points both added fields to
  `demo.ts` and `types.ts`. And `git diff main <branch>` will lie to you about
  what a squash-merge applies — it showed a whole merged PR being reverted. Use
  `git diff $(git merge-base main <branch>) <branch>`.
