import { useCallback, useEffect, useRef } from 'react'
import { useJournal } from '../store'
import { pushJournalToServer, pullJournalFromServer, serverConfigured } from '../lib/serverSync'
import { resolveIncoming, CONFLICT_PROMPT } from '../lib/conflict'
import { useConfirm } from './ConfirmDialog'
import { migrate } from '../lib/storage'

/**
 * Self-host sync glue (Settings → self-host). When a URL + token are configured:
 *   • on mount, PULL the server copy once and merge it into the local journal
 *     (via {@link resolveIncoming}, which unions and only prompts on a real
 *     conflict) — read-on-load, so a fresh device/tab seeds from the server;
 *   • PUSH the whole journal to PostgREST, debounced on every change, and
 *     flushed once more on tab close (keepalive fetch).
 * No-op when unconfigured (the secured API needs both URL and Bearer token).
 */
export function ServerSync() {
  const { data, replaceAll } = useJournal()
  const confirm = useConfirm()
  // Memoised on the context value, which never changes — so naming it in the
  // effect deps below costs nothing and keeps the exhaustive-deps rule honest.
  const askConflict = useCallback(
    () => confirm({ ...CONFLICT_PROMPT, destructive: true }),
    [confirm],
  )
  const url = data.settings.selfHostUrl
  const token = data.settings.selfHostToken
  const latest = useRef(data)
  useEffect(() => { latest.current = data }) // keep the ref fresh for the close-flush + pull-merge

  // Pull-on-load: read the server copy once per config and merge it locally.
  const pulledFor = useRef<string>('')
  useEffect(() => {
    if (!serverConfigured(url, token)) return
    const key = `${url}|${token}`
    if (pulledFor.current === key) return // only pull once per (url, token)
    pulledFor.current = key
    let cancelled = false
    void (async () => {
      const remote = await pullJournalFromServer(url!, token)
      if (cancelled || !remote) return
      // Merge against the freshest local snapshot, not the mount-time one.
      const adopt = await resolveIncoming(latest.current, migrate(remote), askConflict)
      if (adopt) replaceAll(adopt)
    })()
    return () => { cancelled = true }
  }, [url, token, replaceAll, askConflict])

  // Debounced push on change, pull-first so a newer server copy is adopted
  // rather than clobbered. Every other sync path already did this; this one
  // upserted blind, so whichever device happened to save last simply won.
  useEffect(() => {
    if (!serverConfigured(url, token)) return
    const t = setTimeout(async () => {
      const remote = await pullJournalFromServer(url!, token)
      if (remote) {
        const rm = migrate(remote)
        if (rm.updatedAt && (!latest.current.updatedAt || rm.updatedAt > latest.current.updatedAt)) {
          const merged = await resolveIncoming(latest.current, rm, askConflict)
          if (merged) replaceAll(merged)
          return // adopted the server copy; do NOT push over it
        }
      }
      await pushJournalToServer(url!, latest.current, token)
    }, 2500)
    return () => clearTimeout(t)
  }, [data, url, token, replaceAll, askConflict])

  // Flush on tab close / hide.
  useEffect(() => {
    if (!serverConfigured(url, token)) return
    const flush = () => { void pushJournalToServer(url!, latest.current, token) }
    const onVis = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [url, token])

  return null
}
