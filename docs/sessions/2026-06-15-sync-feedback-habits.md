# Session log — 2026-06-15

One working session, several stacked requests. Captured here per request
("document all the things in this session"). Append-only; do not overwrite.

## 1. Cloud-sync conflict resolution (BUJO-146)

**Problem.** Cloud sync was last-write-wins: any incoming snapshot replaced the
local journal, silently dropping edits this device had not pushed yet.

**Fix.**
- `JournalData.updatedAt?: string` — reducer stamps it on real user edits only
  (`patch`); `set` (remote-apply/import) keeps the incoming stamp byte-stable so
  the realtime echo-guard isn't tripped.
- `src/lib/conflict.ts` → `resolveIncoming(local, remote, ask)`: silent when the
  remote is newer or both are unstamped; prompts only when local holds edits
  newer than the cloud copy. Returns the data to adopt, or `null` to keep local.
- Wired into all three sync paths in `App.tsx` (bujocloud pull, supabase pull,
  realtime), with a `dataRef` mirror so once-on-mount handlers compare the live
  journal, not the stale mount snapshot.
- 5 unit tests (`conflict.test.ts`).

## 2. In-app feedback → GitHub issue (BUJO-147)

Anonymous feedback widget; no GitHub account needed to submit.
- `api/feedback.ts` (Vercel Node fn): validates + caps input, honeypot, best-effort
  per-IP rate limit (5/min), files an issue via the GitHub REST API. The token
  stays server-side; returns 503 "feedback not configured" until set.
- `src/components/feedback/FeedbackButton.tsx`: self-contained dialog (category +
  message + optional contact), inline idle/sending/sent/error states, links to the
  filed issue. Mounted in `TopBar` (always visible; `AccountMenu` is Supabase-gated).
- **Activation:** set `GITHUB_TOKEN` (fine-grained PAT, Issues: read+write on bujo)
  in Vercel env; optional `GITHUB_REPO` overrides default `SathishKumarAI/bujo`.

## 3. Habit tracker: activity layout + new types + presets (BUJO-148/149/150)

- New `HabitType`s: `timer` (minutes) and `rating` (1–5), additive to `check`/`count`;
  both stored in `data.habitValues`.
- New **activity** layout (`src/components/ActivityLayout.tsx`): one row per habit
  with a GitHub-style 16-week intensity heatmap + a type-aware "today" control
  (toggle / numeric stepper / 5-star). Switcher in the Trackers header, persisted in
  `Settings.trackerLayout` (`'classic' | 'activity'`, optional → migration-safe).
- Shared single source of truth in `stats.ts`: `habitTarget`, `habitValueOn`,
  `habitDoneOn`, `habitIntensity`, `nextHabitValue`. Existing `habitStreak`,
  `habitConsistency`, `weeklyHabitCount`, `habitDayOfWeekBreakdown`, `reminderMessage`
  rewired to honor numeric types (they previously read only `habitLog`).
- 10 new unit tests (`habitIntensity.test.ts`) incl. the non-divisible-target fix.

**Process.** Brainstormed → `/feature-dev` → 3 `code-architect` blueprints
(picked pragmatic-balance) → implement → 3 `code-reviewer` audit → fixed all
high-confidence findings (the standout: timer-cycle skipping a non-divisible
target made such habits permanently incompletable).

**Verification.** `tsc -b` clean · 143/143 tests · eslint clean on touched files ·
prod build OK.

## 4. Chrome-devtools MCP (infra note, not committed)

MCP-launched Chrome was crashing on this box (Rocky Linux) — it spawns headless
Chrome without `--disable-dev-shm-usage`, and orphaned instances piled up. A
manually launched Chrome with `--headless=new --no-sandbox --disable-dev-shm-usage
--disable-gpu --remote-debugging-port=9333` stays up. To attach the MCP, add
`-u http://127.0.0.1:9333` to the chrome-devtools args in `.mcp.json` and reconnect
via `/mcp` (machine-specific; do not commit that line).

## 5. Queued: guest + Google auth & secure data (BUJO-152)

Design written to `docs/security/auth-and-data-security.md`. Not yet implemented.
