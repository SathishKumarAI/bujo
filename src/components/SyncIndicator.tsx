import { Icon as AppIcon } from '@/components/Icon'
import { Cloud, CloudCheck, CloudWarning } from '@/components/icons'
import { useEffect, useState } from 'react'
import { cat } from '../lib/colors'
import type { SyncState } from '../lib/bujocloud'

/**
 * Tiny transient pill (bottom-right) reflecting cloud auto-sync activity. Listens
 * for `bujo:sync` events from `lib/bujocloud`; hides shortly after a success.
 */
export function SyncIndicator() {
  const [state, setState] = useState<SyncState | null>(null)
  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>
    const on = (e: Event) => {
      const s = (e as CustomEvent<SyncState>).detail
      setState(s)
      clearTimeout(hide)
      if (s !== 'syncing') hide = setTimeout(() => setState(null), 2200)
    }
    window.addEventListener('bujo:sync', on)
    return () => { window.removeEventListener('bujo:sync', on); clearTimeout(hide) }
  }, [])

  if (!state) return null
  const meta = state === 'syncing'
    ? { Icon: Cloud, color: 'subtext0', text: 'Syncing…' }
    : state === 'synced'
      ? { Icon: CloudCheck, color: 'green', text: 'Synced' }
      : { Icon: CloudWarning, color: 'red', text: 'Sync failed' }
  const Icon = meta.Icon
  return (
    <div className="sheet-up fixed right-3 bottom-20 z-40 inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-3 py-1.5 text-label shadow-lg backdrop-blur md:bottom-4" style={{ color: cat(meta.color) }}>
      <AppIcon as={Icon} size="sm" className={state === 'syncing' ? 'animate-pulse' : ''} /> {meta.text}
    </div>
  )
}
