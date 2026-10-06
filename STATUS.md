# STATUS

**Stopped:** 2026-10-05, after the Home Workout build. `main` at `78725b1`,
this work on `feat/home-workout-library` (COD-272).

## First thing: the browser gates cannot run on this machine

**`playwright` is not in `package.json`.** Not as a dependency, not as a
devDependency, and `node_modules` does not contain it. So `npm run a11y`,
`npm run smoke`, `npm run clipped` and `npm run space` all die before they do
anything:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from
  …/scripts/space-audit.mjs
```

`@axe-core/playwright` is missing too. The Playwright **CLI** happens to be in
the npx cache (1.63.0), which is why `npx playwright --version` answers and
makes this look fine — it is not the package the scripts import.

This is the "a gate nobody runs" family in CLAUDE.md one level deeper: not
switched off, *uninstallable*. The timings written into CLAUDE.md
(`507s` serial, `183s` at four workers) were measured on a checkout where it
was installed, so something has dropped it since. Filed as **COD-273**; the fix
is to declare both in `devDependencies` and run `npx playwright install
chromium`, which is an install this session did not take on its own.

**Until then, measure with the DevTools MCP against a real Chrome.** That is
what this session did and it works:

```
npx vite build
npx vite preview --port 4199 --strictPort &
# launch Chrome with --remote-debugging-port=9333 --user-data-dir=<temp>
# then inject axe-core from cdnjs and drive the page
```

Two traps that cost time doing it that way, both already in CLAUDE.md and both
hit anyway:

- **The service worker serves the previous bundle.** A rebuild plus a reload is
  not enough; a probe reported the fixed colour still failing. Compare
  `document.querySelector('script[src*=index-]')` against your own
  `dist/index.html` *every time*, then unregister the worker and clear `caches`.
- **`resize_page` cannot go below ~500px** (the Chrome window has a minimum).
  Use `emulate` with `390x844x2,mobile,touch`, and note it survives a
  `navigate_page` but not a `location.reload()` from inside the page.

## What this session did

Home Workout, from a 53-line data module and a flat three-card page to a
feature. PR #336.

```
feat(home-workout)  83 movements, cues, chains, kit filter      COD-272
feat(home-workout)  the manual + 31 fetched citations
refactor            the page onto the three-zone contract
feat(demo)          seed homeWorkout, DEMO_VERSION 5 → 6
fix(home-workout)   How-to toggle clipped its own caret
fix(video)          VideoLink 4.14:1 on vscode, five call sites
fix(rail)           SectionRail cannot become a rail in zone 3
docs                feature page + CREDITS
```

## What a future session will trip over

**`lib/exerciseMuscles.ts` is the only muscle table, and Home Workout depends
on that staying true.** `homeExercises.test.ts` asserts every one of the 83
movements resolves there. Add a movement whose name matches no rule and the
suite fails — the fix is a rule in *that* file, above the generic ones, not a
field on the movement. Arming the assertion found nine real gaps, two of which
("Pike push-ups", "Diamond push-ups") were resolving to the **chest**.

**A `SectionRail` in zone 3 renders the phone chip row on a desktop** unless it
is passed `railAt="2xl"`, because zone 3 at the 1180 tier is 722px and the
default flip is at 896px. Six other adopters (Insights, Coaching, Pickleball,
Pull-ups, Help, Recovery) are still on the default; whether their labels
overflow 722px was not measured, so none of them was moved on a guess. **The
caller's grid breakpoint must match the prop** — moving only one is worse than
moving neither.

**The a11y gate still cannot see eleven of the manual's twelve chapters**
(COD-237: a rail has no `aria-expanded`). The fold count it prints for this
page is not coverage. What was done instead, by hand, against a confirmed
bundle: 12 chapters × five desktop themes + 12 chapters at 390px, 0 violations
of any impact. Re-run that probe, or arm the gate, before trusting a green run
on this page.

**`DEMO_VERSION` is 6.** Bump it whenever the seed gains a field a page
renders, and re-seed via Settings → Data → Load demo data; editing
`src/lib/demo.ts` changes nothing for a journal that already exists.

## Next action

1. COD-273 — declare `playwright` and `@axe-core/playwright`, install Chromium,
   and run the four gates for real. Everything else here is downstream of that.
2. Decide whether the other six rail pages want `railAt="2xl"`. Measure the
   chip strip's `scrollWidth` against its `clientWidth` on each; do not assume.

---

# Previous session (2026-10-05, #320–#327)

Kept verbatim below rather than overwritten — it is another stream's handover
and its sync-path warnings are still live. Its opening question ("did #326 go
green?") is resolved: `main` has merged through #335.


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
