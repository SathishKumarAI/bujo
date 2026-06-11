import { useState } from 'react'
import { FileText, Smile, Dumbbell, Image as ImageIcon, Flame, Cake, BookOpen, type LucideIcon } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { cat } from '../lib/colors'
import { currentStreak, longestStreak, search, taskCompletion } from '../lib/stats'
import { insights } from '../lib/correlations'
import { CountUp, Ring } from '../components/Counter'
import { prettyDay, prettyMonth } from '../lib/date'

export function Insights() {
  const { data } = useJournal()
  const [q, setQ] = useState('')
  const streak = currentStreak(data)
  const best = longestStreak(data)
  const tasks = taskCompletion(data)
  const results = search(data, q)
  const found = insights(data)

  // Year-in-review aggregates.
  const moods = data.metrics.map((m) => m.mood).filter((v): v is number => v != null)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null
  const workouts = data.workouts.length
  const photos = data.memories.filter((m) => m.photo).length + data.monthly.filter((m) => m.photo).length

  // Index: months that have any data + collections.
  const months = [...new Set([
    ...data.entries.filter((e) => e.date).map((e) => e.date.slice(0, 7)),
    ...data.monthly.map((m) => m.ym),
    ...data.metrics.map((m) => m.date.slice(0, 7)),
  ])].sort().reverse()

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Big label="Current streak" value={streak} suffix="d" color="peach" />
        <Big label="Longest streak" value={best} suffix="d" color="mauve" />
        <Big label="Tasks done" value={tasks.pct} suffix="%" color="green" sub={`${tasks.done}/${tasks.total}`} ring max={100} />
        <Big label="Entries" value={data.entries.length} color="sky" />
      </div>

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
                <li key={ym} className="inline-flex items-center gap-1.5 text-subtext1">
                  <BookOpen size={14} style={{ color: cat('overlay1') }} /> {prettyMonth(ym)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Search" subtitle="Find anything across your journal">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries, memories, gratitude, workouts…" autoFocus />
        {q && (
          <div className="mt-3">
            {results.length === 0 ? (
              <Empty>No matches for “{q}”.</Empty>
            ) : (
              <ul className="space-y-1 text-sm">
                {results.slice(0, 50).map((r, i) => (
                  <li key={i} className="flex gap-2 rounded px-2 py-1 hover:bg-surface0">
                    <span className="w-24 shrink-0 text-overlay0">{r.date ? prettyDay(r.date) : '—'}</span>
                    <span className="w-16 shrink-0 text-xs" style={{ color: cat('sapphire') }}>{r.kind}</span>
                    <span className="text-subtext1">{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>
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

function Big({ label, value, color, sub, suffix = '', ring, max = 100 }: { label: string; value: number; color: string; sub?: string; suffix?: string; ring?: boolean; max?: number }) {
  return (
    <Card className="flex flex-col items-center text-center">
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
