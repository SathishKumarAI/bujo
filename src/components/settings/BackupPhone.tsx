import { CalendarBlank, Download, FileText, ShieldCheck, Upload } from '@/components/icons'
import { todayISO } from '../../lib/date'
import { daysSinceBackup } from '../../lib/csv'
import { Cell, Cells } from '../ui/cells'
import { InfoCell } from '../ui/infoCell'
import { useBackup } from './useBackup'

/**
 * SETTINGS › DATA › BACKUP ON A PHONE — iOS rows instead of a card of buttons.
 *
 * OWNS: the phone drawing. The three everyday actions are rows; the narrower
 * exports (spreadsheets, calendar feeds, integrity) are each one row opening a
 * sheet of rows.
 * DOES NOT OWN: any handler or which exports exist — `useBackup.ts`, shared
 * with the desktop card, so an export cannot reach one drawing and not the
 * other. The hidden file inputs live here, outside the sheets, because a
 * sheet's content unmounts when it closes and the picker's change event
 * arrives after that.
 */
export function BackupPhone() {
  const {
    s, fileRef, csvRef, verifyRef,
    onVerifyBackup, onMetricsCsv, onImport, doExport, doRedactedExport, doChecksummed, doMarkdown,
    csvExports, collectionExports, icsExports,
  } = useBackup()
  const stale = daysSinceBackup(s.lastBackup, todayISO())

  return (
    <Cells title="Backup" aside={s.lastBackup ? `last ${s.lastBackup}` : undefined}>
      {stale == null && <p className="cell text-label text-fg-1" role="note">Not backed up yet — browsers can clear local storage</p>}
      {stale != null && stale >= 7 && <p className="cell text-label text-fg-1" role="note">Not backed up in {stale} day{stale === 1 ? '' : 's'}</p>}
      <Cell icon={Download} tone="green" title="Export JSON" subtitle="Leaves out your sync tokens" chevron={false} onPress={doExport} />
      <Cell icon={FileText} tone="blue" title="Export Markdown" chevron={false} onPress={doMarkdown} />
      <Cell icon={Upload} tone="peach" title="Import JSON" subtitle="Replaces this journal with the file" chevron={false} onPress={() => fileRef.current?.click()} />
      <Cell icon={ShieldCheck} tone="teal" title="Export shareable copy" subtitle="No Recovery or Cycle · entry text blanked" chevron={false} onPress={doRedactedExport} />

      <InfoCell title="Spreadsheets (CSV)" subtitle="One file per section" icon={FileText} tone="green">
        <Cells title="Sections">
          {csvExports.map((x) => <Cell key={x.label} icon={Download} tone="green" title={x.label} chevron={false} onPress={x.run} />)}
        </Cells>
        {collectionExports.length > 0 && (
          <Cells title="Collections">
            {collectionExports.map((c) => <Cell key={c.key} title={c.label} chevron={false} onPress={c.run} />)}
          </Cells>
        )}
        <Cells>
          <Cell icon={Upload} tone="peach" title="Import metrics CSV" chevron={false} onPress={() => csvRef.current?.click()} />
        </Cells>
      </InfoCell>
      <InfoCell title="Calendar feeds (.ics)" subtitle="Events, habits, tasks & wins" icon={CalendarBlank} tone="red">
        <Cells>
          {icsExports.map((x) => <Cell key={x.label} icon={CalendarBlank} tone="red" title={x.label} subtitle={x.detail} chevron={false} onPress={x.run} />)}
        </Cells>
      </InfoCell>
      <InfoCell title="Backup integrity" subtitle="Checksum & verify a file" icon={ShieldCheck} tone="teal"
        points={['A checksum proves a file was not truncated or corrupted', 'Verifying never changes your data']}>
        <Cells>
          <Cell icon={Download} tone="teal" title="Export checksummed backup" chevron={false} onPress={doChecksummed} />
          <Cell icon={Upload} tone="peach" title="Verify a backup file" chevron={false} onPress={() => verifyRef.current?.click()} />
        </Cells>
      </InfoCell>

      <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onMetricsCsv} className="hidden" />
      <input ref={verifyRef} type="file" accept=".txt,.json,application/json,text/plain" onChange={onVerifyBackup} className="hidden" />
    </Cells>
  )
}
