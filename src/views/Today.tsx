import { Utensils, CupSoda } from 'lucide-react'
import { useJournal } from '../store'
import { addDays, prettyDay, todayISO } from '../lib/date'
import { Button, Card, Empty, Input, Slider } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { QuickAdd } from '../components/QuickAdd'
import { EntryRow } from '../components/EntryRow'
import { ImageUpload } from '../components/ImageUpload'
import { PenaltyCard } from '../components/PenaltyCard'
import { StickerBar } from '../components/StickerBar'
import { onThisDay } from '../lib/stats'
import { promptForDay } from '../lib/prompts'

export function Today() {
  const { data, setMetric, setGratitude, setMemory, migrateEntry } = useJournal()
  const { day: date } = useCursor()

  const dayEntries = data.entries.filter((e) => e.date === date && !e.collection)
  const doneCount = dayEntries.filter((e) => e.type === 'task' && e.status === 'done').length
  const taskCount = dayEntries.filter((e) => e.type === 'task' && e.status !== 'dropped').length
  // Yesterday's unfinished tasks, offered to carry forward onto this day.
  const carryover = data.entries.filter(
    (e) => e.date === addDays(date, -1) && e.type === 'task' && e.status === 'open' && !e.collection,
  )
  const metric = data.metrics.find((m) => m.date === date)
  const gratitude = data.gratitude.find((g) => g.date === date)?.text ?? ''
  const memoryRec = data.memories.find((m) => m.date === date)
  const memory = memoryRec?.text ?? ''
  const flashbacks = onThisDay(data, date)
  const hasFlash = flashbacks.entries.length + flashbacks.memories.length > 0

  return (
    <Page
      aside={
        <>
          <Card title="Wellbeing" subtitle="Rate today 0–10">
            <div className="space-y-4">
              <Slider label="Mood" value={metric?.mood} onChange={(v) => setMetric(date, { mood: v })} color="green" hint="0 low · 10 great" />
              <Slider label="Stress" value={metric?.stress} onChange={(v) => setMetric(date, { stress: v })} color="red" hint="0 calm · 10 high" />
              <Slider label="Sleep (hrs)" value={metric?.sleep} onChange={(v) => setMetric(date, { sleep: v })} color="blue" />
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-sm text-subtext1">Broke fast with</p>
              <div className="flex gap-2">
                <Button
                  variant={metric?.fastBreak === 'food' ? 'primary' : 'ghost'}
                  onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'food' ? undefined : 'food' })}
                  className="inline-flex items-center gap-1.5"
                >
                  <Utensils size={14} /> Food
                </Button>
                <Button
                  variant={metric?.fastBreak === 'drink' ? 'primary' : 'ghost'}
                  onClick={() => setMetric(date, { fastBreak: metric?.fastBreak === 'drink' ? undefined : 'drink' })}
                  className="inline-flex items-center gap-1.5"
                >
                  <CupSoda size={14} /> Drink
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
        </>
      }
    >
      {/* ── Penalty for yesterday's skips (only when relevant) ──── */}
      {date === todayISO() && <PenaltyCard />}

      {/* ── Daily log (primary, above the fold) ─────────────────── */}
      <Card
        title={prettyDay(date)}
        subtitle={
          <span className="flex items-center gap-2">
            {date === todayISO() ? 'Today' : ''}
            {metric?.weather && (
              <span title={metric.weather.label}>
                {metric.weather.icon} {metric.weather.tempC}°C
              </span>
            )}
          </span>
        }
      >
        <div className="mb-3">
          <QuickAdd date={date} />
        </div>
        {carryover.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <span className="text-subtext1">{carryover.length} unfinished task{carryover.length === 1 ? '' : 's'} from yesterday</span>
            <Button onClick={() => carryover.forEach((e) => migrateEntry(e.id, date))}>Carry forward</Button>
          </div>
        )}
        {dayEntries.length === 0 ? (
          <Empty>No entries yet. Add a task, event, or note above.</Empty>
        ) : (
          <>
            <ul>
              {dayEntries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
            {taskCount > 0 && (
              <p className="mt-2 text-right text-xs text-overlay0">{doneCount}/{taskCount} tasks done</p>
            )}
          </>
        )}
      </Card>

      {/* ── Secondary cards in a balanced grid (no tall scroll) ─── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card title="Gratitude" subtitle="One thing you're grateful for today">
          <Input
            value={gratitude}
            onChange={(e) => setGratitude(date, e.target.value)}
            placeholder="Today I'm grateful for…"
          />
        </Card>

        {data.settings.reflectionPrompts && (
          <Card title="Reflection" subtitle={promptForDay(date)}>
            <textarea
              key={`reflect-${date}`}
              defaultValue=""
              placeholder="Write a few honest lines…"
              onBlur={(e) =>
                e.target.value.trim() &&
                setMemory(date, { text: `${memory ? memory + ' — ' : ''}${e.target.value.trim()}` })
              }
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
            />
            <p className="mt-1 text-xs text-overlay0">Saved into today's memory on blur.</p>
          </Card>
        )}

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
              className={memoryRec?.photo ? 'taped' : ''}
            />
          </div>
        </Card>

        <Card title="Stickers" subtitle="Decorate the day">
          <StickerBar date={date} />
        </Card>
      </div>
    </Page>
  )
}
