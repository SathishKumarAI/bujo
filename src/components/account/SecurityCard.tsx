import { Card } from '../ui'
import { isConfigured } from '../../lib/supabase'
import { ShieldCheck, ShieldWarning } from '@/components/icons'
import { useDevice } from '../shell/device'
import { Cells } from '../ui/cells'
import { InfoCell } from '../ui/infoCell'

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
 *   • the server can read the account copy → do not treat it as a secret store;
 *   • the passcode protects this device only → it does not reach your account;
 *   • Google learns that you use this app  → inherent to using them for identity.
 *
 * Nothing here is generated or inferred. Every claim maps to a mechanism in
 * this repo, and the ones that are enforced by a test say so, because "we take
 * security seriously" is not a mechanism.
 */

type Row = { claim: string; how: string }

const PROTECTED: Row[] = [
  {
    claim: 'No other account can read your journal',
    how: 'Postgres row-level security, forced on. The owner column is filled in from your verified sign-in token, so a client cannot claim to be someone else.',
  },
  {
    claim: 'A signed-out request gets nothing at all',
    how: 'The anonymous role has no permissions on the table. It is refused before the security policies are even consulted.',
  },
  {
    claim: 'Your cycle log never leaves this device',
    how: 'Stripped from every network path without exception, enforced by a test that fails the build if a new sync target forgets. It is the one thing an account never reaches.',
  },
  {
    claim: 'Your sign-in never puts a token in the address bar',
    how: 'The PKCE flow returns a single-use code and trades it for your session over a POST, so nothing reusable is ever in a URL, your history, or anything that logs one.',
  },
  {
    claim: 'Signing out ends the session on every device',
    how: 'Not just this browser. The refresh token is revoked, so a laptop you have handed back cannot quietly keep your phone signed in.',
  },
  {
    claim: 'A passcode encrypts this journal at rest, here',
    how: 'AES-GCM-256, with the key from your passcode through PBKDF2-SHA256 at 600,000 rounds and a fresh random salt and IV on every write. Optional, and local to this device.',
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
    claim: 'The server can read your journal',
    how: 'It is stored in a form the service can read, which is what lets a brand-new device sign in and simply have your data. A database dump, or anyone holding an admin key, would read it too. This is the trade the account makes, and it is the one worth knowing before you write something you would not want read.',
  },
  {
    claim: 'The passcode lock protects this device, not your account',
    how: 'It encrypts the copy in this browser. The copy in your account is reached by signing in, so the passcode does not stand between anyone and that. Locking this device is not the same as locking your journal.',
  },
  {
    claim: 'The advanced self-host sync is the encrypted one',
    how: 'Settings → Sync & privacy → Advanced still offers a passphrase-encrypted copy that no server can read. It is a separate target from your account and it asks you to carry a secret — that is the cost the account avoids.',
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

/** The phone drawing of one half: a row whose sheet holds every claim and how. */
function SecuritySheet({ title, subtitle, icon, rows }: { title: string; subtitle: string; icon: typeof ShieldCheck; rows: Row[] }) {
  return (
    <InfoCell title={title} subtitle={subtitle} icon={icon}>
      <Rows rows={rows} />
    </InfoCell>
  )
}

export function SecurityCard() {
  const phone = useDevice() === 'mobile'
  // Unconfigured builds have no account, so most of this would describe
  // something the reader cannot use. The local half is covered by the passcode
  // and sync cards already on this page.
  if (!isConfigured()) return null
  // Phone: both halves stay on the page — as two rows, each opening its sheet.
  if (phone) return (
    <Cells title="Protection">
      <SecuritySheet title="How your journal is protected" subtitle="Seven mechanisms, each one a thing the code does" icon={ShieldCheck} rows={PROTECTED} />
      <SecuritySheet title="What this does not protect" subtitle="The half worth reading twice" icon={ShieldWarning} rows={LIMITS} />
    </Cells>
  )
  return (
    <>
      {/* ── Folded by default, which is a change and needs its reason ───────
          These two cards are **reference**: eleven rows of prose that answer
          "how is this protected" once and then never again. On the Sync
          section they were the single biggest thing on the page — folding
          them is what takes that section from 2.37 screens of sideways scroll
          to roughly one.

          Folded, not moved, and not shortened. The second card especially has
          to stay on this page and stay complete: a page listing only the
          protections is marketing, and the limits are the half a reader cannot
          verify for themselves. A fold costs one click; a link costs a
          navigation and gets followed by nobody.

          `Card collapsible` renders a real `aria-expanded` toggle, so
          `openFolds()` in `scripts/a11y-axe.mjs` opens both before scanning —
          which is the thing that makes this safe. Folding content is how the
          Gym contract pass hid a 1.41:1 contrast bug from the gate (COD-93);
          the gate was armed against exactly that afterwards, and this relies
          on it. */}
      <Card
        band
        collapsible
        defaultCollapsed
        title="How your journal is protected"
        subtitle="Seven mechanisms, each one a thing the code does"
      >
        <Rows rows={PROTECTED} />
      </Card>
      <Card
        band
        collapsible
        defaultCollapsed
        title="What this does not protect"
        subtitle="The half worth reading twice"
      >
        <Rows rows={LIMITS} />
      </Card>
    </>
  )
}
