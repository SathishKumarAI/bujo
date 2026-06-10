import { useState } from 'react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input } from '../components/ui'
import { MONTHS, todayISO } from '../lib/date'
import { cat } from '../lib/colors'

export function Collections() {
  const { data, addBirthday, removeBirthday } = useJournal()
  const [name, setName] = useState('')
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)

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
    </div>
  )
}
