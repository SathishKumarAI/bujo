# v2 View Enhancements — Plan (Trackers · Settings · Fitness · Gym)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Redesign four views for usability and add new features — Trackers, Settings (tabbed), Fitness, Gym — on the shell + shadcn substrate from the layout redesign.

**Architecture:** Build on `components/shell/Page` + `ui.tsx`/`ui/*` (shadcn). Additive, forward-compatible data-model fields only (`migrate()` fills them on load — no data loss). Keep charts lazy; keep all 64 tests green; add tests for new pure logic.

**Conventions:** dev `npm run dev` (:5173, `?demo=1&view=…`). Verify each task: `npm run build` + `npm test` + chrome-devtools screenshot. Commit per task. Budget < 200 KB gzip initial.

---

## Data-model deltas (`src/lib/types.ts`) — all optional, additive

```ts
// Habit (+)
weeklyGoal?: number          // F1: target completions per week
emoji?: string               // F7: glyph shown in grid + drawer

// Workout (+)  — keep `sets: string[]` for back-compat & display
setRows?: WorkoutSet[]       // G2/G3: structured sets

export interface WorkoutSet {
  exercise: string
  weight?: number
  reps?: number
  rpe?: number
  kind?: 'warmup' | 'working' | 'drop'   // G2
  rest?: number                          // seconds, G5
}

// JournalData (+)
habitSkips?: Record<string, string[]>    // F4: habitId -> ISO days planned-skipped
fitnessGoalMin?: number                  // FT1: weekly active-minutes target
```

`migrate()` in `storage.ts` already merges loaded blobs onto defaults — add the new keys to `emptyJournal()` defaults so they're always present.

---

## Phase A — Settings: tabbed layout

### Task A1: Tabs shell
**Files:** `src/views/Settings.tsx`; uses `src/components/ui/tabs.tsx`.
- [ ] Wrap the existing cards in shadcn `Tabs` with triggers: **Appearance · Profile · Journal feel · Reminders · Data & Cloud**. Move `<CloudStorage/>` + `<DriveSync/>` and Backup/Demo cards into **Data & Cloud**. Appearance also hosts the existing theme `Segmented`.
- [ ] Each tab renders inside a `Page` (no aside); cards within a tab use the existing `auto-rows-fr` grid.
- [ ] Persist the active tab in component state (default first). Keyboard + `aria` come from Radix Tabs.
- [ ] Build + test + screenshot `?view=settings`. Commit `"feat: tabbed Settings (Appearance/Profile/Feel/Reminders/Data)"`.

---

## Phase B — Trackers (U1–U5, F1–F7)

### Task B1: Model + helpers
**Files:** `types.ts`, `storage.ts`, `src/lib/stats.ts` (+ `stats.test.ts`).
- [ ] Add `Habit.weeklyGoal`, `Habit.emoji`, `JournalData.habitSkips` to types + `emptyJournal()`.
- [ ] `stats.ts`: `weeklyHabitProgress(data, habitId, weekOf)` → `{done, goal}`; `habitDayOfWeekBreakdown(data, habitId)` → counts[7]; extend `habitStreak` to treat `habitSkips` days as non-breaking. Unit-test each.
- [ ] Build + test. Commit `"feat: tracker model + weekly-progress/skip-aware streak helpers"`.

### Task B2: Today focus strip (U1) + view toggle (U2)
**Files:** `Trackers.tsx`.
- [ ] Add a top strip: today's scheduled habits as tappable chips with a "n/m done today" count; tapping toggles/increments.
- [ ] Add a `Segmented` Day/Week/Month toggle driving the grid's day range (Day = today col only; Week = current week; Month = full, current behavior). Reuse the cursor's month.
- [ ] Build + screenshot. Commit `"feat: Trackers today-focus strip + day/week/month toggle"`.

### Task B3: Grid polish (U3) + quantity steppers (F2)
- [ ] Highlight the today column; shade weekend columns. For `type:'count'` habits, render an inline −/＋ stepper + a fill bar to `target` in each cell instead of a bare dot.
- [ ] Commit `"feat: Trackers today-highlight, weekend shading, count steppers"`.

### Task B4: Weekly goals (F1) + correlation chips (F5)
- [ ] Per habit, show a small weekly-goal meter (done/goal ring or bar) when `weeklyGoal` set; goal editable in the detail drawer (B6).
- [ ] Add a "Patterns" strip: reuse `correlations` to show "On days you did X, mood averaged +N" for the top 1–2 habits.
- [ ] Commit `"feat: Trackers weekly-goal meters + habit↔mood correlation chips"`.

### Task B5: Reorder + inline archive (U4) + collapsible categories (U5)
- [ ] Drag-to-reorder within a category (HTML5 DnD; persist `order`). Inline archive/restore button per habit (toggles `archived`). Category headers collapse/expand (local state).
- [ ] Commit `"feat: Trackers drag-reorder, inline archive, collapsible categories"`.

