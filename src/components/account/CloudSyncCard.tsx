import { autoSyncEnabled, clearSyncPassphrase } from '../../lib/syncSecret'
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
import { mergePulled, CYCLE_CLAUSE } from '../../lib/cyclePrivacy'

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
  const { data, replaceAll, encrypted, saveSyncPassphrase } = useJournal()
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
        description:
          'Everything currently on this device is overwritten by the encrypted copy stored in the cloud.' +
          CYCLE_CLAUSE,
        confirmLabel: 'Replace my data', destructive: true,
      })) {
        // `mergePulled`, not a raw replace. `pushCloud` strips the cycle log, so
        // the blob ALWAYS holds `cycle: []` — a raw replace here erased the log
        // every single time this button was pressed, with nothing on screen
        // naming it and no way back (COD-265). Withheld is not deleted.
        replaceAll(mergePulled(data, migrate(remote)))
        setMsg('Pulled from cloud.')
      }
    } catch (e) { setMsg(/wrong|decrypt|operation/i.test((e as Error).message) ? 'Wrong passphrase, or corrupt data.' : (e as Error).message) }
    finally { setBusy('') }
  }

  const [auto, setAuto] = useState(() => autoSyncEnabled())

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
      // The dialog that used to stand here warned that auto-sync stores the
      // passphrase unencrypted and asked you to accept it. That warning was
      // accurate and it is now obsolete: `saveSyncPassphrase` seals the
      // passphrase under the passcode when there is one. Consent is not the
      // fix for a design that hands over a second copy of the journal —
      // COD-228.
      if (encrypted && !await confirm({
        title: 'Auto-sync pauses while this journal is locked',
        description:
          'This journal has a passcode, so the sync passphrase is stored encrypted under it. '
          + 'That means auto-sync can only run after you unlock — it will not sync in the '
          + 'background from a locked device, which is the point. Push and Pull by hand are '
          + 'unchanged.',
        confirmLabel: 'Turn on auto-sync',
        cancelLabel: 'Keep syncing by hand',
      })) return
      await saveSyncPassphrase(pass); setAuto(true); push()
    } else { clearSyncPassphrase(); setAuto(false); setMsg('Auto-sync off.') }
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
