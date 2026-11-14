# STATUS

**Stopped:** 2026-11-14, on `main` after #559. COD-590 continues page by
page: Recovery (#557) and Insights (#558) are cards on the phone.
**Production is still at #553**: #557–#559 are not deployed. The owner
deploys with `bash scripts/ship.sh --deploy-only`.

## 2026-11-14: COD-590 Recovery and Insights, gates green again

| # | what |
|---|---|
| #557 | Recovery phone: `FlatCards` (no caret, no ⓘ, subtitle drawn), row editors in a `Sheet`, 7 chart panels `chart: true`, symbols as words |
| #558 | Insights phone: inside `FlatCards`; `usePlain()`; `plain()` handles ×, a/b, ↑↓, ±; `Stat`/`StatTile` speak words; rail select reads `Overview (4)` |
| #559 | a11y was red on main since #551: Program "– lb" name mismatch and Nutrition food rows clipped. Both fixed, 249/249 scans clean |

**Next:** COD-590 Nutrition, Challenges, Cycle (3 folds each), then Coaching
and Focus (chip rails). Trackers and Monthly wait on the owner's answer:
does "no month" cover the Monthly page and Trackers' month layout on a
phone? Insights' four `phone: true` charts stay (owner, 2026-10-31).

**How a page goes:** wrap its phone drawing in `FlatCards.Provider`; read
its lines through `usePlain()`; a row editor moves into a `Sheet`; probe
every panel at 390 for `[aria-expanded]`, charts and symbol lines; diff
desktop `#main` against a main build at 1440 (Recharts path decimals jitter
between two runs of main, so normalise them).

## 2026-11-13: cards, no subparts, no symbols, no week

| # | what |
|---|---|
| #539 | COD-585: Pull-ups phone, one card per exercise; manual rail became sheet rows |
| #540 | COD-586: trainer's 25 sessions as a program (`lib/trainerPlan.ts`), Hypertrophy / Trainer picker |
| #541 | COD-588: Program phone, one card per lift, a pill per set, Edit sets in a sheet |
| #542 | COD-592: Pull-ups plan on one page: numbers, the four methods as plain steps (`methodSteps`), form |
| #543 | COD-593: Home workout, routines and exercises as cards; `lib/plain.ts` turns symbols into words |
| #544 | COD-594: Today, nothing opens in place on a phone |
| #545 | COD-595: `HoldTimer` (giant stopwatch, saves seconds) on timed cards; timed Program rows now count as done |
| #546 | COD-596: no week/month on phone workout pages: one "Day N of M" picker |
| #547 | COD-600: top bar day chips became one "Today" pill (native date wheel) |
| #549 | COD-601: workout cards one row each (set counter, name + plan + Watch, weight / timer / input); `.set-pill` gone |
| #550 | COD-602: `IntervalTimer`: Tabata 20/10 x 8 runs itself, "15,30,15 s" holds wait between; beeps (iPhone cannot vibrate) |
| #551 | COD-603: `RestClock` in the dock after a set (up, or 3:00 down after a ladder); EMOM minute clock |
| #552 | COD-608 (commit says 604): tune work/rest/rounds before Start; Round done, Skip rest, Back; every program day lands in History |
| #553 | COD-614: Today's habits as two-column cards on the phone (tap anywhere, check pop, reduced-motion respected) |

**Next:** COD-590, the remaining phone pages as cards: Recovery (8 folds),
Insights (6), Trackers (4), Nutrition, Challenges, Cycle, Monthly (3 each);
Coaching and Focus still carry a chip rail. Check each page's desktop too.
Owner's open question: "month" beyond the workout pages (Monthly page,
Trackers' month layout)?

## Where it stands

| # | what |
|---|---|
| #476–#491 | phone pass on every logging page (Program/Pickleball shape) |
| #498, #512 | COD-537: the day strip lives IN the top bar — **3 days**, centred; tap the chosen day for any date |
| #504 | COD-547: touch press/reveal motion (`styles/touch-motion.css`), phone headings 20/700; **`cn()` was dropping size tokens** |
| #507–#510 | phone: Pickleball Competition rows, COD-500 Today plan → habits, Focus, Recovery review |
| #513, #517, #518 | the strip picks the log day on Nutrition, Focus, Program, Pull-ups, Home workout, Pickleball, Fitness, Strength (desktop: 7-day row) |
| #514 | COD-556: competition events and DUPR ratings are editable; a clashing rating asks |
| #515 | Help on a phone: one select, sections open in place (3.3 → 1 screen) |
| #516, #519 | Settings on a phone: iOS rows; tabs one segmented row; Account tab as rows (desktop byte-identical) |
| #520 | COD-564: Help drew Home workout twice |
| #521 | COD-560/561: desktop competition × confirms; DUPR ticks rounded |
| #523 | COD-567: Sync & Data tabs as phone rows (agent) |
| #524 | COD-568: desktop Settings = the phone rows (`AsPhone`), vertical tabs, `columns: 2 22rem` — deployed |
| #525 | COD-572: `Cell` text and Focus project segments wrap; clipped-text 9 → 0; `.vercel` ignored by eslint/vitest |
| #526 | COD-569: Import JSON asks "Replace N records with the file's M?" |
| #527 | COD-570: one `downloadBackup` — Apple Health's backup now has photos; Import offers "Export a backup first" |
| #529–#531 | COD-571: desktop Settings cards deleted (−1,478 lines); "not secret from the server" back on the account row; group titles 13px on desktop and in sheets |
| #532 | COD-481: Coaching chapter heading h3 → h2 |
| #533 | Settings README/docstrings follow the one drawing; `Row`/`Toggle` and dead barrel exports gone |
| #534 | COD-574: drop an Apple Health export onto its row (print link deliberately not restored) |
| #535 | COD-573: `npm run a11y` opens and scans every Settings sheet (`Cell opensSheet` → `aria-haspopup`), fails on zero |
| #536 | COD-479: watch-how links on Strength, Fitness, Nutrition, Focus — every page in the table now; desktop Strength rest-button name fixed |

## The next action

1. **Deploy** #525–#536 (owner: `bash scripts/ship.sh --deploy-only`; this
   session's permission check blocks it).
2. COD-575: phone-page sheets (Pickleball, Gym, Nutrition…) still unscanned
   by axe — add `aria-haspopup="dialog"` there and run `scanSheets`.
3. Owner decisions: Supabase project (COD-434, NXDOMAIN), sync encryption
   (COD-436).
4. Pages that deliberately have NO day strip: Today, Monthly, Trackers,
   Cycle, Plan (own calendars), Challenges desktop, Goals, Recovery, Program
   desktop, edit forms. Do not "complete" them.

## Live traps

- **Never chain `gh pr merge` after a gate** — read each exit code first
  (#507 merged a broken build; fixed in #511).
- **Parallel agents appending to one CSS file conflict on merge**: keep both
  sides, check brace balance; per-page files (`phone-settings.css`,
  `phone-help.css`) avoid it.
- **A new `--text-*` token goes into `lib/cn.ts`** too (COD-547).
- **Probe screenshots: absolute paths**, in the scratchpad.
- **Desktop-unchanged proof on tabs**: strip generated ids (radix
  `aria-controls`, `id`) before hashing `#main`, or every run differs.
- **`vercel build` reinstalls node_modules** and wipes the `--no-save`
  playwright/axe — reinstall after a deploy.
- **`.cell` is unlayered**: use `cell cell-stack` for a column.
- **Date-dependent tests**: pin the clock (`vi.setSystemTime`) — Cycle's went
  red on the 1st of a month.

## Environment

Preview: `npx vite preview --port 43xx --strictPort` (pick a free one; the
user's own is 4180). Dev: `127.0.0.1:5199`. Gates before every push:
`npm run verify`, `npm run design`, `npm run contrast`; a11y with
`BUJO_URL=… BUJO_THEMES=mocha BUJO_PHONE_THEMES=mocha,latte node scripts/a11y-axe.mjs`.
Old agent worktrees remain in `.claude/worktrees/` (recovery-review-phone,
recovery-one-tap held by previews on 4191/4195). `agent-a2055eaee3f51a294`
is a leftover folder held by a `vite preview --port 4340` (PID 52420) that
this session was not permitted to stop.
