# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-03
- **Where I stopped:** On `feat/today-ux`, an **isolated worktree** at
  `.claude/worktrees/today-ux`, branched off `99ddbaf` on
  `feat/icon-button-stage1`. **Nothing pushed, no PR.** 20 commits, all
  verifying green: `npx tsc -b --force` 0, `npx vitest run` **731 tests**,
  `npx eslint .` 0 errors / 2 pre-existing warnings, `npm run build` clean.
  - Work in the worktree, not the main checkout — a second Claude session was
    editing `C:/Users/PRANAS/Documents/coding/now/bujo` concurrently (it landed
    `99ddbaf`, the two-weight icon build, mid-session).
  - Dev server for this branch: **`npx vite --port 5191`** from the worktree.
    Its `node_modules` is a junction to the main checkout's, so both servers
    share one Vite dep cache — if the app boots with *"Invalid hook call … more
    than one copy of React"*, that is the cache, not the code. `vite --force`
    fixes it; a separate `npm ci` in the worktree fixes it permanently.

- **Three threads landed, in this order:**

  1. **Today's layout** (`2ac43af`…`e5f740a`). The log was below the fold at
     y=917 behind a three-card weight-1 band, and the wide column ran 813px
     against a 1568px rail — half of it empty. Also: the at-risk streak was
     stated twice from two rules that disagreed, two different numbers were both
     labelled "tasks", and the week strip's today-marker was a 1px outline
     nobody could see. `catA(name, role)` now names the three accent alphas that
     four surfaces had been spelling five different ways.

  2. **Habit polarity** (`1cb1da8`…`ba57908`) — see TASKS.md §L. Started from
     "why does it say *Missed Alcohol* when I stayed sober?" and ended at
     **six** read sites plus the seed. `dayCompletion` was the worst: drinking
     scored a perfect day. `reminderMessage` was the most embarrassing: *"Log
     Alcohol today to keep your 4-day streak alive."* The seed was the root
     cause, and there is a migration for journals already saved.

  3. **The IA/routing pass**, Stages 0–5 (`c34db86`…`959edba`) — see TASKS.md
     §K and **`docs/ROUTING.md`**. The app had **no router**; it has one now,
     the sidebar is five sections, Today is three time-of-day surfaces instead
     of ten cards on one screen, and on a phone the capture bar pins above the
     tab bar with a 44px floor under every control.
     - The 44px floor had to be **absolute px**: `min-h-11` measured 39px,
       because this app scales the rem root for its text-size setting.

- **Also worth knowing:**
  - **Vercel is paused** (`c51444f`, `git.deploymentEnabled: false`), by
    request. It does not cancel an in-flight build or take down what is already
    deployed — those need the dashboard. GitHub Pages is untouched and is now
    the only live target.
  - `react-router-dom` was installed into the **shared** `node_modules`, so the
    main checkout has the package present without it being in that branch's
    `package.json`. Harmless, but do not be surprised by it.
  - The theme sweep was **skipped by explicit instruction** this session. The
    standing five-theme rule below was not applied to any of this work.
  - I mutated the journal in the `:5191` browser tab repeatedly while testing
    (habit flags, metrics, five days of `habitLog` to get a coverage spread).
    Reload with `?demo=1` there for a clean one. The app on `:5173` was never
    touched.

- **Next action:** the IA pass is complete — Stages 0–5 all done. What it left
  behind, both in TASKS.md:
  - **K6** — `metric.fastBreak` ("First meal") is written by the wellbeing card
    and read by *nothing*, while `FastingCard` says "end it at your first meal".
    Both now sit on the Morning surface, which makes the dead wire more visible,
    not less. Wire it or drop the control.
  - **K7** — the month cursor is a route on Monthly only; Trackers and Cycle
    keep component state, so stepping months is in history on one and not the
    others.
  - **L4** — should a slip on a quit habit earn a bigger make-up than a missed
    habit? Right now they weigh the same.
  - Two tap targets are knowingly under 44px: Trackers' habit dot-grid (a
    365-day grid cannot have 44px cells) and one toggle on Plan.

- **Standing rule, not applied this session:** UI changes are verified in **all
  five themes** — mocha, latte, neon, vscode, dawn — not mocha plus a spot
  check. Three redefine the accent (dawn's is an amber), two invert surface
  polarity, and dawn renders two text tiers where the others render three.
  Everything from this session is unswept.

- **Blocked on:** unchanged. `B1` — the Supabase project at
  `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so every account/cloud-sync
  feature is dead until it is repointed or the env vars are unset. Section H (the
  redesign brief) still waits on H5, H6, H7, H9, H11, H13.

**Read next:** `docs/ROUTING.md` (how a screen is reached, and why the router is
hash-based) · `TASKS.md` §K and §L (the IA pass and the polarity sweep) ·
`docs/LAYOUT-WEIGHT-ALIGNMENT.md` (weight per surface, now that Today is three).
