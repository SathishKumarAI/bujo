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
const mockState = { configured: false, user: null as { email: string } | null }

vi.mock('../../lib/supabase', () => ({
  isConfigured: () => mockState.configured,
  currentUser: async () => mockState.user,
  onAuthChange: () => () => {},
  signInGoogle: async () => {},
  signOut: async () => {},
}))

const { AccountCard } = await import('./AccountCard')

afterEach(() => { cleanup(); mockState.configured = false; mockState.user = null })

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
})
