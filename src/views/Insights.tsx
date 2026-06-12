import { useState } from 'react'
import { FileText, Smile, Dumbbell, Image as ImageIcon, Flame, Cake, BookOpen, type LucideIcon } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { cat } from '../lib/colors'
import { currentStreak, longestStreak, search, taskCompletion } from '../lib/stats'
import { insights } from '../lib/correlations'
import { CountUp, Ring } from '../components/Counter'
import { useNav } from '../components/shell/nav'
import { useCursor } from '../components/shell/cursor'
import { prettyDay, prettyMonth } from '../lib/date'
import { TagManager } from '../components/TagManager'
import { WeeklyReview } from '../components/WeeklyReview'

export function Insights() {
  const { data } = useJournal()
  const nav = useNav()
  const { setDay, setMonth } = useCursor()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const streak = currentStreak(data)
  const best = longestStreak(data)
  const tasks = taskCompletion(data)
  const allResults = search(data, q)
  const kinds = ['all', ...new Set(allResults.map((r) => r.kind))]
  const results = kind === 'all' ? allResults : allResults.filter((r) => r.kind === kind)
  const found = insights(data)

  // Year-in-review aggregates.
  const moods = data.metrics.map((m) => m.mood).filter((v): v is number => v != null)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null
  const workouts = data.workouts.length
  const photos = data.memories.filter((m) => m.photo).length + data.monthly.filter((m) => m.photo).length

  // Personal records — bests across domains.
  const bestMood = [...data.metrics].filter((m) => m.mood != null).sort((a, b) => (b.mood! - a.mood!))[0]
  const bigWorkout = [...data.workouts].filter((w) => w.durationMin).sort((a, b) => (b.durationMin! - a.durationMin!))[0]
  const pickBest = [...(data.pickleball ?? [])].sort((a, b) => b.gamesWon - a.gamesWon)[0]
  const entriesByDay = data.entries.reduce<Record<string, number>>((m, e) => { if (e.date) m[e.date] = (m[e.date] ?? 0) + 1; return m }, {})
  const busiest = Object.entries(entriesByDay).sort((a, b) => b[1] - a[1])[0]
  const records: { label: string; value: string }[] = []
  if (best > 0) records.push({ label: 'Longest streak', value: `${best} days` })
  if (bestMood?.mood != null) records.push({ label: 'Best mood', value: `${bestMood.mood}/10 · ${prettyDay(bestMood.date)}` })
  if (bigWorkout) records.push({ label: 'Longest workout', value: `${bigWorkout.durationMin}m · ${bigWorkout.activity}` })
  if (pickBest) records.push({ label: 'Best pickleball', value: `${pickBest.gamesWon} wins · ${prettyDay(pickBest.date)}` })
  if (busiest) records.push({ label: 'Busiest day', value: `${busiest[1]} entries · ${prettyDay(busiest[0])}` })

  // Index: months that have any data + collections.
  const months = [...new Set([
    ...data.entries.filter((e) => e.date).map((e) => e.date.slice(0, 7)),
    ...data.monthly.map((m) => m.ym),
    ...data.metrics.map((m) => m.date.slice(0, 7)),
  ])].sort().reverse()

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="grid grid-cols-2 items-start gap-3 sm:gap-5 lg:grid-cols-4">
        <Big label="Current streak" value={streak} suffix="d" color="peach" onClick={() => nav('trackers')} />
        <Big label="Longest streak" value={best} suffix="d" color="mauve" onClick={() => nav('trackers')} />
        <Big label="Tasks done" value={tasks.pct} suffix="%" color="green" sub={`${tasks.done}/${tasks.total}`} ring max={100} onClick={() => nav('today')} />
        <Big label="Entries" value={data.entries.length} color="sky" onClick={() => nav('today')} />
      </div>

      {/* Actions first: the weekly ritual + search sit above the read-only analytics. */}
      <WeeklyReview />

      {found.length > 0 && (
        <Card title="Patterns" subtitle="What your data is telling you">
          <ul className="space-y-2">
            {found.map((ins, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: cat('surface0'), color: ins.strength === 'strong' ? cat('mauve') : cat('subtext0') }}>
                  r={ins.r} · {ins.strength}
                </span>
                <span className="text-subtext1">{ins.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid items-start gap-5 md:grid-cols-2">
        <Card title="Year in review" subtitle="Your journal so far">
          <ul className="space-y-1.5 text-sm text-subtext1">
            <ReviewRow icon={FileText} color="sky" label="entries logged" value={data.entries.length} />
            <ReviewRow icon={Smile} color="green" label={`average mood${avgMood != null ? ' / 10' : ''}`} value={avgMood ?? '—'} />
            <ReviewRow icon={Dumbbell} color="teal" label="workouts" value={workouts} />
            <ReviewRow icon={ImageIcon} color="mauve" label="photos kept" value={photos} />
            <ReviewRow icon={Flame} color="peach" label="day longest streak" value={best} />
            <ReviewRow icon={Cake} color="pink" label="birthdays tracked" value={data.birthdays.length} />
          </ul>
        </Card>

        <Card title="Index" subtitle="Every month with entries">
          {months.length === 0 ? (
            <Empty>No months logged yet.</Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-1 text-sm">
              {months.map((ym) => (
                <li key={ym}>
                  <button onClick={() => { setMonth(ym); nav('monthly') }} className="inline-flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-subtext1 hover:bg-surface0 hover:text-text">
                    <BookOpen size={14} style={{ color: cat('overlay1') }} /> {prettyMonth(ym)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {records.length > 0 && (
        <Card title="Personal records" subtitle="Your bests so far">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {records.map((r) => (
              <div key={r.label} className="rounded-xl border border-surface0 bg-base p-3">
                <p className="text-sm font-semibold text-text">{r.value}</p>
                <p className="text-xs text-overlay0">{r.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Search" subtitle="Find anything across your journal">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries, memories, gratitude, workouts…" autoFocus />
        {q && kinds.length > 2 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className="rounded-full px-2.5 py-0.5 text-xs capitalize"
                style={{ background: kind === k ? cat('mauve') : cat('surface0'), color: kind === k ? cat('crust') : cat('subtext1') }}
              >
                {k}{k !== 'all' ? ` (${allResults.filter((r) => r.kind === k).length})` : ''}
              </button>
            ))}
          </div>
        )}
        {q && (
          <div className="mt-3">
            {results.length === 0 ? (
              <Empty>No matches for “{q}”.</Empty>
            ) : (
              <ul className="space-y-1 text-sm">
                {results.slice(0, 50).map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => { if (r.date) { setDay(r.date); nav('today') } }}
                      disabled={!r.date}
                      className="flex w-full gap-2 rounded px-2 py-1 text-left hover:bg-surface0 disabled:cursor-default"
                    >
                      <span className="w-24 shrink-0 text-overlay0">{r.date ? prettyDay(r.date) : '—'}</span>
                      <span className="w-16 shrink-0 text-xs" style={{ color: cat('sapphire') }}>{r.kind}</span>
                      <span className="text-subtext1">{r.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <TagManager />
    </div>
  )
}

function ReviewRow({ icon: Icon, color, label, value }: { icon: LucideIcon; color: string; label: string; value: number | string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon size={15} style={{ color: cat(color) }} />
      <strong className="text-text">{value}</strong>
      <span>{label}</span>
    </li>
  )
}

function Big({ label, value, color, sub, suffix = '', ring, max = 100, onClick }: { label: string; value: number; color: string; sub?: string; suffix?: string; ring?: boolean; max?: number; onClick?: () => void }) {
  return (
    <Card className={`flex flex-col items-center text-center ${onClick ? 'cursor-pointer hover:border-mauve' : ''}`} onClick={onClick}>
      {ring ? (
        <Ring value={value} max={max} color={color} suffix={suffix} />
      ) : (
        <div className="text-4xl font-extrabold" style={{ color: cat(color) }}>
          <CountUp value={value} suffix={suffix} />
        </div>
      )}
      <div className="mt-1 text-sm text-subtext0">{label}</div>
      {sub && <div className="text-xs text-overlay0">{sub}</div>}
    </Card>
  )
}
