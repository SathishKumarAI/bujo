import { Card, Empty } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
import { MUSCLE_SET_LANDMARK, type MuscleSetCount } from '../../lib/fitness'

/**
 * Weekly hard-sets per muscle vs the 10–20 hypertrophy landmark. Each muscle is
 * a horizontal bar coloured by zone (under / in-range / over), so imbalances and
 * under-trained groups jump out at a glance. Read-only — derived from this
 * week's logged working sets via weeklySetsPerMuscle.
 *
 * **Two columns once there is room, because one was the stretchiest thing on
 * the page.** Eleven muscles in a single list gave each bar the card's whole
 * width — measured at 606px on Gym — to encode a value of 1 to 5 against a
 * scale of 20. A "5" painted 151px and left 455px empty, eleven times over.
 * Split, each track is about 230px and the block is half as tall, which is
 * what makes the *comparison* between muscles readable rather than the
 * individual bars big.
 *
 * `@container`, not a viewport breakpoint. This card sits in a `CardGrid`
 * cell whose width is decided by the page split, so the window's width is the
 * wrong question — the same mistake `MasonryGrid` documents. At ~350px in a
 * two-up grid it stays one column; at full row it splits.
 *
 * Each half is its own `<ul>` with its own subgrid, so labels align within a
 * column. Aligning them across both halves would mean one subgrid spanning
 * the split, which drags every label to the width of the longest name in
 * either column — "Hamstrings" would set the gutter for "Lats".
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
    <Card band title="Muscle volume balance" subtitle="Hard sets per muscle this week, target 10–20" defer>
      {named.length === 0 ? (
        <Empty>Log some working sets this week to see your per-muscle volume.</Empty>
      ) : (
        <div className="@container">
        <div className="grid gap-x-6 gap-y-2 @lg:grid-cols-2">
        {/* Halved, not interleaved: reading down one column then the next
            keeps the descending set-count order the data arrives in. */}
        {[named.slice(0, Math.ceil(named.length / 2)), named.slice(Math.ceil(named.length / 2))]
          .filter((half) => half.length > 0)
          .map((half, i) => (
        <ul key={i} className="grid grid-cols-[auto_1fr_auto] content-start gap-y-2">
          {half.map((c) => {
            const color = zone(c.sets)
            return (
              <li key={c.muscle} className="col-span-3 grid grid-cols-subgrid items-center gap-x-2 text-body">
                <button
                  onClick={() => setFocusEx(c.name)}
                  className="max-w-48 truncate text-left text-fg-1 hover:text-fg-1"
                  title={`Focus the muscle map on ${c.name}`}
                >
                  {c.name}
                </button>
                <div className="relative h-4 overflow-hidden rounded-pill bg-ink-2">
                  {/* landmark band (10–20 sets) shaded behind the bar */}
                  <div className="absolute inset-y-0" style={{ left: `${(min / scaleMax) * 100}%`, width: `${((max - min) / scaleMax) * 100}%`, background: cat('green') + '22' }} />
                  <div className="absolute inset-y-0 left-0 rounded-pill" style={{ width: `${Math.min(100, (c.sets / scaleMax) * 100)}%`, background: cat(color) }} />
                </div>
                <span className="min-w-7 text-right font-medium tabular-nums" style={{ color: onRaised(color) }}>{c.sets}</span>
              </li>
            )
          })}
        </ul>
        ))}
        </div>
        </div>
      )}
      {named.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-micro text-fg-2">
          <span style={{ color: onRaised('peach') }}>● {zoneLabel(0)}</span>
          <span style={{ color: onRaised('green') }}>● {zoneLabel(min)}</span>
          <span style={{ color: onRaised('red') }}>● {zoneLabel(max + 1)}</span>
        </p>
      )}
    </Card>
  )
}
