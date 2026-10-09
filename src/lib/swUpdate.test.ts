import { describe, expect, it } from 'vitest'
import { shouldReloadForUpdate, urlCarriesAuth } from './swUpdate'

const ctx = (over: Partial<Parameters<typeof shouldReloadForUpdate>[0]> = {}) => ({
  hadController: true,
  url: '?view=account',
  alreadyReloaded: false,
  ...over,
})

describe('picking up a new build', () => {
  it('reloads when a new worker claims a page that was already controlled', () => {
    // The whole point: the document is running the previous build's bundle out
    // of the old precache, and nothing else will ever replace it.
    expect(shouldReloadForUpdate(ctx())).toBe(true)
  })

  it('does not reload on a first-ever visit', () => {
    // The first worker claims a page that is already the newest build. A reload
    // there is a pointless flash in someone's first second in the app.
    expect(shouldReloadForUpdate(ctx({ hadController: false }))).toBe(false)
  })

  it('reloads at most once per tab', () => {
    expect(shouldReloadForUpdate(ctx({ alreadyReloaded: true }))).toBe(false)
  })
})

/**
 * The guard that matters. Supabase comes back from Google with the session in
 * the fragment (implicit is this client's default — `flowType` is unset) or a
 * `code` in the query, and `detectSessionInUrl` reads it asynchronously. A
 * reload at that instant throws the fragment away **before the session is
 * persisted**, and the user lands signed out with nothing to read — identical
 * to COD-290 and COD-293 from the outside, and it would have been blamed on
 * one of them.
 *
 * Being one build stale for thirty seconds is free. Losing a sign-in is not.
 */
describe('an update arriving mid-sign-in is left for the next load', () => {
  it.each([
    ['#access_token=abc&refresh_token=def&expires_in=3600', 'implicit return'],
    ['?view=account&code=4%2F0AX4', 'PKCE return'],
    ['#error=server_error&error_code=unexpected_failure', 'a refused exchange'],
    ['?error=access_denied', 'a refusal in the query'],
    ['#refresh_token=xyz', 'a bare refresh token'],
  ])('%s — %s', (url) => {
    expect(urlCarriesAuth(url)).toBe(true)
    expect(shouldReloadForUpdate(ctx({ url }))).toBe(false)
  })

  it('does not mistake ordinary app URLs for an auth round trip', () => {
    // A false positive here is permanent staleness, so the pattern is anchored
    // on a parameter boundary rather than matching the word anywhere. `day` and
    // `view` are this app's real parameters; `barcode` is the trap — it ends in
    // "code" and must not match.
    for (const url of ['', '?view=today', '?view=today&day=2026-10-09', '#', '?q=barcode=7', '?view=nutrition&barcode=123']) {
      expect(urlCarriesAuth(url), url).toBe(false)
      expect(shouldReloadForUpdate(ctx({ url })), url).toBe(true)
    }
  })
})
