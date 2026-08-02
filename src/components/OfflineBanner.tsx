import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'

/**
 * Persistent "you are offline" bar.
 *
 * The `SyncIndicator` pill flashes "Sync failed" for ~2 seconds and disappears,
 * which is fine for a transient blip but useless for a state that persists — if
 * the network is down, that fact should stay on screen until it isn't. Writing
 * still works (the journal is local-first); only cloud sync is paused, and the
 * copy says exactly that so nobody thinks their entries are being lost.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-line-strong bg-ink-2 px-4 py-1.5 text-label text-fg-1"
    >
      <CloudOff size={13} />
      <span>
        You’re offline — keep writing, it all saves on this device. Cloud sync resumes when you’re back.
      </span>
    </div>
  )
}
