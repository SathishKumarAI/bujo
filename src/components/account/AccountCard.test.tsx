import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'

/**
 * The property that makes this feature safe to merge before a Supabase project
 * exists: with no `VITE_SUPABASE_URL` the card is **absent**, not broken.
 *
 * Worth a test rather than a glance because the failure is asymmetric. If
 * `isConfigured()` ever returns true by accident — an empty-string env var read
 * as truthy, a default slipped into the client — every clone of this public
 * repo gets a sign-in button that throws on click, and the first run of the app
 * is an error instead of a journal.
 */
const mockState = {
  configured: false,
  user: null as { email?: string; user_metadata?: Record<string, unknown> } | null,
}

vi.mock('../../lib/supabase', () => ({
  isConfigured: () => mockState.configured,
  currentUser: async () => mockState.user,
  onAuthChange: () => () => {},
  signInGoogle: async () => {},
  signOut: async () => {},
}))

const { AccountCard } = await import('./AccountCard')
const { __resetAuthUser } = await import('../../lib/authUser')
const { __resetAccountStatus, setAccountStatus } = await import('../../lib/accountStatus')

afterEach(() => {
  cleanup()
  mockState.configured = false
  mockState.user = null
  // The user and the sync phase are module stores now, not `useState` — so
  // state leaks between tests in this file unless each one starts from nothing.
  // That is the cost of the fix and it is the right trade: the whole bug was
  // that the state was NOT shared.
  __resetAuthUser()
  __resetAccountStatus()
})

describe('the account card is absent until a project is configured', () => {
  it('renders nothing with no Supabase project', () => {
    const { container } = render(<AccountCard />)
    expect(container.firstChild).toBeNull()
  })

  it('offers Google once configured', async () => {
    mockState.configured = true
    render(<AccountCard />)
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeTruthy()
  })

  it('says the journal is unrecoverable, not only that the account is secure', async () => {
    // The sentence this card exists for. Every other product with a Google
    // button means "we can always get your data back"; this one cannot, and a
    // card that offers the button without the caveat misrepresents the trade.
    mockState.configured = true
    render(<AccountCard />)
    expect(await screen.findByText(/The account is recoverable\. The journal is not\./i)).toBeTruthy()
  })

  it('shows who is signed in, and that signing out keeps the local journal', async () => {
    mockState.configured = true
    mockState.user = { email: 'someone@example.com' }
    render(<AccountCard />)
    await waitFor(() => expect(screen.getByText(/someone@example\.com/)).toBeTruthy())
    expect(screen.getByText(/leaves this journal on this device/i)).toBeTruthy()
  })

  it('prefers the Google display name over the email for the identity line', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com', user_metadata: { full_name: 'Sam Rivera' } }
    render(<AccountCard />)
    await waitFor(() => expect(screen.getByText('Sam Rivera')).toBeTruthy())
  })

  /**
   * COD-291, and the reason this card was rewritten.
   *
   * Signed in with no sync passphrase is the DEFAULT state of a new account:
   * `AccountSync` has nothing to encrypt with, so it uploads nothing and never
   * will. The card's subtitle claimed "your journal syncs to your account"
   * anyway, which is how a user can sign in, see a card that says it is
   * working, and have no copy of their journal anywhere.
   */
  it('admits that nothing is uploaded when there is no passphrase, and offers the fix', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    const nav = vi.fn()
    render(<AccountCard onGoToSync={nav} />)
    setAccountStatus({ phase: 'no-passphrase' })
    await waitFor(() => expect(screen.getByText(/nothing has been uploaded/i)).toBeTruthy())
    expect(await screen.findByRole('button', { name: /set a sync passphrase/i })).toBeTruthy()
  })

  it('answers "what is actually being synced" on screen, both halves', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    render(<AccountCard />)
    await waitFor(() => expect(screen.getByText('Uploaded, encrypted')).toBeTruthy())
    expect(screen.getByText('Never uploaded')).toBeTruthy()
    // The absolute promise. If this list stops naming the cycle log, the page
    // is making a weaker claim than `lib/cyclePrivacy.ts` enforces.
    expect(screen.getByText(/cycle log/i)).toBeTruthy()
  })

  it('reports a locked row as locked, and says nothing was overwritten', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    render(<AccountCard />)
    setAccountStatus({ phase: 'locked' })
    expect(await screen.findByText(/nothing has been overwritten/i)).toBeTruthy()
  })
})
