# Build Prompt — bujo v3: Smart Input, Dev Tracker & Richer Visualization

> **Role:** You are a senior solution architect + prompt engineer (Google / OpenAI /
> Anthropic bar). You design for clarity, isolation, and testability; you propose
> 2–3 approaches with a recommendation before building; you keep the app
> local-first, offline, and under the 200 KB-gzip initial-JS budget. Charts stay
> lazy or inline-SVG. Every pure helper is unit-tested. Progress is shown in
> **whole numbers, never fractions**.

This doc captures the 2026-06-11 PM backlog as a reproducible build prompt and a
scoped task list. It is the single source of truth for v3; if a task moves or is
duplicated elsewhere, update it **here too** (see §7 — the same sync rule we are
building applies to our own docs).

---

## 1. Context (XML-tagged for the building agent)

<app>
bujo — a local-first bullet-journal + health tracker. React 19 + Vite + TS,
Tailwind v4, shadcn/ui re-themed to Catppuccin. One `JournalData` object in a
`useReducer` (`src/store.tsx`), persisted to localStorage; pure logic in
`src/lib/*` (unit-tested). App shell in `src/components/shell/*`
(AppShell, Sidebar, TopBar, Page, cursor, viewChrome). Views in `src/views/*`.
</app>

<already-shipped>
Layout redesign (shell + all views), tabbed Settings, Challenges view,
Trackers v2 (today strip, presets, emoji, weekly-goal, detail drawer),
Fitness v2 (goal ring, sparkline, streak, PBs, auto-pace, edit). 77 tests green.
</already-shipped>

<constraints>
- Local-first; no network for core features; additive, migrate-safe model changes.
- Initial JS < 200 KB gzip; charts lazy or inline SVG/CSS (no new heavy deps).
- One control vocabulary: Switch (on/off), Segmented (enums). Whole-number progress.
- TypeScript strict, no `any`. Comments explain *why*. Update Help + FEATURES.md
  for any new UI.
</constraints>

---

## 2. The backlog (scoped, with recommendations)

### EPIC V3-A — Smart input (VS Code-style completion) + duplicate badge
**Problem.** Capture is fast but dumb: no tag/entry suggestions, and it's easy to
log the same thing twice. The user wants IntelliSense-style completion and a
"small circular field at the top of the text field" warning when a duplicate
exists.

**Design.**
- A reusable `SmartInput` wraps the text field, owns a suggestion popover
  (keyboard-navigable: ↑/↓ move, Tab/Enter accept, Esc dismiss — like VS Code).
- Suggestion providers (pure, in `lib/suggest.ts`): `#tags` from history,
  recent same-kind entries, slash-commands (`/task /event /note /habit`), known
  habit names. Ranked by recency + prefix match. Ghost-text inline hint for the
  top suggestion.
- **Duplicate detection:** as you type, fuzzy-match (normalized + Levenshtein/
  token overlap) against same-day entries (or existing habits). If ≥1 likely
  duplicate, render a **small circular badge at the top-right corner of the
  field** showing the count; click/hover → popover listing the matches with
  actions: *Go to existing · Merge · Add anyway*.

**More ways to handle duplicates (pick in §8):**
| Option | Behaviour | Trade-off |
|---|---|---|
| A. Corner badge + popover (recommended) | Non-blocking dot/count; expand to act | Discoverable, never interrupts flow |
| B. Inline ghost warning under field | Text "Similar: …" | Uses vertical space |
| C. Block on submit + confirm | Modal "Possible duplicate — add anyway?" | Safe but interrupts |
| D. Auto-coalesce | Same text → bump a count instead of new row | Magic; can surprise |
| E. Highlight the existing item | Scroll-to + flash the match | Good for lists, not for new capture |

**Data/logic.** `lib/suggest.ts`: `suggest(query, ctx) → Suggestion[]`,
`findDuplicates(query, items) → Match[]` (pure, tested). No model change for
suggestions; duplicates are read-only.

**Tickets.** V3-A1 `lib/suggest.ts` + tests · A2 `SmartInput` component +
keyboard nav · A3 wire into QuickAdd/entry edit · A4 duplicate badge + popover ·
A5 habit-name dupes in Trackers add-row.

### EPIC V3-B — Cross-place task sync (single source of truth)
**Problem.** "If a task is updated in one place, the other place must update too."
**Reality.** Entries are single records keyed by `id`; editing already syncs
everywhere the same `id` is rendered. The real gaps are: (1) recurrence-generated
instances aren't linked to their rule, so editing the rule doesn't propagate;
(2) a future-log entry that "lands" on a day can read as two things.
**Design.** Audit every place the *same logical task* is shown. Guarantee all
edits go through `updateEntry(id, …)`. Link generated instances via
`recurrenceId`; editing a rule offers "apply to future instances". The
duplicate-badge from V3-A becomes the "this exists elsewhere → jump" affordance.
**Tickets.** V3-B1 audit + map duplicate representations · B2 link recurrence
instances · B3 "edit rule → propagate" · B4 cross-reference jump via badge.

