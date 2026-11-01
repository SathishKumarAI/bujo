# STATUS

**Stopped:** 2026-11-01, on `main` after #505. Every logging page has its
phone pass; this stretch made the phone feel like an app (taps answer, the
day lives in the top bar) and found a type bug that shrank titles everywhere.

## Where it stands

| # | what |
|---|---|
| #476–#491 | phone pass on every logging page (Program/Pickleball shape) |
| #493 | Insights: one key chart per domain back on the phone |
| #494, #495 | Cycle: one-tap Day sheet, temperature row, caveat as points; Today's title switcher |
| #496 | COD-518: a tracked addiction's slip can be removed |
| #497 | Recovery's URL is `?view=recovery` (`?view=nofap` still lands) |
| #498 | COD-537: the day strip lives IN the top bar — 5 days, 3 beside a long title; tap the chosen day for any date |
| #499 | COD-511: `npm run icons` reads the current registry again |
| #500, #502 | Program: "Watch" beside every lift (phone + desktop), compact rows, Every week notes folded |
| #501, #503, #505 | one-tap sheets: Recovery details, Nutrition source, Pull-ups method |
| #504 | COD-547: touch press/reveal motion (`styles/touch-motion.css`), phone headings 20/700; **`cn()` was dropping size tokens** (desktop titles 15→17px, chips 15→13px) |

## The next action

1. **Focus** has no phone drawing at all (3.5 screens, desktop form on a
   phone): a full phone-page pass — log first, Date/Minutes as `Seg`, Tags as
   `.chip-toggle`.
2. **Pickleball Competition sheet** is the desktop form (1702px) — needs
   `Cells` rows (Format stays a select, 8 options).
3. Recovery review zone on a phone: "Win or loss" select + filter + pager +
   heading are three navigations for one panel; history rows wrap their `×`.
4. Older: Help and Settings phone passes, COD-500, COD-481 heading-order
   half; Supabase project (COD-434), sync encryption (COD-436).

## Live traps

- **A new `--text-*` token goes into `lib/cn.ts`** too, or tailwind-merge
  reads it as a colour and drops it (CLAUDE.md, COD-547).
- **Probe screenshots: absolute paths.** A relative `screenshot({path})` run
  from the repo root landed `prog-fold.png` in a commit (#502, removed in #504).
- **Compare bundles before a desktop diff** — read after two reloads and check
  the served `index-*.js` against `dist/index.html`; Playwright probes use
  `serviceWorkers: 'block'`.
- **`.cell` is unlayered**: `flex-col` utilities lose to its
  `align-items: center` — use `cell cell-stack`.
- **A `Sheet` is `.ios-form`**: single-choice chip rows become segmented.
- **The day strip portals into the bar** (`shell/barSlot.ts`); without the
  bar (component tests) it draws the old inline week.

## Environment

Preview: `npx vite preview --port 4180 --strictPort` (this session's).
Dev: `127.0.0.1:5199`. Gates before every push: `npm run verify`,
`npm run design`, `npm run contrast`; a11y with
`BUJO_URL=http://localhost:4180 BUJO_THEMES=mocha BUJO_PHONE_THEMES=mocha,latte node scripts/a11y-axe.mjs`
(backgrounded; never build while it runs). Agents ran in `.claude/worktrees/`
on previews 4190–4192, each stopped by its own PID.