### Task B6: Habit detail drawer (F3) + emoji/color (F7) + presets (F6) + skip (F4)
**Files:** `Trackers.tsx`; uses `ui/dialog` (or a side `Sheet`-style dialog).
- [ ] Click a habit name → drawer: current/longest streak, 30/90-day %, mini month heatmap, best day-of-week, weekly-goal editor, emoji + color picker, "mark planned skip" for a date (writes `habitSkips`).
- [ ] Add a presets row to quick-add Water / Exercise / Read / Meditate / Sleep 8h (sensible `type`/`target`/`emoji`).
- [ ] Commit `"feat: Trackers habit detail drawer + emoji/color + presets + skip days"`.

---

## Phase C — Fitness (FT1–FT7)

### Task C1: Helpers
**Files:** `src/lib/fitness.ts` (+ `fitness.test.ts`).
- [ ] `pace(distanceKm, durationMin)` → min/km|mi string; `weeklyActiveMinutes(data, weekOf)`; `cardioPBs(data)` → {longestRun, mostCalories, bestPace}; `activeDayStreak(data)`. Unit-test.
- [ ] Commit `"feat: fitness pace/PB/streak/weekly-minutes helpers"`.

### Task C2: Reflow + totals toggle + auto-pace (FT4) + edit (FT7)
**Files:** `Fitness.tsx`.
- [ ] Reflow on `Page` (log form aside, summary main). Totals card: This-week / All-time `Segmented`. Show auto-pace per history row. Make a logged workout editable (prefill the form; update vs add). Add `updateWorkout` to store if missing.
- [ ] Commit `"feat: Fitness reflow + week/all-time totals + auto-pace + edit"`.

### Task C3: Weekly goal (FT1) + streak/heatmap (FT5) + presets (FT6)
- [ ] Weekly active-minutes goal (`fitnessGoalMin`, edited in Settings→Profile or inline) with a progress ring. Active-day streak + a heatmap (reuse `Heatmap`). Quick-log presets + "repeat last workout".
- [ ] Commit `"feat: Fitness weekly goal ring + streak heatmap + presets"`.

### Task C4: Trend chart (FT2) + cardio PBs (FT3)
- [ ] Lazy chart: weekly minutes/distance trend + per-activity breakdown. A "Personal bests" card from `cardioPBs`.
- [ ] Commit `"feat: Fitness trend chart + cardio personal bests"`.

---

## Phase D — Gym (G1–G8)

### Task D1: Model + helpers
**Files:** `types.ts`, `storage.ts`, `fitness.ts` (+ tests).
- [ ] Add `Workout.setRows` + `WorkoutSet`. Helpers: `sessionVolume(setRows)`, `weeklyVolume(data)`, `lastSessionFor(data, split|exercise)`, `exerciseProgression(data, name)` → series, `isPR(data, exercise, weight, reps)`. Unit-test.
- [ ] Commit `"feat: gym structured sets + volume/last-session/progression/PR helpers"`.

### Task D2: Session reflow + steppers + reorder (usability) + per-set RPE/type (G2)
**Files:** `Gym.tsx`.
- [ ] Reflow the active session: set rows with −/＋ steppers for weight/reps, RPE field, set-type chip (warmup/working/drop), reorder/duplicate/delete rows; muscle map moves to an aside. Write `setRows` on finish (and a derived `sets: string[]` for back-compat).
- [ ] Commit `"feat: Gym session reflow + per-set steppers/RPE/type + reorder"`.

### Task D3: Overload helpers — last-session ref (G1) + live 1RM (G8) + PR detect (G4)
- [ ] While logging an exercise, show its last-session line ("last Push: Bench 60kg×5") and a live Epley 1RM from the current row. On finish, detect new PRs and surface a celebration toast (`sonner`).
- [ ] Commit `"feat: Gym last-session reference + live 1RM + PR auto-detect"`.

### Task D4: Rest timer auto-start (G5) + plate calculator (G6)
- [ ] After logging a set, auto-start the existing `RestTimer` (per-exercise preset rest). Add a plate calculator (target weight → plates per side, configurable bar weight + plate set).
- [ ] Commit `"feat: Gym rest auto-start + plate calculator"`.

### Task D5: Volume + progression charts (G3, G7)
- [ ] Lazy charts: weekly training volume; per-exercise weight progression (pick an exercise → mini line chart).
- [ ] Commit `"feat: Gym volume chart + per-exercise progression"`.

---

## Phase E — Docs + verification
- [ ] Update `FEATURES.md` (new tracker/fitness/gym features), `DECISIONS.md` (D-21: structured gym sets; D-22: tabbed settings), `docs/redesign/` add `06-view-enhancements.mdx`, in-app `Help`.
- [ ] Final `npm run build` (budget check) + `npm test` (all green) + before/after screenshots. Run `/document`.

---

## Build order (priority)
A (fast win) → B (Trackers, most-requested) → C (Fitness) → D (Gym, largest) → E (docs). Commit every task; stop-and-show between phases.
