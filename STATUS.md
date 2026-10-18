# STATUS

**Stopped:** 2026-10-17, on `feat/cycle-fields-ui`, **one PR to open**.
Cycle round five — the optional-field panel.

## Where it stands

| branch | PR | what | state |
|---|---|---|---|
| `main` | — | #418–#424 merged | up to date |
| `feat/cycle-fields-ui` | **not opened yet** | COD-337 round five — one commit | local |

## The next action

1. **Open and merge the PR.** Green locally: `verify` (158 files, 2,169
   tests), `clipped`, `design`, `a11y:panels`.
2. **Answer `docs/QUESTIONS.md`** — what "saved for every month" meant.
3. **COD-336** — `maxBarSize` on the nine remaining bar charts.
4. **The rest of the prose sweep** — `cycleHelp` and `cycleManual`, 27
   multi-sentence strings. Check consumers first: `CYCLE_HELP.text` feeds
   popovers *and* the Help page.

## What landed on this branch

The optional-field panel was **nine chip groups at one weight with nothing
between them**, 56–153px each, in a 424px column. It is three ruled sections
now — how you felt · what your body did · cycle signs — with the grouping
declared as data in `dayFields.ts` rather than typed into the view.

`fertilityFirst` moves the **section** instead of sorting four chip keys by a
hand-written `rank()`, which is deleted. Headings sit below the groups' own
legends in weight, because each group already names itself.

## Ideas considered and not done

- **Making the 1–5 scales look like scales.** Mood and Energy render as five
  pill chips, identical in weight to tag chips like "calm" / "happy", with
  their endpoints in the legend ("Mood · 1 low … 5 great"). A segmented
  control would read better, but `ChipPick` is shared across the app and the
  change belongs to that component rather than to this panel.
- **Moving `Drive` in beside Mood and Energy.** Three 1–5 scales currently sit
  on two surfaces; Drive is in the fast path by an earlier deliberate
  decision, so moving it needs that decision revisited, not overridden.

## Open

- `docs/QUESTIONS.md` · what "saved for every month" meant.
- **COD-336** · `maxBarSize` on nine bar charts.
- **`cycleHelp` and `cycleManual` prose** — 27 multi-sentence strings.
- **The two ideas above.**
- **A seeded journal per `nextStep` branch.**
- **Home Workout's act is a bare `useState`.**
- **COD-247 reopened for Recovery.**

## Environment

One preview server was up at the stop: **4310**, started from this worktree.
4173 and 4299 belong to other worktrees — **compare the served
`assets/index-*.js` against your own `dist/index.html`** before believing any
measurement, because every worktree here serves an identical `<title>`.

```
npx vite preview --port 4310 --strictPort &
BUJO_URL=http://localhost:4310 node scripts/a11y-panels.mjs
```

`playwright` and `@axe-core/playwright` are installed on this machine but are
still not in `package.json` (COD-273):

```
npm i -D --no-save playwright@1.64.1 @axe-core/playwright@4.14.0
npx playwright install chromium
```

A throwaway probe must live in the **repo root**, not the scratchpad — ESM
resolves `playwright` relative to the script. Five were written for this pass
and all five are deleted; `git status` was clean before the push.

**`npm run a11y:panels` is 133 rows and some minutes**, and it is still not in
CI. Start it in the background and keep working — and do not `vite build`
while it runs, or it serves a half-written `dist` and reports a view that
"did not load".
