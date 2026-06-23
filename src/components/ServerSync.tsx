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

  // Debounced push on change.
  useEffect(() => {
    if (!serverConfigured(url, token)) return
    const t = setTimeout(() => { void pushJournalToServer(url!, latest.current, token) }, 2500)
    return () => clearTimeout(t)
  }, [data, url, token])

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
