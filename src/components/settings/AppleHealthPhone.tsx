import { Check, Info, Upload, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { describeSummary } from '../../lib/health/parse'
import { cat, onAccent } from '../../lib/colors'
import { Cell, Cells, ToggleCell } from '../ui/cells'
import { InfoCell } from '../ui/infoCell'
import { READS } from './appleHealthReads'
import { useHealthImport } from './useHealthImport'

/**
 * SETTINGS › DATA › APPLE HEALTH ON A PHONE — iOS rows, one stage at a time.
 *
 * OWNS: the phone drawing of the three stages — pick a file, reading, the
 * preview with Import and Cancel.
 * DOES NOT OWN: the import — `useHealthImport.ts`, the same hook the desktop
 * card runs, so the confirm before anything is written (naming how many
 * values change and how many replace yours) is the same on both.
 *
 * The file row is a `<label>` wrapping the real file input, as the desktop
 * drop zone is: the row is the control, so it is named and reachable.
 */
export function AppleHealthPhone() {
  const { stage, useBodyTemp, setUseBodyTemp, pick, takeTheirs, apply, cancel } = useHealthImport()

  if (stage.at === 'reading') return (
    <Cells title="Apple Health">
      <div className="cell cell-stack gap-2" aria-live="polite">
        <span className="text-body text-fg-1">Reading… {stage.records.toLocaleString()} records{stage.pct != null ? ` · ${stage.pct}%` : ''}</span>
        <progress className="h-2 w-full" value={stage.pct ?? undefined} max={100} aria-label="Reading the Health export" />
        <span className="text-label text-fg-2">Nothing is written yet — all on this device</span>
      </div>
    </Cells>
  )

  if (stage.at === 'ready') {
    const { counts, dateRange, conflicts } = stage.plan
    return (
      <Cells title="Apple Health" aside={dateRange ? `${dateRange.from} → ${dateRange.to}` : undefined}>
        <Cell title="New values" trail={counts.added.toLocaleString()} />
        <Cell title="Already in your journal" trail={counts.unchanged.toLocaleString()} />
        {counts.updated > 0 && <Cell title="Replaced" trail={counts.updated.toLocaleString()} />}
        {stage.rejected > 0 && <Cell title="Skipped" trail={stage.rejected.toLocaleString()} />}
        {counts.conflicts > 0 && (
          <InfoCell title={`${counts.conflicts.toLocaleString()} kept yours`} subtitle="They disagree with something you typed">
            <Cells>
              {conflicts.slice(0, 20).map((c, i) => (
                <Cell key={`${c.date}-${c.field}-${i}`} title={`${c.date} ${c.field}`} subtitle={`yours ${String(c.mine)} · Apple ${String(c.theirs)}`} />
              ))}
            </Cells>
            {conflicts.length > 20 && <p className="text-label text-fg-2">…and {(conflicts.length - 20).toLocaleString()} more</p>}
            <Cells>
              <button type="button" className="cell cell-action" onClick={takeTheirs}>Use Apple’s values instead</button>
            </Cells>
          </InfoCell>
        )}
        <InfoCell title="What was found" points={[
          ...Object.entries(stage.read.summary.byField).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} · ${n.toLocaleString()} days`),
          ...describeSummary(stage.read.summary, stage.read.info),
        ]} />
        <Cell icon={Check} tone="green" chevron={false} onPress={apply}
          title={`Import ${(counts.added + counts.updated).toLocaleString()}${stage.rejected > 0 ? ` · skip ${stage.rejected.toLocaleString()}` : ''}`}
          subtitle="Asks first · one undo step" />
        <Cell icon={X} tone="overlay1" title="Cancel" chevron={false} onPress={cancel} />
      </Cells>
    )
  }

  return (
    <Cells title="Apple Health" aside="read on this device">
      <label className="cell cursor-pointer">
        <span className="cell-tile" style={{ background: cat('green'), color: onAccent(cat('green')) }}><Icon as={Upload} size="sm" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-fg-1">Choose export.zip</span>
          <span className="block text-label text-fg-2">Health → your picture → Export All Health Data</span>
        </span>
        <input type="file" accept=".zip,.xml,application/zip,text/xml" className="sr-only"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      </label>
      <ToggleCell title="Also use general body temperature" subtitle="Only on days with no BBT reading" on={useBodyTemp} onChange={setUseBodyTemp} />
      <InfoCell title="What gets read" icon={Info} points={[
        'The file is never uploaded — it is read on this device',
        'Imported values join your journal, and travel on any sync you turned on',
        'Ignored: GPS routes, clinical records, heart-rate samples, sleep stages',
        'A large export works better on a computer than on a phone',
      ]}>
        <Cells>
          {READS.map((r) => <Cell key={r.key} icon={r.icon} tone="teal" title={r.text} />)}
        </Cells>
      </InfoCell>
    </Cells>
  )
}
