# STATUS

**Stopped:** 2026-11-01, on `main` after #521. Every logging page has its
phone pass and the day strip; Help and Settings are phone pages now; the
agents' backlog finds (COD-560/561/564) are fixed.

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

## The next action

1. **Settings Sync & Data tabs on a phone**: the cards left there (sign-in,
   local account, encrypted sync, local model, exports/backup, Apple Health,
   tags, project links) become rows — an agent branch
   `feat/settings-phone-rows-rest` was in flight; check `gh pr list`.
2. COD-481 heading-order half; Supabase project (COD-434), sync encryption
   (COD-436); COD-479 YouTube links.
3. Pages that deliberately have NO day strip: Today, Monthly, Trackers,
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
- **`.cell` is unlayered**: use `cell cell-stack` for a column.
- **Date-dependent tests**: pin the clock (`vi.setSystemTime`) — Cycle's went
  red on the 1st of a month.

## Environment

Preview: `npx vite preview --port 43xx --strictPort` (pick a free one; the
user's own is 4180). Dev: `127.0.0.1:5199`. Gates before every push:
`npm run verify`, `npm run design`, `npm run contrast`; a11y with
`BUJO_URL=… BUJO_THEMES=mocha BUJO_PHONE_THEMES=mocha,latte node scripts/a11y-axe.mjs`.
Two old agent worktrees (recovery-review-phone, recovery-one-tap) remain in
`.claude/worktrees/`, held by previews on 4191/4195 this session could not stop.
