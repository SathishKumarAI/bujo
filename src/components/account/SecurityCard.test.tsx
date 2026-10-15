import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

/**
 * A security card that lists only guarantees is the shape every breach
 * post-mortem quotes back. These tests pin the half that is not reassuring,
 * because that is the half a cheerful copy edit removes.
 */
const mockState = { configured: false }
vi.mock('../../lib/supabase', () => ({ isConfigured: () => mockState.configured }))

const { SecurityCard } = await import('./SecurityCard')
afterEach(() => { cleanup(); mockState.configured = false })

describe('the security card states both halves', () => {
  it('renders nothing when there is no account to describe', () => {
    const { container } = render(<SecurityCard />)
    expect(container.firstChild).toBeNull()
  })

  it('names the mechanisms, not just the reassurance', () => {
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/600,000 rounds/)).toBeTruthy()
    expect(screen.getByText(/row-level security, forced on/i)).toBeTruthy()
  })

  it('says the server can read the journal', () => {
    // The limit COD-309 created, and the one a reader is least likely to guess:
    // every other line on this card is reassuring, and an account that syncs in
    // one tap reads as "they thought of everything". This is the sentence that
    // says what was traded away to get it.
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/The server can read your journal/i)).toBeTruthy()
  })

  it('says the passcode does not reach the copy in your account', () => {
    // Was COD-228's plaintext-passphrase disclosure. The passphrase is gone
    // from this path, the gap it described is not: locking this device still
    // does nothing to the copy your account will hand to the next sign-in, and
    // a passcode prompt makes the whole journal feel locked.
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/protects this device, not your account/i)).toBeTruthy()
    expect(screen.getByText(/Locking this device is not the same as locking your journal/i)).toBeTruthy()
  })

  it('still points at the encrypted target for anyone who wants it', () => {
    // The option was not deleted, only demoted. Someone who came to this app
    // FOR the end-to-end encryption needs to find where it went.
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/self-host sync is the encrypted one/i)).toBeTruthy()
  })

  it('does not claim the metadata is private', () => {
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/learns that you wrote, and when — never what/i)).toBeTruthy()
  })
})
