import { describe, it, expect, beforeEach } from 'vitest'
import { consumeAuthError } from './supabase'

/**
 * Covers the return leg of the Google redirect, which had no handler at all:
 * a refused sign-in rendered as an ordinary signed-out screen, and the only
 * record of the failure was in the address bar. Reported as "the screen is not
 * changing".
 *
 * The URLs here are verbatim from the failure, double-encoding included.
 */

const at = (url: string) => window.history.replaceState(null, '', url)
const here = () => window.location.pathname + window.location.search + window.location.hash

describe('consumeAuthError', () => {
  beforeEach(() => at('/'))

  it('reads the reason Google refused, from the real failure URL', () => {
    at(
      '/?demo=1&error=server_error&error_code=unexpected_failure' +
        '&error_description=Unable+to+exchange+external+code%3A+4%2F0A&view=account' +
        '#error=server_error&error_code=unexpected_failure' +
        '&error_description=Unable+to+exchange+external+code%253A+4%252F0A',
    )
    const failure = consumeAuthError()
    expect(failure).not.toBeNull()
    expect(failure!.message).toBe('Google sign-in did not complete')
    // Says where the fault is, and that the journal is intact — the provider's
    // own words read like data loss and none happened.
    expect(failure!.detail).toMatch(/still here/)
  })

  it('clears the error from both the query and the fragment, keeping the real params', () => {
    at('/?demo=1&error=server_error&view=account#error=server_error&error_code=unexpected_failure')
    consumeAuthError()
    expect(here()).toBe('/?demo=1&view=account')
    // And a reload cannot resurrect it.
    expect(consumeAuthError()).toBeNull()
  })

  it('leaves a success fragment completely alone', () => {
    // The guard that matters: `detectSessionInUrl` needs this fragment, and
    // racing it to the URL would break the path that works.
    const url = '/?view=account#access_token=abc&refresh_token=def&token_type=bearer'
    at(url)
    expect(consumeAuthError()).toBeNull()
    expect(here()).toBe(url)
  })

  it('is null on an ordinary URL, and does not touch it', () => {
    at('/?view=today')
    expect(consumeAuthError()).toBeNull()
    expect(here()).toBe('/?view=today')
  })

  it('passes through a reason it has no specific advice for', () => {
    at('/#error=access_denied&error_description=The+user+denied+the+request')
    expect(consumeAuthError()!.detail).toBe('The user denied the request')
  })

  it('falls back to the code when there is no description', () => {
    at('/#error=access_denied')
    expect(consumeAuthError()!.detail).toBe('access_denied')
  })

  it('survives a malformed escape rather than throwing on the error path', () => {
    at('/#error=server_error&error_description=100%+broken')
    expect(() => consumeAuthError()).not.toThrow()
  })
})
