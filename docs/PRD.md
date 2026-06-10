# bujo — Product Requirements Document

**Status:** v1 + Realism pack shipped (local-first) · **Owner:** Sathish Kumar · **Last updated:** 2026-06-10

## 1. Problem

People who want the reflective, deliberate habit of a paper bullet journal face
two bad options: (a) paper, which can't search, chart, or back up; or (b) heavy
apps (Notion, Day One) that demand accounts, subscriptions, and put personal
data on someone else's server. There's a gap for a **calm, minimal, private,
local-first** bullet journal that keeps the paper feel and adds only the digital
super-powers that matter.

## 2. Goals & non-goals

**Goals (v1)**
- Reproduce the core Bullet Journal method (rapid logging + key collections).
- Reproduce the minimal one-pen spreads from the inspiration videos.
- Add the highest-value digital features: search, streaks, charts, backups.
- 100% client-side: no backend, no account, no network calls.
- Premium feel: Catppuccin theme, dark/light, responsive, subtle 3D depth.

**Non-goals (v1)**
- Multi-user accounts / cloud sync (planned v2 — see §8).
- Mobile native apps (responsive web only).
- Social/sharing features.

## 3. Target users

| Persona | Need |
|---|---|
| **The minimalist journaler** (Elsa-style) | One-pen daily log, gratitude, memory, mood/intake tracking. |
| **The traveler** | Location-per-month, lightweight, offline, portable export. |
| **The quantified-self user** | Habit grid, mood/sleep/stress correlation, fitness log, streaks. |
| **The privacy-conscious user** | Data that never leaves the device; plain-file export. |

## 4. Success metrics

- Daily entry takes **< 60 seconds** (quick-capture friction target).
- Initial JS payload **< 200 KB gzip** (vite-spa budget). *Actual: ~73 KB.*
- Zero network requests after load (verifiable in devtools).
- Test coverage on all pure logic (dates, bullets, stats, storage).

## 5. Feature requirements (v1 — all shipped)

1. **Rapid logging** — task/event/note bullets; status lifecycle; important &
   memory signifiers; `#tags`; click-to-cycle.
2. **Quick capture** — prefix grammar (`t/e/n/*/^`), Enter to add.
3. **Today** — daily log, mood/stress/sleep (0–10), fast-break marker,
   gratitude, daily memory + photo, "on this day" flashbacks.
4. **Monthly** — calendar with event dots, location, goals, photo of the month.
5. **Trackers** — habit dot-grid by category, 30-day consistency %, rename/remove,
   mood·stress·sleep line chart.
6. **Fitness** — workout log (activity/duration/distance/calories/RPE/sets/notes),
   all-time totals, history.
7. **Collections** — future log, birthday list.
8. **Insights** — current/longest streak, task-completion %, full-text search.
9. **Wellbeing (gendered, optional)** — neutral cycle/temperature chart (female
   default) OR NoFap abstinence streak journal (male default); both toggleable.
10. **Settings** — dark/light theme, profile/gender, temp unit, JSON/Markdown
    export & import, backup nudge.
11. **Help** — in-app guide explaining every feature and the bullet legend.

## 5b. Realism pack (v1.1 — shipped)

Added to make the app feel like real paper *and* fit real daily life. See
`docs/TICKETS.md` epics E/F for the full list.

- **Journal feel:** dot-grid paper texture, handwriting font, taped-in photos,
  page-turn animation, emoji stickers, editorial serif titles + line icons.
- **Real-life usefulness:** recurring tasks, end-of-month migration flow,
  daily reminder + browser notification, opt-in weather + auto-location,
  calendar (.ics) import, PWA install + offline.
- **Method-complete:** task threading on migrate, index of months, future log.
- **Insight:** correlation detection (sleep↔stress↔mood), 7-day rolling
  averages, year-in-review, rotating reflection prompts.

All network features (weather/geocode) are **opt-in and off by default**.

## 6. Design principles

- **Minimal first.** Start simple; the journal evolves as the user does.
- **One color, one pen.** Catppuccin mauve as the single accent.
- **Calm depth.** Subtle 3D (shadow + lift), never skeuomorphic clutter.
- **Local & honest.** No dark patterns, no lock-in; export is one click.

## 7. Constraints & risks

| Risk | Mitigation |
|---|---|
| `localStorage` can be cleared by the browser → data loss | Backup nudge + one-click JSON/Markdown export; import to restore. |
| `localStorage` ~5 MB cap; photos are large | Images downscaled to ≤1024px JPEG @ 0.72 quality on upload. |
| Sensitive data (cycle, abstinence) on shared devices | Off by default; planned passcode + client-side encryption (v2). |
| Bundle bloat from charts | Recharts views are lazy-loaded (split chunk). |

## 8. v2 — multi-user / login (future)

Local-first stays the default. Login is **additive and opt-in**:
- Backend: a thin API (e.g. Vercel + Postgres/Turso) storing the same
  `JournalData` blob per user, end-to-end encrypted client-side.
- Auth: passkeys or email magic-link.
- Sync: last-write-wins on the JSON blob; later, per-collection merge.
- The local-only mode must keep working with no account.

See the build prompts in `docs/prompts/` to regenerate or extend the app.
