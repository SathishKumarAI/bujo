# STATUS

**Stopped:** 2026-10-05. `main` at `0bed203`, clean tree, nothing open.
**17 PRs merged this session** (#320–#336). `npm run verify`: 121 files, 1691
tests, exit 0.

## First thing: 10 GB of worktrees, and one decision

`.claude/worktrees/` holds **17 worktrees totalling 10 GB** — one per agent
session going back weeks, each a full second copy of the app. Not harmless
clutter:

- a dev server started in one is **pinned to it**, so a tab on that port never
  shows changes made here however hard you reload (trap already recorded);
- `vitest` would double-count them, which is only not happening because
  `vite.config.ts` excludes the path — a mitigation, not a fix.

`git worktree list` names them. Pruning is a deletion, so it is **not** done
here: run `git worktree remove` / `git worktree prune` yourself. The newest is
`locked` and needs `--force`.

## What this session did

Started as "connect this to Supabase", became five pieces of work.

| | |
|---|---|
| **Sync hardening** COD-265/266/267 | Settings' **Pull erased the cycle log on every press**; Drive **uploaded** it. Four pull paths unguarded, one egress door missing. PBKDF2 150k → 600k both sides, path code out of the query string, three recoverable blob versions |
| **CI** COD-268/269 | Browser gates cancelled at 15m03s, so `smoke` and `clipped` **never ran at all** on two merges. Split into two jobs. A leaked `setTimeout` was failing CI with every test passing |
| **Board P1s** COD-244/238 | Contrast gate now measures the card ground; unreachable phone subtitles 81 → 24 |
| **Accounts** COD-271 | Google sign-in, journal encrypted client-side into Supabase, security disclosure. Five increments, all merged |
| **Home Workout** COD-272 | 21 → 83 movements, cited manual, page on the contract. Found three defects in *shared* code |

Full account: `docs/WORKLOG.md`, two entries dated 2026-10-05.

## The one thing blocking the account feature

**Nothing has run against a real Supabase project, because there isn't one.**
The guards are proven as logic, not behaviour. Before relying on any of it:

1. Create the project, run `supabase/schema.sql`, enable the Google provider.
2. `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` into `.env.local` and Vercel.
3. **Sign in as a second account and confirm it cannot read the first's row.**
   RLS is what makes this multi-tenant, and a policy nobody has tried from the
   other side is a policy nobody has tested.

Until those env vars exist the feature is **absent** — no client constructed,
nothing rendered — so `main` behaves exactly as it did before.

Design, threat model and all 14 edge cases: `docs/security/account-sync-plan.md`.

## Traps this session added, all now in CLAUDE.md

- **The browser gates need two commands nobody had written down.** `playwright`
  and `@axe-core/playwright` are in neither dependency list *on purpose* — CI
  installs them per job. `npx playwright --version` answers from the npx cache,
  so the obvious check lies.
- **`npm run design` and `npm run contrast` are not in `npm run verify`** but
  are in CI, which is how a locally green change goes red on push.
- **An extraction can take the markup and leave the fix behind.** `VideoLink`
  was pulled out of a call site carrying a measured contrast fix inline; five
  call sites then failed at 4.14:1 for months, behind folds no gate reaches.
- **A `SectionRail` in a review column can never become a rail** — it flips at
  896px and zone 3 is 722px, so it has always shipped its phone strip on desktop.

## Open, deliberately

- **COD-228** — auto-sync keeps the passphrase in plaintext, defeating the
  passcode lock. Disclosed on screen, and now in the new security card too.
- **COD-270** — the 24 remaining unreachable subtitles are all `hideInfo` cards:
  a per-card copy decision, not a mechanism. Gate budgeted at 24; lower it as
  they go.
- **COD-273/274** — the gate install recipe lived only in CI; the base-layer
  anchor blue fails on a raised panel.
- **No compare-and-swap on `/api/sync`** — this `@vercel/blob` exposes no
  `ifMatch` on `put`.
- **`?code=` still accepted** by `api/sync.ts` for bundles cached before #323.
  Drop that arm one release on; it is the logged-secret path the change closed.

## Not verified

- **No account restore dialog, and no sign-in round trip, has been clicked.**
  All need a configured remote or a real project. Covered by unit and source
  assertions, which is not the same as having seen it.
- **The deploy is behind `main`** — a read-only probe found production still
  serving the old `/api/sync` handler. The v1→v2 path migration in `pullCloud`
  is what makes that safe to catch up on.
- One pre-existing lint warning, unrelated: `src/App.tsx:120:6`
  `react-hooks/exhaustive-deps`. Present on `main` before this session.
