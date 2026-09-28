import { useJournal } from '../../store'
import { hasSync } from '../../lib/syncKey'
import { useAccount } from '../../lib/useAccount'
import { activeSyncTarget, pausedTargets, SYNC_TARGET_LABEL } from '../../lib/syncTarget'

/**
 * Names the one live auto-sync target, and every configured one that is
 * therefore paused (F-7).
 *
 * This exists because the fix has a visible consequence and hiding it would be
 * the worse bug: a folder that quietly stops updating is a stale restore point
 * someone reaches for a year later. Nothing is deleted and manual Push/Pull
 * still reach a paused target — but it has to say so, on screen, for as long as
 * it is true.
 */
export function SyncTargetNotice() {
  const { data } = useJournal()
  const { user } = useAccount()
  const env = { blob: hasSync(), supabase: !!user && hasSync() }
  const active = activeSyncTarget(data.settings, env)
  const paused = pausedTargets(data.settings, env)

  if (active === 'none' && paused.length === 0) return null

  return (
    <p className="mt-2 rounded-card border border-line bg-ink-0 p-2 text-label text-fg-2">
      Auto-sync is writing to <strong className="text-fg-1">{SYNC_TARGET_LABEL[active]}</strong>.
      {paused.length > 0 && (
        <>
          {' '}Paused so only one copy is being written at a time:{' '}
          {paused.map((t) => SYNC_TARGET_LABEL[t]).join(', ')}. Nothing was deleted — a paused
          target keeps what it holds and still works with Push and Pull by hand, but it will fall
          behind, so do not treat it as a backup.
        </>
      )}
    </p>
  )
}
