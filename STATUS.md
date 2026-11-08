# STATUS

**Stopped:** 2026-11-07, on `main` after #533. Settings is one drawing on
every device (the desktop cards are deleted, COD-571); every backup carries
its photos; Coaching's heading order is clean. **Production is still at
#524** — the permission check blocks this session from deploying; the owner
runs `bash scripts/ship.sh --deploy-only`.

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

## The next action

1. **Deploy** #525–#533 (owner — see above).
2. COD-573: `npm run a11y` cannot see Settings sheet contents (rows open
   sheets, no `aria-expanded`) — blind since #524.
3. COD-574 (owner's call): Backup print-to-PDF and Apple Health drag-and-drop
   went with the desktop cards.
4. Supabase project (COD-434), sync encryption (COD-436), COD-479 YouTube links.
5. Pages that deliberately have NO day strip: Today, Monthly, Trackers,
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
recovery-one-tap held by previews on 4191/4195; agent-a6eef2012354e2d3b holds
the merged `feat/settings-phone-rows-rest`).
