import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * The Account tab's sign-in rows (`SyncAccountCells`), which took over these
 * promises from the deleted desktop `AccountCard` (COD-571). The property that
 * makes the feature safe before a Supabase project exists: with no
 * `VITE_SUPABASE_URL` the rows are **absent**, not broken.
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

const { SyncAccountCells: AccountCard } = await import('./AccountPhoneCells')

/** The lists live in a sheet behind the "What is uploaded" row. */
const openUploaded = async () => userEvent.click(await screen.findByRole('button', { name: /what is uploaded/i }))
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

  it('states the trade the account actually makes, not only that it is convenient', async () => {
    // This assertion is INVERTED from what it was, and deliberately so. It
    // required "The account is recoverable. The journal is not." for as long as
    // the row was ciphertext; COD-309 made that false, and the honest half of
    // the new trade is that the server can read what it stores. A card that
    // offers a one-tap sign-in without saying so misrepresents it in the other
    // direction, which is the worse one.
    mockState.configured = true
    render(<AccountCard />)
    expect(
      await screen.findByText(/private to your account, not secret from the server/i),
    ).toBeTruthy()
  })

  it('shows who is signed in, and that signing out keeps the local journal', async () => {
    mockState.configured = true
    mockState.user = { email: 'someone@example.com' }
    render(<AccountCard />)
    await waitFor(() => expect(screen.getByText(/someone@example\.com/)).toBeTruthy())
    expect(screen.getByText(/this device keeps its journal/i)).toBeTruthy()
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
   * Signed in with no sync passphrase used to be the DEFAULT state of a new
   * account: `AccountSync` had nothing to encrypt with, so it uploaded nothing
   * and never would, while the card's subtitle claimed "your journal syncs to
   * your account" anyway. COD-309 removed the passphrase, so that state cannot
   * be reached — what is asserted instead is the remaining refusal a user can
   * sit in indefinitely, which is a demo journal.
   */
  it('admits that a demo journal is not being uploaded, and says what to do', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    render(<AccountCard />)
    setAccountStatus({ phase: 'demo' })
    await waitFor(() => expect(screen.getByText(/never pushed into a real account/i)).toBeTruthy())
    // The fix is named, not implied: this state is permanent until the demo is
    // erased, and `settings.explore` is set by one tap on the Welcome screen.
    expect(screen.getByText(/erase the demo/i)).toBeTruthy()
  })

  it('answers "what is actually being synced" on screen, both halves', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    render(<AccountCard />)
    await screen.findByText('sam@example.com') // signed in, so the row is the signed-in one
    await openUploaded()
    await waitFor(() => expect(screen.getByText('Uploaded to your account')).toBeTruthy())
    expect(screen.getByText('Never uploaded')).toBeTruthy()
    // The absolute promise. If this list stops naming the cycle log, the page
    // is making a weaker claim than `lib/cyclePrivacy.ts` enforces.
    expect(screen.getByRole('region', { name: 'Never uploaded' }).textContent).toMatch(/cycle log/i)
  })

  it('reports an unreadable row, and says nothing was overwritten', async () => {
    mockState.configured = true
    mockState.user = { email: 'sam@example.com' }
    render(<AccountCard />)
    setAccountStatus({ phase: 'unusable' })
    expect(await screen.findByText(/nothing has been overwritten/i)).toBeTruthy()
  })

  /**
   * The card led with "The account is recoverable. The journal is not." for as
   * long as the row was ciphertext. It is not, any more, and a promise that
   * outlives its mechanism is the failure mode this whole file guards.
   */
  it('no longer promises that the server cannot read the journal', async () => {
    mockState.configured = true
    mockState.user = null
    render(<AccountCard />)
    await waitFor(() => expect(screen.getByText(/continue with google/i)).toBeTruthy())
    const page = document.body.textContent ?? ''
    expect(page).not.toMatch(/the journal is not|cannot be read|encrypted on this device/i)
    // And says the true thing in its place, where a skimmer will meet it.
    expect(page).toMatch(/private to your account, not secret from the server/i)
  })

  it('keeps the honest half on the row itself, not only inside the sheet', async () => {
    mockState.configured = true
    render(<AccountCard />)
    const row = await screen.findByRole('button', { name: /what is uploaded/i })
    expect(row.textContent).toMatch(/not secret from the server/i)
  })
})
