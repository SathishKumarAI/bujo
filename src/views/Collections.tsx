import { useState } from 'react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { EntryRow } from '../components/EntryRow'
import { MONTHS, todayISO } from '../lib/date'
import { cat } from '../lib/colors'

export function Collections() {
  const { data, addBirthday, removeBirthday, addCollection, removeCollection, addEntry } = useJournal()
  const [name, setName] = useState('')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  // Custom collections.
  const [colName, setColName] = useState('')
  const [colIcon, setColIcon] = useState('📚')
  const [openCol, setOpenCol] = useState<string | null>(null)
  const [colEntry, setColEntry] = useState('')

  // Future log = events/tasks dated after today.
  const today = todayISO()
  const future = data.entries
    .filter((e) => e.date > today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const birthdays = [...data.birthdays].sort((a, b) => a.month - b.month || a.day - b.day)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Future log" subtitle="Tasks & events dated ahead of today">
        {future.length === 0 ? (
          <Empty>Nothing scheduled. Add a future-dated entry from any day.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {future.map((e) => (
              <li key={e.id} className="flex gap-2">
                <span className="w-24 shrink-0 text-overlay0">{e.date}</span>
                <span className="text-subtext1">
                  {e.type === 'event' ? '○' : '·'} {e.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Birthdays" subtitle="Never miss one">
        <div className="mb-3 flex flex-wrap gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="max-w-[40%]" />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-surface1 bg-base px-2 text-sm text-text">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
          </select>
          <input type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-16 rounded-lg border border-surface1 bg-base px-2 text-sm text-text" aria-label="Day" />
          <Button variant="primary" onClick={() => { if (name.trim()) { addBirthday({ name: name.trim(), month, day }); setName('') } }}>Add</Button>
        </div>
        {birthdays.length === 0 ? (
          <Empty>No birthdays yet.</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {birthdays.map((b) => (
              <li key={b.id} className="group flex items-center justify-between">
                <span className="text-subtext1">
                  <span style={{ color: cat('pink') }}>🎂</span> {b.name}
                  <span className="ml-2 text-overlay0">{MONTHS[b.month - 1].slice(0, 3)} {b.day}</span>
                </span>
                <button onClick={() => removeBirthday(b.id)} aria-label={`Remove ${b.name}`} className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Custom collections"
        subtitle="Free-form pages — book lists, packing, projects…"
        className="md:col-span-2"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={colIcon}
            onChange={(e) => setColIcon(e.target.value.slice(0, 2))}
            aria-label="Collection icon"
            className="w-12 rounded-lg border border-surface1 bg-base px-2 text-center text-lg text-text"
          />
          <Input value={colName} onChange={(e) => setColName(e.target.value)} placeholder="Collection name" className="max-w-xs" />
          <Button variant="primary" onClick={() => { if (colName.trim()) { addCollection(colName.trim(), colIcon || '📄'); setColName('') } }}>
            New collection
          </Button>
        </div>

        {data.collections.length === 0 ? (
          <Empty>No collections yet. Create one above.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.collections.map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenCol(openCol === c.id ? null : c.id)}
                className="group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: openCol === c.id ? cat('mauve') : cat('surface1'), color: cat('subtext1') }}
              >
                <span>{c.icon}</span> {c.name}
                <span
                  onClick={(e) => { e.stopPropagation(); removeCollection(c.id); if (openCol === c.id) setOpenCol(null) }}
                  className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"
                >×</span>
              </button>
            ))}
          </div>
        )}

        {openCol && (
          <div className="mt-4 border-t border-surface0 pt-3">
            <form
              className="mb-2 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (colEntry.trim()) { addEntry(todayISO(), colEntry, openCol); setColEntry('') } }}
            >
              <Input value={colEntry} onChange={(e) => setColEntry(e.target.value)} placeholder="Add to this collection… (t/e/n)" />
              <Button type="submit" variant="primary">Add</Button>
            </form>
            <ul>
              {data.entries.filter((e) => e.collection === openCol).map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
            {data.entries.filter((e) => e.collection === openCol).length === 0 && (
              <Empty>Empty — add your first item above.</Empty>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
