# STATUS

**Stopped:** 2026-09-02 14:47 CDT. On `main`, clean.
**All eleven PRs merged, no open PRs.** `main` at the #193 merge.

After the merges the session continued outside this repo, improving the
`agile-github-flow` skill with a benchmark; that work is written up in
`~/.claude/skills/agile-github-flow-workspace/SESSION-2026-09-02.md` and has an
open decision waiting. It touched nothing here.

## What this session did

Started from "what's the status", then "complete them" — the twelve open
`repo:bujo` items on the Plane board. Ten shipped, two of the twelve are
deliberately not started (below), and four new items were filed on the way.

| PR | What | Ticket |
|---|---|---|
| #183 · merged | The a11y gate now opens every fold before scanning | COD-93 |
| #184 · merged | Set-row headers were wider than the phone tracks they label | COD-95 |
| #185 · merged | The stalled-lift alert fired on everything, and the data was why | COD-90 |
| #186 · merged | The exercise picker called itself a combobox and was a list of buttons | COD-91 |
| #187 · merged | The set row buys its touch targets with a second line | COD-92 |
| #188 · merged | Three quarters of a card was another card | COD-89 |
| #189 · merged | README: the shape of the codebase, where nine screenshots were | — |
| #190 · merged | The gate had never seen Settings or the design-system page | COD-58, COD-94 |
| #191 · merged | "On track" named two different things, and was backwards for a cap | COD-48 |
| #192 · merged | A four-step staleness ramp whose top two rungs were one colour | COD-51 |

Filed, not fixed: **COD-94** (closed by #190) · **COD-95** (closed by #184) ·
**COD-96** 24 controls on gym still under 44px · **COD-116** NoFap's 10-colour
urge palette collapses (latte 5.7).

## The one thing to carry forward

**Every gate this session touched was green because of what it could not see,
and arming each one turned it red on the first run.**

Four in a row, same shape:

- `a11y` did not open folds → armed it → **critical `select-name`** on Trackers,
  the exact violation `CLAUDE.md` said had "shipped for months this way",
  still shipping.
- `a11y`'s `VIEWS` list had no Settings and no kitchen sink → added them →
  **`fg-2` on `ink-3` at 4.09:1** on the page whose entire job is to display
  the design system.
- `contrast` measured legibility but not separation → added a scale check →
  **Plan's four-step staleness ramp had two rungs the same colour** (maroon/red,
  dE 6.6 in latte). Contrast ratio is structurally blind to this: two colours
  of equal luminance have ratio 1.0 whatever their hue.
- `clipped` was simply **red on `main`** and had been quoted as green in #182's
  body.

The corollary that cost the most time to learn: **the ticket is a hypothesis,
not a finding.** Three of the ten said something that measuring contradicted.

- COD-90 said `stalledLifts`' threshold was too loose. It was not. The demo
  seeder logged one fixed weight per lift, so the journal contained **no PR
  anywhere** and the detector was right to fire on 7 of 7. Fixing the fixture
  fixed the alert.
- COD-51 said dawn's `flamingo` sits dE 16 from `maroon`. True, and not the
  problem — they are never drawn together, while two colours that *are* drawn
  together sat at 6.6.
- COD-48 named one defect and there were three.

**Measure before you accept the diagnosis, even when the diagnosis is written
down in a ticket by someone careful.**

Smaller, worth keeping:

- **A gate can only fail on what the fixture renders.** `stalledLifts`,
  `weekdayConsistency` and now Plan's `yellow` arm are all cases where the demo
  data decided what could be caught. When a gate goes green, ask what the seed
  never produced.
- **An exemption you can see beats an omission you cannot.** The new scale
  check lists NoFap's failing 10-colour scale in an `UNENFORCED` map and prints
  it on every run, rather than leaving it out of `SCALES` where it would be
  invisible — the failure mode of `VIEWS`, the empty journal, and closed folds,
  three times over.
- **`a11y` costs ~9 minutes in CI now** (was ~7.5). Folds open is worth it.

## Not started, and why

- **COD-73** — four pages are still flat card stacks: pickleball 5379px, stats
  4685, help 4021, nofap 3734. Each is a page-contract pass on the scale of
  #182, which took a full session for one page and produced five follow-up
  tickets. Four of those is not one increment.
- **COD-61 / COD-49** (Recovery IA and its duplicated orient bar) and **COD-57**
  (Today states the date three times) are the same shape — layout passes that
  want measuring, a plan, and their own PRs.

## Measured

| | before | after |
|---|---|---|
| `npm run a11y` coverage | 23 views × 5 themes, folds shut | **25 views**, folds forced open, 48 scans |
| a11y violations found by arming it | — | **3** (1 critical, 2 serious), all fixed |
| `npm run contrast` checks | 2 | **3** — divergence, legibility, **scale separation** |
| `npm run clipped` on `main` | **red**, 2 strings | clean, 23 views |
| gym set-row controls at 390 | 28×28, picker 120×61 | **all ≥44px**, picker 241×44 |
| gym · "Deadlift" lines, folds open | 9 | **7** |
| Goals headline | `1 of 7 on track` | `4 of 9 met · 3 of 8 on pace` |
| tests | 887 | **900** |

## Next action

**COD-73** is the biggest thing left, and it wants slicing: one page per PR,
`node scripts/page-census.mjs` first for the before-number, and expect each
page to file its own follow-ups the way gym filed five. Pickleball is the
tallest at 5379px and the obvious first cut.

Two calls left open for the user, neither blocking:

- `.github/workflows/screenshots.yml` still runs on every push to `main`, and
  since #189 the README no longer shows its output. Keep it or retire it.
- latte's `sky` and `blue` are the **identical hex** `#165fc1`. Not drawn in
  any declared scale, so `npm run contrast` passes; re-picking one is a taste
  call rather than a bug fix.
