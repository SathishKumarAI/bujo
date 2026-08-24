# Open questions — answer inline, then start a new session

**Written:** 2026-08-24 · **For:** the fitness-consolidation / UI-polish run
(`docs/redesign/15-fitness-consolidation.md`)

How to use this: write your answer on the `**A:**` line under each question.
Anything you leave blank, I take the **recommended** option and say so. Nothing
here blocks Phase A — I can start on the defaults. These are the calls where
guessing wrong costs a rewrite rather than an edit.

---

## Q1 · PR #96 — close it, or rescue it?

Today UX, **+2620 / −767**, conflicted since 2026-08-03. It overlaps Phase E
(Today on the page contract) almost completely. Rescuing it means resolving a
three-week-old conflict against 12 merged PRs; closing it means whatever was
good in it gets rebuilt from the contract instead.

**Recommend:** close it, and mine its commit messages for anything worth
re-doing as tickets. 3.4k lines of stale diff is not an asset.

**A:**

---

## Q2 · PR #107 — worklog doc, merge or drop?

`docs(worklog): the stack landing, the three-session bug, and one refusal`.
Docs only, `CLEAN`. Costs nothing to merge.

**Recommend:** merge it.

**A:**

---

## Q3 · What does "spin up the application" mean?

Two different asks and I do not want to guess:

- **(a) Run it locally** so you can look at it — dev server on :5173. Already
  running as of this session.
- **(b) Put it on the internet** at a URL you can open from your phone.

If (b): note that **there is no deploy today, on purpose.** PR #127 retired the
GitHub Pages workflow because it ran 8 times and failed 8 times — Pages was
never enabled, and Pages *cannot* serve this app anyway: `api/sync.ts` and
`api/feedback.ts` are serverless functions, and Pages cannot set the CSP/HSTS
headers the app sets. `vercel.json` and `api/` were kept for exactly this.

**Recommend:** (b) via **Vercel** — it is already configured, it serves the two
API routes, and it keeps the security headers. Roughly one session, mostly
waiting on you to click through the Vercel auth.

**A:**

---

## Q4 · shadcn — how far?

You said "let's use shadcn". **It is already installed**: `components.json`
plus 17 primitives in `src/components/ui/` (button, dialog, command, popover,
tabs, tooltip, scroll-area, switch, toggle-group, sonner…).

So the real question is how far to push it:

- **(a) Status quo+** — keep using shadcn for anything *new*, leave the
  hand-rolled `src/components/ui.tsx` (`Card`, `Empty`, …) alone.
- **(b) Migrate the hand-rolled primitives** — replace `ui.tsx`'s Card/Empty/etc
  with shadcn equivalents restyled onto bujo tokens. Touches nearly every view.
- **(c) Add the specific missing ones** — `card`, `badge`, `table`,
  `chart`, `select` — and use them only in the pages being rebuilt anyway
  (Trackers, Insights, Stats, Today).

**Recommend:** (c). It gets the professional consistency without a repo-wide
migration, and each new primitive arrives attached to a page that needed it.
(b) is the kind of sweep that silently changes content — the global CLAUDE.md's
emergency-banner story is exactly this failure.

**A:**

---

## Q5 · "Professional" — which direction, exactly?

These two are in tension and I need to know which wins:

- **(a) bujo's own identity** — Fraunces display numerals, the five themes, the
  Modernist bands that 12 PRs just landed. Professional = *disciplined*: two
  cards a page, one accent, tabular numerals, constant padding.
- **(b) The ShadcnStore dashboard look** you sent — near-black chrome, chroma-0
  neutrals, Inter, dense KPI rows.

`docs/redesign/14-dashboard-inspiration.md` argues (a), and that going to (b)
would make the app **more** generic, not less: its restraint is what reads as
polished, not its typeface — and bujo already has a documented contrast pass and
five hand-built themes.

**Recommend:** (a) with (b)'s **§10 grid discipline** grafted on —
content-weighted columns, one shared gap token, cells filling their height,
constant padding. That is the part that actually reads as "no wasted space".

**A:**

---

## Q6 · Body would become ten tabs. Split it?

Moving Trackers into Body makes it: Fitness · Tracking · Strength · Program ·
Pickleball · Coaching · Nutrition · Challenges · Recovery* · Cycle* (*gated).

`STATUS.md` already recorded **eight tabs as the ceiling**, and the page
contract calls a tab row mixing surfaces with the items inside them the most
common IA failure.

Options:

- **(a) Accept ten** and revisit later.
- **(b) Split Body into two rail sections** — *Train* (Fitness, Strength,
  Program, Pickleball, Coaching) and *Body* (Tracking, Nutrition, Recovery,
  Cycle). Six rail rows instead of five.
- **(c) Nest** — Body keeps 4–5 tabs, and Strength/Program/Pickleball become
  *activities you pick inside Fitness* rather than tabs. This is what
  `sections.ts` already argues for Pull-ups and Home workout.

**Recommend:** (b). (c) is how Pickleball got buried once already — the file's
own docstring says redirecting it into Fitness "did not move the page, it
deleted it", reported by you as "options are not available".

**A:**

---

## Q7 · Is an outbound network call to Open Food Facts acceptable?

Phase C sends your food search text to `world.openfoodfacts.org`. This app is
local-first and its whole pitch is that your journal does not leave the device.
A food search leaks *what you are eating* to a third party.

- **(a) Yes** — it is a public food database, low sensitivity, big usability win.
- **(b) Yes, but off by default** — a Settings toggle, off until switched on.
- **(c) No** — grow `foods.ts` by hand or bundle a static offline dataset.

**Recommend:** (b). Same shape as the existing sync opt-ins, and it keeps the
"works with no network" promise literally true.

**A:**

---

## Q8 · Do you want the exercise images?

free-exercise-db ships ~870 exercises **with photos**. The data is a few hundred
KB; the images are ~350 MB in the repo, or hot-linked from GitHub (which is a
network call and a dependency on someone else's raw.githubusercontent quota).

**Recommend:** take the **data only**, no images. The app has a muscle map
already, which is more useful than a stock photo of a stranger.

**A:**

---

## Q9 · Screenshots — demo data or your real journal?

`npm run screenshots` exists and `main` has auto-refreshing screenshot commits.
Demo data is **persisted, not regenerated** — so shooting the real journal means
your actual entries end up in `docs/screenshots/` and in git history.

**Recommend:** demo data, re-seeded via Settings → Data → Load demo data.

**A:**

---

## Q10 · How long is a "session"?

You asked for one page per phase with a handoff doc between. Phase A is ~10
lines and 20 minutes. Phase B (Trackers, 1013 lines) is a full session on its
own.

- **(a) One phase per session**, however small — stop and hand off.
- **(b) Fill a session** — chain small phases until there is a real chunk of
  work, then hand off.

**Recommend:** (b) for A+B together, (a) for everything after — C, D and E are
each big enough to fill a session alone.

**A:**
