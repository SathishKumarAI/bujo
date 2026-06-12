import { useRef, useState } from 'react'
import { useJournal } from '../store'
import { CalendarPlus } from 'lucide-react'
import { Button, Card, Empty, Input } from '../components/ui'
import { cat } from '../lib/colors'
import { addDays, prettyDay, todayISO, WEEKDAYS } from '../lib/date'
import { parseICS } from '../lib/ics'
import type { BulletType } from '../lib/types'

export function Plan() {
  const { data, addRecurrence, updateRecurrence, removeRecurrence, migrateEntry, dropEntry, bulkAddEvents } = useJournal()
  const today = todayISO()
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Recurring rule form ──
  const [text, setText] = useState('')
  const [type, setType] = useState<BulletType>('task')
  const [freq, setFreq] = useState<'daily' | 'weekly'>('daily')
  const [weekdays, setWeekdays] = useState<number[]>([1, 3, 5])

  function addRule() {
    if (!text.trim()) return
    addRecurrence({ text: text.trim(), type, important: false, freq, weekdays, startedOn: today })
    setText('')
  }

  // ── Migration: open tasks dated before today ──
  const overdue = data.entries
    .filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date < today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // ── ICS import ──
  function onIcs(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const events = parseICS(String(reader.result))
      const added = bulkAddEvents(events)
      alert(`Imported ${added} event${added === 1 ? '' : 's'} from the calendar.`)
    }
    reader.readAsText(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-[1400px] columns-1 gap-5 lg:columns-2 [&>*]:mb-5 [&>*]:break-inside-avoid">
      <Card title="Migration" subtitle="Review overdue open tasks — the heart of bullet journaling">
        {overdue.length === 0 ? (
          <Empty>Nothing overdue. You're on top of it. 🎉</Empty>
        ) : (
          <ul className="space-y-2">
            {overdue.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-surface0 bg-base p-2 text-sm">
                <span className="text-overlay0">{prettyDay(e.date)}</span>
                <span className="flex-1 text-text">· {e.text}</span>
                <Button onClick={() => migrateEntry(e.id, today)} title="Move to today">→ Today</Button>
                <Button onClick={() => migrateEntry(e.id, addDays(today, 1))} title="Move to tomorrow">→ Tomorrow</Button>
                <Button variant="danger" onClick={() => dropEntry(e.id)} title="Drop it">drop</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recurring tasks & events" subtitle="Auto-added to each day they apply">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Take vitamins" className="max-w-xs" />
          <select value={type} onChange={(e) => setType(e.target.value as BulletType)} className="rounded-lg border border-surface1 bg-base px-2 py-2 text-sm text-text">
            <option value="task">task</option>
            <option value="event">event</option>
            <option value="note">note</option>
          </select>
          <select value={freq} onChange={(e) => setFreq(e.target.value as 'daily' | 'weekly')} className="rounded-lg border border-surface1 bg-base px-2 py-2 text-sm text-text">
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
          </select>
          <Button variant="primary" onClick={addRule}>Add rule</Button>
        </div>
        {freq === 'weekly' && (
          <div className="mt-2 flex gap-1">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                onClick={() => setWeekdays((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]))}
                className="rounded px-2 py-1 text-xs"
                style={{ background: weekdays.includes(i) ? cat('mauve') : cat('surface0'), color: weekdays.includes(i) ? cat('crust') : cat('subtext0') }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 border-t border-surface0 pt-3">
          {data.recurrences.length === 0 ? (
            <Empty>No recurring rules yet.</Empty>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.recurrences.map((r) => (
                <li key={r.id} className="group flex items-center justify-between">
                  <span className="text-subtext1">
                    {r.type === 'event' ? '○' : r.type === 'note' ? '–' : '·'} {r.text}
                    <span className="ml-2 text-overlay0">
                      {r.freq === 'daily' ? 'every day' : r.weekdays.map((d) => WEEKDAYS[d]).join(' ')}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => { const t = prompt('Edit recurring task (updates every future occurrence):', r.text); if (t && t.trim()) updateRecurrence(r.id, { text: t.trim() }) }}
                      aria-label="Edit rule"
                      className="text-overlay0 hover:text-mauve"
                    >✎</button>
                    <button onClick={() => removeRecurrence(r.id)} aria-label="Remove rule" className="text-overlay0 hover:text-red">×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card title="Import calendar (.ics)" subtitle="Bring events from Google/Apple Calendar onto your monthly">
        <Button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><CalendarPlus size={15} /> Choose .ics file</Button>
        <input ref={fileRef} type="file" accept=".ics,text/calendar" onChange={onIcs} className="hidden" />
        <p className="mt-2 text-xs text-overlay0">Events appear as dots on the Monthly calendar. Duplicates are skipped.</p>
      </Card>
    </div>
  )
}
