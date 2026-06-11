import { useState } from 'react'
import { CloudCog, HardDrive, FolderOpen, ShieldCheck, Check } from 'lucide-react'
import { useJournal } from '../store'
// (Welcome uses native buttons)
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { isSupported, loadFromFolder, pickFolder, saveToFolder } from '../lib/fscloud'

/**
 * First-run gate. The app is local-first; here the user chooses where their
 * journal lives: a cloud-synced folder they own (File System Access API) or
 * this device only. No accounts, no servers.
 */
export function Welcome() {
  const { data, setSettings, replaceAll } = useJournal()
  const [busy, setBusy] = useState(false)
  const supported = isSupported()

  async function chooseFolder() {
    setBusy(true)
    try {
      const name = await pickFolder()
      const remote = await loadFromFolder()
      if (remote) {
        if (confirm('Found an existing bujo.json in this folder. Load it? (replaces this device’s current data)')) {
          replaceAll(migrate(remote))
        } else {
          await saveToFolder(data)
        }
      } else {
        await saveToFolder(data) // seed the folder
      }
      setSettings({ storageMode: 'folder', folderName: name })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') alert('Could not use that folder: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-base p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-baseline justify-center gap-2">
            <span className="font-display text-4xl font-semibold text-text">bujo</span>
            <span className="text-mauve">✦</span>
          </div>
          <p className="text-subtext0">A private, local-first bullet journal. Choose where your journal lives.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Own cloud — pick a folder */}
          <button
            onClick={chooseFolder}
            disabled={!supported || busy}
            className="card-3d group rounded-2xl border border-surface0 bg-mantle p-5 text-left transition-colors hover:border-mauve disabled:opacity-50"
          >
            <CloudCog size={28} style={{ color: cat('mauve') }} />
            <h2 className="mt-3 font-display text-xl text-text">Use my own cloud</h2>
            <p className="mt-1 text-sm text-subtext0">
              Point bujo at a folder inside your Drive / Dropbox / OneDrive sync
              folder. Your existing cloud syncs it across devices.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-overlay1">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> No account, no sign-in</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Works with any cloud you already use</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Your files, your control</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-mauve">
              <FolderOpen size={15} /> {busy ? 'Opening…' : 'Choose folder'}
            </span>
            {!supported && <p className="mt-2 text-xs text-red">Needs Chrome / Edge. Use “this device” instead.</p>}
          </button>

          {/* Local only */}
          <button
            onClick={() => setSettings({ storageMode: 'local' })}
            className="card-3d group rounded-2xl border border-surface0 bg-mantle p-5 text-left transition-colors hover:border-mauve"
          >
            <HardDrive size={28} style={{ color: cat('blue') }} />
            <h2 className="mt-3 font-display text-xl text-text">This device only</h2>
            <p className="mt-1 text-sm text-subtext0">
              Keep everything in this browser. Nothing leaves the device. You can
              connect a cloud folder later in Settings.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-overlay1">
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Fastest, fully offline</li>
              <li className="flex items-center gap-1.5"><Check size={12} style={{ color: cat('green') }} /> Export backups anytime</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue">Continue on this device →</span>
          </button>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-overlay0">
          <ShieldCheck size={13} /> No servers, no tracking. Your data is yours.
        </p>
      </div>
    </div>
  )
}
