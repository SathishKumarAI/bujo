import { useState } from 'react'
import { FolderOpen, GitBranch, RefreshCw, Upload, Download, HardDrive } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Input } from './ui'
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { todayISO } from '../lib/date'
import { folderName, isSupported, loadFromFolder, pickFolder, restoreFolder, saveToFolder } from '../lib/fscloud'
import { pullGist, pushGist, verifyToken } from '../lib/github'
import { useConfirm } from './ConfirmDialog'
import { Button } from './ui/button'

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
      if ((e as Error).name !== 'AbortError') alert((e as Error).message)
    } finally {
      setBusy('')
    }
  }
  async function syncFolderNow() {
    setBusy('folder')
    try {
      if (!(await restoreFolder(true))) return alert('Folder access not granted.')
      await saveToFolder(data)
      alert('Saved to your cloud folder.')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  // ── GitHub gist ──
  async function ghBackup() {
    if (!s.githubToken) return alert('Paste a GitHub token (gist scope) first.')
    setBusy('gh')
    try {
      if (!(await verifyToken(s.githubToken))) return alert('Token rejected by GitHub.')
      const id = await pushGist(s.githubToken, s.githubGistId, data)
      setSettings({ githubGistId: id, lastDriveSync: todayISO() })
      alert('Backed up to a private GitHub gist.')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy('')
    }
  }
  async function ghRestore() {
    if (!s.githubToken || !s.githubGistId) return alert('Connect + back up to GitHub first.')
    if (!await confirm({
      title: 'Replace this device’s journal with the GitHub copy?',
      description: 'Everything currently on this device is overwritten by the copy stored in your gist.',
      confirmLabel: 'Replace my data', destructive: true,
    })) return
    setBusy('gh')
    try {
      const remote = await pullGist(s.githubToken, s.githubGistId)
      if (!remote) return alert('No bujo.json in that gist.')
      replaceAll(migrate(remote))
      alert('Restored from GitHub.')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Card
      title={<span className="inline-flex items-center gap-2"><HardDrive size={18} /> Your cloud storage</span>}
      subtitle="Sync your journal through storage you own. No accounts, no servers."
      className="lg:col-span-2"
    >
      {/* Folder */}
      <div className="rounded-lg border border-line bg-ink-0 p-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-body text-fg-1"><FolderOpen size={15} style={{ color: cat('mauve') }} /> Cloud-synced folder</span>
          {s.storageMode === 'folder' && <span className="text-label" style={{ color: cat('green') }}>● {s.folderName ?? folderName() ?? 'connected'}</span>}
        </div>
        <p className="mt-1 text-label text-fg-2">Pick a folder in your Drive/Dropbox/OneDrive sync folder, auto-saves there.</p>
        {!isSupported() ? (
          <p className="mt-2 text-label text-red">Needs Chrome / Edge.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={chooseFolder} disabled={!!busy} className="press-3d rounded-lg inline-flex items-center gap-1.5"><FolderOpen size={14} /> {s.storageMode === 'folder' ? 'Change folder' : 'Connect folder'}</Button>
            {s.storageMode === 'folder' && <Button variant="secondary" onClick={syncFolderNow} disabled={!!busy} className="press-3d rounded-lg inline-flex items-center gap-1.5"><RefreshCw size={14} /> Save now</Button>}
            {s.storageMode === 'folder' && <Button variant="ghost" onClick={() => setSettings({ storageMode: 'local', folderName: undefined })} className="press-3d rounded-lg text-red hover:text-red">Switch to local</Button>}
          </div>
        )}
      </div>

      {/* GitHub gist */}
      <div className="mt-3 rounded-lg border border-line bg-ink-0 p-3">
        <span className="inline-flex items-center gap-2 text-body text-fg-1"><GitBranch size={15} /> GitHub (private gist)</span>
        <p className="mt-1 text-label text-fg-2">
          Paste a token with the <code>gist</code> scope (github.com → Settings → Developer settings → Tokens).
        </p>
        <Input
          type="password"
          value={s.githubToken ?? ''}
          onChange={(e) => setSettings({ githubToken: e.target.value.trim() || undefined })}
          placeholder="ghp_…"
          className="mt-2 font-mono"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={ghBackup} disabled={!!busy} className="press-3d rounded-lg inline-flex items-center gap-1.5"><Upload size={14} /> {busy === 'gh' ? '…' : 'Back up to GitHub'}</Button>
          <Button variant="secondary" onClick={ghRestore} disabled={!!busy} className="press-3d rounded-lg inline-flex items-center gap-1.5"><Download size={14} /> Restore from GitHub</Button>
          {s.githubGistId && <a href={`https://gist.github.com/${s.githubGistId}`} target="_blank" rel="noreferrer" className="self-center text-label text-mauve hover:underline">open gist</a>}
        </div>
      </div>
    </Card>
  )
}
