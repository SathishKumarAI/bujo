# STATUS

**Stopped:** 2026-10-29, on `docs/phone-handoff` (top of the phone stack).
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
