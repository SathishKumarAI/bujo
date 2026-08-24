# Modernist redesign — plan

Source: `~/Downloads/Luke's redesign scope/design_handoff_mindset_redesign`
(`Mindset - Modernist v3.dc.html` is the design; v1/v2 are context only).

## Decisions taken before writing any code

| Question | Answer | Consequence |
|---|---|---|
| Scope | All pages, phased | Mind cluster ships first as the reference; every later phase copies it |
| Styling | **Page-scoped Modernist** | Keep the app's five themes and purpose tokens. Adopt the *rules* — 2px section / 1px row rules, radius 0, flush-left, accent for state only, five type sizes — not the handoff's hex or Archivo |
| Practice data | Add a real log | `MindsetFocus.practiced?: string[]` + a mark control in the focus slot. The charts show measured days, not a guess |

The handoff's own build note backs the styling call: *"keep the rules (2px/1px, zero
radius, flush-left, accent-for-state-only) — they carry the identity, not any
particular div."* Its palette (#f3f2f2 / #201e1d / #ec3013, Archivo) is dropped for the
same reason `docs/redesign` dropped the last brief's palette: this app has five themes
and a theme-following chart palette, and a hard-coded ground breaks all of them.

## What is already there (do not rebuild)

| Design element | Already exists |
|---|---|
| Sidebar, brand row, nav, account row | `components/shell/Sidebar.tsx` |
| Header row 1 (title, eyebrow, actions) | `components/shell/TopBar.tsx` + `viewChrome.ts` |
| Header row 2 (Mindset / Reading / Collections / Focus) | `components/shell/SectionTabs.tsx` — the exact four tabs, already URL-driven |
| Two pinned bars measured, not hard-coded | `components/shell/useHeaderHeight.ts` (`--header-h`) |
| 12-week day grid, accessible as a table | `components/page/CalendarHeatmap.tsx` → `ui/day-grid.tsx` |
| The 26 principles, 7 categories | `lib/mindset.ts` |

So the Mindset phase is: one view, a handful of new band components, one new
data field, and the pure functions behind two charts. Nothing in the shell.

## Module layout (the "modular" requirement)

New code lands as small files with one concern each, per the workspace rule.

```
src/components/mod/            ← Modernist band primitives, theme-token based
  Band.tsx                     ← section with a 2px closing rule; cells split by 1px
  Eyebrow.tsx                  ← 10px / 0.14em / uppercase / fg-3 label
  Statement.tsx                ← the 38px flush-left statement block
  README.md                    ← change → file table
src/components/mindset/        ← Mindset-only pieces
  LeadingPrinciple.tsx
  FocusSlots.tsx
  PracticeBand.tsx             ← practice grid + category balance
  LibraryBar.tsx               ← search + category filters + count (sticky)
  LibraryList.tsx              ← grouped rows, Add / In focus
  README.md
src/lib/mindsetPractice.ts     ← pure: practice days, streak, per-category counts
src/lib/mindsetPractice.test.ts
```

`views/Mindset.tsx` becomes composition only — target under 80 lines, no layout
maths inside it. The `mod/` primitives are deliberately app-generic: phases 2+
consume them unchanged, and a phase needing a new variant changes `mod/`, not the
call site (same contract as `components/page/index.ts`).

## Phase 1 — Mindset (the reference implementation)

Branch `feat/modernist-mindset`. One commit per numbered item.

1. **Data.** `MindsetFocus.practiced?: string[]` in `lib/types.ts`; store action
   `toggleMindsetPractice(focusId, date)` in `store.tsx`; demo seeds a plausible
   history so the charts are not empty on first look (`lib/demo.ts` — remember
   demo data is persisted, re-seed via Settings → Data).
2. **Pure logic + tests.** `lib/mindsetPractice.ts`: `practiceDays`, `currentStreak`,
   `categoryCounts`, `activeDays`. Tests named for the failure they catch.
3. **`mod/` primitives** + README table.
4. **Bands, in design order:** leading principle → focus slots → practice band →
   library bar → library list. The photo cell of the leading-principle band is
   omitted; the app has no training-photo slot and the handoff says the cell may
   be dropped when the product has no imagery. Its width goes to the statement.
5. **View recomposed**, old card/masonry layout deleted in the same commit.

Rules that must survive verification, all of them from the handoff's own scars:
- the focus-slot row **never wraps** (equal `flex: 1 1 0` cells, not `auto-fit`),
- the filter row **scrolls, never wraps**,
- the library bar's sticky `top` comes from `--header-h`, never a literal,
- accent is state only: active library row, in-focus button, active category bar.

### Gates for phase 1
`npx tsc -b` · `npx vitest run` · `npx eslint .` · `npm run build` · `npm run design`
· `npm run a11y` with the new bands **rendered** (axe cannot see a collapsed fold)
· measured proof, not a screenshot: `getBoundingClientRect()` on the balance bars
and the slot row (flat bars looked like a style choice for months once already).

## Phases 2+ — the rest of the app

Each is its own branch and PR, each reuses `mod/` and changes no primitive
without changing it for everyone. Order is by how much the page gains:

| Phase | Pages | Why here |
|---|---|---|
| 2 | Reading, Collections, Focus | Finishes the Mind section; same tab row, so drift is visible immediately |
| 3 | Today, Plan | Highest traffic; the page-contract work already landed, this restyles it |
| 4 | Fitness, Gym, Nutrition, HomeWorkout, Pullups, Pickleball, NoFap | Body cluster, largest surface, most cards-in-cards to flatten |
| 5 | Insights, Stats, Trackers, Challenges, Goals, Monthly, Cycle | Data surfaces; the chart palette needs its own look before this lands |
| 6 | Settings, Account, Help, Welcome, KitchenSink | Chrome; KitchenSink is the proof every primitive still renders |
| 7 | Shell (Sidebar, TopBar, BottomNav) | **Last, deliberately.** Restyling the shell first would leave every unconverted page looking broken |

Phase 1 is the only phase specified in detail here on purpose: it decides the
primitives, and phases 2–7 are a mechanical application of whatever it proves.
Re-plan each phase from what phase 1 actually shipped, not from this table.

## Explicitly not in this plan

- No Archivo, no #ec3013, no new theme. (Ask again if pixel-fidelity to the
  handoff matters more than the five existing themes.)
- No training photo, no image upload.
- No mobile layout for the Mindset bands beyond the handoff's wrap rules — the
  handoff says none was designed, and inventing one is a separate decision.
- No copy rewrite: the app's 26 principles stay as they are. They match the
  handoff's set nearly word for word already, and their ids are persisted in
  user data — renaming ids would orphan every saved focus.
