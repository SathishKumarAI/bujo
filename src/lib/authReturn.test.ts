import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import {
  markSignInStarted, clearSignInPending, takeSignInPending, unfinishedSignInMessage,
} from './authReturn'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('the sign-in round-trip stamp', () => {
  it('remembers the origin that asked to be returned to', () => {
    markSignInStarted('https://bujo-journal.vercel.app', 1000)
    expect(takeSignInPending()).toEqual({ origin: 'https://bujo-journal.vercel.app', startedAt: 1000 })
  })

  it('is spent by reading it, so one lost round trip is reported once', () => {
    // A message that reappears on every load is a message people learn to
    // dismiss, which is how a real failure becomes invisible again.
    markSignInStarted('https://x.test')
    expect(takeSignInPending()).not.toBeNull()
    expect(takeSignInPending()).toBeNull()
  })

  it('is cleared by a resolution', () => {
    markSignInStarted('https://x.test')
    clearSignInPending()
    expect(takeSignInPending()).toBeNull()
  })

  /**
   * Deliberately not time-limited. The failure this exists for sends the user
   * to an origin with no way back, so they return by typing the URL again —
   * minutes or hours later, which is exactly what a window would discard.
   */
  it('does not expire', () => {
    markSignInStarted('https://x.test', 0) // 1970
    expect(takeSignInPending()?.origin).toBe('https://x.test')
  })

  it('treats a corrupt or half-written stamp as no stamp', () => {
    localStorage.setItem('bujo:auth.pending', '{not json')
    expect(takeSignInPending()).toBeNull()
    localStorage.setItem('bujo:auth.pending', JSON.stringify({ startedAt: 1 }))
    expect(takeSignInPending()).toBeNull()
    localStorage.setItem('bujo:auth.pending', JSON.stringify({ origin: '' }))
    expect(takeSignInPending()).toBeNull()
  })

  it('does not break the sign-in it is reporting on when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
    // The stamp is a diagnostic. Losing it must cost the diagnosis, never the
    // feature — a private window has to be able to sign in.
    expect(() => markSignInStarted('https://x.test')).not.toThrow()
  })
})

describe('the message', () => {
  const m = unfinishedSignInMessage({ origin: 'https://bujo-journal.vercel.app', startedAt: 0 })

  it('names the exact origin, because that string IS the fix', () => {
    // Someone has to paste it into Supabase's Redirect URLs. "Check your
    // configuration" without it throws away the one fact the app actually has.
    expect(m.detail).toContain('https://bujo-journal.vercel.app/**')
    expect(m.detail).toMatch(/Redirect URLs/)
  })

  it('does not assert a specific server-side fault, because a closed tab looks the same', () => {
    expect(m.detail).toMatch(/if you did not cancel/i)
    expect(m.detail).toMatch(/most likely/i)
  })

  it('says the journal is untouched, like every other auth failure message here', () => {
    // The app's central warning is that a lost passphrase is a lost journal, so
    // any auth failure arrives next to a real fear. Answer it faster than it
    // lands — same rule as the COD-290 copy.
    expect(m.detail).toMatch(/still here/i)
  })
})
