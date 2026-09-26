import { CalendarBlank, Download, FileText, Upload, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useRef } from 'react'
import { useJournal } from '../../store'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { notify } from '../../lib/notify'
import { todayISO } from '../../lib/date'
import { exportJSON, exportMarkdown, importJSON } from '../../lib/storage'
import {
  collectionCsv, daysSinceBackup, devSessionsCsv, entriesCsv, habitLogCsv, habitsCsv,
  metricsCsv, parseMetricsCsv, personalRecordsCsv, pickleballCsv, recoveryCsv,
  redactSensitive, stripSyncSecrets, withChecksum, workoutsCsv, verifyChecksum,
} from '../../lib/csv'
import { completionsToICS, habitRemindersToICS, journalToICS, tasksToICS } from '../../lib/ics'
import { inlineImages } from '../../lib/imageStore'
import { Disclosure } from './shared'
import { download } from './download'

/**
 * Getting the journal out of this device, and back in.
 *
 * Export JSON / Markdown / Import are the hero row; everything narrower folds.
 * **Every calendar export is in one fold.** The events-and-birthdays `.ics`
 * used to be a fourth hero button while habit reminders, open tasks and the
 * completions feed lived in a "Calendar feeds" fold below it — one feature
 * split across two places, so the hero row's caption had to describe a quarter
 * of it and the fold's title implied the other three quarters were all there
 * was.
 */
