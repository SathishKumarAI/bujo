import { useRef } from 'react'
import { useJournal } from '../../store'
import { notify } from '../../lib/notify'
import { todayISO } from '../../lib/date'
import { exportJSON, exportMarkdown, importJSON } from '../../lib/storage'
import {
  collectionCsv, devSessionsCsv, entriesCsv, habitLogCsv, habitsCsv,
  metricsCsv, parseMetricsCsv, personalRecordsCsv, pickleballCsv, recoveryCsv,
  redactSensitive, stripSyncSecrets, withChecksum, workoutsCsv, verifyChecksum,
} from '../../lib/csv'
import { completionsToICS, habitRemindersToICS, journalToICS, tasksToICS } from '../../lib/ics'
import { inlineImages } from '../../lib/imageStore'
import { download } from './download'

/**
 * EVERYTHING THE BACKUP CARD DOES — exports, imports, the integrity check —
 * for both of its drawings.
 *
 * OWNS: the handlers, the three hidden file inputs' refs, and the two export
 * LISTS (CSV per section, `.ics` per feed), so the desktop buttons and the
 * phone rows cannot disagree about which exports exist.
 * DOES NOT OWN: markup. Desktop is `BackupCard.tsx`, phone `BackupPhone.tsx`.
 *
 * An export added here appears in both drawings; one added in either file's
 * JSX appears in only that one.
 */
export function useBackup() {
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

  async function doChecksummed() {
    const full = await inlineImages(data)
    download(`cadence-verified-${todayISO()}.json.txt`, withChecksum(exportJSON(stripSyncSecrets(full))))
  }

  const doMarkdown = () => download(`cadence-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceAll(importJSON(String(reader.result)), { stamp: true })
        notify.success('Backup imported')
      } catch {
        notify.error('Could not read that file', 'Is it a valid Cadence backup?')
      }
    }
    reader.readAsText(file)
  }

  // Bodies are built on the tap, not on every render.
  const csv = (name: string, body: () => string) => () => download(`cadence-${name}-${todayISO()}.csv`, body(), 'text/csv')
  /** One file per section; two only when the journal has that section. */
  const csvExports: { label: string; run: () => void }[] = [
    { label: 'Entries', run: csv('entries', () => entriesCsv(data)) },
    { label: 'Habits', run: csv('habits', () => habitsCsv(data)) },
    { label: 'Habit log', run: csv('habit-log', () => habitLogCsv(data)) },
    { label: 'Metrics', run: csv('metrics', () => metricsCsv(data)) },
    { label: 'Workouts', run: csv('workouts', () => workoutsCsv(data)) },
    ...((data.devSessions?.length ?? 0) > 0 ? [{ label: 'Focus sessions', run: csv('focus', () => devSessionsCsv(data)) }] : []),
    { label: 'Pickleball', run: csv('pickleball', () => pickleballCsv(data)) },
    { label: 'PR leaderboard', run: csv('records', () => personalRecordsCsv(data)) },
    ...(s.nofapEnabled ? [{ label: 'Recovery', run: csv('recovery', () => recoveryCsv(data)) }] : []),
  ]
  const collectionExports = data.collections.map((c) => ({
    key: c.id,
    label: `${c.icon} ${c.name}`,
    run: () => download(`cadence-collection-${c.name.replace(/[^\w-]+/g, '-').toLowerCase()}-${todayISO()}.csv`, collectionCsv(data, c.id), 'text/csv'),
  }))
  const ics = (name: string, body: () => string) => () => download(`cadence-${name}-${todayISO()}.ics`, body(), 'text/calendar')
  const icsExports: { label: string; detail: string; run: () => void }[] = [
    { label: 'Events & birthdays (.ics)', detail: 'Every dated event and birthday in the journal, as one calendar file.', run: ics('calendar', () => journalToICS(data)) },
    { label: 'Habit reminders (.ics)', detail: `Adds each active habit to your calendar as a recurring reminder at ${s.reminderTime || '09:00'}.`, run: ics('habit-reminders', () => habitRemindersToICS(data)) },
    { label: 'Open tasks (.ics)', detail: 'Puts your open, dated to-dos on the calendar as all-day deadlines.', run: ics('tasks', () => tasksToICS(data)) },
    { label: 'Completions feed (.ics)', detail: 'Every completed habit and logged workout as an all-day “✓” event — see your wins in any external calendar.', run: ics('completions', () => completionsToICS(data)) },
  ]

  return {
    data, s, fileRef, csvRef, verifyRef,
    onVerifyBackup, onMetricsCsv, onImport, doExport, doRedactedExport, doChecksummed, doMarkdown,
    csvExports, collectionExports, icsExports,
  }
}
