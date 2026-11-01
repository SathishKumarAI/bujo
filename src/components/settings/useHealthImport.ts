import { useRef, useState } from 'react'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { notify } from '../../lib/notify'
import { todayISO } from '../../lib/date'
import { exportJSON } from '../../lib/storage'
import { stripSyncSecrets } from '../../lib/csv'
import { readHealthExport, type HealthReadResult } from '../../lib/health/parse'
import { plan, type ImportPlan } from '../../lib/ingest/plan'
import { validateRecords } from '../../lib/ingest/validate'
import { download } from './download'

export type Stage =
  | { at: 'idle' }
  | { at: 'reading'; pct: number | null; records: number }
  | { at: 'ready'; read: HealthReadResult; plan: ImportPlan; takeTheirs: boolean; rejected: number }

/**
 * THE APPLE HEALTH IMPORT, for both drawings — read a file, plan the merge,
 * apply it as one undoable step.
 *
 * OWNS: the stage machine and every handler, moved out of `AppleHealthCard.tsx`
 * unchanged so the phone rows (`AppleHealthPhone.tsx`) run the same import.
 * DOES NOT OWN: parsing (`lib/health`) or merge rules (`lib/ingest`), and no
 * markup. **Nothing is written until `apply`**, which confirms first and names
 * how many values change and how many replace something already there.
 */
export function useHealthImport() {
  const confirm = useConfirm()
  const { data, replaceAll, undo } = useJournal()
  const [stage, setStage] = useState<Stage>({ at: 'idle' })
  const [useBodyTemp, setUseBodyTemp] = useState(false)
  const s = data.settings

  async function build(file: File, takeTheirs: boolean, bodyTemp: boolean) {
    setStage({ at: 'reading', pct: null, records: 0 })
    try {
      const read = await readHealthExport(
        file,
        { useBodyTemperature: bodyTemp, cycleEnabled: s.cycleTrackerEnabled },
        (p) => setStage({ at: 'reading', pct: p.total ? Math.min(99, Math.round((p.bytes / p.total) * 100)) : null, records: p.records }),
      )
      const { records, rejected } = validateRecords(read.records)
      if (records.length === 0) {
        notify.error(
          'Nothing in that file could be imported',
          read.summary.samples === 0
            ? 'No health records were found in it — is it the right file?'
            : `${read.summary.samples.toLocaleString()} records were read, but none of them map to anything this app tracks.`,
        )
        setStage({ at: 'idle' })
        return
      }
      const p = await plan(records, data, {
        source: 'apple-health',
        takeTheirs,
        weightUnit: s.weightUnit === 'lb' ? 'lb' : 'kg',
        tempUnit: s.tempUnit === 'C' ? 'C' : 'F',
      })
      setStage({ at: 'ready', read, plan: p, takeTheirs, rejected: rejected.length })
    } catch (e) {
      // The reader's messages are written to be shown. A stack trace here would
      // be the only feedback a user gets about a 400 MB file that took a minute.
      notify.error('Could not read that export', e instanceof Error ? e.message : String(e))
      setStage({ at: 'idle' })
    }
  }

  /** Kept on the card so "take theirs" can re-plan without re-reading 800 MB. */
  const lastFile = useRef<File | null>(null)

  function pick(file: File | undefined) {
    if (!file) return
    lastFile.current = file
    void build(file, false, useBodyTemp)
  }

  function takeTheirs() {
    if (lastFile.current) void build(lastFile.current, true, useBodyTemp)
  }

  async function doExport() {
    download(`cadence-backup-${todayISO()}.json`, exportJSON(stripSyncSecrets(data)))
  }

  async function apply() {
    if (stage.at !== 'ready') return
    const { counts } = stage.plan
    const changing = counts.added + counts.updated
    const ok = await confirm({
      title: `Import ${changing.toLocaleString()} value${changing === 1 ? '' : 's'} from Apple Health?`,
      description: counts.updated > 0
        ? `${counts.updated.toLocaleString()} will replace something already in your journal. You can undo this, but a backup is the safer answer.`
        : 'Nothing already in your journal will be replaced. You can undo this.',
      confirmLabel: 'Import',
      destructive: counts.updated > 0,
      onBackup: doExport,
    })
    if (!ok) return
    // One dispatch. `stamp: true` re-dates the journal so a fresh import beats a
    // stale remote on the next sync, and `'set'` routes through `commit()`, so
    // this is exactly ONE undo step no matter how many records it carried.
    replaceAll(stage.plan.next, { stamp: true })
    setStage({ at: 'idle' })
    notify.undo(`Imported ${changing.toLocaleString()} value${changing === 1 ? '' : 's'} from Apple Health`, undo)
  }

  const cancel = () => setStage({ at: 'idle' })

  return { stage, useBodyTemp, setUseBodyTemp, pick, takeTheirs, apply, cancel }
}
