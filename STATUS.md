# STATUS

**Stopped:** 2026-10-31, on `main` after #491. Every page you LOG on has its
phone pass in the Program / Pickleball shape; desktop unchanged on each
(DOM element count + `#main` text diffed against main's build per PR).

## Where it stands

| # | page | phone shape |
|---|---|---|
| #476 | Pull-ups | Starting From Zero day first; free session in a sheet |
| #477, #478 | Nutrition | day strip · scoreboard · Your usual (pins, usage, Indian staples) · Add-food sheet |
| #479, #480, #481 | Challenges, shared `DayStrip` | strip with week arrows (one 56px row) |
| #482–#484 | Recovery | one-line streak · frequent urges (Held / Gave in) · today's count on the rows |
| #485 | Today | trimmed check-in, fasting, no duplicate status strip; plan card's habits-left count fixed |
| #486, #489 | Cycle | one-line orientation · flags in one row · extras in a sheet |
| #487 | Goals | your goals first as rows with − / + |
| #488 | Home workout | routine select · tap-per-set rows · log dock |
| #489 | all strip pages | `DayStrip` pinned under the top bar; Today's bar drops its date stepper |
| #490 | Coaching | week select · drill rows · dock (done → next) |
| #491 | Collections | add forms in sheets; deletes ask first |

Monthly reviewed and left (the calendar is the page).

## The next action

1. **Owner decision pending — Insights on a phone.** It is text-only by the
   "a phone logs, a desktop reads" rule, and was reported as "not able to see
   the insights". Options offered: key charts back on Insights only
   (recommended), all charts, or keep text-only. Nothing built yet.
2. **COD-518** (backlog): a tracked addiction's lapse day cannot be removed
   (only the main streak's can); needs `removeAddictionRelapse` + restartFrom.
3. **COD-511** (backlog): `scripts/build-icons.mjs` reads a registry format
   that no longer exists and rewrites `icons.tsx` (drops the `// was` notes).
4. Left: Help and Settings phone passes (reading / settings pages).
5. Older: COD-500 (desktop streak button), COD-481 heading-order half;
   Supabase project (COD-434) and sync encryption decision (COD-436).

## Live traps

- **Chrome DevTools MCP needs Chrome on 9333** after a reboot — see memory
  `chrome-devtools-mcp-port`. Re-emulate the phone after any reconnect (the
  emulation is per-connection; a fresh one reads 767px wide).
- **Compare bundles before a desktop diff**: the app reloads once after a new
  build (`controllerchange`), so read after two reloads and check the served
  `index-*.js` against `dist/index.html` — one "identical" diff this session
  was two reads of the same old bundle.
- **`.cell` is unlayered**: `flex-col` utilities lose to its
  `align-items: center` — use `cell cell-stack`.
- **A `Sheet` is `.ios-form`**: single-choice chip rows become segmented,
  multi-choice wrap four to a line (long labels now take their width).
- **Sticky works against the parent**: the day strip must sit at page level.

## Environment

Preview: `npx vite preview --port 4180 --strictPort` (this session's).
Dev: `127.0.0.1:5199`. Gates before every push: `npm run verify`,
`npm run design`, `npm run contrast`; a11y with
`BUJO_URL=http://localhost:4180 BUJO_THEMES=mocha BUJO_PHONE_THEMES=mocha,latte node scripts/a11y-axe.mjs`
(backgrounded; never build while it runs).
