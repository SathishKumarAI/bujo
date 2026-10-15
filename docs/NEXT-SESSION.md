# Next session

> **2026-10-15 — FIRST, and it is not code: run the migration.**
>
> Supabase SQL editor →
> `supabase/migrations/2026-10-14-journal-in-the-clear.sql`
>
> **The plain-sync pipeline shipped across #386, #392 and #394 is dead against
> the live database.** `pushAccount` writes `{ id, data, updated_at }` and
> `pullAccount` selects `data, updated_at`; the live table has no `data`
> column, so every push and pull fails `42703` and `AccountSync` reports "not
> reaching your account". It works locally only because nothing local talks to
> that table.
>
> It is safe to run now — #390 fixed the guard that blocked it, and #391 made
> it **rename** rather than drop, so one statement undoes the whole thing.

---

## 0 · Read these two before touching another page

Both written 2026-10-15, out of the Home Workout and Pull-ups pass. They are
short, and they are the part of that work that transfers.

- **`docs/REUSABLE-PATTERNS.md`** — the six things that now exist and should not
  be written a third time: the shared panel card, one bar per review zone,
  draw-short/announce-long chips, the record editor, links built from a name,
  and the capped list. Each entry carries the measurement that decided its
  shape, including the two that say *don't*: 31 sources as cards measured 5.44
  desktop screens against 1.93 as rows, and a card collapsed by default is a
  card `npm run a11y` never walks into.

- **`docs/USER-CONTROL.md`** — what the person using this must always be able to
  do. Written because Home Workout's history offered a `×` that deleted a
  session on the first click, with no confirmation and no way to correct
  anything, while the store had carried `updateWorkout` the whole time. **Check
  it against every surface that records something**: can I fix a typo without
  deleting the record, does delete name what it removes, does an edit rewrite
  *every* stored shape, is there an escape hatch beside every chip row, and is
  a shortened label still announced in full.

---

## 1 · The two owner-only items, in order

### 1a · Run the migration, then prove it

Read-only PostgREST probe, run before and after. `42703` = the column does not
exist, `42501` = it exists behind RLS, and `nonsense_col` is the control that
makes the reading trustworthy:

```
node -e '
const fs=require("fs");
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split(/\r?\n/)
  .filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const U=env.VITE_SUPABASE_URL, K=env.VITE_SUPABASE_ANON_KEY;
(async()=>{ for (const col of ["data","blob","blob_legacy_20261014","nonsense_col"]) {
  const r = await fetch(`${U}/rest/v1/journals?select=${col}&limit=1`,{headers:{apikey:K,Authorization:`Bearer ${K}`}});
  let code=""; try { code = JSON.parse(await r.text()).code || "" } catch {}
  console.log(col.padEnd(24), r.status, code);
}})()'
```

| | before (measured 2026-10-15) | expected after |
|---|---|---|
| `data` | `42703` | **`42501`** |
| `blob` | `42501` | **`42703`** |
| `blob_legacy_20261014` | `42703` | **`42501`** |
| `nonsense_col` | `42703` | `42703` |

Then sign in on the running app and watch the rail-foot sync pill actually
reach `synced` — the migration succeeding in SQL is not the same claim as the
round trip working.

### 1b · Put localhost back in the redirect allow-list

Authentication → URL Configuration → Redirect URLs. Add
`http://localhost:5173/**`, `http://localhost:5180/**`,
`http://localhost:4173/**`. **Keep the production entry** — it was added
correctly; the local ones were removed in the same edit, which is the
regression.

5180 is this worktree's dev port; 4173 is `vite preview`, which every browser
gate drives. Without them, local sign-in is impossible and so is testing any of
the above.

Prove it the same way it was measured — the status code tells you nothing,
because Supabase substitutes the Site URL and still answers 302:

