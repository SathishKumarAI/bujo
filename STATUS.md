# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02
- **Where I stopped:** Four stacked branches, all pushed, all with PRs open —
  each based on the one below it, so merge **bottom-up** (#88 → #89 → #90 → #91)
  or the diffs will show each other's commits:
  1. #88 `fix/a11y-gaps` (off `main`) — `useFocusTrap` + all eight hand-rolled
     overlays, Reading headings, Monthly cell labels, save toasts, doc update.
  2. #89 `refactor/pill-badge` — one `Pill` (tone × size), 18 sites in 12 files.
  3. #90 `refactor/button-adoption` — 7 genuine buttons into the button system,
     plus a fourth private copy of `CollapsibleSection` deleted from Insights.
  4. #91 `feat/ux-small` — `useStickyState` (F6), `?view=&day=` deep links (F7),
     long-entry clamp (F8).
  All four verify green: `npx tsc -b` 0, `npx eslint .` 0 errors / 2 pre-existing
  warnings, **689 tests** (was 678), `npm run build` clean. F3, F6, F7, F8 and the
  Pill were also checked in a real browser (Tab wrap + Escape restore in the
  palette, URL round-trip on reload, sticky Fitness tab, clamp toggle).
- **Also worth knowing:** a second worktree is checked out on
  `feat/pages-ui-polish`, and mid-session something switched this checkout's HEAD
  to `main` — five commits landed on local `main` before they were moved onto
  `fix/a11y-gaps` and `main` was reset to `origin/main`. Check `git branch --show-current`
  before committing here.
- **Icon & button system (§J):** stages 0–4 and the mechanical half of 6 are
  done, on `feat/icon-button-stage1` — PR **#94**, stacked on **#92**
  (`docs/icon-button-system`), which is stacked on #91. So the full merge order
  is now **#88 → #89 → #90 → #91 → #92 → #94**.
  lucide is gone (Phosphor behind one `Icon` wrapper, 85 files, 397 conversions),
  the solid accent button is gone (four variants, tonal primary, 28/36/44 in
  rem), ten radii are three, and the kitchen sink switches theme and text size
  itself. Stickers were removed outright, including saved data. Today is a
  weighted three-column layout, and the weight / left-right contract for every
  card is in `docs/LAYOUT-WEIGHT-ALIGNMENT.md`.
  §I1 got solved on the way: accent-as-text failed AA in latte (4.39:1) and dawn
  (4.07:1) once the primary button went tonal, and it is fixed **at the token**
  (`--color-brand-text`, `--color-danger-text`), so no call site has to remember.
- **Next action:** Stage 5 — what is left is *judgement* work, not mechanical:
  empty-state and error copy per view, container tiers, and ~170 hex literals
  that need the genuine data cases carved out first (Settings' theme-swatch
  previews must render another theme's colours while you look at this one; chart
  palettes and habit colour pickers are the same shape of problem). Also open:
  rebuild `Segmented`/`Stepper` on `ToggleGroup`, and decide the icon bundle —
  413 kB raw / 93 kB gzip because Phosphor ships six weights per glyph and this
  app uses two. Trim the 144-glyph vocabulary, or generate a two-weight local
  build. Relates to **B4**.
- **Standing rule from this session:** UI changes are verified in **all five
  themes** — mocha, latte, neon, vscode, dawn — not mocha plus a spot check.
  Three of them redefine the accent (dawn's is an amber), two invert surface
  polarity, and dawn renders two text tiers where the others render three.
- **Blocked on:** unchanged. `B1` — the Supabase project at
  `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so every account/cloud-sync
  feature is dead until it is repointed or the env vars are unset. Section H (the
  redesign brief) still waits on H5, H6, H7, H9, H11, H13.

**Read next:** `TASKS.md` (the working board — F1/F2/F3/F6/F7/F8/F9 and B5 are now
closed with notes on what was deliberately *not* done) · `docs/ACCESSIBILITY.md`
(open vs closed gaps, and the rule new overlays must follow).
