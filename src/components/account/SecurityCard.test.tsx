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

  it('says a lost passphrase is unrecoverable', () => {
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/A lost passphrase is a lost journal/i)).toBeTruthy()
  })

  it('says the passphrase is stored in plain text, and that the passcode does not cover the cloud copy', () => {
    // COD-228, disclosed rather than buried. An account makes this feel more
    // official than it is, which is exactly when it most needs saying.
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/in plain text/i)).toBeTruthy()
    expect(screen.getByText(/protects this device and not the copy in your account/i)).toBeTruthy()
  })

  it('does not claim the metadata is private', () => {
    mockState.configured = true
    render(<SecurityCard />)
    expect(screen.getByText(/learns that you wrote, and when — never what/i)).toBeTruthy()
  })
})
