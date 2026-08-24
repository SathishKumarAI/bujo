import { Barbell, BookOpen, Cake, FileText, Flame, Image, Smiley } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Empty } from '../ui'
import { MasonryGrid } from '../shell/CardGrid'
import { useNav } from '../shell/nav'
import { useCursor } from '../shell/cursor'
import { cat } from '../../lib/colors'
import { labelOf } from '../../domain/activities'
import { longestStreak } from '../../lib/stats'
import { prettyDay, prettyMonth } from '../../lib/date'

/**
 * Year in review, the month index and personal records — Insights' "Lifetime"
 * drawer, moved to Stats under BUJO-281.
 *
 * It renders **open**, beside Achievements, rather than as a seventh fold.
 * Stats already had six, and the point of the move was to stop the cluster
 * keeping two cabinets of the same drawers; adding one here would have relocated
 * the problem rather than fixed it. All three are lifetime totals, which is the
 * subject Achievements already covers, so they read as one region.
 */
export function LifetimeCards() {
  const { data } = useJournal()
  const nav = useNav()
  const { setMonth } = useCursor()

  const best = longestStreak(data)
  const moods = data.metrics.map((m) => m.mood).filter((v): v is number => v != null)
  const avgMood = moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null
  const workouts = data.workouts.length
  const photos = data.memories.filter((m) => m.photo).length + data.monthly.filter((m) => m.photo).length

  // Bests across domains.
  const bestMood = [...data.metrics].filter((m) => m.mood != null).sort((a, b) => (b.mood! - a.mood!))[0]
  const bigWorkout = [...data.workouts].filter((w) => w.durationMin).sort((a, b) => (b.durationMin! - a.durationMin!))[0]
  const pickBest = [...(data.pickleball ?? [])].sort((a, b) => b.gamesWon - a.gamesWon)[0]
  const entriesByDay = data.entries.reduce<Record<string, number>>((m, e) => { if (e.date) m[e.date] = (m[e.date] ?? 0) + 1; return m }, {})
  const busiest = Object.entries(entriesByDay).sort((a, b) => b[1] - a[1])[0]
  const records: { label: string; value: string }[] = []
  if (best > 0) records.push({ label: 'Longest streak', value: `${best} days` })
  if (bestMood?.mood != null) records.push({ label: 'Best mood', value: `${bestMood.mood}/10 · ${prettyDay(bestMood.date)}` })
  if (bigWorkout) records.push({ label: 'Longest workout', value: `${bigWorkout.durationMin}m · ${labelOf(bigWorkout.activity)}` })
  if (pickBest) records.push({ label: 'Best pickleball', value: `${pickBest.gamesWon} wins · ${prettyDay(pickBest.date)}` })
  if (busiest) records.push({ label: 'Busiest day', value: `${busiest[1]} entries · ${prettyDay(busiest[0])}` })

  // Months that have any data.
  const months = [...new Set([
    ...data.entries.filter((e) => e.date).map((e) => e.date.slice(0, 7)),
    ...data.monthly.map((m) => m.ym),
    ...data.metrics.map((m) => m.date.slice(0, 7)),
  ])].sort().reverse()

  return (
    <>
      <MasonryGrid>
        <Card band title="Year in review" subtitle="Your journal so far">
          <ul className="space-y-1.5 text-body text-fg-1">
            <ReviewRow icon={FileText} color="sky" label="entries logged" value={data.entries.length} />
            <ReviewRow icon={Smiley} color="green" label={`average mood${avgMood != null ? ' / 10' : ''}`} value={avgMood ?? '—'} />
            <ReviewRow icon={Barbell} color="teal" label="workouts" value={workouts} />
            <ReviewRow icon={Image} color="mauve" label="photos kept" value={photos} />
            <ReviewRow icon={Flame} color="peach" label="day longest streak" value={best} />
            <ReviewRow icon={Cake} color="pink" label="birthdays tracked" value={data.birthdays.length} />
          </ul>
        </Card>

        <Card band title="Index" subtitle="Every month with entries">
          {months.length === 0 ? (
            <Empty>Log entries on a few days to fill in the index.</Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-1 text-body">
              {months.map((ym) => (
                <li key={ym}>
                  <button onClick={() => { setMonth(ym); nav('monthly') }} className="inline-flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-fg-1 hover:bg-ink-2 hover:text-fg-1">
                    <AppIcon as={BookOpen} size="sm" style={{ color: cat('overlay1') }} /> {prettyMonth(ym)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </MasonryGrid>

      {records.length > 0 && (
        <Card band title="Personal records" subtitle="Your bests so far">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {records.map((r) => (
              <div key={r.label} className="rounded-none border border-line bg-ink-0 p-3">
                <p className="text-body font-medium text-fg-1">{r.value}</p>
                <p className="text-label text-fg-2">{r.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

function ReviewRow({ icon: Icon, color, label, value }: { icon: IconGlyph; color: string; label: string; value: number | string }) {
  return (
    <li className="flex items-center gap-2">
      <AppIcon as={Icon} size="sm" style={{ color: cat(color) }} />
      <strong className="text-fg-1">{value}</strong>
      <span>{label}</span>
    </li>
  )
}
