import { describe, expect, it } from 'vitest'
import { identityOf, phaseCopy, syncedAgo, SYNCED, WITHHELD, type AccountPhase } from './account'
import type { User } from './supabase'

const user = (over: Partial<User> = {}) => ({
  id: 'u1',
  app_metadata: { provider: 'google' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01',
  ...over,
}) as User

describe('identityOf', () => {
  it('is null with no session, so a caller cannot accidentally render a blank identity', () => {
    expect(identityOf(null)).toBeNull()
    expect(identityOf(undefined)).toBeNull()
  })

  it('prefers the provider display name', () => {
    const who = identityOf(user({ email: 'sam@example.com', user_metadata: { full_name: 'Sam Rivera' } }))
    expect(who?.name).toBe('Sam Rivera')
    expect(who?.email).toBe('sam@example.com')
  })

  /**
   * Google sends `full_name` or `name` depending on the scopes granted, and a
   * Google account with no name set sends neither. The header menu renders this
   * as its identity line, and an empty identity line reads as a broken app —
   * which is the exact failure this whole change is about, so the fallback
   * chain gets a test rather than a comment.
   */
  it('falls back name → email local part → a non-empty constant', () => {
    expect(identityOf(user({ email: 'a@b.com', user_metadata: { name: 'Nick' } }))?.name).toBe('Nick')
    expect(identityOf(user({ email: 'sam@example.com' }))?.name).toBe('sam')
    const bare = identityOf(user())
    expect(bare?.name).toBe('Your account')
    expect(bare?.name).not.toBe('')
    expect(bare?.email).toBeNull()
  })

  it('reads the avatar from either key Google uses, and null is not a URL', () => {
    expect(identityOf(user({ user_metadata: { avatar_url: 'https://x/a.png' } }))?.avatarUrl).toBe('https://x/a.png')
    expect(identityOf(user({ user_metadata: { picture: 'https://x/b.png' } }))?.avatarUrl).toBe('https://x/b.png')
    expect(identityOf(user())?.avatarUrl).toBeNull()
    // An empty string is falsy-but-present and would render <img src="">, which
    // fetches the page itself. The `str` guard exists for this.
    expect(identityOf(user({ user_metadata: { avatar_url: '' } }))?.avatarUrl).toBeNull()
  })
})

describe('phaseCopy', () => {
  const ALL: AccountPhase[] = [
    'absent', 'signed-out', 'no-passphrase', 'demo', 'checking', 'uploading', 'synced', 'locked', 'error',
  ]

  it('answers for every phase, with a short form and a sentence', () => {
    for (const p of ALL) {
      const c = phaseCopy(p)
      expect(c.short, p).toBeTruthy()
      expect(c.detail.length, p).toBeGreaterThan(20)
    }
  })

  /**
   * THE REGRESSION THIS FILE EXISTS FOR.
   *
   * `AccountSync` cannot upload without a sync passphrase and returns early
   * when there is none, while `AccountCard`'s subtitle read "Signed in — your
   * journal syncs to your account" unconditionally. So the default state of a
   * brand-new account — signed in, no passphrase, nothing uploaded, nothing
   * ever going to be — was reported on screen as a working sync.
   *
   * Asserted as "does not claim", not as an exact string: the wording will be
   * edited and the claim must not come back with it.
   */
  it('never says a journal is synced when nothing can be uploaded', () => {
    for (const p of ['no-passphrase', 'demo', 'locked', 'error', 'signed-out', 'absent'] as AccountPhase[]) {
      const c = phaseCopy(p)
      expect(`${c.short} ${c.detail}`.toLowerCase(), p).not.toMatch(/\bis synced\b|\bsyncs to your account\b/)
    }
    expect(phaseCopy('no-passphrase').detail).toMatch(/nothing has been uploaded/i)
  })

  it('reassures on a locked row that nothing was overwritten', () => {
    // A user seeing "locked" has two devices and a typo, and the thing they
    // need to know first is that their other device's journal is intact.
    expect(phaseCopy('locked').detail).toMatch(/nothing has been overwritten/i)
  })

  it('carries the last-sync time into the synced sentence, and copes without one', () => {
    const now = Date.UTC(2026, 9, 9, 12, 0, 0)
    expect(phaseCopy('synced', now - 10 * 60_000, now).detail).toMatch(/10 minutes ago/)
    expect(phaseCopy('synced', null, now).detail).not.toMatch(/last synced/i)
  })

  it('uses a tone that is only ever a background token name', () => {
    // `cat('crust')`-family bug: an accent used as a foreground fails contrast
    // in half the themes. These names are consumed as `bg-*` only.
    for (const p of ALL) expect(['green', 'peach', 'red', 'fg-2']).toContain(phaseCopy(p).tone)
  })
})

describe('syncedAgo', () => {
  const now = Date.UTC(2026, 9, 9, 12, 0, 0)
  it('says never, just now, then counts up', () => {
    expect(syncedAgo(null, now)).toBe('never')
    expect(syncedAgo(now - 5_000, now)).toBe('just now')
    expect(syncedAgo(now - 5 * 60_000, now)).toMatch(/5 minutes ago/)
    expect(syncedAgo(now - 3 * 3_600_000, now)).toMatch(/3 hours ago/)
    expect(syncedAgo(now - 2 * 86_400_000, now)).toMatch(/2 days ago/)
  })

  it('does not run backwards when the clock does', () => {
    // A device whose clock has drifted behind the stored stamp must not read
    // "in 4 minutes". Clamped at zero, which lands on "just now".
    expect(syncedAgo(now + 4 * 60_000, now)).toBe('just now')
  })
})

describe('the uploaded / withheld lists', () => {
  it('name the cycle log as withheld, because that promise is absolute', () => {
    expect(WITHHELD.join(' ')).toMatch(/cycle log/i)
    expect(SYNCED.join(' ')).not.toMatch(/cycle/i)
  })

  it('are non-empty, since an empty list renders as a heading over nothing', () => {
    expect(SYNCED.length).toBeGreaterThan(0)
    expect(WITHHELD.length).toBeGreaterThan(0)
  })
})
