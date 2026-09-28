import { describe, expect, it } from 'vitest'
import { activeSyncTarget, configuredTargets, pausedTargets } from './syncTarget'
import { defaultSettings } from './storage'
import type { Settings } from './types'

/**
 * F-7: four auto-writers of the same journal could be live at once, on four
 * different debounce windows, each with its own adopt rule. These pin the
 * property that replaces that — **at most one target is ever active** — and the
 * property that makes it safe to ship: an existing journal's live target does
 * not change when this field appears.
 */
const s = (patch: Partial<Settings> = {}): Settings => ({ ...defaultSettings(), ...patch })
const ALL = { blob: true, supabase: true }
const NONE = { blob: false, supabase: false }

describe('one auto-sync target at a time', () => {
  it('is never more than one, whatever is configured', () => {
    const everything = s({ storageMode: 'folder', selfHostUrl: 'https://x', selfHostToken: 'jwt', syncTarget: undefined })
    expect(configuredTargets(everything, ALL)).toHaveLength(4)
    // The one assertion the whole fix rests on.
    expect(activeSyncTarget(everything, ALL)).toBe('folder')
    expect(pausedTargets(everything, ALL)).toEqual(['selfhost', 'blob', 'supabase'])
  })

  it('returns none when nothing is configured', () => {
    expect(activeSyncTarget(s(), NONE)).toBe('none')
    expect(pausedTargets(s(), NONE)).toEqual([])
  })

  it('honours an explicit choice over the precedence order', () => {
    const picked = s({ storageMode: 'folder', syncTarget: 'supabase' })
    expect(activeSyncTarget(picked, ALL)).toBe('supabase')
    expect(pausedTargets(picked, ALL)).toEqual(['folder', 'blob'])
  })

  it('falls back when the explicit choice stops being configured', () => {
    // Chose the account, then signed out. Syncing nowhere while a perfectly
    // good folder sits idle would be a silent stop, so precedence takes over.
    const signedOut = s({ storageMode: 'folder', syncTarget: 'supabase' })
    expect(activeSyncTarget(signedOut, { blob: false, supabase: false })).toBe('folder')
  })

  it('respects an explicit none — the off switch is not overruled', () => {
    expect(activeSyncTarget(s({ storageMode: 'folder', syncTarget: 'none' }), ALL)).toBe('none')
  })

  it('does not change the live target of a journal written before this field', () => {
    // The upgrade contract. Each of these has no `syncTarget`, and each keeps
    // the target it was already using; only the *extra* writers go quiet.
    expect(activeSyncTarget(s({ storageMode: 'folder' }), NONE)).toBe('folder')
    expect(activeSyncTarget(s({ selfHostUrl: 'https://x', selfHostToken: 'j' }), NONE)).toBe('selfhost')
    expect(activeSyncTarget(s({ storageMode: 'local' }), { blob: true, supabase: false })).toBe('blob')
  })

  it('ranks a new account last, so adding it demotes nobody on upgrade', () => {
    expect(activeSyncTarget(s({ storageMode: 'folder' }), ALL)).toBe('folder')
    expect(activeSyncTarget(s({ selfHostUrl: 'u', selfHostToken: 't' }), ALL)).toBe('selfhost')
    expect(activeSyncTarget(s(), ALL)).toBe('blob')
    // Only when it is the sole thing configured does it win by itself.
    expect(activeSyncTarget(s(), { blob: false, supabase: true })).toBe('supabase')
  })

  it('needs both halves of the self-host config before it counts', () => {
    expect(configuredTargets(s({ selfHostUrl: 'https://x' }), NONE)).toEqual([])
    expect(configuredTargets(s({ selfHostToken: 'jwt' }), NONE)).toEqual([])
  })
})
