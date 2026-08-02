import { Card, Empty } from '../ui'
import { cat } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
import { MUSCLE_SET_LANDMARK, type MuscleSetCount } from '../../lib/fitness'

/**
 * Weekly hard-sets per muscle vs the 10–20 hypertrophy landmark. Each muscle is
 * a horizontal bar coloured by zone (under / in-range / over), so imbalances and
 * under-trained groups jump out at a glance. Read-only — derived from this
 * week's logged working sets via weeklySetsPerMuscle.
 */
export function MuscleVolumeBalance({ counts, setFocusEx }: { counts: MuscleSetCount[]; setFocusEx: (e: string | null) => void }) {
  const { min, max } = MUSCLE_SET_LANDMARK
  const named = counts
    .map((c) => ({ ...c, name: muscleNames([c.muscle])[0] }))
    .filter((c) => c.name) // skip ids without a display name
  const scaleMax = Math.max(max, ...named.map((c) => c.sets), 1)
  const zone = (sets: number) => (sets < min ? 'peach' : sets > max ? 'red' : 'green')
  const zoneLabel = (sets: number) => (sets < min ? 'below 10' : sets > max ? 'over 20' : 'in range')
  return (
    <Card title="Muscle volume balance" subtitle="Hard sets per muscle this week, target 10–20" defer>
      {named.length === 0 ? (
        <Empty>Log some working sets this week to see your per-muscle volume.</Empty>
      ) : (
        <ul className="space-y-2">
          {named.map((c) => {
            const color = zone(c.sets)
            return (
              <li key={c.muscle} className="flex items-center gap-2 text-body">
                <button
                  onClick={() => setFocusEx(c.name)}
                  className="w-20 shrink-0 truncate text-left text-fg-1 hover:text-fg-1"
                  title={`Focus the muscle map on ${c.name}`}
                >
                  {c.name}
                </button>
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-ink-2">
                  {/* landmark band (10–20 sets) shaded behind the bar */}
                  <div className="absolute inset-y-0" style={{ left: `${(min / scaleMax) * 100}%`, width: `${((max - min) / scaleMax) * 100}%`, background: cat('green') + '22' }} />
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (c.sets / scaleMax) * 100)}%`, background: cat(color) }} />
                </div>
                <span className="w-7 shrink-0 text-right font-medium" style={{ color: cat(color) }}>{c.sets}</span>
              </li>
            )
          })}
        </ul>
      )}
      {named.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-micro text-fg-2">
          <span style={{ color: cat('peach') }}>● {zoneLabel(0)}</span>
          <span style={{ color: cat('green') }}>● {zoneLabel(min)}</span>
          <span style={{ color: cat('red') }}>● {zoneLabel(max + 1)}</span>
        </p>
      )}
    </Card>
  )
}
