import { CalendarBlank, Download, FileText, Upload, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { Button } from '../ui/button'
import { todayISO } from '../../lib/date'
import { daysSinceBackup } from '../../lib/csv'
import { Disclosure } from './shared'
import { useBackup } from './useBackup'
import { useDevice } from '../shell/device'
import { BackupPhone } from './BackupPhone'

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
 *
 * Every handler and both export lists are `useBackup.ts`; a phone draws the
 * same through `BackupPhone.tsx`.
 */
export function BackupCard() {
  const phone = useDevice() === 'mobile'
  return phone ? <BackupPhone /> : <BackupDesktop />
}

function BackupDesktop() {
  const {
    data, s, fileRef, csvRef, verifyRef,
    onVerifyBackup, onMetricsCsv, onImport, doExport, doRedactedExport, doChecksummed, doMarkdown,
    csvExports, collectionExports, icsExports,
  } = useBackup()

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
          <Button variant="secondary" onClick={doMarkdown} className="inline-flex items-center gap-1.5"><Icon as={FileText} size="sm" /> Export Markdown</Button>
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
              {csvExports.map((x) => <Button key={x.label} variant="secondary" onClick={x.run}>{x.label}</Button>)}
            </div>
            {data.collections.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-label text-fg-2">Export one collection's entries as CSV:</p>
                <div className="flex flex-wrap gap-2">
                  {collectionExports.map((c) => (
                    <Button key={c.key} variant="secondary" onClick={c.run}>
                      {c.label}
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
              {icsExports.map((x) => (
                <div key={x.label}>
                  <Button variant="secondary" onClick={x.run} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> {x.label}</Button>
                  <p className="mt-1 text-label text-fg-2">{x.detail}</p>
                </div>
              ))}
            </div>
          </Disclosure>
          <Disclosure title="Backup integrity" subtitle="checksum & verify a file" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={doChecksummed} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export checksummed backup</Button>
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
