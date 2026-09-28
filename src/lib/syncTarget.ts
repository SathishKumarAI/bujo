/**
 * One auto-sync target at a time — the F-7 fix.
 *
 * ## The bug this closes
 *
 * Four auto-writers of the same journal could all be live at once, on four
 * different debounce windows (folder 1500 ms · self-host 2500 ms · blob
 * 4000 ms), each with its own echo-guard string and its own adopt rule. Two of
 * them could adopt different remotes in the same second, and nothing anywhere
 * detected it. Supabase would have been the fifth.
 * `docs/DATA-STORE-DECISION.md` §9 says the answer is to make them **mutually
 * exclusive, not to delete any** — every one of them works and somebody uses it.
 *
 * ## How exclusivity is decided
 *
 * `settings.syncTarget` is the answer whenever it is set, and every place a
 * target is switched on sets it. For a journal that predates this field the
 * answer is *derived* by precedence, so nothing has to be migrated and no user
 * is asked anything:
 *
 * | Rank | Target | Why it ranks there |
 * |---|---|---|
 * | 1 | `folder` | Chosen at the first-run gate, and it is a real file the owner can open. The most deliberate choice in the app |
 * | 2 | `selfhost` | A URL and a JWT pasted by hand. Nobody does that by accident |
 * | 3 | `blob` | A toggle |
 * | 4 | `supabase` | New. Ranking it last means adding it cannot demote anyone's existing setup on upgrade |
 *
 * **A demoted target is paused, never deleted.** Its data stays where it is,
 * manual Push/Pull still work on it, and the UI says which one is live and
 * which are configured-but-paused — because a folder that quietly stops
 * updating is a stale backup someone will trust later.
 */
import type { Settings } from './types'

export type SyncTarget = 'none' | 'folder' | 'selfhost' | 'blob' | 'supabase'

/** Precedence for a journal with no explicit `settings.syncTarget`. */
const RANK: readonly SyncTarget[] = ['folder', 'selfhost', 'blob', 'supabase']

export const SYNC_TARGET_LABEL: Record<SyncTarget, string> = {
  none: 'not syncing',
  folder: 'a folder on this device',
  selfhost: 'your self-hosted server',
  blob: 'the sync passphrase (cloud)',
  supabase: 'your account',
}

/**
 * Runtime facts that do not live in `settings`: whether the blob path has a
 * stored key (`lib/syncKey.ts`) and whether an account is signed in.
 * Passed in rather than read here, so this module stays pure and testable.
 */
export interface SyncEnv {
  blob: boolean
  supabase: boolean
}

/** Every target that has enough configuration to run. Ordered by precedence. */
export function configuredTargets(settings: Settings, env: SyncEnv): SyncTarget[] {
  const has: Record<SyncTarget, boolean> = {
    none: false,
    folder: settings.storageMode === 'folder',
    selfhost: !!settings.selfHostUrl && !!settings.selfHostToken,
    blob: env.blob,
    supabase: env.supabase,
  }
  return RANK.filter((t) => has[t])
}

/**
 * The single target allowed to auto-push right now.
 *
 * An explicit `settings.syncTarget` wins **only if it is still configured** —
 * choosing the account and then signing out must not leave the app pushing
 * nowhere while a perfectly good folder sits idle.
 */
export function activeSyncTarget(settings: Settings, env: SyncEnv): SyncTarget {
  const configured = configuredTargets(settings, env)
  const chosen = settings.syncTarget
  if (chosen && chosen !== 'none' && configured.includes(chosen)) return chosen
  if (chosen === 'none') return 'none'
  return configured[0] ?? 'none'
}

/** Configured, but not the live one. What the UI has to name out loud. */
export function pausedTargets(settings: Settings, env: SyncEnv): SyncTarget[] {
  const active = activeSyncTarget(settings, env)
  return configuredTargets(settings, env).filter((t) => t !== active)
}
