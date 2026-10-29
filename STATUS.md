# STATUS

**Stopped:** 2026-10-29, on `feat/phone-section-sheet` (top of the phone stack, #463).
**Full session record:** `docs/sessions/2026-10-29-phone-pages.md` — read it
first, it is written to be read cold.

## Where it stands

Every page has a phone shape now (no charts, the log first, desktop
unchanged). Nothing in this stretch is merged yet. **Two blockers are the
owner's, not code:** Supabase is unreachable (COD-434) and plaintext sync
needs a decision (COD-436).

| # | what | state |
|---|---|---|
| #438 → #447 | Pickleball, Fitness, Strength, Program v1, primitives | open, stacked |
| #439 | dev server pinned to 5199 | open, independent |
| #448 | old shell PR | **close it** — replaced by #449 |
| #449 → #457 | shell ☰ menu, Program log/bar/last weight, Plan, act column, Today, Mindset/Coaching/Home Workout, Focus/Reading | open, stacked |
| `docs/phone-handoff` | these docs | open, on top of #457 |
| #459 → #463 | demo clips (ChadMollickDotCom, 65 lifts), watch-how on drills/principles, sample-data notice → ☰ Notifications tab, Insights without charts on a phone, section sheet + bottom nav that stays | open, stacked on #458 |

**Then #464 (COD-486, COD-484):** the last six pages got a phone shape —
Monthly, Collections, Challenges, Recovery, Pull-ups, Settings; desktop DOM
identical on all six.

**Then #465 (COD-487, COD-481): phone navigation, the third pass.** The phone bar's
tab strip is gone: the title ("Body" over "Nutrition ▾") opens a 3-column
grid of all 20 pages, in the bottom bar's order, fitting one screen. The
bottom bar remembers each section's last page (`shell/lastPage.ts`). The
a11y gate opens that grid to reach a phone tab (`go()` in
`scripts/a11y-axe.mjs`).

**Then #466 (COD-488): Mind off the phone, and a grid door on Today.**
`PHONE_SECTIONS` drops Mind from the bottom bar and the grid (deep links
still open its pages; desktop unchanged). Today and section-less bars
(Settings, Help) get a ⊞ "All pages" button.

**Next:** COD-481 heading-order half still open (the chip name is fixed in #465). The
owner asked what "improving duration of the video" meant — unanswered.

## The next action

1. **Merge the stack in order**, retargeting each child to `main` before its
   parent is squash-merged (the auto-close trap in `CLAUDE.md`).
2. **Run the full gate once on the merged result**:
   `npx vite build && npx vite preview --port 4310 --strictPort &` then
   `BUJO_URL=http://localhost:4310 node scripts/a11y-axe.mjs` (background it).
   Last full run was #443 — 187/187.
3. **Owner:** restore/recreate the Supabase project (COD-434); decide
   encrypt-or-drop for sync (COD-436).
4. **Then the audit tickets:** COD-435 (feedback email public), COD-437
   (`/api/sync` auth + rate limit), COD-438, COD-455, COD-463.
5. **Phone, if asked:** Program could fold a lift's row once all its sets are
   ticked; Coaching's notes box sits below the open week by design.

## Live traps

- **A phone page decides by `useDevice()`, never CSS width.** Charts are
  filtered by a flag in the page's card registry (`chart: true` in
  `lib/cycleCards.ts`, `phone: true` in `lib/focusCards.ts`) through the SAME
  predicate the rail counts with.
- **`.phone-frame` is unlayered CSS on every phone page** (`App.tsx`
  `ViewFrame`) — it beats Tailwind utilities. Scope new phone rules under it
  or `.ios-form`, never a media query.
- **A dev server serves the checkout it started in** — and a branch swap under
  a running Vite can leave CSS stale (Program's bar drew stacked until a
  restart). Restart only a server this session started.

## Environment

Dev: `127.0.0.1:5199` from the main checkout (`npm run dev`). Probes need
`playwright` + `@axe-core/playwright` (`npm i -D --no-save …`, COD-273) and
resolve them from the repo's `package.json` via `createRequire`.
Gates before every push: `npm run verify`, `npm run design`,
`npm run contrast`.
