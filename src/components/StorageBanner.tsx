import { Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { persistOk } from '../lib/storage'

/**
 * Persistent "this device is no longer saving" bar.
 *
 * The worst failure this app has is the silent one: `localStorage` refuses the
 * write (quota exhausted, or Safari private mode), the app keeps working from
 * memory because nothing in React noticed, and the whole session is gone on
 * reload. `save()` now reports the outcome on `bujo:persist`; this is the only
 * thing that tells the user.
 *
 * Deliberately alarming and deliberately not dismissible — unlike
 * `OfflineBanner`, where writing still works, here it does not.
 */
export function StorageBanner() {
  const [failed, setFailed] = useState(() => !persistOk())

  useEffect(() => {
    const on = (e: Event) => setFailed(!(e as CustomEvent<boolean>).detail)
    window.addEventListener('bujo:persist', on)
    return () => window.removeEventListener('bujo:persist', on)
  }, [])

  if (!failed) return null

  return (
    <div
      role="alert"
      className="flex items-center justify-center gap-2 border-b border-red bg-red/15 px-4 py-1.5 text-label text-fg-1"
    >
      <Icon as={Warning} size="sm" />
      <span>
        <strong>Not saving on this device.</strong> Storage is full or blocked — changes since
        you opened the app will be lost on reload. Export a backup now (Settings → Data).
      </span>
    </div>
  )
}
