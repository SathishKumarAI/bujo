import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { sendSignInLink, signOutAccount } from '../../lib/supacloud'
import { useAccount } from '../../lib/useAccount'
import { hasSync } from '../../lib/syncKey'
import { SyncTargetNotice } from './SyncTargetNotice'

/**
 * Sign in — **identity only**, and the card says so in the copy rather than in
 * a comment, because the words the industry uses here all imply more than this
 * does.
 *
 * What an account buys: a stable row of your own to sync against, addressed by
 * your user id instead of by a hash of your passphrase. What it does **not**
 * buy: any ability for the server to read the journal. The encryption is
 * unchanged and the key never leaves this browser — signing in does not put
 * anything readable anywhere.
 *
 * **Renders nothing when no Supabase is configured.** Not a disabled card, not
 * a "coming soon": a build with no backend must look exactly like the app did
 * before accounts existed, because `PRODUCT.md` forbids any UI that implies a
 * server is there when it is not.
 *
 * No password field, anywhere, by design — a one-time email link has nothing to
 * store, nothing to leak and nothing to reset.
 */
export function AccountCard() {
  const { data, setSettings } = useJournal()
  const { user, ready, configured } = useAccount()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  if (!configured) return null

  async function send() {
    if (!/.+@.+\..+/.test(email)) { setMsg('Enter an email address.'); return }
    setBusy(true); setMsg('')
    try { await sendSignInLink(email); setMsg(`Check ${email} for a sign-in link. It works once, and it expires.`) }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy(false) }
  }

  async function out() {
    setBusy(true)
    // The journal is canonical here and is not touched. Signing out stops the
    // sync; it does not remove anything local, and the row stays where it is.
    try { await signOutAccount(); setSettings({ syncTarget: undefined }); setMsg('Signed out. Your journal is untouched on this device.') }
    finally { setBusy(false) }
  }

  const keyed = hasSync()
  const syncing = data.settings.syncTarget === 'supabase'

  return (
    <Card band title="Account" subtitle="Identity only — the server still cannot read your journal">
      {!ready ? (
        <p className="text-body text-fg-2">Checking…</p>
      ) : !user ? (
        <>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email address for a sign-in link"
          />
          <div className="mt-3">
            <Button variant="secondary" onClick={send} disabled={busy}>
              {busy ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-body text-fg-1">Signed in as <strong>{user.email}</strong></p>
          <label className="mt-3 flex cursor-pointer items-center justify-between text-body text-fg-1">
            <span>
              Sync this journal to my account
              <span className="block text-label text-fg-2">Encrypted here first — the server stores ciphertext against your user id</span>
            </span>
            <Switch
              checked={syncing}
              disabled={!keyed}
              onCheckedChange={(on) => setSettings({ syncTarget: on ? 'supabase' : undefined })}
            />
          </label>
          {!keyed && (
            <p className="mt-2 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
              Set a sync passphrase in <strong>Cloud sync</strong> first and turn its auto-sync on once.
              That is what derives the encryption key — an account by itself has no key, and this app
              will not upload anything it cannot encrypt.
            </p>
          )}
          <SyncTargetNotice />
          <div className="mt-3">
            <Button variant="secondary" onClick={out} disabled={busy}>Sign out</Button>
          </div>
        </>
      )}
      {msg && <p className="mt-2 text-label text-fg-1">{msg}</p>}
      <p className="mt-2 text-label text-fg-2">
        An account is a name for a row, not a place your journal is readable. Your passphrase and the
        key it derives never reach the server, so nobody — including whoever runs it — can decrypt
        what is stored. A lost passphrase still cannot be recovered; signing in does not change that.
      </p>
    </Card>
  )
}
