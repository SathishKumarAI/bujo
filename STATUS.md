# STATUS

**Stopped:** 2026-09-02 evening. On `main`, clean.
**`main` is FIVE LOCAL COMMITS AHEAD of `origin/main` — deliberately unpushed.**
The user said "keep everything local as of now": no push, no PRs, branches were
squash-merged locally and deleted. When the user says to publish, just
`git push`; the commit bodies carry the full PR-grade reasoning.

## What this session did

Session brief: "make some UI change, login/signup logic, local account and
data storage — create backlogs and work them." Mapping first showed
login/signup already existed (Supabase email+password, Google, guest,
recovery in `src/lib/supabase.ts`); what was broken was around it. Eight
items filed (COD-133…140), five shipped, three parked.

| Commit | What | Ticket |
|---|---|---|
| 9524dde | `npm run verify` — the four always-run gates as one command | COD-140 |
| 33503b8 | AccountMenu subscribes to onAuthChange (label no longer stale) | COD-134 |
| 7b9c669 | One `useAuthForm` hook behind Account / Welcome / Settings | COD-133 |
| f23356b | `bujo:owner` — a foreign account's journal is never merged/pushed | COD-135 |
| ec11f2a | Crypto round-trip + LockScreen gate + no-blob recovery tests | COD-138 |

Tests 900 → **920**. Auth logic exists once now: `src/lib/useAuthForm.ts`
owns the flows, the three hosts own only markup — extracting the markup
itself was rejected on purpose (page/banner/card are three designs; see the
emergency-banner rule in the global CLAUDE.md).

## Decisions that will surprise you later

- **Login now confirms before replacing local data on every surface.**
  Account and Welcome used to `replaceAll` silently; Settings asked. The
  asking version won.
- **`bujo:owner` (localStorage) records which Supabase user the local journal
  belongs to.** Absent = unclaimed = never foreign, so upgrades and
  guest→account linking are unaffected. `pushJournal` throws on a foreign
  owner; the three merge sites in App.tsx skip. Claimed only after adopt /
  clear-to-empty / successful push. The OAuth-redirect mount path replaces a
  foreign journal *without* a prompt — there is no confirm UI in that effect;
  privacy beats the previous owner's unpushed edits.
- **Password-recovery links now steer to the Account view from anywhere**
  (App.tsx onPasswordRecovery → setView('account')); the form opens on the
  same event via the hook.

## Parked, and why

- **COD-136** serverSync keys rows on deviceId — two devices never converge.
- **COD-139** gdrive token is in-memory only, no auto-sync effect.
- **COD-137** the ~20-line pull-then-push dance exists four times in
  App.tsx/ServerSync.tsx with four debounce values. This is also where the
  two long-standing eslint `react-hooks/exhaustive-deps` warnings live —
  fix them together when consolidating.

All three are cloud-path work; the session's directive was local-first.
Older backlog unchanged: COD-73 (flat card stacks), 61, 57, 49, 96, 116.

## Environment traps hit this session

- Port 4173 was already owned by a leftover `vite preview` **from this repo**
  — fine to reuse (serves `dist/` from disk), but check
  `Get-CimInstance Win32_Process` first per the worktree trap.
- Neither browser-automation path worked (no debug Chrome on 9333, extension
  not connected). `npm run smoke` (25/25, asserts app identity) stood in for
  eyeballing the Account/Settings views.
- Plugin installs: `claude-code-skills` marketplace registered;
  `engineering-skills` + `engineering-advanced-skills` installed;
  `skill-security-auditor` no longer exists upstream. New plugin skills load
  at next session start.

## Next action

Either push the five commits (one `git push` when the user says so), or pick
up COD-137 — the sync-effect consolidation is the highest-leverage remaining
item and clears the two standing eslint warnings with it.
