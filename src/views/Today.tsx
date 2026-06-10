import { useState } from 'react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Button, Card, Empty, Input, Slider } from '../components/ui'
import { QuickAdd } from '../components/QuickAdd'
import { EntryRow } from '../components/EntryRow'
import { ImageUpload } from '../components/ImageUpload'
import { onThisDay } from '../lib/stats'

export function Today() {
  const { data, setMetric, setGratitude, setMemory } = useJournal()
  const [date, setDate] = useState(todayISO())

  const dayEntries = data.entries.filter((e) => e.date === date)
  const metric = data.metrics.find((m) => m.date === date)
  const gratitude = data.gratitude.find((g) => g.date === date)?.text ?? ''
  const memoryRec = data.memories.find((m) => m.date === date)
  const memory = memoryRec?.text ?? ''
  const flashbacks = onThisDay(data, date)
  const hasFlash = flashbacks.entries.length + flashbacks.memories.length > 0

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ── Daily log ─────────────────────────────────────────── */}
      <div className="space-y-4 lg:col-span-2">
        <Card
          title={prettyDay(date)}
          subtitle={date === todayISO() ? 'Today' : undefined}
          right={
            <div className="flex gap-1">
              <Button onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">←</Button>
              <Button onClick={() => setDate(todayISO())}>Today</Button>
              <Button onClick={() => setDate(addDays(date, 1))} aria-label="Next day">→</Button>
            </div>
          }
        >
          <div className="mb-3">
            <QuickAdd date={date} />
          </div>
          {dayEntries.length === 0 ? (
            <Empty>No entries yet. Add a task, event, or note above.</Empty>
          ) : (
            <ul>
              {dayEntries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
          )}
        </Card>

        <Card title="Gratitude" subtitle="One thing you're grateful for today">
          <Input
            value={gratitude}
            onChange={(e) => setGratitude(date, e.target.value)}
            placeholder="Today I'm grateful for…"
          />
        </Card>

        <Card title="Daily memory" subtitle="One line to remember this day by">
          <Input
            value={memory}
            onChange={(e) => setMemory(date, { text: e.target.value })}
            placeholder="A single memorable moment…"
          />
          <div className="mt-3">
            <ImageUpload
              value={memoryRec?.photo}
              onChange={(photo) => setMemory(date, { photo })}
              label="Add a photo of the day"
            />
          </div>
        </Card>
      </div>

      {/* ── Wellbeing + flashbacks ────────────────────────────── */}
      <div className="space-y-4">
        <Card title="Wellbeing" subtitle="Rate today 0–10">
          <div className="space-y-4">
            <Slider label="Mood" value={metric?.mood} onChange={(v) => setMetric(date, { mood: v })} color="green" hint="0 low · 10 great" />
            <Slider label="Stress" value={metric?.stress} onChange={(v) => setMetric(date, { stress: v })} color="red" hint="0 calm · 10 high" />
            <Slider label="Sleep (hrs)" value={metric?.sleep} onChange={(v) => setMetric(date, { sleep: v })} color="blue" />
          </div>
          <div className="mt-4 border-t border-surface0 pt-3">
            <p className="mb-2 text-sm text-subtext1">Broke fast with</p>
            <div className="flex gap-2">
              <Button
                variant={metric?.fastBreak === 'food' ? 'primary' : 'ghost'}
                onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'food' ? undefined : 'food' })}
              >
                ● Food
              </Button>
              <Button
                variant={metric?.fastBreak === 'drink' ? 'primary' : 'ghost'}
                onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'drink' ? undefined : 'drink' })}
              >
                ○ Drink
              </Button>
            </div>
          </div>
        </Card>

        {hasFlash && (
          <Card title="On this day" subtitle="From earlier in your journal">
            <ul className="space-y-2 text-sm">
              {flashbacks.memories.map((m) => (
                <li key={m.date} className="text-subtext1">
                  <span className="text-overlay0">{m.date}</span> — ▲ {m.text}
                </li>
              ))}
              {flashbacks.entries.slice(0, 5).map((e) => (
                <li key={e.id} className="text-subtext1">
                  <span className="text-overlay0">{e.date}</span> — {e.text}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
