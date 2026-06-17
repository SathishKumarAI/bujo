import { useEffect, useRef } from 'react'
import { useJournal } from '../store'
import { pushJournalToServer } from '../lib/serverSync'

/**
 * When a self-host sync URL is configured (Settings → self-host), push the whole
 * journal to the PostgREST endpoint — debounced on every change, and flushed once
 * more on tab close (keepalive fetch). No-op when unconfigured.
 */
export function ServerSync() {
  const { data } = useJournal()
  const url = data.settings.selfHostUrl
  const token = data.settings.selfHostToken
  const latest = useRef(data)
  useEffect(() => { latest.current = data }) // keep the ref fresh for the close-flush

  // Debounced push on change.
  useEffect(() => {
    if (!url) return
    const t = setTimeout(() => { void pushJournalToServer(url, latest.current, token) }, 2500)
    return () => clearTimeout(t)
  }, [data, url, token])

  // Flush on tab close / hide.
  useEffect(() => {
    if (!url) return
    const flush = () => { void pushJournalToServer(url, latest.current, token) }
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
