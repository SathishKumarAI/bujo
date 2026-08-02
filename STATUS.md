# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02
- **Where I stopped:** Four branches pushed, stacked in this order, **no PRs open
  yet** (`gh pr create` was blocked by a permission classifier — the branches are
  on origin, the PRs need opening by hand):
  1. `fix/a11y-gaps` (off `main`) — `useFocusTrap` + all eight hand-rolled
     overlays, Reading headings, Monthly cell labels, save toasts, doc update.
  2. `refactor/pill-badge` — one `Pill` (tone × size), 18 sites in 12 files.
  3. `refactor/button-adoption` — 7 genuine buttons into the button system,
     plus a fourth private copy of `CollapsibleSection` deleted from Insights.
  4. `feat/ux-small` — `useStickyState` (F6), `?view=&day=` deep links (F7),
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
- **Next action:** open the four PRs (base each on the branch below it, not on
  `main`, or they will show each other's commits). After that, the open UI work
  is §I1 — accent-as-text failing AA in latte. That is now a **one-file** fix: every
  pill reads its colour from `Pill` in `src/components/ui.tsx`.
- **Blocked on:** unchanged. `B1` — the Supabase project at
  `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so every account/cloud-sync
  feature is dead until it is repointed or the env vars are unset. Section H (the
  redesign brief) still waits on H5, H6, H7, H9, H11, H13.

**Read next:** `TASKS.md` (the working board — F1/F2/F3/F6/F7/F8/F9 and B5 are now
closed with notes on what was deliberately *not* done) · `docs/ACCESSIBILITY.md`
(open vs closed gaps, and the rule new overlays must follow).
