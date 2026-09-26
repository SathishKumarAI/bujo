import { useRef, useState } from 'react'
import { CheckCircle, Footprints, Heartbeat, Moon, Scales, ShieldCheck, Thermometer, Upload, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { useConfirm } from '../ConfirmDialog'
import { Abbr } from '../Abbr'
import { notify } from '../../lib/notify'
import { todayISO } from '../../lib/date'
import { exportJSON } from '../../lib/storage'
import { stripSyncSecrets } from '../../lib/csv'
import { describeSummary, readHealthExport, type HealthReadResult } from '../../lib/health/parse'
import { plan, type ImportPlan } from '../../lib/ingest/plan'
import { validateRecords } from '../../lib/ingest/validate'
import { download } from './download'

/**
 * IMPORTING FROM APPLE HEALTH · pick a file, see exactly what will change,
 * then apply it as one undoable step.
 *
 * The reader is `lib/health` and the merge is `lib/ingest`; this file is the
 * screen and nothing else. It holds no parsing and no merge rules, which is
 * deliberate — every claim it makes about the user's data is a string built by
 * `describeSummary()` or a count computed by `plan()`, both of which are unit
 * tested. A number assembled in JSX is a number nothing asserts.
 *
 * **Nothing is written until "Apply".** `plan()` returns a whole candidate
 * journal and touches no store, so a user who reads the preview and closes the
 * card has changed nothing at all, and a tab killed mid-parse leaves the journal
 * exactly as it was. The apply itself is one `replaceAll` — one `localStorage`
 * write, one undo step, whether it carries 3 records or 11,000.
 *
 * The consent copy is above the file picker rather than in a fold, and it says
 * both halves of the truth: the *file* never leaves the device, and an imported
 * value is a journal field like any other and will travel on whatever sync the
 * user has already switched on. Saying only the first would be technically true
 * about the file and misleading about the data.
 */

/**
 * What the import can fill, named for the user rather than for HealthKit.
 *
 * `BBT` goes through `<Abbr>` rather than being explained here: the glossary
 * already carries the definition, the NHS source, and the sentence that matters
 * for this screen — a reading taken after you are up is not a basal
 * temperature. Writing a second copy of that is how two explanations drift.
 */
const READS: { icon: typeof Thermometer; text: React.ReactNode; key: string }[] = [
  { key: 'bbt', icon: Thermometer, text: <><Abbr term="BBT" /> → the chart on Cycle</> },
  { key: 'steps', icon: Footprints, text: 'Steps and active energy' },
  { key: 'sleep', icon: Moon, text: 'Hours asleep, on the day you woke up' },
  { key: 'hr', icon: Heartbeat, text: 'Resting heart rate' },
  { key: 'body', icon: Scales, text: 'Weight, body fat, lean mass, waist' },
  { key: 'misc', icon: CheckCircle, text: 'Workouts, food, and period days' },
]

type Stage =
  | { at: 'idle' }
  | { at: 'reading'; pct: number | null; records: number }
  | { at: 'ready'; read: HealthReadResult; plan: ImportPlan; takeTheirs: boolean; rejected: number }

export function AppleHealthCard() {
  const confirm = useConfirm()
  const { data, replaceAll, undo } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>({ at: 'idle' })
  const [useBodyTemp, setUseBodyTemp] = useState(false)
  const [dragging, setDragging] = useState(false)

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

  return (
    <Card
      band
      title="Apple Health"
      subtitle="Drop your export in — temperature, steps, sleep and weight"
      help="Read entirely on this device. Basal body temperature fills the chart on Cycle, so you stop typing it in every morning."
    >
      {stage.at === 'idle' && (
        <div className="space-y-4">
          <p className="flex items-start gap-1.5 rounded-card border border-green/30 bg-ink-0 p-2 text-label text-fg-1">
            <span className="text-green"><Icon as={ShieldCheck} size="sm" /></span>
            <span>
              <strong>This file is read on your device. It is never uploaded.</strong>{' '}
              Imported values become part of your journal, so if you have turned on any
              sync they will travel with the rest of it, like anything you type.
            </span>
          </p>

          <div>
            <p className="mb-1.5 text-label text-fg-2">What gets read:</p>
            <ul className="space-y-1">
              {READS.map((r) => (
                <li key={r.key} className="flex items-center gap-1.5 text-label text-fg-1">
                  <span className="text-fg-2"><Icon as={r.icon} size="sm" /></span> {r.text}
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-label text-fg-2">
              Ignored: GPS routes, clinical records, heart-rate samples, sleep stages, and
              everything not listed above.
            </p>
          </div>

          {/* A real label wrapping a real file input: the drop target is the
              same control as the button, so it is keyboard-reachable and named
              without a role="button" div pretending to be one. */}
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]) }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed p-4 text-center transition-colors ${dragging ? 'border-mauve bg-ink-2' : 'border-line bg-ink-0'}`}
          >
            <span className="text-fg-2"><Icon as={Upload} size="md" /></span>
            <span className="text-body text-fg-1">Drop <code>export.zip</code> here, or choose it</span>
            <span className="text-label text-fg-2">
              On your iPhone: Health → your picture (top right) → Export All Health Data.
              A large export works better on a computer than on a phone.
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".zip,.xml,application/zip,text/xml"
              onChange={(e) => { pick(e.target.files?.[0]); if (fileRef.current) fileRef.current.value = '' }}
              className="sr-only"
            />
            <span className="text-label text-mauve underline">Choose a file</span>
          </label>

          <label className="flex items-center justify-between gap-3 text-label text-fg-1">
            <span>
              Also use general body temperature
              <span className="block text-fg-2">
                Only on days with no <Abbr term="BBT" /> reading. It is a different
                measurement, so it is off by default.
              </span>
            </span>
            <Switch checked={useBodyTemp} onCheckedChange={setUseBodyTemp} />
          </label>
        </div>
      )}

      {stage.at === 'reading' && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-body text-fg-1">
            Reading… {stage.records.toLocaleString()} records
            {stage.pct != null ? ` · ${stage.pct}%` : ''}
          </p>
          {/* A real progress element, so the figure is in the accessibility tree
              rather than only in a coloured bar. */}
          <progress
            className="h-2 w-full"
            value={stage.pct ?? undefined}
            max={100}
            aria-label="Reading the Health export"
          />
          <p className="text-label text-fg-2">
            Nothing has been written yet. This is all happening on your device.
          </p>
        </div>
      )}

      {stage.at === 'ready' && (
        <div className="space-y-4">
          <div className="space-y-1">
            {stage.plan.dateRange && (
              <p className="text-body text-fg-1">
                {stage.plan.dateRange.from} → {stage.plan.dateRange.to}
              </p>
            )}
            <p className="text-body text-fg-1">
              <strong>{stage.plan.counts.added.toLocaleString()} new</strong>
              {' · '}{stage.plan.counts.unchanged.toLocaleString()} already in your journal
              {stage.plan.counts.updated > 0 && <> · <span className="text-peach">{stage.plan.counts.updated.toLocaleString()} replaced</span></>}
              {stage.plan.counts.conflicts > 0 && <> · <span className="text-yellow">{stage.plan.counts.conflicts.toLocaleString()} kept yours</span></>}
              {stage.rejected > 0 && <> · {stage.rejected.toLocaleString()} skipped</>}
            </p>
          </div>

          {stage.plan.counts.conflicts > 0 && (
            <div className="rounded-card border border-yellow/30 bg-ink-0 p-2">
              <p className="flex items-center gap-1.5 text-label text-yellow">
                <Icon as={Warning} size="sm" />
                {stage.plan.counts.conflicts.toLocaleString()} value{stage.plan.counts.conflicts === 1 ? '' : 's'} disagree with something you typed. Yours are being kept.
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {stage.plan.conflicts.slice(0, 6).map((c, i) => (
                  <li key={`${c.date}-${c.field}-${i}`} className="text-label text-fg-2">
                    {c.date} {c.field} · yours {String(c.mine)} · Apple {String(c.theirs)}
                  </li>
                ))}
              </ul>
              {stage.plan.conflicts.length > 6 && (
                <p className="mt-1 text-label text-fg-2">…and {(stage.plan.conflicts.length - 6).toLocaleString()} more.</p>
              )}
              <Button
                variant="ghost"
                className="mt-1.5"
                onClick={() => { if (lastFile.current) void build(lastFile.current, true, useBodyTemp) }}
              >
                Use Apple's values instead
              </Button>
            </div>
          )}

          {Object.keys(stage.read.summary.byField).length > 0 && (
            <div>
              <p className="mb-1 text-label text-fg-2">Days of data found, by measurement:</p>
              <ul className="space-y-0.5">
                {Object.entries(stage.read.summary.byField).sort((a, b) => b[1] - a[1]).map(([field, n]) => (
                  <li key={field} className="text-label text-fg-1">{field} · {n.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-0.5">
            {describeSummary(stage.read.summary, stage.read.info).map((line) => (
              <li key={line} className="text-label text-fg-2">{line}</li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button onClick={apply}>
              Import {(stage.plan.counts.added + stage.plan.counts.updated).toLocaleString()}
              {stage.rejected > 0 && ` · skip ${stage.rejected.toLocaleString()}`}
            </Button>
            <Button variant="secondary" onClick={() => setStage({ at: 'idle' })}>Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
