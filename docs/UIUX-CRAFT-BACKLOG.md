# UI/UX Craft Backlog — bujo

**Ported from PrepForge** (`~/coding/interview_prep/docs/UIUX-BACKLOG.md`), then filtered against
what bujo *already* has. PrepForge's list was written as a pure craft pass — hierarchy, motion,
states, feedback, accessibility, keyboard. Most of it transfers to a journaling app unchanged;
some of it bujo already solved better, and those items are recorded as **already done** rather than
copied in as busywork.

Audited 2026-07-13 against `src/` at `feat/ui-feedback-keyboard`. Every unchecked item below is a
real gap verified in code, not a generic wishlist entry.

## Already better than PrepForge — do not re-do

| Thing | Where |
|---|---|
| Reduced-motion respected (animations gated behind `prefers-reduced-motion: no-preference`) | `src/index.css:594,632,684` |
| `aria-label` on icon-only buttons | `EntryRow.tsx:25,38,72`, `CaptureBar.tsx:172,186`, `MicButton.tsx:16` |
| Real `<button aria-expanded>` card expanders | `gym/CollapsibleSection.tsx:38` + 2 near-duplicates |
| Command palette (⌘K / ⌘P) with nav + theme + export + undo | `CommandPalette.tsx` |
| Global undo/redo (⌘Z / ⌘⇧Z) | `store.tsx:333-346` |
| Adaptive shell: sidebar + top bar + mobile bottom nav | `components/shell/` |
| Streak-milestone celebration overlay | `MilestoneToast.tsx` |
| Light + dark themes (5 named themes) | `CommandPalette.tsx:8-15` |

## Feedback & notifications

The largest single gap. `sonner` is installed and `src/components/ui/sonner.tsx` exists, but
`<Toaster />` **is never mounted** and `toast()` is **never called**. Every confirmation in the app
is a blocking native `alert()` / `confirm()`, an ad-hoc inline `msg` string, or the bespoke
`SyncIndicator` pill.

- [ ] Mount `<Toaster />` in the shell; add a thin `lib/notify.ts` wrapper so views never import sonner directly.
- [ ] Replace success/failure `alert()` calls with toasts — `Settings.tsx` (~16 sites), `DriveSync.tsx` (~9), `CloudStorage.tsx` (~14).
- [ ] Replace Settings' inline `msg` state (`Settings.tsx:569,582-585,646,732`) with toasts.
- [ ] **Undo toast** after destructive actions (delete entry / habit / session) — the store already has `undo()`; wire it to a toast action button so undo is discoverable, not just ⌘Z.
- [ ] Replace destructive `confirm()` with a real `<ConfirmDialog>` (shadcn Dialog) — native `confirm()` blocks the thread and looks foreign.
- [ ] "Saved ✓" autosave affordance on note/journal textareas.
- [ ] Copy-to-clipboard buttons (entry text, export payload) with a toast on success.
- [ ] Fold `SyncIndicator` into the toast system, or keep it deliberately (it is a status pill, not a notification) — decide, don't leave both by accident.

## Keyboard & shortcuts

Three independent `window.addEventListener('keydown')` listeners exist (`store.tsx`,
`CommandPalette.tsx`, `NoFap.tsx`) with no shared abstraction, and the only shortcut hint anywhere
in the UI is the palette's own footer row.

- [ ] Shared `useHotkeys` hook — one place that ignores modifier chords, text fields, and open dialogs.
- [ ] `?` opens a keyboard cheatsheet overlay (currently no cheatsheet exists at all).
- [ ] `n` — quick add / focus capture from anywhere.
- [ ] `t` — jump to Today; `[` / `]` — previous / next day on date-scoped views.
- [ ] `g` then a key — Vim-style quick jump between views (`g t` Today, `g s` Stats, …).
- [ ] `j` / `k` move between entries in Today; `x` toggles status; `Enter` edits.
- [ ] Show key hints inline (a `<Kbd>` chip next to the buttons those keys trigger), not only in the cheatsheet.
- [ ] Palette: fuzzy match + recent/frequent commands first (today it is a plain substring filter, `CommandPalette.tsx:97`).

## Loading, empty & error states

- [ ] No `ErrorBoundary` anywhere — one crash blanks the whole app. Add a boundary with a "reload / export my data" escape hatch.
- [ ] No `Skeleton` component — lazy views flash a bare `<Suspense>` fallback. Add skeletons for the card grids.
- [ ] `Empty` is a bare `<p>` (`ui.tsx:309`). Upgrade to an `EmptyState` with icon + one-line why + a CTA.
- [ ] Per-view empty states with real CTAs (Collections, Goals, Reading, Insights) — `Reading.tsx:108` hand-rolls its own.
- [ ] Offline / sync-failed persistent banner. Today `SyncIndicator` flashes "Sync failed" for 2.2s and vanishes (`SyncIndicator.tsx:18,25-29`).

## Accessibility

- [ ] Skip-to-content link (`docs/ACCESSIBILITY.md:39` already lists it as a known gap).
- [ ] Global `:focus-visible` ring. The one in `App.css:14` is scoped to the unused Vite demo `.counter`; every other ring is a per-component Tailwind utility.
- [ ] Trap focus inside dialogs and restore it on close (quick-add, palette, SOS overlay).
- [ ] Chart / heatmap accessible fallback (text summary of the same data).
- [ ] Colour-swatch and emoji-sticker `aria-label`s (`ACCESSIBILITY.md:36-41`).

## Motion & micro-interactions

- [ ] Tokenize easing/duration. `cubic-bezier(0.22, 1, 0.36, 1)` is repeated as a literal 3× (`index.css:600,637,690`) and durations are hardcoded per effect — promote to `--ease-*` / `--duration-*` custom properties.
- [ ] Count-up animation on Stats numbers.
- [ ] Consistent card hover (subtle lift + border glow) across every card surface.
- [ ] Button press micro-scale on primary actions (`press-3d` exists — apply it uniformly).

## Component consistency

- [ ] Three near-identical `CollapsibleSection` implementations (`gym/`, `recovery/`, `trackers/`) — collapse into one.
- [ ] Single `Pill` / `Badge` component — inline pill styles are duplicated across views.
- [ ] One `Kbd` component, used by both the cheatsheet and inline hints.

## Reading & content

- [ ] Collapse long entry text with "show more".
- [ ] Persist last-visited tab per view (Fitness, Trackers, Insights).
- [ ] Deep-link a specific entry / day by URL so it is shareable and bookmarkable.

---

## Build order

1. **Feedback + keyboard layer** (this branch) — Toaster + `notify()`, `useHotkeys`, `?` cheatsheet, `Kbd`, undo-toast on delete.
2. **Resilience** — ErrorBoundary, skeletons, richer `EmptyState`, offline banner.
3. **Polish** — motion tokens, consistent hover/press, count-up stats, component dedupe.
