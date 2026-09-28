import { useCallback, useEffect, useRef } from 'react'
import { useJournal } from '../store'
import { pushSupabase, pullSupabase } from '../lib/supacloud'
import { useAccount } from '../lib/useAccount'
import { loadSync, hasSync } from '../lib/syncKey'
import { activeSyncTarget } from '../lib/syncTarget'
import { resolveIncoming, CONFLICT_PROMPT } from '../lib/conflict'
import { useConfirm } from './ConfirmDialog'
import { migrate } from '../lib/storage'

/**
 * Account sync glue — the Supabase half of the cache tier.
 *
 * Runs only when **all three** are true: a project is configured in this
 * build, an account is signed in, and this device remembers the encryption key
 * (`lib/syncKey.ts`). Missing any one of them, this is a no-op that touches
 * nothing — which is the whole "degrades cleanly with no Supabase" contract.
 *
 * Shaped after `ServerSync.tsx` on purpose, down to the pull-first guard: every
 * sync path in this app converged on that shape after F-2 and F-6, and a fifth
 * one inventing its own conflict rule is how F-7 happened in the first place.
 *
 * **Failure mode.** The push is debounced and its error is surfaced on the
 * shared `bujo:sync` channel via `SyncIndicator`, not swallowed — a Supabase
 * row that silently stops updating is a stale restore point someone trusts
 * later. RLS rejecting a row shows up as an error, not as a quiet no-op.
 */
export function SupabaseSync() {
  const { data, replaceAll } = useJournal()
  const { user } = useAccount()
  const confirm = useConfirm()
  const askConflict = useCallback(() => confirm({ ...CONFLICT_PROMPT, destructive: true }), [confirm])

  const latest = useRef(data)
  useEffect(() => { latest.current = data })

  // One auto-sync target at a time (F-7). Anything but `supabase` here means
  // another path owns the push and this one stays quiet.
  const active = activeSyncTarget(data.settings, { blob: hasSync(), supabase: !!user && hasSync() })
  const on = active === 'supabase' && !!user

  // Pull-on-load, once per signed-in user.
  const pulledFor = useRef('')
  useEffect(() => {
    if (!on || !user || pulledFor.current === user.id) return
    pulledFor.current = user.id
    let cancelled = false
    void (async () => {
      const secret = await loadSync()
      if (!secret || cancelled) return
      const remote = await pullSupabase(user, secret.key).catch(() => null)
      if (!remote || cancelled) return
      const adopt = await resolveIncoming(latest.current, migrate(remote), askConflict)
      if (adopt) replaceAll(adopt)
    })()
    return () => { cancelled = true }
  }, [on, user, replaceAll, askConflict])

  // Debounced push, pull-first so a newer remote is adopted and unioned rather
  // than clobbered. 4000 ms, matching the blob path it replaces.
  useEffect(() => {
    if (!on || !user) return
    const t = setTimeout(async () => {
      const secret = await loadSync()
      if (!secret) return
      try {
        const remote = await pullSupabase(user, secret.key)
        if (remote) {
          const rm = migrate(remote)
          if (rm.updatedAt && (!latest.current.updatedAt || rm.updatedAt > latest.current.updatedAt)) {
            const merged = await resolveIncoming(latest.current, rm, askConflict)
            if (merged) replaceAll(merged)
            return // adopted the remote; do NOT push over it
          }
        }
        await pushSupabase(user, secret.key, latest.current)
      } catch {
        /* offline, or a wrong key — the next change tries again. `pullSupabase`
           rethrows a decrypt failure rather than reporting "nothing stored",
           so a passphrase typo can never be mistaken for an empty row and
           overwritten. */
      }
    }, 4000)
    return () => clearTimeout(t)
  }, [data, on, user, replaceAll, askConflict])

  return null
}
