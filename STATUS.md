# STATUS

**Stopped:** 2026-10-05, on `main` at `b0e79fa`. **Nothing is open** — the four
PRs from this session are merged and their branches deleted. Clean tree.

## What this session did

A request to "add Supabase sign-in and background sync". The answer was no, with
reasons, and the audit it prompted found three real problems that are now fixed.

```
#320  docs/sync-hardening-plan      the audit + the plan            (COD-320 n/a)
#321  fix/sync-egress-boundary      one egress door + contract test  COD-265 ✔
#322  fix/sync-blob-recovery        /api/sync version history        COD-266 ✔
#323  fix/sync-kdf-hardening        PBKDF2 600k + derived path code  COD-267 ✔
```

The plan is `docs/security/sync-hardening-plan.md` and it is still the map —
read it before touching any sync path.

## The one thing to decide next

**`docs/life-schedule-v3-final.html` got committed in #323 and was not mine.**
It was untracked in the working tree when this session started, and a
`git add -A docs` swept it in. It is harmless but unintended. Either keep it or
`git rm --cached docs/life-schedule-v3-final.html` and gitignore it — your call,
which is why it is sitting here rather than already undone.

## What changed that a future session will trip over

**`forEgress` is now the only door out.** Nothing may call `forNetwork`
directly; `src/lib/egress.contract.test.ts` fails the build if anything does,
and it also forbids a raw `replaceAll(migrate(…))` outside the two folder-restore
paths. If you add a sync target, wire `forEgress` and `mergePulled` or that test
goes red — which is the point. Its key-shape trap is documented in the file:
`import.meta.glob` keys for `src/lib` siblings are `./x.ts` with **no `lib/`
segment**, so a pattern written `lib/x.ts` matches nothing and every assertion
passes vacuously.

**`api/` is now typechecked.** It was in no tsconfig at all before #322 — that
is why `api/sync.ts` hand-rolls its `Req`/`Res` interfaces. It lives in
`tsconfig.node.json` now. Expect `tsc -b` to have opinions about serverless code
it never read before.

**Two version numbers must never be edited in place:**

| Thing | Where | If you edit it |
|---|---|---|
| `ROUNDS[1] = 150_000` | `src/lib/crypto.ts` | every journal already in `bujo:enc` or the sync blob becomes undecryptable, reported to the user as "wrong passcode" |
| `'bujo-sync-path:v2'` | `src/lib/crypto.ts` | every cloud journal moves to a new path; only `legacyCode` + `pullCloud`'s fallback make the old one findable |

Add a row; do not change one.

**`pullCloud` writes.** On a v1-path hit it re-encrypts to the new path. That is
deliberate and best-effort — a failed migration must not turn a successful read
into an error — but it does mean a "pull" can POST.

## Not verified, and worth knowing

- **No restore dialog was clicked in a browser.** All four need a configured
  remote to render, so no gate reaches them. The copy is pinned by a source
  assertion (`CYCLE_CLAUSE` in the contract test) and the behaviour by unit
  tests, which is not the same as having seen it.
- **Nothing ran against the real Vercel Blob store or the deployed function.**
  `api/sync.test.ts` uses `vi.mock('@vercel/blob')`. The first production POST
  is the real test of `copy`'s option shape; it is inside the best-effort `try`,
  so a mistake there means "no history", not "no save". Likewise the first real
  pull is what proves the `x-sync-code` header path — the `?code=` fallback is
  what makes that safe to find out.
- `npm run a11y`, `clipped` and `space` were **not** run. Nothing in these four
  PRs changes rendered page content; `smoke` was run twice (24/24, clean) for a
  specific reason — `cyclePrivacy` now imports `csv`, and a circular import
  there would fail only in the browser.

## Open, deliberately

- **COD-228** — `bujo:sync` holds the sync passphrase in plaintext, which
  defeats the passcode lock. Disclosed on screen in `CloudSyncCard` and in
  `AUTH.md`. A surfaced trade-off, not a hidden bug: encrypting it means
  auto-sync cannot run while the journal is locked, which is most of the time.
- **No compare-and-swap on `/api/sync`.** `PutCommandOptions` in this
  `@vercel/blob` exposes no `ifMatch` (only `del` does), so it would mean
  hand-rolling the REST call. Upgrade path is in a `ponytail:` comment.
- **The v1 sync blob is left in place** after migration, with the reasoning in
  `pullCloud` and in the plan §3. Rotating a passphrase is not erasing.
- **`?code=` still accepted** by `api/sync.ts` for cached bundles. Drop that arm
  one release after `b0e79fa` — it is the logged-secret path the change exists
  to close.
- **Supabase sign-in** — plan §0. If it is ever actually wanted, that section
  names the six surfaces and the two docs that have to change first.

## Environment notes

- `.env.local` had dead `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` entries.
  Removed locally; the file is gitignored, so there is no commit for it.
- One pre-existing lint warning, unrelated: `src/App.tsx:120:6`
  `react-hooks/exhaustive-deps`. Confirmed present on `main` before this
  session. `npm run verify` still exits 0.
- `npm run verify` at `b0e79fa`: **115 files, 1624 tests, exit 0.**
