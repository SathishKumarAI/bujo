# Next session

Written 2026-11-08 at the end of the Settings-one-drawing session
(`docs/WORKLOG.md`, 2026-11-01…07). Rewrite this file once picked up.

## 0 · Deploy what is merged

Production is the #524 build. #525–#537 are on `main` and not live:
`bash scripts/ship.sh --deploy-only` (the session's permission check blocks
it — the owner runs it). Afterwards reinstall the gate deps
(`npm i -D --no-save playwright @axe-core/playwright`): `vercel build`
reinstalls `node_modules`. Confirm the served bundle hash against
`dist/index.html`.

## 1 · COD-575 — sheets on the phone pages are not scanned

`scripts/a11y-axe.mjs`'s `scanSheets()` (COD-573, #535) opens every
`#main [aria-haspopup="dialog"]` — on Settings only. Pickleball's QuickLog,
Gym, Nutrition's Add food and the other phone sheets open from buttons with
no `aria-haspopup`, so axe has never seen their contents. Add the attribute
at those buttons (`Cell opensSheet` where it is a `Cell`), run the pass on
those surfaces at phone width, keep the zero-scanned failure, arm it with a
plant.

COD-479 (watch-how links) is DONE as of #536 — every page in its table.
One known gap: the phone's OPENED logged-food row has no link (six 44px
controls already fill it); Your usual and Add food carry it.

## 2 · Owner actions still blocking production

- **COD-434** — the Supabase project does not resolve (NXDOMAIN). Restore it
  or create a new one and update the Vercel env vars. Google sign-in is dead
  until then. (The 2026-10-14 migration note that used to head this file
  applies to whichever project is live.)
- **COD-436** — journal sync is plaintext. Decide: encrypt before upload, or
  drop cloud sync.

## 3 · Audit tickets, code — check state on the board first

COD-435 (feedback form publishes the email publicly), COD-437 (`/api/sync`
auth + rate limit), COD-438 (hardening), COD-455 (desktop axe blind under the
book cover), COD-463 (dead TopBar rows).
