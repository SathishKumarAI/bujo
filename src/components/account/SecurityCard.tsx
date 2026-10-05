import { Card } from '../ui'
import { isConfigured } from '../../lib/supabase'

/**
 * What protects this journal, and where it does not — on screen, not only in
 * `docs/`.
 *
 * Asked for directly: *"let the user know that it's going to be secured in
 * real life, what security practices we have practised."* The honest version of
 * that request includes the half that is not reassuring, and this card would be
 * marketing without it.
 *
 * ── Why both halves are one component ──────────────────────────────────────
 *
 * A "Security" card listing only guarantees is the shape every breach
 * post-mortem quotes back. The limits here are not hedging — each one is a real
 * property of the system that changes what a reader should do:
 *
 *   • a lost passphrase is unrecoverable → write it down somewhere real;
 *   • auto-sync stores it in plaintext  → the passcode lock does not cover the
 *                                         cloud copy (COD-228);
 *   • metadata is not encrypted         → the server knows when you wrote.
 *
 * Nothing here is generated or inferred. Every claim maps to a mechanism in
 * this repo, and the ones that are enforced by a test say so, because "we take
 * security seriously" is not a mechanism.
 */

type Row = { claim: string; how: string }

const PROTECTED: Row[] = [
  {
    claim: 'The server cannot read your journal',
    how: 'AES-GCM-256. The key comes from your passphrase through PBKDF2-SHA256 at 600,000 rounds, with a fresh random salt and IV on every single write.',
  },
  {
    claim: 'The key never leaves this device',
    how: 'It is derived in your browser. Neither the key nor the passphrase is ever sent anywhere — there is no request that could carry them.',
  },
  {
    claim: 'No other account can read your row',
    how: 'Postgres row-level security, forced on. The owner column is filled in from your verified sign-in token, so a client cannot claim to be someone else.',
  },
  {
    claim: 'A signed-out request gets nothing at all',
    how: 'The anonymous role has no permissions on the table. It is refused before the security policies are even consulted.',
  },
  {
    claim: 'Your cycle log never leaves this device',
    how: 'Stripped from every network path without exception, enforced by a test that fails the build if a new sync target forgets.',
  },
  {
    claim: 'Your other services’ tokens never travel',
    how: 'The same step removes your GitHub, Google and self-host tokens from anything uploaded.',
  },
  {
    claim: 'Encrypted in transit',
    how: 'TLS, everywhere, which your browser enforces rather than trusting us for.',
  },
]

const LIMITS: Row[] = [
  {
    claim: 'A lost passphrase is a lost journal',
    how: 'You can still sign in and your data is still there — permanently unreadable, by you and by anyone else. This is the cost of the first promise above, not a gap in it. Write the passphrase down somewhere real.',
  },
  {
    claim: 'Auto-sync keeps your passphrase in this browser, in plain text',
    how: 'It has to, to run unattended. Anyone who can read this browser’s storage can read the cloud copy, so the passcode lock protects this device and not the copy in your account. Push and Pull by hand store nothing.',
  },
  {
    claim: 'Google knows you use this app',
    how: 'Signing in with Google tells Google that. It is inherent to using them for identity, and it is the price of not having to remember another password.',
  },
  {
    claim: 'When you wrote is not secret; what you wrote is',
    how: 'Your account id and the time of the last change are stored in the clear, because the server has to route and order writes. Someone with database access learns that you wrote, and when — never what.',
  },
]

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.claim}>
          <p className="text-body font-medium text-fg-1">{r.claim}</p>
          <p className="text-body text-fg-2">{r.how}</p>
        </li>
      ))}
    </ul>
  )
}

export function SecurityCard() {
  // Unconfigured builds have no account, so most of this would describe
  // something the reader cannot use. The local half is covered by the passcode
  // and sync cards already on this page.
  if (!isConfigured()) return null
  return (
    <>
      <Card band title="How your journal is protected" subtitle="Each line is a mechanism, not a promise">
        <Rows rows={PROTECTED} />
      </Card>
      <Card band title="What this does not protect" subtitle="The half worth reading twice">
        <Rows rows={LIMITS} />
      </Card>
    </>
  )
}
