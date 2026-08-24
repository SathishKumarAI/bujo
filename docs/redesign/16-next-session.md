# 16 · Next session — start here

**Updated:** 2026-08-24, after Phase 0 and Phase A shipped.
**Open decisions:** `docs/QUESTIONS.md` — Q3 (deploy) and Q4 (shadcn depth) are
the two that still matter. Q6 was **answered by measurement, not by choosing**.

## Do these first

1. **Merge PR #129** if it has not landed — Phase A, all gates green.
2. **Delete the twelve merged branches** (BUJO-247). Never with
   `--delete-branch` while a child PR still targets one.
3. **Check the port.** `:5173` is held by something that is not this working
   copy. The dev server came up on **`:5174`**; the a11y gate needs its own
   `vite preview --port 4173` running first or it dies on `ERR_CONNECTION_REFUSED`.

## Phase B — Trackers on the page contract

`Trackers.tsx` is 1013 lines, the largest view in the app. It is now in the
right section; give it the right shape. **Write the slot table before any code.**

Target: orient (habits alive, today's completion) / act (log today) / review
(heatmap + list). ≤ 2 raised cards, 1 accent — it has 9 accents today.

### Four defects measured off the rendered page, not grepped

These are the "scattered boxes" symptom, named. Screenshot: Body › Tracking,
1440×900, demo data.

| | Defect |
|---|---|
| **BUJO-273** | The habit table's **left column is too narrow**, so metadata wraps out of its row. "2/7wk" sits on its own line under Sugar; "◆60 · 5d clean" under Vegetables. The badge escapes its row and reads as belonging to the *next* habit — this is content, not cosmetics |
| **BUJO-274** | **Dead space at the right edge of the heatmap.** The month grid ends near x≈1300; the card runs to x≈1420. The cell track is fixed-width rather than distributed, so a 31-day month leaves one gap and February leaves four |
| **BUJO-275** | **A vertical gap between the "Today" chip row and the habit table** belonging to neither |
| **BUJO-276** | **The fourth stat tile reads "10 +1 🚫"** — three unrelated quantities on one line while its three siblings carry a single number each |

All four are §10 of `14-dashboard-inspiration.md`: content-weighted columns, one
shared gap token, cells filling their allotted height, constant padding.

## Then

**C** Open Food Facts in Nutrition · **D** free-exercise-db in Strength ·
**E** Insights, Stats, Today on the contract · **F** sweep.
Detail in `15-fitness-consolidation.md`; tickets in `TICKETS.md` Epic FIT-IA.

## What Phase A settled

**The eight-tab ceiling was a count, not a width.** `STATUS.md` recorded eight
tabs as the limit and Body was already at eight, so adding Tracking should have
overflowed. Measured at 1280, 1440 and 1920: `scrollWidth === clientWidth`
both before (8 tabs) and after (9). The recommended rail split into *Train* and
*Body* would have solved a problem the DOM says does not exist — and would have
put fitness in two places, the opposite of the goal. **No split.**

**`BottomNav` needed no change.** #120 deleted its hand-written `PRIMARY` list;
the sections are the tabs now, so the silent-drop trap cannot fire. One audit
item closed by reading the code rather than by editing it.

**Stats had never been accessibility-scanned.** `['Insights','Stats']` was
absent from `scripts/a11y-axe.mjs`'s fixed `VIEWS` list, so every "0 serious"
that gate has ever printed meant "0 serious excluding Stats". Adding it failed
immediately: the mood calendar drew an unlogged day's date at 10px in
`overlay0` on the empty-cell surface — **2.57:1 in mocha, 2.67:1 in neon**,
against a 4.5:1 floor. Fixed to `subtext0`; the gate is now clean across five
themes and two viewports.

This is the third time this exact shape has appeared here: Recovery excluded on
a wrong assumption, folds invisible to axe, and now a view simply missing from a
list. **A gate that does not open a page cannot vouch for it.**

## Traps added this session

- **The onboarding tour covers every view**, and its dismiss control is
  `button[aria-label="Skip tour"]` — an aria-label with **no text content**, so
  a text selector cannot find it. Two capture runs photographed the tour instead
  of the app before this was spotted.
- **Demo data must be loaded through Settings**, and the button sits inside a
  fold that must be opened first — the same fold problem that blinds axe.
- **`gh pr merge` reads a cached mergeability state.** Straight after a push it
  still reports merge conflicts. Wait rather than re-resolving.
- **Auto-merge is disabled on this repo**; every merge waits on CI in the
  foreground.
- **A stacked PR must be retargeted** (`gh pr edit <n> --base main`) or it
  merges into its parent's branch and `main` does not move.

## State

| | |
|---|---|
| `main` | #127 + #113–#123 + #107 + #128 all merged |
| Open | **#129** (Phase A) |
| Closed | #96 — superseded by Phase E |
| Branches | twelve merged, **none deleted yet** |
| Servers | dev `:5174`, preview `:4173` |

## Not claimed

Screenshots were taken at **1440 desktop only**, in the default theme, with
demo data. Phone was not looked at. The four Phase B defects above are from one
view at one width — Insights, Stats and Today have not been looked at since the
chain landed, and their card and accent counts are still inherited greps.
