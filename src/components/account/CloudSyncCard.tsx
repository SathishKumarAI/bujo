import { autoSyncEnabled, clearSyncPassphrase } from '../../lib/syncSecret'
import { Download, Upload } from '@/components/icons'
import { useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { pushCloud, pullCloud } from '../../lib/bujocloud'
import { migrate } from '../../lib/storage'
import { mergePulled, CYCLE_CLAUSE } from '../../lib/cyclePrivacy'
import { Cell, Cells, FieldCell, ToggleCell } from '../ui/cells'
import { InfoCell } from '../ui/infoCell'

/**
 * One-passphrase, end-to-end-encrypted cloud sync (Vercel Blob via /api/sync).
 *
 * Rendered only by Settings → Sync (`settings/SyncTab.tsx`), which sits inside
 * `AsPhone`, so it draws as grouped rows on every device. The desktop card it
 * used to carry beside them was unreachable after #524 and was removed
 * (COD-571).
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

  // Grouped rows; the explanation is points behind a row.
  return (
    <Cells title="Encrypted sync" aside="no server can read it">
      <FieldCell label="Passphrase" type="password" value={pass} onChange={setPass} placeholder="Sync passphrase" />
      <Cell icon={Upload} tone="blue" title={busy === 'push' ? 'Pushing…' : 'Push to cloud'} chevron={false} onPress={busy ? undefined : push} />
      <Cell icon={Download} tone="teal" title={busy === 'pull' ? 'Pulling…' : 'Pull from cloud'} subtitle="Replaces this device’s copy — asks first" chevron={false} onPress={busy ? undefined : pull} />
      <ToggleCell title="Auto-sync on this device" subtitle="Pull on open · push on change" on={auto} onChange={toggleAuto} />
      {auto && encrypted && <p className="cell text-label text-fg-1" role="note">Auto-sync keeps this passphrase readable in this browser — switch it off to sync by hand.</p>}
      {msg && <p className="cell text-label text-fg-1" role="status">{msg}</p>}
      <InfoCell title="How encrypted sync works" points={[
        'Separate from your account',
        'Encrypted in this browser before it is uploaded',
        'The server only ever stores ciphertext',
        'The same passphrase on another device gets your data back',
        'A lost passphrase cannot be recovered',
      ]} />
    </Cells>
  )
}