```
node -e '
const fs=require("fs");
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split(/\r?\n/)
  .filter(l=>l.includes("=")).map(l=>[l.slice(0,l.indexOf("=")).trim(),l.slice(l.indexOf("=")+1).trim()]));
const U=env.VITE_SUPABASE_URL;
(async()=>{ for (const t of ["http://localhost:5180/","https://evil.example.com/"]) {
  const a = await fetch(`${U}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(t)}`,{redirect:"manual"});
  const st=(a.headers.get("location")||"").match(/state=([^&]*)/);
  const c = await fetch(`${U}/auth/v1/callback?error=access_denied&state=${st[1]}`,{redirect:"manual"});
  console.log(t.padEnd(32), (c.headers.get("location")||"").split("?")[0]);
}})()'
```

`localhost:5180` must come back **verbatim**. Today it comes back as
`https://bujo-journal.vercel.app` — identical to the `evil.example.com`
control.

---

## 2 · Run the four browser gates — none ran this session

Sixteen PRs of mostly UI, including a brand-new layout primitive
(`CalendarSpan`) and the removal of the top bar on 21 views, which changed
`--header-h` everywhere. `a11y`, `clipped`, `smoke` and `space` have seen none
of it.

**Install what they need first — it is deliberately not in `package.json`:**

```
npm i -D --no-save playwright @axe-core/playwright
npx playwright install chromium
npx vite build
npx vite preview --port 4173 --strictPort &
BUJO_URL=http://localhost:4173 node scripts/a11y-axe.mjs    # background it
```

**Background them and keep working** — `a11y` alone is 166 scans and runs ~180s
at 4 workers. Do not sit and watch one.

Two things to look at specifically, because they are new and unscanned:

- **`CalendarSpan`'s dimmed future cells.** 0.4 opacity on `surface0` is
  exactly the pairing `check-contrast` structurally cannot see — a faded token
  is not a token — and axe needs a resolvable background.
- **The bar-less views.** `--header-h` now resolves to `0px` on 21 of them.
  Every sticky offset reads it.

---

## 3 · The last heatmap on a private window

Stats → **Activity**, via `src/components/Heatmap.tsx`. Every other heatmap now
carries the shared Week / Month / Year control; this one still has a private
3mo/6mo/1yr toggle, which is three ways to look at a year and no way to look at
this week.

It was deliberately left out of #398 because converting it is **two** changes,
not one:

- it buckets on **fixed thresholds** (`count < 2 → 1`, `< 4 → 2`, `< 6 → 3`)
  rather than `CalendarHeatmap`'s quartiles, so the ramp's meaning changes;
- it owns the **only `DayGridLegend`** on screen, which would need re-homing
  rather than losing.

`dayActivity(data)` already returns a `Map<string, number>`, so the data shape
is a one-liner (`[...map].map(([date, value]) => ({ date, value }))`). The
decisions are the ramp and the legend.

---

## 4 · Finish the ADHD review

`habitStreak` first — it is the remaining **correctness** item, the same class
as the lapse bug:

- **`src/lib/stats.ts:215-230` — the scheduled-days bug.** A streak counts
  calendar days rather than the days a habit is actually scheduled for, so
  skipping a day the habit was never due on breaks it.

Then, roughly in order of how much they cost someone:

- the comeback line on Today, and un-burying the comeback chip
- a shared `since()` relative-time helper (three call sites each format their
  own)
- the focus timer's end notification, and counting up past zero
- the rail timer on a phone — it is desktop-only today
- palette action commands
- open one fold per rail view
- soften the Focus/Plan shame copy
- fix the `?` cheatsheet

---

## 5 · The typography pass, which is measured but unapplied

Reported as a complaint about fonts, sizes and "the way we present the matter".
**4 of 7 adjacent type steps measured under 1.2×**, which is the arithmetic
behind "it all looks the same weight" — a scale that close reads as one size
with noise.

The measurement exists; nothing was changed. Related and also open: **four
views still encode nothing** after #392's rollout — mindset, coaching,
pickleball, collections.

Watch the trap CLAUDE.md records before reaching for the smallest step:
`text-micro` is for a dense numeric ruler, not for a legend or any value
somebody reads.

---

## Not a queue item, but do not trust it

`docs/QUESTIONS.md` is dated **2026-08-24** and describes the
fitness-consolidation run. It was not touched this session. It is history, not
a list of things waiting on an answer.
