import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input } from '../components/ui'
import { cat } from '../lib/colors'
import { currentStreak, longestStreak, search, taskCompletion } from '../lib/stats'
import { prettyDay } from '../lib/date'

export function Insights() {
  const { data } = useJournal()
  const [q, setQ] = useState('')
  const streak = currentStreak(data)
  const best = longestStreak(data)
  const tasks = taskCompletion(data)
  const results = search(data, q)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Big label="Current streak" value={`${streak}d`} color="peach" />
        <Big label="Longest streak" value={`${best}d`} color="mauve" />
        <Big label="Tasks done" value={`${tasks.pct}%`} color="green" sub={`${tasks.done}/${tasks.total}`} />
        <Big label="Entries" value={`${data.entries.length}`} color="sky" />
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

function Big({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <Card className="text-center">
      <div className="text-4xl font-extrabold" style={{ color: cat(color) }}>{value}</div>
      <div className="mt-1 text-sm text-subtext0">{label}</div>
      {sub && <div className="text-xs text-overlay0">{sub}</div>}
    </Card>
  )
}
