# Coach engine, modular card system & enlarge fix

Session 2026-06-18 (cont.). Adds proactive coaching, centralises card config for
single-place-of-edit modularity, fixes the enlarge modal, and records a full QA
sweep.

## Coach engine (`src/lib/coach.ts`, `CoachCard`)

Turns logged data into a few proactive "do this next" prompts — the difference
between a *tracker* (records the past) and a *coach* (guides the next action).
Pure + deterministic (`coach.test.ts`, 5 tests). Rules, priority-ordered:

1. **Check in** — if today's mood isn't logged yet (highest priority).
2. **Behind-pace habit** — a weekly-goal habit due today and behind → do it.
3. **Movement** — minutes left to the weekly active-minutes goal (or a win when met).
4. **Pickleball plan** — today's 3.5→4.0 phase + a drill, when the plan is active.

Shown as a "Your coach" card at the top of **Today**; each prompt links to its
view. Renders nothing when there's nothing useful to say.

## Modular card system — one place to rule them all

The request: *"single place of edit can change the entire cards setting."*

- **`CARD` tokens** (`src/components/ui.tsx`) — a single exported config object
  holding the card container classes and the enlarge-modal sizing
  (`container`, `modalBackdrop`, `modalPanel`, `modalChartHeight`). Every `Card`
  reads from it, so restyling **all** cards app-wide is a one-object edit.
- **`Card`** — the single rendering primitive: header, info toggle, collapsible,
  defer, and the enlarge modal. Edit here → every card changes.
- **`ChartCard`** — the canonical preset for visualizations: always
  `enlargeable`, wraps the chart in a `role="img"` sized box. Use it for any new
  chart so chart-card behaviour is defined in ONE place. Text/form cards use `Card`.

## Enlarge modal fix

Click-to-enlarge now genuinely enlarges (like the mood calendar), not just
widens: `CARD.modalChartHeight` forces the chart's `role="img"` plot area to
`64vh` inside the modal, so recharts' `ResponsiveContainer` fills it. Enlarge
stays restricted to **visualization cards only** (charts/calendars/heatmaps);
text, form, and list cards have no ⛶.

## QA sweep (Chrome DevTools, demo data)

Drove all 20 views + every tracker option through a real browser:

- **All 20 views**: render with content, **zero console/page errors**, no blank
  screens, no error boundaries.
- **Tracker options** (behind the ⚙ gear): Density (comfortable/compact),
  Hide weekends, Show archived, layout toggle (classic ↔ activity), wheel view,
  day/week/month, add-habit, and the habit-detail modal — **all function and
  persist correctly**. No bugs found.

The tracker options live behind the gear icon (top-right of the tracker card) —
discoverability by design, in keeping with the minimal one-pen aesthetic.
