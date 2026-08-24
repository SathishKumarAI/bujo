import { useEffect, useRef } from 'react'
import { useJournal } from '../store'
import { pushJournalToServer, pullJournalFromServer, serverConfigured } from '../lib/serverSync'
import { resolveIncoming } from '../lib/conflict'
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
      const adopt = resolveIncoming(latest.current, migrate(remote))
      if (adopt) replaceAll(adopt)
    })()
    return () => { cancelled = true }
  }, [url, token, replaceAll])

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
          const merged = resolveIncoming(latest.current, rm)
          if (merged) replaceAll(merged)
          return // adopted the server copy; do NOT push over it
        }
      }
      await pushJournalToServer(url!, latest.current, token)
    }, 2500)
    return () => clearTimeout(t)
  }, [data, url, token, replaceAll])

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
