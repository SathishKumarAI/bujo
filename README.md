# ✦ bujo — a minimal digital bullet journal

A private, local-first **bullet journal** web app built around the
[Bullet Journal method](https://bulletjournal.com/) by Ryder Carroll, in a
minimal one-pen style. Rapid logging, monthly spreads, habit & mood tracking,
fitness logging, and gendered wellbeing tools — all stored **only in your
browser**. No accounts, no server, no tracking.

![Today view](docs/screenshot-today.png)

## Why

Most journaling apps lock your data behind a login and a subscription. `bujo`
keeps the calm, deliberate feel of a paper bullet journal — but adds the things
paper can't do: instant search, streaks, charts that overlay your mood against
your sleep, and one-click backups.

## Features

| Area | What you get |
|---|---|
| **Rapid logging** | Tasks `·`, events `○`, notes `–`, with `✕` done, `>` migrated, `!` important, `▲` memory, `~` dropped. Click a glyph to cycle status. |
| **Quick capture** | Type `t`/`e`/`n` to set kind, `*` important, `^` memory, `#tag` to tag — Enter to log. |
| **Today** | Daily log, mood/stress/sleep sliders (0–10), fast-break marker, gratitude line, daily memory **with photo**. |
| **Monthly** | Calendar with event dots, location (for travelers), goals, and a **photo of the month**. |
| **Trackers** | Habit/stimulant/food dot-grid with 30-day consistency %, plus a mood·stress·sleep line chart. |
| **Fitness** | Workout log: activity, duration, distance, calories, RPE, strength sets, notes, and totals. |
| **Collections** | Future log (everything dated ahead) and a birthday list. |
| **Insights** | Current & longest streaks, task-completion %, and full-text search across everything. |
| **On this day** | Resurfaces entries and memories from the same date in past months. |
| **Wellbeing (gendered, optional)** | A neutral cycle/temperature chart, or a NoFap abstinence streak journal with milestones and a judgement-free relapse log — toggled by profile. |
| **Backups** | Export/import **JSON**, export **Markdown** (Obsidian/Logseq friendly). |
| **Polish** | Catppuccin Mocha **dark** + Latte **light** themes, subtle 3D depth, fully responsive, keyboard-friendly, image uploads auto-downscaled to fit local storage. |

## Tech

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (Catppuccin Mocha/Latte theme tokens)
- **Recharts** for the line charts (lazy-loaded)
- **localStorage** persistence — zero backend
- **Vitest + Testing Library** (33 tests)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the test suite
npm run build    # production build to dist/
```

The app is a static SPA — deploy `dist/` anywhere (Vercel, Netlify, GitHub
Pages). Your journal data never leaves the browser.

## Privacy

Everything is stored in your browser's `localStorage` under the key `bujo:data`.
There is no analytics, no network calls, no account. Because local storage can
be cleared by the browser, **export a backup regularly** (Settings → Export).

## Roadmap

- Optional passcode + client-side encryption (Web Crypto)
- Multi-user accounts & cloud sync (opt-in backend) — see `docs/PRD.md`
- PWA / offline install
- Command palette (`Cmd/Ctrl-K`)

## Inspiration

This project's spreads and minimal philosophy are inspired by two creators'
bullet-journal videos:

- **["My Minimalist Bullet Journal" (Elsa / van-life Scamp series)](https://www.youtube.com/watch?v=DRt8j7H1GvE)**
  — the one-pen minimal style, location-tracking monthly calendar, gratitude &
  daily-memory pages, and the mood/stress/sleep + intake trackers.
- **["EASY Minimalist BULLET JOURNAL Set Up 2025 | HOW TO START"](https://www.youtube.com/watch?v=6_SqKVS_8pM)**
  — minimalist monthly setup and beginner-friendly spread structure.

The Bullet Journal method itself is by **Ryder Carroll**.

## License

MIT — see [LICENSE](LICENSE).
