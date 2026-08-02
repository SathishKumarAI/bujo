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

---

## 2026-07-13 · Button-system audit (branch `feat/ui-polish`)

Lens: **one button system**. Today the app has three ways to render a button, and
they do not agree on height, radius, focus ring, or disabled state.

| Layer | Files | Notes |
| --- | --- | --- |
| shadcn `ui/button` | 25 | The target. `variant` × `size`, real focus ring, `disabled:` handled. |
| Legacy `Button` wrapper (`ui.tsx:212`) | 11 | `primary\|ghost\|danger` → maps onto shadcn, but loses `size`, `disabled`, and any prop it does not explicitly forward. |
| Hand-rolled `<button className=…>` | 16 with full chrome | Each re-invents padding/radius/hover; none share a focus ring. |

### Done this pass

- [x] `Settings.tsx` — 26 call sites off the legacy wrapper onto shadcn variants; the three destructive actions (clear all data, reset appearance, remove passcode) now read `variant="destructive"`, guards untouched.
- [x] `Account.tsx` — 8 hand-rolled buttons → shadcn (incl. both password-reveal toggles → `ghost` / `icon-sm`).
- [x] `Welcome.tsx` — 4 hand-rolled → shadcn; the three first-run choice cards stay native (they are card-shaped targets, not buttons).
- [x] `Help.tsx` — audited, zero buttons, no change.

### Remaining hand-rolled buttons (chrome, so they visibly drift)

- [ ] `Collections.tsx:91,118` · `Insights.tsx:399`
- [ ] `Onboarding.tsx:57,59` — first-run CTAs, highest visibility of the lot.
- [ ] `CaptureBar.tsx:190` · `SmartInput.tsx:118` — the capture path, hit on every entry.
- [ ] `trackers/HabitDetail.tsx:108,109` · `RestTimer.tsx:66,69` — paired buttons that should be one `variant` apart, not two hand-tuned styles.
- [ ] `TodayPlanCard.tsx:66` · `ExercisePicker.tsx:65` · `ExploreBanner.tsx:34` · `ReminderBanner.tsx:54` · `CoachCard.tsx:34`

### Retire the legacy wrapper

- [ ] The wrapper's prop type omits `disabled`, `size`, and `form`. TS rejects them, so no call site has one — verified, this is a capability gap rather than a live bug. Practical cost: a legacy `Button` firing an async action (push/pull/upload) **cannot go disabled while in flight**, so it stays double-clickable. That is the reason to finish the migration, not just tidiness.
- [ ] Migrate the 11 remaining importers (`FastingCard`, `PomodoroCard`, `DriveSync`, `ProgressPhotos`, `ImageUpload`, `CloudStorage`, `ExerciseDB`, `WeeklyReview`, `FriendsCard`, `ProgramTracker`, `CaptureBar`), then delete `Button` from `ui.tsx` so there is exactly one import path.

### Destructive-action semantics

- [ ] `destructive` variant is now correct in Settings, but confirmation is still a native `confirm()` everywhere. Replace with an `AlertDialog` that names the thing being destroyed and offers "export a backup first" — the one-click path to wiping a journal deserves better than a browser modal.

---

## 2026-07-13 · Craft backlog closed out

### Read this first: `tsc --noEmit` does nothing in this repo

The root `tsconfig.json` is solution-style (`"files": []` + project references), so
`npx tsc --noEmit` has no root files to check and **always exits 0**. It silently passes
broken code. The real typecheck is **`npx tsc -b`** — what `npm run build` runs.

This masked 7 real type errors during this work. Use `tsc -b`.

### Done

- [x] **Text contrast — the eye-strain bug.** Both muted tokens failed WCAG AA for body text on Mocha's `#1e1e2e`:

  | Token | Hex | Ratio | |
  | --- | --- | --- | --- |
  | `overlay0` | `#6c7086` | **3.36:1** | fails AA — 462 uses |
  | `overlay1` | `#7f849c` | **4.44:1** | fails AA — 93 uses |
  | `subtext0` | `#a6adc8` | **7.37:1** | passes AA + AAA |

  All 555 text uses moved to `subtext0`. Palette-native, so Catppuccin is unchanged. No
  `text-overlay0`/`text-overlay1` remains in `src/`.

- [x] **Global focus ring.** There was none — only shadcn primitives were keyboard-visible; every hand-rolled button, link and input focused invisibly. One `:focus-visible` rule now covers `a, button, input, select, textarea, summary, [tabindex]`.
- [x] **Destructive `confirm()` → `AlertDialog`.** New `ui/alert-dialog.tsx` + promise-based `useConfirm()`. All 22 call sites migrated. Dialogs now name what dies ("This deletes all 143 entries, 12 habits…"), label the button with the action, and the two data-wiping paths offer **"Export a backup first"** inline. `useConfirm()` falls back to `window.confirm` with no provider, so a missing provider can't turn a guard into a no-op.
- [x] **Legacy `Button` retired.** 11 importers, 29 call sites migrated; wrapper deleted from `ui.tsx`. One Button import path.
- [x] **Copy.** `·` was doing the work of every punctuation mark (555 uses). Converted to real punctuation in prose only; kept for genuine metadata (`12 reps · 3 sets`). Emoji status prefixes and the redundant uppercase `show` labels removed.
- [x] **`CollapsibleSection` dedupe.** The three copies were orphaned dead code. Moved to `archive/` (commented out, outside the TS program).

### Stale entries above — already shipped, ignore them

`ErrorBoundary`, Toaster/`notify()`, and `Skeleton` all exist and are wired up.

### Still open

- [ ] 17 pre-existing eslint errors (`set-state-in-effect` ×4, `react-refresh/only-export-components` ×7, `no-explicit-any` ×5 in `lib/wger.ts`, refs-during-render in `lib/speech.ts`). Untouched by this pass; baseline and current are identical.
- [ ] Delete `archive/` once you're happy the CollapsibleSection copies aren't needed.
