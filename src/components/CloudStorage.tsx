import { ArrowsClockwise, Download, FolderOpen, GitBranch, Upload } from '@/components/icons'
import { useState } from 'react'
import { useJournal } from '../store'
import { migrate } from '../lib/storage'
import { todayISO } from '../lib/date'
import { folderName, isSupported, loadFromFolder, pickFolder, restoreFolder, saveToFolder } from '../lib/fscloud'
import { pullGist, pushGist, verifyToken } from '../lib/github'
import { useConfirm } from './ConfirmDialog'
import { notify } from '../lib/notify'
import { forEgress, mergePulled, CYCLE_CLAUSE } from '../lib/cyclePrivacy'
import { Cell, Cells, FieldCell } from './ui/cells'

/** Own-cloud storage options: a synced folder + a private GitHub gist. */
export function CloudStorage() {
  const confirm = useConfirm()
  const { data, setSettings, replaceAll } = useJournal()
  const s = data.settings
  const [busy, setBusy] = useState('')

  // ── Folder (File System Access) ──
  async function chooseFolder() {
    setBusy('folder')
    try {
      const name = await pickFolder()
      const remote = await loadFromFolder()
      if (remote && await confirm({
        title: 'Load the journal already in this folder?',
        description: 'This folder has an existing bujo.json. Loading it replaces everything currently on this device.',
        confirmLabel: 'Load it', destructive: true,
      })) {
        replaceAll(migrate(remote))
      } else {
        await saveToFolder(data)
      }
      setSettings({ storageMode: 'folder', folderName: name })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') notify.error('Could not use that folder', (e as Error).message)
    } finally {
      setBusy('')
    }
  }
  async function syncFolderNow() {
    setBusy('folder')
    try {
      if (!(await restoreFolder(true))) { notify.error('Folder access not granted', 'Re-pick the folder to grant permission again.'); return }
      await saveToFolder(data)
      notify.success('Saved to your cloud folder')
    } catch (e) {
      notify.error('That did not work', (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  // ── GitHub gist ──
  async function ghBackup() {
    if (!s.githubToken) { notify.error('No GitHub token', 'Paste a token with gist scope first.'); return }
    setBusy('gh')
    try {
      if (!(await verifyToken(s.githubToken))) { notify.error('Token rejected by GitHub', 'Check it has gist scope and has not expired.'); return }
      // A gist is a network destination like any other. `forEgress` also drops
      // `githubToken` — without it the gist carried the PAT that writes it.
      // See lib/cyclePrivacy.ts.
      const id = await pushGist(s.githubToken, s.githubGistId, forEgress(data))
      setSettings({ githubGistId: id, lastDriveSync: todayISO() })
      notify.success('Backed up to a private GitHub gist')
    } catch (e) {
      notify.error('That did not work', (e as Error).message)
    } finally {
      setBusy('')
    }
  }
  async function ghRestore() {
    if (!s.githubToken || !s.githubGistId) { notify.error('Nothing to restore', 'Connect and back up to GitHub first.'); return }
    if (!await confirm({
      title: 'Replace this device’s journal with the GitHub copy?',
      description: 'Everything currently on this device is overwritten by the copy stored in your gist.' + CYCLE_CLAUSE,
      confirmLabel: 'Replace my data', destructive: true,
    })) return
    setBusy('gh')
    try {
      const remote = await pullGist(s.githubToken, s.githubGistId)
      if (!remote) { notify.error('No bujo.json in that gist'); return }
      // `mergePulled`: the gist is pushed through `forEgress`, so it never holds
      // a cycle log and a raw replace read that absence as a deletion.
      replaceAll(mergePulled(data, migrate(remote)))
      notify.success('Restored from GitHub')
    } catch (e) {
      notify.error('That did not work', (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  // The folder and the gist as two groups of rows.
  return (
    <>
      <Cells title="Cloud-synced folder" aside="Drive · Dropbox · OneDrive">
        {!isSupported() ? (
          <p className="cell text-body text-fg-1">Needs Chrome / Edge</p>
        ) : (
          <>
            <Cell icon={FolderOpen} tone="mauve" title={s.storageMode === 'folder' ? 'Change folder' : 'Connect folder'}
              subtitle={s.storageMode === 'folder' ? `Saving to ${s.folderName ?? folderName() ?? 'your folder'}` : 'Pick one inside your sync folder'}
              chevron={false} onPress={busy ? undefined : chooseFolder} />
            {s.storageMode === 'folder' && <Cell icon={ArrowsClockwise} tone="teal" title="Save now" chevron={false} onPress={busy ? undefined : syncFolderNow} />}
            {s.storageMode === 'folder' && <button type="button" className="cell cell-danger" onClick={() => setSettings({ storageMode: 'local', folderName: undefined })}>Switch to local</button>}
          </>
        )}
      </Cells>
      <Cells title="GitHub (private gist)" aside="token needs gist scope">
        <FieldCell label="Token" type="password" value={s.githubToken ?? ''} onChange={(v) => setSettings({ githubToken: v.trim() || undefined })} placeholder="ghp_…" />
        <Cell icon={Upload} tone="blue" title={busy === 'gh' ? 'Working…' : 'Back up to GitHub'} chevron={false} onPress={busy ? undefined : ghBackup} />
        <Cell icon={Download} tone="teal" title="Restore from GitHub" subtitle="Replaces this device’s copy — asks first" chevron={false} onPress={busy ? undefined : ghRestore} />
        {s.githubGistId && <Cell icon={GitBranch} tone="overlay1" title="Open gist" href={`https://gist.github.com/${s.githubGistId}`} />}
      </Cells>
    </>
  )
}
