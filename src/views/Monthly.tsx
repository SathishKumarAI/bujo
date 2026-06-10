import { useState } from 'react'
import { useJournal } from '../store'
import { fromISODay, monthDays, prettyMonth, todayISO, WEEKDAYS, ymOf } from '../lib/date'
import { Button, Card, Input, Textarea } from '../components/ui'
import { ImageUpload } from '../components/ImageUpload'
import { cat } from '../lib/colors'

export function Monthly() {
  const { data, setMonthly } = useJournal()
  const [ym, setYm] = useState(ymOf(todayISO()))
  const meta = data.monthly.find((m) => m.ym === ym)
  const days = monthDays(ym)
  const firstWeekday = fromISODay(days[0]).getDay()
  const today = todayISO()

  function shift(delta: number) {
    const [y, mo] = ym.split('-').map(Number)
    setYm(ymOf(new Date(y, mo - 1 + delta, 1)))
  }

  // Map each day → its entries (events shown on the calendar).
  function dayEvents(d: string) {
    return data.entries.filter((e) => e.date === d)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card
          title={prettyMonth(ym)}
          subtitle="Monthly calendar — events show as dots"
          right={
            <div className="flex gap-1">
              <Button onClick={() => shift(-1)} aria-label="Previous month">←</Button>
              <Button onClick={() => setYm(ymOf(today))}>This month</Button>
              <Button onClick={() => shift(1)} aria-label="Next month">→</Button>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-overlay0">
            {WEEKDAYS.map((w) => <div key={w} className="pb-1">{w}</div>)}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad${i}`} />)}
            {days.map((d) => {
              const events = dayEvents(d)
              const isToday = d === today
              return (
                <div
                  key={d}
                  className="aspect-square rounded-lg border p-1 text-left"
                  style={{
                    borderColor: isToday ? cat('mauve') : cat('surface0'),
                    background: isToday ? cat('surface0') : 'transparent',
                  }}
                >
                  <div className={`text-[11px] ${isToday ? 'font-bold text-mauve' : 'text-subtext1'}`}>
                    {Number(d.slice(8))}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-0.5">
                    {events.slice(0, 4).map((e) => (
                      <span
                        key={e.id}
                        title={e.text}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: e.important ? cat('yellow') : e.type === 'event' ? cat('blue') : cat('green') }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Location" subtitle="Where are you this month?">
          <Input
            value={meta?.location ?? ''}
            onChange={(e) => setMonthly(ym, { location: e.target.value })}
            placeholder="e.g. Moab, Utah 🏜️"
          />
        </Card>
        <Card title="Goals" subtitle="What matters this month">
          <Textarea
            rows={5}
            value={meta?.goals ?? ''}
            onChange={(e) => setMonthly(ym, { goals: e.target.value })}
            placeholder={'• Finish the trail map\n• Call mom weekly\n• Read 2 books'}
          />
        </Card>
        <Card title="Photo of the month" subtitle="Illustrate the month with one image">
          <ImageUpload
            value={meta?.photo}
            onChange={(photo) => setMonthly(ym, { photo })}
            label="Upload photo of the month"
            className="mb-3"
          />
          <Input
            value={meta?.photoCaption ?? ''}
            onChange={(e) => setMonthly(ym, { photoCaption: e.target.value })}
            placeholder="Sunrise over the canyon…"
          />
        </Card>
      </div>
    </div>
  )
}
