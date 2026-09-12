import { Check, CloudCheck, FolderOpen, HardDrive, ShieldCheck } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { notify } from '../lib/notify'
// (the three choice cards below stay native buttons — card-shaped click targets)
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { migrate } from '../lib/storage'
import { generateDemoData } from '../lib/demo'
import { isSupported, loadFromFolder, pickFolder, saveToFolder } from '../lib/fscloud'
import { useConfirm } from '../components/ConfirmDialog'

/**
 * First-run gate. The app is local-first; here the user chooses where their
 * journal lives: a cloud-synced folder they own (File System Access API) or
 * this device only. No accounts, no servers.
 */
export function Welcome() {
  const { data, setSettings, replaceAll } = useJournal()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const supported = isSupported()

  async function chooseFolder() {
    setBusy(true)
    try {
      const name = await pickFolder()
      const remote = await loadFromFolder()
      if (remote) {
        if (await confirm({
          title: 'Load the journal already in this folder?',
          description: 'This folder has an existing bujo.json. Loading it replaces the data currently on this device.',
          confirmLabel: 'Load it', destructive: true,
        })) {
          replaceAll(migrate(remote))
        } else {
          await saveToFolder(data)
        }
      } else {
        await saveToFolder(data) // seed the folder
      }
      setSettings({ storageMode: 'folder', folderName: name })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') notify.error('Could not use that folder', (e as Error).message)
    } finally {
      setBusy(false)
    }
  }


  return (
    <div className="aurora grid min-h-screen place-items-center p-6">
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-9 text-center">
          <div className="rise mb-3 flex items-baseline justify-center gap-2">
            <span className="font-display text-display font-medium tracking-tight text-fg-1">bujo</span>
            <span className="text-title text-mauve">✦</span>
          </div>
          <p className="rise text-fg-2" style={{ animationDelay: '90ms' }}>A private bullet journal. It lives on this device. Choose where it should be kept — you can change this in Settings later.</p>
        </div>

        

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Own cloud · pick a folder */}
          <button
            onClick={chooseFolder}
            disabled={!supported || busy}
            className="card-3d rise group rounded-none border border-line bg-ink-1/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve disabled:opacity-50"
            style={{ animationDelay: '180ms' }}
          >
            <Icon as={CloudCheck} size="lg" style={{ color: cat('mauve') }} />
            <h2 className="mt-3 font-display text-title text-fg-1">Use my own cloud</h2>
            <p className="mt-1 text-body text-fg-2">
              Point bujo at a folder inside your Drive / Dropbox / OneDrive sync
              folder. Your existing cloud syncs it across devices.
            </p>
            <ul className="mt-3 space-y-1 text-label text-fg-2">
              <li className="flex items-center gap-1.5"><Icon as={Check} size="sm" style={{ color: cat('green') }} /> No account, no sign-in</li>
              <li className="flex items-center gap-1.5"><Icon as={Check} size="sm" style={{ color: cat('green') }} /> Works with any cloud you already use</li>
              <li className="flex items-center gap-1.5"><Icon as={Check} size="sm" style={{ color: cat('green') }} /> Your files, your control</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-body font-medium text-mauve">
              <Icon as={FolderOpen} size="sm" /> {busy ? 'Opening…' : 'Choose folder'}
            </span>
            {!supported && <p className="mt-2 text-label text-red">Requires Chrome or Edge. Choose “This device only” instead.</p>}
          </button>

          {/* Local only */}
          <button
            onClick={() => setSettings({ storageMode: 'local' })}
            className="card-3d rise group rounded-none border border-line bg-ink-1/80 p-5 text-left backdrop-blur transition-colors hover:border-mauve"
            style={{ animationDelay: '260ms' }}
          >
            <Icon as={HardDrive} size="lg" style={{ color: cat('blue') }} />
            <h2 className="mt-3 font-display text-title text-fg-1">This device only</h2>
            <p className="mt-1 text-body text-fg-2">
              Keep everything in this browser. Nothing leaves the device. You can
              connect a cloud folder later in Settings.
            </p>
            <ul className="mt-3 space-y-1 text-label text-fg-2">
              <li className="flex items-center gap-1.5"><Icon as={Check} size="sm" style={{ color: cat('green') }} /> Fastest, fully offline</li>
              <li className="flex items-center gap-1.5"><Icon as={Check} size="sm" style={{ color: cat('green') }} /> Export backups anytime</li>
            </ul>
            <span className="mt-4 inline-flex items-center gap-1.5 text-body font-medium text-blue">Continue on this device →</span>
          </button>
        </div>

        {/* Try & learn · seed a sample month so new users explore + learn by doing. */}
        <div className="rise mt-5 rounded-none border border-dashed border-line-strong p-4 text-center" style={{ animationDelay: '320ms' }}>
          <p className="mb-2 text-body text-fg-1">Just looking? <strong className="text-fg-1">Explore with sample data</strong> · see every feature first. Clear the samples out whenever you want to start your own.</p>
          <Button
            onClick={() => { replaceAll(generateDemoData()); setSettings({ storageMode: 'local', explore: true }) }}
            variant="secondary"
            className="press-3d hover:text-mauve"
          >
            Explore the demo →
          </Button>
          <p className="mt-2 text-label text-fg-2">
            Learn as you go: press <kbd className="rounded bg-ink-2 px-1">⌘K</kbd> to jump anywhere, tap the <strong>?</strong> on any page, or open <strong>Help</strong>.
            <br />Changed your mind? Reset or wipe the sample anytime in <strong>Settings → Data &amp; Cloud</strong>.
          </p>
        </div>

        <p className="rise mt-6 flex items-center justify-center gap-1.5 text-center text-label text-fg-2" style={{ animationDelay: '360ms' }}>
          <Icon as={ShieldCheck} size="sm" /> No tracking. Your data stays yours.
        </p>
      </div>
    </div>
  )
}