export function BackupCard() {
  const { data, setSettings, replaceAll, setMetric } = useJournal()
  const s = data.settings
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const verifyRef = useRef<HTMLInputElement>(null)

  function onVerifyBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const r = verifyChecksum(String(reader.result))
      if (!r.ok) {
        notify.error('Integrity check failed', 'This backup looks truncated or corrupted. Do not rely on it — keep an older copy.')
      } else if (!r.stamped) {
        notify.info('No checksum in this file', 'An older or plain export. It looks readable, but can’t be verified.')
      } else {
        notify.success('Integrity check passed', 'This backup is intact.')
      }
    }
    reader.readAsText(file)
    if (verifyRef.current) verifyRef.current.value = ''
  }

  function onMetricsCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseMetricsCsv(String(reader.result))
      rows.forEach((r) => setMetric(r.date, r.patch))
      notify.success(`Imported metrics for ${rows.length} day${rows.length === 1 ? '' : 's'}`)
    }
    reader.readAsText(file)
    if (csvRef.current) csvRef.current.value = ''
  }

  async function doExport() {
    // Inline IndexedDB-stored photos so the backup is self-contained, then strip
    // device-/account-specific sync secrets so the file is safe to share/move.
    const full = await inlineImages(data)
    download(`cadence-backup-${todayISO()}.json`, exportJSON(stripSyncSecrets(full)))
    setSettings({ lastBackup: todayISO() })
  }

  async function doRedactedExport() {
    // Privacy-safe share copy (BUJO-308): inline photos, strip sync secrets, then
    // redact the sensitive domains (Recovery, Cycle) and free-text entry bodies.
    const full = await inlineImages(data)
    download(`cadence-shared-${todayISO()}.json`, exportJSON(redactSensitive(stripSyncSecrets(full))))
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceAll(importJSON(String(reader.result)), { stamp: true })
        notify.success('Backup imported')
      } catch {
        notify.error('Could not read that file', 'Is it a valid bujo backup?')
      }
    }
    reader.readAsText(file)
  }


  return (
      <Card band title="Backup & data" subtitle="Back it up regularly">
        {(() => {
          const stale = daysSinceBackup(s.lastBackup, todayISO())
          if (stale == null) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
                <Icon as={Warning} size="sm" /> You haven't backed up yet. Browsers can clear local storage · export a copy.
              </p>
            )
          }
          if (stale >= 7) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
                <Icon as={Warning} size="sm" /> Not backed up in {stale} day{stale === 1 ? '' : 's'} · export a fresh copy to be safe.
              </p>
            )
          }
          return null
        })()}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={doExport} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export JSON</Button>
          <Button variant="secondary" onClick={() => download(`cadence-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')} className="inline-flex items-center gap-1.5"><Icon as={FileText} size="sm" /> Export Markdown</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        <p className="mt-1.5 text-label text-fg-2">JSON backups omit your sync tokens so the file is safe to share.</p>
        <div className="mt-2">
          <Button variant="secondary" onClick={doRedactedExport} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export shareable (redacted) JSON</Button>
          <p className="mt-1 text-label text-fg-2">A privacy-safe copy that omits Recovery &amp; Cycle data and blanks your entry text — for handing to a coach or support tool.</p>
        </div>
        {s.lastBackup && <p className="mt-2 text-label text-fg-2">Last backup: {s.lastBackup}</p>}
        {/* SET-2: power-user exports fold away so Export/Import JSON stays the hero. */}
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <Disclosure title="Export for spreadsheets (CSV)" subtitle="one file per section" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => download(`cadence-entries-${todayISO()}.csv`, entriesCsv(data), 'text/csv')}>Entries</Button>
              <Button variant="secondary" onClick={() => download(`cadence-habits-${todayISO()}.csv`, habitsCsv(data), 'text/csv')}>Habits</Button>
              <Button variant="secondary" onClick={() => download(`cadence-habit-log-${todayISO()}.csv`, habitLogCsv(data), 'text/csv')}>Habit log</Button>
              <Button variant="secondary" onClick={() => download(`cadence-metrics-${todayISO()}.csv`, metricsCsv(data), 'text/csv')}>Metrics</Button>
              <Button variant="secondary" onClick={() => download(`cadence-workouts-${todayISO()}.csv`, workoutsCsv(data), 'text/csv')}>Workouts</Button>
              {(data.devSessions?.length ?? 0) > 0 && <Button variant="secondary" onClick={() => download(`cadence-focus-${todayISO()}.csv`, devSessionsCsv(data), 'text/csv')}>Focus sessions</Button>}
              <Button variant="secondary" onClick={() => download(`cadence-pickleball-${todayISO()}.csv`, pickleballCsv(data), 'text/csv')}>Pickleball</Button>
              <Button variant="secondary" onClick={() => download(`cadence-records-${todayISO()}.csv`, personalRecordsCsv(data), 'text/csv')}>PR leaderboard</Button>
              {s.nofapEnabled && <Button variant="secondary" onClick={() => download(`cadence-recovery-${todayISO()}.csv`, recoveryCsv(data), 'text/csv')}>Recovery</Button>}
            </div>
            {data.collections.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-label text-fg-2">Export one collection's entries as CSV:</p>
                <div className="flex flex-wrap gap-2">
                  {data.collections.map((c) => (
                    <Button key={c.id} variant="secondary" onClick={() => download(`cadence-collection-${c.name.replace(/[^\w-]+/g, '-').toLowerCase()}-${todayISO()}.csv`, collectionCsv(data, c.id), 'text/csv')}>
                      {c.icon} {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2">
              <Button variant="secondary" onClick={() => csvRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Import metrics CSV</Button>
              <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onMetricsCsv} className="hidden" />
            </div>
          </Disclosure>
          {/* Four .ics exports, in one fold. The events-and-birthdays one used
              to sit up beside Export JSON as a fourth hero button while its
              three siblings lived down here — so "does this app do calendar"
              had two different answers depending on which half you found, and
              the sentence under the hero row had to explain a feature whose
              other three quarters were three folds away. */}
          <Disclosure title="Calendar feeds (.ics)" subtitle="events, habits, tasks & wins in any calendar" defaultOpen={false}>
            <div className="space-y-2">
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-calendar-${todayISO()}.ics`, journalToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Events &amp; birthdays (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Every dated event and birthday in the journal, as one calendar file.</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-habit-reminders-${todayISO()}.ics`, habitRemindersToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Habit reminders (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Adds each active habit to your calendar as a recurring reminder at {s.reminderTime || '09:00'}.</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-tasks-${todayISO()}.ics`, tasksToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Open tasks (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Puts your open, dated to-dos on the calendar as all-day deadlines.</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-completions-${todayISO()}.ics`, completionsToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Completions feed (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Every completed habit and logged workout as an all-day “✓” event — see your wins in any external calendar.</p>
              </div>
            </div>
          </Disclosure>
          <Disclosure title="Backup integrity" subtitle="checksum & verify a file" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={async () => { const full = await inlineImages(data); download(`cadence-verified-${todayISO()}.json.txt`, withChecksum(exportJSON(stripSyncSecrets(full)))) }} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export checksummed backup</Button>
              <Button variant="secondary" onClick={() => verifyRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Verify a backup file</Button>
              <input ref={verifyRef} type="file" accept=".txt,.json,application/json,text/plain" onChange={onVerifyBackup} className="hidden" />
            </div>
            <p className="mt-1 text-label text-fg-2">Stamps an export with a checksum so you can later confirm the file wasn’t truncated or corrupted in storage. Verify reports intact / corrupted without changing your data.</p>
          </Disclosure>
          <p className="text-label text-fg-2">Or open any view and <button onClick={() => window.print()} className="text-mauve hover:underline">print / save as PDF</button> · the app chrome is hidden automatically.</p>
        </div>
      </Card>
  )
}
