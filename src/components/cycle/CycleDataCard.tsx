import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui'
import { useJournal } from '../../store'
import { dayDiff, todayISO } from '../../lib/date'
import {
  applyBackup, buildBackup, checkBackup, type BackupCheck,
} from '../../lib/cyclePrivacy'

/**
 * YOUR CYCLE DATA · export, import, delete. The other half of "it stays here".
 *
 * Telling someone their data is local-only creates an obligation to give them a
 * way to carry it, and a page that only *warns* about loss is worse than one
 * that never promised anything. So this card is the disclaimer's counterpart,
 * not an extra.
 *
 * Three deliberate choices:
 *
 * - **Import previews before it writes.** Counts first ("3 cycles, 84 days"),
 *   then Replace or Merge as an explicit choice. A restore that silently
 *   overwrote today's entry would be the one bug this whole area cannot afford.
 * - **Delete is two-step**, and the second step is not a generic "Are you
 *   sure" — it names what goes.
 * - **The backup age is stated, not nagged.** Over 30 days shows a quiet line
 *   in the body colour, not the accent: this is information, and an alarm the
 *   user cannot silence is one they learn to ignore.
 */
export function CycleDataCard() {
  const { data, setSettings, replaceAll } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<BackupCheck | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const last = data.settings.cycleLastBackup
  // `dayDiff` over ISO days rather than `Date.now()`: calling the clock during
  // render is an impure read (eslint react-hooks flags it), and this number
  // only ever needs day resolution anyway.
  const daysSince = last ? dayDiff(last.slice(0, 10), todayISO()) : null
  const stale = daysSince == null || daysSince > 30

  function exportBackup() {
    try {
      const backup = buildBackup(data)
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bujo-cycle-backup-${todayISO()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSettings({ cycleLastBackup: new Date().toISOString() })
      setMsg(`Exported ${backup.cycle.length} days.`)
    } catch {
      // Storage or download blocked (private mode, a locked-down browser).
      setMsg('Could not write the file. Your browser may be blocking downloads.')
    }
  }

  async function pickFile(file: File) {
    setMsg(null)
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const check = checkBackup(parsed)
      if (!check.ok) { setMsg(check.problem ?? 'That file could not be read.'); return }
      setPending(check)
    } catch {
      setMsg('That file is not readable JSON.')
    }
  }

  function doImport(mode: 'replace' | 'merge') {
    if (!pending?.backup) return
    const next = applyBackup(data.cycle ?? [], pending.backup, mode)
    replaceAll({ ...data, cycle: next })
    setMsg(`${mode === 'replace' ? 'Replaced' : 'Merged'} — ${next.length} days now logged.`)
    setPending(null)
  }

  function doDelete() {
    replaceAll({
      ...data,
      cycle: [],
      // Clearing the acknowledgement returns the user to the first-run screen,
      // which is the honest end state: they have opted out of the whole feature.
      settings: { ...data.settings, cycleDisclaimerAck: undefined, cycleLastBackup: undefined },
    })
    setConfirmDelete(false)
    setMsg(null)
  }

  return (
    <Card band title="Your cycle data" subtitle="Stored on this device only" hideInfo>
      <p className="text-body text-fg-1">
        Nothing here is uploaded. That also means nothing here can be recovered for you — a backup
        file is the only copy that survives clearing your browser.
      </p>

      <p className="mt-3 text-label text-fg-2">
        Last backup:{' '}
        <span className={stale ? 'text-fg-1' : undefined}>
          {daysSince == null ? 'never' : daysSince === 0 ? 'today' : `${daysSince} days ago`}
        </span>
        {stale && ' — worth doing now.'}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportBackup} className="press-3d">Export backup</Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()} className="press-3d">Import backup</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose a cycle backup file to import"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickFile(f); e.target.value = '' }}
        />
      </div>

      {pending?.ok && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-body text-fg-1">
            That backup holds <strong className="font-medium">{pending.cycles} cycles, {pending.days} days</strong>
            {pending.backup?.exportedAt && ` — exported ${pending.backup.exportedAt.slice(0, 10)}`}.
          </p>
          <p className="mt-1 text-label text-fg-2">
            Merge keeps what is already on this device where the dates collide. Replace does not.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => doImport('merge')} className="press-3d">Merge</Button>
            <Button variant="ghost" onClick={() => doImport('replace')} className="press-3d">Replace everything</Button>
            <Button variant="ghost" onClick={() => setPending(null)} className="press-3d">Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-line pt-3">
        {!confirmDelete ? (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="press-3d text-fg-2">
            Delete all cycle data
          </Button>
        ) : (
          <div>
            <p className="text-body text-fg-1">
              This erases <strong className="font-medium">{(data.cycle ?? []).length} logged days</strong> from
              this device and returns you to the welcome screen. It cannot be undone, and we have no
              copy.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={doDelete} className="press-3d">Yes, delete everything</Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="press-3d">Keep it</Button>
            </div>
          </div>
        )}
      </div>

      {msg && <p className="mt-3 text-label text-fg-2" role="status">{msg}</p>}
    </Card>
  )
}
