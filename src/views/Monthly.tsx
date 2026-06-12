import { useState } from 'react'
import { useJournal } from '../store'
import { monthDays, todayISO, weekColumn, weekdayLabels } from '../lib/date'
import { Button, Card, Input, Textarea } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { ImageUpload } from '../components/ImageUpload'
import { cat } from '../lib/colors'
import { parseTags } from '../lib/bullets'
import { fetchWeather, getPosition, reverseGeocode } from '../lib/weather'

export function Monthly() {
  const { data, setMonthly, setWeather } = useJournal()
  const { month: ym, setDay } = useCursor()
  const nav = useNav()
  const [geoBusy, setGeoBusy] = useState(false)

  async function autoFill() {
    setGeoBusy(true)
    try {
      const pos = await getPosition()
      const [w, city] = await Promise.all([
        fetchWeather(pos.latitude, pos.longitude),
        reverseGeocode(pos.latitude, pos.longitude).catch(() => ''),
      ])
      setWeather(todayISO(), w)
      if (city) setMonthly(ym, { location: city })
    } catch {
      alert('Could not get location/weather — permission denied or offline.')
    } finally {
      setGeoBusy(false)
    }
  }
  const meta = data.monthly.find((m) => m.ym === ym)
  const days = monthDays(ym)
  const weekStart = data.settings.weekStart ?? 0
  const firstWeekday = weekColumn(days[0], weekStart)
  const today = todayISO()

  // Map each day → its entries (events shown on the calendar).
  function dayEvents(d: string) {
    return data.entries.filter((e) => e.date === d)
  }

  // ── This-month summary ──────────────────────────────────────────────
  const monthEntries = data.entries.filter((e) => e.date.startsWith(ym) && !e.collection)
  const tasks = monthEntries.filter((e) => e.type === 'task' && e.status !== 'dropped')
  const tasksDone = tasks.filter((e) => e.status === 'done').length
  const monthMetrics = data.metrics.filter((m) => m.date.startsWith(ym))
  const journaledDays = new Set([...monthEntries.map((e) => e.date), ...monthMetrics.map((m) => m.date)]).size
  const moods = monthMetrics.map((m) => m.mood).filter((v): v is number => v != null)
  const moodAvg = moods.length ? Math.round(moods.reduce((a, b) => a + b, 0) / moods.length) : null
  const tagCounts = monthEntries.reduce<Record<string, number>>((acc, e) => {
    for (const t of e.tags.length ? e.tags : parseTags(e.text)) acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <Page>
      <Card title="This month" subtitle="At a glance">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <Mini label="Entries" value={`${monthEntries.length}`} color="mauve" />
          <Mini label="Tasks done" value={`${tasksDone}/${tasks.length}`} color="green" />
          <Mini label="Days journaled" value={`${journaledDays}`} color="blue" />
          <Mini label="Avg mood" value={moodAvg == null ? '—' : `${moodAvg}/10`} color="peach" />
        </div>
        {topTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
            {topTags.map(([t, n]) => (
              <span key={t} className="rounded-full px-2 py-0.5 text-xs" style={{ background: cat('sapphire') + '22', color: cat('sapphire') }}>#{t} {n}</span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-overlay0">
            {weekdayLabels(weekStart).map((w) => <div key={w} className="pb-1">{w}</div>)}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`pad${i}`} />)}
            {days.map((d) => {
              const events = dayEvents(d)
              const isToday = d === today
              const mood = data.metrics.find((m) => m.date === d)?.mood
              const moodTint = mood == null ? undefined : `${cat(mood >= 7 ? 'green' : mood >= 4 ? 'yellow' : 'red')}22`
              return (
                <button
                  key={d}
                  onClick={() => { setDay(d); nav('today') }}
                  title={`Open ${d}`}
                  className="min-h-[5.5rem] rounded-lg border p-1.5 text-left transition-colors hover:border-mauve sm:min-h-24"
                  style={{
                    borderColor: isToday ? cat('mauve') : cat('surface0'),
                    background: isToday ? cat('surface0') : moodTint ?? 'transparent',
                  }}
                >
                  <div className={`text-sm ${isToday ? 'font-bold text-mauve' : 'text-subtext1'}`}>
                    {Number(d.slice(8))}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {events.slice(0, 6).map((e) => (
                      <span
                        key={e.id}
                        title={e.text}
                        className="h-2 w-2 rounded-full"
                        style={{ background: e.important ? cat('yellow') : e.type === 'event' ? cat('blue') : cat('green') }}
                      />
                    ))}
                  </div>
                  <div className="mt-0.5 text-sm leading-tight">
                    {(data.stickers[d] ?? []).slice(0, 4).join('')}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

      {/* Location + Goals side by side, below the calendar */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Location" subtitle="Where are you this month?">
          <Input
            value={meta?.location ?? ''}
            onChange={(e) => setMonthly(ym, { location: e.target.value })}
            placeholder="e.g. Moab, Utah 🏜️"
          />
          {data.settings.weatherEnabled && (
            <Button onClick={autoFill} className="mt-2 w-full">
              {geoBusy ? 'Locating…' : '📍 Auto-fill location & weather'}
            </Button>
          )}
        </Card>
        <Card title="Goals" subtitle="What matters this month">
          <Textarea
            rows={4}
            value={meta?.goals ?? ''}
            onChange={(e) => setMonthly(ym, { goals: e.target.value })}
            placeholder={'• Finish the trail map\n• Call mom weekly\n• Read 2 books'}
          />
        </Card>
      </div>

      {/* Photo of the month — bottom */}
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
    </Page>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-surface0 bg-background py-2">
      <div className="text-lg font-bold" style={{ color: cat(color) }}>{value}</div>
      <div className="text-[10px] text-overlay0">{label}</div>
    </div>
  )
}
