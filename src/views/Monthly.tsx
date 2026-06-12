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
  const totalHabits = data.habits.filter((h) => !h.archived).length
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
      {/* Compact "this month" summary — a single thin bar. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-xs text-subtext0">
        <span className="font-medium text-subtext1">This month</span>
        <span><b style={{ color: cat('mauve') }}>{monthEntries.length}</b> entries</span>
        <span><b style={{ color: cat('green') }}>{tasksDone}/{tasks.length}</b> tasks</span>
        <span><b style={{ color: cat('blue') }}>{journaledDays}</b> days</span>
        <span>mood <b style={{ color: cat('peach') }}>{moodAvg == null ? '—' : `${moodAvg}/10`}</b></span>
        {topTags.slice(0, 3).map(([t, n]) => <span key={t} style={{ color: cat('sapphire') }}>#{t} {n}</span>)}
      </div>

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
                  className="relative min-h-[5.5rem] rounded-lg border p-1.5 pb-3 text-left transition-colors hover:border-mauve sm:min-h-24"
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
                  {totalHabits > 0 && d <= today && (
                    <div className="absolute right-1.5 bottom-1.5 left-1.5 h-1 overflow-hidden rounded-full bg-surface0" title={`${(data.habitLog[d] ?? []).length}/${totalHabits} habits`}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((data.habitLog[d] ?? []).length / totalHabits) * 100)}%`, background: cat('green') }} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

      {/* Location · Goals · Photo — 3 across, below the calendar */}
      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card title="Location" subtitle="Where are you this month?">
          <Input
            value={meta?.location ?? ''}
            onChange={(e) => setMonthly(ym, { location: e.target.value })}
            placeholder="e.g. Moab, Utah 🏜️"
          />
          {data.settings.weatherEnabled && (
            <Button onClick={autoFill} className="mt-2 w-full">
              {geoBusy ? 'Locating…' : '📍 Auto-fill'}
            </Button>
          )}
        </Card>
        <Card title="Goals" subtitle="What matters this month">
          <Textarea
            rows={3}
            value={meta?.goals ?? ''}
            onChange={(e) => setMonthly(ym, { goals: e.target.value })}
            placeholder={'• Finish the trail map\n• Read 2 books'}
          />
        </Card>
        <Card title="Photo of the month" subtitle="One image">
          <ImageUpload
            value={meta?.photo}
            onChange={(photo) => setMonthly(ym, { photo })}
            label="Upload photo"
            className="mb-2"
          />
          <Input
            value={meta?.photoCaption ?? ''}
            onChange={(e) => setMonthly(ym, { photoCaption: e.target.value })}
            placeholder="Caption…"
          />
        </Card>
      </div>
    </Page>
  )
}

