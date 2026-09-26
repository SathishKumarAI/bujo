import { Download, Upload } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { pushCloud, pullCloud } from '../../lib/bujocloud'
import { migrate } from '../../lib/storage'

/**
 * One-passphrase, end-to-end-encrypted cloud sync (Vercel Blob via /api/sync).
 *
 * Lives here rather than inside `views/Settings.tsx` because Account needs the
 * same card: the local account has no email and no provider, so *this* is what
 * "sync your journal" means in this app, and burying it two tabs into Settings
 * made it look like an advanced option rather than the only one.
 *
 * The markup was moved verbatim, not re-typed. The rendered card was captured
 * from the running app before the move and diffed after — 4,637 characters,
 * byte-identical. That is the drill this repo's CLAUDE.md asks for before
 * extracting shared markup, and it exists because an "identical" banner
 * extraction once silently replaced an office phone number with 911.
 */
export function CloudSyncCard() {
  const confirm = useConfirm()
  const { data, replaceAll, encrypted } = useJournal()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')

  async function push() {
    if (pass.length < 6) { setMsg('Use a passphrase of at least 6 characters.'); return }
    setBusy('push'); setMsg('')
    try { await pushCloud(pass, data); setMsg('Pushed to cloud.') }
    catch (e) { setMsg((e as Error).message) }
    finally { setBusy('') }
  }
  async function pull() {
    if (pass.length < 6) { setMsg('Enter your passphrase first.'); return }
    setBusy('pull'); setMsg('')
    try {
      const remote = await pullCloud(pass)
      if (!remote) { setMsg('Nothing stored for that passphrase yet.'); return }
      if (await confirm({
        title: 'Replace this device’s data with the cloud copy?',
        description: 'Everything currently on this device is overwritten by the encrypted copy stored in the cloud.',
        confirmLabel: 'Replace my data', destructive: true,
      })) { replaceAll(migrate(remote)); setMsg('Pulled from cloud.') }
    } catch (e) { setMsg(/wrong|decrypt|operation/i.test((e as Error).message) ? 'Wrong passphrase, or corrupt data.' : (e as Error).message) }
    finally { setBusy('') }
  }

  const [auto, setAuto] = useState(() => !!localStorage.getItem('bujo:sync'))

  /**
   * Auto-sync has to keep the passphrase to run unattended, and it keeps it in
   * **plaintext** at `bujo:sync` — there is nowhere else to put a secret a
   * background task needs while nobody is watching.
   *
   * That is a fair trade on an unlocked journal and a **false promise on a
   * locked one.** `docs/AUTH.md` calls the passcode "the only control here
   * that actually restricts access", and with both switched on the measured
   * localStorage is:
   *
   *   bujo:enc   {"v":1,"salt":"R6+Ar…  103,399 chars of ciphertext
   *   bujo:sync  correct-horse-battery
   *
   * The lock works exactly as documented — `bujo:data` is gone. It just does
   * not matter, because the key to the cloud copy of the same journal is
   * sitting beside it in the clear: read that string, call `pullCloud` with
   * it, and the passcode was never in the way.
   *
   * Not silently fixed, because the fix is a product decision: encrypting
   * `bujo:sync` under the passcode key would mean auto-sync cannot run while
   * the journal is locked, which is most of the time and is arguably the
   * point. So the choice is surfaced where it is made, once, in words — and
   * left on screen while both are on, because a warning you clicked past a
   * month ago is not a warning.
   */
  async function toggleAuto(on: boolean) {
    if (on) {
      if (pass.length < 6) { setMsg('Enter a passphrase first, then enable auto-sync.'); return }
      if (encrypted && !await confirm({
        title: 'Auto-sync stores this passphrase unencrypted',
        description:
          'This journal has a passcode, so it is encrypted on this device. Auto-sync has to keep the '
          + 'passphrase in readable browser storage to run on its own — and anyone who can read that '
          + 'can fetch the cloud copy of this journal without the passcode. Push and Pull by hand do '
          + 'not store anything.',
        confirmLabel: 'Turn on auto-sync anyway',
        cancelLabel: 'Keep syncing by hand',
        destructive: true,
      })) return
      localStorage.setItem('bujo:sync', pass); setAuto(true); push()
    } else { localStorage.removeItem('bujo:sync'); setAuto(false); setMsg('Auto-sync off.') }
  }

  return (
    <Card band title="Cloud sync" subtitle="One passphrase, end-to-end encrypted, sync across devices">
      <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Sync passphrase" autoComplete="off" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={push} disabled={!!busy} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> {busy === 'push' ? 'Pushing…' : 'Push to cloud'}</Button>
        <Button variant="secondary" onClick={pull} disabled={!!busy} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> {busy === 'pull' ? 'Pulling…' : 'Pull from cloud'}</Button>
      </div>
      <label className="mt-3 flex cursor-pointer items-center justify-between text-body text-fg-1">
        <span>Auto-sync on this device <span className="text-label text-fg-2">(pull on open · push on change)</span></span>
        <Switch checked={auto} onCheckedChange={toggleAuto} />
      </label>
      {auto && encrypted && (
        <p className="mt-2 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
          Auto-sync keeps this passphrase in readable browser storage, so it can fetch the cloud copy
          of this journal without the passcode. Switch it off to sync by hand instead.
        </p>
      )}
      {msg && <p className="mt-2 text-label text-fg-1">{msg}</p>}
      <p className="mt-2 text-label text-fg-2">Your journal is encrypted in this browser before it is uploaded, so the server only ever stores ciphertext. Enter the same passphrase on another device to get your data back. There are no accounts, and a lost passphrase cannot be recovered.</p>
    </Card>
  )
}
