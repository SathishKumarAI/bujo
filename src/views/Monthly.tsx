import { useState } from 'react'
import { useJournal } from '../store'
import { monthDays, prettyMonth, todayISO, weekColumn, weekdayLabels } from '../lib/date'
import { Button, Card, Input, Textarea } from '../components/ui'
import { Page, useCursor } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { ImageUpload } from '../components/ImageUpload'
import { cat } from '../lib/colors'
import { bulletTypeBreakdown, entriesPerDay, journalingStreak, parseTags, taskCompletion, weekdayActivity } from '../lib/bullets'
import { habitDoneOn } from '../lib/stats'
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
      alert('Could not get location/weather · permission denied or offline.')
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

  // Habit progress for a day: done / scheduled, using the shared habitDoneOn
  // helper so numeric (count/timer/rating) habits — which log to habitValues,
  // not habitLog — count toward completion and can reach 100% (BUJO-207).
  function habitProgress(d: string): { done: number; total: number } {
    const dow = new Date(d + 'T00:00').getDay()
    const scheduled = data.habits.filter(
      (h) => !h.archived && d >= h.startedOn && (!h.activeDays?.length || h.activeDays.includes(dow)),
    )
    const done = scheduled.filter((h) => habitDoneOn(data, h, d)).length
    return { done, total: scheduled.length }
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

  // ── Month pulse: per-day entry counts (sparkline), bullet-type mix, completion ──
  const perDay = entriesPerDay(monthEntries, days[0], days[days.length - 1])
  const maxPerDay = Math.max(1, ...perDay.map((p) => p.count))
  const mix = bulletTypeBreakdown(monthEntries)
  const completion = taskCompletion(monthEntries)
  // Logging rhythm by weekday (this month) + all-time journaling streak.
  const weekdays = weekdayActivity(monthEntries)
  const maxWeekday = Math.max(1, ...weekdays.map((w) => w.count))
  const busiestWeekday = weekdays.reduce((a, b) => (b.count > a.count ? b : a))
  const streak = journalingStreak(data.entries, today)
  const TYPE_META = [
    { key: 'task' as const, label: 'tasks', glyph: '·', color: 'green', n: mix.task },
    { key: 'event' as const, label: 'events', glyph: '○', color: 'blue', n: mix.event },
    { key: 'note' as const, label: 'notes', glyph: '–', color: 'mauve', n: mix.note },
  ]

  return (
    <Page>
      {/* Compact "this month" summary · a single thin bar. */}
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
                  {(() => {
                    const { done, total } = habitProgress(d)
                    if (total === 0 || d > today) return null
                    return (
                      <div className="absolute right-1.5 bottom-1.5 left-1.5 h-1 overflow-hidden rounded-full bg-surface0" title={`${done}/${total} habits`}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (done / total) * 100)}%`, background: cat('green') }} />
                      </div>
                    )
                  })()}
                </button>
              )
            })}
          </div>
        </Card>

      {/* Month pulse · entry rhythm, bullet-type mix, task completion */}
      {monthEntries.length > 0 && (
        <Card title="Month pulse" subtitle="The shape of this month — when you logged, what you logged, what got done"
          help="A read-only snapshot of the current month. The sparkline is entries per day (taller = busier). The mix is your task/event/note balance, and the bar is the share of this month's tasks you've completed.">
          <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
            {/* Entries-per-day sparkline */}
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-overlay0">
                <span>Entries per day</span>
                <span>peak <b style={{ color: cat('mauve') }}>{maxPerDay}</b></span>
              </div>
              <div className="flex h-16 items-end gap-px" role="img" aria-label={`Entries per day across ${prettyMonth(ym)}: peak ${maxPerDay}`}>
                {perDay.map((p) => (
                  <div
                    key={p.date}
                    className="flex-1 rounded-t-sm"
                    title={`${p.date}: ${p.count} entr${p.count === 1 ? 'y' : 'ies'}`}
                    style={{
                      height: `${Math.max(p.count ? 8 : 2, (p.count / maxPerDay) * 100)}%`,
                      background: p.date === today ? cat('mauve') : p.count ? cat('blue') : cat('surface0'),
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Bullet-type mix + completion */}
            <div className="space-y-3">
              <div>
                <div className="mb-1 text-xs text-overlay0">Bullet mix</div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {TYPE_META.map((t) => (
                    <span key={t.key} className="inline-flex items-baseline gap-1">
                      <span style={{ color: cat(t.color) }}>{t.glyph}</span>
                      <b style={{ color: cat(t.color) }}>{t.n}</b>
                      <span className="text-overlay0">{t.label}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-baseline justify-between text-xs text-overlay0">
                  <span>Tasks done</span>
                  <span><b style={{ color: cat('green') }}>{completion.done}/{completion.total}</b>{completion.total > 0 && ` · ${Math.round(completion.rate * 100)}%`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface0">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(completion.rate * 100)}%`, background: cat('green') }} />
                </div>
              </div>
            </div>
          </div>

          {/* Logging rhythm by weekday + journaling streak */}
          <div className="mt-5 grid gap-5 border-t border-surface0 pt-4 sm:grid-cols-[2fr_1fr]">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between text-xs text-overlay0">
                <span>By weekday</span>
                <span>busiest <b style={{ color: cat('sapphire') }}>{busiestWeekday.count > 0 ? busiestWeekday.label : '—'}</b></span>
              </div>
              <div className="flex items-end gap-1.5" role="img" aria-label={`Entries by weekday this month; busiest is ${busiestWeekday.label}`}>
                {weekdays.map((w) => (
                  <div key={w.weekday} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-12 w-full items-end">
                      <div
                        className="w-full rounded-t-sm"
                        title={`${w.label}: ${w.count} entr${w.count === 1 ? 'y' : 'ies'}`}
                        style={{
                          height: `${Math.max(w.count ? 8 : 2, (w.count / maxWeekday) * 100)}%`,
                          background: w.count ? cat(w.weekday === 0 || w.weekday === 6 ? 'peach' : 'sapphire') : cat('surface0'),
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-overlay0">{w.label[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              <div>
                <div className="text-xs text-overlay0">Current streak</div>
                <div className="text-lg font-semibold" style={{ color: cat(streak.current > 0 ? 'green' : 'overlay0') }}>
                  {streak.current} day{streak.current === 1 ? '' : 's'}
                </div>
              </div>
              <div>
                <div className="text-xs text-overlay0">Longest streak</div>
                <div className="text-lg font-semibold" style={{ color: cat('mauve') }}>
                  {streak.longest} day{streak.longest === 1 ? '' : 's'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Location · Goals · Photo · 3 across, below the calendar */}
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

