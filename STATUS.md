# STATUS

**Stopped:** 2026-10-05. `main` at `982b40b` plus **#326 open** — the CI split,
which is the one thing to look at first.

## First thing: did #326 go green?

The browser gates were split into two parallel jobs (`a11y`, `render`) because
the single job was being **cancelled at 15m03s on every run**, which Actions
reports as a bare `failure`. COD-268.

- **Both pass** → the split worked, merge it, nothing else to do.
- **Either hits 15m03s again** → the cap is not about job duration, and that is
  the thread to pull before trusting any browser gate.

This matters more than it looks: the cancel lands *inside* the axe step, so
`smoke` and `clipped` — the steps after it — never ran at all on #322 or #323.
Three gates stopped covering anything while still reporting a colour.

**Driven locally against `b0e79fa`, all three are green:**

```
173 of 173 scan(s) completed across 12 of 12 shard(s).
No serious or critical violations.

Smoke: 24/24 views OK · All views rendered clean

No clipped or off-screen text across 24 views at 1440px and 1024px and 390px.
```

So the app is fine and the gate was off. Do not read the red on `main` as a
regression.

## What this session did

A request to "add Supabase sign-in and background sync". The answer was no, with
reasons recorded, and the audit it prompted found four broken sync paths.

```
#320  the audit + the plan                                       merged
#321  one egress door + contract test              COD-265 ✔     merged
#322  /api/sync version history                    COD-266 ✔     merged
#323  PBKDF2 600k + derived path code              COD-267 ✔     merged
#324  STATUS                                                     merged
#325  untrack a stray personal page                              merged
#326  split the browser gates                      COD-268       OPEN
```

Full account in `docs/WORKLOG.md` (2026-10-05). The map for anything sync-shaped
is `docs/security/sync-hardening-plan.md` — read it before touching a sync path.

## What changed that a future session will trip over

**`forEgress` is the only door out.** Nothing may call `forNetwork` directly;
`src/lib/egress.contract.test.ts` fails the build if anything does, and it also
forbids a raw `replaceAll(migrate(…))` outside the two folder-restore paths. Add
a sync target without wiring `forEgress` and `mergePulled` and that test goes
red, which is the point. Its key-shape trap is documented in the file:
`import.meta.glob` keys for `src/lib` siblings are `./x.ts` with **no `lib/`
segment**, so a pattern written `lib/x.ts` matches nothing and every assertion
passes vacuously.

**`api/` is typechecked now.** It was in no tsconfig at all before #322 — which
is why `api/sync.ts` hand-rolls its `Req`/`Res` interfaces. It lives in
`tsconfig.node.json`. Expect `tsc -b` to have opinions about serverless code it
never read before.

**Two version constants must never be edited in place:**

| Thing | Where | If you edit it |
|---|---|---|
| `ROUNDS[1] = 150_000` | `src/lib/crypto.ts` | every journal already in `bujo:enc` or the sync blob becomes undecryptable, reported to the user as "wrong passcode" |
| `'bujo-sync-path:v2'` | `src/lib/crypto.ts` | every cloud journal moves to a new path; only `legacyCode` + `pullCloud`'s fallback make the old one findable |

Add a row; do not change one.

**`pullCloud` writes.** On a v1-path hit it re-encrypts to the new path.
Deliberate and best-effort — a failed migration must not turn a successful read
into an error — but it means a "pull" can POST.

**The live deploy is behind `main`.** Verified read-only: `?code=X&versions=1`
against the production endpoint returns `404`, not `{"versions":[]}`, so it is
still serving the **old** handler. #322 and #323 are merged but not live.

## Not verified, and worth knowing

- **No restore dialog was clicked in a browser.** All four need a configured
  remote to render, so no gate reaches them — and #321 changed the copy in all
  four. Pinned by a source assertion (`CYCLE_CLAUSE` in the contract test) and
  by unit tests, which is not the same as having seen it.
- **Nothing ran against the real Vercel Blob store or the deployed function.**
  `api/sync.test.ts` mocks `@vercel/blob`. The first production POST is the real
  test of `copy`'s option shape — it sits inside the best-effort `try`, so a
  mistake there means "no history", not "no save". The first real pull is what
  proves the `x-sync-code` header path; the `?code=` fallback is what makes that
  safe to find out.
- **Why the CI cap is 15 minutes is unknown.** Public repo on a personal
  account, so Actions minutes are free and unlimited; no `timeout-minutes` was
  configured and `a11y` has no `concurrency` block (`screenshots` does, which
  explains its cancel and not a11y's). A rerun queued and never picked up a
  runner.

## Open, deliberately

- **COD-228** — `bujo:sync` holds the sync passphrase in plaintext, which
  defeats the passcode lock. Disclosed on screen in `CloudSyncCard` and in
  `AUTH.md`. A surfaced trade-off, not a hidden bug: encrypting it means
  auto-sync cannot run while the journal is locked, which is most of the time.
- **No compare-and-swap on `/api/sync`.** `PutCommandOptions` in this
  `@vercel/blob` exposes no `ifMatch` (only `del` does), so it would mean
  hand-rolling the REST call. Upgrade path is in a `ponytail:` comment.
- **The v1 sync blob is left in place** after migration, reasoning in
  `pullCloud` and plan §3. Rotating a passphrase is not erasing — and nothing in
  the UI says so, which is unsaid rather than decided. On the `NEXT-SESSION`
  pile.
- **`?code=` still accepted** by `api/sync.ts` for bundles cached before #323.
  Drop that arm one release after `b0e79fa`; leaving it forever defeats the
  change.
- **Supabase sign-in** — plan §0 names the six surfaces and two docs a reversal
  would have to change first.

## Environment notes

- `docs/life-schedule-v3-final.html` is **untracked and back on disk**. It was
  swept into #323 by a `git add -A docs`, untracked in #325 — and merging that
  index deletion onto `main` removed the working copy, which #325's body had
  promised it would not. Restored byte-identical from `9243f85` (now LF where it
  was CRLF). Gitignored, so `git status` is clean with it present.
- `.env.local` had dead `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` entries.
  Removed locally; the file is gitignored, so there is no commit for it.
- One pre-existing lint warning, unrelated: `src/App.tsx:120:6`
  `react-hooks/exhaustive-deps`. Confirmed present on `main` before this
  session. `npm run verify` still exits 0.
- `npm run verify` at `b0e79fa`: **115 files, 1624 tests, exit 0.**
