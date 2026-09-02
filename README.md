# ✦ bujo — a minimal digital bullet journal

A private, local-first **bullet journal** web app built around the
[Bullet Journal method](https://bulletjournal.com/) by Ryder Carroll, in a
minimal one-pen style. Rapid logging, monthly spreads, habit & mood tracking,
fitness logging, and gendered wellbeing tools — all stored **only in your
browser**. No accounts, no server, no tracking.

**▶ Live demo: <https://bujo-journal.vercel.app>** — pick *“This device only”* to
try it instantly, no account. Or run it locally and open `?demo=1` for a month
of sample data.

> Screenshots used to sit here. They are still generated on every push to `main`
> (`.github/workflows/screenshots.yml` → `npm run shots` → `docs/screenshots/`),
> and are worth a look, but a wall of images is not what a reader needs first
> from a repo — the shape of the codebase is. That is what follows.

## Why

Most journaling apps lock your data behind a login and a subscription. `bujo`
keeps the calm, deliberate feel of a paper bullet journal — but adds the things
paper can't do: instant search, streaks, charts that overlay your mood against
your sleep, and one-click backups.

## Why bujo is different

Most journaling apps make you pick one virtue. bujo refuses the tradeoff — it's
**paper-minimal in feel, quantified-self in power, and zero-knowledge in
privacy, at the same time, for free.**

| | **bujo** | Day One | Notion | Journey | Paper |
|---|:---:|:---:|:---:|:---:|:---:|
| Price | **Free (MIT)** | $35/yr | paid | $25/yr | notebook |
| Account required | **No** | Yes | Yes | Yes | No |
| Data location | **Your browser only** | their cloud | their cloud | their cloud | your bag |
| Offline (PWA) | **Yes** | partial | poor | partial | always |
| Bullet Journal method | **Native** | — | manual | — | yes |
| Habit grid + mood/sleep chart | **Built-in** | — | manual | basic | by hand |
| Auto correlations (sleep↔stress) | **Yes** | — | — | — | — |
| Fitness log | **Yes** | — | manual | — | by hand |
| Gendered wellbeing (cycle / NoFap) | **Opt-in** | — | — | — | — |
| Recurring tasks + migration ritual | **Yes** | — | manual | — | yes |
| Open-book look & feel | **Yes** | — | — | — | yes |
| Own/export your data | **1-click JSON+MD** | locked-in | partial | partial | retype |

**Six things nobody else combines:** local-first + free + no account · the real
Ryder-Carroll method · a client-side correlation engine · gender-aware wellbeing ·
paper *feel* (book frame, dot-grid, handwriting, stickers) with digital power
(search, streaks, charts) · honest data ownership (Markdown export → Obsidian).

> **Try the live demo:** open the app with `?demo=1` to load a month of sample data.

## Features

| Area | What you get |
|---|---|
| **Rapid logging** | Tasks `·`, events `○`, notes `–`, with `✕` done, `>` migrated, `!` important, `▲` memory, `~` dropped. Click a glyph to cycle status. |
| **Quick capture** | Type `t`/`e`/`n` to set kind, `*` important, `^` memory, `#tag` to tag — Enter to log. |
| **Today** | Daily log, mood/stress/sleep sliders (0–10), fast-break marker, gratitude line, daily memory **with photo**. |
| **Monthly** | Calendar with event dots, location (for travelers), goals, and a **photo of the month**. |
| **Trackers** | Habit/stimulant/food dot-grid with 30-day consistency %, plus a mood·stress·sleep line chart. |
| **Fitness** | Workout log: activity, duration, distance, RPE, notes, totals, plus a **nutrition / macro diary** (calories + protein/carbs/fat). |
| **Gym** | Push/Pull/Legs training: split selector with next-day suggestion, PPL routines, structured set logging, **personal records**, **body-weight chart**, a **muscle map** showing what each split works, and a **wger exercise database** (search + images). |
| **Stats** | Visual dashboard: activity heatmap, weekly radar, sleep-vs-mood scatter, workout-minutes bars, task-status donut, mood calendar, tag cloud. |
| **Collections** | Future log (everything dated ahead) and a birthday list. |
| **Insights** | Current & longest streaks, task-completion %, and full-text search across everything. |
| **On this day** | Resurfaces entries and memories from the same date in past months. |
| **Wellbeing (gendered, optional)** | A neutral cycle/temperature chart, or a NoFap abstinence streak journal with milestones and a judgement-free relapse log — toggled by profile. |
| **Plan** | Recurring tasks (daily/weekly), end-of-month **migration** flow, **calendar (.ics) import**. |
| **Realism** | Dot-grid **paper texture**, **handwriting** font, **taped-in** photos, page-turn animation, emoji **stickers**, rotating **reflection prompts**. |
| **Smart** | **Correlation** insights (sleep↔stress↔mood), 7-day rolling averages, **year-in-review**, index. |
| **Daily life** | **Reminders** + browser notifications, opt-in **weather + auto-location**, **PWA** install + offline. |
| **Backups** | Export/import **JSON**, export **Markdown** (Obsidian/Logseq friendly). |
| **Polish** | Editorial serif titles + clean line icons, Catppuccin Mocha **dark** + Latte **light**, subtle 3D depth, fully responsive, keyboard-friendly, image uploads auto-downscaled. |

## Architecture

A single-page React app with **no backend on the default path**. All state is
one JSON object in `localStorage` under `bujo:data`; the optional sync adapters
are opt-in and additive, never the source of truth.

| Layer | What it is |
|---|---|
| **Build** | Vite · React 19 · TypeScript. No router — `App.tsx` switches on a `?view=` id, read once at boot |
| **Style** | Tailwind CSS v4. Theme tokens in `src/index.css` (`@theme`) and `src/styles/tokens.css`; shadcn semantic vars mapped onto Catppuccin |
| **Primitives** | shadcn/ui + Radix in `components/ui/`, re-themed. `cn()` = clsx + tailwind-merge |
| **Charts** | Recharts, lazy-loaded so they stay off the initial bundle |
| **Offline** | `vite-plugin-pwa` — installable, service-worker app shell |
| **Tests** | Vitest + Testing Library — **64 test files, 896 tests** |

### Data flow

```
        localStorage  "bujo:data"
              ▲   │
     save     │   │  load + migrate            src/lib/storage.ts
              │   ▼
          useReducer ──► JournalData ──► useJournal()       src/store.tsx
              ▲                              │                (React context)
   actions    │                              ▼  read
   (addEntry, toggleHabit, setHabitValue…)  views/ + components/
              │
              └── optional, opt-in, additive:  supabase.ts · bujocloud.ts · fscloud.ts
```

`JournalData` (`src/lib/types.ts`) is the single source of truth. Everything
derived — streaks, correlations, PRs, heatmaps — is a **pure function in
`src/lib/`** with its own unit test, not state.

> ⚠️ There are several write paths, and silent divergence between them is the
> risk this codebase watches hardest. Before touching `storage.ts`, `supabase.ts`,
> `bujocloud.ts`, `fscloud.ts` or the export paths, read `.claude/CLAUDE.md` —
> that work has a dedicated agent for a reason.

### Every page has the same shape

Screens are not free-form. `components/page/PageLayout.tsx` imposes a
**three-zone contract**, and there is deliberately no zone 4:

| Zone | Holds | Enforced by |
|---|---|---|
| 1 · **orient** | at most **four** facts, one bar | `StatBar` caps it |
| 2 · **act** | the one thing the page exists to do — never folded | convention + `docs/pages/*.md` |
| 3 · **review** | what has been recorded: the signature visual, then folds | `SummaryStrip`, `QuietSection` |

### The gates are the design

Eight, all runnable locally. Each was earned by a bug that shipped past
everything else, and the story is in `CLAUDE.md`.

| Command | What it catches | In CI |
|---|---|---|
| `npx tsc -b` | types. **Not `--noEmit`** — the root tsconfig is solution-style, has no root files, and always exits 0 | yes |
| `npx vitest run` | 896 tests | yes |
| `npx eslint .` | lint | yes, **soft** — pre-existing debt tolerated |
| `npm run design` | design-system rules read off the source | yes |
| `npm run contrast` | every accent × every theme, and that the palette's two copies agree | yes |
| `npm run a11y` | axe over every view × 5 themes × 2 widths, **folds forced open** | yes |
| `npm run smoke` | every view renders — and asserts it is looking at *this* app, after it once graded a different project for three PRs | yes |
| `npm run clipped` | text showing less than it holds, and controls pushed off-screen by an ancestor | **no — local only** |

## Directory structure

```
bujo/
├── src/
│   ├── main.tsx              entry — wraps <App> in <JournalProvider>
│   ├── App.tsx               the view switch + shell composition (no router)
│   ├── store.tsx             JournalProvider, useReducer, useJournal() context
│   ├── index.css             Tailwind v4 @theme — the CSS half of the palette
│   ├── styles/               tokens.css (type/space scale), layout.css
│   ├── lib/             73   pure logic + types, unit-tested (+52 test files).
│   │                         storage · types · date · stats · fitness ·
│   │                         correlations · colors · deepLink · validate ·
│   │                         supabase / bujocloud / fscloud
│   ├── domain/               cross-cutting vocabulary: activities, sessions
│   ├── views/           28   one file per screen — Today, Plan, Gym, Trackers…
│   │   └── today/            Today is big enough to be a directory
│   ├── components/
│   │   ├── ui/               shadcn primitives, re-themed
│   │   ├── ui.tsx            the bespoke kit (Card, Empty, Segmented, StatTile)
│   │   ├── page/             the three-zone contract: PageLayout, StatBar,
│   │   │                     SummaryStrip, DisclosureRow, CalendarHeatmap
│   │   ├── shell/            AppShell, TopBar, SectionTabs, BottomNav, nav,
│   │   │                     sections, cursor, viewChrome
│   │   └── …13 feature dirs  gym · trackers · pickleball · stats · reading ·
│   │                         recovery · program · mindset · collections ·
│   │                         focus · fields · feedback · mod
│   └── test/                 vitest setup
├── scripts/                  the gates + the measuring tools (a11y-axe,
│                             clipped-text, check-contrast, check-design-system,
│                             page-census, smoke-views, capture-screenshots)
├── docs/                     the reasoning. pages/ per screen, engineering/
│                             per lens, plus ARCHITECTURE / DECISIONS / RULES
├── public/                   favicon, icons, muscles/ (bundled wger diagrams)
├── api/                      optional serverless handlers — feedback, sync
├── docker/                   optional self-host: nginx, initdb, security headers
├── src-tauri/                optional desktop shell (Rust)
├── archive/                  retired code, kept not deleted — never imported
├── CLAUDE.md                 house rules + the traps, read this first
└── STATUS.md                 written when someone STOPS: where, next, gotchas
```

**Any directory with more than ~4 source files carries its own `README.md`
whose first section is a `change → file` table.** Read that instead of the
code — `src/components/trackers/README.md`, `src/components/shell/README.md`,
`scripts/README.md`. Files target ~300 lines and hard-cap at 500.

## Keeping this current

This section is a claim with a date on it, and a stale map costs more than no
map. **When the architecture moves, update it in the same commit as the move** —
that is the rule in `CLAUDE.md`, and `.github/workflows/docs-guard.yml` warns
on any PR that changes `src/` without touching docs or tests.

| What you changed | What to update, same commit |
|---|---|
| Added / removed / renamed a **top-level directory** | the tree above — it is the authoritative copy; `docs/ARCHITECTURE.md` points here |
| Changed **how data is loaded, saved, migrated or synced** | the data-flow diagram above **and** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Added a **feature directory** under `src/components/` | the tree above **and** that directory's own `README.md` `change → file` table |
| Added a **screen** | [`docs/pages/`](docs/pages/) entry, the `VIEWS` list in `scripts/a11y-axe.mjs`, and `scripts/view-ids.mjs` |
| Added or changed a **gate** | the gate list above and [`docs/PIPELINE.md`](docs/PIPELINE.md) |
| Made a decision worth arguing with later | [`docs/DECISIONS.md`](docs/DECISIONS.md) |
| Hit a trap that cost you an hour | the trap list in [`CLAUDE.md`](CLAUDE.md) — that file is the reason the next session does not repeat it |

Run `node scripts/page-census.mjs` before quoting a number about a page. Numbers
in docs here have been wrong by 4× because they were copied rather than measured.

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

## Docs

- [`docs/engineering/`](docs/engineering/README.md) — **engineering views**: the app through 5 lenses (user · architecture · backend · data-eng · ML) + [UML](docs/engineering/uml.md)
- [`docs/WHY.md`](docs/WHY.md) — **why bujo: research, taste-direction, critical thinking & options** (incl. tracker-redesign directions)
- [`docs/PIPELINE.md`](docs/PIPELINE.md) — one-command ship pipeline (`scripts/ship.sh`) + CI
- [`docs/features/daily-use-guide.md`](docs/features/daily-use-guide.md) — feature guide & day-to-day use
- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical architecture
- [`docs/FRONTEND_SPEC.md`](docs/FRONTEND_SPEC.md) — frontend spec & design system
- [`docs/SECURITY.md`](docs/SECURITY.md) — security & privacy / threat model
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) — a11y status & checklist
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — decision log (why it's built this way)
- [`docs/FEATURES.md`](docs/FEATURES.md) — feature reference
- [`docs/TICKETS.md`](docs/TICKETS.md) — feature ticket list (every epic)
- [`docs/GOOGLE_DRIVE.md`](docs/GOOGLE_DRIVE.md) — optional Drive sync setup
- [`docs/prompts/`](docs/prompts/) — reusable build prompts:
  [build from scratch](docs/prompts/00-build-from-scratch.md),
  [add feature](docs/prompts/01-add-feature.md),
  [add login/sync](docs/prompts/02-add-login-and-sync.md),
  [add tracker module](docs/prompts/03-add-tracker-module.md),
  [build this *kind* of app](docs/prompts/04-build-this-kind-of-app.md)

## Roadmap

- Optional passcode + client-side encryption (Web Crypto)
- Multi-user accounts & cloud sync (opt-in backend) — see `docs/prompts/02-add-login-and-sync.md`
- Command palette (`Cmd/Ctrl-K`)
- Custom free-form collections UI

## References & inspiration

All code here was written from scratch (see [CREDITS.md](CREDITS.md) for full
attribution and dependency licenses). These are the sources that shaped the
features and design:

- **Bullet Journal method — Ryder Carroll** · https://bulletjournal.com/
- **"My Minimalist Bullet Journal" (Elsa, van-life series)** · https://www.youtube.com/watch?v=DRt8j7H1GvE
  — one-pen style, location-per-month calendar, gratitude & daily-memory pages, mood/stress/sleep + intake trackers
- **"EASY Minimalist BULLET JOURNAL Set Up 2025 | HOW TO START"** · https://www.youtube.com/watch?v=6_SqKVS_8pM
  — minimalist monthly setup & beginner spreads
- **The Lazy Genius — "How to Bullet Journal"** · https://www.thelazygeniuscollective.com/blog/how-to-bullet-journal
  — index / future log / signifiers / migration / threading / collections
- **GRIT (by 8sujan6)** · https://github.com/8sujan6/GRIT
  — fitness features: fast set logging, custom routines, exercise library, personal records, body-metrics, offline-first
- **wger** · https://wger.de/en/software/features · https://wger.de/en/exercise/overview/
  — nutrition / macro diary, body-weight tracking, the **exercise database** (wger's public API) and the **anatomical muscle diagrams** (bundled in `public/muscles/` so they work offline) · both CC-BY-SA

Full credits, library licenses (React, Recharts, lucide, Tailwind, Catppuccin,
fonts) and network-service attributions are in **[CREDITS.md](CREDITS.md)**.

## License

MIT — see [LICENSE](LICENSE).
