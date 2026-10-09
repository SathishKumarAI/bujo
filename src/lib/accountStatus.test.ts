import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { setAccountStatus, markSynced, __resetAccountStatus } from './accountStatus'

beforeEach(() => { __resetAccountStatus(); localStorage.clear() })
afterEach(() => { vi.restoreAllMocks() })

describe('the account sync status store', () => {
  it('tells its listeners when the phase moves, and stays quiet when it does not', () => {
    const seen: string[] = []
    // Subscribing through the public hook needs React; the store's contract is
    // "notify on change, not on every write", and that is what the push effect
    // depends on — it writes `uploading` on every debounce tick.
    const fn = vi.fn(() => { seen.push('x') })
    window.addEventListener('bujo:sync', fn)
    setAccountStatus({ phase: 'uploading' })
    setAccountStatus({ phase: 'uploading' })
    expect(fn).toHaveBeenCalledTimes(1)
    window.removeEventListener('bujo:sync', fn)
    expect(seen).toHaveLength(1)
  })

  /**
   * `components/SyncIndicator.tsx` — the transient pill bottom-right — listens
   * for `bujo:sync`, and only `lib/bujocloud.ts` ever fired it. So the account
   * path, the newer of the two sync mechanisms, had no live feedback at all.
   * Dispatched from the store rather than from `AccountSync` so the pill cannot
   * drift from the phase.
   */
  it('lights the existing sync pill, mapping phases onto its coarser vocabulary', () => {
    const states: unknown[] = []
    const on = (e: Event) => states.push((e as CustomEvent).detail)
    window.addEventListener('bujo:sync', on)
    setAccountStatus({ phase: 'checking' })
    setAccountStatus({ phase: 'uploading' })   // still 'syncing' — but a new phase, so it fires
    markSynced()
    setAccountStatus({ phase: 'error' })
    window.removeEventListener('bujo:sync', on)
    expect(states).toEqual(['syncing', 'syncing', 'synced', 'error'])
  })

  it('does not light the pill for the phases that are not activity', () => {
    const on = vi.fn()
    window.addEventListener('bujo:sync', on)
    setAccountStatus({ phase: 'no-passphrase' })
    setAccountStatus({ phase: 'demo' })
    setAccountStatus({ phase: 'signed-out' })
    window.removeEventListener('bujo:sync', on)
    // "Nothing is being uploaded" is a steady state, not a failed sync. Firing
    // the red pill at it would alarm a user whose journal is exactly where they
    // left it.
    expect(on).not.toHaveBeenCalled()
  })

  /**
   * "Last synced 4 minutes ago" that resets to "never" on every reload reads as
   * a sync that failed, which is the opposite of what happened.
   */
  it('persists the last-synced stamp across a reload', async () => {
    const at = Date.UTC(2026, 9, 9, 12, 0, 0)
    markSynced(0, at)
    expect(localStorage.getItem('bujo:account.lastSync')).toBe(String(at))
    vi.resetModules()
    const fresh = await import('./accountStatus')
    // A fresh module is a fresh page load.
    expect(fresh.__peekForTest().lastSyncedAt).toBe(at)
  })

  it('survives storage being blocked, because reporting a sync must not break one', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    expect(() => markSynced(0, 1)).not.toThrow()
  })
})