### EPIC V3-C — Developer work tracker ("Focus log")
**Problem.** Track coding/work: time, work style, stress.
**Design.** New view **Focus** (Health group) + `DevSession` model:
`{ id, date, durationMin, project?, focus(0–10), stress(0–10), interruptions?,
tags?[] }`. Quick log (start/stop timer or manual minutes). Visualize: hours/day
bars, **focus↔stress↔coding-time** correlation (reuse `lib/correlations.ts`),
deep-work streak, best coding hours, language/project breakdown.
**Tickets.** V3-C1 `DevSession` model + store + `lib/focus.ts` (+ tests) ·
C2 Focus view (log + timer) · C3 charts (inline SVG) · C4 correlation chips ·
C5 nav + viewChrome + Help.

### EPIC V3-D — Richer tracker visualization + finish Trackers v2
**Design.** GitHub-style **habit heatmap** (year), per-habit **trend sparkline**,
category **completion radar**, weekly-goal attainment over time, momentum
(improving/declining) chips. Plus the deferred Trackers v2 items: Day/Week/Month
grid toggle, drag-reorder, collapsible categories, in-grid count steppers,
habit↔mood correlation chips.
**Tickets.** V3-D1 habit heatmap · D2 per-habit sparkline + momentum · D3 radar ·
D4 finish U2/U4/U5/F2/F5.

### EPIC V3-E — Recommendations & smart defaults
**Design.** Non-intrusive, dismissible suggestion chips / ghost-text:
category-based weekly-goal default when adding a habit; prefill workout from last;
"you usually journal at 21:00 — set a reminder?"; challenge suggestions after a
streak. Pure `lib/recommend.ts` produces `Recommendation[]`; UI renders as a
small dismissible note (the "notes that go in, VS Code-completion style").
**Tickets.** V3-E1 `lib/recommend.ts` + tests · E2 suggestion-chip UI · E3 wire
into habit-add, workout-log, reminders, challenges.

### EPIC V3-F — Gym v2 (carried over)
Structured per-set model (RPE/type/rest), last-session reference, live 1RM, PR
auto-detect + toast, rest auto-start, plate calculator, volume + progression
charts. See `docs/superpowers/plans/2026-06-11-v2-view-enhancements.md` Phase D.

---

## 3. Build order (recommended)
F (finish what's scoped) → A (smart input — highest daily value) → D (tracker viz)
→ C (dev tracker) → B (sync audit) → E (recommendations). Each epic: model+helpers
+ tests first, then UI, then docs. Commit per ticket; screenshot-verify each.

## 4. Reproduction prompt (feed this to an agent per epic)
```
Implement EPIC V3-<X> from docs/prompts/05-platform-v3-smart-input-dev-tracker.md.
Follow the house rules in that doc's role header. For this epic:
1. Add the additive, migrate-safe model fields to src/lib/types.ts + emptyJournal().
2. Write the pure helpers in the named lib file with vitest tests; run them green.
3. Build the UI on components/shell/Page + ui.tsx/ui/* (shadcn). Whole-number
   progress only. Charts inline-SVG or React.lazy.
4. Wire nav/viewChrome/store as needed. Keep all existing tests green.
5. Update docs/FEATURES.md, DECISIONS.md, and the in-app Help view.
6. Verify: npm run build (budget < 200 KB gzip) + npm test + a screenshot.
Commit per ticket with a conventional message.
```

## 5. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Bundle bloat from completion/charts | Inline SVG; lazy any Recharts; measure each build |
| Fuzzy-match false positives | Tunable threshold; non-blocking badge (option A); unit tests on match logic |
| Model churn breaks old journals | Additive-only fields + `migrate()` defaults; never remove |
| Scope creep | Ship epic-by-epic, commit per ticket, screenshot-verify |

## 6. Definition of done (per epic)
Pure logic unit-tested; UI matches Catppuccin + control vocabulary; build under
budget; all tests green; FEATURES/DECISIONS/Help updated; before/after screenshot.

## 7. Task-sync rule (applies to this doc too)
This backlog is mirrored in `docs/TICKETS.md` (Epic V3). **If a ticket's status
or scope changes, update both places** — the same single-source-of-truth
principle V3-B builds for tasks. Prefer linking over duplicating.

## 8. Open questions (answer before building A/C)
1. Duplicate handling: which option(s) from V3-A's table?
2. Dev tracker: separate "Focus" view, or fold into Trackers as a habit type?
3. Smart-input scope: which fields get completion (quick-add only, or all)?
4. Recommendations: ghost-text inline, or a dismissible chip row?
