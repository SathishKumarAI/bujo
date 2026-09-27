# STATUS

**Stopped:** 2026-09-27, on `refactor/gym-rail`, clean. **Two PRs open and
stacked**, both verified here rather than asserted:

| PR | Branch | Base | State |
|---|---|---|---|
| **#300** | `refactor/section-rail-vertical` | `main` | CI green (a11y · verify · docs-guard). **Needs a human merge** — the agent is blocked from merging. |
| **#301** | `refactor/gym-rail` | `refactor/section-rail-vertical` | Open, all gates green locally |

**Merge #300 first, then rebase #301 onto `main` and retarget it — do not
squash-merge #300 with branch deletion while #301 points at it.** GitHub
auto-closes a PR whose base branch is deleted and will not reopen or retarget
it (`Cannot change the base branch of a closed pull request`). #145 and #147
had to be re-created as #148 and #149 for exactly this. The incantation:

```
git rebase --onto main refactor/section-rail-vertical refactor/gym-rail
gh pr edit 301 --base main
```

## What this stretch was

One request that arrived in six messages, each arriving while the previous was
still being built: put Gym, Mindset, Reading and Collections on the Insights
shape; then the tools into the rail; then each tool as its own row; then the
split chips on one line; then the stat figures as visualisations; then the rest
timer moved and redesigned. Gym is done. **Mindset, Reading and Collections are
not started** — see the next action.

| # | What | The finding |
|---|---|---|
| 300 | `SectionRail` went vertical at `@4xl` (896px container) | Five of eight rail pages shipped the **phone chip row on a desktop** |
| 301 | Gym was five folds, four shipping shut | 1.7 / **3.4** → **1.1 / 1.1** desktop · 3.2 / **7.2** → 2.5 / 2.6 phone · folds 5 → 1 |

## The next action

**Finish `DESIGN.md` phase 3/4 for Mindset, Reading and Collections. One PR
each, in that order — Mindset is the worst page in the app.**

This is not a taste pass, and that is the single most useful thing to know
before starting it:

- `DESIGN.md` declares the **Modernist** pass (radius 0, hairline rules, no
  fills) *anti-reference* — "kept in the git history and nowhere else".
- `components/mod/Band.tsx` declares that it owns "the structural rules of the
  Modernist redesign (2px between sections, 1px between cells, zero radius, no
  surface fill)".
- `DESIGN.md`'s rollout table has **phase 3 and phase 4 unchecked**. Phases 0–2
  landed (tokens, primitives, shell); the views were never followed through.

So `mod/Band` is the superseded visual world still shipping, in **16
components** across exactly the three pages left. Measured:

| page | shell | desktop shipped / open | phone | cols @1440 |
|---|---|---|---|---|
| mindset | legacy `Page` + bands | **4.2 / 4.2** | **8.8 / 8.8** | **1** |
| reading | legacy `Page` + bands | 1.7 / 1.9 | 3.1 / 3.9 | **1** |
| collections | legacy `Page` + bands | 1.4 / 1.5 | 2.4 / 2.5 | **1** |

8.8 phone screens is the worst number this repo has measured. One column on a
1440 screen means every subject on the page is reached by scrolling past every
other one — the same shape Focus had at 3.5/5.7 before its rail.

The recipe is now written four times over and should be followed, not
re-derived: a registry in `lib/<page>Cards.ts` (see `gymCards.ts`, the newest
and most annotated), `PageLayout` + `SectionRail` in zone 3, and a
`views/<Page>.test.tsx` binding registry to rendered `data-card` **in both
directions**. Retire `mod/Band` as the *last* step, once nothing imports it.

## Traps this stretch added, or paid for again

**A container breakpoint is chosen against the container, not a device.**
`SectionRail`'s `@4xl` (896px) was measured against nothing: the rail's
container is 722px whenever it sits in the review column of a 1180 split. Five
pages, whole life of the component, zero gate failures — a chip row is a legal
rendering of the same component. When you write a container query, print the
container width on every adopter before choosing the step.

**`truncate` cannot rescue a one-word string.** It carries
`whitespace-nowrap`, so the element can neither wrap nor shrink — it overflows,
ellipsis or not, and `scrollWidth > clientWidth` stays true. `break-words` is
the fix when the content is a name. Found at 101px shown / 103px needed.

**Forcing a single line is not the same as making one fit.** Six split chips
measured 556px in a 505px column, so they wrapped. Tightening the desktop
metrics brought them to 448px — correct. *Also* adding `sm:flex-nowrap` put
"Full body" at **1012–1106px in a 1024px page** at the laptop width, where the
act column is narrower: a mode you could not select. `flex-wrap` is the safety
net for the widths you did not measure.

**A spark's width is its bucket count, not its container's width.** Stretching
`flex-1` let fourteen pips read as a sparkline and three stalled lifts read as
a 400px red banner across zone 1 — "alarm" where the figure said "3".

**Assert the accessible name, not `textContent`.** A test held
`toContain('Rest timer')` and went red when the timer's `<h2>` became an
`aria-label` on its section. The component was right. Same family as the
page-census sweep that reported 14 folds on a 32-fold page because
`Card collapsible` names itself in `aria-label` and nothing in its text.

**Zone 1's 64px cap clips anything taller than a figure.** Adding a 24px strip
to a `StatFact` made it 78px and `sm:max-h-16` silently cut every one off. The
cap exists so the bar cannot grow into a stats card, so it was raised by
exactly one strip (`5.5rem`) rather than removed.

## Environment, and one thing that cost a round trip

- Dev server **5190**, preview **4180**, both started this session. Port 8080 is
  Plane and was deliberately left alone. `BUJO_URL` was set on every gate run.
- **The service worker served a stale bundle and made a shipped change look
  missing.** It cost a user-visible "why can't I see the gym cards" before the
  cause was found. Unregister it and clear `caches` before believing a preview
  tab, or use the dev server, which has none. This is already a trap in
  `CLAUDE.md` and it still caught us.
- `@axe-core/playwright` needs `browser.newContext()`, not `browser.newPage()`,
  and its default export is under `.default` when imported from ESM.

## COD-237 is still open, and was measured around

`npm run a11y` reaches a rail page by URL and scans whichever group it opens
on. Gym now has **eight** rows, so seven had never been seen by axe. A
throwaway probe drove all eight at five desktop and two phone themes — **56
scans, 0 serious or critical** — before the page was called clean. Do the same
for each of the three remaining pages, and say what was measured. The gate
change itself is still not done.
